import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { renderContractPdf, type Lang } from "@/lib/contract-pdf";
import type { ContractData } from "@/lib/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseLang(value: string | null): Lang {
  const v = (value ?? "").toUpperCase();
  return v === "TH" || v === "EN" || v === "BOTH" ? v : "BOTH";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true, fullName: true } } },
  });
  if (!contract) {
    return new Response("Not found", { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const lang = parseLang(searchParams.get("lang"));

  // ชื่อเซล (คนสร้างสัญญา) — ใช้เติมช่องพยานในหน้าลงชื่อให้อัตโนมัติ ใช้ชื่อ-นามสกุลจริงถ้ามี
  // ไม่งั้น fallback เป็นชื่อบัญชี (มักเป็นชื่อเล่น) เหมือน pattern เดียวกับใบเสร็จ/สัญญานายหน้า
  const data: ContractData = {
    ...(contract.data as ContractData),
    salesRepName: contract.createdBy.fullName || contract.createdBy.name,
  };

  const buffer = await renderContractPdf(contract.type, data, lang);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="contract-${contract.type.toLowerCase()}-${id}.pdf"`,
      // กันเบราว์เซอร์แคชไฟล์ PDF เดิม (URL เดิมทุกครั้ง) — โหลดครั้งหน้าได้ตัวล่าสุดเสมอ
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
