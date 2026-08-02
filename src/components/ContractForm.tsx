"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ContractType } from "@prisma/client";
import {
  saveContract,
  type ContractFormState,
} from "@/actions/contracts";
import {
  contractSections,
  type ContractData,
} from "@/lib/contract";
import { CONTRACT_META } from "@/lib/constants";
import { Input, Textarea, FormRow, Select } from "@/components/ui/Field";
import { buttonClasses, LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export type ContractCustomer = {
  id: string;
  code: string | null;
  name: string;
  phone: string;
};

export type ContractBooking = {
  customerId: string | null;
  bookingPaid: boolean;
  bookingAmount: number | null;
  slipUrl: string | null;
};

// ใส่ลูกน้ำคั่นหลักพันให้ตัวเลข เช่น 20000 -> "20,000" (ฝั่ง server ลอกลูกน้ำออกก่อนบันทึก)
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
  defaultValue: number | null | undefined;
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
      placeholder="เช่น 20,000"
    />
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClasses("primary", "md")}
    >
      {pending ? "กำลังบันทึก..." : "บันทึกสัญญา"}
    </button>
  );
}

export function ContractForm({
  roomId,
  prefill,
  savedData,
  savedContractIds,
  savedBooking,
  customers,
}: {
  roomId: string;
  prefill: Record<ContractType, ContractData>;
  savedData: Partial<Record<ContractType, ContractData>>;
  savedContractIds: Partial<Record<ContractType, string>>;
  savedBooking: Partial<Record<ContractType, ContractBooking>>;
  customers: ContractCustomer[];
}) {
  const [type, setType] = useState<ContractType>("RENT");
  const [savedIds, setSavedIds] =
    useState<Partial<Record<ContractType, string>>>(savedContractIds);
  const formRef = useRef<HTMLFormElement>(null);

  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c])),
    [customers],
  );

  const [state, formAction] = useActionState<ContractFormState, FormData>(
    saveContract.bind(null, roomId, type),
    {},
  );

  useEffect(() => {
    if (state.contractId) {
      setSavedIds((prev) => ({ ...prev, [type]: state.contractId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.contractId]);

  const currentId = savedIds[type];
  const values: ContractData = {
    ...prefill[type],
    ...(savedData[type] ?? {}),
  };
  const booking = savedBooking[type];

  function handleCustomerChange(customerId: string) {
    const customer = customerMap.get(customerId);
    if (!customer || !formRef.current) return;
    const nameField = type === "RENT" ? "tenantName" : "lesseeName";
    const phoneField = type === "RENT" ? "tenantPhone" : "lesseePhone";
    const nameInput = formRef.current.elements.namedItem(
      nameField,
    ) as HTMLInputElement | null;
    const phoneInput = formRef.current.elements.namedItem(
      phoneField,
    ) as HTMLInputElement | null;
    if (nameInput) nameInput.value = customer.name;
    if (phoneInput) phoneInput.value = customer.phone;
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
        {(["RENT", "SALE"] as ContractType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              type === t
                ? "bg-brand-600 text-white"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {CONTRACT_META[t].label}
          </button>
        ))}
      </div>

      <form key={type} ref={formRef} action={formAction} className="space-y-6">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            ลูกค้า (Enquiry)
          </h2>
          <FormRow label="เลือกลูกค้า" htmlFor="customerId">
            <Select
              id="customerId"
              name="customerId"
              defaultValue={booking?.customerId ?? ""}
              onChange={(e) => handleCustomerChange(e.target.value)}
            >
              <option value="">— เลือกลูกค้า —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ?? ""} {c.name} ({c.phone})
                </option>
              ))}
            </Select>
          </FormRow>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            การชำระเงินจอง
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormRow label="สถานะการจอง" htmlFor="bookingPaid">
              <label className="flex h-11 items-center gap-2 text-sm text-gray-700">
                <input
                  id="bookingPaid"
                  name="bookingPaid"
                  type="checkbox"
                  defaultChecked={booking?.bookingPaid ?? false}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                จ่ายเงินจองแล้ว
              </label>
            </FormRow>
            <FormRow label="จำนวนเงินจอง (บาท)" htmlFor="bookingAmount">
              <MoneyInput
                id="bookingAmount"
                name="bookingAmount"
                defaultValue={booking?.bookingAmount}
              />
            </FormRow>
            <FormRow
              label="สลิปการโอนเงินจอง"
              htmlFor="slip"
              className="sm:col-span-2"
            >
              <input
                id="slip"
                name="slip"
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
              />
              {booking?.slipUrl && (
                <p className="mt-1 text-xs text-gray-400">
                  มีสลิปที่อัปโหลดแล้ว — เลือกไฟล์ใหม่เพื่อแทนที่
                </p>
              )}
            </FormRow>
          </div>
        </section>

        {contractSections(type).map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {section.fields.map((f) => (
                <FormRow
                  key={f.name}
                  label={f.label}
                  htmlFor={f.name}
                  className={f.full ? "sm:col-span-2" : undefined}
                >
                  {f.type === "textarea" ? (
                    <Textarea
                      id={f.name}
                      name={f.name}
                      defaultValue={values[f.name] ?? ""}
                    />
                  ) : (
                    <Input
                      id={f.name}
                      name={f.name}
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      defaultValue={values[f.name] ?? ""}
                    />
                  )}
                </FormRow>
              ))}
            </div>
          </section>
        ))}

        {state.error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <LinkButton href={`/rooms/${roomId}`} variant="secondary">
            กลับ
          </LinkButton>
          {currentId && (
            <a
              href={`/api/contract/${currentId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("secondary", "md")}
            >
              ⬇ ดาวน์โหลด PDF
            </a>
          )}
          <SubmitButton />
        </div>
        {currentId && (
          <p className="text-right text-xs text-gray-400">
            บันทึกสัญญาแล้ว — กดดาวน์โหลด PDF ได้เลย (แก้ไขแล้วอย่าลืมกดบันทึกอีกครั้ง)
          </p>
        )}
      </form>
    </div>
  );
}
