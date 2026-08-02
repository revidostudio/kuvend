import type { OtpCheckResult, OtpProvider } from "./otp-provider.js";

export class SyntheticOtpProvider implements OtpProvider {
  readonly id = "synthetic" as const;
  readonly sendsRealMessages = false;

  async start(_phone: string): Promise<void> {}

  async check(_phone: string, code: string): Promise<OtpCheckResult> {
    return code === "123456" ? "valid" : "invalid";
  }
}
