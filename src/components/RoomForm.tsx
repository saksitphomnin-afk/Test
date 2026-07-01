"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Room, RoomImage } from "@prisma/client";
import type { FormState } from "@/actions/rooms";
import { Input, Select, Textarea, FormRow } from "@/components/ui/Field";
import { buttonClasses, LinkButton } from "@/components/ui/Button";
import { STATUS_ORDER, STATUS_META, LISTING_META } from "@/lib/constants";
import { ExistingImages } from "@/components/ExistingImages";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClasses("primary", "md")}
    >
      {pending ? "กำลังบันทึก..." : label}
    </button>
  );
}

export function RoomForm({
  action,
  room,
  images,
  submitLabel = "บันทึก",
  cancelHref = "/",
  projects = [],
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  room?: Room;
  images?: RoomImage[];
  submitLabel?: string;
  cancelHref?: string;
  projects?: string[];
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="space-y-6">
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
            <Input
              id="roomType"
              name="roomType"
              defaultValue={room?.roomType ?? ""}
              placeholder="เช่น 1 Bedroom"
            />
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
            <Input
              id="salePrice"
              name="salePrice"
              type="number"
              step="1"
              defaultValue={room?.salePrice ?? ""}
            />
          </FormRow>
          <FormRow label="ค่าเช่า/เดือน (บาท)" htmlFor="rentPrice">
            <Input
              id="rentPrice"
              name="rentPrice"
              type="number"
              step="1"
              defaultValue={room?.rentPrice ?? ""}
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
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
      </section>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <LinkButton href={cancelHref} variant="secondary">
          ยกเลิก
        </LinkButton>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
