"use client";

import { useState, useTransition } from "react";
import { deleteFurnitureItem, updateFurnitureCaption } from "@/actions/furniture";
import { Input } from "@/components/ui/Field";

export type FurnitureGridItem = { id: string; url: string; caption: string };

function FurnitureCard({ item }: { item: FurnitureGridItem }) {
  const [isPending, startTransition] = useTransition();
  const [removed, setRemoved] = useState(false);
  const [caption, setCaption] = useState(item.caption);

  function handleDelete() {
    if (!confirm("ลบรูปนี้?")) return;
    setRemoved(true);
    startTransition(() => deleteFurnitureItem(item.id));
  }

  function handleCaptionBlur() {
    if (caption !== item.caption) {
      startTransition(() => updateFurnitureCaption(item.id, caption));
    }
  }

  if (removed) return null;

  return (
    <div className="space-y-1.5">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt="รูปเฟอร์นิเจอร์" className="h-full w-full object-cover" />
        <button
          type="button"
          title="ลบรูปนี้"
          aria-label="ลบรูปนี้"
          disabled={isPending}
          onClick={handleDelete}
          className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-sm text-white shadow transition hover:bg-black/80 disabled:opacity-50"
        >
          ✕
        </button>
      </div>
      <Input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        onBlur={handleCaptionBlur}
        placeholder="ระบุว่าภาพนี้คืออะไร เช่น เครื่องซักผ้า"
        className="text-xs"
      />
    </div>
  );
}

export function FurnitureGrid({ items }: { items: FurnitureGridItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <FurnitureCard key={item.id} item={item} />
      ))}
    </div>
  );
}
