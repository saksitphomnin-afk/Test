import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseRoom, clean, saveImages } from "@/lib/room-mutations";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  }
  const user = session.user;

  const formData = await req.formData();
  const parsed = parseRoom(formData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
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
    return NextResponse.json(
      { error: `มีห้องนี้อยู่แล้วในระบบ: ${d.projectName} ห้อง ${d.roomNumber}` },
      { status: 409 },
    );
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
      ownerLineId: d.ownerLineId || null,
      listingType: d.listingType,
      status: d.status,
      salePrice: clean(d.salePrice),
      rentPrice: clean(d.rentPrice),
      remark: d.remark || null,
      createdById: user.id,
      remarkLogs: { create: initialLogs },
    },
  });

  const { failed } = await saveImages(formData, room.id);

  revalidatePath("/");
  return NextResponse.json({
    ok: true,
    redirectTo:
      failed > 0 ? `/rooms/${room.id}?photoError=${failed}` : `/rooms/${room.id}`,
  });
}
