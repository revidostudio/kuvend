import { describe, expect, it } from "vitest";
import { countryLabel, internationalPhone, phoneCountries } from "./phone-number";

describe("international phone formatting", () => {
  it("normalizes an Albanian national number to E.164", () => {
    expect(internationalPhone("AL", "069 123 4567")).toBe("+355691234567");
  });

  it("supports international participation without accepting invalid numbers", () => {
    expect(internationalPhone("GB", "020 7946 0958")).toBe("+442079460958");
    expect(internationalPhone("US", "202 555 0147")).toBe("+12025550147");
    expect(internationalPhone("AL", "123")).toBeUndefined();
    expect(internationalPhone("US", "not-a-number")).toBeUndefined();
  });

  it("provides an accessible country label and a complete country list", () => {
    expect(countryLabel("AL")).toContain("+355");
    expect(phoneCountries.length).toBeGreaterThan(200);
    expect(phoneCountries.find(({ country }) => country === "US")?.label).toContain(
      "Shtetet e Bashkuara",
    );
  });
});
