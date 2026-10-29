import { notFound } from "next/navigation";
import { getCustomPageBySlug, getFooterSettings, getNavSettings } from "@/lib/webpage-editor-store";
import { BuilderPageView } from "@/components/public/builder-page-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const page = await getCustomPageBySlug(params.slug);
  if (!page) return { title: "Page Not Found" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.title,
  };
}

export default async function PublicCustomPage({ params }: { params: { slug: string } }) {
  const [page, nav, footer] = await Promise.all([
    getCustomPageBySlug(params.slug),
    getNavSettings(),
    getFooterSettings(),
  ]);

  if (!page || page.status !== "published") {
    notFound();
  }

  return <BuilderPageView page={page} nav={nav} footer={footer} />;
}
