import { describe, expect, it } from "vitest";
import { countryHint } from "./country-hint";

describe("country hint", () => {
  it("accepts a supported Cloudflare country code", () => {
    expect(countryHint("it")).toBe("IT");
  });

  it("falls back to Albania without retaining request data", () => {
    expect(countryHint(null)).toBe("AL");
    expect(countryHint("XX")).toBe("AL");
  });
});
