import { getCountries, type CountryCode } from "libphonenumber-js";

const supportedCountries = new Set<string>(getCountries());

export function countryHint(value: string | null | undefined): CountryCode {
  const candidate = value?.trim().toUpperCase();
  return candidate && supportedCountries.has(candidate) ? (candidate as CountryCode) : "AL";
}
