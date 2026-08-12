import { createPublicKey, sign, verify } from "node:crypto";
import { Group } from "@semaphore-protocol/group";
import { verifyProof } from "@semaphore-protocol/proof";
import type { AnonymousProof, MembershipSnapshot, SignedMembershipRoot } from "./anonymous.js";

function canonicalSnapshot(snapshot: Omit<SignedMembershipRoot, "signature">): string {
  return JSON.stringify({
    protocol: snapshot.protocol,
    epoch: snapshot.epoch,
    root: snapshot.root,
    memberCount: snapshot.memberCount,
    issuedAt: snapshot.issuedAt,
    expiresAt: snapshot.expiresAt,
  });
}

function unsigned(snapshot: SignedMembershipRoot): Omit<SignedMembershipRoot, "signature"> {
  const { signature: _signature, ...value } = snapshot;
  return value;
}

export function signMembershipSnapshot(
  value: Omit<SignedMembershipRoot, "signature">,
  privateKeyPem: string | Buffer,
): SignedMembershipRoot {
  return {
    ...value,
    signature: sign(null, Buffer.from(canonicalSnapshot(value)), privateKeyPem).toString(
      "base64url",
    ),
  };
}

export function createMembershipSnapshot(
  members: string[],
  privateKey: string | Buffer,
  options: { epoch: string; issuedAt?: Date; validityMs?: number },
): MembershipSnapshot {
  const issuedAt = options.issuedAt ?? new Date();
  const group = new Group(members.map(BigInt));
  return {
    members,
    ...signMembershipSnapshot(
      {
        protocol: "semaphore-v4",
        epoch: options.epoch,
        root: group.root.toString(),
        memberCount: members.length,
        issuedAt: issuedAt.toISOString(),
        expiresAt: new Date(issuedAt.getTime() + (options.validityMs ?? 5 * 60_000)).toISOString(),
      },
      privateKey,
    ),
  };
}

export function publicKeyFromPrivate(privateKeyPem: string | Buffer): string {
  return createPublicKey(privateKeyPem).export({ type: "spki", format: "pem" }).toString();
}

export function verifyMembershipSnapshot(
  snapshot: SignedMembershipRoot,
  publicKeyPem: string | Buffer,
  now = Date.now(),
): boolean {
  try {
    if (snapshot.protocol !== "semaphore-v4") return false;
    if (new Date(snapshot.expiresAt).getTime() <= now) return false;
    if (new Date(snapshot.issuedAt).getTime() > now + 60_000) return false;
    if (snapshot.memberCount < 3) return false;
    return verify(
      null,
      Buffer.from(canonicalSnapshot(unsigned(snapshot))),
      publicKeyPem,
      Buffer.from(snapshot.signature, "base64url"),
    );
  } catch {
    return false;
  }
}

export async function verifyAnonymousProof(
  value: AnonymousProof,
  expected: { message: string; scope: string },
  publicKeyPem: string | Buffer,
  now = Date.now(),
): Promise<boolean> {
  try {
    if (value.protocol !== "semaphore-v4") return false;
    if (!verifyMembershipSnapshot(value.snapshot, publicKeyPem, now)) return false;
    if (value.proof.merkleTreeRoot !== value.snapshot.root) return false;
    if (value.proof.message !== expected.message || value.proof.scope !== expected.scope)
      return false;
    return verifyProof(value.proof as Parameters<typeof verifyProof>[0]);
  } catch {
    return false;
  }
}
