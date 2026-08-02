import { describe, expect, it, vi } from "vitest";
import { PreludeOtpProvider } from "./prelude-provider.js";

describe("PreludeOtpProvider", () => {
  it("uses only the minimal server-side Verify payload", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "vrf_test", status: "success", method: "message" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "vrf_test", status: "success" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const provider = new PreludeOtpProvider({
      apiKey: "test-key",
      baseUrl: "https://prelude.example",
      fetchImpl,
    });

    await provider.start("+355691234567");
    await expect(provider.check("+355691234567", "654321")).resolves.toBe("valid");

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      "https://prelude.example/v2/verification",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          target: { type: "phone_number", value: "+355691234567" },
          options: { code_size: 6 },
        }),
      }),
    );
    const firstBody = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body));
    expect(firstBody).not.toHaveProperty("metadata");
    expect(firstBody).not.toHaveProperty("signals");
    expect(firstBody).not.toHaveProperty("dispatch_id");
  });

  it("does not expose Prelude response details when a verification is blocked", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: "blocked",
          reason: "suspicious",
          risk_factors: ["temporary_phone_number"],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const provider = new PreludeOtpProvider({ apiKey: "test-key", fetchImpl });
    await expect(provider.start("+355691234567")).rejects.toMatchObject({
      publicCode: "verification_blocked",
      statusCode: 403,
    });
  });
});
