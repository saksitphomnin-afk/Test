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
  ];
  if (role === "ADMIN") {
    links.push({ href: "/admin/users", label: "จัดการผู้ใช้" });
  }

  // เมนูหลักย้ายไปอยู่ฝั่ง AppSidebar (ซ้ายมือ) แล้ว — NavBar นี้เหลือไว้เฉพาะจอมือถือ
  // (sidebar ซ่อนตอนจอเล็กกว่า sm) จึงทำหน้าที่แค่แถบบนสุด + เมนูเลื่อนแนวนอนสำหรับมือถือ
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur sm:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg?v=3" alt="Havenz Property" className="h-11 w-auto" />
        </Link>

        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-rose-600"
          >
            ออกจากระบบ
          </button>
        </form>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-gray-100 px-3 py-2">
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
