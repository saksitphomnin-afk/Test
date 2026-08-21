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

type PdfLang = "TH" | "EN" | "BOTH";

const LANG_OPTIONS: { value: PdfLang; label: string }[] = [
  { value: "BOTH", label: "ไทย + อังกฤษ" },
  { value: "TH", label: "ไทย" },
  { value: "EN", label: "อังกฤษ (English)" },
];

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

// คำนวณวันสิ้นสุดสัญญา = วันเริ่ม + N เดือน - 1 วัน (เช่น เริ่ม 1 ก.ย. + 12 เดือน = 1 ก.ย.ปีถัดไป
// ลบ 1 วัน = 31 ส.ค.) ใช้ native Date.setMonth/setDate ซึ่งจัดการ rollover ปี/จำนวนวันในเดือนให้เอง
function computeEndDate(startDate: string, durationMonths: string): string {
  const start = new Date(startDate);
  const months = Number(durationMonths);
  if (Number.isNaN(start.getTime()) || !Number.isFinite(months) || months <= 0) return "";
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  end.setDate(end.getDate() - 1);
  return end.toISOString().slice(0, 10);
}

const LEASE_TERM_TITLE = "ระยะเวลาของสัญญา (Lease Term)";

// วันเริ่ม + ระยะเวลา(เดือน) คำนวณวันสิ้นสุดให้อัตโนมัติ — ผู้ใช้ยังพิมพ์ทับวันสิ้นสุดเองได้
// แต่ถ้าแก้วันเริ่ม/ระยะเวลาอีกครั้ง ค่าที่พิมพ์ทับจะถูกคำนวณทับกลับ (ตามที่ตกลงกับทีมงาน)
function LeaseTermFields({
  defaultStartDate,
  defaultDurationMonths,
  defaultEndDate,
}: {
  defaultStartDate: string;
  defaultDurationMonths: string;
  defaultEndDate: string;
}) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [duration, setDuration] = useState(defaultDurationMonths);
  const [endDate, setEndDate] = useState(defaultEndDate);

  function handleStartOrDurationChange(nextStart: string, nextDuration: string) {
    setStartDate(nextStart);
    setDuration(nextDuration);
    const computed = computeEndDate(nextStart, nextDuration);
    if (computed) setEndDate(computed);
  }

  return (
    <>
      <FormRow label="วันเริ่มสัญญา / Start date" htmlFor="startDate">
        <Input
          id="startDate"
          name="startDate"
          type="date"
          value={startDate}
          onChange={(e) => handleStartOrDurationChange(e.target.value, duration)}
        />
      </FormRow>
      <FormRow label="ระยะเวลา (เดือน) / Duration (months)" htmlFor="durationMonths">
        <Input
          id="durationMonths"
          name="durationMonths"
          type="number"
          value={duration}
          onChange={(e) => handleStartOrDurationChange(startDate, e.target.value)}
        />
      </FormRow>
      <FormRow
        label="วันสิ้นสุดสัญญา / End date (คำนวณอัตโนมัติ แก้ไขเองได้)"
        htmlFor="endDate"
      >
        <Input
          id="endDate"
          name="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </FormRow>
    </>
  );
}

