import { createHash, randomUUID } from "node:crypto";
import type {
  AppealProposalInput,
  ArgumentRecord,
  CreateArgumentInput,
  CreateProposalInput,
  InstitutionalResponseInput,
  ModerationCaseRecord,
  ModerationDecisionInput,
  ProposalRecord,
  ReviseProposalInput,
  VoteChoice,
  WithdrawProposalInput,
} from "@kuvend/contracts";
import { seedProposals } from "./seed.js";

export interface VoteRecord {
  roundId: string;
  nullifier: string;
  choice: VoteChoice;
  commitment: string;
  receivedAt: string;
}

export interface CivicStore {
  kind: "memory" | "postgres";
  list(): Promise<ProposalRecord[]>;
  get(id: string): Promise<ProposalRecord | undefined>;
  create(
    input: CreateProposalInput & { submissionNullifier: string },
  ): Promise<{ proposal: ProposalRecord }>;
  addArgument(
    input: CreateArgumentInput & { contributionNullifier: string },
  ): Promise<ArgumentRecord>;
  vote(input: VoteRecord): Promise<{ support: number; oppose: number; turnout: number }>;
  revise(
    id: string,
    capabilityHash: string,
    input: ReviseProposalInput,
  ): Promise<ProposalRecord | undefined>;
  withdraw(
    id: string,
    capabilityHash: string,
    input: WithdrawProposalInput,
  ): Promise<ProposalRecord | undefined>;
  appeal(
    id: string,
    capabilityHash: string,
    input: AppealProposalInput,
  ): Promise<ModerationCaseRecord | undefined>;
  listModerationCases(): Promise<ModerationCaseRecord[]>;
  moderate(
    id: string,
    decision: ModerationDecisionInput,
  ): Promise<
    { proposal: ProposalRecord; moderationCase: ModerationCaseRecord; applied: boolean } | undefined
  >;
  recordInstitutionalResponse(
    id: string,
    input: InstitutionalResponseInput,
  ): Promise<ProposalRecord | undefined>;
  closeExpiredRounds(now?: Date): Promise<number>;
  ballotCommitments(proposalId: string): Promise<string[]>;
}

const pseudonyms = [
  "Lisi i Qetë",
  "Ura e Hapur",
  "Drita e Mëngjesit",
  "Guri i Bardhë",
  "Zëri i Blertë",
  "Fjala e Lirë",
];

export class MemoryCivicStore implements CivicStore {
  kind = "memory" as const;
  private proposals = structuredClone(seedProposals);
  private votes: VoteRecord[] = [];
  private contributionNullifiers = new Set<string>();
  private proposalNullifiers = new Set<string>();
  private capabilityHashes = new Map<string, string>();
  private moderationCases: ModerationCaseRecord[] = [];

  async list(): Promise<ProposalRecord[]> {
    return structuredClone(this.proposals);
  }

  async get(id: string): Promise<ProposalRecord | undefined> {
    const proposal = this.proposals.find((item) => item.id === id);
    return proposal ? structuredClone(proposal) : undefined;
  }

  async create(input: CreateProposalInput & { submissionNullifier: string }) {
    if (this.proposalNullifiers.has(input.submissionNullifier))
      throw new Error("duplicate_submission");
    const now = new Date().toISOString();
    const proposal: ProposalRecord = {
      id: randomUUID(),
      title: input.title,
      summary: input.problem.slice(0, 180),
      problem: input.problem,
      proposedChange: input.proposedChange,
      scope: input.scope,
      ...(input.location ? { location: input.location } : {}),
      category: input.category,
      evidence: input.evidence,
      pseudonym: pseudonyms[Math.floor(Math.random() * pseudonyms.length)] ?? "Fjala e Lirë",
      ...(input.publicAuthorName ? { publicAuthorName: input.publicAuthorName } : {}),
      status: "pending_review",
      revisionNumber: 1,
      arguments: [],
      statusHistory: [{ status: "pending_review", at: now, note: "U dorëzua për shqyrtim." }],
    };
    this.proposals.unshift(proposal);
    this.proposalNullifiers.add(input.submissionNullifier);
    this.capabilityHashes.set(proposal.id, input.authorCapabilityHash);
    this.moderationCases.unshift({
      id: randomUUID(),
      proposalId: proposal.id,
      kind: "initial_review",
      status: "open",
      reason: "Shqyrtimi fillestar i propozimit.",
      openedAt: now,
      reviewers: [],
    });
    return { proposal: structuredClone(proposal) };
  }

