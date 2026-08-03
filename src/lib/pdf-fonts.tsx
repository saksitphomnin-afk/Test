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
// คำนำหน้าสั้น ๆ ที่ไม่ยืนคำเดี่ยวตามธรรมชาติ (มักนำหน้าคำอื่นเสมอ เช่น "ผู้เช่า",
// "ผู้ให้เช่า") — ห้ามตัดบรรทัดทันทีหลังคำเหล่านี้ แม้จะเจอสระนำของคำถัดไปก็ตาม
// กันไม่ให้คำสำคัญของสัญญาแหว่งออกจากกัน (เช่น "ผู้" ค้างอยู่บรรทัดหนึ่ง แล้ว "เช่า"
// ไปอีกบรรทัดหนึ่ง)
const NO_BREAK_AFTER = ["ผู้", "ให้"];

export function thaiClusters(word: string): string[] {
  const clusters: string[] = [];
  let cur = "";
  for (const ch of word) {
    const mustGlue = NO_BREAK_AFTER.some((p) => cur.endsWith(p));
    if (cur !== "" && isLeadingVowel(ch) && !mustGlue) {
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
function chunkForBreaks(text: string, latin: boolean): string[] {
  if (latin) return [text];
  if (NUMERIC_TOKEN.test(text)) {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
      let end = Math.min(i + 4, text.length);
      // ถ้ายัติภังค์ "-" เดิม (เช่นในเลขบัญชี/เบอร์โทร) ตกท้ายกลุ่มพอดี จะไปชนกับ
      // ยัติภังค์ที่ textkit เติมเองตอนตัดบรรทัด กลายเป็น "--" ซ้อนกัน — ตัดกลุ่มให้สั้นลง
      // 1 ตัว ให้ "-" ไปขึ้นต้นกลุ่มถัดไปแทน (ขึ้นต้นด้วย "-" ไม่มีปัญหาอะไร)
      if (end < text.length && text[end - 1] === "-") end--;
      if (end === i) end = i + 1;
      chunks.push(text.slice(i, end));
      i = end;
    }
    return chunks;
  }
  return [insertBreathingSpaces(text)];
}

// react-pdf/textkit ("wrapWords") ตัดคำเป็น "ช่วง" ด้วยการ split ที่ช่องว่างจริง (" ")
// เท่านั้น — ช่วงที่เกิดจาก hyphenation callback (เช่น thaiClusters) ยังถูกนับเป็นจุดตัด
// "penalty" เสมอ ซึ่งจะขึ้นยัติภังค์ (-) ทุกครั้งที่ถูกเลือกใช้ ไม่ว่า hyphenationPenalty
// จะตั้งสูงแค่ไหนก็ตาม (แค่ลดโอกาสถูกเลือก ไม่ได้ป้องกันยัติภังค์เมื่อเลี่ยงไม่ได้จริง ๆ)
// ประโยคไทยยาว ๆ ที่ไม่มีช่องว่างธรรมชาติเลยในช่วงยาวเกิน 1 บรรทัด (เช่น อนุประโยคยาว)
// จึงหลีกเลี่ยงยัติภังค์ไม่ได้ด้วยกลไกนี้ — ทางเดียวที่ตัดบรรทัดได้โดยไม่มียัติภังค์คือ
// ช่องว่างจริง จึงต้องแทรกช่องว่างจริง (ไม่ใช่แค่แตก nested <Text>) ที่จุดปลอดภัย (หน้าสระนำ)
// เฉพาะ "คำ" ที่ยาวเกินกว่าจะพอดี 1 บรรทัดได้แน่ ๆ เพื่อไม่ให้กระทบระยะห่างของคำสั้น ๆ ทั่วไป
const MAX_UNBREAKABLE_RUN = 22;
function insertBreathingSpaces(text: string): string {
  return text
    .split(/( +)/)
    .map((word) => {
      // ระวัง: ใช้ /^ +$/ (ทั้งคำต้องเป็นช่องว่างล้วน) ไม่ใช่ /\s/.test() เฉย ๆ — เพราะ
      // glueClauseNumber แทรก NBSP (U+00A0) ไว้ในเนื้อคำ (เช่น "9.1 ความ...") และ \s
      // ใน JS regex แมตช์ NBSP ด้วย ถ้าใช้ .test() เดิม คำที่ "มี" NBSP อยู่ที่ไหนสักแห่ง
      // (ไม่ใช่ทั้งคำเป็นช่องว่าง) จะถูกเข้าใจผิดว่าเป็นช่องว่างล้วน แล้วข้ามการตัดคำไปทั้งคำ
      if (/^ +$/.test(word) || word.length <= MAX_UNBREAKABLE_RUN) return word;
      // ยาวเกินจะพอดี 1 บรรทัดแน่ ๆ — เว้นวรรคจริงคั่นทุกจุด (ไม่ใช่แค่รวมเป็นกลุ่มละ ~40
      // ตัวอักษร) เพราะจุดตัดบรรทัดจริงอาจตกกลางกลุ่มที่รวมไว้ได้ ถ้ายังยาวเกินพื้นที่
      // เหลือของบรรทัดนั้น ๆ ก็จะกลับไปเจอยัติภังค์อีกเหมือนเดิม
      // บางพยางค์ (ตาม thaiClusters) เองก็ยาวเกิน MAX_UNBREAKABLE_RUN ได้ (ช่วงยาวที่ไม่มี
      // สระนำเลย) — ไม่มีจุดตัดตามหลักภาษาให้ใช้อีกแล้ว จึงตัดตรง ๆ ทุก ๆ MAX_UNBREAKABLE_RUN
      // ตัวอักษร (ดีกว่ายัติภังค์ผิด ๆ เพราะภาษาไทยไม่มีธรรมเนียมการใส่ยัติภังค์อยู่แล้ว)
      // แต่ต้องเลื่อนจุดตัดให้พ้นสระ/วรรณยุกต์ที่ลอยอยู่ (combining mark) ก่อนเสมอ ไม่งั้น
      // จะตัดแยกพยัญชนะออกจากสระ/วรรณยุกต์ที่เกาะอยู่ ทำให้เห็นเครื่องหมายลอยผิดที่
      const pieces = thaiClusters(word).flatMap((c) => {
        if (c.length <= MAX_UNBREAKABLE_RUN) return [c];
        const sub: string[] = [];
        let i = 0;
        while (i < c.length) {
          let end = i + MAX_UNBREAKABLE_RUN;
          while (end < c.length && /\p{Mn}/u.test(c[end])) end++;
          sub.push(c.slice(i, end));
          i = end;
        }
        return sub;
      });
      return pieces.join(" ");
    })
    .join("");
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
  minPresenceAhead,
}: {
  children: ReactNode;
  style?: Style | Style[];
  minPresenceAhead?: number;
}) {
  const text = nodeToText(children);
  const runs = scriptRuns(text);
  return (
    <Text style={style} minPresenceAhead={minPresenceAhead} {...NO_HYPHEN_PROP}>
      {runs.map((r, i) =>
        chunkForBreaks(r.text, r.latin).map((c, ci) => (
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
          chunkForBreaks(r.text, r.latin).map((c, ci) => (
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
