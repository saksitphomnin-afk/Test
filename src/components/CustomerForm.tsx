"use client";

import { useState, useTransition } from "react";
import type { Customer } from "@prisma/client";
import { Input, Select, Textarea, FormRow } from "@/components/ui/Field";
import { buttonClasses, LinkButton } from "@/components/ui/Button";
import { CUSTOMER_STATUSES, CUSTOMER_STATUS_META } from "@/lib/customers";

export function CustomerForm({
  apiUrl,
  method = "POST",
  customer,
  submitLabel = "บันทึก",
}: {
  apiUrl: string;
  method?: "POST" | "PATCH";
  customer?: Customer;
  submitLabel?: string;
}) {
  const [error, setError] = useState<string | undefined>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await fetch(apiUrl, { method, body: formData });
      const result = await res.json();
      if (result.redirectTo) {
        window.location.href = result.redirectTo;
        return;
      }
      setError(result.error ?? "เกิดข้อผิดพลาด กรุณาลองใหม่");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormRow label="ชื่อลูกค้า" htmlFor="name" required>
            <Input id="name" name="name" defaultValue={customer?.name} required />
          </FormRow>
          <FormRow label="เบอร์โทร" htmlFor="phone" required>
            <Input
              id="phone"
              name="phone"
              defaultValue={customer?.phone}
              placeholder="08x-xxx-xxxx"
              required
            />
          </FormRow>
          <FormRow label="Line ID" htmlFor="lineId">
            <Input
              id="lineId"
              name="lineId"
              defaultValue={customer?.lineId ?? ""}
              placeholder="เช่น @lineid"
            />
          </FormRow>
          <FormRow label="สถานะ" htmlFor="status">
            <Select
              id="status"
              name="status"
              defaultValue={customer?.status ?? "NEW"}
            >
              {CUSTOMER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CUSTOMER_STATUS_META[s].label}
                </option>
              ))}
            </Select>
          </FormRow>
          <FormRow label="ความต้องการ / โน้ต" htmlFor="note" className="sm:col-span-2">
            <Textarea
              id="note"
              name="note"
              defaultValue={customer?.note ?? ""}
              placeholder="เช่น หาเช่า 1 ห้องนอน แถวอโศก งบ 20,000 เข้าอยู่ ก.ค."
            />
          </FormRow>
        </div>
      </section>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        <LinkButton href="/customers" variant="secondary">
          ยกเลิก
        </LinkButton>
        <button
          type="submit"
          disabled={isPending}
          className={buttonClasses("primary", "md")}
        >
          {isPending ? "กำลังบันทึก..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