  async addArgument(
    input: CreateArgumentInput & { contributionNullifier: string },
  ): Promise<ArgumentRecord> {
    const proposal = this.proposals.find((item) => item.id === input.proposalId);
    if (!proposal) throw new Error("proposal_not_found");
    if (proposal.status !== "voting_open") throw new Error("discussion_not_open");
    if (this.contributionNullifiers.has(input.contributionNullifier)) {
      throw new Error("duplicate_contribution");
    }
    const argument: ArgumentRecord = {
      id: randomUUID(),
      position: input.position,
      body: input.body,
      evidence: input.evidence,
      pseudonym: pseudonyms[Math.floor(Math.random() * pseudonyms.length)] ?? "Fjala e Lirë",
      ...(input.publicAuthorName ? { publicAuthorName: input.publicAuthorName } : {}),
      createdAt: new Date().toISOString(),
    };
    this.contributionNullifiers.add(input.contributionNullifier);
    proposal.arguments.push(argument);
    return structuredClone(argument);
  }

  async vote(input: VoteRecord) {
    if (
      this.votes.some(
        (vote) => vote.roundId === input.roundId && vote.nullifier === input.nullifier,
      )
    ) {
      throw new Error("duplicate_vote");
    }
    const proposal = this.proposals.find((item) => item.votingRound?.id === input.roundId);
    if (!proposal?.votingRound || proposal.status !== "voting_open")
      throw new Error("round_not_open");
    if (new Date(proposal.votingRound.opensAt) > new Date(input.receivedAt))
      throw new Error("round_not_open");
    if (new Date(proposal.votingRound.closesAt) <= new Date(input.receivedAt))
      throw new Error("round_closed");
    this.votes.push(input);
    proposal.votingRound.turnout += 1;
    const roundVotes = this.votes.filter((vote) => vote.roundId === input.roundId);
    const support = roundVotes.filter((vote) => vote.choice === "support").length;
    const turnout = roundVotes.length;
    proposal.votingRound.turnout = turnout;
    return { support, oppose: turnout - support, turnout };
  }

  async revise(id: string, capabilityHash: string, input: ReviseProposalInput) {
    const proposal = this.proposals.find((item) => item.id === id);
    if (!proposal) return undefined;
    if (this.capabilityHashes.get(id) !== capabilityHash) throw new Error("invalid_capability");
    if (!(["pending_review", "needs_changes"] as const).includes(proposal.status as never)) {
      throw new Error("revision_not_allowed");
    }
    proposal.title = input.title;
    proposal.summary = input.problem.slice(0, 180);
    proposal.problem = input.problem;
    proposal.proposedChange = input.proposedChange;
    proposal.category = input.category;
    proposal.evidence = input.evidence;
    proposal.revisionNumber += 1;
    proposal.status = "pending_review";
    proposal.statusHistory.push({
      status: "pending_review",
      at: new Date().toISOString(),
      note: `Versioni ${proposal.revisionNumber}: ${input.revisionNote}`,
    });
    return structuredClone(proposal);
  }

  async withdraw(id: string, capabilityHash: string, input: WithdrawProposalInput) {
    const proposal = this.proposals.find((item) => item.id === id);
    if (!proposal) return undefined;
    if (this.capabilityHashes.get(id) !== capabilityHash) throw new Error("invalid_capability");
    if (!["pending_review", "needs_changes", "rejected", "duplicate"].includes(proposal.status)) {
      throw new Error("withdrawal_not_allowed");
    }
    proposal.status = "withdrawn";
    proposal.statusHistory.push({
      status: "withdrawn",
      at: new Date().toISOString(),
      note: input.reason,
    });
    return structuredClone(proposal);
  }

