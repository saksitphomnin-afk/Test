"use client";

import { useState } from "react";
import type { RoomImage } from "@prisma/client";
import { cn } from "@/lib/utils";

export function RoomCardImages({
  images,
  alt,
}: {
  images: RoomImage[];
  alt: string;
}) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid h-full w-full place-items-center text-sm text-gray-400">
        ไม่มีรูป
      </div>
    );
  }

  // กดลูกศรแล้วเลื่อนรูปในการ์ด โดยไม่เผลอเปิดหน้ารายละเอียด (การ์ดครอบด้วย <Link>)
  function go(e: React.MouseEvent, dir: number) {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + dir + images.length) % images.length);
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index].url}
        alt={alt}
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
      />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => go(e, -1)}
            aria-label="รูปก่อนหน้า"
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/60 text-gray-800 shadow-sm backdrop-blur transition hover:bg-white/90"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => go(e, 1)}
            aria-label="รูปถัดไป"
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/60 text-gray-800 shadow-sm backdrop-blur transition hover:bg-white/90"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {images.slice(0, 8).map((img, i) => (
              <span
                key={img.id}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i === index ? "bg-white" : "bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
