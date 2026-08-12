import { randomUUID } from "node:crypto";
import postgres from "postgres";
import type {
  AppealProposalInput,
  ArgumentRecord,
  CreateArgumentInput,
  CreateProposalInput,
  InstitutionalResponseInput,
  ModerationCaseRecord,
  ModerationDecisionInput,
  ProposalRecord,
  ProposalStatus,
  ReviseProposalInput,
  WithdrawProposalInput,
} from "@kuvend/contracts";
import type { CivicStore, VoteRecord } from "./store.js";

const pseudonyms = ["Lisi i Qetë", "Ura e Hapur", "Drita e Mëngjesit", "Guri i Bardhë"];

export class PostgresCivicStore implements CivicStore {
  kind = "postgres" as const;
  private readonly sql: postgres.Sql;

  constructor(url: string) {
    this.sql = postgres(url, { max: 8, idle_timeout: 20 });
  }

  async initialize(): Promise<void> {
    await this.sql.unsafe(`
      create table if not exists proposals (
        id uuid primary key,
        title text not null,
        summary text not null,
        problem text not null,
        proposed_change text not null,
        scope text not null,
        location text,
        category text not null,
        evidence jsonb not null default '[]',
        pseudonym text not null,
        public_author_name text,
        author_capability_hash text,
        submission_nullifier text unique,
        status text not null,
        revision_number integer not null default 1,
        duplicate_of uuid,
        appeal_status text,
        created_at timestamptz not null default now()
      );
      create table if not exists voting_rounds (
        id uuid primary key,
        proposal_id uuid unique not null references proposals(id),
        opens_at timestamptz not null,
        closes_at timestamptz not null,
        seeded_turnout integer not null default 0,
        seeded_support integer not null default 0
      );
      create table if not exists arguments (
        id uuid primary key,
        proposal_id uuid not null references proposals(id),
        position text not null,
        body text not null,
        evidence jsonb not null default '[]',
        pseudonym text not null,
        public_author_name text,
        contribution_nullifier text unique,
        created_at timestamptz not null default now()
      );
      create table if not exists ballots (
        round_id uuid not null references voting_rounds(id),
        nullifier text not null,
        choice text not null,
        commitment text not null,
        received_day date not null default current_date,
        primary key (round_id, nullifier)
      );
      create table if not exists status_events (
        id uuid primary key,
        proposal_id uuid not null references proposals(id),
        status text not null,
        note text not null,
        event_day date not null default current_date
      );
      create table if not exists proposal_revisions (
        id uuid primary key,
        proposal_id uuid not null references proposals(id),
        revision_number integer not null,
        title text not null,
        problem text not null,
        proposed_change text not null,
        category text not null,
        evidence jsonb not null default '[]',
        revision_note text not null,
        created_at timestamptz not null default now(),
        unique (proposal_id, revision_number)
      );
      create table if not exists moderation_cases (
        id uuid primary key,
        proposal_id uuid not null references proposals(id),
        kind text not null,
        status text not null,
        reason text not null,
        reviewers jsonb not null default '[]',
        decision_status text,
        decision_note text,
        decision_duplicate_of uuid,
        opened_at timestamptz not null default now(),
        resolved_at timestamptz
      );
      create unique index if not exists one_open_moderation_case_per_proposal
        on moderation_cases (proposal_id) where status = 'open';
      create table if not exists institutional_responses (
        proposal_id uuid primary key references proposals(id),
        institution text not null,
        status text not null,
        response_text text,
        source_url text,
        updated_at timestamptz not null default now()
      );
      create table if not exists closed_results (
        proposal_id uuid primary key references proposals(id),
        turnout integer not null,
        support integer not null,
        oppose integer not null,
        closed_at timestamptz not null
      );
      alter table proposals add column if not exists evidence jsonb not null default '[]';
      alter table arguments add column if not exists evidence jsonb not null default '[]';
      alter table arguments add column if not exists public_author_name text;
      alter table proposals add column if not exists author_capability_hash text;
      alter table proposals add column if not exists submission_nullifier text;
      alter table arguments add column if not exists contribution_nullifier text;
      alter table proposals add column if not exists revision_number integer not null default 1;
      alter table proposals add column if not exists duplicate_of uuid;
      alter table proposals add column if not exists appeal_status text;
      alter table moderation_cases add column if not exists decision_status text;
      alter table moderation_cases add column if not exists decision_note text;
      alter table moderation_cases add column if not exists decision_duplicate_of uuid;
      create unique index if not exists arguments_contribution_nullifier_idx
        on arguments (contribution_nullifier) where contribution_nullifier is not null;
      create unique index if not exists proposals_submission_nullifier_idx
        on proposals (submission_nullifier) where submission_nullifier is not null;
    `);
  }

