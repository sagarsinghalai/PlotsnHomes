import { prisma } from "@/lib/prisma";

export type CheckUserExistsResult = {
  exists: boolean;
  field?: "email" | "phone" | "pan" | "aadhar";
  message?: string;
};

export async function checkUserExists4Params({
  email,
  phone,
  pan,
  aadhar,
  excludeUserId,
}: {
  email?: string | null;
  phone?: string | null;
  pan?: string | null;
  aadhar?: string | null;
  excludeUserId?: string | null;
}): Promise<CheckUserExistsResult> {
  const notCurrentUserCondition = excludeUserId ? { id: { not: excludeUserId } } : {};

  // 1. Check Email
  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        ...notCurrentUserCondition,
      },
      select: { id: true, email: true },
    });
    if (existingUser) {
      return {
        exists: true,
        field: "email",
        message: `User already exists with this Email address (${cleanEmail}).`,
      };
    }
  }

  // 2. Check Phone
  if (phone && phone.trim()) {
    const cleanPhone = phone.trim();
    const phoneDigits = cleanPhone.replace(/\D/g, "");
    
    const OR_CONDITIONS: any[] = [{ phone: cleanPhone }];
    if (phoneDigits.length >= 10) {
      const tenDigits = phoneDigits.slice(-10);
      OR_CONDITIONS.push({ phone: { contains: tenDigits } });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: OR_CONDITIONS,
        ...notCurrentUserCondition,
      },
      select: { id: true, phone: true },
    });

    if (existingUser) {
      return {
        exists: true,
        field: "phone",
        message: `User already exists with this Phone number (${cleanPhone}).`,
      };
    }
  }

  // 3. Check PAN Number
  if (pan && pan.trim()) {
    const cleanPan = pan.trim().toUpperCase();
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { pan: cleanPan },
          { kycProfile: { idType: "PAN", idNumber: cleanPan } },
          { kycProfile: { idType: "Pan", idNumber: cleanPan } },
        ],
        ...notCurrentUserCondition,
      },
      select: { id: true },
    });

    if (existingUser) {
      return {
        exists: true,
        field: "pan",
        message: `User already exists with this PAN number (${cleanPan}).`,
      };
    }
  }

  // 4. Check Aadhaar Number
  if (aadhar && aadhar.trim()) {
    const cleanAadhar = aadhar.trim().replace(/\s+/g, "");
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { aadhar: cleanAadhar },
          { kycProfile: { idType: "Aadhaar", idNumber: cleanAadhar } },
          { kycProfile: { idType: "Aadhar", idNumber: cleanAadhar } },
        ],
        ...notCurrentUserCondition,
      },
      select: { id: true },
    });

    if (existingUser) {
      return {
        exists: true,
        field: "aadhar",
        message: `User already exists with this Aadhaar number (${cleanAadhar}).`,
      };
    }
  }

  return { exists: false };
}

export type ValidateDobResult = {
  valid: boolean;
  message?: string;
};

/**
 * Parses multi-format date strings (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY) into a valid Date object.
 */

export function parseDobDate(dob: string | Date | null | undefined): Date | null {
  if (!dob) return null;
  if (dob instanceof Date) return isNaN(dob.getTime()) ? null : dob;
  if (typeof dob !== "string") return null;

  const trimmed = dob.trim();
  if (!trimmed) return null;

  // 1. Standard ISO / YYYY-MM-DD
  let d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;

  // 2. DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const parts = trimmed.split(/[/.-]/);
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);

    // DD/MM/YYYY format (e.g. 19/01/2004 or 19/01/04)
    if (p1 > 0 && p1 <= 31 && p2 > 0 && p2 <= 12) {
      const year = p3 < 100 ? 2000 + p3 : p3;
      if (year > 1900) {
        d = new Date(year, p2 - 1, p1);
        if (!isNaN(d.getTime())) return d;
      }
    }

    // YYYY/MM/DD format (e.g. 2004/01/19)
    if (p1 > 1900 && p2 > 0 && p2 <= 12 && p3 > 0 && p3 <= 31) {
      d = new Date(p1, p2 - 1, p3);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

/**
 * Validates that user's Date of Birth makes them 18 years or older as of account creation date (or current date).
 */
export function validateUserDobAge(
  dob: string | Date | null | undefined,
  creationDate?: string | Date
): ValidateDobResult {
  if (!dob) return { valid: true };

  const birthDate = parseDobDate(dob);
  if (!birthDate) {
    return { valid: false, message: "Invalid Date of Birth format." };
  }

  const baseDate = creationDate ? new Date(creationDate) : new Date();

  // Calculate age difference in years as of account creation date
  let age = baseDate.getFullYear() - birthDate.getFullYear();
  const m = baseDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && baseDate.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) {
    return {
      valid: false,
      message: "User Age must be 18 years and above",
    };
  }

  return { valid: true };
}
