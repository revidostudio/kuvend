import { describe, expect, it } from "vitest";
import { castBallotSchema, createArgumentSchema, createProposalSchema } from "./index.js";

const baseProposal = {
  title: "Ndriçim më i mirë pranë shkollave",
  problem: "Rrugët pranë shkollave janë të errëta dhe të pasigurta për fëmijët.",
  proposedChange: "Të vendosen drita të reja dhe kalime të ndriçuara pranë çdo shkolle.",
  scope: "local",
  location: "Tiranë",
  category: "community",
  evidence: [],
  credential: "synthetic.credential.value",
  authorCapabilityHash: "a".repeat(64),
};

describe("privacy-boundary contracts", () => {
  it("rejects identity fields in a civic proposal", () => {
    const result = createProposalSchema.safeParse({ ...baseProposal, phone: "+355690000000" });
    expect(result.success).toBe(false);
  });

  it("rejects a ballot carrying an auth user id", () => {
    const result = castBallotSchema.safeParse({
      proposalId: crypto.randomUUID(),
      roundId: crypto.randomUUID(),
      choice: "support",
      credential: "synthetic.credential.value",
      nullifier: "b".repeat(64),
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
      credential: "synthetic.credential.value",
      contributionNullifier: "d".repeat(64),
    };
    expect(createArgumentSchema.safeParse(baseArgument).success).toBe(true);
    expect(
      createArgumentSchema.safeParse({ ...baseArgument, phone: "+355690000000" }).success,
    ).toBe(false);
  });
});
