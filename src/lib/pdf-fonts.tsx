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
// สระนำหน้า (เ แ โ ใ ไ) = จุดเริ่มพยางค์ใหม่เสมอ
const isLeadingVowel = (c: string) => c >= "เ" && c <= "ไ";

// แตกคำไทยเป็น "พยางค์" โดยยอมให้ตัดบรรทัดได้เฉพาะ "หน้าสระนำ" เท่านั้น
// → คำทั่วไปจะไม่ถูกตัดกลางคำ (เช่น "ทั้งหมด" อยู่เป็นก้อนเดียว ไม่เหลือ "มด" โดด ๆ)
// แต่ประโยคยาว ๆ ยังตัดบรรทัดได้ที่ขึ้นพยางค์ใหม่ (กันตัวอักษรท้ายบรรทัดหาย)
function thaiClusters(word: string): string[] {
  const clusters: string[] = [];
  let cur = "";
  for (const ch of word) {
    if (cur !== "" && isLeadingVowel(ch)) {
      clusters.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
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

// ตัวเลขยาว ๆ ที่ไม่มีช่องว่างเว้นวรรค (เลขบัตรประชาชน/เบอร์บัญชี/เบอร์โทร) ไม่มีจุดให้ตัดบรรทัด
// ตามธรรมชาติ — เมื่อยาวเกินบรรทัด react-pdf/textkit จะ "บังคับตัดกลางตัวเลข" พร้อมใส่ยัติภังค์ (-)
// ให้เอง (ไม่ใช่จาก hyphenation callback ที่ตั้งไว้ — เป็นพฤติกรรม fallback ภายในของ textkit
// เมื่อเจอ "คำ" ที่ไม่มีจุดตัดเลย) ทำให้เลขดูเหมือนขาด/ผิด แก้โดยแตกเป็น nested <Text> กลุ่มละ
// ~4 ตัวอักษร เพราะขอบเขตของ nested Text ถือเป็นจุดตัดบรรทัดที่ปลอดภัยอยู่แล้ว (ไม่มียัติภังค์)
const NUMERIC_TOKEN = /^[\d/().-]{7,}$/;
function chunkForBreaks(text: string): string[] {
  if (!NUMERIC_TOKEN.test(text)) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += 4) chunks.push(text.slice(i, i + 4));
  return chunks;
}

// react-pdf/textkit treats EVERY boundary between two adjacent style runs that
// aren't separated by a literal space (e.g. a bold value immediately followed by
// punctuation like ", ") as an optional low-priority hyphenation point — and will
// render a visible hyphen there if it helps line-fitting, even though neither side
// is an actual hyphenatable word. `hyphenationPenalty` (an undocumented but real
// <Text> prop read by @react-pdf/layout) raises the cost of using that break so
// high it's never chosen in a normal single-page-width document.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NO_HYPHEN_PROP = { hyphenationPenalty: 100000 } as any;

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
    <Text style={style} {...NO_HYPHEN_PROP}>
      {runs.map((r, i) =>
        chunkForBreaks(r.text).map((c, ci) => (
          <Text
            key={`${i}-${ci}`}
            style={{ fontFamily: r.latin ? "AngsanaNew" : "THSarabun" }}
          >
            {c}
          </Text>
        )),
      )}
    </Text>
  );
}

export type RichSegment = { text: string; bold?: boolean };

/**
 * เหมือน BiText แต่รับ "ส่วนย่อย" (segments) ที่แต่ละส่วนเลือกได้ว่าจะตัวหนา (bold) หรือไม่
 * ใช้กับย่อหน้าสัญญาที่ผสมข้อความมาตรฐาน (ปกติ) กับค่าที่ทีมกรอกเอง (ตัวหนา)
 * เช่น ["ผู้ให้เช่า ชื่อ-นามสกุล ", {text: "นาง เกษร", bold: true}, " เลขประจำตัวประชาชน ", ...]
 */
export function RichText({
  segments,
  style,
}: {
  segments: RichSegment[];
  style?: Style | Style[];
}) {
  return (
    <Text style={style} {...NO_HYPHEN_PROP}>
      {segments.map((seg, si) =>
        scriptRuns(seg.text).map((r, ri) =>
          chunkForBreaks(r.text).map((c, ci) => (
            <Text
              key={`${si}-${ri}-${ci}`}
              style={{
                fontFamily: r.latin ? "AngsanaNew" : "THSarabun",
                fontWeight: seg.bold ? "bold" : undefined,
              }}
            >
              {c}
            </Text>
          )),
        ),
      )}
    </Text>
  );
}
