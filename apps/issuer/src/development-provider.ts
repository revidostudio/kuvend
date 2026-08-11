import type { OtpCheckResult, OtpProvider } from "./otp-provider.js";

/** Local-only provider. It never sends a message and cannot be enabled without an explicit flag. */
export class DevelopmentOtpProvider implements OtpProvider {
  readonly id = "development" as const;
  readonly sendsRealMessages = false;

  async start(_phone: string): Promise<void> {}

  async check(_phone: string, code: string): Promise<OtpCheckResult> {
    return code === "123456" ? "valid" : "invalid";
  }
}
