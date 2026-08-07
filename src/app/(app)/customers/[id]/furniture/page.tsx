import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { LinkButton, buttonClasses } from "@/components/ui/Button";
import { FurnitureUploadForm } from "@/components/FurnitureUploadForm";
import { FurnitureGrid } from "@/components/FurnitureGrid";
import { FURNITURE_CATEGORIES } from "@/lib/furniture";

export const dynamic = "force-dynamic";

export default async function FurniturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();
  if (customer.createdById !== user.id && user.role !== "ADMIN") {
    redirect("/customers");
  }

  // ใช้สัญญาล่าสุดของลูกค้ารายนี้เป็น "สัญญาที่กำลังทำเฟอร์นิเจอร์ลิสต์อยู่" — ตรงกับปุ่ม "ทำสัญญา"/
  // "เปลี่ยนห้อง" ในหน้า Enquiry ที่อ้างอิงสัญญาล่าสุดเช่นกัน
  const contract = await prisma.contract.findFirst({
    where: { customerId: id },
    orderBy: { updatedAt: "desc" },
    include: {
      room: { select: { projectName: true, roomNumber: true, floor: true, ownerName: true } },
      furnitureItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <LinkButton href="/customers" variant="secondary" size="sm">
          ← กลับไป Enquiry
        </LinkButton>
        <h1 className="mt-3 text-xl font-semibold text-gray-900">เฟอร์นิเจอร์ลิสต์</h1>
        <p className="text-sm text-gray-500">
          ลูกค้า: <span className="font-medium text-gray-700">{customer.name}</span> (
          {customer.phone})
        </p>
      </div>

      {!contract ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">ลูกค้ารายนี้ยังไม่มีสัญญาที่แมทไว้ — ต้องทำสัญญาก่อน</p>
          <div className="mt-4">
            <LinkButton href={`/customers/${id}/match`} size="sm">
              ไปเลือกห้องเพื่อทำสัญญา
            </LinkButton>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-base font-semibold text-gray-900">ห้อง/โครงการอ้างอิง</h2>
            <p className="text-sm text-gray-600">
              {contract.room.projectName} ห้อง {contract.room.roomNumber}
              {contract.room.floor && ` ชั้น ${contract.room.floor}`} — เจ้าของ{" "}
              {contract.room.ownerName}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">เพิ่มรูปเฟอร์นิเจอร์</h2>
            <FurnitureUploadForm contractId={contract.id} />
          </div>

          {FURNITURE_CATEGORIES.map((cat) => {
            const items = contract.furnitureItems.filter((it) => it.category === cat.value);
            const normal = items.filter((it) => !it.isDefect);
            const defects = items.filter((it) => it.isDefect);
            return (
              <div
                key={cat.value}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h2 className="mb-4 text-base font-semibold text-gray-900">{cat.label}</h2>
                {items.length === 0 ? (
                  <p className="text-sm text-gray-400">ยังไม่มีรูปในหมวดนี้</p>
                ) : (
                  <div className="space-y-4">
                    <FurnitureGrid items={normal} />
                    {defects.length > 0 && (
                      <div>
                        <p className="mb-2 text-sm font-medium text-amber-700">Defect</p>
                        <FurnitureGrid items={defects} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {contract.furnitureItems.length > 0 && (
            <div className="flex justify-end">
              <a
                href={`/api/contract/${contract.id}/furniture-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("secondary", "md")}
              >
                ⬇ ดาวน์โหลด PDF
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
