import { describe, expect, it } from "vitest";
import { assertCivicSafe, findForbiddenCivicData } from "./index.js";

describe("privacy testkit", () => {
  it("detects nested identity data", () => {
    expect(findForbiddenCivicData({ ballot: { phoneNumber: "+355690000000" } })).toEqual([
      "$.ballot.phoneNumber",
      "$.ballot.phoneNumber:phone-like-value",
    ]);
  });

  it("accepts an anonymous ballot record", () => {
    expect(() =>
      assertCivicSafe({ roundId: "round", nullifier: "a".repeat(64), choice: "support" }),
    ).not.toThrow();
  });
});
