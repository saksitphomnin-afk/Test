"use client";

import { useState, useTransition } from "react";
import type { Room, RoomImage } from "@prisma/client";
import { Input, Select, Textarea, FormRow } from "@/components/ui/Field";
import { buttonClasses, LinkButton } from "@/components/ui/Button";
import { STATUS_ORDER, STATUS_META, LISTING_META } from "@/lib/constants";
import { ExistingImages } from "@/components/ExistingImages";
import { RoomTypeSelect } from "@/components/RoomTypeSelect";
import { compressImages } from "@/lib/compressImage";

function SubmitButton({
  label,
  pending,
  extraDisabled,
}: {
  label: string;
  pending: boolean;
  extraDisabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || extraDisabled}
      className={buttonClasses("primary", "md")}
    >
      {pending ? "กำลังบันทึก..." : label}
    </button>
  );
}

// ใส่ลูกน้ำคั่นหลักพันให้ตัวเลข เช่น 26500 -> "26,500" (ฝั่ง server ลอกลูกน้ำออกก่อนบันทึก)
function withCommas(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

function MoneyInput({
  id,
  name,
  defaultValue,
}: {
  id: string;
  name: string;
  defaultValue: number | null;
}) {
  const [value, setValue] = useState(
    defaultValue != null ? withCommas(String(defaultValue)) : "",
  );
  return (
    <Input
      id={id}
      name={name}
      inputMode="numeric"
      value={value}
      onChange={(e) => setValue(withCommas(e.target.value))}
      placeholder="เช่น 26,500"
    />
  );
}

export function RoomForm({
  apiUrl,
  method = "POST",
  room,
  images,
  submitLabel = "บันทึก",
  cancelHref = "/",
  projects = [],
}: {
  apiUrl: string;
  method?: "POST" | "PATCH";
  room?: Room;
  images?: RoomImage[];
  submitLabel?: string;
  cancelHref?: string;
  projects?: string[];
}) {
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();
  const [compressing, setCompressing] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await fetch(apiUrl, { method, body: formData });
      const result = await res.json();
      if (result.redirectTo) {
        // full page reload (ไม่ใช้ client-side router) กัน state ค้าง
        window.location.href = result.redirectTo;
        return;
      }
      setError(result.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
    });
  }

  async function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = input.files;
    if (!files || files.length === 0) {
      setFileCount(0);
      return;
    }
    setCompressing(true);
    try {
      const compressed = await compressImages(Array.from(files));
      const dt = new DataTransfer();
      compressed.forEach((f) => dt.items.add(f));
      input.files = dt.files;
      setFileCount(compressed.length);
    } finally {
      setCompressing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          ข้อมูลห้อง
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormRow label="ชื่อโครงการ" htmlFor="projectName" required>
            <Input
              id="projectName"
              name="projectName"
              list="projects-list"
              defaultValue={room?.projectName}
              placeholder="เช่น The Base Sukhumvit"
              required
            />
            <datalist id="projects-list">
              {projects.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </FormRow>
          <FormRow label="เลขห้อง" htmlFor="roomNumber" required>
            <Input
              id="roomNumber"
              name="roomNumber"
              defaultValue={room?.roomNumber}
              placeholder="เช่น A-2504"
              required
            />
          </FormRow>
          <FormRow label="ตึก/อาคาร" htmlFor="tower">
            <Input id="tower" name="tower" defaultValue={room?.tower ?? ""} />
          </FormRow>
          <FormRow label="ชั้น" htmlFor="floor">
            <Input id="floor" name="floor" defaultValue={room?.floor ?? ""} />
          </FormRow>
          <FormRow label="ขนาด (ตร.ม.)" htmlFor="sizeSqm">
            <Input
              id="sizeSqm"
              name="sizeSqm"
              type="number"
              step="0.01"
              defaultValue={room?.sizeSqm ?? ""}
            />
          </FormRow>
          <FormRow label="ประเภทห้อง" htmlFor="roomType">
            <RoomTypeSelect defaultValue={room?.roomType} />
          </FormRow>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          เจ้าของ &amp; สถานะ
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormRow label="ชื่อเจ้าของ" htmlFor="ownerName" required>
            <Input
              id="ownerName"
              name="ownerName"
              defaultValue={room?.ownerName}
              required
            />
          </FormRow>
          <FormRow label="เบอร์โทรเจ้าของ" htmlFor="ownerPhone" required>
            <Input
              id="ownerPhone"
              name="ownerPhone"
              defaultValue={room?.ownerPhone}
              placeholder="08x-xxx-xxxx"
              required
            />
          </FormRow>
          <FormRow label="Line ID เจ้าของ" htmlFor="ownerLineId">
            <Input
              id="ownerLineId"
              name="ownerLineId"
              defaultValue={room?.ownerLineId ?? ""}
              placeholder="เช่น @placeco หรือ line id"
            />
          </FormRow>
          <FormRow label="ประเภทประกาศ" htmlFor="listingType">
            <Select
              id="listingType"
              name="listingType"
              defaultValue={room?.listingType ?? "RENT"}
            >
              {(Object.keys(LISTING_META) as Array<keyof typeof LISTING_META>).map(
                (k) => (
                  <option key={k} value={k}>
                    {LISTING_META[k].label}
                  </option>
                ),
              )}
            </Select>
          </FormRow>
          <FormRow label="สถานะห้อง" htmlFor="status">
            <Select id="status" name="status" defaultValue={room?.status ?? "AVAILABLE"}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="ราคาขาย (บาท)" htmlFor="salePrice">
            <MoneyInput
              id="salePrice"
              name="salePrice"
              defaultValue={room?.salePrice ?? null}
            />
          </FormRow>
          <FormRow label="ค่าเช่า/เดือน (บาท)" htmlFor="rentPrice">
            <MoneyInput
              id="rentPrice"
              name="rentPrice"
              defaultValue={room?.rentPrice ?? null}
            />
          </FormRow>
        </div>
        {!room && (
          <div className="mt-4">
            <FormRow label="Remark เริ่มต้น (ถ้ามี)" htmlFor="remark">
              <Textarea
                id="remark"
                name="remark"
                placeholder="เช่น เจ้าของสะดวกให้เข้าดูห้องช่วงเย็น"
              />
            </FormRow>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">รูปห้อง</h2>
        <p className="mb-4 text-sm text-gray-500">
          เลือกได้หลายรูปพร้อมกัน (JPG, PNG, WEBP)
        </p>
        {images && images.length > 0 && (
          <div className="mb-4">
            <ExistingImages images={images} />
          </div>
        )}
        <input
          type="file"
          name="images"
          accept="image/*"
          multiple
          onChange={handleImagesChange}
          disabled={compressing}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 disabled:opacity-60"
        />
        {compressing && (
          <p className="mt-2 text-xs text-brand-600">
            กำลังย่อขนาดรูป กรุณารอสักครู่...
          </p>
        )}
        {!compressing && fileCount > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            เลือกแล้ว {fileCount} รูป (ย่อขนาดอัตโนมัติเพื่อให้อัปโหลดได้เร็วขึ้น)
          </p>
        )}
      </section>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <LinkButton href={cancelHref} variant="secondary">
          ยกเลิก
        </LinkButton>
        <SubmitButton
          label={submitLabel}
          pending={isPending}
          extraDisabled={compressing}
        />
      </div>
    </form>
  );
}
