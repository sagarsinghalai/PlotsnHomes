"use client";

export type PasswordLogEntry = {
  id: string;
  userName: string;
  userEmail: string;
  password: string;
  timestamp: string;
  action: "CREATED" | "UPDATED" | "REJECTED_REUSE";
};

// Initial Seed Password History Logs
export const INITIAL_PASSWORD_LOGS: PasswordLogEntry[] = [
  {
    id: "PWD-LOG-1001",
    userName: "Super Admin",
    userEmail: "admin@plotsnhomes.com",
    password: "demo1234",
    timestamp: "2026-07-27 10:00:00",
    action: "CREATED",
  },
  {
    id: "PWD-LOG-1002",
    userName: "Admin Staff",
    userEmail: "admin.staff@plotsnhomes.com",
    password: "Admin@12345",
    timestamp: "2026-07-27 10:05:00",
    action: "CREATED",
  },
  {
    id: "PWD-LOG-1003",
    userName: "Employee Staff",
    userEmail: "employee@plotsnhomes.com",
    password: "Employee@12345",
    timestamp: "2026-07-27 10:10:00",
    action: "CREATED",
  },
  {
    id: "PWD-LOG-1004",
    userName: "Agent One",
    userEmail: "agent1@plotsnhomes.com",
    password: "demo1234",
    timestamp: "2026-07-27 10:15:00",
    action: "CREATED",
  },
  {
    id: "PWD-LOG-1005",
    userName: "Seller Account",
    userEmail: "seller@plotsnhomes.com",
    password: "Seller@12345",
    timestamp: "2026-07-27 10:20:00",
    action: "CREATED",
  },
  {
    id: "PWD-LOG-1006",
    userName: "Buyer Customer",
    userEmail: "buyer@plotsnhomes.com",
    password: "demo1234",
    timestamp: "2026-07-27 10:25:00",
    action: "CREATED",
  },
  {
    id: "PWD-LOG-1007",
    userName: "Bhavya",
    userEmail: "bhavya@gmail.com",
    password: "Password123!",
    timestamp: "2026-07-27 11:00:00",
    action: "CREATED",
  },
];

const STORAGE_KEY = "plotsnhomes_password_logs_v1";

export function getAllPasswordLogs(): PasswordLogEntry[] {
  if (typeof window === "undefined") return INITIAL_PASSWORD_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PASSWORD_LOGS));
      return INITIAL_PASSWORD_LOGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PASSWORD_LOGS));
    return INITIAL_PASSWORD_LOGS;
  } catch (e) {
    return INITIAL_PASSWORD_LOGS;
  }
}

export function savePasswordLogs(logs: PasswordLogEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new Event("plotsnhomes_password_logs_updated"));
  } catch (e) {
    console.error("Failed to save password logs", e);
  }
}

/**
 * Checks if a candidate password was previously used by this user.
 */
export function isPasswordReused(userEmail: string, candidatePassword: string): boolean {
  const logs = getAllPasswordLogs();
  const cleanEmail = (userEmail || "").trim().toLowerCase();
  const cleanCandidate = (candidatePassword || "").trim();

  // Find all previously logged passwords for this user email
  const userHistory = logs.filter(
    (l) => (l.userEmail || "").trim().toLowerCase() === cleanEmail && l.action !== "REJECTED_REUSE"
  );

  return userHistory.some((l) => l.password === cleanCandidate);
}

/**
 * Attempts to record a new or updated password.
 * Throws error if the password was previously used.
 */
export function recordPasswordEntry(
  userName: string,
  userEmail: string,
  newPassword: string,
  action: "CREATED" | "UPDATED" = "UPDATED"
): { success: boolean; error?: string; log?: PasswordLogEntry } {
  const cleanName = (userName || "User").trim();
  const cleanEmail = (userEmail || "").trim().toLowerCase();
  const cleanPassword = (newPassword || "").trim();

  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(
    2,
    "0"
  )}:${String(now.getSeconds()).padStart(2, "0")}`;

  // Check reuse memory
  if (isPasswordReused(cleanEmail, cleanPassword)) {
    const rejectedLog: PasswordLogEntry = {
      id: `PWD-LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      userName: cleanName,
      userEmail: cleanEmail,
      password: cleanPassword,
      timestamp: formattedDate,
      action: "REJECTED_REUSE",
    };
    const current = getAllPasswordLogs();
    savePasswordLogs([rejectedLog, ...current]);

    return {
      success: false,
      error: `Password Reuse Detected: The system detected that "${cleanPassword}" was previously used for ${cleanEmail}. Please create a new password that has not been used in the past.`,
    };
  }

  // Record valid new password
  const newLog: PasswordLogEntry = {
    id: `PWD-LOG-${Math.floor(1000 + Math.random() * 9000)}`,
    userName: cleanName,
    userEmail: cleanEmail,
    password: cleanPassword,
    timestamp: formattedDate,
    action: action,
  };

  const current = getAllPasswordLogs();
  savePasswordLogs([newLog, ...current]);

  return {
    success: true,
    log: newLog,
  };
}

/**
 * Formats password logs as CSV string.
 */
export function generatePasswordLogsCSV(): string {
  const logs = getAllPasswordLogs();
  const headers = ["Timestamp", "Username", "Email", "GeneratedPassword", "ActionStatus"];
  const rows = logs.map((l) => [
    `"${l.timestamp}"`,
    `"${l.userName.replace(/"/g, '""')}"`,
    `"${l.userEmail}"`,
    `"${l.password.replace(/"/g, '""')}"`,
    `"${l.action}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
