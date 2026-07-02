"use client";

import { useState } from "react";
import type { RoomImage } from "@prisma/client";

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("[downloadImage] failed:", err);
  }
}

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
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active].url}
          alt={alt}
          className="h-full w-full object-contain"
        />
        <button
          type="button"
          onClick={() =>
            downloadImage(images[active].url, `${alt}-${active + 1}.jpg`)
          }
          title="ดาวน์โหลดรูปนี้"
          className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-2 text-sm font-medium text-gray-700 shadow-sm backdrop-blur hover:bg-white"
        >
          ⬇ ดาวน์โหลด
        </button>
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <div key={img.id} className="space-y-1.5">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`block aspect-square w-full overflow-hidden rounded-lg border-2 ${
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
              <button
                type="button"
                onClick={() => downloadImage(img.url, `${alt}-${i + 1}.jpg`)}
                className="block w-full rounded-lg border border-brand-300 px-2 py-1.5 text-center text-xs font-medium text-brand-600 hover:bg-brand-50"
              >
                ⬇ ดาวน์โหลด
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
