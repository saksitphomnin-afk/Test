import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseRoom, clean, saveImages } from "@/lib/room-mutations";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  }
  const { id } = await params;

  const formData = await req.formData();
  const parsed = parseRoom(formData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
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
      ownerLineId: d.ownerLineId || null,
      listingType: d.listingType,
      status: d.status,
      salePrice: clean(d.salePrice),
      rentPrice: clean(d.rentPrice),
    },
  });

  const existingCount = await prisma.roomImage.count({ where: { roomId: id } });
  const { failed } = await saveImages(formData, id, existingCount);

  revalidatePath("/");
  revalidatePath(`/rooms/${id}`);
  return NextResponse.json({
    ok: true,
    redirectTo: failed > 0 ? `/rooms/${id}?photoError=${failed}` : `/rooms/${id}`,
  });
}
