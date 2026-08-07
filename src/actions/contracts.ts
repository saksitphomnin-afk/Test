"use server";

import { revalidatePath } from "next/cache";
import type { ContractType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { contractSections, prefillFromRoom, type ContractData } from "@/lib/contract";
import { isValidImage, uploadImage } from "@/lib/storage";

export type ContractFormState = { error?: string; contractId?: string };
export type MoveContractState = { error?: string };

/** งบใส่ลูกน้ำในฟอร์ม ("20,000") → ลอกลูกน้ำก่อนแปลงเป็นตัวเลข */
function parseAmount(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const cleaned = v.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export async function saveContract(
  roomId: string,
  type: ContractType,
  _prev: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  const user = await requireUser();

  const data: ContractData = {};
  for (const section of contractSections(type)) {
    for (const f of section.fields) {
      data[f.name] = String(formData.get(f.name) ?? "").trim();
    }
  }

  const customerIdRaw = String(formData.get("customerId") ?? "").trim();
  const customerId = customerIdRaw || null;
  const bookingPaid = formData.get("bookingPaid") === "on";
  const bookingAmount = parseAmount(formData.get("bookingAmount"));

  const existing = await prisma.contract.findFirst({ where: { roomId, type } });

  let slipUrl = existing?.slipUrl ?? null;
  const slip = formData.get("slip");
  if (slip instanceof File && isValidImage(slip)) {
    slipUrl = await uploadImage(slip);
  }

  const bookingData = { customerId, bookingPaid, bookingAmount, slipUrl };

  const contract = existing
    ? await prisma.contract.update({
        where: { id: existing.id },
        data: { data, ...bookingData },
      })
    : await prisma.contract.create({
        data: { roomId, type, data, createdById: user.id, ...bookingData },
      });

  revalidatePath(`/rooms/${roomId}/contract`);
  revalidatePath(`/customers`);
  return { contractId: contract.id };
}

/**
 * ย้ายสัญญาไปห้อง/โครงการอื่น (แก้กรณีเซลกดเลือกห้องผิดตอนแมทสัญญากับลูกค้า) — อัปเดต roomId
 * และรีเฟรชฟิลด์ที่ผูกกับห้อง (โครงการ/ห้อง/ชั้น/ขนาด/ราคา/เจ้าของ) ให้ตรงกับห้องใหม่ ส่วนข้อมูลอื่นที่
 * กรอกเองไว้แล้ว (ชื่อลูกค้า, ราคาที่ต่อรอง ฯลฯ) คงเดิม ไม่ทับ — ไม่รวม contractDate เพราะไม่ควรทับ
 * วันที่ทำสัญญาที่กรอกไว้แล้วโดยไม่ตั้งใจ
 */
export async function moveContractToRoom(
  contractId: string,
  newRoomId: string,
): Promise<MoveContractState> {
  const user = await requireUser();
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) return { error: "ไม่พบสัญญา" };
  if (contract.createdById !== user.id && user.role !== "ADMIN") {
    return { error: "ไม่มีสิทธิ์แก้ไขสัญญานี้" };
  }
  if (contract.roomId === newRoomId) return {};

  const clash = await prisma.contract.findFirst({
    where: { roomId: newRoomId, type: contract.type },
  });
  if (clash) {
    return { error: "ห้องนี้มีสัญญาประเภทเดียวกันอยู่แล้ว ไม่สามารถย้ายไปทับได้" };
  }

  const newRoom = await prisma.room.findUnique({ where: { id: newRoomId } });
  if (!newRoom) return { error: "ไม่พบห้องปลายทาง" };

  const { contractDate: _skip, ...roomFields } = prefillFromRoom(contract.type, newRoom);
  const data = { ...(contract.data as ContractData), ...roomFields };

  await prisma.contract.update({
    where: { id: contractId },
    data: { roomId: newRoomId, data },
  });

  revalidatePath(`/rooms/${contract.roomId}/contract`);
  revalidatePath(`/rooms/${newRoomId}/contract`);
  revalidatePath("/customers");
  return {};
}
