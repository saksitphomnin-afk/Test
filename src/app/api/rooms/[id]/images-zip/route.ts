import JSZip from "jszip";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getImageBytes } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const room = await prisma.room.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!room) {
    return new Response("Not found", { status: 404 });
  }
  if (room.images.length === 0) {
    return new Response("ห้องนี้ยังไม่มีรูป", { status: 404 });
  }

  const zip = new JSZip();
  let count = 0;
  for (const img of room.images) {
    const bytes = await getImageBytes(img.url);
    if (!bytes) continue;
    count++;
    const ext = (img.url.split(".").pop() || "jpg").split("?")[0].toLowerCase();
    zip.file(`${room.roomNumber}-${count}.${ext}`, bytes);
  }

  if (count === 0) {
    return new Response("ไม่พบไฟล์รูปที่ดาวน์โหลดได้", { status: 500 });
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const rawName = `${room.projectName}-${room.roomNumber}.zip`;
  // Content-Disposition ต้องเป็น ASCII เท่านั้น — ชื่อไฟล์ภาษาไทยใส่ผ่าน
  // filename* (RFC 5987) แทน ส่วน filename= เก็บ fallback แบบ ASCII ไว้ให้ client เก่า
  const asciiName = rawName.replace(/[^\x20-\x7E]/g, "_");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(rawName)}`,
    },
  });
}
