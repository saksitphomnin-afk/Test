"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFurniturePhotos } from "@/actions/furniture";
import { compressImage } from "@/lib/image-compress";
import { FURNITURE_CATEGORIES } from "@/lib/furniture";
import { FormRow, Select } from "@/components/ui/Field";
import { buttonClasses } from "@/components/ui/Button";

export function FurnitureUploadForm({ contractId }: { contractId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const category = String(new FormData(form).get("category") ?? "");
    const isDefect = new FormData(form).get("isDefect") === "on";
    const fileInput = form.elements.namedItem("images") as HTMLInputElement;
    const files = Array.from(fileInput.files ?? []);
    if (files.length === 0) return;

    setError(null);
    setProgress({ done: 0, total: files.length });

    // อัปโหลดทีละรูป (บีบอัดก่อนส่งทุกรูป) แทนการยัดทุกไฟล์ไปใน request เดียว — request ใหญ่เกินไป
    // จะโดนลิมิตขนาด body ของแพลตฟอร์ม deploy (เช่น Vercel) ซึ่งปรับจากฝั่งแอปไม่ได้
    let failed = 0;
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImage(files[i]);
        const fd = new FormData();
        fd.set("category", category);
        fd.set("isDefect", isDefect ? "on" : "off");
        fd.append("images", compressed);
        const result = await uploadFurniturePhotos(contractId, {}, fd);
        if (result.error) failed++;
      } catch {
        failed++;
      }
      setProgress({ done: i + 1, total: files.length });
    }

    if (failed > 0) {
      setError(`อัปโหลดไม่สำเร็จ ${failed} จาก ${files.length} รูป ลองใหม่อีกครั้งสำหรับรูปที่พลาด`);
    }
    setProgress(null);
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormRow label="หมวด" htmlFor="category">
          <Select id="category" name="category" required>
            {FURNITURE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="รูปภาพ (เลือกได้หลายรูป)" htmlFor="images" className="sm:col-span-2">
          <input
            id="images"
            name="images"
            type="file"
            accept="image/jpeg,image/png"
            multiple
            required
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
          />
        </FormRow>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="isDefect"
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        เป็นภาพ Defect ของหมวดนี้
      </label>
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      {progress && (
        <p className="text-sm text-gray-500">
          กำลังอัปโหลด {progress.done}/{progress.total} รูป...
        </p>
      )}
      <button
        type="submit"
        disabled={progress !== null}
        className={buttonClasses("primary", "md")}
      >
        {progress ? `กำลังอัปโหลด... (${progress.done}/${progress.total})` : "อัปโหลดรูป"}
      </button>
    </form>
  );
}
