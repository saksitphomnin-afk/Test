import type { RoomStatus, ListingType, ContractType } from "@prisma/client";

export const STATUS_META: Record<
  RoomStatus,
  { label: string; badge: string; dot: string }
> = {
  AVAILABLE: {
    label: "ว่าง",
    badge: "bg-green-100 text-green-800 ring-green-200",
    dot: "bg-green-500",
  },
  RESERVED: {
    label: "จอง",
    badge: "bg-amber-100 text-amber-800 ring-amber-200",
    dot: "bg-amber-500",
  },
  RENTED: {
    label: "เช่าแล้ว",
    badge: "bg-sky-100 text-sky-800 ring-sky-200",
    dot: "bg-sky-500",
  },
  SOLD: {
    label: "ขายแล้ว",
    badge: "bg-rose-100 text-rose-800 ring-rose-200",
    dot: "bg-rose-500",
  },
};

export const STATUS_ORDER: RoomStatus[] = [
  "AVAILABLE",
  "RESERVED",
  "RENTED",
  "SOLD",
];

export const LISTING_META: Record<ListingType, { label: string }> = {
  RENT: { label: "ให้เช่า" },
  SALE: { label: "ขาย" },
  BOTH: { label: "เช่า/ขาย" },
};

export const CONTRACT_META: Record<ContractType, { label: string }> = {
  RENT: { label: "สัญญาเช่า" },
  SALE: { label: "สัญญาซื้อขาย" },
};

export function formatBaht(value?: number | null): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

/**
 * Formats a date as a short Thai relative-time string, e.g. "2 ชั่วโมงที่แล้ว".
 * Falls back to a plain date for anything older than ~a month.
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) return "เมื่อสักครู่";

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} ชั่วโมงที่แล้ว`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} วันที่แล้ว`;

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(d);
}

/** ช่วงตัวเลขสำหรับตัวกรอง dropdown — key ใช้เป็นค่าใน URL, gte/lte ใช้ทำ where clause */
export type NumberRange = {
  key: string;
  label: string;
  gte?: number;
  lte?: number;
};

/** ช่วงขนาดห้อง (ตร.ม.) */
export const SIZE_RANGES: NumberRange[] = [
  { key: "0-30", label: "ไม่เกิน 30 ตร.ม.", lte: 30 },
  { key: "30-45", label: "30 – 45 ตร.ม.", gte: 30, lte: 45 },
  { key: "45-60", label: "45 – 60 ตร.ม.", gte: 45, lte: 60 },
  { key: "60-", label: "60 ตร.ม. ขึ้นไป", gte: 60 },
];

/** ช่วงค่าเช่า/เดือน (บาท) — ราคาเป็นจำนวนเต็ม ขอบเขตไม่ทับกัน */
export const RENT_RANGES: NumberRange[] = [
  { key: "0-15000", label: "ไม่เกิน 15,000", lte: 15000 },
  { key: "15000-25000", label: "15,001 – 25,000", gte: 15001, lte: 25000 },
  { key: "25000-40000", label: "25,001 – 40,000", gte: 25001, lte: 40000 },
  { key: "40000-70000", label: "40,001 – 70,000", gte: 40001, lte: 70000 },
  { key: "70000-", label: "70,000 ขึ้นไป", gte: 70001 },
];

/** แปลง key ของช่วง → เงื่อนไข Prisma { gte?, lte? } (คืน undefined ถ้า key ไม่ตรง) */
export function rangeToFilter(
  ranges: NumberRange[],
  key?: string,
): { gte?: number; lte?: number } | undefined {
  if (!key) return undefined;
  const r = ranges.find((x) => x.key === key);
  if (!r) return undefined;
  const out: { gte?: number; lte?: number } = {};
  if (r.gte != null) out.gte = r.gte;
  if (r.lte != null) out.lte = r.lte;
  return out;
}
