import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import type { OtpProvider } from "./otp-provider.js";
import { MemoryChallengeStore } from "./challenge-store.js";

describe("synthetic issuer", () => {
  it("allows an explicitly configured deployment origin", async () => {
    const previous = process.env.CORS_ALLOWED_ORIGINS;
    process.env.CORS_ALLOWED_ORIGINS = "https://web.example.test";
    const app = buildApp();
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

  it("issues a credential without echoing a phone number", async () => {
    const app = buildApp();
    const started = await app.inject({
      method: "POST",
      url: "/v1/otp/start",
      payload: { phone: "+355691234567" },
    });
    expect(started.statusCode).toBe(201);
    expect(started.body).not.toContain("+355691234567");
    const challengeId = started.json().challengeId as string;
    const checked = await app.inject({
      method: "POST",
      url: "/v1/otp/check",
      payload: { challengeId, phone: "+355691234567", code: "123456" },
    });
    expect(checked.statusCode).toBe(200);
    expect(checked.json().credential).toMatch(/^synthetic\./);
    expect(checked.body).not.toContain("+355691234567");
    await app.close();
  });

  it("binds a challenge to the same phone without storing it in the response", async () => {
    let checked = false;
    const provider: OtpProvider = {
      id: "prelude",
      sendsRealMessages: true,
      async start() {},
      async check() {
        checked = true;
        return "valid";
      },
    };
    const app = buildApp({ provider });
    const started = await app.inject({
      method: "POST",
      url: "/v1/otp/start",
      payload: { phone: "+355691234567" },
    });
    const rejected = await app.inject({
      method: "POST",
      url: "/v1/otp/check",
      payload: {
        challengeId: started.json().challengeId,
        phone: "+355692222222",
        code: "123456",
      },
    });
    expect(rejected.statusCode).toBe(400);
    expect(checked).toBe(false);
    expect(rejected.body).not.toContain("+355");
    await app.close();
  });

  it("expires durable challenges without retaining a plaintext phone", async () => {
    const store = new MemoryChallengeStore();
    await store.put({
      id: "00000000-0000-4000-8000-000000000000",
      phoneDigest: "digest",
      expiresAt: 1,
      attempts: 0,
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
      id: "synthetic",
      sendsRealMessages: false,
      async start() {
        starts += 1;
      },
      async check() {
        return "valid";
      },
    };
    const app = buildApp({ provider });
    for (let index = 0; index < 3; index += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/v1/otp/start",
        payload: { phone: "+355691234567" },
      });
      expect(response.statusCode).toBe(201);
    }
    const limited = await app.inject({
      method: "POST",
      url: "/v1/otp/start",
      payload: { phone: "+355691234567" },
    });
    expect(limited.statusCode).toBe(429);
    expect(limited.headers["retry-after"]).toBeTruthy();
    expect(starts).toBe(3);
    await app.close();
  });
});
