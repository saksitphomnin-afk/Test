"use server";

import { revalidatePath } from "next/cache";
import type { ContractType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { contractSections, type ContractData } from "@/lib/contract";
import { isValidImage, uploadImage } from "@/lib/storage";

export type ContractFormState = { error?: string; contractId?: string };

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
