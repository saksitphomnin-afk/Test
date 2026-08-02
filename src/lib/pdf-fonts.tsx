import fs from "fs";
import path from "path";
import type { ReactNode } from "react";
import { Font, Text } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

// ระบบฟอนต์กลางสำหรับเอกสาร PDF ทุกชนิด (สัญญา/ใบเสร็จ)
// - ภาษาไทย  → TH Sarabun (ราชการ)
// - ภาษาอังกฤษ/ตัวเลข → Angsana New
// ฝังฟอนต์เป็น base64 data URL (กัน @react-pdf พึ่ง path/fetch ตอน runtime บน serverless)

function dataUrl(file: string): string {
  const filePath = path.join(process.cwd(), "public/fonts", file);
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:font/ttf;base64,${base64}`;
}

Font.register({
  family: "THSarabun",
  fonts: [
    { src: dataUrl("THSarabun-Regular.ttf") },
    { src: dataUrl("THSarabun-Bold.ttf"), fontWeight: "bold" },
  ],
});

Font.register({
  family: "AngsanaNew",
  fonts: [
    { src: dataUrl("AngsanaNew-Regular.ttf") },
    { src: dataUrl("AngsanaNew-Bold.ttf"), fontWeight: "bold" },
  ],
});

// @react-pdf/textkit ตัดบรรทัดได้เฉพาะที่ช่องว่าง (space) — ภาษาไทยไม่มีช่องว่างระหว่างคำ
// ทำให้ทั้งประโยคไทยกลายเป็น "คำเดียว" ยาว ๆ แล้วตัวอักษรท้ายบรรทัดหายตอนตัดบรรทัด
// แก้ด้วยการบอกจุดตัดได้ = แตกคำไทยเป็น "คลัสเตอร์" (พยัญชนะ + สระ/วรรณยุกต์ที่เกาะอยู่)
// โดยยึดสระหน้า (เ แ โ ใ ไ) ให้ติดกับพยัญชนะตัวถัดไป
const isLeadingVowel = (c: string) => c >= "เ" && c <= "ไ";
const isThaiCombining = (c: string) =>
  c === "ั" ||
  (c >= "ิ" && c <= "ฺ") ||
  (c >= "็" && c <= "๎");

function thaiClusters(word: string): string[] {
  const clusters: string[] = [];
  let cur = "";
  for (const ch of word) {
    if (cur === "") {
      cur = ch;
      continue;
    }
    if (isThaiCombining(ch)) {
      cur += ch;
      continue;
    }
    if (isLeadingVowel(cur[cur.length - 1])) {
      cur += ch;
      continue;
    }
    clusters.push(cur);
    cur = ch;
  }
  if (cur) clusters.push(cur);
  return clusters;
}

Font.registerHyphenationCallback((word) => {
  if (!/[฀-๿]/.test(word)) return [word];
  return thaiClusters(word);
});

// ใช้ Angsana New เฉพาะ "ตัวอักษรอังกฤษ a–z/A–Z" เท่านั้น
// ตัวเลข เครื่องหมาย วรรค และภาษาไทย → ใช้ TH Sarabun ทั้งหมด (ตามที่ผู้ใช้ต้องการ)
const isLatinLetter = (c: string) => /[A-Za-z]/.test(c);

// แตกข้อความเป็นช่วงอังกฤษ/ไม่ใช่อังกฤษ (ช่องว่างเกาะช่วงก่อนหน้าเพื่อลดการสลับฟอนต์ถี่ ๆ)
function scriptRuns(text: string): { latin: boolean; text: string }[] {
  const runs: { latin: boolean; text: string }[] = [];
  let mode: boolean | null = null;
  let buf = "";
  for (const ch of text) {
    if (/\s/.test(ch) && mode !== null) {
      buf += ch;
      continue;
    }
    const latin = isLatinLetter(ch);
    if (mode === null) {
      mode = latin;
      buf = ch;
    } else if (latin === mode) {
      buf += ch;
    } else {
      runs.push({ latin: mode, text: buf });
      mode = latin;
      buf = ch;
    }
  }
  if (buf) runs.push({ latin: mode ?? false, text: buf });
  return runs;
}

/**
 * ข้อความสองภาษา — ตัวไทยใช้ TH Sarabun, ตัวอังกฤษ/ตัวเลขใช้ Angsana New (ขยายให้สูงเท่ากัน)
 * ใช้แทน <Text> ทุกที่ที่ข้อความอาจปนไทย+อังกฤษ (เช่น ชื่อโครงการ "Ashton Chula - Silom")
 * รับ style เดิม (fontSize/fontWeight/…) แล้วสลับเฉพาะ fontFamily ต่อช่วง
 */
function nodeToText(node: ReactNode): string {
  if (node == null || node === false || node === true) return "";
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  return "";
}

export function BiText({
  children,
  style,
}: {
  children: ReactNode;
  style?: Style | Style[];
}) {
  const text = nodeToText(children);
  const runs = scriptRuns(text);
  return (
    <Text style={style}>
      {runs.map((r, i) => (
        <Text
          key={i}
          style={{ fontFamily: r.latin ? "AngsanaNew" : "THSarabun" }}
        >
          {r.text}
        </Text>
      ))}
    </Text>
  );
}
