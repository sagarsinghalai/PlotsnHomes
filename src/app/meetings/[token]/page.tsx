import { notFound } from "next/navigation";
import { MeetingSchedulePage } from "@/components/meetings/meeting-schedule-page";
import { prisma } from "@/lib/prisma";

export default async function PublicMeetingPage({
  params,
}: {
  params: { token: string };
}) {
  const meeting = await prisma.meetingInvite.findUnique({
    where: { token: params.token },
    include: {
      user: { select: { name: true, email: true } },
      agent: { select: { name: true, email: true } },
    },
  });

  if (!meeting) notFound();

  return <MeetingSchedulePage meeting={meeting} />;
}
