"use client";

import { useState } from "react";
import type { RoomImage } from "@prisma/client";
import { buttonClasses } from "@/components/ui/Button";

export function Gallery({
  roomId,
  images,
  alt,
}: {
  roomId: string;
  images: RoomImage[];
  alt: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl border border-dashed border-gray-300 bg-white text-gray-400">
        ยังไม่มีรูปห้อง
      </div>
    );
  }

  function go(dir: number) {
    setActive((i) => (i + dir + images.length) % images.length);
  }

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active].url}
          alt={alt}
          className="h-full w-full object-contain"
        />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="รูปก่อนหน้า"
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/60 text-gray-800 shadow-sm backdrop-blur transition hover:bg-white/90"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="รูปถัดไป"
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/60 text-gray-800 shadow-sm backdrop-blur transition hover:bg-white/90"
            >
              <ChevronRight />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2 py-0.5 text-xs font-medium text-white">
              {active + 1}/{images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden rounded-lg border-2 ${
                i === active ? "border-brand-600" : "border-transparent"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={`${alt} ${i + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      {/* ใช้ <a> ธรรมดา ไม่ใช้ next/link เพราะ Link จะพยายาม client-side
          navigate แทนที่จะปล่อยให้เบราว์เซอร์ดาวน์โหลดไฟล์ตามปกติ */}
      <a
        href={`/api/rooms/${roomId}/images-zip`}
        className={buttonClasses("secondary", "md") + " w-full justify-center"}
      >
        ⬇ ดาวน์โหลดรูปทั้งหมด ({images.length} รูป)
      </a>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M15 5l-7 7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
