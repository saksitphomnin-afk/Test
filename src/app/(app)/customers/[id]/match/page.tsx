import { notFound, redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { Input } from "@/components/ui/Field";
import { LinkButton, buttonClasses } from "@/components/ui/Button";
import { MoveContractButton } from "@/components/MoveContractButton";
import { STATUS_META, LISTING_META, CONTRACT_META, formatBaht } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ไม่ระบุคำค้นหา = แสดงห้องอัปเดตล่าสุดพอหอมปากหอมคอ (สต๊อกมีเยอะมาก แสดงหมดจะช้า/ท่วมจอ)
// พิมพ์ค้นหาแล้วไม่จำกัดจำนวน เพราะกรองแคบลงแล้ว
const DEFAULT_LIMIT = 50;

export default async function MatchRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();
  // เข้าหน้านี้ได้เฉพาะเจ้าของลูกค้า หรือ admin (เหมือนหน้าแก้ไขลูกค้า)
  if (customer.createdById !== user.id && user.role !== "ADMIN") {
    redirect("/customers");
  }

  // สัญญาล่าสุดของลูกค้ารายนี้ (ถ้ามี) — เอาไว้โชว์แบนเนอร์บอกว่าแมทกับห้องไหนอยู่ และเปลี่ยนปุ่ม
  // "เลือกห้องนี้" เป็น "ย้ายมาห้องนี้" แทน เพื่อแก้กรณีเซลกดเลือกห้อง/โครงการผิดตอนแมทสัญญา
  const latestContract = await prisma.contract.findFirst({
    where: { customerId: id },
    orderBy: { updatedAt: "desc" },
    include: { room: { select: { projectName: true, roomNumber: true } } },
  });

  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim();

  const where: Prisma.RoomWhereInput = q
    ? {
        OR: [
          { projectName: { contains: q, mode: "insensitive" } },
          { roomNumber: { contains: q, mode: "insensitive" } },
          { tower: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const rooms = await prisma.room.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: q ? undefined : DEFAULT_LIMIT,
    select: {
      id: true,
      projectName: true,
      tower: true,
      roomNumber: true,
      floor: true,
      sizeSqm: true,
      listingType: true,
      rentPrice: true,
      salePrice: true,
      status: true,
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <LinkButton href="/customers" variant="secondary" size="sm">
          ← กลับไป Enquiry
        </LinkButton>
        <h1 className="mt-3 text-xl font-semibold text-gray-900">
          เลือกห้องเพื่อทำสัญญา
        </h1>
        <p className="text-sm text-gray-500">
          ลูกค้า: <span className="font-medium text-gray-700">{customer.name}</span> (
          {customer.phone}) — เลือกห้องที่ลูกค้าคนนี้สนใจ ระบบจะพาไปกรอกรายละเอียดสัญญาต่อ
        </p>
      </div>

      {latestContract && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ตอนนี้แมทกับห้อง{" "}
          <span className="font-medium">
            {latestContract.room.projectName} {latestContract.room.roomNumber}
          </span>{" "}
          อยู่ (สัญญา{CONTRACT_META[latestContract.type].label}) — เลือกห้องด้านล่างเพื่อย้ายไปห้องอื่น
        </div>
      )}

      <form className="flex gap-2">
        <Input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder="ค้นหาโครงการ / เลขห้อง / ตึก"
          className="flex-1"
        />
        <button type="submit" className={buttonClasses("secondary", "md")}>
          ค้นหา
        </button>
      </form>

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">ไม่พบห้องที่ตรงกับคำค้นหา</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">โครงการ</th>
                <th className="px-4 py-3">ห้อง</th>
                <th className="px-4 py-3">ชั้น</th>
                <th className="px-4 py-3 text-right">ขนาด (ตร.ม.)</th>
                <th className="px-4 py-3">ประกาศ</th>
                <th className="px-4 py-3 text-right">ราคา</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">เลือก</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => {
                const meta = STATUS_META[room.status];
                return (
                  <tr
                    key={room.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {room.projectName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                      {room.roomNumber}
                      {room.tower && (
                        <span className="block text-xs text-gray-400">
                          ตึก {room.tower}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {room.floor || "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-600">
                      {room.sizeSqm ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {LISTING_META[room.listingType].label}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                      {room.listingType !== "SALE" && (
                        <span className="block">{formatBaht(room.rentPrice)}/ด.</span>
                      )}
                      {room.listingType !== "RENT" && (
                        <span className="block">{formatBaht(room.salePrice)}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                          meta.badge,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {latestContract && latestContract.roomId !== room.id ? (
                        <MoveContractButton
                          contractId={latestContract.id}
                          newRoomId={room.id}
                          contractHref={`/rooms/${room.id}/contract?customerId=${customer.id}`}
                        />
                      ) : (
                        <LinkButton
                          href={`/rooms/${room.id}/contract?customerId=${customer.id}`}
                          size="sm"
                        >
                          เลือกห้องนี้
                        </LinkButton>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!q && rooms.length === DEFAULT_LIMIT && (
            <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
              แสดง {DEFAULT_LIMIT} ห้องล่าสุด — พิมพ์ค้นหาด้านบนเพื่อดูห้องอื่น
            </p>
          )}
        </div>
      )}
    </div>
  );
}
