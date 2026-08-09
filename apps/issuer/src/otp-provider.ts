export type OtpCheckResult = "valid" | "invalid" | "expired";

export interface OtpStartResult {
  verificationState?: string;
}

export interface OtpProvider {
  readonly id: "synthetic" | "prelude" | "sentdm";
  readonly sendsRealMessages: boolean;
  start(phone: string): Promise<OtpStartResult | void>;
  check(phone: string, code: string, verificationState?: string): Promise<OtpCheckResult>;
}

export class OtpProviderError extends Error {
  constructor(
    readonly publicCode: string,
    readonly statusCode: number,
  ) {
    super(publicCode);
    this.name = "OtpProviderError";
  }
}
