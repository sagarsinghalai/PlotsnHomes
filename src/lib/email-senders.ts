import { getSetting, setSetting } from "@/lib/system-settings";

// A configurable "from" email account. When apiKey is set it uses its own
// Resend key (lets you send from different accounts/domains); otherwise it
// reuses the RESEND_API_KEY from the environment with this from address.
export type EmailSender = {
  id: string;
  label: string;      // friendly name, e.g. "Sales"
  fromName: string;   // display name, e.g. "PlotsnHomes Sales"
  fromEmail: string;  // e.g. "sales@plotsnhomes.com"
  apiKey?: string;    // optional per-account Resend API key
};

export type EmailSendersState = {
  senders: EmailSender[];
  activeId: string;
};

const KEY = "email_senders_v1";

export async function getEmailSendersState(): Promise<EmailSendersState> {
  const raw = await getSetting(KEY);
  if (!raw) return { senders: [], activeId: "" };
  try {
    const parsed = JSON.parse(raw);
    const senders: EmailSender[] = Array.isArray(parsed?.senders) ? parsed.senders : [];
    const activeId: string = typeof parsed?.activeId === "string" ? parsed.activeId : "";
    return { senders, activeId };
  } catch {
    return { senders: [], activeId: "" };
  }
}

export async function saveEmailSendersState(state: EmailSendersState): Promise<void> {
  await setSetting(KEY, JSON.stringify(state));
}

/** The sender to send from: the active one, else the first configured, else null. */
export async function getActiveSender(senderId?: string): Promise<EmailSender | null> {
  const { senders, activeId } = await getEmailSendersState();
  if (senders.length === 0) return null;
  const wanted = senderId || activeId;
  return senders.find((s) => s.id === wanted) || senders[0];
}
