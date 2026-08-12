export type OtpCheckResult = "valid" | "invalid" | "expired";
export type OtpDeliveryChannel = "whatsapp" | "sms";

export interface OtpStartResult {
  verificationState?: string;
}

export interface OtpProvider {
  readonly id: "development" | "sentdm";
  readonly sendsRealMessages: boolean;
  start(phone: string, deliveryChannel?: OtpDeliveryChannel): Promise<OtpStartResult | void>;
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
