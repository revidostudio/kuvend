import { describe, expect, it } from "vitest";
import {
  castBallotSchema,
  createArgumentSchema,
  createProposalSchema,
  isPublicProposalStatus,
  proposalStatuses,
  publicProposalStatuses,
} from "./index.js";

const credentialProof = {
  protocol: "semaphore-v4",
  snapshot: {
    protocol: "semaphore-v4",
    epoch: "test",
    root: "4",
    memberCount: 3,
    issuedAt: "2026-08-11T00:00:00.000Z",
    expiresAt: "2027-08-11T00:00:00.000Z",
    signature: "a".repeat(64),
  },
  proof: {
    merkleTreeDepth: 1,
    merkleTreeRoot: "4",
    message: "1",
    nullifier: "5",
    scope: "6",
    points: Array(8).fill("7"),
  },
};

const baseProposal = {
  title: "Ndriçim më i mirë pranë shkollave",
  problem: "Rrugët pranë shkollave janë të errëta dhe të pasigurta për fëmijët.",
  proposedChange: "Të vendosen drita të reja dhe kalime të ndriçuara pranë çdo shkolle.",
  scope: "local",
  location: "Tiranë",
  category: "community",
  evidence: [],
  credentialProof,
  authorCapabilityHash: "a".repeat(64),
};

describe("privacy-boundary contracts", () => {
  it("publishes only proposals that completed moderation", () => {
    expect(proposalStatuses.filter(isPublicProposalStatus)).toEqual(publicProposalStatuses);
    for (const status of [
      "pending_review",
      "needs_changes",
      "duplicate",
      "rejected",
      "withdrawn",
    ] as const) {
      expect(isPublicProposalStatus(status)).toBe(false);
    }
  });

  it("rejects identity fields in a civic proposal", () => {
    const result = createProposalSchema.safeParse({ ...baseProposal, phone: "+355690000000" });
    expect(result.success).toBe(false);
  });

  it("rejects a ballot carrying an auth user id", () => {
    const result = castBallotSchema.safeParse({
      proposalId: crypto.randomUUID(),
      roundId: crypto.randomUUID(),
      choice: "support",
      credentialProof,
      receiptCommitment: "c".repeat(64),
      userId: "stable-user",
    });
    expect(result.success).toBe(false);
  });

  it("allows an optional unverified display name on an argument but rejects identity fields", () => {
    const baseArgument = {
      proposalId: crypto.randomUUID(),
      position: "for",
      body: "Ky argument shpjegon qartë një arsye publike.",
      evidence: [],
      publicAuthorName: "Arta",
      credentialProof,
    };
    expect(createArgumentSchema.safeParse(baseArgument).success).toBe(true);
    expect(
      createArgumentSchema.safeParse({ ...baseArgument, phone: "+355690000000" }).success,
    ).toBe(false);
  });
});
