import Link from "next/link";
import { cn } from "@/lib/utils";

function hrefFor(searchParams: Record<string, string | undefined>, page: number): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page" || !value) continue;
    sp.set(key, value);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

// เลขหน้าที่โชว์: หน้าแรก, หน้าสุดท้าย, และหน้ารอบ ๆ หน้าปัจจุบัน — ที่เหลือย่อเป็น "…"
function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const pageBtn = (active: boolean) =>
    cn(
      "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-medium transition",
      active
        ? "bg-brand-600 text-white"
        : "text-gray-700 hover:bg-gray-100",
    );

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="เปลี่ยนหน้า">
      <Link
        href={hrefFor(searchParams, currentPage - 1)}
        aria-disabled={currentPage <= 1}
        className={cn(
          pageBtn(false),
          currentPage <= 1 && "pointer-events-none opacity-40",
        )}
      >
        ก่อนหน้า
      </Link>

      {pageNumbers(currentPage, totalPages).map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e${i}`} className="px-1 text-sm text-gray-400">
            …
          </span>
        ) : (
          <Link key={p} href={hrefFor(searchParams, p)} className={pageBtn(p === currentPage)}>
            {p}
          </Link>
        ),
      )}

      <Link
        href={hrefFor(searchParams, currentPage + 1)}
        aria-disabled={currentPage >= totalPages}
        className={cn(
          pageBtn(false),
          currentPage >= totalPages && "pointer-events-none opacity-40",
        )}
      >
        ถัดไป
      </Link>
    </nav>
  );
}
