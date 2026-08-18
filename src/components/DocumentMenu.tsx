"use client";

import { useRouter } from "next/navigation";

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

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    e.target.value = "";
    if (value === "receipt" && receiptHref) {
      // ใช้ same-tab navigation แทน window.open — เบราว์เซอร์จะดาวน์โหลดไฟล์ตาม
      // Content-Disposition: attachment โดยไม่ออกจากหน้าเดิม ส่วน window.open ที่ยิงจาก
      // change event ของ <select> เจอปัญหา popup ถูกบล็อกไม่แน่นอนบน Safari (iPad/iPhone)
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
        {brokerHref && <option value="broker">🤝 สัญญานายหน้า</option>}
        <option value="furniture">🛋️ เฟอร์นิเจอร์</option>
      </select>
    </div>
  );
}
