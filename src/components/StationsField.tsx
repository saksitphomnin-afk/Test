"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { stationsByLine } from "@/lib/stations";

type Row = { station: string; distance: string };

export function StationsField({
  defaultStations = [],
}: {
  defaultStations?: { station: string; distanceMeters: number }[];
}) {
  const [rows, setRows] = useState<Row[]>(
    defaultStations.length > 0
      ? defaultStations.map((s) => ({
          station: s.station,
          distance: String(s.distanceMeters),
        }))
      : [],
  );

  const grouped = stationsByLine();

  function update(index: number, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, { station: "", distance: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  // ค่าจริงที่ส่งเข้า FormData — เฉพาะแถวที่เลือกสถานี + ใส่ระยะครบ
  const payload = rows
    .filter((r) => r.station && r.distance.trim())
    .map((r) => ({
      station: r.station,
      distanceMeters: Number(r.distance.replace(/[^\d]/g, "")) || 0,
    }))
    .filter((r) => r.distanceMeters > 0);

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-sm text-gray-400">
          ยังไม่ได้เพิ่มสถานี — กด “+ เพิ่มสถานี” เพื่อระบุรถไฟฟ้าใกล้เคียง
        </p>
      )}

      {rows.map((row, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs text-gray-500">สถานี</label>
            <Select
              value={row.station}
              onChange={(e) => update(i, { station: e.target.value })}
            >
              <option value="">— เลือกสถานี —</option>
              {grouped.map(({ line, stations }) => (
                <optgroup key={line.key} label={line.label}>
                  {stations.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.nameTh}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>
          <div className="w-28 shrink-0">
            <label className="mb-1 block text-xs text-gray-500">ระยะ (ม.)</label>
            <Input
              inputMode="numeric"
              value={row.distance}
              onChange={(e) =>
                update(i, { distance: e.target.value.replace(/[^\d]/g, "") })
              }
              placeholder="เช่น 250"
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(i)}
            aria-label="ลบสถานี"
            className="mb-0.5 flex h-11 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="inline-flex items-center gap-1 rounded-lg border border-dashed border-brand-300 px-3 py-2 text-sm font-medium text-brand-600 transition hover:bg-brand-50"
      >
        + เพิ่มสถานี
      </button>

      <input type="hidden" name="stations" value={JSON.stringify(payload)} />
    </div>
  );
}
