"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export type UserFormState = { error?: string; ok?: boolean };

const createSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านอย่างน้อย 6 ตัวอักษร"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function createUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { name, email, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "อีเมลนี้ถูกใช้งานแล้ว" };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash, role } });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetPassword(
  id: string,
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  await requireAdmin();
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) {
    return { error: "รหัสผ่านอย่างน้อย 6 ตัวอักษร" };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  return { ok: true };
}

export async function deleteUser(id: string) {
  const admin = await requireAdmin();
  if (admin.id === id) redirect("/admin/users?err=self");

  const [rooms, logs, contracts] = await Promise.all([
    prisma.room.count({ where: { createdById: id } }),
    prisma.remarkLog.count({ where: { userId: id } }),
    prisma.contract.count({ where: { createdById: id } }),
  ]);
  if (rooms + logs + contracts > 0) {
    redirect("/admin/users?err=hasdata");
  }

  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  redirect("/admin/users?msg=deleted");
}
