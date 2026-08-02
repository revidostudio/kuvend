import { describe, expect, it } from "vitest";
import { issueSyntheticCredential, verifySyntheticCredential } from "./index.js";

describe("synthetic credential adapter", () => {
  it("accepts a credential signed with the development key", () => {
    const credential = issueSyntheticCredential("test-key");
    expect(verifySyntheticCredential(credential, "test-key")).toBe(true);
    expect(credential).not.toContain("phone");
  });

  it("rejects a credential signed by another key", () => {
    const credential = issueSyntheticCredential("one-key");
    expect(verifySyntheticCredential(credential, "another-key")).toBe(false);
  });
});
