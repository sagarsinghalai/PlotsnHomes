import { MeetingsList } from "@/components/admin/meetings-list";
import { prisma } from "@/lib/prisma";
import { getServerTenantId } from "@/lib/tenant";

export default async function AdminMeetingsPage() {
  const tenantId = await getServerTenantId();
  const meetings = await prisma.meetingInvite.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      agent: { select: { name: true, email: true, phone: true } },
      createdBy: { select: { name: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Meetings</h1>
      <p className="mt-1 text-slate-600">
        Calendly &amp; custom links — agents notified on schedule via email &amp; WhatsApp
      </p>

      <div className="mt-8">
        <MeetingsList
          meetings={meetings.map((m) => ({
            ...m,
            scheduledAt: m.scheduledAt?.toISOString() ?? null,
            createdAt: m.createdAt.toISOString(),
          }))}
        />
      </div>
    </div>
  );
}
