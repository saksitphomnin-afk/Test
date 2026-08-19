"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadTemplate } from "@/actions/templates";
import { FormRow, Input } from "@/components/ui/Field";
import { buttonClasses } from "@/components/ui/Button";

export function TemplateUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await uploadTemplate(new FormData(e.currentTarget));
      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormRow label="ชื่อไฟล์" htmlFor="title">
          <Input
            id="title"
            name="title"
            required
            placeholder="เช่น ตัวอย่างสัญญาภาษาไทย"
          />
        </FormRow>
        <FormRow label="ไฟล์ (PDF)" htmlFor="file" className="sm:col-span-2">
          <input
            id="file"
            name="file"
            type="file"
            accept="application/pdf"
            required
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
          />
        </FormRow>
      </div>
      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}
      <button type="submit" disabled={pending} className={buttonClasses("primary", "md")}>
        {pending ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์"}
      </button>
    </form>
  );
}
