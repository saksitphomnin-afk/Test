"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { uploadFurniturePhotos } from "@/actions/furniture";
import { FURNITURE_CATEGORIES } from "@/lib/furniture";
import { FormRow, Select } from "@/components/ui/Field";
import { buttonClasses } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClasses("primary", "md")}>
      {pending ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}
    </button>
  );
}

export function FurnitureUploadForm({ contractId }: { contractId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    uploadFurniturePhotos.bind(null, contractId),
    {},
  );

  useEffect(() => {
    if (!state.error) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
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
      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}
      <SubmitButton />
    </form>
  );
}
