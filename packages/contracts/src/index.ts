import { z } from "zod";

export const proposalStatuses = [
  "pending_review",
  "needs_changes",
  "duplicate",
  "rejected",
  "voting_open",
  "voting_closed",
  "awaiting_response",
  "responded",
  "no_response",
  "withdrawn",
] as const;

export const proposalStatusSchema = z.enum(proposalStatuses);
export const publicProposalStatuses = [
  "voting_open",
  "voting_closed",
  "awaiting_response",
  "responded",
  "no_response",
] as const satisfies readonly (typeof proposalStatuses)[number][];

export function isPublicProposalStatus(
  status: (typeof proposalStatuses)[number],
): status is (typeof publicProposalStatuses)[number] {
  return (publicProposalStatuses as readonly string[]).includes(status);
}
export const voteChoiceSchema = z.enum(["support", "oppose"]);
export const argumentPositionSchema = z.enum(["for", "against"]);
export const scopeSchema = z.enum(["national", "local"]);
export const categorySchema = z.enum([
  "transport",
  "environment",
  "governance",
  "education",
  "health",
  "economy",
  "community",
  "other",
]);

const evidenceUrlSchema = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), {
    message: "Evidence links must use HTTPS",
  });

export const evidenceItemSchema = z
  .object({
    type: z.enum(["source", "document", "image", "video"]),
    url: evidenceUrlSchema,
    title: z.string().trim().min(3).max(160),
    publisher: z.string().trim().max(120).optional(),
    publishedAt: z.string().date().optional(),
  })
  .strict();

