"use client";

import { useState } from "react";
import type { RoomImage } from "@prisma/client";

export function Gallery({
  images,
  alt,
}: {
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

  return (
    <div className="space-y-3">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active].url}
          alt={alt}
          className="h-full w-full object-contain"
        />
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
    </div>
  );
}
