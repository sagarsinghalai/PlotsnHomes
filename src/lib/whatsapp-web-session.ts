/**
 * WhatsApp Web linked-device session (whatsapp-web.js).
 *
 * Runs a persistent WhatsApp Web client so the company can link its existing
 * phone number by scanning a QR code — no Meta Business approval needed.
 *
 * IMPORTANT: this is an unofficial transport. It needs a long-running Node
 * process + Chromium (puppeteer) and is not supported on serverless/edge.
 * The module loads whatsapp-web.js lazily and fails soft, so if the dependency
 * or Chromium is unavailable the rest of the app (and the Cloud API path) keep
 * working and the UI just shows an error.
 *
 * The client is stored on globalThis so it survives Next.js dev hot-reloads.
 */

export type WebSessionStatus =
  | "idle"
  | "initializing"
  | "qr"
  | "authenticated"
  | "ready"
  | "disconnected"
  | "auth_failure"
  | "error";

type WebSessionState = {
  status: WebSessionStatus;
  qrDataUrl: string | null;
  qrGeneratedAt: number | null;
  linkedNumber: string | null;
  linkedName: string | null;
  connectedAt: string | null;
  lastError: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any | null;
  starting: boolean;
};

type GlobalWithWa = typeof globalThis & { __brickvestWaWeb?: WebSessionState };

function state(): WebSessionState {
  const g = globalThis as GlobalWithWa;
  if (!g.__brickvestWaWeb) {
    g.__brickvestWaWeb = {
      status: "idle",
      qrDataUrl: null,
      qrGeneratedAt: null,
      linkedNumber: null,
      linkedName: null,
      connectedAt: null,
      lastError: null,
      client: null,
      starting: false,
    };
  }
  return g.__brickvestWaWeb;
}

export type PublicWebStatus = {
  status: WebSessionStatus;
  qrDataUrl: string | null;
  linkedNumber: string | null;
  linkedName: string | null;
  connectedAt: string | null;
  lastError: string | null;
};

export function getWhatsAppWebStatus(): PublicWebStatus {
  const s = state();
  return {
    status: s.status,
    qrDataUrl: s.qrDataUrl,
    linkedNumber: s.linkedNumber,
    linkedName: s.linkedName,
    connectedAt: s.connectedAt,
    lastError: s.lastError,
  };
}

/**
 * Start (or restart) the WhatsApp Web session. Idempotent: if a session is
 * already ready or a QR is pending, it just returns the current status.
 */
export async function startWhatsAppWeb(): Promise<PublicWebStatus> {
  const s = state();

  if (s.status === "ready") return getWhatsAppWebStatus();
  if (s.starting || s.status === "initializing" || s.status === "qr") {
    return getWhatsAppWebStatus();
  }

  s.starting = true;
  s.status = "initializing";
  s.lastError = null;
  s.qrDataUrl = null;

  try {
    // Lazy, guarded loads so a missing dependency doesn't crash the route.
    const wweb = await import("whatsapp-web.js").catch((e) => {
      throw new Error(
        `whatsapp-web.js could not be loaded (${e instanceof Error ? e.message : "unknown"}). ` +
          `Run "npm install whatsapp-web.js".`,
      );
    });
    const QRCode = await import("qrcode").catch(() => null);

    const { Client, LocalAuth } = wweb as unknown as {
      Client: new (opts: unknown) => WaClient;
      LocalAuth: new (opts: unknown) => unknown;
    };

    const client: WaClient = new Client({
      authStrategy: new LocalAuth({ clientId: "brickvest-central", dataPath: ".wwebjs_auth" }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      },
    });

    s.client = client;

    client.on("qr", async (qr: string) => {
      s.status = "qr";
      s.qrGeneratedAt = Date.now();
      try {
        s.qrDataUrl = QRCode
          ? await QRCode.toDataURL(qr, { margin: 1, width: 300 })
          : null;
      } catch {
        s.qrDataUrl = null;
      }
    });

    client.on("authenticated", () => {
      s.status = "authenticated";
      s.qrDataUrl = null;
    });

    client.on("auth_failure", (msg: string) => {
      s.status = "auth_failure";
      s.lastError = msg || "Authentication failed. Try connecting again.";
      s.qrDataUrl = null;
    });

    client.on("ready", () => {
      s.status = "ready";
      s.qrDataUrl = null;
      s.connectedAt = new Date().toISOString();
      const info = client.info;
      const wid = info?.wid?.user ? `+${info.wid.user}` : null;
      s.linkedNumber = wid;
      s.linkedName = info?.pushname ?? null;
    });

    client.on("disconnected", (reason: string) => {
      s.status = "disconnected";
      s.lastError = reason ? `Disconnected: ${reason}` : "Disconnected.";
      s.qrDataUrl = null;
      s.client = null;
    });

    // initialize() resolves once the browser is up; QR/ready arrive via events.
    client.initialize().catch((e: unknown) => {
      s.status = "error";
      s.lastError = e instanceof Error ? e.message : "Failed to initialize WhatsApp Web.";
      s.client = null;
    });
  } catch (e) {
    s.status = "error";
    s.lastError = e instanceof Error ? e.message : "Failed to start WhatsApp Web.";
    s.client = null;
  } finally {
    s.starting = false;
  }

  return getWhatsAppWebStatus();
}

/** Log out and tear down the session. */
export async function stopWhatsAppWeb(): Promise<PublicWebStatus> {
  const s = state();
  const client = s.client;
  if (client) {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
    try {
      await client.destroy();
    } catch {
      /* ignore */
    }
  }
  s.status = "idle";
  s.qrDataUrl = null;
  s.qrGeneratedAt = null;
  s.linkedNumber = null;
  s.linkedName = null;
  s.connectedAt = null;
  s.lastError = null;
  s.client = null;
  return getWhatsAppWebStatus();
}

/** Send a text message through the linked WhatsApp Web session. */
export async function sendViaWhatsAppWeb(
  toPhone: string,
  body: string,
): Promise<{ externalId: string }> {
  const s = state();
  if (s.status !== "ready" || !s.client) {
    throw new Error("WhatsApp Web is not connected. Scan the QR code in Integrations first.");
  }
  const digits = toPhone.replace(/\D/g, "");
  if (digits.length < 10) {
    throw new Error("Invalid phone number for WhatsApp Web (need full number with country code).");
  }
  const chatId = `${digits}@c.us`;
  const sent = await s.client.sendMessage(chatId, body);
  return { externalId: sent?.id?._serialized ?? sent?.id?.id ?? "wa_web" };
}

// Minimal shape of the whatsapp-web.js Client we rely on.
type WaClient = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (event: string, cb: (...args: any[]) => void) => void;
  initialize: () => Promise<void>;
  logout: () => Promise<void>;
  destroy: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: (chatId: string, content: string) => Promise<any>;
  info?: { wid?: { user?: string }; pushname?: string };
};
