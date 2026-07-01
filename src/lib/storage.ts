import { put, del } from "@vercel/blob";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

function makeName(file: File) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  return `${Date.now()}-${crypto.randomUUID()}.${ext}`;
}

/** อัปโหลดรูป: ใช้ Vercel Blob ถ้ามี token มิฉะนั้นเก็บลง public/uploads (สำหรับ dev) */
export async function uploadImage(file: File): Promise<string> {
  const filename = makeName(file);

  if (hasBlob()) {
    const blob = await put(`rooms/${filename}`, file, {
      access: "public",
      contentType: file.type || undefined,
    });
    return blob.url;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${filename}`;
}

/** ลบรูปตาม url (ทำงานเงียบ ๆ ไม่ throw หากลบไม่ได้) */
export async function deleteImage(url: string): Promise<void> {
  try {
    if (url.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", url));
    } else if (hasBlob() && url.includes("blob.vercel-storage.com")) {
      await del(url);
    }
  } catch {
    // เพิกเฉยหากไฟล์ไม่มีอยู่แล้ว
  }
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function isValidImage(file: File): boolean {
  return file.size > 0 && ACCEPTED.includes(file.type);
}
