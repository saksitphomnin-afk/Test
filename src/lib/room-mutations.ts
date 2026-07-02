import { z } from "zod";
import { prisma } from "@/lib/db";
import { uploadImage, isValidImage } from "@/lib/storage";

export const roomSchema = z.object({
  projectName: z.string().min(1, "กรุณากรอกชื่อโครงการ"),
  tower: z.string().optional(),
  roomNumber: z.string().min(1, "กรุณากรอกเลขห้อง"),
  floor: z.string().optional(),
  sizeSqm: z.coerce.number().positive().optional().or(z.literal(NaN)),
  roomType: z.string().optional(),
  ownerName: z.string().min(1, "กรุณากรอกชื่อเจ้าของ"),
  ownerPhone: z.string().min(1, "กรุณากรอกเบอร์โทรเจ้าของ"),
  listingType: z.enum(["RENT", "SALE", "BOTH"]),
  status: z.enum(["AVAILABLE", "RESERVED", "RENTED", "SOLD"]),
  salePrice: z.coerce.number().nonnegative().optional().or(z.literal(NaN)),
  rentPrice: z.coerce.number().nonnegative().optional().or(z.literal(NaN)),
  remark: z.string().optional(),
});

export function parseRoom(formData: FormData) {
  const raw = {
    projectName: formData.get("projectName"),
    tower: formData.get("tower"),
    roomNumber: formData.get("roomNumber"),
    floor: formData.get("floor"),
    sizeSqm: formData.get("sizeSqm") || undefined,
    roomType: formData.get("roomType"),
    ownerName: formData.get("ownerName"),
    ownerPhone: formData.get("ownerPhone"),
    listingType: formData.get("listingType"),
    status: formData.get("status"),
    salePrice: formData.get("salePrice") || undefined,
    rentPrice: formData.get("rentPrice") || undefined,
    remark: formData.get("remark") || undefined,
  };
  return roomSchema.safeParse(raw);
}

export function clean(n: number | undefined) {
  return n != null && !Number.isNaN(n) ? n : null;
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
