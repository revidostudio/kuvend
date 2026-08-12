import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { OtpProviderError, type OtpProvider } from "./otp-provider.js";
import { MemoryChallengeStore } from "./challenge-store.js";

const identityCommitment = "123456789";

describe("isolated issuer", () => {
  it("fails closed when the local development provider is not explicitly enabled", async () => {
    const app = buildApp();
    const health = await app.inject({ method: "GET", url: "/health" });
    const started = await app.inject({
      method: "POST",
      url: "/v1/otp/start",
      payload: { phone: "+355691234567", identityCommitment },
    });

    expect(health.json().participationOpen).toBe(false);
    expect(started.statusCode).toBe(503);
    expect(started.json()).toEqual({ error: "verification_not_available" });
    expect(started.body).not.toContain("123456");
    await app.close();
  });

  it("maps the legacy deployment provider name to the fail-closed development adapter", async () => {
    const previousProvider = process.env.OTP_PROVIDER;
    const previousAllowance = process.env.ALLOW_DEVELOPMENT_PARTICIPATION;
    process.env.OTP_PROVIDER = "synthetic";
    delete process.env.ALLOW_DEVELOPMENT_PARTICIPATION;

    try {
      const app = buildApp();
      const health = await app.inject({ method: "GET", url: "/health" });
      const started = await app.inject({
        method: "POST",
        url: "/v1/otp/start",
        payload: { phone: "+355691234567", identityCommitment },
      });

      expect(health.json()).toMatchObject({
        otpProvider: "development",
        realMessageDelivery: false,
        participationOpen: false,
      });
      expect(started.statusCode).toBe(503);
      await app.close();
    } finally {
      if (previousProvider === undefined) delete process.env.OTP_PROVIDER;
      else process.env.OTP_PROVIDER = previousProvider;
      if (previousAllowance === undefined) delete process.env.ALLOW_DEVELOPMENT_PARTICIPATION;
      else process.env.ALLOW_DEVELOPMENT_PARTICIPATION = previousAllowance;
    }
  });

  it("allows an explicitly configured deployment origin", async () => {
    const previous = process.env.CORS_ALLOWED_ORIGINS;
    process.env.CORS_ALLOWED_ORIGINS = "https://web.example.test";
    const app = buildApp({ allowDevelopmentParticipation: true });
    const response = await app.inject({
      method: "OPTIONS",
      url: "/v1/otp/start",
      headers: { origin: "https://web.example.test", "access-control-request-method": "POST" },
    });
    expect(response.headers["access-control-allow-origin"]).toBe("https://web.example.test");
    await app.close();
    if (previous === undefined) delete process.env.CORS_ALLOWED_ORIGINS;
    else process.env.CORS_ALLOWED_ORIGINS = previous;
  });

  it("issues a signed anonymous-membership snapshot without echoing a phone number", async () => {
    const app = buildApp({ allowDevelopmentParticipation: true });
    const started = await app.inject({
      method: "POST",
      url: "/v1/otp/start",
      payload: { phone: "+355691234567", identityCommitment },
    });
    expect(started.statusCode).toBe(201);
    expect(started.body).not.toContain("+355691234567");
    const challengeId = started.json().challengeId as string;
    const checked = await app.inject({
      method: "POST",
      url: "/v1/otp/check",
      payload: { challengeId, phone: "+355691234567", code: "123456", identityCommitment },
    });
    expect(checked.statusCode).toBe(200);
    expect(checked.json().credentialProtocol).toBe("semaphore-v4");
    expect(checked.json().snapshot.members).toContain(identityCommitment);
    expect(checked.body).not.toContain("+355691234567");
    await app.close();
  });

  it("binds a challenge to the same phone without storing it in the response", async () => {
    let checked = false;
    const provider: OtpProvider = {
      id: "sentdm",
      sendsRealMessages: true,
      async start() {},
      async check() {
        checked = true;
        return "valid";
      },
    };
    const app = buildApp({ provider, allowDevelopmentParticipation: true });
    const started = await app.inject({
      method: "POST",
      url: "/v1/otp/start",
      payload: { phone: "+355691234567", identityCommitment },
    });
    const rejected = await app.inject({
      method: "POST",
      url: "/v1/otp/check",
      payload: {
        challengeId: started.json().challengeId,
        phone: "+355692222222",
        code: "123456",
        identityCommitment,
      },
    });
    expect(rejected.statusCode).toBe(400);
    expect(checked).toBe(false);
    expect(rejected.body).not.toContain("+355");
    await app.close();
  });

  it("keeps Sent OTP verification state inside the issuer challenge", async () => {
    let receivedState: string | undefined;
    const provider: OtpProvider = {
      id: "sentdm",
      sendsRealMessages: true,
      async start() {
        return { verificationState: "a".repeat(64) };
      },
      async check(_phone, _code, verificationState) {
        receivedState = verificationState;
        return "valid";
      },
    };
    const app = buildApp({ provider, allowDevelopmentParticipation: true });
    const started = await app.inject({
      method: "POST",
      url: "/v1/otp/start",
      payload: { phone: "+355691234567", identityCommitment },
    });
    expect(started.body).not.toContain("a".repeat(64));
    const checked = await app.inject({
      method: "POST",
      url: "/v1/otp/check",
      payload: {
        challengeId: started.json().challengeId,
        phone: "+355691234567",
        code: "123456",
        identityCommitment,
      },
    });
    expect(checked.statusCode).toBe(200);
    expect(receivedState).toBe("a".repeat(64));
    expect(checked.body).not.toContain("+355691234567");
    await app.close();
  });

  it("expires durable challenges without retaining a plaintext phone", async () => {
    const store = new MemoryChallengeStore();
    await store.put({
      id: "00000000-0000-4000-8000-000000000000",
      phoneDigest: "digest",
      expiresAt: 1,
      attempts: 0,
      identityCommitment: "123",
    });
    expect(JSON.stringify(await store.get("00000000-0000-4000-8000-000000000000"))).not.toContain(
      "+355",
    );
    expect(await store.prune(2)).toBe(1);
    expect(await store.get("00000000-0000-4000-8000-000000000000")).toBeUndefined();
  });

  it("limits repeated verification starts before calling the provider", async () => {
    let starts = 0;
    const provider: OtpProvider = {
      id: "development",
      sendsRealMessages: false,
      async start() {
        starts += 1;
      },
      async check() {
        return "valid";
      },
    };
    const app = buildApp({ provider, allowDevelopmentParticipation: true });
    for (let index = 0; index < 3; index += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/v1/otp/start",
        payload: { phone: "+355691234567", identityCommitment },
      });
      expect(response.statusCode).toBe(201);
    }
    const limited = await app.inject({
      method: "POST",
      url: "/v1/otp/start",
      payload: { phone: "+355691234567", identityCommitment },
    });
    expect(limited.statusCode).toBe(429);
    expect(limited.headers["retry-after"]).toBeTruthy();
    expect(starts).toBe(3);
    await app.close();
  });

  it.each([
    ["verification_provider_unavailable", 503],
    ["verification_unavailable", 400],
    ["too_many_verification_requests", 429],
  ] as const)("preserves the safe provider error %s", async (publicCode, statusCode) => {
    const provider: OtpProvider = {
      id: "sentdm",
      sendsRealMessages: true,
      async start() {
        throw new OtpProviderError(publicCode, statusCode);
      },
      async check() {
        return "valid";
      },
    };
    const app = buildApp({ provider, allowDevelopmentParticipation: true });

    const response = await app.inject({
      method: "POST",
      url: "/v1/otp/start",
      payload: { phone: "+355691234567", identityCommitment },
    });

    expect(response.statusCode).toBe(statusCode);
    expect(response.json()).toEqual({ error: publicCode });
    expect(response.body).not.toContain("+355691234567");
    await app.close();
  });

  it("does not create a challenge when Sent rejects delivery", async () => {
    const store = new MemoryChallengeStore();
    const provider: OtpProvider = {
      id: "sentdm",
      sendsRealMessages: true,
      async start() {
        throw new OtpProviderError("verification_unavailable", 400);
      },
      async check() {
        return "valid";
      },
    };
    const app = buildApp({ provider, store, allowDevelopmentParticipation: true });

    const response = await app.inject({
      method: "POST",
      url: "/v1/otp/start",
      payload: { phone: "+355691234567", identityCommitment },
    });

    expect(response.statusCode).toBe(400);
    expect(await store.activeCommitments()).toEqual([]);
    await app.close();
  });
});
