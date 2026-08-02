export type OtpCheckResult = "valid" | "invalid" | "expired";

export interface OtpProvider {
  readonly id: "synthetic" | "prelude";
  readonly sendsRealMessages: boolean;
  start(phone: string): Promise<void>;
  check(phone: string, code: string): Promise<OtpCheckResult>;
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