  async list(): Promise<ProposalRecord[]> {
    const rows = await this.sql`select id from proposals order by created_at desc`;
    return (await Promise.all(rows.map((row) => this.get(String(row.id))))).filter(
      (proposal): proposal is ProposalRecord => Boolean(proposal),
    );
  }

  async get(id: string): Promise<ProposalRecord | undefined> {
    const [proposal] = await this.sql`select * from proposals where id = ${id}`;
    if (!proposal) return undefined;
    const [round, args, events, counts, responses, closedResults] = await Promise.all([
      this.sql`select * from voting_rounds where proposal_id = ${id}`,
      this.sql`select * from arguments where proposal_id = ${id} order by created_at`,
      this.sql`select * from status_events where proposal_id = ${id} order by event_day`,
      this.sql`
        select count(*)::int as votes,
          count(*) filter (where choice = 'support')::int as support
        from ballots b join voting_rounds r on r.id = b.round_id where r.proposal_id = ${id}
      `,
      this.sql`select * from institutional_responses where proposal_id = ${id}`,
      this.sql`select * from closed_results where proposal_id = ${id}`,
    ]);
    const votingRound = round[0];
    const count = counts[0] ?? { votes: 0, support: 0 };
    return {
      id: String(proposal.id),
      title: String(proposal.title),
      summary: String(proposal.summary),
      problem: String(proposal.problem),
      proposedChange: String(proposal.proposed_change),
      scope: proposal.scope as ProposalRecord["scope"],
      ...(proposal.location ? { location: String(proposal.location) } : {}),
      category: proposal.category as ProposalRecord["category"],
      evidence: proposal.evidence as ProposalRecord["evidence"],
      pseudonym: String(proposal.pseudonym),
      ...(proposal.public_author_name
        ? { publicAuthorName: String(proposal.public_author_name) }
        : {}),
      status: proposal.status as ProposalStatus,
      revisionNumber: Number(proposal.revision_number ?? 1),
      ...(proposal.duplicate_of ? { duplicateOf: String(proposal.duplicate_of) } : {}),
      ...(proposal.appeal_status
        ? { appealStatus: proposal.appeal_status as "open" | "resolved" }
        : {}),
      ...(responses[0]
        ? {
            institutionalResponse: {
              institution: String(responses[0].institution),
              status: responses[0].status as "awaiting_response" | "responded" | "no_response",
              ...(responses[0].response_text
                ? { responseText: String(responses[0].response_text) }
                : {}),
              ...(responses[0].source_url ? { sourceUrl: String(responses[0].source_url) } : {}),
              updatedAt: new Date(String(responses[0].updated_at)).toISOString(),
            },
          }
        : {}),
      ...(closedResults[0]
        ? {
            closedResult: {
              turnout: Number(closedResults[0].turnout),
              support: Number(closedResults[0].support),
              oppose: Number(closedResults[0].oppose),
              closedAt: new Date(String(closedResults[0].closed_at)).toISOString(),
            },
          }
        : {}),
      ...(votingRound
        ? {
            votingRound: {
              id: String(votingRound.id),
              opensAt: new Date(String(votingRound.opens_at)).toISOString(),
              closesAt: new Date(String(votingRound.closes_at)).toISOString(),
              turnout: Number(count.votes),
            },
          }
        : {}),
      arguments: args.map((argument) => ({
        id: String(argument.id),
        position: argument.position as ArgumentRecord["position"],
        body: String(argument.body),
        evidence: argument.evidence as ArgumentRecord["evidence"],
        pseudonym: String(argument.pseudonym),
        ...(argument.public_author_name
          ? { publicAuthorName: String(argument.public_author_name) }
          : {}),
        createdAt: new Date(String(argument.created_at)).toISOString(),
      })),
      statusHistory: events.map((event) => ({
        status: event.status as ProposalStatus,
        at: new Date(String(event.event_day)).toISOString(),
        note: String(event.note),
      })),
    };
  }

