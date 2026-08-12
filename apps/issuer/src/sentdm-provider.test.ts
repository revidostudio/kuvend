import { describe, expect, it, vi } from "vitest";
import { SentDmOtpProvider } from "./sentdm-provider.js";
import { OtpProviderError } from "./otp-provider.js";

const verificationKey = "test-verification-key-with-at-least-32-characters";

describe("SentDmOtpProvider", () => {
  it("uses WhatsApp only and verifies the locally held OTP digest", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).endsWith("/v3/messages/message-1")) {
        return new Response(JSON.stringify({ success: true, data: { status: "QUEUED" } }));
      }
      const request = JSON.parse(String(init?.body)) as {
        to: string[];
        channel: string[];
        template: { id: string; parameters: { var_1: string } };
        sandbox: boolean;
      };
      expect(request.to).toEqual(["+355691234567"]);
      expect(request.channel).toEqual(["whatsapp"]);
      expect(request.template.id).toBe("otp-template");
      expect(request.template.parameters.var_1).toMatch(/^\d{6}$/);
      expect(request.sandbox).toBe(false);
      return new Response(
        JSON.stringify({
          success: true,
          data: { recipients: [{ message_id: "message-1" }] },
        }),
        { status: 202 },
      );
    });
    const provider = new SentDmOtpProvider({
      apiKey: "sk_test_example",
      templateId: "otp-template",
      verificationKey,
      fetchImpl: fetchImpl as typeof fetch,
      deliveryCheckDelayMs: 0,
    });

    const started = await provider.start("+355691234567");
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as {
      template: { parameters: { var_1: string } };
    };
    expect(started.verificationState).toMatch(/^[a-f0-9]{64}$/);
    expect(
      await provider.check(
        "+355691234567",
        body.template.parameters.var_1,
        started.verificationState,
      ),
    ).toBe("valid");
    expect(await provider.check("+355691234567", "000000", started.verificationState)).toBe(
      "invalid",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("rejects a message that Sent accepts and immediately marks failed", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { recipients: [{ message_id: "failed-message" }] },
          }),
          { status: 202 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: { status: "FAILED" } })),
      );
    const provider = new SentDmOtpProvider({
      apiKey: "sk_test_example",
      templateId: "otp-template",
      verificationKey,
      fetchImpl: fetchImpl as typeof fetch,
      deliveryCheckDelayMs: 0,
    });

    await expect(provider.start("+17653987177")).rejects.toMatchObject({
      publicCode: "verification_unavailable",
      statusCode: 400,
    });
    expect(fetchImpl.mock.calls[1]?.[0]).toBe("https://api.sent.dm/v3/messages/failed-message");
  });

  it("rejects placeholder credentials and missing template configuration", () => {
    expect(
      () =>
        new SentDmOtpProvider({
          apiKey: "PLACEHOLDER_REPLACE_WITH_REAL_SENTDM_API_KEY",
          templateId: "otp-template",
          verificationKey,
        }),
    ).toThrow(/real SENTDM_API_KEY/);
    expect(
      () =>
        new SentDmOtpProvider({
          apiKey: "sk_test_example",
          templateId: "",
          verificationKey,
        }),
    ).toThrow(/SENTDM_TEMPLATE_ID/);
  });

  it("does not return the phone number or OTP in provider state", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ success: true }), { status: 202 }),
    );
    const provider = new SentDmOtpProvider({
      apiKey: "sk_test_example",
      templateId: "otp-template",
      verificationKey,
      fetchImpl: fetchImpl as typeof fetch,
    });
    const started = await provider.start("+355691234567");
    expect(JSON.stringify(started)).not.toContain("+355691234567");
    expect(JSON.stringify(started)).not.toMatch(/"\d{6}"/);
  });

  it("uses the configured template parameter without sending civic identifiers", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as Record<string, unknown>;
      expect(request).toMatchObject({
        channel: ["whatsapp"],
        template: { id: "otp-template", parameters: { var_1: expect.stringMatching(/^\d{6}$/) } },
        sandbox: false,
      });
      expect(JSON.stringify(request)).not.toMatch(
        /identity|proposal|ballot|vote|receipt|capability|pseudonym/i,
      );
      return new Response(JSON.stringify({ success: true }), { status: 202 });
    });
    const provider = new SentDmOtpProvider({
      apiKey: "sk_test_example",
      templateId: "otp-template",
      verificationKey,
      codeParameter: "var_1",
      fetchImpl: fetchImpl as typeof fetch,
    });

    await provider.start("+355691234567");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it.each([
    [429, "too_many_verification_requests", 429],
    [401, "verification_provider_unavailable", 503],
    [403, "verification_provider_unavailable", 503],
    [422, "verification_unavailable", 400],
    [500, "verification_provider_unavailable", 503],
  ] as const)("maps Sent HTTP %i to %s", async (providerStatus, publicCode, publicStatus) => {
    const provider = new SentDmOtpProvider({
      apiKey: "sk_test_example",
      templateId: "otp-template",
      verificationKey,
      fetchImpl: (async () =>
        new Response(JSON.stringify({ success: false }), {
          status: providerStatus,
        })) as typeof fetch,
    });

    await expect(provider.start("+355691234567")).rejects.toMatchObject({
      name: "OtpProviderError",
      publicCode,
      statusCode: publicStatus,
    } satisfies Partial<OtpProviderError>);
  });

  it("fails closed on a successful HTTP response without a success envelope", async () => {
    const provider = new SentDmOtpProvider({
      apiKey: "sk_test_example",
      templateId: "otp-template",
      verificationKey,
      fetchImpl: (async () =>
        new Response(JSON.stringify({ success: false }), { status: 202 })) as typeof fetch,
    });

    await expect(provider.start("+355691234567")).rejects.toMatchObject({
      publicCode: "verification_provider_unavailable",
      statusCode: 503,
    });
  });

  it("fails closed when Sent times out or cannot be reached", async () => {
    const provider = new SentDmOtpProvider({
      apiKey: "sk_test_example",
      templateId: "otp-template",
      verificationKey,
      fetchImpl: (async () => {
        throw new TypeError("network unavailable");
      }) as typeof fetch,
    });

    await expect(provider.start("+355691234567")).rejects.toMatchObject({
      publicCode: "verification_provider_unavailable",
      statusCode: 503,
    });
  });
});
