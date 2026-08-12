import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { OtpProviderError, type OtpCheckResult, type OtpProvider } from "./otp-provider.js";

type FetchLike = typeof fetch;

interface SentDmProviderOptions {
  apiKey: string;
  templateId: string;
  verificationKey: string;
  baseUrl?: string;
  codeParameter?: string;
  fetchImpl?: FetchLike;
}

function otpDigest(code: string, key: string) {
  return createHmac("sha256", key).update(code).digest("hex");
}

export class SentDmOtpProvider implements OtpProvider {
  readonly id = "sentdm" as const;
  readonly sendsRealMessages = true;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly codeParameter: string;

  constructor(private readonly options: SentDmProviderOptions) {
    if (!options.apiKey || options.apiKey.startsWith("PLACEHOLDER_")) {
      throw new Error("A real SENTDM_API_KEY is required when OTP_PROVIDER=sentdm");
    }
    if (!options.templateId) {
      throw new Error("SENTDM_TEMPLATE_ID is required when OTP_PROVIDER=sentdm");
    }
    if (options.verificationKey.length < 32) {
      throw new Error("SENTDM_OTP_KEY must contain at least 32 characters");
    }
    this.baseUrl = (options.baseUrl ?? "https://api.sent.dm").replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
    // Sent authentication templates expose the one-time code as `var_1`.
    // Keep this configurable for future templates, but make the provider's
    // safe default match Sent's published template contract.
    this.codeParameter = options.codeParameter ?? "var_1";
  }

  async start(phone: string) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}/v3/messages`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "idempotency-key": randomUUID(),
          "x-api-key": this.options.apiKey,
        },
        body: JSON.stringify({
          to: [phone],
          channel: ["whatsapp"],
          template: {
            id: this.options.templateId,
            parameters: { [this.codeParameter]: code },
          },
          sandbox: false,
        }),
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new OtpProviderError("verification_provider_unavailable", 503);
    }

    if (response.status === 429) {
      throw new OtpProviderError("too_many_verification_requests", 429);
    }
    if (!response.ok) {
      throw new OtpProviderError(
        response.status >= 500 || [401, 402, 403, 404].includes(response.status)
          ? "verification_provider_unavailable"
          : "verification_unavailable",
        response.status >= 500 || [401, 402, 403, 404].includes(response.status) ? 503 : 400,
      );
    }

    const payload = (await response.json().catch(() => undefined)) as
      { success?: boolean } | undefined;
    if (!payload?.success) {
      throw new OtpProviderError("verification_provider_unavailable", 503);
    }
    return { verificationState: otpDigest(code, this.options.verificationKey) };
  }

  async check(_phone: string, code: string, verificationState?: string): Promise<OtpCheckResult> {
    if (!verificationState || !/^[a-f0-9]{64}$/.test(verificationState)) return "expired";
    const received = Buffer.from(otpDigest(code, this.options.verificationKey), "hex");
    const expected = Buffer.from(verificationState, "hex");
    return received.length === expected.length && timingSafeEqual(received, expected)
      ? "valid"
      : "invalid";
  }
}
