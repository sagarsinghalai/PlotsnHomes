import { NextResponse } from "next/server";
import { getSiteSetting, SITE_SETTING_KEYS, SectionDropdownConfig, DEFAULT_USERS_ACCOUNTS_DROPDOWNS } from "@/lib/site-settings";

export async function GET() {
  try {
    const sections = await getSiteSetting<SectionDropdownConfig[]>(SITE_SETTING_KEYS.DROPDOWN_OPTIONS);
    const result = sections && sections.length > 0 ? sections : DEFAULT_USERS_ACCOUNTS_DROPDOWNS;
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
