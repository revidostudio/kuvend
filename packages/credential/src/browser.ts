import { Group } from "@semaphore-protocol/group";
import { Identity } from "@semaphore-protocol/identity";
import { generateProof } from "@semaphore-protocol/proof";
import type { AnonymousProof, BrowserCredential, MembershipSnapshot } from "./anonymous.js";

export function createBrowserIdentity(): { identity: string; commitment: string } {
  const identity = new Identity();
  return { identity: identity.export(), commitment: identity.commitment.toString() };
}

export function identityCommitment(exportedIdentity: string): string {
  return Identity.import(exportedIdentity).commitment.toString();
}

export function validateSnapshot(
  snapshot: MembershipSnapshot,
  commitment: string,
  now = Date.now(),
) {
  const group = new Group(snapshot.members.map(BigInt));
  if (group.root.toString() !== snapshot.root) throw new Error("membership_root_mismatch");
  if (!snapshot.members.includes(commitment)) throw new Error("identity_not_in_membership_group");
  if (new Date(snapshot.expiresAt).getTime() <= now) throw new Error("membership_expired");
  return group;
}

export async function generateAnonymousProof(
  credential: BrowserCredential,
  message: string,
  scope: string,
): Promise<AnonymousProof> {
  const identity = Identity.import(credential.identity);
  const group = validateSnapshot(credential.snapshot, identity.commitment.toString());
  if (group.size < 3) throw new Error("anonymity_set_too_small");
  const proof = await generateProof(identity, group, message, scope, group.depth, {
    wasm: `/api/proof-artifacts/semaphore-${group.depth}.wasm`,
    zkey: `/api/proof-artifacts/semaphore-${group.depth}.zkey`,
  });
  const { members: _members, ...signedRoot } = credential.snapshot;
  return {
    protocol: "semaphore-v4",
    snapshot: signedRoot,
    proof: { ...proof, points: [...proof.points] },
  };
}
