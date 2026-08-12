const serviceUnavailableMessage =
  "Shërbimi i verifikimit është përkohësisht i padisponueshëm. Numri yt nuk është problemi; provo përsëri pas pak.";

const rateLimitedMessage = "Nuk mund të dërgohet një kod tani. Provo përsëri më vonë.";

const deliveryUnavailableMessage =
  "WhatsApp nuk mund ta marrë kodin tani. Kontrollo numrin ose provo më vonë.";

export function otpStartErrorMessage(error: unknown): string {
  if (error === "verification_not_available" || error === "verification_provider_unavailable") {
    return serviceUnavailableMessage;
  }
  if (
    error === "verification_blocked" ||
    error === "too_many_attempts" ||
    error === "too_many_verification_requests"
  ) {
    return rateLimitedMessage;
  }
  return deliveryUnavailableMessage;
}
