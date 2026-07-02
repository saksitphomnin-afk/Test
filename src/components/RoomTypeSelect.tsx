"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { ROOM_TYPE_OPTIONS } from "@/lib/constants";

const OTHER = "__other__";

export function RoomTypeSelect({ defaultValue }: { defaultValue?: string | null }) {
  const initial = defaultValue ?? "";
  const isPreset = (ROOM_TYPE_OPTIONS as readonly string[]).includes(initial);
  // ถ้าค่าเดิมไม่ตรงตัวเลือกมาตรฐาน (ห้องเก่า/พิมพ์เอง) ให้ถือเป็น "อื่นๆ" แล้วเติมค่าเดิมในช่องระบุ
  const [choice, setChoice] = useState(
    isPreset ? initial : initial ? OTHER : "",
  );
  const [custom, setCustom] = useState(isPreset ? "" : initial);

  const value = choice === OTHER ? custom : choice;

  return (
    <>
      <Select
        id="roomType"
        value={choice}
        onChange={(e) => setChoice(e.target.value)}
      >
        <option value="">— เลือกประเภทห้อง —</option>
        {ROOM_TYPE_OPTIONS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
        <option value={OTHER}>อื่นๆ (ระบุเอง)</option>
      </Select>
      {choice === OTHER && (
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="ระบุประเภทห้อง"
          className="mt-2"
        />
      )}
      {/* ค่าจริงที่ส่งเข้า FormData */}
      <input type="hidden" name="roomType" value={value} />
    </>
  );
}
