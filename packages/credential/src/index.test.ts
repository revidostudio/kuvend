import { generateKeyPairSync } from "node:crypto";
import { Identity } from "@semaphore-protocol/identity";
import { describe, expect, it } from "vitest";
import { actionScope } from "./anonymous.js";
import {
  createMembershipSnapshot,
  publicKeyFromPrivate,
  verifyMembershipSnapshot,
} from "./server.js";

describe("Semaphore membership credentials", () => {
  it("signs and verifies an anonymous group snapshot", () => {
    const privateKey = generateKeyPairSync("ed25519")
      .privateKey.export({
        type: "pkcs8",
        format: "pem",
      })
      .toString();
    const members = [
      new Identity().commitment,
      new Identity().commitment,
      new Identity().commitment,
    ]
      .map(String)
      .sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));
    const snapshot = createMembershipSnapshot(members, privateKey, { epoch: "test" });
    expect(verifyMembershipSnapshot(snapshot, publicKeyFromPrivate(privateKey))).toBe(true);
    expect(
      verifyMembershipSnapshot({ ...snapshot, root: "1" }, publicKeyFromPrivate(privateKey)),
    ).toBe(false);
  });

  it("derives stable, separated action scopes", async () => {
    await expect(actionScope("ballot:one")).resolves.toBe(await actionScope("ballot:one"));
    expect(await actionScope("ballot:one")).not.toBe(await actionScope("ballot:two"));
  });
});
