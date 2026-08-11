export interface SignedMembershipRoot {
  protocol: "semaphore-v4";
  epoch: string;
  root: string;
  memberCount: number;
  issuedAt: string;
  expiresAt: string;
  signature: string;
}

export interface MembershipSnapshot extends SignedMembershipRoot {
  members: string[];
}

export interface AnonymousProof {
  protocol: "semaphore-v4";
  snapshot: SignedMembershipRoot;
  proof: {
    merkleTreeDepth: number;
    merkleTreeRoot: string;
    message: string;
    nullifier: string;
    scope: string;
    points: string[];
  };
}

export interface BrowserCredential {
  protocol: "semaphore-v4";
  identity: string;
  snapshot: MembershipSnapshot;
  expiresAt: string;
}

export function canonicalSnapshot(snapshot: Omit<SignedMembershipRoot, "signature">): string {
  return JSON.stringify({
    protocol: snapshot.protocol,
    epoch: snapshot.epoch,
    root: snapshot.root,
    memberCount: snapshot.memberCount,
    issuedAt: snapshot.issuedAt,
    expiresAt: snapshot.expiresAt,
  });
}

export function voteMessage(choice: "support" | "oppose"): string {
  return choice === "support" ? "1" : "2";
}

export async function actionScope(action: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`kuvend:v1:${action}`)),
  );
  let value = 0n;
  for (const byte of digest.slice(0, 31)) value = (value << 8n) + BigInt(byte);
  return value.toString();
}
