import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth-options";
import { v2 as cloudinary } from "cloudinary";
import {
  detectMediaKind,
  MEDIA_LIMITS,
  validateUploadFile,
  type MediaKind,
} from "@/lib/media-limits";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  resourceType: "image" | "video" | "raw"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No response from Cloudinary"));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

type UploadKind = MediaKind | "audio";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const kindParam = form.get("kind")?.toString() as UploadKind | undefined;
    const currentCount = parseInt(form.get("currentCount")?.toString() ?? "0", 10);

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const kind = kindParam ?? detectMediaKind(file.type, file.name);
    if (!kind) {
      return NextResponse.json(
        { error: "Unsupported file type. Use images, videos, or PDF only." },
        { status: 400 }
      );
    }

    if (kind !== "audio") {
      const limitKey = kind === "image" ? "images" : kind === "video" ? "videos" : "pdfs";
      if (currentCount >= MEDIA_LIMITS[limitKey]) {
        return NextResponse.json(
          { error: `Maximum ${MEDIA_LIMITS[limitKey]} ${limitKey} allowed per listing.` },
          { status: 400 }
        );
      }

      const validationError = validateUploadFile(file, kind);
      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let url = "";
    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured) {
      let resourceType: "image" | "video" | "raw" = "raw";
      if (kind === "image") {
        resourceType = "image";
      } else if (kind === "video" || kind === "audio") {
        resourceType = "video";
      }
      url = await uploadToCloudinary(buffer, "plotsnhomes", resourceType);
    } else {
      const ext = path.extname(file.name) || (kind === "pdf" ? ".pdf" : kind === "video" ? ".mp4" : kind === "audio" ? ".mp3" : ".jpg");
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, safeName), buffer);
      url = `/uploads/${safeName}`;
    }


    return NextResponse.json({
      ok: true,
      url,
      name: file.name,
      type: file.type,
      kind,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

