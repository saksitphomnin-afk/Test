"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { isValidTemplateFile, uploadTemplateFile, deleteTemplateFile } from "@/lib/storage";

export async function uploadTemplate(formData: FormData) {
  const user = await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const file = formData.get("file");
  if (!title) throw new Error("กรุณาตั้งชื่อไฟล์");
  if (!(file instanceof File) || !isValidTemplateFile(file)) {
    throw new Error("กรุณาเลือกไฟล์ PDF");
  }

  const url = await uploadTemplateFile(file);
  const maxOrder = await prisma.contractTemplate.aggregate({
    _max: { sortOrder: true },
  });

  await prisma.contractTemplate.create({
    data: {
      title,
      url,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      uploadedById: user.id,
    },
  });

  revalidatePath("/templates");
}

export async function deleteTemplate(id: string) {
  await requireAdmin();
  const template = await prisma.contractTemplate.findUnique({ where: { id } });
  if (!template) return;
  await deleteTemplateFile(template.url);
  await prisma.contractTemplate.delete({ where: { id } });
  revalidatePath("/templates");
}
