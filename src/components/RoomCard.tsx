import Link from "next/link";
import type { Room, RoomImage } from "@prisma/client";
import { StatusBadge } from "@/components/StatusBadge";
import { LISTING_META, formatBaht, formatRelativeTime } from "@/lib/constants";
import { cn } from "@/lib/utils";

type RoomWithImages = Room & { images: RoomImage[] };

export function RoomCard({ room }: { room: RoomWithImages }) {
  const cover = room.images[0]?.url;
  const priceLabel =
    room.listingType === "SALE"
      ? formatBaht(room.salePrice)
      : room.listingType === "RENT"
        ? `${formatBaht(room.rentPrice)}/เดือน`
        : `${formatBaht(room.salePrice)} · ${formatBaht(room.rentPrice)}/ด.`;

  const specs: { icon: React.ReactNode; text: string }[] = [];
  if (room.floor) specs.push({ icon: <FloorIcon />, text: `ชั้น ${room.floor}` });
  if (room.sizeSqm)
    specs.push({ icon: <SizeIcon />, text: `${room.sizeSqm} ตร.ม.` });
  if (room.roomType)
    specs.push({ icon: <RoomTypeIcon />, text: room.roomType });

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={room.projectName}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-gray-400">
            ไม่มีรูป
          </div>
        )}

        <div className="absolute left-2 top-2 flex items-center gap-1">
          <StatusBadge status={room.status} size="sm" />
          <span className="rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200">
            {LISTING_META[room.listingType].label}
          </span>
        </div>

        {room.images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {room.images.slice(0, 5).map((img, i) => (
              <span
                key={img.id}
                className={cn(
                  "h-1 w-1 rounded-full",
                  i === 0 ? "bg-white" : "bg-white/50",
                )}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-gray-900">
          {room.projectName}
        </h3>
        <p className="text-xs text-gray-500">
          ห้อง {room.roomNumber}
          {room.tower ? ` · ตึก ${room.tower}` : ""}
        </p>

        {specs.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-600">
            {specs.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {s.icon}
                {s.text}
              </span>
            ))}
          </div>
        )}

        <p className="mt-0.5 text-lg font-bold text-brand-700">
          {priceLabel}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2 border-t border-gray-100 pt-1.5 text-[11px] text-gray-500">
          <span className="truncate">
            <span className="text-gray-400">เจ้าของ:</span> {room.ownerName}
          </span>
          <span className="flex shrink-0 items-center gap-1 text-gray-400">
            <ClockIcon />
            {formatRelativeTime(room.updatedAt)}
          </span>
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

function FloorIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5 text-gray-400"
      aria-hidden="true"
    >
      <path
        d="M10 2 3 6l7 4 7-4-7-4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="m3 10 7 4 7-4M3 14l7 4 7-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SizeIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5 text-gray-400"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="14"
        height="14"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M7 13 13 7M9 7h4v4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoomTypeIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3.5 w-3.5 text-gray-400"
      aria-hidden="true"
    >
      <path
        d="M3 9.5 10 4l7 5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 8.5V16h11V8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 16v-4h4v4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-3 w-3"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 6v4l3 2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
