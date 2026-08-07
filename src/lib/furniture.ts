import type { FurnitureCategory } from "@prisma/client";

// ลำดับ/label คงที่ ใช้ร่วมกันทั้งหน้าอัปโหลด (dropdown + การ์ดตามหมวด) และตัว PDF
// เพื่อให้ทุกที่แสดงหมวดเรียงลำดับและใช้ชื่อเดียวกันเสมอ
export const FURNITURE_CATEGORIES: { value: FurnitureCategory; label: string }[] = [
  { value: "LIVING", label: "Living" },
  { value: "BEDROOM", label: "Bedroom" },
  { value: "MASTER_BEDROOM", label: "Master Bedroom" },
  { value: "KITCHEN", label: "Kitchen" },
  { value: "BALCONY", label: "Balcony" },
  { value: "BATHROOM_1", label: "Bathroom 1" },
  { value: "BATHROOM_2", label: "Bathroom 2" },
];

export const FURNITURE_CATEGORY_LABEL: Record<FurnitureCategory, string> =
  Object.fromEntries(FURNITURE_CATEGORIES.map((c) => [c.value, c.label])) as Record<
    FurnitureCategory,
    string
  >;
