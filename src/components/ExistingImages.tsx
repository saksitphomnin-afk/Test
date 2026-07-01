"use client";

import type { RoomImage } from "@prisma/client";
import { deleteRoomImage } from "@/actions/rooms";

export function ExistingImages({ images }: { images: RoomImage[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {images.map((img) => (
        <div
          key={img.id}
          className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt="รูปห้อง"
            className="h-full w-full object-cover"
          />
          <form action={deleteRoomImage.bind(null, img.id)}>
            <button
              type="submit"
              title="ลบรูปนี้"
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              ✕
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
