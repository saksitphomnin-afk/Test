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
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) {
    return new Response("Not found", { status: 404 });
  }

  const buffer = await renderContractPdf(
    contract.type,
    contract.data as ContractData,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="contract-${contract.type.toLowerCase()}-${id}.pdf"`,
    },
  });
}
