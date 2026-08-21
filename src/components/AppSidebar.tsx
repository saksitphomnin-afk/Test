"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  SquarePlus,
  Users,
  FolderOpen,
  ShieldCheck,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
} from "lucide-react";
import { signOutAction } from "@/actions/auth";

const COLLAPSE_STORAGE_KEY = "havenz-sidebar-collapsed";

const BASE_LINKS = [
  { href: "/", label: "Condo", icon: Building2 },
  { href: "/rooms/new", label: "เพิ่มห้อง", icon: SquarePlus },
  { href: "/customers", label: "Enquiry", icon: Users },
  { href: "/templates", label: "รวมไฟล์สัญญา", icon: FolderOpen },
];

export function AppSidebar({
  name,
  role,
}: {
  name?: string | null;
  role?: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // อ่านค่าที่จำไว้หลัง mount เท่านั้น (กัน SSR/CSR mismatch เพราะ localStorage ไม่มีฝั่งเซิร์ฟเวอร์)
  useEffect(() => {
    if (window.localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1") {
      setCollapsed(true);
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const links =
    role === "ADMIN"
      ? [...BASE_LINKS, { href: "/admin/users", label: "จัดการผู้ใช้", icon: ShieldCheck }]
      : BASE_LINKS;

  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-gray-200 bg-white transition-[width] duration-200 sm:flex ${
        collapsed ? "w-[68px]" : "w-56"
      }`}
    >
      <div className={`flex items-center border-b border-gray-100 px-3 py-3 ${collapsed ? "justify-center" : ""}`}>
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg?v=3" alt="Havenz Property" className="h-9 w-auto shrink-0" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3">
        {links.map((l) => {
          const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              title={collapsed ? l.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{l.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-2">
        {!collapsed && (
          <div className="px-2 pb-2">
            <div className="truncate text-sm font-medium text-gray-800">{name}</div>
            <div className="text-xs text-gray-500">
              {role === "ADMIN" ? "ผู้ดูแลระบบ" : "ทีมงาน"}
            </div>
          </div>
        )}

        <form action={signOutAction}>
          <button
            type="submit"
            title={collapsed ? "ออกจากระบบ" : undefined}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-rose-600 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>ออกจากระบบ</span>}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleCollapsed}
          title={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
          className={`mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          {!collapsed && <span>ย่อเมนู</span>}
        </button>
      </div>
    </aside>
  );
}
