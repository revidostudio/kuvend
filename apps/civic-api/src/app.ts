import { createHash, createHmac } from "node:crypto";
import cors from "@fastify/cors";
import {
  appealProposalSchema,
  castBallotSchema,
  createArgumentSchema,
  createProposalSchema,
  institutionalResponseSchema,
  isPublicProposalStatus,
  moderationDecisionSchema,
  reviseProposalSchema,
  withdrawProposalSchema,
} from "@kuvend/contracts";
import { actionScope, voteMessage } from "@kuvend/credential/anonymous";
import { verifyAnonymousProof } from "@kuvend/credential/server";
import { assertCivicSafe } from "@kuvend/privacy-testkit";
import Fastify from "fastify";
import type { CivicStore } from "./store.js";
import { ballotReceipt } from "./store.js";

export function buildApp(
  store: CivicStore,
  options: {
    participationOpen?: boolean;
    membershipPublicKey?: string;
    verifyParticipationProof?: typeof verifyAnonymousProof;
  } = {},
) {
  const app = Fastify({ logger: false, bodyLimit: 32_000 });
  const membershipPublicKey =
    options.membershipPublicKey ??
    (process.env.ISSUER_MEMBERSHIP_PUBLIC_KEY_B64
      ? Buffer.from(process.env.ISSUER_MEMBERSHIP_PUBLIC_KEY_B64, "base64").toString("utf8")
      : "");
  const participationOpen =
    (options.participationOpen ?? process.env.PARTICIPATION_OPEN === "true") &&
    Boolean(membershipPublicKey);
  const proofVerifier = options.verifyParticipationProof ?? verifyAnonymousProof;
  const transparencyKey = process.env.TRANSPARENCY_SIGNING_KEY ?? "development-transparency-key";
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  void app.register(cors, {
    origin: [
      /^http:\/\/localhost:\d+$/,
      /^https:\/\/([a-z0-9-]+\.)?kuvend\.org$/,
      ...configuredOrigins,
    ],
    methods: ["GET", "POST"],
  });

  app.get("/health", async () => ({
    ok: true,
    credentialProtocol: "semaphore-v4",
    participationOpen,
    store: store.kind,
  }));
  app.get("/v1/proposals", async () => {
    await store.closeExpiredRounds();
    const proposals = (await store.list()).filter((proposal) =>
      isPublicProposalStatus(proposal.status),
    );
    return { proposals, advisory: true };
  });
  app.get<{ Params: { id: string } }>("/v1/proposals/:id", async (request, reply) => {
    await store.closeExpiredRounds();
    const proposal = await store.get(request.params.id);
    return proposal && isPublicProposalStatus(proposal.status)
      ? { proposal }
      : reply.code(404).send({ error: "proposal_not_found" });
  });

  app.post("/v1/proposals", async (request, reply) => {
    if (!participationOpen) {
      return reply.code(503).send({ error: "participation_not_available" });
    }
    const parsed = createProposalSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_civic_payload" });
    assertCivicSafe(parsed.data);
    const scope = await actionScope(`proposal:${parsed.data.authorCapabilityHash}`);
    if (
      !(await proofVerifier(
        parsed.data.credentialProof,
        { message: "1", scope },
        membershipPublicKey,
      ))
    ) {
      return reply.code(401).send({ error: "invalid_anonymous_proof" });
    }
    try {
      const created = await store.create({
        ...parsed.data,
        submissionNullifier: parsed.data.credentialProof.proof.nullifier,
      });
      return reply.code(201).send(created);
    } catch (error) {
      const message = error instanceof Error ? error.message : "proposal_failed";
      return reply.code(message.includes("duplicate") ? 409 : 400).send({ error: message });
    }
  });

  app.post<{ Params: { id: string } }>("/v1/proposals/:id/revise", async (request, reply) => {
    const parsed = reviseProposalSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_revision" });
    assertCivicSafe(parsed.data);
    try {
      const proposal = await store.revise(
        request.params.id,
        createHash("sha256").update(parsed.data.capabilitySecret).digest("hex"),
        parsed.data,
      );
      return proposal ? { proposal } : reply.code(404).send({ error: "proposal_not_found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "revision_failed";
      return reply.code(message === "invalid_capability" ? 403 : 409).send({ error: message });
    }
  });

  app.post<{ Params: { id: string } }>("/v1/proposals/:id/withdraw", async (request, reply) => {
    const parsed = withdrawProposalSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_withdrawal" });
    assertCivicSafe(parsed.data);
    try {
      const proposal = await store.withdraw(
        request.params.id,
        createHash("sha256").update(parsed.data.capabilitySecret).digest("hex"),
        parsed.data,
      );
      return proposal ? { proposal } : reply.code(404).send({ error: "proposal_not_found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "withdrawal_failed";
      return reply.code(message === "invalid_capability" ? 403 : 409).send({ error: message });
    }
  });

  app.post<{ Params: { id: string } }>("/v1/proposals/:id/appeals", async (request, reply) => {
    const parsed = appealProposalSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_appeal" });
    assertCivicSafe(parsed.data);
    try {
      const moderationCase = await store.appeal(
        request.params.id,
        createHash("sha256").update(parsed.data.capabilitySecret).digest("hex"),
        parsed.data,
      );
      return moderationCase
        ? reply.code(201).send({ moderationCase })
        : reply.code(404).send({ error: "proposal_not_found" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "appeal_failed";
      return reply.code(message === "invalid_capability" ? 403 : 409).send({ error: message });
    }
  });

  app.post("/v1/arguments", async (request, reply) => {
    if (!participationOpen) {
      return reply.code(503).send({ error: "participation_not_available" });
    }
    const parsed = createArgumentSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_civic_payload" });
    assertCivicSafe(parsed.data);
    const scope = await actionScope(`argument:${parsed.data.proposalId}:${parsed.data.position}`);
    if (
      !(await proofVerifier(
        parsed.data.credentialProof,
        { message: "1", scope },
        membershipPublicKey,
      ))
    ) {
      return reply.code(401).send({ error: "invalid_anonymous_proof" });
    }
    try {
      return reply.code(201).send({
        argument: await store.addArgument({
          ...parsed.data,
          contributionNullifier: parsed.data.credentialProof.proof.nullifier,
        }),
      });
    } catch (error) {
      return reply
        .code(409)
        .send({ error: error instanceof Error ? error.message : "argument_failed" });
    }
  });

  app.post("/v1/ballots", async (request, reply) => {
    if (!participationOpen) {
      return reply.code(503).send({ error: "participation_not_available" });
    }
    const parsed = castBallotSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_civic_payload" });
    assertCivicSafe(parsed.data);
    const scope = await actionScope(`ballot:${parsed.data.roundId}`);
    if (
      !(await proofVerifier(
        parsed.data.credentialProof,
        { message: voteMessage(parsed.data.choice), scope },
        membershipPublicKey,
      ))
    ) {
      return reply.code(401).send({ error: "invalid_anonymous_proof" });
    }
    try {
      const acceptedAt = new Date().toISOString();
      const result = await store.vote({
        roundId: parsed.data.roundId,
        nullifier: parsed.data.credentialProof.proof.nullifier,
        choice: parsed.data.choice,
        commitment: parsed.data.receiptCommitment,
        receivedAt: acceptedAt,
      });
      return reply.code(201).send({
        receipt: ballotReceipt(parsed.data.roundId, parsed.data.receiptCommitment),
        acceptedAt,
        commitment: parsed.data.receiptCommitment,
        result,
        advisory: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "vote_failed";
      return reply.code(message.includes("duplicate") ? 409 : 400).send({ error: message });
    }
  });

  app.post<{ Params: { id: string } }>(
    "/internal/proposals/:id/moderate",
    async (request, reply) => {
      if (
        request.headers["x-admin-key"] !== (process.env.ADMIN_API_KEY ?? "development-admin-key")
      ) {
        return reply.code(401).send({ error: "unauthorized" });
      }
      const decision = moderationDecisionSchema.safeParse(request.body);
      if (!decision.success) {
        return reply.code(400).send({ error: "invalid_moderation" });
      }
      try {
        const outcome = await store.moderate(request.params.id, decision.data);
        return outcome ? outcome : reply.code(404).send({ error: "proposal_not_found" });
      } catch (error) {
        return reply.code(409).send({
          error: error instanceof Error ? error.message : "moderation_conflict",
        });
      }
    },
  );

  app.get("/internal/moderation-cases", async (request, reply) => {
    if (request.headers["x-admin-key"] !== (process.env.ADMIN_API_KEY ?? "development-admin-key")) {
      return reply.code(401).send({ error: "unauthorized" });
    }
    const cases = await store.listModerationCases();
    return {
      cases: await Promise.all(
        cases.map(async (moderationCase) => ({
          ...moderationCase,
          proposal: await store.get(moderationCase.proposalId),
        })),
      ),
    };
  });

  app.post<{ Params: { id: string } }>(
    "/internal/proposals/:id/institutional-response",
    async (request, reply) => {
      if (
        request.headers["x-admin-key"] !== (process.env.ADMIN_API_KEY ?? "development-admin-key")
      ) {
        return reply.code(401).send({ error: "unauthorized" });
      }
      const parsed = institutionalResponseSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ error: "invalid_response" });
      try {
        const proposal = await store.recordInstitutionalResponse(request.params.id, parsed.data);
        return proposal ? { proposal } : reply.code(404).send({ error: "proposal_not_found" });
      } catch (error) {
        return reply.code(409).send({
          error: error instanceof Error ? error.message : "institutional_response_failed",
        });
      }
    },
  );

  app.get<{ Params: { id: string } }>("/v1/proposals/:id/commitments", async (request, reply) => {
    await store.closeExpiredRounds();
    const proposal = await store.get(request.params.id);
    if (!proposal) return reply.code(404).send({ error: "proposal_not_found" });
    if (proposal.status === "voting_open")
      return reply.code(403).send({ error: "published_after_close" });
    const commitments = await store.ballotCommitments(proposal.id);
    const metadata = {
      proposalId: proposal.id,
      result: proposal.closedResult ?? null,
      commitments,
      receipts: proposal.votingRound
        ? commitments
            .map((commitment) => ballotReceipt(proposal.votingRound!.id, commitment))
            .sort()
        : [],
      statusDigest: createHash("sha256")
        .update(JSON.stringify(proposal.statusHistory))
        .digest("hex"),
      sourceRevision: process.env.SOURCE_REVISION ?? "development",
      keyEpoch: process.env.TRANSPARENCY_KEY_EPOCH ?? "v1",
    };
    return {
      ...metadata,
      signature: createHmac("sha256", transparencyKey)
        .update(JSON.stringify(metadata))
        .digest("base64url"),
      signatureAlgorithm: "hmac-sha256",
    };
  });

  return app;
}
