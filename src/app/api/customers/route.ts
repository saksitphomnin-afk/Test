import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  parseCustomer,
  findConflict,
  normalizePhone,
  deriveDefaultPrefix,
  formatCustomerCode,
} from "@/lib/customers";
import { formatDateTime } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
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

  // กันลูกค้าชน: ถ้าเบอร์/ไลน์/ชื่อ ซ้ำกับที่คนในทีมแอดไว้ → เพิ่มไม่ได้
  const conflict = await findConflict(d);
  if (conflict) {
    const fieldLabel =
      conflict.field === "phone"
        ? "เบอร์โทร"
        : conflict.field === "lineId"
          ? "Line ID"
          : "ชื่อ";
    return NextResponse.json(
      {
        error: `⚠️ ลูกค้านี้ (${fieldLabel}ซ้ำ) ดูแลโดย "${conflict.ownerName}" ตั้งแต่ ${formatDateTime(conflict.since)} — เพิ่มซ้ำไม่ได้`,
      },
      { status: 409 },
    );
  }

  // ออกรหัสรันแบบ atomic: เพิ่มตัวนับของผู้ใช้คนนี้ แล้วประกอบ prefix-เลขรัน (กัน 3 account ชนกัน)
  const userId = session.user.id;
  await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { customerSeq: { increment: 1 } },
      select: { name: true, customerPrefix: true, customerSeq: true },
    });
    const prefix = user.customerPrefix?.trim() || deriveDefaultPrefix(user.name);
    const code = formatCustomerCode(prefix, user.customerSeq);
    await tx.customer.create({
      data: {
        code,
        name: d.name,
        phone: normalizePhone(d.phone),
        lineId: d.lineId || null,
        budget: d.budget ?? null,
        note: d.note || null,
        status: d.status,
        createdById: userId,
      },
    });
  });

  revalidatePath("/customers");
  return NextResponse.json({ ok: true, redirectTo: "/customers" });
}
