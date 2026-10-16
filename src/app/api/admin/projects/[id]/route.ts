import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { hasEditPermissionServer, hasDeletePermissionServer } from "@/lib/permissions";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        developer: true,
        properties: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const canEdit = await hasEditPermissionServer(auth.session.user, "/admin/projects");
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to edit projects." },
        { status: 403 }
      );
    }
    const body = await req.json();
    
    // Clean stringified JSON payload fields
    const dataToUpdate: any = { ...body };
    delete dataToUpdate.id;
    delete dataToUpdate.createdAt;
    delete dataToUpdate.updatedAt;
    delete dataToUpdate.developer;
    delete dataToUpdate.properties;
    delete dataToUpdate._count;

    if (dataToUpdate.minPrice) dataToUpdate.minPrice = parseFloat(dataToUpdate.minPrice);
    if (dataToUpdate.maxPrice) dataToUpdate.maxPrice = parseFloat(dataToUpdate.maxPrice);
    if (dataToUpdate.pricePerSqft) dataToUpdate.pricePerSqft = parseFloat(dataToUpdate.pricePerSqft);
    if (dataToUpdate.reraRegDate) dataToUpdate.reraRegDate = new Date(dataToUpdate.reraRegDate);
    if (dataToUpdate.possessionDate) dataToUpdate.possessionDate = new Date(dataToUpdate.possessionDate);
    if (dataToUpdate.launchDate) dataToUpdate.launchDate = new Date(dataToUpdate.launchDate);
    if (dataToUpdate.completionDate) dataToUpdate.completionDate = new Date(dataToUpdate.completionDate);

    const project = await prisma.project.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    if (project.developerId) {
      const devProjectsCount = await prisma.project.count({
        where: { developerId: project.developerId },
      });
      await prisma.developer.update({
        where: { id: project.developerId },
        data: { projectCount: devProjectsCount },
      });
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const canDelete = await hasDeletePermissionServer(auth.session.user, "/admin/projects");
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete projects." },
        { status: 403 }
      );
    }

    const project = await prisma.project.delete({
      where: { id: params.id },
    });

    if (project.developerId) {
      const devProjectsCount = await prisma.project.count({
        where: { developerId: project.developerId },
      });
      await prisma.developer.update({
        where: { id: project.developerId },
        data: { projectCount: devProjectsCount },
      });
    }

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete project" },
      { status: 500 }
    );
  }
}
