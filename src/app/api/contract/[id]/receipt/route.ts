import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { renderReceiptPdf } from "@/lib/receipt-pdf";
import type { ContractData } from "@/lib/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { room: true, customer: true },
  });
  if (!contract) {
    return new Response("Not found", { status: 404 });
  }

  if (!contract.bookingPaid || !contract.slipUrl) {
    return new Response(
      "ยังไม่สามารถออกใบเสร็จได้ — ต้องยืนยันว่าจ่ายเงินจองแล้วและอัปโหลดสลิปก่อน",
      { status: 400 },
    );
  }

  const data = contract.data as ContractData;
  const receiptNo = `REC-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${contract.id.slice(-6).toUpperCase()}`;
  const payerName =
    contract.customer?.name || data.tenantName || data.lesseeName || "-";
  const roomLabel = `${contract.room.projectName} ${contract.room.roomNumber}`;

  const buffer = await renderReceiptPdf({
    receiptNo,
    payerName,
    roomLabel,
    bookingAmount: contract.bookingAmount ?? 0,
  });

  // Content-Disposition ต้องเป็น ASCII เท่านั้น — ชื่อไฟล์ภาษาไทยใส่ผ่าน
  // filename* (RFC 5987) แทน ส่วน filename= เก็บ fallback แบบ ASCII ไว้ให้ client เก่า
  const rawName = `ใบเสร็จ-${receiptNo}.pdf`;
  const asciiName = rawName.replace(/[^\x20-\x7E]/g, "_");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(rawName)}`,
    },
  });
}
