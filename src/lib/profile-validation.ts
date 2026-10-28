/**
 * Validation for the self-serve profile address fields — shared by the client
 * form (inline errors) and the server API (authoritative), so a bad value can't
 * be saved by bypassing the UI.
 *
 * Rules: city/state are names (no digits); ZIP is a plausible postal code
 * (6 digits for India, else alphanumeric with at least one digit).
 */
export type AddressInput = {
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
};

export function validateAddressFields(input: AddressInput): Record<string, string> {
  const errors: Record<string, string> = {};
  const city = (input.city ?? "").trim();
  const state = (input.state ?? "").trim();
  const zip = (input.zip ?? "").trim();
  const country = (input.country ?? "").trim().toUpperCase();

  if (city) {
    if (/\d/.test(city)) errors.city = "City can't contain numbers.";
    else if (city.length < 2) errors.city = "Enter a valid city.";
  }

  if (state) {
    if (/\d/.test(state)) errors.state = "State / region can't contain numbers.";
    else if (state.length < 2) errors.state = "Enter a valid state / region.";
  }

  if (zip) {
    if (country === "IN") {
      if (!/^\d{6}$/.test(zip)) errors.zip = "Enter a valid 6-digit PIN code.";
    } else if (!/^(?=.*\d)[A-Za-z0-9][A-Za-z0-9\s-]{2,9}$/.test(zip)) {
      errors.zip = "Enter a valid postal code.";
    }
  }

  return errors;
}
