export const MEDIA_LIMITS = {
  images: 50,
  videos: 5,
  pdfs: 10,
} as const;

export type MediaKind = "image" | "video" | "pdf";

const MIME: Record<MediaKind, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
  video: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"],
  pdf: ["application/pdf"],
};

const MAX_BYTES: Record<MediaKind, number> = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  pdf: 25 * 1024 * 1024,
};

export function detectMediaKind(mime: string, filename: string): MediaKind | null {
  const lower = mime.toLowerCase();
  if (lower.startsWith("image/") || MIME.image.includes(lower) || /\.(jpe?g|png|webp|gif|avif)$/i.test(filename)) {
    return "image";
  }
  if (lower.startsWith("video/") || MIME.video.includes(lower) || /\.(mp4|webm|mov|avi|mkv|3gp|flv|wmv)$/i.test(filename)) {
    return "video";
  }
  if (lower === "application/pdf" || MIME.pdf.includes(lower) || /\.pdf$/i.test(filename)) {
    return "pdf";
  }
  return null;
}

export function validateUploadFile(
  file: { type: string; size: number; name: string },
  kind: MediaKind
): string | null {
  const detected = detectMediaKind(file.type, file.name);
  if (detected !== kind) {
    return `Invalid file type. Expected ${kind}.`;
  }
  if (file.size > MAX_BYTES[kind]) {
    const mb = Math.round(MAX_BYTES[kind] / (1024 * 1024));
    return `File too large. Maximum ${mb} MB for ${kind}s.`;
  }
  return null;
}

export function mediaLimitLabel(kind: keyof typeof MEDIA_LIMITS): string {
  const max = MEDIA_LIMITS[kind];
  const unit = kind === "images" ? "images" : kind === "videos" ? "videos" : "PDFs";
  return `Up to ${max} ${unit}`;
}
