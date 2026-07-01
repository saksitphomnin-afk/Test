"use server";

import { revalidatePath } from "next/cache";
import type { ContractType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { contractSections, type ContractData } from "@/lib/contract";

export type ContractFormState = { error?: string; contractId?: string };

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

  const existing = await prisma.contract.findFirst({ where: { roomId, type } });
  const contract = existing
    ? await prisma.contract.update({
        where: { id: existing.id },
        data: { data },
      })
    : await prisma.contract.create({
        data: { roomId, type, data, createdById: user.id },
      });

  revalidatePath(`/rooms/${roomId}/contract`);
  return { contractId: contract.id };
}
