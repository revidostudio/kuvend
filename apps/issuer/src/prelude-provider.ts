import { OtpProviderError, type OtpCheckResult, type OtpProvider } from "./otp-provider.js";

type FetchLike = typeof fetch;

interface PreludeProviderOptions {
  apiKey: string;
  baseUrl?: string;
  senderId?: string;
  fetchImpl?: FetchLike;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

export class PreludeOtpProvider implements OtpProvider {
  readonly id = "prelude" as const;
  readonly sendsRealMessages = true;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly options: PreludeProviderOptions) {
    if (!options.apiKey) throw new Error("PRELUDE_API_KEY is required when OTP_PROVIDER=prelude");
    this.baseUrl = (options.baseUrl ?? "https://api.prelude.dev").replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  private async request(
    path: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${this.options.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8_000),
      });
    } catch {
      throw new OtpProviderError("verification_provider_unavailable", 503);
    }

    const payload = record(await response.json().catch(() => undefined));
    if (!response.ok) {
      if (response.status === 429) throw new OtpProviderError("too_many_attempts", 429);
      if (response.status >= 500)
        throw new OtpProviderError("verification_provider_unavailable", 503);
      throw new OtpProviderError("verification_unavailable", 400);
    }
    if (!payload) throw new OtpProviderError("verification_provider_unavailable", 503);
    return payload;
  }

  async start(phone: string): Promise<void> {
    const options: Record<string, unknown> = { code_size: 6 };
    if (this.options.senderId) options.sender_id = this.options.senderId;
    const result = await this.request("/v2/verification", {
      target: { type: "phone_number", value: phone },
      options,
    });
    const status = result.status;
    if (status === "blocked") throw new OtpProviderError("verification_blocked", 403);
    if (status !== "success" && status !== "retry" && status !== "challenged") {
      throw new OtpProviderError("verification_provider_unavailable", 503);
    }
  }

  async check(phone: string, code: string): Promise<OtpCheckResult> {
    const result = await this.request("/v2/verification/check", {
      target: { type: "phone_number", value: phone },
      code,
    });
    if (result.status === "success") return "valid";
    if (result.status === "expired_or_not_found") return "expired";
    if (result.status === "failure") return "invalid";
    throw new OtpProviderError("verification_provider_unavailable", 503);
  }
}
