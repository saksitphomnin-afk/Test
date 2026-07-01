import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function isValidImage(file: File): boolean {
  return file.size > 0 && ACCEPTED.includes(file.type);
}

function makeName(file: File) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  return `${Date.now()}-${crypto.randomUUID()}.${ext}`;
}

const onVercelBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const onNetlify = () => process.env.NETLIFY === "true" || !!process.env.NETLIFY_BLOBS_CONTEXT;
const NETLIFY_STORE = "room-images";

/**
 * อัปโหลดรูป — เลือก backend อัตโนมัติ:
 * 1) Vercel Blob (ถ้ามี BLOB_READ_WRITE_TOKEN) → คืน public URL
 * 2) Netlify Blobs (เมื่อรันบน Netlify) → คืน /api/images/<key>
 * 3) ระบบไฟล์ public/uploads (สำหรับ dev เครื่องตัวเอง)
 */
export async function uploadImage(file: File): Promise<string> {
  const filename = makeName(file);

  if (onVercelBlob()) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`rooms/${filename}`, file, {
        access: "public",
        contentType: file.type || undefined,
      });
      return blob.url;
    } catch (err) {
      console.error("[storage] Vercel Blob upload failed:", err);
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${message}`);
    }
  }

  if (onNetlify()) {
    try {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore(NETLIFY_STORE);
      const bytes = await file.arrayBuffer();
      await store.set(filename, bytes, {
        metadata: { contentType: file.type || "application/octet-stream" },
      });
      return `/api/images/${filename}`;
    } catch (err) {
      console.error("[storage] Netlify Blobs upload failed:", err);
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`อัปโหลดรูปไม่สำเร็จ: ${message}`);
    }
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${filename}`;
}

/** ลบรูปตาม url ที่เก็บไว้ (ทำงานเงียบ ๆ ไม่ throw หากลบไม่ได้) */
export async function deleteImage(url: string): Promise<void> {
  try {
    if (url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", url));
    } else if (url.startsWith("/api/images/")) {
      const { getStore } = await import("@netlify/blobs");
      const key = url.replace("/api/images/", "");
      await getStore(NETLIFY_STORE).delete(key);
    } else if (url.includes("blob.vercel-storage.com")) {
      const { del } = await import("@vercel/blob");
      await del(url);
    }
  } catch {
    // เพิกเฉยหากไฟล์ไม่มีอยู่แล้ว
  }
}
