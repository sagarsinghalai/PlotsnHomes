import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return NextResponse.json({ apiConfigured: !!(token && phoneId) });
}

// Accept both legacy (phone/type) and new (to/messageType) field names
const schema = z
  .object({
    // New field names (from handleSendWhatsApp)
    to: z.string().min(1).optional(),
    messageType: z.enum(["text", "image", "document", "audio"]).optional(),
    // Legacy field names (from other callers)
    phone: z.string().min(1).optional(),
    type: z.enum(["text", "image", "document", "audio"]).optional(),
    // Shared fields
    text: z.string().optional(),
    caption: z.string().optional(),
    mediaUrl: z.string().optional(),
    filename: z.string().optional(),
  })
  .refine((d) => d.to || d.phone, {
    message: "Either 'to' or 'phone' must be provided.",
  })
  .refine((d) => d.messageType || d.type, {
    message: "Either 'messageType' or 'type' must be provided.",
  });

export async function POST(req: Request) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_API_VERSION || "v20.0";

  if (!token || !phoneId) {
    return NextResponse.json(
      { success: false, error: "WhatsApp Cloud API credentials are not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your environment." },
      { status: 400 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "Invalid input parameters." },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Resolve canonical field values (new names take priority over legacy)
  const recipientRaw = (data.to || data.phone || "").replace(/\D/g, "");
  const msgType = data.messageType || data.type || "text";
  const messageText = data.text || data.caption || "";
  const mediaUrl = data.mediaUrl || null;
  const filename = data.filename || "document";

  // Validate resolved values
  if (!recipientRaw || recipientRaw.length < 10) {
    return NextResponse.json(
      { success: false, error: "Invalid phone number. Provide a full number with country code (digits only, min 10 digits)." },
      { status: 400 }
    );
  }

  if (msgType === "text" && !messageText.trim()) {
    return NextResponse.json(
      { success: false, error: "Text content is required for text message type." },
      { status: 400 }
    );
  }

  if (msgType !== "text" && !mediaUrl) {
    return NextResponse.json(
      { success: false, error: "mediaUrl is required for image/document/audio message types. Provide a Cloudinary secure_url." },
      { status: 400 }
    );
  }

  // Validate mediaUrl is not a blob/localhost/base64 URL
  if (mediaUrl) {
    if (
      mediaUrl.startsWith("blob:") ||
      mediaUrl.startsWith("data:") ||
      mediaUrl.includes("localhost")
    ) {
      return NextResponse.json(
        { success: false, error: "mediaUrl must be a publicly accessible HTTPS URL (e.g. Cloudinary secure_url). Blob, data URI, and localhost URLs are not supported by the WhatsApp Cloud API." },
        { status: 400 }
      );
    }
  }

  // Build WhatsApp Cloud API payload
  let payload: Record<string, unknown>;

  if (msgType === "text") {
    payload = {
      messaging_product: "whatsapp",
      to: recipientRaw,
      type: "text",
      text: { body: messageText },
    };
  } else if (msgType === "image") {
    payload = {
      messaging_product: "whatsapp",
      to: recipientRaw,
      type: "image",
      image: {
        link: mediaUrl,
        caption: messageText,
      },
    };
  } else if (msgType === "document") {
    payload = {
      messaging_product: "whatsapp",
      to: recipientRaw,
      type: "document",
      document: {
        link: mediaUrl,
        filename,
        caption: messageText,
      },
    };
  } else {
    // audio — no caption supported by WhatsApp Cloud API natively
    payload = {
      messaging_product: "whatsapp",
      to: recipientRaw,
      type: "audio",
      audio: { link: mediaUrl },
    };
  }

  // POST to WhatsApp Cloud API
  const apiUrl = `https://graph.facebook.com/${version}/${phoneId}/messages`;

  let res: Response;
  try {
    res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : "Network error reaching WhatsApp API.";
    return NextResponse.json({ success: false, error: msg }, { status: 502 });
  }

  const resData = await res.json() as {
    messages?: { id: string }[];
    error?: { message?: string; error_data?: { details?: string } };
  };

  if (!res.ok) {
    const metaError =
      resData.error?.error_data?.details ||
      resData.error?.message ||
      "WhatsApp Cloud API returned an error.";
    return NextResponse.json(
      { success: false, error: metaError },
      { status: res.status }
    );
  }

  const messageId = resData.messages?.[0]?.id ?? null;

  // For audio: if a caption/text exists, send as a follow-up text message
  if (msgType === "audio" && messageText.trim()) {
    const textPayload = {
      messaging_product: "whatsapp",
      to: recipientRaw,
      type: "text",
      text: { body: messageText },
    };
    try {
      const textRes = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(textPayload),
      });
      const textData = await textRes.json() as { error?: { message?: string } };
      if (!textRes.ok) {
        // Audio sent OK; caption failed — report partial success
        return NextResponse.json({
          success: true,
          messageId,
          warning: `Audio sent, but caption text failed: ${textData.error?.message || "unknown"}`,
        });
      }
    } catch {
      // Non-fatal — audio already sent
    }
  }

  return NextResponse.json({ success: true, messageId });
}
