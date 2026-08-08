"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function KebabMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="เมนูจัดการ"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-lg text-gray-500 hover:bg-gray-100"
      >
        <span className="text-lg leading-none">⋮</span>
      </button>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function KebabMenuLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn("block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50")}
    >
      {children}
    </Link>
  );
}
