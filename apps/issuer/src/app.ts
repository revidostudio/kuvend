import { createHmac, generateKeyPairSync, randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import { otpCheckSchema, otpStartSchema } from "@kuvend/contracts";
import { createMembershipSnapshot } from "@kuvend/credential/server";
import Fastify from "fastify";
import { OtpProviderError, type OtpProvider } from "./otp-provider.js";
import { PreludeOtpProvider } from "./prelude-provider.js";
import { SentDmOtpProvider } from "./sentdm-provider.js";
import { DevelopmentOtpProvider } from "./development-provider.js";
import { MemoryChallengeStore, type ChallengeStore } from "./challenge-store.js";

function configuredProvider(): OtpProvider {
  const provider = process.env.OTP_PROVIDER ?? "development";
  if (provider === "development") return new DevelopmentOtpProvider();
  if (provider === "prelude") {
    return new PreludeOtpProvider({
      apiKey: process.env.PRELUDE_API_KEY ?? "",
      ...(process.env.PRELUDE_BASE_URL ? { baseUrl: process.env.PRELUDE_BASE_URL } : {}),
      ...(process.env.PRELUDE_SENDER_ID ? { senderId: process.env.PRELUDE_SENDER_ID } : {}),
    });
  }
  if (provider === "sentdm") {
    return new SentDmOtpProvider({
      apiKey: process.env.SENTDM_API_KEY ?? "",
      templateId: process.env.SENTDM_TEMPLATE_ID ?? "",
      verificationKey: process.env.SENTDM_OTP_KEY ?? "",
      ...(process.env.SENTDM_BASE_URL ? { baseUrl: process.env.SENTDM_BASE_URL } : {}),
      ...(process.env.SENTDM_CODE_PARAMETER
        ? { codeParameter: process.env.SENTDM_CODE_PARAMETER }
        : {}),
    });
  }
  throw new Error(`Unsupported OTP_PROVIDER: ${provider}`);
}

function digestPhone(phone: string, key: string): string {
  return createHmac("sha256", key).update(phone).digest("hex");
}

export function buildApp(
  options: {
    provider?: OtpProvider;
    store?: ChallengeStore;
    allowDevelopmentParticipation?: boolean;
    membershipPrivateKey?: string;
  } = {},
) {
  const app = Fastify({ logger: false, bodyLimit: 2_000 });
  const challenges = options.store ?? new MemoryChallengeStore();
  const provider = options.provider ?? configuredProvider();
  const developmentParticipationAllowed =
    options.allowDevelopmentParticipation ?? process.env.ALLOW_DEVELOPMENT_PARTICIPATION === "true";
  const developmentKey = developmentParticipationAllowed
    ? generateKeyPairSync("ed25519").privateKey.export({ type: "pkcs8", format: "pem" }).toString()
    : "";
  const membershipPrivateKey =
    options.membershipPrivateKey ??
    (process.env.ISSUER_MEMBERSHIP_PRIVATE_KEY_B64
      ? Buffer.from(process.env.ISSUER_MEMBERSHIP_PRIVATE_KEY_B64, "base64").toString("utf8")
      : developmentKey);
  const participationOpen =
    Boolean(membershipPrivateKey) &&
    (provider.id !== "development" || developmentParticipationAllowed);
  const digestKey = process.env.ISSUER_DIGEST_KEY ?? "development-digest-key";
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  void app.register(cors, {
    origin: [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /^http:\/\/\[::1\]:\d+$/,
      /^https:\/\/([a-z0-9-]+\.)?kuvend\.org$/,
      ...configuredOrigins,
    ],
    methods: ["GET", "POST"],
  });

  app.get("/health", async () => ({
    ok: true,
    otpProvider: provider.id,
    realMessageDelivery: provider.sendsRealMessages,
    participationOpen,
    credentialProtocol: "semaphore-v4",
    operator: "kuvend-beta",
    challengeStore: challenges.kind,
  }));

  async function currentSnapshot() {
    const members = await challenges.activeCommitments();
    return createMembershipSnapshot(members, membershipPrivateKey, {
      epoch: process.env.ISSUER_MEMBERSHIP_EPOCH ?? "v1",
    });
  }

  app.get("/v1/membership", async (_request, reply) => {
    if (!participationOpen) return reply.code(503).send({ error: "verification_not_available" });
    const members = await challenges.activeCommitments();
    if (members.length < 3) {
      return reply
        .code(425)
        .send({ error: "anonymity_set_not_ready", memberCount: members.length });
    }
    return {
      snapshot: createMembershipSnapshot(members, membershipPrivateKey, {
        epoch: process.env.ISSUER_MEMBERSHIP_EPOCH ?? "v1",
      }),
    };
  });

  app.post("/v1/otp/start", async (request, reply) => {
    if (!participationOpen) {
      return reply.code(503).send({ error: "verification_not_available" });
    }
    const parsed = otpStartSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_phone" });
    const phoneDigest = digestPhone(parsed.data.phone, digestKey);
    await challenges.prune();
    const rateLimit = await challenges.allowStart(phoneDigest);
    if (!rateLimit.allowed) {
      reply.header("retry-after", String(rateLimit.retryAfterSeconds));
      return reply.code(429).send({ error: "too_many_verification_requests" });
    }
    let verificationState: string | undefined;
    try {
      const startResult = await provider.start(parsed.data.phone);
      verificationState = startResult?.verificationState;
    } catch (error) {
      if (error instanceof OtpProviderError) {
        return reply.code(error.statusCode).send({ error: error.publicCode });
      }
      return reply.code(503).send({ error: "verification_provider_unavailable" });
    }
    const challengeId = randomUUID();
    await challenges.put({
      id: challengeId,
      phoneDigest,
      ...(verificationState ? { verificationState } : {}),
      expiresAt: Date.now() + 5 * 60_000,
      attempts: 0,
      identityCommitment: parsed.data.identityCommitment,
    });
    return reply.code(201).send({
      challengeId,
      expiresInSeconds: 300,
      ...(provider.id === "development" ? { developmentCode: "123456" } : {}),
      otpProvider: provider.id,
      credentialProtocol: "semaphore-v4",
    });
  });

  app.post("/v1/otp/check", async (request, reply) => {
    if (!participationOpen) {
      return reply.code(503).send({ error: "verification_not_available" });
    }
    const parsed = otpCheckSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "invalid_challenge" });
    const challenge = await challenges.get(parsed.data.challengeId);
    if (!challenge || challenge.expiresAt < Date.now()) {
      await challenges.delete(parsed.data.challengeId);
      return reply.code(410).send({ error: "challenge_expired" });
    }
    if (digestPhone(parsed.data.phone, digestKey) !== challenge.phoneDigest) {
      return reply.code(400).send({ error: "invalid_challenge" });
    }
    if (parsed.data.identityCommitment !== challenge.identityCommitment) {
      return reply.code(400).send({ error: "invalid_challenge" });
    }
    const attempts = await challenges.incrementAttempts(parsed.data.challengeId);
    if (attempts > 5) return reply.code(429).send({ error: "too_many_attempts" });
    let result;
    try {
      result = await provider.check(
        parsed.data.phone,
        parsed.data.code,
        challenge.verificationState,
      );
    } catch (error) {
      if (error instanceof OtpProviderError) {
        return reply.code(error.statusCode).send({ error: error.publicCode });
      }
      return reply.code(503).send({ error: "verification_provider_unavailable" });
    }
    if (result === "expired") {
      await challenges.delete(parsed.data.challengeId);
      return reply.code(410).send({ error: "challenge_expired" });
    }
    if (result !== "valid") return reply.code(401).send({ error: "incorrect_code" });
    const membershipExpiresAt = Date.now() + 30 * 24 * 60 * 60_000;
    const membership = await challenges.putMembership({
      phoneDigest: challenge.phoneDigest,
      identityCommitment: challenge.identityCommitment,
      expiresAt: membershipExpiresAt,
    });
    if (membership === "conflict") {
      return reply.code(409).send({ error: "active_membership_exists" });
    }
    await challenges.delete(parsed.data.challengeId);
    return {
      snapshot: await currentSnapshot(),
      membershipExpiresAt: new Date(membershipExpiresAt).toISOString(),
      expiresInDays: 30,
      credentialProtocol: "semaphore-v4",
      otpProvider: provider.id,
      privacyNotice:
        provider.id === "sentdm"
          ? "Shërbimet e propozimeve dhe votimit të Kuvend nuk marrin numrin tuaj. Sent e dërgon kodin nga dërguesi i vet; shërbimi i izoluar, Sent dhe WhatsApp (Meta) e përpunojnë numrin vetëm për këtë dërgesë."
          : "Shërbimet e propozimeve dhe votimit të Kuvend nuk marrin numrin tuaj. Në këtë beta, shërbimi i izoluar i verifikimit i Kuvend e përpunon përkohësisht.",
    };
  });

  return app;
}
