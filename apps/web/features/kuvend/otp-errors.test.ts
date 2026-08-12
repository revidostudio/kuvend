import { describe, expect, it } from "vitest";
import { otpStartErrorMessage } from "./otp-errors";

describe("otpStartErrorMessage", () => {
  it.each(["verification_not_available", "verification_provider_unavailable"])(
    "identifies %s as a service outage without blaming the phone number",
    (error) => {
      const message = otpStartErrorMessage(error);

      expect(message).toContain("Shërbimi i verifikimit");
      expect(message).toContain("Numri yt nuk është problemi");
    },
  );

  it.each(["verification_blocked", "too_many_attempts", "too_many_verification_requests"])(
    "uses a retry-later message for %s",
    (error) => {
      expect(otpStartErrorMessage(error)).toBe(
        "Nuk mund të dërgohet një kod tani. Provo përsëri më vonë.",
      );
    },
  );

  it.each(["verification_unavailable", "invalid_phone", undefined, null])(
    "uses the delivery fallback for %s",
    (error) => {
      expect(otpStartErrorMessage(error)).toContain("Kontrollo numrin");
    },
  );
});
