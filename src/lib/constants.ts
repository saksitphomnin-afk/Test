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
