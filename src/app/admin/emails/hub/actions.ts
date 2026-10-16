"use server";

import { sendEmail } from "@/lib/email";

export async function sendHubEmail(to: string, subject: string, html: string) {
  if (!to.trim() || !subject.trim() || !html.trim()) {
    throw new Error("Recipient, subject, and content are required.");
  }
  return await sendEmail({
    to: to.trim(),
    subject: subject.trim(),
    html: html.trim(),
  });
}