  async create(input: CreateProposalInput & { submissionNullifier: string }) {
    const id = randomUUID();
    await this.sql`insert into proposals ${this.sql({
      id,
      title: input.title,
      summary: input.problem.slice(0, 180),
      problem: input.problem,
      proposed_change: input.proposedChange,
      scope: input.scope,
      location: input.location ?? null,
      category: input.category,
      evidence: this.sql.json(input.evidence),
      pseudonym: pseudonyms[Math.floor(Math.random() * pseudonyms.length)] ?? "Fjala e Lirë",
      public_author_name: input.publicAuthorName ?? null,
      author_capability_hash: input.authorCapabilityHash,
      submission_nullifier: input.submissionNullifier,
      status: "pending_review",
      revision_number: 1,
    })}`;
    await this.sql`insert into status_events ${this.sql({
      id: randomUUID(),
      proposal_id: id,
      status: "pending_review",
      note: "U dorëzua për shqyrtim.",
    })}`;
    await this.sql`insert into moderation_cases ${this.sql({
      id: randomUUID(),
      proposal_id: id,
      kind: "initial_review",
      status: "open",
      reason: "Shqyrtimi fillestar i propozimit.",
      reviewers: this.sql.json([]),
    })}`;
    const proposal = await this.get(id);
    if (!proposal) throw new Error("proposal_insert_failed");
    return { proposal };
  }

  async addArgument(
    input: CreateArgumentInput & { contributionNullifier: string },
  ): Promise<ArgumentRecord> {
    const argument: ArgumentRecord = {
      id: randomUUID(),
      position: input.position,
      body: input.body,
      evidence: input.evidence,
      pseudonym: pseudonyms[Math.floor(Math.random() * pseudonyms.length)] ?? "Fjala e Lirë",
      ...(input.publicAuthorName ? { publicAuthorName: input.publicAuthorName } : {}),
      createdAt: new Date().toISOString(),
    };
    await this.sql`insert into arguments ${this.sql({
      id: argument.id,
      position: argument.position,
      body: argument.body,
      evidence: this.sql.json(argument.evidence),
      pseudonym: argument.pseudonym,
      public_author_name: argument.publicAuthorName ?? null,
      proposal_id: input.proposalId,
      contribution_nullifier: input.contributionNullifier,
      created_at: argument.createdAt,
    })}`;
    return argument;
  }

  async vote(input: VoteRecord) {
    const [round] = await this.sql`
      select r.id from voting_rounds r join proposals p on p.id = r.proposal_id
      where r.id = ${input.roundId} and p.status = 'voting_open'
        and r.opens_at <= ${new Date(input.receivedAt)} and r.closes_at > ${new Date(input.receivedAt)}
    `;
    if (!round) throw new Error("round_not_open");
    try {
      await this.sql`insert into ballots ${this.sql({
        round_id: input.roundId,
        nullifier: input.nullifier,
        choice: input.choice,
        commitment: input.commitment,
      })}`;
    } catch (error) {
      if (error instanceof postgres.PostgresError && error.code === "23505") {
        throw new Error("duplicate_vote");
      }
      throw error;
    }
    const [result] = await this.sql`
      select count(b.*)::int as turnout,
        count(b.*) filter (where b.choice = 'support')::int as support
      from voting_rounds r left join ballots b on b.round_id = r.id
      where r.id = ${input.roundId} group by r.id
    `;
    if (!result) throw new Error("round_not_found");
    const turnout = Number(result.turnout);
    const support = Number(result.support);
    return { turnout, support, oppose: turnout - support };
  }

  private async capabilityMatches(id: string, capabilityHash: string): Promise<boolean> {
    const [row] = await this.sql`select author_capability_hash from proposals where id = ${id}`;
    return Boolean(row && row.author_capability_hash === capabilityHash);
  }

  async revise(id: string, capabilityHash: string, input: ReviseProposalInput) {
    if (!(await this.capabilityMatches(id, capabilityHash))) throw new Error("invalid_capability");
    const [current] = await this.sql`select * from proposals where id = ${id}`;
    if (!current) return undefined;
    if (!["pending_review", "needs_changes"].includes(String(current.status))) {
      throw new Error("revision_not_allowed");
    }
    const revisionNumber = Number(current.revision_number ?? 1) + 1;
    await this.sql.begin(async (sql) => {
      await sql`insert into proposal_revisions ${sql({
        id: randomUUID(),
        proposal_id: id,
        revision_number: revisionNumber,
        title: input.title,
        problem: input.problem,
        proposed_change: input.proposedChange,
        category: input.category,
        evidence: sql.json(input.evidence),
        revision_note: input.revisionNote,
      })}`;
      await sql`update proposals set
        title = ${input.title}, summary = ${input.problem.slice(0, 180)},
        problem = ${input.problem}, proposed_change = ${input.proposedChange},
        category = ${input.category}, evidence = ${sql.json(input.evidence)},
        revision_number = ${revisionNumber}, status = 'pending_review'
        where id = ${id}`;
      await sql`insert into status_events ${sql({
        id: randomUUID(),
        proposal_id: id,
        status: "pending_review",
        note: `Versioni ${revisionNumber}: ${input.revisionNote}`,
      })}`;
    });
    return this.get(id);
  }