  async appeal(id: string, capabilityHash: string, input: AppealProposalInput) {
    const proposal = this.proposals.find((item) => item.id === id);
    if (!proposal) return undefined;
    if (this.capabilityHashes.get(id) !== capabilityHash) throw new Error("invalid_capability");
    if (!["rejected", "duplicate"].includes(proposal.status)) throw new Error("appeal_not_allowed");
    if (this.moderationCases.some((item) => item.proposalId === id && item.status === "open")) {
      throw new Error("appeal_already_open");
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
    this.moderationCases.unshift(moderationCase);
    proposal.appealStatus = "open";
    return structuredClone(moderationCase);
  }

  async listModerationCases() {
    return structuredClone(this.moderationCases);
  }

  async moderate(id: string, decision: ModerationDecisionInput) {
    const proposal = this.proposals.find((item) => item.id === id);
    if (!proposal) return undefined;
    let moderationCase = this.moderationCases.find(
      (item) => item.proposalId === id && item.status === "open",
    );
    if (!moderationCase) {
      moderationCase = {
        id: randomUUID(),
        proposalId: id,
        kind: "initial_review",
        status: "open",
        reason: decision.note,
        openedAt: new Date().toISOString(),
        reviewers: [],
      };
      this.moderationCases.unshift(moderationCase);
    }
    const requiresTwo =
      moderationCase.kind === "appeal" || ["rejected", "duplicate"].includes(decision.status);
    if (requiresTwo && moderationCase.pendingDecision) {
      const pending = moderationCase.pendingDecision;
      if (
        pending.status !== decision.status ||
        pending.note !== decision.note ||
        pending.duplicateOf !== decision.duplicateOf
      ) {
        throw new Error("reviewer_disagreement");
      }
    }
    if (!moderationCase.reviewers.includes(decision.reviewer)) {
      moderationCase.reviewers.push(decision.reviewer);
    }
    if (requiresTwo && !moderationCase.pendingDecision) {
      moderationCase.pendingDecision = {
        status: decision.status,
        note: decision.note,
        ...(decision.duplicateOf ? { duplicateOf: decision.duplicateOf } : {}),
      };
    }
    const applied = !requiresTwo || moderationCase.reviewers.length >= 2;
    if (!applied) {
      moderationCase.reason = decision.note;
      return {
        proposal: structuredClone(proposal),
        moderationCase: structuredClone(moderationCase),
        applied: false,
      };
    }
    proposal.status = decision.status;
    if (decision.status === "duplicate" && decision.duplicateOf) {
      proposal.duplicateOf = decision.duplicateOf;
    }
    if (decision.status !== "duplicate") delete proposal.duplicateOf;
    if (decision.status === "voting_open" && !proposal.votingRound) {
      const opensAt = new Date();
      const closesAt = new Date(opensAt.getTime() + 14 * 24 * 60 * 60 * 1_000);
      proposal.votingRound = {
        id: randomUUID(),
        opensAt: opensAt.toISOString(),
        closesAt: closesAt.toISOString(),
        turnout: 0,
      };
    }
    proposal.statusHistory.push({
      status: decision.status,
      at: new Date().toISOString(),
      note: decision.note,
    });
    moderationCase.status = "resolved";
    moderationCase.resolvedAt = new Date().toISOString();
    if (proposal.appealStatus === "open") proposal.appealStatus = "resolved";
    return {
      proposal: structuredClone(proposal),
      moderationCase: structuredClone(moderationCase),
      applied: true,
    };
  }

  async recordInstitutionalResponse(id: string, input: InstitutionalResponseInput) {
    const proposal = this.proposals.find((item) => item.id === id);
    if (!proposal) return undefined;
    if (
      !["voting_closed", "awaiting_response", "responded", "no_response"].includes(proposal.status)
    ) {
      throw new Error("response_not_allowed");
    }
    proposal.status = input.status;
    proposal.institutionalResponse = {
      institution: input.institution,
      status: input.status,
      ...(input.responseText ? { responseText: input.responseText } : {}),
      ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
      updatedAt: new Date().toISOString(),
    };
    proposal.statusHistory.push({
      status: input.status,
      at: new Date().toISOString(),
      note: input.note,
    });
    return structuredClone(proposal);
  }

  async closeExpiredRounds(now = new Date()) {
    let closed = 0;
    for (const proposal of this.proposals) {
      if (
        proposal.status !== "voting_open" ||
        !proposal.votingRound ||
        new Date(proposal.votingRound.closesAt) > now
      ) {
        continue;
      }
      const roundVotes = this.votes.filter((vote) => vote.roundId === proposal.votingRound?.id);
      const support = roundVotes.filter((vote) => vote.choice === "support").length;
      proposal.closedResult = {
        turnout: roundVotes.length,
        support,
        oppose: roundVotes.length - support,
        closedAt: now.toISOString(),
      };
      proposal.status = "voting_closed";
      proposal.statusHistory.push({
        status: "voting_closed",
        at: now.toISOString(),
        note: "Votimi 14-ditor u mbyll.",
      });
      closed += 1;
    }
    return closed;
  }

  async ballotCommitments(proposalId: string) {
    const proposal = this.proposals.find((item) => item.id === proposalId);
    if (!proposal?.votingRound) return [];
    return this.votes
      .filter((vote) => vote.roundId === proposal.votingRound?.id)
      .map((vote) => vote.commitment)
      .sort();
  }
}

export function ballotReceipt(roundId: string, commitment: string): string {
  return createHash("sha256").update(`${roundId}:${commitment}`).digest("base64url");
}
