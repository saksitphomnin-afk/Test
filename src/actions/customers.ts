"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

export async function deleteCustomer(id: string) {
  const user = await requireUser();
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) redirect("/customers");
  // ลบได้เฉพาะเจ้าของ หรือ admin
  if (customer.createdById !== user.id && user.role !== "ADMIN") {
    redirect("/customers");
  }
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
  redirect("/customers");
}
