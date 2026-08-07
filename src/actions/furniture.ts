"use server";

import { revalidatePath } from "next/cache";
import type { FurnitureCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { uploadImage, deleteImage } from "@/lib/storage";

export type UploadFurnitureState = { error?: string };

// รูปเฟอร์นิเจอร์ต้องพิมพ์ลง PDF ได้ (react-pdf ฝังได้แค่ JPEG/PNG เท่านั้น ไม่รองรับ webp/gif)
// จึงจำกัดชนิดไฟล์แคบกว่า isValidImage ทั่วไปที่ใช้กับรูปห้อง/สลิปโอนเงิน
function isPrintableImage(file: File): boolean {
  return file.size > 0 && (file.type === "image/jpeg" || file.type === "image/png");
}

async function requireContractAccess(contractId: string) {
  const user = await requireUser();
  const contract = await prisma.contract.findUnique({ where: { id: contractId } });
  if (!contract) return { error: "ไม่พบสัญญา" } as const;
  if (contract.createdById !== user.id && user.role !== "ADMIN") {
    return { error: "ไม่มีสิทธิ์แก้ไขสัญญานี้" } as const;
  }
  return { contract } as const;
}

const FURNITURE_CATEGORY_VALUES = [
  "LIVING",
  "BEDROOM",
  "MASTER_BEDROOM",
  "KITCHEN",
  "BALCONY",
  "BATHROOM_1",
  "BATHROOM_2",
] as const;

export async function uploadFurniturePhotos(
  contractId: string,
  _prev: UploadFurnitureState,
  formData: FormData,
): Promise<UploadFurnitureState> {
  const access = await requireContractAccess(contractId);
  if ("error" in access) return { error: access.error };

  const categoryRaw = String(formData.get("category") ?? "");
  if (!FURNITURE_CATEGORY_VALUES.includes(categoryRaw as FurnitureCategory)) {
    return { error: "กรุณาเลือกหมวดหมู่" };
  }
  const category = categoryRaw as FurnitureCategory;
  const isDefect = formData.get("isDefect") === "on";

  const files = formData.getAll("images").filter((f): f is File => f instanceof File);
  const valid = files.filter(isPrintableImage);
  if (valid.length === 0) {
    return { error: "กรุณาเลือกไฟล์รูปภาพ JPEG หรือ PNG อย่างน้อย 1 ไฟล์" };
  }

  const last = await prisma.furnitureItem.findFirst({
    where: { contractId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  let order = (last?.sortOrder ?? -1) + 1;

  for (const file of valid) {
    try {
      const url = await uploadImage(file);
      await prisma.furnitureItem.create({
        data: { contractId, category, isDefect, url, sortOrder: order++ },
      });
    } catch (err) {
      console.error(`[uploadFurniturePhotos] failed to upload for contract ${contractId}:`, err);
    }
  }

  const customer = await prisma.contract.findUnique({
    where: { id: contractId },
    select: { customerId: true },
  });
  if (customer?.customerId) {
    revalidatePath(`/customers/${customer.customerId}/furniture`);
  }
  return {};
}

export async function updateFurnitureCaption(itemId: string, caption: string) {
  const item = await prisma.furnitureItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  const access = await requireContractAccess(item.contractId);
  if ("error" in access) return;

  await prisma.furnitureItem.update({ where: { id: itemId }, data: { caption } });
  const contract = await prisma.contract.findUnique({
    where: { id: item.contractId },
    select: { customerId: true },
  });
  if (contract?.customerId) {
    revalidatePath(`/customers/${contract.customerId}/furniture`);
  }
}

export async function deleteFurnitureItem(itemId: string) {
  const item = await prisma.furnitureItem.findUnique({ where: { id: itemId } });
  if (!item) return;
  const access = await requireContractAccess(item.contractId);
  if ("error" in access) return;

  await deleteImage(item.url);
  await prisma.furnitureItem.delete({ where: { id: itemId } });
  const contract = await prisma.contract.findUnique({
    where: { id: item.contractId },
    select: { customerId: true },
  });
  if (contract?.customerId) {
    revalidatePath(`/customers/${contract.customerId}/furniture`);
  }
}
