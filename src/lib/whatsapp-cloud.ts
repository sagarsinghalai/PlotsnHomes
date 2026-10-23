import { getWhatsAppConfig } from "@/lib/whatsapp-settings";

/**
 * Send a plain text WhatsApp message via the Cloud API using the stored business
 * config. Best-effort: returns { ok:false } (never throws) when not configured or
 * on error, so callers like the bot engine degrade gracefully.
 */
export async function sendWhatsAppText(to: string, body: string, tenantId?: string | null): Promise<{ ok: boolean; id?: string; error?: string }> {
  const cfg = await getWhatsAppConfig(tenantId);
  if (!cfg.accessToken || !cfg.phoneNumberId) {
    return { ok: false, error: "WhatsApp Cloud API not configured" };
  }
  const recipient = (to || "").replace(/\D/g, "");
  if (!recipient || !body?.trim()) return { ok: false, error: "Missing recipient or body" };

  const url = `https://graph.facebook.com/${cfg.apiVersion || "v20.0"}/${cfg.phoneNumberId}/messages`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: recipient, type: "text", text: { body } }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    return { ok: true, id: data?.messages?.[0]?.id };
  } catch (e: any) {
    return { ok: false, error: e?.message || "network error" };
  }
}