  async withdraw(id: string, capabilityHash: string, input: WithdrawProposalInput) {
    if (!(await this.capabilityMatches(id, capabilityHash))) throw new Error("invalid_capability");
    const [proposal] = await this.sql`select status from proposals where id = ${id}`;
    if (!proposal) return undefined;
    if (
      !["pending_review", "needs_changes", "rejected", "duplicate"].includes(
        String(proposal.status),
      )
    ) {
      throw new Error("withdrawal_not_allowed");
    }
    await this.sql.begin(async (sql) => {
      await sql`update proposals set status = 'withdrawn' where id = ${id}`;
      await sql`insert into status_events ${sql({
        id: randomUUID(),
        proposal_id: id,
        status: "withdrawn",
        note: input.reason,
      })}`;
    });
    return this.get(id);
  }

  async appeal(id: string, capabilityHash: string, input: AppealProposalInput) {
    if (!(await this.capabilityMatches(id, capabilityHash))) throw new Error("invalid_capability");
    const [proposal] = await this.sql`select status from proposals where id = ${id}`;
    if (!proposal) return undefined;
    if (!["rejected", "duplicate"].includes(String(proposal.status))) {
      throw new Error("appeal_not_allowed");
    }
    const moderationCase: ModerationCaseRecord = {
      id: randomUUID(),
      proposalId: id,
      kind: "appeal",
      status: "open",
      reason: input.reason,
      openedAt: new Date().toISOString(),
      reviewers: [],
    };
    try {
      await this.sql.begin(async (sql) => {
        await sql`insert into moderation_cases ${sql({
          id: moderationCase.id,
          proposal_id: id,
          kind: moderationCase.kind,
          status: moderationCase.status,
          reason: moderationCase.reason,
          opened_at: moderationCase.openedAt,
          reviewers: sql.json([]),
        })}`;
        await sql`update proposals set appeal_status = 'open' where id = ${id}`;
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("one_open_moderation_case")) {
        throw new Error("appeal_already_open");
      }
      throw error;
    }
    return moderationCase;
  }

  async listModerationCases(): Promise<ModerationCaseRecord[]> {
    const rows = await this.sql`select * from moderation_cases order by opened_at desc`;
    return rows.map((row) => ({
      id: String(row.id),
      proposalId: String(row.proposal_id),
      kind: row.kind as ModerationCaseRecord["kind"],
      status: row.status as ModerationCaseRecord["status"],
      reason: String(row.reason),
      openedAt: new Date(String(row.opened_at)).toISOString(),
      ...(row.resolved_at ? { resolvedAt: new Date(String(row.resolved_at)).toISOString() } : {}),
      reviewers: Array.isArray(row.reviewers) ? row.reviewers.map(String) : [],
      ...(row.decision_status
        ? {
            pendingDecision: {
              status: String(row.decision_status) as ModerationDecisionInput["status"],
              note: String(row.decision_note),
              ...(row.decision_duplicate_of
                ? { duplicateOf: String(row.decision_duplicate_of) }
                : {}),
            },
          }
        : {}),
    }));
  }

  async moderate(id: string, decision: ModerationDecisionInput) {
    const outcome = await this.sql.begin(async (sql) => {
      const [proposal] = await sql`select * from proposals where id = ${id} for update`;
      if (!proposal) return undefined;
      let [moderationCase] =
        await sql`select * from moderation_cases where proposal_id = ${id} and status = 'open' for update`;
      if (!moderationCase) {
        const caseId = randomUUID();
        await sql`insert into moderation_cases ${sql({
          id: caseId,
          proposal_id: id,
          kind: "initial_review",
          status: "open",
          reason: decision.note,
          reviewers: sql.json([]),
        })}`;
        [moderationCase] = await sql`select * from moderation_cases where id = ${caseId}`;
      }
      const reviewers = Array.isArray(moderationCase?.reviewers)
        ? moderationCase.reviewers.map(String)
        : [];
      if (!reviewers.includes(decision.reviewer)) reviewers.push(decision.reviewer);
      const requiresTwo =
        moderationCase?.kind === "appeal" || ["rejected", "duplicate"].includes(decision.status);
      if (requiresTwo && moderationCase?.decision_status) {
        if (
          String(moderationCase.decision_status) !== decision.status ||
          String(moderationCase.decision_note) !== decision.note ||
          (moderationCase.decision_duplicate_of
            ? String(moderationCase.decision_duplicate_of)
            : undefined) !== decision.duplicateOf
        ) {
          throw new Error("reviewer_disagreement");
        }
      }
      const applied = !requiresTwo || reviewers.length >= 2;
      await sql`update moderation_cases set reviewers = ${sql.json(reviewers)}, reason = ${decision.note}
        ${requiresTwo && !moderationCase?.decision_status ? sql`, decision_status = ${decision.status}, decision_note = ${decision.note}, decision_duplicate_of = ${decision.duplicateOf ?? null}` : sql``}
        where id = ${moderationCase?.id}`;
      if (applied) {
        const duplicateOf = decision.status === "duplicate" ? (decision.duplicateOf ?? null) : null;
        await sql`update proposals set status = ${decision.status},
          duplicate_of = ${duplicateOf},
          appeal_status = case when appeal_status = 'open' then 'resolved' else appeal_status end
          where id = ${id}`;
        if (decision.status === "voting_open") {
          const opensAt = new Date();
          const closesAt = new Date(opensAt.getTime() + 14 * 24 * 60 * 60 * 1_000);
          await sql`insert into voting_rounds ${sql({
            id: randomUUID(),
            proposal_id: id,
            opens_at: opensAt,
            closes_at: closesAt,
          })} on conflict (proposal_id) do nothing`;
        }
        await sql`insert into status_events ${sql({
          id: randomUUID(),
          proposal_id: id,
          status: decision.status,
          note: decision.note,
        })}`;
        await sql`update moderation_cases set status = 'resolved', resolved_at = now()
          where id = ${moderationCase?.id}`;
      }
      return { caseId: String(moderationCase?.id), applied };
    });
    if (!outcome) return undefined;
    const [proposal, cases] = await Promise.all([this.get(id), this.listModerationCases()]);
    const moderationCase = cases.find((item) => item.id === outcome.caseId);
    if (!proposal || !moderationCase) return undefined;
    return { proposal, moderationCase, applied: outcome.applied };
  }

  async recordInstitutionalResponse(id: string, input: InstitutionalResponseInput) {
    const [proposal] = await this.sql`select status from proposals where id = ${id}`;
    if (!proposal) return undefined;
    if (
      !["voting_closed", "awaiting_response", "responded", "no_response"].includes(
        String(proposal.status),
      )
    ) {
      throw new Error("response_not_allowed");
    }
    await this.sql.begin(async (sql) => {
      await sql`insert into institutional_responses ${sql({
        proposal_id: id,
        institution: input.institution,
        status: input.status,
        response_text: input.responseText ?? null,
        source_url: input.sourceUrl ?? null,
      })} on conflict (proposal_id) do update set
        institution = excluded.institution, status = excluded.status,
        response_text = excluded.response_text, source_url = excluded.source_url,
        updated_at = now()`;
      await sql`update proposals set status = ${input.status} where id = ${id}`;
      await sql`insert into status_events ${sql({
        id: randomUUID(),
        proposal_id: id,
        status: input.status,
        note: input.note,
      })}`;
    });
    return this.get(id);
  }

  async closeExpiredRounds(now = new Date()) {
    const rows = await this.sql`
      select p.id, r.id as round_id,
        count(b.*)::int as votes,
        count(b.*) filter (where b.choice = 'support')::int as support_votes
      from proposals p join voting_rounds r on r.proposal_id = p.id
      left join ballots b on b.round_id = r.id
      where p.status = 'voting_open' and r.closes_at <= ${now}
      group by p.id, r.id
    `;
    for (const row of rows) {
      const turnout = Number(row.votes);
      const support = Number(row.support_votes);
      await this.sql.begin(async (sql) => {
        await sql`insert into closed_results ${sql({
          proposal_id: row.id,
          turnout,
          support,
          oppose: turnout - support,
          closed_at: now,
        })} on conflict (proposal_id) do nothing`;
        await sql`update proposals set status = 'voting_closed' where id = ${row.id}`;
        await sql`insert into status_events ${sql({
          id: randomUUID(),
          proposal_id: row.id,
          status: "voting_closed",
          note: "Votimi 14-ditor u mbyll.",
        })}`;
      });
    }
    return rows.length;
  }

  async ballotCommitments(proposalId: string) {
    const rows = await this.sql`
      select b.commitment from ballots b join voting_rounds r on r.id = b.round_id
      where r.proposal_id = ${proposalId} order by b.commitment
    `;
    return rows.map((row) => String(row.commitment));
  }
}
