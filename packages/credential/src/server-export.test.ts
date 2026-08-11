import { describe, expect, it } from "vitest";

describe("server package export", () => {
  it("loads the built Node.js entrypoint used by deployed services", async () => {
    const server = await import("@kuvend/credential/server");

    expect(server.createMembershipSnapshot).toBeTypeOf("function");
    expect(server.verifyAnonymousProof).toBeTypeOf("function");
  });
});
