import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { renderContractPdf } from "@/lib/contract-pdf";
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
    include: {
      room: true,
      customer: { select: { name: true } },
      createdBy: { select: { name: true, fullName: true } },
    },
  });
  if (!contract) {
    return new Response("Not found", { status: 404 });
  }

  // สัญญานายหน้าอิงจาก flow "จัดหาผู้เช่า" เท่านั้น — ใช้ได้กับสัญญาเช่าที่แมทลูกค้าไว้แล้ว
  if (contract.type !== "RENT") {
    return new Response(
      "สัญญานายหน้าใช้ได้กับสัญญาเช่าที่แมทลูกค้าไว้แล้วเท่านั้น",
      { status: 400 },
    );
  }

  // สร้าง PDF สดจากข้อมูลห้อง/ลูกค้า/เซลที่มีอยู่แล้วตรง ๆ ไม่ต้องกรอกฟอร์มแยก เพราะทุกฟิลด์ของ
  // สัญญานี้ (เจ้าของ/ผู้เช่า/ทรัพย์สิน/ค่าเช่า) มีอยู่แล้วในสัญญาเช่าที่แมทไว้
  const rentData = contract.data as ContractData;
  const data: ContractData = {
    contractDate: new Date().toISOString().slice(0, 10),
    ownerName: contract.room.ownerName,
    salesRepName: contract.createdBy.fullName || contract.createdBy.name,
    propertyType: contract.room.roomType ?? "",
    propertyProject: contract.room.projectName,
    propertyRoom: contract.room.roomNumber,
    propertyFloor: contract.room.floor ?? "",
    monthlyRent:
      rentData.monthlyRent ||
      (contract.room.rentPrice ? String(contract.room.rentPrice) : ""),
    tenantName: contract.customer?.name || rentData.tenantName || "-",
  };

  const buffer = await renderContractPdf("BROKER", data);

  const rawName = `สัญญานายหน้า-${contract.room.projectName}-${contract.room.roomNumber}.pdf`;
  const asciiName = rawName.replace(/[^\x20-\x7E]/g, "_");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(rawName)}`,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
