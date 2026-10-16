export const dynamic = "force-dynamic";

import { FooterCustomizerClient } from "@/components/admin/footer-customizer-client";
import { getFooterSettings } from "@/lib/webpage-editor-store";

export default async function AdminFooterCustomizerPage() {
  const footer = await getFooterSettings();

  return (
    <div>
      <FooterCustomizerClient initialFooter={footer} />
    </div>
  );
}
