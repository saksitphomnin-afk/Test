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
// คำเสริมท้ายกริยาที่เกาะติดคำหน้าเสมอ (เช่น "จัดไว้", "เก็บไว้") แม้จะขึ้นต้นด้วยสระนำ
// ก็ห้ามตัดบรรทัดก่อนคำเหล่านี้ กันไม่ให้แหว่งออกจากกริยาข้างหน้า
const NO_BREAK_BEFORE = ["ไว้"];

export function thaiClusters(word: string): string[] {
  const clusters: string[] = [];
  let cur = "";
  const chars = Array.from(word);
  for (let idx = 0; idx < chars.length; idx++) {
    const ch = chars[idx];
    const mustGlueAfter = NO_BREAK_AFTER.some((p) => cur.endsWith(p));
    const mustGlueBefore =
      cur !== "" &&
      NO_BREAK_BEFORE.some((w) => chars.slice(idx, idx + w.length).join("") === w);
    if (cur !== "" && isLeadingVowel(ch) && !mustGlueAfter && !mustGlueBefore) {
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
function chunkNumeric(text: string): string[] {
  if (!NUMERIC_TOKEN.test(text)) return [text];
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

function chunkForBreaks(text: string, latin: boolean): string[] {
  if (latin) return [text];
  if (NUMERIC_TOKEN.test(text)) return chunkNumeric(text);
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
const MAX_UNBREAKABLE_RUN = 28;
const CHUNK_TARGET = 16;
const HARD_SLICE_LIMIT = 16;

// คำนวณ "ตำแหน่ง" ในข้อความที่ควรแทรกช่องว่างจริงไว้ข้างหน้า (ไม่แก้ข้อความจริง) —
// แยกออกมาจากการแทรกจริง เพื่อให้ใช้ร่วมกับข้อความที่ประกอบจากหลาย segment ได้
// (ดู breatheAcrossSegments) โดยไม่ขึ้นกับขอบเขต segment ใด ๆ
function computeBreathingOffsets(text: string): Set<number> {
  const offsets = new Set<number>();
  let pos = 0;
  for (const word of text.split(/( +)/)) {
    if (!/^ +$/.test(word) && word.length > MAX_UNBREAKABLE_RUN) {
      const clusters = thaiClusters(word);
      let acc = 0;
      let cur = "";
      // ห้ามแทรกช่องว่างที่ตำแหน่ง acc===0 (จุดเริ่ม "คำ" นี้เอง) เพราะข้างหน้ามันมีช่องว่าง
      // จริง (หรือจุดเริ่มข้อความ) คั่นอยู่แล้วเสมอ — ไม่งั้นจะกลายเป็นช่องว่างซ้อนสองอัน
      const addOffset = () => {
        if (acc > 0) offsets.add(pos + acc);
      };
      for (const c of clusters) {
        if (c.length > HARD_SLICE_LIMIT) {
          // พยางค์นี้ (ตาม thaiClusters) ยาวเกิน HARD_SLICE_LIMIT เอง (ช่วงยาวที่ไม่มี
          // สระนำเลย) — ไม่ตัดมันต่อแบบสุ่มตำแหน่ง เพราะเสี่ยงตัดกลาง "คำ" จริง ๆ (เช่น
          // "รายการ" กลายเป็น "รา|ยการ") ซึ่งดูแปลกกว่ายัติภังค์เสียอีก ปล่อยเป็นก้อนเดียว
          // ไปทั้งดุ้น — ถ้าสุดท้ายยังไม่พอดีบรรทัดจริง ๆ ก็ยอมให้ fallback เดิมขึ้น
          // ยัติภังค์เป็นกรณีหายากแทน ดีกว่าคำแหว่งผิดที่บ่อย ๆ
          if (cur) {
            addOffset();
            acc += cur.length;
            cur = "";
          }
          addOffset();
          acc += c.length;
        } else if (cur && cur.length + c.length > CHUNK_TARGET) {
          addOffset();
          acc += cur.length;
          cur = c;
        } else {
          cur += c;
        }
      }
      // ต้องคั่นก่อนก้อนสุดท้ายที่ค้างอยู่ใน cur ด้วย (เทียบเท่า pieces.join(" ") ของโค้ด
      // เดิมที่ใส่ตัวคั่นระหว่างทุกชิ้นใน pieces เสมอ รวมทั้งก่อนชิ้นสุดท้าย) — ถ้าลืมขั้นนี้
      // ก้อนสุดท้ายจะไปติดกับก้อนก่อนหน้าโดยไม่มีช่องว่างคั่น เสี่ยงยัติภังค์ตอนตัดบรรทัด
      // แต่ต้องมีเงื่อนไข "cur ไม่ว่าง" ด้วย (เหมือน if(cur) ของโค้ดเดิม) — ไม่งั้นกรณีที่
      // พยางค์สุดท้ายเพิ่งถูก flush ไปแล้ว (cur ว่างพอดี) จะไปแทรกซ้ำที่ตำแหน่งท้ายคำ ซึ่งชน
      // กับช่องว่างจริงที่ตามมาอยู่แล้วพอดี กลายเป็นช่องว่างซ้อนสองอัน
      if (cur) addOffset();
    }
    pos += word.length;
  }
  return offsets;
}

function insertBreathingSpaces(text: string): string {
  const offsets = computeBreathingOffsets(text);
  if (offsets.size === 0) return text;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    if (offsets.has(i)) out += " ";
    out += text[i];
  }
  return out;
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

export type RichSegment = { text: string; bold?: boolean; underline?: boolean };

// boldRoleTerms (contract-pdf.tsx) แตกข้อความเป็นหลาย segment ที่รอยต่อคำนิยาม
// ("ผู้เช่า"/"ผู้ให้เช่า") ซึ่งมักไม่มีช่องว่างจริงคั่นกับคำข้างเคียงเลย — ถ้าคำนวณจุดแทรก
// ช่องว่าง (computeBreathingOffsets) แยกทีละ segment เหมือน BiText จะมองไม่เห็นบริบท
// ทั้งประโยค ทำให้พลาดจุดปลอดภัยที่เคยมีตอนข้อความยังเป็นก้อนเดียว (เกิดยัติภังค์ใหม่ที่
// รอยต่อ) ฟังก์ชันนี้จึงต่อข้อความทุก segment เป็นก้อนเดียวก่อน คำนวณจุดแทรกช่องว่างข้าม
// ขอบเขต segment ได้ แล้วค่อยตัดกลับเป็นชิ้นตามสไตล์ (ตัวหนา/ขีดเส้นใต้) เดิม
function breatheAcrossSegments(segments: RichSegment[]): RichSegment[] {
  const flatChars: string[] = [];
  const owner: number[] = [];
  segments.forEach((s, idx) => {
    for (const ch of s.text) {
      flatChars.push(ch);
      owner.push(idx);
    }
  });
  const offsets = computeBreathingOffsets(flatChars.join(""));
  if (offsets.size === 0) return segments;

  const result: RichSegment[] = [];
  let curText = "";
  let curOwner = -1;
  const flush = () => {
    if (!curText) return;
    const src = segments[curOwner];
    result.push({ text: curText, bold: src?.bold, underline: src?.underline });
    curText = "";
  };
  for (let i = 0; i < flatChars.length; i++) {
    if (offsets.has(i)) {
      flush();
      result.push({ text: " " });
      curOwner = -1;
    }
    if (owner[i] !== curOwner) {
      flush();
      curOwner = owner[i];
    }
    curText += flatChars[i];
  }
  flush();
  return result;
}

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
  const breathed = breatheAcrossSegments(segments);
  return (
    <Text style={style} {...NO_HYPHEN_PROP}>
      {breathed.map((seg, si) =>
        scriptRuns(seg.text).map((r, ri) =>
          // ช่องว่างที่แทรกใหม่ (และ scriptRuns แบ่งอื่น ๆ) ผ่าน computeBreathingOffsets
          // ไปแล้วในระดับข้อความเต็ม ไม่ต้องเรียก insertBreathingSpaces ซ้ำ — ใช้ chunkNumeric
          // ตรง ๆ (ยังต้องแบ่งเลขบัญชี/เบอร์โทรกลุ่มละ ๆ อยู่)
          chunkNumeric(r.text).map((c, ci) => (
            <Text
              key={`${si}-${ri}-${ci}`}
              style={{
                fontFamily: r.latin ? "AngsanaNew" : "THSarabun",
                fontWeight: seg.bold ? "bold" : undefined,
                textDecoration: seg.underline ? "underline" : undefined,
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
