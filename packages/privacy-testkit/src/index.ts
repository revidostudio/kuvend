const forbiddenKeys = new Set([
  "phone",
  "phoneNumber",
  "otp",
  "otpCode",
  "userId",
  "authUserId",
  "issuerSessionId",
  "sourceIp",
  "ipAddress",
]);

const phonePattern = /\+[1-9]\d{7,14}/;

export function findForbiddenCivicData(value: unknown, path = "$"): string[] {
  const findings: string[] = [];
  if (typeof value === "string" && phonePattern.test(value))
    findings.push(`${path}:phone-like-value`);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      findings.push(...findForbiddenCivicData(item, `${path}[${index}]`)),
    );
    return findings;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenKeys.has(key)) findings.push(`${path}.${key}`);
      findings.push(...findForbiddenCivicData(child, `${path}.${key}`));
    }
  }
  return findings;
}

export function assertCivicSafe(value: unknown): void {
  const findings = findForbiddenCivicData(value);
  if (findings.length > 0) throw new Error(`Forbidden civic data: ${findings.join(", ")}`);
}

export const forbiddenCivicKeys = [...forbiddenKeys];
