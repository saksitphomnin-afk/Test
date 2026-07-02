import { z } from "zod";
import { prisma } from "@/lib/db";

export const CUSTOMER_STATUSES = [
  "NEW",
  "CONTACTED",
  "CLOSED",
  "CANCELLED",
] as const;
export type CustomerStatusKey = (typeof CUSTOMER_STATUSES)[number];

export const CUSTOMER_STATUS_META: Record<
  CustomerStatusKey,
  { label: string; badge: string; dot: string }
> = {
  NEW: {
    label: "ใหม่",
    badge: "bg-green-100 text-green-800 ring-green-200",
    dot: "bg-green-500",
  },
  CONTACTED: {
    label: "กำลังคุย",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
  },
  CLOSED: {
    label: "ปิดการขาย",
    badge: "bg-sky-100 text-sky-800 ring-sky-200",
    dot: "bg-sky-500",
  },
  CANCELLED: {
    label: "ยกเลิก",
    badge: "bg-gray-100 text-gray-600 ring-gray-200",
    dot: "bg-gray-400",
  },
};

export const customerSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อลูกค้า"),
  phone: z.string().trim().min(1, "กรุณากรอกเบอร์โทร"),
  lineId: z.string().trim().optional(),
  note: z.string().trim().optional(),
  status: z.enum(CUSTOMER_STATUSES).default("NEW"),
});

export type CustomerInput = z.infer<typeof customerSchema>;

/** เก็บเบอร์เป็นตัวเลขล้วน เพื่อเทียบ "ลูกค้าชน" ได้แม่นแม้พิมพ์ขีด/เว้นวรรคต่างกัน */
export function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

export function parseCustomer(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name") ?? "",
    phone: formData.get("phone") ?? "",
    lineId: formData.get("lineId") || undefined,
    note: formData.get("note") || undefined,
    status: formData.get("status") || "NEW",
  });
}

export type Conflict = {
  field: "phone" | "lineId" | "name";
  ownerName: string;
  since: Date;
};

/**
 * เช็ค "ลูกค้าชน" ข้ามทั้งทีม — ถ้าเบอร์ (ตัวเลขล้วน) / Line ID / ชื่อ ตรงกับลูกค้าที่มีอยู่แล้ว
 * คืนข้อมูลว่าใครดูแล + ตั้งแต่วันไหน (ไว้บล็อกการเพิ่มซ้ำ). ส่ง excludeId ตอนแก้ไขเพื่อไม่ชนกับตัวเอง
 */
export async function findConflict(
  input: { name: string; phone: string; lineId?: string },
  excludeId?: string,
): Promise<Conflict | null> {
  const normPhone = normalizePhone(input.phone);
  const lineId = input.lineId?.trim();
  const name = input.name.trim();

  const or: Record<string, unknown>[] = [];
  if (normPhone) or.push({ phone: normPhone });
  if (lineId) or.push({ lineId: { equals: lineId, mode: "insensitive" } });
  if (name) or.push({ name: { equals: name, mode: "insensitive" } });
  if (or.length === 0) return null;

  const match = await prisma.customer.findFirst({
    where: {
      OR: or,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (!match) return null;

  const field: Conflict["field"] =
    normPhone && match.phone === normPhone
      ? "phone"
      : lineId && match.lineId?.toLowerCase() === lineId.toLowerCase()
        ? "lineId"
        : "name";

  return { field, ownerName: match.createdBy.name, since: match.createdAt };
}
