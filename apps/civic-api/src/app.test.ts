import { createHash, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { issueSyntheticCredential } from "@kuvend/credential";
import { buildApp } from "./app.js";
import { MemoryCivicStore } from "./store.js";

describe("civic API", () => {
  it("does not expose vote split before a participant votes", async () => {
    const app = buildApp(new MemoryCivicStore());
    const response = await app.inject({ method: "GET", url: "/v1/proposals" });
    expect(response.statusCode).toBe(200);
    expect(response.json().proposals[0].votingRound).toHaveProperty("turnout");
    expect(response.json().proposals[0].votingRound).not.toHaveProperty("support");
  });

  it("rejects phone data even with a valid credential", async () => {
    const app = buildApp(new MemoryCivicStore());
    const response = await app.inject({
      method: "POST",
      url: "/v1/proposals",
      payload: {
        title: "Ndriçim më i mirë pranë shkollave",
        problem: "Rrugët pranë shkollave janë të errëta dhe të pasigurta për fëmijët.",
        proposedChange: "Të vendosen drita të reja pranë hyrjeve dhe kalimeve të shkollave.",
        scope: "local",
        category: "community",
        evidence: [],
        authorCapabilityHash: "a".repeat(64),
        credential: issueSyntheticCredential("development-only-change-me"),
        phone: "+355690000000",
      },
    });
    expect(response.statusCode).toBe(400);
  });

  it("supports capability revisions, two-review rejection, and appeals", async () => {
    const app = buildApp(new MemoryCivicStore());
    const capabilitySecret = randomUUID();
    const created = await app.inject({
      method: "POST",
      url: "/v1/proposals",
      payload: {
        title: "Më shumë strehë në stacionet rurale",
        problem: "Udhëtarët në shumë stacione rurale presin pa mbrojtje nga shiu dhe dielli.",
        proposedChange:
          "Bashkitë të inventarizojnë stacionet dhe të vendosin strehë sipas përdorimit.",
        scope: "local",
        location: "Elbasan",
        category: "transport",
        evidence: [],
        authorCapabilityHash: createHash("sha256").update(capabilitySecret).digest("hex"),
        credential: issueSyntheticCredential("development-only-change-me"),
      },
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().proposal.id as string;

    const revised = await app.inject({
      method: "POST",
      url: `/v1/proposals/${id}/revise`,
      payload: {
        capabilitySecret,
        title: "Strehë të sigurta në stacionet rurale",
        problem: "Udhëtarët në shumë stacione rurale presin pa mbrojtje nga shiu dhe dielli.",
        proposedChange:
          "Bashkitë të inventarizojnë stacionet dhe të vendosin strehë sipas përdorimit.",
        category: "transport",
        evidence: [],
        revisionNote: "Titulli u bë më i qartë pas rishikimit.",
      },
    });
    expect(revised.statusCode).toBe(200);
    expect(revised.json().proposal.revisionNumber).toBe(2);

    for (const reviewer of ["moderatori-a", "moderatori-b"]) {
      const decision = await app.inject({
        method: "POST",
        url: `/internal/proposals/${id}/moderate`,
        headers: { "x-admin-key": "development-admin-key" },
        payload: {
          status: "rejected",
          note: "Kërkohet lidhje më e qartë me një kompetencë publike.",
          reviewer,
        },
      });
      expect(decision.statusCode).toBe(200);
    }
    const rejected = await app.inject({ method: "GET", url: `/v1/proposals/${id}` });
    expect(rejected.json().proposal.status).toBe("rejected");

    const appeal = await app.inject({
      method: "POST",
      url: `/v1/proposals/${id}/appeals`,
      payload: {
        capabilitySecret,
        reason:
          "Propozimi lidhet me përgjegjësinë e bashkisë për stacionet dhe kërkojmë rishqyrtim.",
      },
    });
    expect(appeal.statusCode).toBe(201);
    expect(appeal.json().moderationCase.kind).toBe("appeal");
    await app.close();
  });

  it("rejects an incorrect author capability", async () => {
    const store = new MemoryCivicStore();
    const app = buildApp(store);
    const created = await store.create({
      title: "Ndriçim më i mirë pranë shkollave",
      problem: "Rrugët pranë shkollave janë të errëta dhe të pasigurta për fëmijët.",
      proposedChange: "Të vendosen drita të reja pranë hyrjeve dhe kalimeve të shkollave.",
      scope: "local",
      category: "community",
      evidence: [],
      authorCapabilityHash: "a".repeat(64),
      credential: issueSyntheticCredential("development-only-change-me"),
    });
    const response = await app.inject({
      method: "POST",
      url: `/v1/proposals/${created.proposal.id}/withdraw`,
      payload: { capabilitySecret: randomUUID(), reason: "Kërkoj të tërheq këtë propozim." },
    });
    expect(response.statusCode).toBe(403);
    await app.close();
  });

  it("requires two reviewers to approve the same high-risk decision", async () => {
    const store = new MemoryCivicStore();
    const created = await store.create({
      title: "Hapësira të sigurta për biçikletat",
      problem: "Mungesa e parkimit të sigurt i pengon njerëzit të përdorin biçikletat çdo ditë.",
      proposedChange: "Bashkitë të vendosin pika parkimi pranë shkollave dhe shërbimeve publike.",
      scope: "national",
      category: "transport",
      evidence: [],
      authorCapabilityHash: "a".repeat(64),
      credential: issueSyntheticCredential("development-only-change-me"),
    });
    const first = await store.moderate(created.proposal.id, {
      status: "rejected",
      note: "Nuk përcakton institucionin përgjegjës.",
      reviewer: "moderatori-a",
    });
    expect(first?.applied).toBe(false);
    await expect(
      store.moderate(created.proposal.id, {
        status: "rejected",
        note: "Një arsye tjetër që nuk përputhet.",
        reviewer: "moderatori-b",
      }),
    ).rejects.toThrow("reviewer_disagreement");
  });

  it("publishes a verifiable receipt list only after the round closes", async () => {
    const store = new MemoryCivicStore();
    const app = buildApp(store);
    const proposal = (await store.list())[0]!;
    const commitment = "c".repeat(64);
    const vote = await app.inject({
      method: "POST",
      url: "/v1/ballots",
      payload: {
        proposalId: proposal.id,
        roundId: proposal.votingRound!.id,
        choice: "support",
        credential: issueSyntheticCredential("development-only-change-me"),
        nullifier: "d".repeat(64),
        receiptCommitment: commitment,
      },
    });
    expect(vote.statusCode).toBe(201);
    const receipt = vote.json().receipt as string;
    const before = await app.inject({
      method: "GET",
      url: `/v1/proposals/${proposal.id}/commitments`,
    });
    expect(before.statusCode).toBe(403);
    await store.closeExpiredRounds(new Date("2026-08-20T00:00:00.000Z"));
    const after = await app.inject({
      method: "GET",
      url: `/v1/proposals/${proposal.id}/commitments`,
    });
    expect(after.statusCode).toBe(200);
    expect(after.json().receipts).toContain(receipt);
    expect(after.json().signature).toBeTruthy();
    await app.close();
  });
});
