import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import {
  SITE_SETTING_KEYS,
  getSiteSetting,
  saveSiteSetting,
  DEFAULT_PROJECT_FIELD_DEFAULTS,
  type ProjectFieldDefaults,
} from "@/lib/site-settings";

function merged(saved: Partial<ProjectFieldDefaults> | null): ProjectFieldDefaults {
  return {
    amenities: saved?.amenities ?? DEFAULT_PROJECT_FIELD_DEFAULTS.amenities,
    specifications: saved?.specifications ?? DEFAULT_PROJECT_FIELD_DEFAULTS.specifications,
    documents: saved?.documents ?? DEFAULT_PROJECT_FIELD_DEFAULTS.documents,
    salesFields: saved?.salesFields ?? DEFAULT_PROJECT_FIELD_DEFAULTS.salesFields,
    nearbyCategories: saved?.nearbyCategories ?? DEFAULT_PROJECT_FIELD_DEFAULTS.nearbyCategories,
  };
}

export async function GET() {
  try {
    const saved = await getSiteSetting<Partial<ProjectFieldDefaults> | null>(SITE_SETTING_KEYS.PROJECT_FIELD_DEFAULTS);
    return NextResponse.json({ success: true, defaults: merged(saved) });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Failed to load defaults" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    const body = (await req.json()) as Partial<ProjectFieldDefaults>;
    const value = merged(body);
    await saveSiteSetting(SITE_SETTING_KEYS.PROJECT_FIELD_DEFAULTS, value);
    return NextResponse.json({ success: true, defaults: value });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Failed to save defaults" }, { status: 500 });
  }
}
