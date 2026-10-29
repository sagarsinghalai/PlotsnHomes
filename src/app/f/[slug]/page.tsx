import { notFound } from "next/navigation";
import { getFormBySlug, incrementView } from "@/lib/forms-store";
import { FormRenderer } from "@/components/public/form-renderer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const form = await getFormBySlug(params.slug);
  return { title: form ? form.name : "Form", description: form?.description || "" };
}

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { embed?: string };
}) {
  const form = await getFormBySlug(params.slug);
  if (!form) notFound();

  // Count this view for the form's analytics.
  await incrementView(form.id).catch(() => {});

  const embed = searchParams.embed === "1";

  if (embed) {
    return (
      <div className="bg-transparent p-2">
        <FormRenderer form={form} embed />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <FormRenderer form={form} />
      <p className="mx-auto mt-4 max-w-lg text-center text-[11px] text-slate-400">Powered by PlotsnHomes</p>
    </div>
  );
}
