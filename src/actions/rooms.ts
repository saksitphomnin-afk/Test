"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { RoomStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { uploadImage, deleteImage, isValidImage } from "@/lib/storage";

export type FormState = { error?: string; ok?: boolean };

const roomSchema = z.object({
  projectName: z.string().min(1, "กรุณากรอกชื่อโครงการ"),
  tower: z.string().optional(),
  roomNumber: z.string().min(1, "กรุณากรอกเลขห้อง"),
  floor: z.string().optional(),
  sizeSqm: z.coerce.number().positive().optional().or(z.literal(NaN)),
  roomType: z.string().optional(),
  ownerName: z.string().min(1, "กรุณากรอกชื่อเจ้าของ"),
  ownerPhone: z.string().min(1, "กรุณากรอกเบอร์โทรเจ้าของ"),
  listingType: z.enum(["RENT", "SALE", "BOTH"]),
  status: z.enum(["AVAILABLE", "RESERVED", "RENTED", "SOLD"]),
  salePrice: z.coerce.number().nonnegative().optional().or(z.literal(NaN)),
  rentPrice: z.coerce.number().nonnegative().optional().or(z.literal(NaN)),
  remark: z.string().optional(),
});

function parseRoom(formData: FormData) {
  const raw = {
    projectName: formData.get("projectName"),
    tower: formData.get("tower"),
    roomNumber: formData.get("roomNumber"),
    floor: formData.get("floor"),
    sizeSqm: formData.get("sizeSqm") || undefined,
    roomType: formData.get("roomType"),
    ownerName: formData.get("ownerName"),
    ownerPhone: formData.get("ownerPhone"),
    listingType: formData.get("listingType"),
    status: formData.get("status"),
    salePrice: formData.get("salePrice") || undefined,
    rentPrice: formData.get("rentPrice") || undefined,
    remark: formData.get("remark"),
  };
  return roomSchema.safeParse(raw);
}

function clean(n: number | undefined) {
  return n != null && !Number.isNaN(n) ? n : null;
}

async function saveImages(formData: FormData, roomId: string, startOrder = 0) {
  const files = formData.getAll("images").filter((f): f is File => f instanceof File);
  let order = startOrder;
  for (const file of files) {
    if (!isValidImage(file)) continue;
    const url = await uploadImage(file);
    await prisma.roomImage.create({
      data: { roomId, url, sortOrder: order++ },
    });
  }
}

export async function createRoom(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = parseRoom(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const d = parsed.data;

  // กันเพิ่มห้องซ้ำ: โครงการ + เลขห้อง (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
  const duplicate = await prisma.room.findFirst({
    where: {
      projectName: { equals: d.projectName, mode: "insensitive" },
      roomNumber: { equals: d.roomNumber, mode: "insensitive" },
    },
  });
  if (duplicate) {
    return {
      error: `มีห้องนี้อยู่แล้วในระบบ: ${d.projectName} ห้อง ${d.roomNumber}`,
    };
  }

  // บันทึกลง Remark เสมอว่าใครเป็นคนเพิ่มห้อง (โชว์ชื่อ + เวลาให้ทีมเห็น)
  const initialLogs: { userId: string; text: string }[] = [
    { userId: user.id, text: "🆕 เพิ่มห้องเข้าระบบ" },
  ];
  if (d.remark) initialLogs.push({ userId: user.id, text: d.remark });

  const room = await prisma.room.create({
    data: {
      projectName: d.projectName,
      tower: d.tower || null,
      roomNumber: d.roomNumber,
      floor: d.floor || null,
      sizeSqm: clean(d.sizeSqm),
      roomType: d.roomType || null,
      ownerName: d.ownerName,
      ownerPhone: d.ownerPhone,
      listingType: d.listingType,
      status: d.status,
      salePrice: clean(d.salePrice),
      rentPrice: clean(d.rentPrice),
      remark: d.remark || null,
      createdById: user.id,
      remarkLogs: { create: initialLogs },
    },
  });

  await saveImages(formData, room.id);

  revalidatePath("/");
  redirect(`/rooms/${room.id}`);
}

export async function updateRoom(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireUser();
  const parsed = parseRoom(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const d = parsed.data;

  await prisma.room.update({
    where: { id },
    data: {
      projectName: d.projectName,
      tower: d.tower || null,
      roomNumber: d.roomNumber,
      floor: d.floor || null,
      sizeSqm: clean(d.sizeSqm),
      roomType: d.roomType || null,
      ownerName: d.ownerName,
      ownerPhone: d.ownerPhone,
      listingType: d.listingType,
      status: d.status,
      salePrice: clean(d.salePrice),
      rentPrice: clean(d.rentPrice),
    },
  });

  const existingCount = await prisma.roomImage.count({ where: { roomId: id } });
  await saveImages(formData, id, existingCount);

  revalidatePath("/");
  revalidatePath(`/rooms/${id}`);
  redirect(`/rooms/${id}`);
}

export async function deleteRoom(id: string) {
  await requireUser();
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
}
