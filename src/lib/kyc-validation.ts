// Pure (no external deps) KYC field validators — safe to import in both the
// client form (src/components/dashboard/kyc-form.tsx) and the API route
// (src/app/api/kyc/route.ts) so validation runs on the browser AND the server.

export type KycFieldResult = { valid: boolean; message?: string; normalized?: string };

// Letters plus the punctuation real names use. No digits.
const NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;
const NATIONALITY_RE = /^[A-Za-z][A-Za-z -]*$/;

export function validateFullName(name: string): KycFieldResult {
  const v = (name ?? "").trim().replace(/\s+/g, " ");
  if (!v) return { valid: false, message: "Full legal name is required." };
  if (v.length < 2) return { valid: false, message: "Full legal name must be at least 2 characters." };
  if (/\d/.test(v)) return { valid: false, message: "Name cannot contain numbers." };
  if (!NAME_RE.test(v)) {
    return { valid: false, message: "Name can only contain letters, spaces, apostrophes, hyphens and periods." };
  }
  return { valid: true, normalized: v };
}

export function validateNationality(value: string): KycFieldResult {
  const v = (value ?? "").trim().replace(/\s+/g, " ");
  if (!v) return { valid: true, normalized: "" }; // optional field
  if (/\d/.test(v)) return { valid: false, message: "Nationality cannot contain numbers." };
  if (!NATIONALITY_RE.test(v)) {
    return { valid: false, message: "Nationality can only contain letters." };
  }
  return { valid: true, normalized: v };
}

// ─── Government ID formats (India) ───────────────────────────────────────────
export type IdRule = {
  placeholder: string;
  example: string;
  strip?: RegExp;   // characters to remove before testing (spaces/hyphens)
  upper?: boolean;  // uppercase before testing
  regex: RegExp;
  message: string;
};

export const ID_RULES: Record<string, IdRule> = {
  Aadhaar: {
    placeholder: "12-digit Aadhaar number",
    example: "2345 6789 0123",
    strip: /[\s-]/g,
    regex: /^[2-9][0-9]{11}$/,
    message: "Aadhaar must be exactly 12 digits and cannot start with 0 or 1.",
  },
  "PAN Card": {
    placeholder: "ABCDE1234F",
    example: "ABCDE1234F",
    upper: true,
    regex: /^[A-Z]{5}[0-9]{4}[A-Z]$/,
    message: "PAN must be 5 letters, then 4 digits, then 1 letter (e.g. ABCDE1234F).",
  },
  Passport: {
    placeholder: "A1234567",
    example: "A1234567",
    upper: true,
    regex: /^[A-PR-WY][0-9]{7}$/,
    message: "Passport must be 1 letter followed by 7 digits (e.g. A1234567).",
  },
  "Driving Licence": {
    placeholder: "MH12 20110012345",
    example: "MH12 20110012345",
    strip: /[\s-]/g,
    upper: true,
    regex: /^[A-Z]{2}[0-9]{2}(19|20)[0-9]{2}[0-9]{7}$/,
    message: "Driving Licence must be 2 letters + 2-digit RTO code + 4-digit year + 7-digit number (e.g. MH12 2011 0012345).",
  },
  "Voter ID": {
    placeholder: "ABC1234567",
    example: "ABC1234567",
    upper: true,
    regex: /^[A-Z]{3}[0-9]{7}$/,
    message: "Voter ID (EPIC) must be 3 letters followed by 7 digits (e.g. ABC1234567).",
  },
};

// Accept a few aliases that older records / other forms use.
const ID_ALIASES: Record<string, string> = {
  PAN: "PAN Card",
  Pan: "PAN Card",
  Aadhar: "Aadhaar",
  AADHAAR: "Aadhaar",
  "Driving License": "Driving Licence",
  "Voter ID / EPIC": "Voter ID",
  EPIC: "Voter ID",
};

export function resolveIdRule(idType: string): { key: string; rule?: IdRule } {
  const key = ID_RULES[idType] ? idType : ID_ALIASES[idType] ?? idType;
  return { key, rule: ID_RULES[key] };
}

export function validateIdNumber(idType: string, idNumber: string): KycFieldResult {
  let v = (idNumber ?? "").trim();
  if (!v) return { valid: false, message: "ID number is required." };

  const { rule } = resolveIdRule(idType);
  if (!rule) {
    // Unknown type — allow only letters/digits, min length.
    const cleaned = v.toUpperCase();
    if (!/^[A-Z0-9]{4,20}$/.test(cleaned)) {
      return { valid: false, message: "Enter a valid ID number (letters and digits only)." };
    }
    return { valid: true, normalized: cleaned };
  }

  if (rule.strip) v = v.replace(rule.strip, "");
  if (rule.upper) v = v.toUpperCase();
  if (!rule.regex.test(v)) return { valid: false, message: rule.message };
  return { valid: true, normalized: v };
}
