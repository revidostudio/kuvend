import { describe, expect, it, vi } from "vitest";
import { SentDmOtpProvider } from "./sentdm-provider.js";

const verificationKey = "test-verification-key-with-at-least-32-characters";

describe("SentDmOtpProvider", () => {
  it("uses WhatsApp only and verifies the locally held OTP digest", async () => {
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const request = JSON.parse(String(init?.body)) as {
        to: string[];
        channel: string[];
        template: { id: string; parameters: { code: string } };
        sandbox: boolean;
      };
      expect(request.to).toEqual(["+355691234567"]);
      expect(request.channel).toEqual(["whatsapp"]);
      expect(request.template.id).toBe("otp-template");
      expect(request.template.parameters.code).toMatch(/^\d{6}$/);
      expect(request.sandbox).toBe(false);
      return new Response(JSON.stringify({ success: true }), { status: 202 });
    });
    const provider = new SentDmOtpProvider({
      apiKey: "sk_test_example",
      templateId: "otp-template",
      verificationKey,
      fetchImpl: fetchImpl as typeof fetch,
    });

    const started = await provider.start("+355691234567");
    const body = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as {
      template: { parameters: { code: string } };
    };
    expect(started.verificationState).toMatch(/^[a-f0-9]{64}$/);
    expect(
      await provider.check(
        "+355691234567",
        body.template.parameters.code,
        started.verificationState,
      ),
    ).toBe("valid");
    expect(await provider.check("+355691234567", "000000", started.verificationState)).toBe(
      "invalid",
    );
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
});
