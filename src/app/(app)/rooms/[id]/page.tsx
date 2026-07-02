import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Gallery } from "@/components/Gallery";
import { StatusChanger } from "@/components/StatusChanger";
import { RemarkSection } from "@/components/RemarkSection";
import { DeleteRoomButton } from "@/components/DeleteRoomButton";
import { LinkButton } from "@/components/ui/Button";
import { LISTING_META, formatBaht } from "@/lib/constants";

export const dynamic = "force-dynamic";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ photoError?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const photoError = Number(sp.photoError ?? 0);
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      remarkLogs: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!room) notFound();

  return (
    <div className="space-y-6">
      {photoError > 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ⚠️ บันทึกห้องสำเร็จ แต่มี {photoError} รูปที่อัปโหลดไม่สำเร็จ
          กรุณาลองอัปโหลดรูปใหม่อีกครั้งที่หน้าแก้ไขห้อง
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-brand-600 hover:underline">
            ← กลับหน้าหลัก
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-gray-900">
            {room.projectName}
          </h1>
          <p className="text-sm text-gray-500">
            ห้อง {room.roomNumber}
            {room.tower ? ` · ตึก ${room.tower}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/rooms/${id}/contract`} variant="secondary" size="sm">
            ออกสัญญา / PDF
          </LinkButton>
          <LinkButton href={`/rooms/${id}/edit`} variant="secondary" size="sm">
            แก้ไข
          </LinkButton>
          <DeleteRoomButton id={id} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Gallery roomId={room.id} images={room.images} alt={room.projectName} />

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-sm font-semibold text-gray-500">สถานะ</h2>
            <StatusChanger roomId={room.id} status={room.status} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-base font-semibold text-gray-900">
              รายละเอียด
            </h2>
            <InfoRow label="ประเภทประกาศ" value={LISTING_META[room.listingType].label} />
            <InfoRow label="ประเภทห้อง" value={room.roomType} />
            <InfoRow label="ชั้น" value={room.floor} />
            <InfoRow
              label="ขนาด"
              value={room.sizeSqm ? `${room.sizeSqm} ตร.ม.` : null}
            />
            <InfoRow
              label="ราคาขาย"
              value={room.salePrice ? formatBaht(room.salePrice) : null}
            />
            <InfoRow
              label="ค่าเช่า/เดือน"
              value={room.rentPrice ? formatBaht(room.rentPrice) : null}
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 text-base font-semibold text-gray-900">
              เจ้าของห้อง
            </h2>
            <InfoRow label="ชื่อเจ้าของ" value={room.ownerName} />
            <InfoRow label="เบอร์โทร" value={room.ownerPhone} />
            <InfoRow label="Line ID" value={room.ownerLineId} />
            <a
              href={`tel:${room.ownerPhone}`}
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
            >
              📞 โทรหาเจ้าของ
            </a>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          Remark / ประวัติการอัปเดต
        </h2>
        <RemarkSection roomId={room.id} logs={room.remarkLogs} />
      </div>
    </div>
  );
}
