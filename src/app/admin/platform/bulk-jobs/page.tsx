import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import { prisma } from "@/lib/prisma";

export default async function BulkJobsPage() {
  const jobs = await prisma.bulkJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1">
        <h1 className="font-display text-3xl font-bold">Bulk Job History</h1>
        <p className="mt-1 text-slate-600">Import and export audit log</p>
        <div className="mt-8 overflow-x-auto rounded-2xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">By</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t">
                  <td className="px-4 py-3">{j.type}</td>
                  <td className="px-4 py-3">{j.status}</td>
                  <td className="px-4 py-3">{j.fileName ?? "—"}</td>
                  <td className="px-4 py-3">{j.recordCount ?? "—"}</td>
                  <td className="px-4 py-3">{j.createdBy.name}</td>
                  <td className="px-4 py-3">{new Date(j.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobs.length === 0 && <p className="p-8 text-center text-slate-500">No bulk jobs yet.</p>}
        </div>
      </div>
    </div>
  );
}
