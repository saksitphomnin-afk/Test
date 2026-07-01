import Link from "next/link";
import type { Room, RoomImage } from "@prisma/client";
import { StatusBadge } from "@/components/StatusBadge";
import { LISTING_META, formatBaht } from "@/lib/constants";

type RoomWithImages = Room & { images: RoomImage[] };

export function RoomCard({ room }: { room: RoomWithImages }) {
  const cover = room.images[0]?.url;
  const priceLabel =
    room.listingType === "SALE"
      ? formatBaht(room.salePrice)
      : room.listingType === "RENT"
        ? `${formatBaht(room.rentPrice)}/เดือน`
        : `${formatBaht(room.salePrice)} · ${formatBaht(room.rentPrice)}/ด.`;

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={room.projectName}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-gray-400">
            ไม่มีรูป
          </div>
        )}
        <div className="absolute left-2 top-2">
          <StatusBadge status={room.status} />
        </div>
        {room.images.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {room.images.length} รูป
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-gray-900">
            {room.projectName}
          </h3>
          <span className="shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {LISTING_META[room.listingType].label}
          </span>
        </div>
        <p className="text-sm text-gray-500">
          ห้อง {room.roomNumber}
          {room.tower ? ` · ตึก ${room.tower}` : ""}
          {room.roomType ? ` · ${room.roomType}` : ""}
        </p>
        <p className="mt-1 font-semibold text-brand-700">{priceLabel}</p>
        <div className="mt-1 text-sm text-gray-600">
          <span className="text-gray-500">เจ้าของ:</span> {room.ownerName} ·{" "}
          {room.ownerPhone}
        </div>
        {room.remark && (
          <p className="mt-1 line-clamp-2 rounded-lg bg-amber-50 px-2 py-1 text-xs text-amber-800">
            💬 {room.remark}
          </p>
        )}
      </div>
    </Link>
  );
}
