"use client";

import { useRouter } from "next/navigation";

export function DocumentMenu({
  roomLabel,
  contractHref,
  receiptHref,
  furnitureHref,
}: {
  roomLabel: string;
  contractHref: string;
  receiptHref?: string;
  furnitureHref: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    e.target.value = "";
    if (value === "receipt" && receiptHref) {
      window.open(receiptHref, "_blank", "noopener,noreferrer");
    } else if (value === "contract") {
      router.push(contractHref);
    } else if (value === "furniture") {
      router.push(furnitureHref);
    }
  }

  return (
    <div>
      <span className="block text-gray-700">{roomLabel}</span>
      <select
        defaultValue=""
        onChange={handleChange}
        aria-label="เอกสาร"
        className="mt-1 rounded-md border border-gray-300 bg-white px-1.5 py-1 text-xs text-gray-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-100"
      >
        <option value="" disabled>
          เอกสาร...
        </option>
        <option value="contract">📄 ดูสัญญา</option>
        {receiptHref && <option value="receipt">🧾 ดาวน์โหลดใบเสร็จ</option>}
        <option value="furniture">🛋️ เฟอร์นิเจอร์</option>
      </select>
    </div>
  );
}
