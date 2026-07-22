import Link from "next/link";
import { signOutAction } from "@/actions/auth";

export function NavBar({
  name,
  role,
}: {
  name?: string | null;
  role?: string;
}) {
  const links = [
    { href: "/", label: "Condo" },
    { href: "/rooms/new", label: "เพิ่มห้อง" },
    { href: "/customers", label: "Enquiry" },
    { href: "/calculator", label: "คำนวณต้นทุน" },
  ];
  if (role === "ADMIN") {
    links.push({ href: "/admin/users", label: "จัดการผู้ใช้" });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png?v=2" alt="Place co." className="h-11 w-auto" />
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              prefetch={false}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium text-gray-800">{name}</div>
            <div className="text-xs text-gray-500">
              {role === "ADMIN" ? "ผู้ดูแลระบบ" : "ทีมงาน"}
            </div>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-rose-600"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>

      {/* เมนูสำหรับมือถือ */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-gray-100 px-3 py-2 sm:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
