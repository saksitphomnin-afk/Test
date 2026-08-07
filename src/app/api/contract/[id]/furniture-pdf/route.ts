import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { renderFurniturePdf } from "@/lib/furniture-pdf";

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
      room: { select: { projectName: true, roomNumber: true, floor: true, ownerName: true } },
      furnitureItems: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!contract) {
    return new Response("Not found", { status: 404 });
  }
  if (contract.furnitureItems.length === 0) {
    return new Response("ยังไม่มีรูปเฟอร์นิเจอร์", { status: 400 });
  }

  const buffer = await renderFurniturePdf({
    projectName: contract.room.projectName,
    roomNumber: contract.room.roomNumber,
    floor: contract.room.floor,
    ownerName: contract.room.ownerName,
    items: contract.furnitureItems.map((it) => ({
      category: it.category,
      isDefect: it.isDefect,
      caption: it.caption,
      url: it.url,
    })),
  });

  const rawName = `furniture-${contract.room.projectName}-${contract.room.roomNumber}.pdf`;
  const asciiName = rawName.replace(/[^\x20-\x7E]/g, "_");

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(rawName)}`,
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
