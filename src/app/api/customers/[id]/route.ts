import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parseCustomer, findConflict, normalizePhone } from "@/lib/customers";
import { formatDateTime } from "@/lib/constants";

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

  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบลูกค้า" }, { status: 404 });
  }
  // แก้ได้เฉพาะเจ้าของ หรือ admin
  const isOwner = existing.createdById === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไข" }, { status: 403 });
  }

  const formData = await req.formData();
  const parsed = parseCustomer(formData);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const conflict = await findConflict(d, id);
  if (conflict) {
    const fieldLabel =
      conflict.field === "phone"
        ? "เบอร์โทร"
        : conflict.field === "lineId"
          ? "Line ID"
          : "ชื่อ";
    return NextResponse.json(
      {
        error: `⚠️ ลูกค้านี้ (${fieldLabel}ซ้ำ) ดูแลโดย "${conflict.ownerName}" ตั้งแต่ ${formatDateTime(conflict.since)} — แก้ให้ซ้ำไม่ได้`,
      },
      { status: 409 },
    );
  }

  await prisma.customer.update({
    where: { id },
    data: {
      name: d.name,
      phone: normalizePhone(d.phone),
      lineId: d.lineId || null,
      budget: d.budget ?? null,
      note: d.note || null,
      status: d.status,
    },
  });

  revalidatePath("/customers");
  return NextResponse.json({ ok: true, redirectTo: "/customers" });
}
