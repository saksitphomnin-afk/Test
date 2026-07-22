"use client";

import { useMemo, useState } from "react";
import { Input, Select, FormRow } from "@/components/ui/Field";
import { formatBaht } from "@/lib/constants";
import {
  calcTransferCost,
  sumByPayer,
  type Payer,
} from "@/lib/transfer-cost";

// ใส่ลูกน้ำคั่นหลักพัน เช่น 2500000 -> "2,500,000"
function withCommas(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits).toLocaleString("en-US") : "";
}
function toNumber(value: string): number {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

const PAYER_LABEL: Record<Payer, string> = {
  buyer: "ผู้ซื้อ",
  seller: "ผู้ขาย",
  split: "คนละครึ่ง",
};

export function CostCalculator() {
  const [salePriceStr, setSalePriceStr] = useState("");
  const [appraisedStr, setAppraisedStr] = useState("");
  const [holdingYears, setHoldingYears] = useState("3");
  const [registeredOverOneYear, setRegisteredOverOneYear] = useState(false);
  // override ฝ่ายที่รับผิดชอบต่อรายการ (key -> payer)
  const [payerOverrides, setPayerOverrides] = useState<Record<string, Payer>>(
    {},
  );

  const salePrice = toNumber(salePriceStr);
  const appraisedPrice = toNumber(appraisedStr);

  const result = useMemo(
    () =>
      calcTransferCost({
        salePrice,
        appraisedPrice: appraisedPrice || undefined,
        holdingYears: Number(holdingYears) || 0,
        sellerRegisteredOverOneYear: registeredOverOneYear,
      }),
    [salePrice, appraisedPrice, holdingYears, registeredOverOneYear],
  );

  const payerOf = (key: string, fallback: Payer): Payer =>
    payerOverrides[key] ?? fallback;

  const split = useMemo(
    () =>
      sumByPayer(result.items, (it) => payerOf(it.key, it.defaultPayer)),
    [result.items, payerOverrides],
  );

  const hasInput = salePrice > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* ฟอร์มอินพุต */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            ข้อมูลการซื้อขาย
          </h2>
          <div className="space-y-4">
            <FormRow label="ราคาซื้อขาย (บาท)" htmlFor="salePrice" required>
              <Input
                id="salePrice"
                inputMode="numeric"
                value={salePriceStr}
                onChange={(e) => setSalePriceStr(withCommas(e.target.value))}
                placeholder="เช่น 2,500,000"
              />
            </FormRow>

            <FormRow label="ราคาประเมินราชการ (บาท)" htmlFor="appraised">
              <Input
                id="appraised"
                inputMode="numeric"
                value={appraisedStr}
                onChange={(e) => setAppraisedStr(withCommas(e.target.value))}
                placeholder="ไม่ระบุ = ใช้ราคาซื้อขาย"
              />
              <p className="mt-1 text-xs text-gray-500">
                ค่าธรรมเนียมโอนและภาษีเงินได้คิดจากราคาประเมิน
              </p>
            </FormRow>

            <FormRow label="ระยะเวลาถือครองของผู้ขาย" htmlFor="holding">
              <Select
                id="holding"
                value={holdingYears}
                onChange={(e) => setHoldingYears(e.target.value)}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((y) => (
                  <option key={y} value={y}>
                    {y === 8 ? "8 ปีขึ้นไป" : `${y} ปี`}
                  </option>
                ))}
              </Select>
            </FormRow>

            <label className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                checked={registeredOverOneYear}
                onChange={(e) => setRegisteredOverOneYear(e.target.checked)}
              />
              <span>
                ผู้ขายมีชื่อในทะเบียนบ้านห้องนี้เกิน 1 ปี
                <span className="mt-0.5 block text-xs text-gray-500">
                  หากใช่ จะได้รับยกเว้นภาษีธุรกิจเฉพาะ (เก็บอากรแสตมป์ 0.5% แทน)
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* ผลลัพธ์ */}
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              สรุปต้นทุนการโอน
            </h2>
            {hasInput && (
              <span className="text-xs text-gray-500">
                {result.subjectToSbt
                  ? "เข้าเกณฑ์ภาษีธุรกิจเฉพาะ"
                  : "ยกเว้นภาษีธุรกิจเฉพาะ"}
              </span>
            )}
          </div>

          {!hasInput ? (
            <p className="py-10 text-center text-sm text-gray-400">
              กรอกราคาซื้อขายเพื่อดูผลการคำนวณ
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                      <th className="pb-2 font-medium">รายการ</th>
                      <th className="pb-2 text-right font-medium">จำนวนเงิน</th>
                      <th className="pb-2 pl-3 font-medium">ผู้รับผิดชอบ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.items.map((it) => (
                      <tr
                        key={it.key}
                        className="border-b border-gray-100 align-top"
                      >
                        <td className="py-2.5 pr-3">
                          <div className="font-medium text-gray-800">
                            {it.label}
                          </div>
                          {it.note && (
                            <div className="text-xs text-gray-500">
                              {it.note}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 text-right font-medium tabular-nums text-gray-900">
                          {formatBaht(it.amount)}
                        </td>
                        <td className="py-2.5 pl-3">
                          <Select
                            className="h-8 py-1 text-xs"
                            value={payerOf(it.key, it.defaultPayer)}
                            onChange={(e) =>
                              setPayerOverrides((prev) => ({
                                ...prev,
                                [it.key]: e.target.value as Payer,
                              }))
                            }
                          >
                            <option value="buyer">{PAYER_LABEL.buyer}</option>
                            <option value="seller">{PAYER_LABEL.seller}</option>
                            <option value="split">{PAYER_LABEL.split}</option>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="pt-3 font-semibold text-gray-900">
                        รวมทั้งสิ้น
                      </td>
                      <td className="pt-3 text-right text-base font-bold tabular-nums text-brand-700">
                        {formatBaht(result.total)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* แยกยอดตามฝ่าย */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-brand-50 p-4">
                  <div className="text-xs font-medium text-brand-700">
                    ผู้ซื้อจ่าย
                  </div>
                  <div className="mt-1 text-lg font-bold tabular-nums text-brand-700">
                    {formatBaht(split.buyer)}
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <div className="text-xs font-medium text-gray-600">
                    ผู้ขายจ่าย
                  </div>
                  <div className="mt-1 text-lg font-bold tabular-nums text-gray-800">
                    {formatBaht(split.seller)}
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-400">
                * เป็นการประมาณการเบื้องต้นตามอัตรามาตรฐานกรมที่ดิน
                อัตราจริงอาจเปลี่ยนตามมาตรการรัฐและควรตรวจสอบกับสำนักงานที่ดินอีกครั้ง
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