function MoneyInput({
  id,
  name,
  value,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Input
      id={id}
      name={name}
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(withCommas(e.target.value))}
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
  initialCustomerId,
}: {
  roomId: string;
  prefill: Record<"RENT" | "SALE", ContractData>;
  savedData: Partial<Record<ContractType, ContractData>>;
  savedContractIds: Partial<Record<ContractType, string>>;
  savedBooking: Partial<Record<ContractType, ContractBooking>>;
  customers: ContractCustomer[];
  // มาจาก query param ?customerId= ตอนกดปุ่ม "ทำสัญญา" จากหน้า Enquiry — ใช้เป็นค่าเริ่มต้น
  // เฉพาะตอนที่ยังไม่มีลูกค้าที่บันทึกไว้กับสัญญาประเภทนี้ของห้องนี้อยู่แล้ว (ไม่ทับของเดิม)
  initialCustomerId?: string;
}) {
  const [type, setType] = useState<"RENT" | "SALE">("RENT");
  const [savedIds, setSavedIds] =
    useState<Partial<Record<ContractType, string>>>(savedContractIds);
  const [pdfLang, setPdfLang] = useState<PdfLang>("BOTH");
  // มีการแก้ไขในฟอร์มที่ยังไม่ได้กด "บันทึกสัญญา" หรือไม่ — เตือนก่อนดาวน์โหลด PDF/ใบเสร็จ เพราะปุ่ม
  // ดาวน์โหลดดึงข้อมูลจากฐานข้อมูล (ค่าที่บันทึกล่าสุด) ไม่ใช่ค่าที่กำลังพิมพ์อยู่ในฟอร์ม
  const [dirty, setDirty] = useState(false);
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
      setDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.contractId]);

  const currentId = savedIds[type];
  const booking = savedBooking[type];
  const nameField = type === "RENT" ? "tenantName" : "lesseeName";
  const phoneField = type === "RENT" ? "tenantPhone" : "lesseePhone";
  // ถ้าสัญญาประเภทนี้ของห้องนี้ยังไม่เคยผูกลูกค้าไว้ (booking.customerId ว่าง) ให้ใช้ลูกค้าจาก
  // query param (มาจากปุ่ม "ทำสัญญา" ในหน้า Enquiry) เป็นค่าเริ่มต้นแทน ไม่ทับของที่บันทึกไว้แล้ว
  const fallbackCustomer =
    !booking?.customerId && initialCustomerId
      ? customerMap.get(initialCustomerId)
      : undefined;
  const values: ContractData = {
    ...prefill[type],
    ...(fallbackCustomer
      ? { [nameField]: fallbackCustomer.name, [phoneField]: fallbackCustomer.phone }
      : {}),
    ...(savedData[type] ?? {}),
  };

  // ค่าเช่า/เงินจอง/เงินประกัน ผูกกันตาม flow การชำระเงินจริงของทีม (จองห้อง = จ่าย 1 เดือน เรียกว่า
  // เงินล่วงหน้า, ก่อนย้ายเข้า/เซ็นสัญญา = ชำระเงินประกัน 2 เดือน) — แก้ค่าเช่าแล้วเสนอเงินจอง/เงินประกัน
  // ให้อัตโนมัติ (เฉพาะสัญญาเช่า) แต่ยังแก้ไขเองทับได้เหมือนวันสิ้นสุดสัญญาที่คำนวณจากวันเริ่ม+ระยะเวลา
  const [monthlyRent, setMonthlyRent] = useState(values.monthlyRent ?? "");
  const [depositAmount, setDepositAmount] = useState(values.depositAmount ?? "");
  const [bookingAmount, setBookingAmount] = useState(
    booking?.bookingAmount != null ? withCommas(String(booking.bookingAmount)) : "",
  );

  function handleMonthlyRentChange(next: string) {
    setMonthlyRent(next);
    const n = Number(next);
    if (next && Number.isFinite(n) && n > 0) {
      setBookingAmount(withCommas(String(Math.round(n))));
      setDepositAmount(String(Math.round(n * 2)));
    }
  }

  function handleCustomerChange(customerId: string) {
    const customer = customerMap.get(customerId);
    if (!customer || !formRef.current) return;
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
      <div className="inline-flex flex-wrap rounded-xl border border-gray-200 bg-white p-1">
        {(["RENT", "SALE"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              setDirty(false);
              const nextValues = { ...prefill[t], ...(savedData[t] ?? {}) };
              setMonthlyRent(nextValues.monthlyRent ?? "");
              setDepositAmount(nextValues.depositAmount ?? "");
              const nextBooking = savedBooking[t];
              setBookingAmount(
                nextBooking?.bookingAmount != null
                  ? withCommas(String(nextBooking.bookingAmount))
                  : "",
              );
            }}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              type === t
                ? "bg-brand-500 text-brand-900"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {CONTRACT_META[t].label}
          </button>
        ))}
      </div>

      <form
        key={type}
        ref={formRef}
        action={formAction}
        onChange={() => setDirty(true)}
        className="space-y-6"
      >
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            ลูกค้า (Enquiry)
          </h2>
          <FormRow label="เลือกลูกค้า" htmlFor="customerId">
            <Select
              id="customerId"
              name="customerId"
              defaultValue={booking?.customerId ?? initialCustomerId ?? ""}
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
            <FormRow
              label={
                type === "RENT"
                  ? "จำนวนเงินจอง (บาท) (เสนอเท่าค่าเช่า 1 เดือนอัตโนมัติ แก้ไขเองได้)"
                  : "จำนวนเงินจอง (บาท)"
              }
              htmlFor="bookingAmount"
            >
              <MoneyInput
                id="bookingAmount"
                name="bookingAmount"
                value={bookingAmount}
                onChange={setBookingAmount}
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
              {section.title === LEASE_TERM_TITLE ? (
                <LeaseTermFields
                  defaultStartDate={values.startDate ?? ""}
                  defaultDurationMonths={values.durationMonths ?? ""}
                  defaultEndDate={values.endDate ?? ""}
                />
              ) : (
                section.fields.map((f) => {
                  // ค่าเช่า/เงินประกัน (เฉพาะสัญญาเช่า) ผูกกับ handleMonthlyRentChange ด้านบน
                  // เพื่อเสนอเงินจอง/เงินประกันอัตโนมัติตาม flow การชำระเงินจริง
                  if (type === "RENT" && f.name === "monthlyRent") {
                    return (
                      <FormRow key={f.name} label={f.label} htmlFor={f.name}>
                        <Input
                          id={f.name}
                          name={f.name}
                          type="number"
                          value={monthlyRent}
                          onChange={(e) => handleMonthlyRentChange(e.target.value)}
                        />
                      </FormRow>
                    );
                  }
                  if (type === "RENT" && f.name === "depositAmount") {
                    return (
                      <FormRow key={f.name} label={f.label} htmlFor={f.name}>
                        <Input
                          id={f.name}
                          name={f.name}
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                        />
                      </FormRow>
                    );
                  }
                  return (
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
                  );
                })
              )}
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
          {currentId && type === "RENT" && (
            <Select
              value={pdfLang}
              onChange={(e) => setPdfLang(e.target.value as PdfLang)}
              className="w-auto"
              aria-label="ภาษาของสัญญา PDF"
            >
              {LANG_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          )}
          {currentId && (
            <a
              href={`/api/contract/${currentId}/pdf?t=${Date.now()}${
                type === "RENT" ? `&lang=${pdfLang}` : ""
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("secondary", "md")}
            >
              ⬇ ดาวน์โหลด PDF
            </a>
          )}
          <SubmitButton />
        </div>
        {currentId && dirty && (
          <p className="text-right text-xs font-medium text-amber-600">
            มีการแก้ไขที่ยังไม่บันทึก — บันทึกก่อนเพื่อให้ไฟล์ที่ดาวน์โหลดตรงกับข้อมูลล่าสุด
          </p>
        )}
        {currentId && !dirty && (
          <p className="text-right text-xs text-gray-400">
            บันทึกสัญญาแล้ว — กดดาวน์โหลด PDF ได้เลย (แก้ไขแล้วอย่าลืมกดบันทึกอีกครั้ง)
          </p>
        )}
      </form>
    </div>
  );
}
