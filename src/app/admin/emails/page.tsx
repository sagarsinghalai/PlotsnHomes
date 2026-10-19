import { isEmailConfigured } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export default async function AdminEmailsPage() {
  const emails = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const resendOn = isEmailConfigured();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Emails</h1>
      <p className="mt-1 text-slate-600">
        Outbound mail log · {emails.length} recent ·{" "}
        <span className={resendOn ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
          {resendOn ? "Resend LIVE" : "Dev mode (logged to DB only)"}
        </span>
      </p>

      {!resendOn && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add <code className="bg-white px-1 rounded">RESEND_API_KEY</code> to .env for real delivery.
          Until then, every email is saved here so you can verify content.
        </div>
      )}

      <div className="mt-8 space-y-4">
        {emails.map((e) => (
          <div
            key={e.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{e.subject}</p>
                <p className="text-sm text-slate-500 mt-1">
                  To: <span className="font-mono">{e.to}</span>
                </p>
              </div>
              <div className="text-right text-xs">
                <span
                  className={`rounded-full px-2 py-1 font-medium ${
                    e.status === "SENT"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {e.status}
                </span>
                <p className="mt-1 text-slate-400">{e.provider}</p>
                <p className="text-slate-400" suppressHydrationWarning>{new Date(e.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-brand-hover">View HTML body</summary>
              <div
                className="mt-2 rounded-lg bg-slate-50 p-3 text-xs overflow-auto max-h-40 border border-slate-100"
                dangerouslySetInnerHTML={{ __html: e.html }}
              />
            </details>
          </div>
        ))}
        {emails.length === 0 && (
          <p className="text-center text-slate-500 py-12">
            No emails yet. Send an inquiry or complete a demo payment to generate logs.
          </p>
        )}
      </div>
    </div>
  );
}
