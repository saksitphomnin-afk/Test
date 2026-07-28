"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Field";

// ช่องชื่อโครงการแบบ combobox — พิมพ์แล้วเด้งรายชื่อโครงการที่มีอยู่ให้เลือก
// กันคนพิมพ์ชื่อไม่ตรงกัน/สะกดต่างกันจนกลายเป็นคนละโครงการ (เช่น
// "Ashton Chula" กับ "Ashton Chula - Silom") — ถ้าตรงกับที่มีอยู่ให้เลือกอันเดิม
export function ProjectNameField({
  projects,
  defaultValue = "",
}: {
  projects: string[];
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [focused, setFocused] = useState(false);

  const query = value.trim().toLowerCase();
  const matches = query
    ? projects.filter((p) => p.toLowerCase().includes(query))
    : projects;
  const suggestions = matches.slice(0, 10);

  // ตรงกับโครงการที่มีอยู่แล้วเป๊ะ ๆ ไหม (ไม่สนตัวพิมพ์เล็ก/ใหญ่)
  const exactMatch = projects.some((p) => p.toLowerCase() === query);
  const isNew = query.length > 0 && !exactMatch;
  const showList = focused && suggestions.length > 0 && !exactMatch;

  return (
    <div className="relative">
      <Input
        id="projectName"
        name="projectName"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="เช่น The Base Sukhumvit"
        autoComplete="off"
        required
      />

      {showList && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-gray-200 bg-white py-1 shadow-lg">
          <li className="px-3 pb-1 pt-1 text-xs font-semibold text-gray-400">
            โครงการที่มีอยู่ — แตะเพื่อเลือก
          </li>
          {suggestions.map((p) => (
            <li key={p}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setValue(p);
                  setFocused(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700"
              >
                <span className="text-brand-500">🏢</span>
                {p}
              </button>
            </li>
          ))}
        </ul>
      )}

      {isNew && (
        <p className="mt-1 text-xs text-amber-600">
          ⚠️ ยังไม่มีโครงการนี้ในระบบ — จะเพิ่มเป็น{" "}
          <span className="font-medium">โครงการใหม่</span>{" "}
          (ถ้าเป็นโครงการเดิม กรุณาเลือกจากรายการเพื่อให้ชื่อตรงกัน)
        </p>
      )}
    </div>
  );
}
