import { z } from "zod";
import { prisma } from "@/lib/db";
import { uploadImage, isValidImage } from "@/lib/storage";
import { getStation } from "@/lib/stations";

export const roomSchema = z.object({
  // .trim() กันช่องว่างหน้า/ท้ายชื่อ ซึ่งทำให้ตัวกรองโครงการเทียบไม่ตรง
  projectName: z.string().trim().min(1, "กรุณากรอกชื่อโครงการ"),
  tower: z.string().trim().optional(),
  roomNumber: z.string().trim().min(1, "กรุณากรอกเลขห้อง"),
  floor: z.string().trim().optional(),
  sizeSqm: z.coerce.number().positive().optional().or(z.literal(NaN)),
  roomType: z.string().trim().optional(),
  ownerName: z.string().trim().min(1, "กรุณากรอกชื่อเจ้าของ"),
  ownerPhone: z.string().trim().min(1, "กรุณากรอกเบอร์โทรเจ้าของ"),
  ownerLineId: z.string().trim().optional(),
  listingType: z.enum(["RENT", "SALE", "BOTH"]),
  saleType: z.string().trim().optional(),
  status: z.enum(["AVAILABLE", "RESERVED", "RENTED", "SOLD"]),
  salePrice: z.coerce.number().nonnegative().optional().or(z.literal(NaN)),
  rentPrice: z.coerce.number().nonnegative().optional().or(z.literal(NaN)),
  remark: z.string().optional(),
});

// ช่องราคาในฟอร์มใส่ลูกน้ำคั่นหลักพัน (เช่น "26,500") — ต้องลอกลูกน้ำออกก่อน
// ให้ zod แปลงเป็นตัวเลข ไม่งั้น Number("26,500") = NaN
function stripCommas(v: FormDataEntryValue | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const cleaned = v.replace(/,/g, "").trim();
  return cleaned || undefined;
}

export function parseRoom(formData: FormData) {
  const raw = {
    projectName: formData.get("projectName"),
    tower: formData.get("tower"),
    roomNumber: formData.get("roomNumber"),
    floor: formData.get("floor"),
    sizeSqm: stripCommas(formData.get("sizeSqm")),
    roomType: formData.get("roomType"),
    ownerName: formData.get("ownerName"),
    ownerPhone: formData.get("ownerPhone"),
    ownerLineId: formData.get("ownerLineId") || undefined,
    listingType: formData.get("listingType"),
    saleType: formData.get("saleType") || undefined,
    status: formData.get("status"),
    salePrice: stripCommas(formData.get("salePrice")),
    rentPrice: stripCommas(formData.get("rentPrice")),
    remark: formData.get("remark") || undefined,
  };
  return roomSchema.safeParse(raw);
}

export function clean(n: number | undefined) {
  return n != null && !Number.isNaN(n) ? n : null;
}

/**
 * แปลงฟิลด์ "stations" (JSON จากฟอร์ม) เป็นรายการสถานีที่ผ่านการตรวจสอบ
 * รูปแบบที่รับ: [{ station: "BTS_...", distanceMeters: 250 }, ...]
 * - ตัดสถานีที่ไม่รู้จัก / ระยะไม่ใช่ตัวเลขบวก ทิ้ง
 * - กันสถานีซ้ำ (เก็บอันแรก)
 */
export function parseStations(
  formData: FormData,
): { station: string; distanceMeters: number }[] {
  const raw = formData.get("stations");
  if (typeof raw !== "string" || !raw.trim()) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];

  const seen = new Set<string>();
  const out: { station: string; distanceMeters: number }[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const station = (item as { station?: unknown }).station;
    const distance = (item as { distanceMeters?: unknown }).distanceMeters;
    if (typeof station !== "string" || !getStation(station)) continue;
    if (seen.has(station)) continue;
    const meters =
      typeof distance === "number"
        ? distance
        : Number(String(distance).replace(/[^\d]/g, ""));
    if (!Number.isFinite(meters) || meters <= 0) continue;
    seen.add(station);
    out.push({ station, distanceMeters: Math.round(meters) });
  }
  return out;
}

export async function saveImages(
  formData: FormData,
  roomId: string,
  startOrder = 0,
): Promise<{ uploaded: number; failed: number }> {
  const files = formData.getAll("images").filter((f): f is File => f instanceof File);
  let order = startOrder;
  let uploaded = 0;
  let failed = 0;
  for (const file of files) {
    if (!isValidImage(file)) continue;
    try {
      const url = await uploadImage(file);
      await prisma.roomImage.create({
        data: { roomId, url, sortOrder: order++ },
      });
      uploaded++;
    } catch (err) {
      failed++;
      console.error(
        `[saveImages] failed to upload image for room ${roomId}:`,
        err,
      );
    }
  }
  return { uploaded, failed };
}
