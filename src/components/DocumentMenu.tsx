"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FileText, Receipt, Handshake, Sofa } from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  value: "contract" | "receipt" | "broker" | "furniture";
  label: string;
  icon: typeof FileText;
};

export function DocumentMenu({
  roomLabel,
  contractHref,
  receiptHref,
  furnitureHref,
  brokerHref,
}: {
  roomLabel: string;
  contractHref: string;
  receiptHref?: string;
  furnitureHref: string;
  brokerHref?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const items: MenuItem[] = [
    { value: "contract", label: "ดูสัญญา", icon: FileText },
    ...(receiptHref
      ? [{ value: "receipt" as const, label: "ดาวน์โหลดใบเสร็จ", icon: Receipt }]
      : []),
    ...(brokerHref ? [{ value: "broker" as const, label: "สัญญานายหน้า", icon: Handshake }] : []),
    { value: "furniture", label: "เฟอร์นิเจอร์", icon: Sofa },
  ];

  // position: fixed (ไม่ใช่ absolute) เพื่อไม่ให้ dropdown ถูกตัดขอบเวลา trigger อยู่ในตาราง
  // ที่ overflow-x-auto (ตารางลูกค้าฝั่ง desktop) — คำนวณตำแหน่งจาก bounding rect ของปุ่มตอนเปิด
  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // ปิดเมนูตอนเลื่อนหน้าจอ กันตำแหน่งเมนูค้างผิดที่ (ไม่คำนวณตำแหน่งใหม่ระหว่างสกรอลล์)
    function handleScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  function handleSelect(value: MenuItem["value"]) {
    setOpen(false);
    if (value === "receipt" && receiptHref) {
      // ใช้ same-tab navigation แทน window.open — เบราว์เซอร์จะดาวน์โหลดไฟล์ตาม
      // Content-Disposition: attachment โดยไม่ออกจากหน้าเดิม ส่วน window.open ที่ยิงจาก
      // click แบบนี้เจอปัญหา popup ถูกบล็อกไม่แน่นอนบน Safari (iPad/iPhone)
      window.location.href = receiptHref;
    } else if (value === "broker" && brokerHref) {
      window.location.href = brokerHref;
    } else if (value === "contract") {
      router.push(contractHref);
    } else if (value === "furniture") {
      router.push(furnitureHref);
    }
  }

  return (
    <div>
      <span className="block text-gray-700">{roomLabel}</span>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        aria-haspopup="menu"
        aria-expanded={open}
        className="mt-1 inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-1.5 py-1 text-xs text-gray-600 hover:bg-gray-50 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-100"
      >
        เอกสาร...
        <ChevronDown className="h-3 w-3 text-gray-400" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menuPos.top, left: menuPos.left }}
          className="fixed z-40 w-48 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.value}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(item.value)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100",
              )}
            >
              <item.icon className="h-4 w-4 shrink-0 text-gray-500" />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