export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export const createProposalSchema = z
  .object({
    title: z.string().trim().min(8).max(140),
    problem: z.string().trim().min(30).max(3_000),
    proposedChange: z.string().trim().min(30).max(3_000),
    scope: scopeSchema,
    location: z.string().trim().max(120).optional(),
    category: categorySchema,
    evidence: z.array(evidenceItemSchema).max(8).default([]),
    publicAuthorName: z.string().trim().min(2).max(80).optional(),
    credential: z.string().min(20),
    authorCapabilityHash: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

export const createArgumentSchema = z
  .object({
    proposalId: z.string().uuid(),
    position: argumentPositionSchema,
    body: z.string().trim().min(8).max(700),
    evidence: z.array(evidenceItemSchema).max(3).default([]),
    publicAuthorName: z.string().trim().min(2).max(80).optional(),
    credential: z.string().min(20),
    contributionNullifier: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

export const castBallotSchema = z
  .object({
    proposalId: z.string().uuid(),
    roundId: z.string().uuid(),
    choice: voteChoiceSchema,
    credential: z.string().min(20),
    nullifier: z.string().regex(/^[a-f0-9]{64}$/),
    receiptCommitment: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

export const assistDraftSchema = z
  .object({
    title: z.string().trim().max(140).default(""),
    problem: z.string().trim().min(10).max(3_000),
    proposedChange: z.string().trim().min(10).max(3_000),
    locale: z.enum(["sq", "en"]).default("sq"),
  })
  .strict();

export const otpStartSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .regex(/^\+[1-9]\d{7,14}$/),
  })
  .strict();

export const otpCheckSchema = z
  .object({
    challengeId: z.string().uuid(),
    phone: z
      .string()
      .trim()
      .regex(/^\+[1-9]\d{7,14}$/),
    code: z.string().regex(/^\d{6}$/),
  })
  .strict();

const capabilitySecretSchema = z.string().uuid();

export const reviseProposalSchema = z
  .object({
    capabilitySecret: capabilitySecretSchema,
    title: z.string().trim().min(8).max(140),
    problem: z.string().trim().min(30).max(3_000),
    proposedChange: z.string().trim().min(30).max(3_000),
    category: categorySchema,
    evidence: z.array(evidenceItemSchema).max(8).default([]),
    revisionNote: z.string().trim().min(8).max(500),
  })
  .strict();

export const withdrawProposalSchema = z
  .object({
    capabilitySecret: capabilitySecretSchema,
    reason: z.string().trim().min(8).max(500),
  })
  .strict();

export const appealProposalSchema = z
  .object({
    capabilitySecret: capabilitySecretSchema,
    reason: z.string().trim().min(30).max(2_000),
  })
  .strict();

export const moderationDecisionSchema = z
  .object({
    status: z.enum(["needs_changes", "duplicate", "rejected", "voting_open"]),
    note: z.string().trim().min(4).max(2_000),
    duplicateOf: z.string().uuid().optional(),
    reviewer: z.string().trim().min(2).max(100),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "duplicate" && !value.duplicateOf) {
      context.addIssue({
        code: "custom",
        message: "A duplicate decision requires a primary proposal",
        path: ["duplicateOf"],
      });
    }
  });

export const institutionalResponseSchema = z
  .object({
    institution: z.string().trim().min(2).max(180),
    status: z.enum(["awaiting_response", "responded", "no_response"]),
    responseText: z.string().trim().max(5_000).optional(),
    sourceUrl: evidenceUrlSchema.optional(),
    note: z.string().trim().min(4).max(1_000),
    recordedBy: z.string().trim().min(2).max(100),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "responded" && !value.responseText && !value.sourceUrl) {
      context.addIssue({
        code: "custom",
        message: "A response requires text or a source URL",
        path: ["responseText"],
      });
    }
  });

export type ProposalStatus = z.infer<typeof proposalStatusSchema>;
export type VoteChoice = z.infer<typeof voteChoiceSchema>;
export type ProposalScope = z.infer<typeof scopeSchema>;
export type ProposalCategory = z.infer<typeof categorySchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type CreateArgumentInput = z.infer<typeof createArgumentSchema>;
export type CastBallotInput = z.infer<typeof castBallotSchema>;
export type AssistDraftInput = z.infer<typeof assistDraftSchema>;
export type ReviseProposalInput = z.infer<typeof reviseProposalSchema>;
export type WithdrawProposalInput = z.infer<typeof withdrawProposalSchema>;
export type AppealProposalInput = z.infer<typeof appealProposalSchema>;
export type ModerationDecisionInput = z.infer<typeof moderationDecisionSchema>;
export type InstitutionalResponseInput = z.infer<typeof institutionalResponseSchema>;

export interface ModerationCaseRecord {
  id: string;
  proposalId: string;
  kind: "initial_review" | "appeal";
  status: "open" | "resolved";
  reason: string;
  openedAt: string;
  resolvedAt?: string;
  reviewers: string[];
  pendingDecision?: {
    status: ModerationDecisionInput["status"];
    note: string;
    duplicateOf?: string;
  };
}

export interface InstitutionalResponseRecord {
  institution: string;
  status: "awaiting_response" | "responded" | "no_response";
  responseText?: string;
  sourceUrl?: string;
  updatedAt: string;
}

export interface ArgumentRecord {
  id: string;
  position: "for" | "against";
  body: string;
  evidence: EvidenceItem[];
  pseudonym: string;
  publicAuthorName?: string;
  createdAt: string;
}

export interface ProposalRecord {
  id: string;
  title: string;
  summary: string;
  problem: string;
  proposedChange: string;
  scope: ProposalScope;
  location?: string;
  category: ProposalCategory;
  evidence: EvidenceItem[];
  pseudonym: string;
  publicAuthorName?: string;
  status: ProposalStatus;
  revisionNumber: number;
  duplicateOf?: string;
  appealStatus?: "open" | "resolved";
  institutionalResponse?: InstitutionalResponseRecord;
  closedResult?: {
    turnout: number;
    support: number;
    oppose: number;
    closedAt: string;
  };
  votingRound?: {
    id: string;
    opensAt: string;
    closesAt: string;
    turnout: number;
  };
  arguments: ArgumentRecord[];
  statusHistory: Array<{
    status: ProposalStatus;
    at: string;
    note: string;
  }>;
}

export interface BallotReceipt {
  receipt: string;
  acceptedAt: string;
  commitment: string;
  result: {
    turnout: number;
    support: number;
    oppose: number;
  };
}
