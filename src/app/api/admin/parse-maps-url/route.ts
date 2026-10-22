import { NextResponse } from "next/server";
import { requireCrmApi } from "@/lib/crm-access";

// Only these hosts may be fetched server-side (SSRF guard). A substring check is
// not safe (e.g. "http://169.254.169.254/#goo.gl" contains "goo.gl"), so we parse
// the URL and match the exact hostname against this allowlist.
const ALLOWED_FETCH_HOSTS = new Set([
  "goo.gl",
  "maps.app.goo.gl",
  "app.goo.gl",
  "bit.ly",
  "maps.google.com",
  "www.google.com",
  "google.com",
]);

function isAllowedShortenerUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return ALLOWED_FETCH_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function extractLatLngFromUrl(url: string) {
  if (!url) return null;
  const str = decodeURIComponent(url);

  // Pattern 1: /@33.749,-84.388
  const atMatch = str.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: atMatch[1], lng: atMatch[2] };

  // Pattern 2: ?q=33.749,-84.388 or &query=33.749,-84.388
  const queryMatch = str.match(/[?&](?:q|query|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (queryMatch) return { lat: queryMatch[1], lng: queryMatch[2] };

  // Pattern 3: !3d33.749!4d-84.388 (Embed or Place details)
  const d3d4Match = str.match(/!3d(-?\d+\.\d+).*?!4d(-?\d+\.\d+)/);
  if (d3d4Match) return { lat: d3d4Match[1], lng: d3d4Match[2] };

  // Pattern 4: Raw coordinates string "33.749, -84.388"
  const rawMatch = str.trim().match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/);
  if (rawMatch) return { lat: rawMatch[1], lng: rawMatch[2] };

  return null;
}

export async function GET(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const mapsUrl = searchParams.get("url");

    if (!mapsUrl) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // 1. Direct Extraction
    const directMatch = extractLatLngFromUrl(mapsUrl);
    if (directMatch) {
      return NextResponse.json({ lat: directMatch.lat, lng: directMatch.lng, method: "direct" });
    }

    // 2. Follow Redirects for Shortened Links — ONLY for allowlisted hosts (SSRF guard).
    if (isAllowedShortenerUrl(mapsUrl)) {
      const response = await fetch(mapsUrl, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      });
      const finalUrl = response.url;
      const redirectMatch = extractLatLngFromUrl(finalUrl);
      if (redirectMatch) {
        return NextResponse.json({ lat: redirectMatch.lat, lng: redirectMatch.lng, method: "redirect" });
      }

      // Check response body text for !3d...!4d or @lat,lng
      const bodyText = await response.text();
      const bodyMatch = extractLatLngFromUrl(bodyText);
      if (bodyMatch) {
        return NextResponse.json({ lat: bodyMatch.lat, lng: bodyMatch.lng, method: "body" });
      }
    }

    return NextResponse.json({ error: "Could not extract coordinates from link" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to resolve maps link" }, { status: 500 });
  }
}
