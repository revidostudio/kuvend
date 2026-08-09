import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import countries from "i18n-iso-countries";
import albanianCountries from "i18n-iso-countries/langs/sq.json";

countries.registerLocale(albanianCountries);

export const phoneCountries = getCountries()
  .map((country) => ({
    country,
    callingCode: getCountryCallingCode(country),
    label: countries.getName(country, "sq") ?? country,
  }))
  .sort((left, right) => left.label.localeCompare(right.label, "sq-AL"));

export function internationalPhone(country: CountryCode, nationalNumber: string) {
  const parsed = parsePhoneNumberFromString(nationalNumber, country);
  return parsed?.isValid() ? parsed.number : undefined;
}

export function countryLabel(country: CountryCode) {
  const option = phoneCountries.find((item) => item.country === country);
  return option ? `${option.label} (+${option.callingCode})` : country;
}
