"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RoomStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser, requireAdmin } from "@/lib/auth-helpers";
import { deleteImage } from "@/lib/storage";

export async function deleteRoom(id: string) {
  // ลบห้องได้เฉพาะแอดมิน (member โดนเด้งกลับหน้าหลักโดยไม่ลบ)
  await requireAdmin();
  const images = await prisma.roomImage.findMany({ where: { roomId: id } });
  await Promise.all(images.map((img) => deleteImage(img.url)));
  await prisma.room.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

export async function updateStatus(roomId: string, status: RoomStatus) {
  await requireUser();
  await prisma.room.update({ where: { id: roomId }, data: { status } });
  revalidatePath("/");
  revalidatePath(`/rooms/${roomId}`);
}

export async function addRemark(roomId: string, formData: FormData) {
  const user = await requireUser();
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;
  await prisma.$transaction([
    prisma.remarkLog.create({ data: { roomId, userId: user.id, text } }),
    prisma.room.update({ where: { id: roomId }, data: { remark: text } }),
  ]);
  revalidatePath(`/rooms/${roomId}`);
  revalidatePath("/");
}

export async function deleteRoomImage(imageId: string) {
  await requireUser();
  const image = await prisma.roomImage.findUnique({ where: { id: imageId } });
  if (!image) return;
  await deleteImage(image.url);
  await prisma.roomImage.delete({ where: { id: imageId } });
  revalidatePath(`/rooms/${image.roomId}`);
  revalidatePath(`/rooms/${image.roomId}/edit`);
}
