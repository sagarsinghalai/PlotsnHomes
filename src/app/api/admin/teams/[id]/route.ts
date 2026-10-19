import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { hasEditPermissionServer, hasDeletePermissionServer } from "@/lib/permissions";

// PATCH — update a team.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const canEdit = await hasEditPermissionServer(auth.session.user, "/admin/teams");
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to edit teams." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const name = (body.name ?? "").trim();
    const code = (body.code ?? "").trim();
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: "Team Name and Code are required" },
        { status: 400 }
      );
    }

    const clash = await prisma.team.findFirst({
      where: { code, NOT: { id: params.id } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json(
        { success: false, error: `A team with code "${code}" already exists.` },
        { status: 400 }
      );
    }

    const team = await prisma.team.update({
      where: { id: params.id },
      data: {
        name,
        code,
        departmentId: body.departmentId || null,
        teamLeaderId: body.teamLeaderId || null,
        status: body.status || "ACTIVE",
      },
      include: {
        department: { select: { id: true, name: true } },
        teamLeader: { select: { id: true, name: true, email: true } },
        _count: { select: { users: true } },
      },
    });

    if (body.teamLeaderId) {
      await prisma.user
        .update({ where: { id: body.teamLeaderId }, data: { teamId: team.id } })
        .catch(() => {});
    }

    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update team" },
      { status: 500 }
    );
  }
}

// DELETE — remove a team.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const canDelete = await hasDeletePermissionServer(auth.session.user, "/admin/teams");
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete teams." },
        { status: 403 }
      );
    }

    await prisma.team.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Team deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete team" },
      { status: 500 }
    );
  }
}
