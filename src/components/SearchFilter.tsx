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
  const [focused, setFocused] = useState(false);
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

  // แนะนำชื่อโครงการจากรายการที่มีใน DB (autocomplete) ตามที่ผู้ใช้พิมพ์
  const query = q.trim().toLowerCase();
  const suggestions =
    query.length > 0
      ? projects.filter((p) => p.toLowerCase().includes(query)).slice(0, 8)
      : [];
  const showSuggestions = focused && suggestions.length > 0;

  function selectProject(name: string) {
    setQ(name);
    setFocused(false);
    apply({ q: name });
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFocused(false);
          apply({ q });
        }}
        className="relative"
      >
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
          <SearchIcon />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder="ค้นหาชื่อโครงการ / เลขห้อง / เจ้าของ / เบอร์โทร"
          className="w-full rounded-full border border-gray-300 bg-white py-2.5 pl-11 pr-24 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={isPending}
          className="absolute inset-y-1.5 right-1.5 inline-flex items-center rounded-full bg-brand-600 px-5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          ค้นหา
        </button>

        {showSuggestions && (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-2xl border border-gray-200 bg-white py-1 shadow-lg">
            <li className="px-4 pb-1 pt-1.5 text-xs font-semibold text-gray-400">
              โครงการ
            </li>
            {suggestions.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectProject(p);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                >
                  <BuildingIcon />
                  {p}
                </button>
              </li>
            ))}
          </ul>
        )}
      </form>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <FilterIcon />
          ตัวกรอง
        </div>
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

function FilterIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M3 5h14M6 10h8M8.5 15h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0 text-brand-500"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="12"
        height="14"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M7 6.5h2M11 6.5h2M7 9.5h2M11 9.5h2M8.5 17v-3h3v3"
        stroke="currentColor"
        strokeWidth="1.4"
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
