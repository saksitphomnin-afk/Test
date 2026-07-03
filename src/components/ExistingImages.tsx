"use client";

import { useState, useTransition } from "react";
import type { RoomImage } from "@prisma/client";
import { deleteRoomImage } from "@/actions/rooms";

export function ExistingImages({ images }: { images: RoomImage[] }) {
  const [isPending, startTransition] = useTransition();
  // เก็บ id ที่ลบไปแล้วเพื่อซ่อนออกจากกริดทันที (optimistic)
  const [removed, setRemoved] = useState<string[]>([]);

  function handleDelete(id: string) {
    if (!confirm("ลบรูปนี้?")) return;
    setRemoved((prev) => [...prev, id]);
    startTransition(() => deleteRoomImage(id));
  }

  const visible = images.filter((img) => !removed.includes(img.id));

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {visible.map((img) => (
        <div
          key={img.id}
          className="relative aspect-square overflow-hidden rounded-lg border border-gray-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt="รูปห้อง"
            className="h-full w-full object-cover"
          />
          {/* type="button" กันไม่ให้ไป submit ฟอร์มแก้ไขห้องที่ครอบอยู่ */}
          <button
            type="button"
            title="ลบรูปนี้"
            aria-label="ลบรูปนี้"
            disabled={isPending}
            onClick={() => handleDelete(img.id)}
            className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-sm text-white shadow transition hover:bg-black/80 disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
