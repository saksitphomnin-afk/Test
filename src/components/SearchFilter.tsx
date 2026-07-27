"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  STATUS_ORDER,
  STATUS_META,
  SIZE_RANGES,
  RENT_RANGES,
  SALE_RANGES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type FilterPatch = {
  q?: string;
  status?: string;
  project?: string;
  type?: string;
  size?: string;
  price?: string;
  saleprice?: string;
};

export function SearchFilter({
  projects = [],
  roomTypes = [],
}: {
  projects?: string[];
  roomTypes?: string[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const activeStatus = params.get("status") ?? "";
  const activeProject = params.get("project") ?? "";
  const activeType = params.get("type") ?? "";
  const activeSize = params.get("size") ?? "";
  const activePrice = params.get("price") ?? "";
  const activeSalePrice = params.get("saleprice") ?? "";

  function apply(next: FilterPatch) {
    const sp = new URLSearchParams(params.toString());
    for (const key of ["q", "status", "project", "type", "size", "price", "saleprice"] as const) {
      const val = next[key];
      if (val === undefined) continue;
      if (val) sp.set(key, val);
      else sp.delete(key);
    }
    startTransition(() => router.push(`/?${sp.toString()}`));
  }

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="relative flex-1"
      >
        <button
          type="submit"
          disabled={isPending}
          aria-label="ค้นหา"
          className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 hover:text-brand-600"
        >
          <SearchIcon />
        </button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหา โครงการ / เลขห้อง / เจ้าของ / เบอร์โทร"
          className="w-full rounded-full border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
      </form>

      <div className="flex flex-wrap gap-2">
        <PillSelect
          value={activeProject}
          onChange={(v) => apply({ project: v })}
          className="min-w-40 flex-1 sm:flex-none"
        >
          <option value="">ทุกโครงการ</option>
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </PillSelect>

        <PillSelect
          value={activeType}
          onChange={(v) => apply({ type: v })}
          className="min-w-36 flex-1 sm:flex-none"
        >
          <option value="">ทุกประเภทห้อง</option>
          {roomTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </PillSelect>

        <PillSelect
          value={activeSize}
          onChange={(v) => apply({ size: v })}
          className="min-w-36 flex-1 sm:flex-none"
        >
          <option value="">ทุกขนาด</option>
          {SIZE_RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </PillSelect>

        <PillSelect
          value={activePrice}
          onChange={(v) => apply({ price: v })}
          className="min-w-40 flex-1 sm:flex-none"
        >
          <option value="">ทุกช่วงค่าเช่า</option>
          {RENT_RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </PillSelect>

        <PillSelect
          value={activeSalePrice}
          onChange={(v) => apply({ saleprice: v })}
          className="min-w-40 flex-1 sm:flex-none"
        >
          <option value="">ทุกช่วงราคาขาย</option>
          {SALE_RANGES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label}
            </option>
          ))}
        </PillSelect>

        <PillSelect
          value={activeStatus}
          onChange={(v) => apply({ status: v })}
          className="min-w-32 flex-1 sm:flex-none"
        >
          <option value="">ทุกสถานะ</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </PillSelect>
      </div>
    </div>
  );
}

function PillSelect({
  value,
  onChange,
  children,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-full border border-gray-300 bg-white py-2 pl-3.5 pr-8 text-sm text-gray-700 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
        <ChevronIcon />
      </span>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="m17 17-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="m5 7.5 5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
