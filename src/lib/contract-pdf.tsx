import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ContractType } from "@prisma/client";
import { contractSections, type ContractData } from "@/lib/contract";
import {
  thaiDate,
  engDate,
  bahtNumber,
  bahtText,
  or,
  type Lang,
} from "@/lib/lease-clauses";
import { CONTRACT_META } from "@/lib/constants";
import { BiText, RichText, type RichSegment } from "@/lib/pdf-fonts";

export type { Lang };

const styles = StyleSheet.create({
  page: {
    fontFamily: "THSarabun",
    fontSize: 16,
    // ขอบซ้าย 3ซม./ขวา 2ซม./บน 2.5ซม./ล่าง 2ซม. (1ซม. = 28.3465pt)
    paddingTop: 71,
    paddingBottom: 57,
    paddingLeft: 85,
    paddingRight: 57,
    color: "#111827",
    lineHeight: 1.45,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  headerLine: { textAlign: "right", marginBottom: 3 },
  clauseBlock: { marginBottom: 10 },
  clauseTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
  // ไม่ใช้ justify กับข้อความไทย — ภาษาไทยไม่มีช่องว่างระหว่างคำตามธรรมชาติ ทำให้ react-pdf
  // ยืดช่องว่างที่มีอยู่ไม่กี่จุดจนห่างผิดปกติในบรรทัดที่มีคำน้อย ส่วนภาษาอังกฤษมีช่องว่างระหว่าง
  // คำทุกคำอยู่แล้ว จึง justify ได้ปกติเพื่อให้ทุกบรรทัดชิดขอบขวาเท่ากัน
  para: { marginBottom: 4, textAlign: "left" },
  paraEn: { marginBottom: 4, textAlign: "justify" },
  // signatures
  signWrap: { marginTop: 40 },
  signRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
  },
  signBox: { width: "47%" },
  signLine: { flexDirection: "row", alignItems: "flex-end", marginBottom: 6 },
  signDateLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 16,
  },
  signDash: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    marginHorizontal: 4,
    marginBottom: 3,
  },
  signName: { textAlign: "center", fontSize: 13, marginTop: -3, marginBottom: 6 },
  footerWrap: {
    position: "absolute",
    bottom: 24,
    left: 85,
    right: 57,
  },
  footerText: {
    textAlign: "center",
    fontSize: 10,
    color: "#9ca3af",
  },
  // generic (SALE) layout
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: "35%", color: "#6b7280" },
  // ตัวหนา + ขีดเส้นใต้ — เน้นค่าที่ทีมกรอกก่อนออกสัญญาให้ต่างจากป้ายชื่อฟิลด์
  value: { width: "65%", fontWeight: "bold", textDecoration: "underline" },
  // ตาราง 4 คอลัมน์ (สัญญาแต่งตั้งนายหน้า — อัตราค่าตอบแทนตามอายุสัญญา)
  brokerTableWrap: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 16,
  },
  brokerTableRow: { flexDirection: "row" },
  brokerCell: {
    width: "25%",
    padding: 6,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#d1d5db",
  },
  brokerCellLast: {
    width: "25%",
    padding: 6,
    textAlign: "center",
  },
  brokerHeaderCell: { backgroundColor: "#f3f4f6", fontWeight: "bold" },
  brokerRowBorderTop: { borderTopWidth: 1, borderTopColor: "#d1d5db" },
  // หัวเอกสาร (แยกจาก styles.title/headerLine ที่ใช้ร่วมกับสัญญาเช่า/ซื้อขาย กันกระทบกัน) —
  // วันที่ชิดขวาบนสุด, หัวข้อใหญ่กว่าเนื้อหาแค่นิดเดียว (18 จาก 16), เรียนชิดขอบซ้าย
  brokerDate: { textAlign: "right", marginBottom: 10 },
  brokerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  brokerAddressee: { textAlign: "left", marginBottom: 4, fontWeight: "bold" },
  // label ตัวหนา (ไม่ขีดเส้น), value ตัวปกติ (ไม่หนา ไม่ขีดเส้น) — สลับจาก label/value ที่ใช้
  // ร่วมกับสัญญาเช่า-ซื้อขาย (label เทา, value หนา+ขีดเส้น) กันกระทบเอกสารประเภทอื่น
  brokerLabel: { width: "35%", fontWeight: "bold" },
  brokerValue: { width: "65%" },
  // หน้าอัดแน่นกว่าเอกสารอื่น (padding/line-height น้อยลง) ให้จบใน 1 หน้าแม้ข้อมูลจริงยาว —
  // ขอบซ้าย/ขวาเท่ากัน (57pt ~2ซม. ทั้งสองข้าง) แทนขอบซ้ายกว้างกว่าแบบสัญญาเช่า (เผื่อเจาะรูเข้าแฟ้ม)
  // เพื่อให้ใช้พื้นที่แนวนอนได้เต็มกระดาษ ข้อความชิดขอบทั้งสองฝั่งเท่ากัน
  brokerPage: {
    paddingTop: 42,
    paddingBottom: 42,
    paddingLeft: 57,
    paddingRight: 57,
    lineHeight: 1.25,
  },
  brokerPara: { marginBottom: 2, textAlign: "left" },
  // ช่องลงชื่อแบบตัวอย่างที่ผู้ใช้ส่งมา — เส้นก่อน แล้วชื่อในวงเล็บใต้เส้น แล้วตำแหน่งใต้ชื่อ
  // (ไม่มีคำว่า "ลงชื่อ" นำหน้าแบบ SignBox ที่ใช้ร่วมกับสัญญาเช่า-ซื้อขาย)
  brokerSignBox: { width: "47%", alignItems: "center" },
  brokerSignLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    width: "80%",
    marginBottom: 4,
  },
  brokerSignName: { textAlign: "center", marginBottom: 2 },
  brokerSignRole: { textAlign: "center", color: "#6b7280" },
});

// ==================== เงินตรา + คำอ่านไทย ====================

function bahtWithWords(v?: string): string {
  const num = bahtNumber(v);
  if (!v || !v.trim()) return `${num} บาท (………………………………)`;
  return `${num} บาท (${bahtText(v)})`;
}

// เวอร์ชันอังกฤษ — ใส่แค่ตัวเลข + "Baht" (ไม่สะกดเป็นคำ)
function bahtEn(v?: string): string {
  return `${bahtNumber(v)} Baht`;
}

// เยื้องบรรทัดแรกของย่อหน้า (เช่น 5.1) ด้วยช่องว่างนำ — ใช้แทน textIndent เพราะ
// @react-pdf ไม่สนใจ textIndent เมื่อข้อความอยู่ใน nested <Text> (ซึ่ง BiText ใช้เสมอ)
// ~10 ช่องว่าง ≈ 1 แท็บ ส่วนบรรทัดที่ตัดขึ้นใหม่จะชิดขอบตรงกับหัวข้อใหญ่
const FIRST_LINE_INDENT = " ".repeat(12);
// เยื้องลึกกว่าปกติสำหรับรายการย่อยที่ซ้อนอยู่ใต้ข้อ (เช่น บัญชีธนาคารใต้ข้อ 4.1)
const NESTED_INDENT = " ".repeat(20);

// ผูกเลขข้อ (เช่น "9.1") ให้ติดกับคำแรกด้วย non-breaking space — กัน react-pdf
// ดันคำแรก (ที่เป็นก้อนยาว) ลงบรรทัดถัดไปจนเหลือเลขข้อโดดอยู่บรรทัดเดียว
// (แก้เฉพาะ segment แรกซึ่งเป็นข้อความมาตรฐานเสมอ ไม่ใช่ค่าที่กรอกเอง)
function glueClauseNumber(segs: RichSegment[]): RichSegment[] {
  const [first, ...rest] = segs;
  if (!first || first.bold) return segs;
  const text = first.text.replace(/^(\d+(?:\.\d+)?)\s+/, "$1 ");
  return text === first.text ? segs : [{ ...first, text }, ...rest];
}

// Tagged template สร้าง segment: ข้อความมาตรฐานในเทมเพลต = ปกติ,
// ค่าที่ ${...} แทรกเข้ามา (ข้อมูลที่ทีมกรอกก่อนออกสัญญา) = ตัวหนา + ขีดเส้นใต้
// (แยกจากตัวหนาของคำนิยามคู่สัญญา เช่น "ผู้เช่า" ซึ่งหนาอย่างเดียว ไม่ขีดเส้นใต้)
function T(strings: TemplateStringsArray, ...values: string[]): RichSegment[] {
  const segs: RichSegment[] = [];
  strings.forEach((str, i) => {
    if (str) segs.push({ text: str });
    if (i < values.length) segs.push({ text: values[i], bold: true, underline: true });
  });
  return segs;
}

function withPrefix(prefix: string, segs: RichSegment[]): RichSegment[] {
  return prefix ? [{ text: prefix }, ...segs] : segs;
}

// คำนิยามคู่สัญญา — ทำตัวหนาทุกครั้งที่ปรากฏในเนื้อหา (ไม่ใช่แค่ตอนประกาศนิยามในข้อ 1)
// ตามแบบฟอร์มต้นฉบับที่ผู้ใช้ส่งมา (ตัวหนาทั้งเอกสาร ไม่ใช่แค่ข้อที่เกี่ยวกับธนาคาร)
const ROLE_TERMS = ["ผู้ให้เช่า", "ผู้เช่า", "Lessor", "Lessee"];
const ROLE_TERMS_PATTERN = new RegExp(`(${ROLE_TERMS.join("|")})`, "g");

function boldRoleTerms(segs: RichSegment[]): RichSegment[] {
  const result: RichSegment[] = [];
  for (const s of segs) {
    if (s.bold) {
      result.push(s);
      continue;
    }
    for (const part of s.text.split(ROLE_TERMS_PATTERN)) {
      if (part) result.push({ text: part, bold: ROLE_TERMS.includes(part) });
    }
  }
  return result;
}

// อ้างอิงข้ออื่น เช่น "ข้อ 5.1" / "Clause 5.1" ห้ามให้เลขข้อไปขึ้นบรรทัดใหม่โดดเดี่ยวจากคำนำหน้า
// (react-pdf ตัดบรรทัดที่ช่องว่างจริงตามปกติ ไม่รู้ว่าคู่นี้ควรอยู่ติดกัน) แทนที่ช่องว่างด้วย
// non-breaking space กันไม่ให้ถูกเลือกเป็นจุดตัดบรรทัด
const CLAUSE_REF_PATTERN = /(ข้อ|Clause) (?=\d)/g;
function glueClauseRefs(text: string): string {
  return text.replace(CLAUSE_REF_PATTERN, "$1 ");
}
function glueClauseRefsInSegs(segs: RichSegment[]): RichSegment[] {
  return segs.map((s) => (s.text.includes(" ") ? { ...s, text: glueClauseRefs(s.text) } : s));
}

// ==================== สัญญาเช่า (ตามเทมเพลตผู้ใช้ 14 ข้อ — ไทย/อังกฤษ) ====================

type ParaMode = "indent" | "flush" | "nested";
type Item = {
  th: RichSegment[];
  en: RichSegment[];
  mode: ParaMode;
};
type Block = { titleTh: string; titleEn: string; items: Item[] };

function leaseBlocks(d: ContractData): Block[] {
  const seg = (input: string | RichSegment[]): RichSegment[] =>
    typeof input === "string" ? [{ text: input }] : input;
  // indent (ค่าเริ่มต้น) = เยื้องบรรทัดแรก 1 แท็บ
  // flush = ชิดขอบเสมอหัวข้อใหญ่ (บรรทัดต่อเนื่องของข้อเดียวกัน)
  // nested = เยื้องลึกกว่าปกติ (รายการย่อยที่ซ้อนอยู่ใต้ข้อ เช่น บัญชีธนาคาร)
  const item = (
    th: string | RichSegment[],
    en: string | RichSegment[],
    opts: { mode?: ParaMode } = {},
  ): Item => ({
    th: boldRoleTerms(glueClauseRefsInSegs(seg(th))),
    en: boldRoleTerms(glueClauseRefsInSegs(seg(en))),
    mode: opts.mode ?? "indent",
  });
  // ข้อ 1 และ 3 ไม่มีเลขข้อย่อย (x.y) ในเทมเพลตต้นฉบับ — บรรทัดต่อเนื่องจึงชิดขอบ
  // (บรรทัดที่ขึ้นข้อความ/ตัวละครใหม่ เช่น "ผู้ให้เช่า.../และผู้เช่า..." ยังเยื้องเหมือนข้ออื่น)
  const flush = (th: string | RichSegment[], en: string | RichSegment[]) =>
    item(th, en, { mode: "flush" });

  return [
    {
      titleTh: "1. คู่สัญญา",
      titleEn: "1. Parties",
      items: [
        // แยกทีละบรรทัดตามต้นฉบับ — แต่ละภาษา (ไทย/อังกฤษ) เป็นคนละหมวดกันแล้ว จึงไม่ต้อง
        // รวมเป็นประโยคเดียวข้ามภาษาเหมือนตอนแสดงแบบสลับบรรทัดอีกต่อไป
        item(
          T`ผู้ให้เช่า ชื่อ-นามสกุล ${or(d.lessorName)} เลขประจำตัวประชาชน ${or(d.lessorIdOrPassport)}`,
          T`Lessor, name-surname ${or(d.lessorNameEn || d.lessorName)}, national ID / passport No. ${or(d.lessorIdOrPassport)}`,
        ),
        flush(
          T`ที่อยู่ ${or(d.lessorAddress)} โทรศัพท์ ${or(d.lessorPhone)}`,
          T`address ${or(d.lessorAddress)}, telephone ${or(d.lessorPhone)}`,
        ),
        flush(
          'ต่อไปในสัญญานี้เรียกว่า "ผู้ให้เช่า"',
          'hereinafter referred to as the "Lessor"',
        ),
        item(
          T`และผู้เช่า ชื่อ-นามสกุล ${or(d.tenantName)} เลขประจำตัวประชาชน ${or(d.tenantIdOrPassport)} ที่อยู่ ${or(d.tenantAddress)} โทรศัพท์ ${or(d.tenantPhone)} ต่อไปในสัญญานี้เรียกว่า "ผู้เช่า"`,
          T`and Lessee, name-surname ${or(d.tenantNameEn || d.tenantName)}, national ID / passport No. ${or(d.tenantIdOrPassport)}, address ${or(d.tenantAddress)}, telephone ${or(d.tenantPhone)}, hereinafter referred to as the "Lessee"`,
        ),
        flush(
          "ทั้งสองฝ่ายตกลงทำสัญญา โดยมีรายละเอียดดังต่อไปนี้",
          "Both parties agree to enter into this agreement with the following details:",
        ),
      ],
    },
    {
      titleTh: "2. ทรัพย์สินที่ให้เช่า",
      titleEn: "2. Leased Property",
      items: [
        item(
          T`2.1 ผู้ให้เช่าตกลงให้ผู้เช่าเช่า ห้องชุดเลขที่ ${or(d.propertyUnitNo)} ชั้น ${or(d.propertyFloor)} อาคาร ${or(d.propertyBuilding)} โครงการ ${or(d.propertyProject)} ที่ตั้ง ${or(d.propertyAddress)}`,
          T`2.1 The Lessor agrees to lease to the Lessee the condominium unit No. ${or(d.propertyUnitNo)}, Floor ${or(d.propertyFloor)}, Building ${or(d.propertyBuilding)}, ${or(d.propertyProject)} project, located at ${or(d.propertyAddress)}`,
        ),
        item(
          "รวมถึงทรัพย์สิน และอุปกรณ์ภายในห้อง ตามบัญชีรายการแนบท้าย ซึ่งถือเป็นส่วนหนึ่ง ของสัญญาฉบับนี้",
          "including the furniture and fixtures inside the unit as per the attached inventory list, which is deemed a part of this agreement.",
        ),
      ],
    },
    {
      titleTh: "3. ระยะเวลาการเช่า",
      titleEn: "3. Lease Term",
      items: [
        item(
          T`สัญญาเช่ามีกำหนด ${or(d.durationMonths)} เดือน`,
          T`This agreement has a term of ${or(d.durationMonths)} months`,
        ),
        item(
          T`เริ่มตั้งแต่วันที่ ${thaiDate(d.startDate)}`,
          T`commencing from ${engDate(d.startDate)}`,
        ),
        item(
          T`สิ้นสุดวันที่ ${thaiDate(d.endDate)}`,
          T`and ending on ${engDate(d.endDate)}`,
        ),
        item(
          "เมื่อครบกำหนด หากประสงค์จะต่อสัญญา ทั้งสองฝ่ายต้องตกลงกัน เป็นลายลักษณ์อักษร ก่อนสัญญาสิ้นสุด",
          "Upon expiration, if either party wishes to renew this agreement, both parties must agree in writing before the agreement expires.",
        ),
      ],
    },
    {
      titleTh: "4. ค่าเช่า/ค่าส่วนกลาง และค่าใช้จ่ายของ นิติบุคคลอาคารชุด",
      titleEn: "4. Rent / Common Fees and Condominium Juristic Person Expenses",
      items: [
        item(
          T`4.1 ผู้เช่าตกลงชำระ ค่าเช่าเดือนละ ${bahtWithWords(d.monthlyRent)}`,
          T`4.1 The Lessee agrees to pay rent of ${bahtEn(d.monthlyRent)} per month`,
        ),
        flush(
          T`ชำระภายในวันที่ ${or(d.paymentDueDay)} ของทุกเดือน โดยโอนเข้าบัญชี`,
          T`to be paid by the ${or(d.paymentDueDay)} of each month via bank transfer to the following account:`,
        ),
        // เว้นวรรคหลัง label ให้ค่า (ชื่อธนาคาร/ชื่อบัญชี/เลขบัญชี) เริ่มที่ตำแหน่งเดียวกัน
        // ทุกบรรทัด (เทียบเท่าจัดคอลัมน์ตาราง) — คำนวณจากการวัดตำแหน่งจริงในไฟล์ที่เรนเดอร์แล้ว
        // (ระยะห่างต่อช่องว่างไม่เท่ากับความกว้างตัวอักษร เพราะฟอนต์เป็นสัดส่วน ไม่ใช่ monospace)
        item(
          T`ธนาคาร:    ${or(d.bankName)}`,
          T`Bank:               ${or(d.bankName)}`,
          { mode: "nested" },
        ),
        item(
          T`ชื่อบัญชี:    ${or(d.bankAccountName)}`,
          T`Account Name:    ${or(d.bankAccountName)}`,
          { mode: "nested" },
        ),
        item(
          T`เลขที่บัญชี: ${or(d.bankAccountNumber)}`,
          T`Account Number: ${or(d.bankAccountNumber)}`,
          { mode: "nested" },
        ),
        flush(
          'การชำระถือว่าสมบูรณ์ เมื่อเงินเข้าบัญชีของ "ผู้ให้เช่า" เรียบร้อยแล้ว',
          'Payment shall be deemed complete upon receipt of funds into the "Lessor"\'s account.',
        ),
        item(
          "4.2 ผู้ให้เช่าตกลงเป็น ผู้รับผิดชอบชำระ ค่าส่วนกลาง และค่าใช้จ่ายอื่นใด ที่นิติบุคคลอาคารชุด เรียกเก็บ ซึ่งเกิดขึ้น หรือมีหน้าที่ต้องชำระ ในระหว่างอายุสัญญา เช่าฉบับนี้ ทั้งนี้ เว้นแต่คู่สัญญาทั้งสองฝ่าย จะได้ตกลงกันไว้เป็นอย่างอื่น เป็นลายลักษณ์อักษร",
          "4.2 The Lessor agrees to be responsible for the common area fees and any other expenses charged by the condominium juristic person that are incurred or due during the term of this lease agreement, unless otherwise agreed in writing by both parties.",
        ),
      ],
    },
    {
      titleTh: "5. เงินประกันและเงินล่วงหน้า",
      titleEn: "5. Security Deposit and Advance Payment",
      items: [
        item(
          T`5.1 ผู้เช่าได้ชำระเงินประกัน แก่ผู้ให้เช่า จำนวน ${bahtWithWords(d.depositAmount)} ในวันทำสัญญา โดยผู้ให้เช่า จะถือเงินประกันไว้ ตลอดอายุสัญญา เพื่อเป็นหลักประกัน การปฏิบัติตามสัญญา รวมถึงความเสียหาย หนี้สิน หรือค่าใช้จ่ายใด ๆ ที่ผู้เช่ามีหน้าที่ รับผิดชอบตามสัญญา ผู้เช่าไม่สามารถนำ เงินประกัน มาหักชำระค่าเช่า หรือหนี้ที่ถึงกำหนดชำระได้ เว้นแต่ผู้ให้เช่าจะอนุญาต เป็นลายลักษณ์อักษร`,
          T`5.1 The Lessee has paid a security deposit to the Lessor in the amount of ${bahtEn(d.depositAmount)} on the date of signing this agreement. The Lessor shall hold the deposit throughout the term of this agreement as security for the Lessee's performance hereunder, including any damages, liabilities, or expenses for which the Lessee is responsible. The Lessee may not use the deposit to offset rent or any other debt due, unless permitted in writing by the Lessor.`,
        ),
        item(
          "5.2 ผู้ให้เช่าจะคืนเงินประกัน ภายใน 15 วัน หลังผู้เช่าคืนห้อง และตรวจสอบแล้วว่า ไม่มีความเสียหาย หรือค่าใช้จ่ายค้างชำระ โดยผู้เช่าอนุญาตให้หัก ค่าเสียหายหรือค่าใช้จ่าย ที่ผู้เช่าต้องรับผิดชอบ ก่อนชำระ เงินประกันคืนได้",
          "5.2 The Lessor shall return the security deposit within 15 days after the Lessee returns the unit and it has been inspected and found free of damage or outstanding charges, provided that the Lessee agrees that any damages or expenses for which the Lessee is responsible may be deducted before the deposit is returned.",
        ),
      ],
    },
    {
      titleTh: "6. หน้าที่และข้อจำกัดของผู้เช่า",
      titleEn: "6. Duties and Restrictions of the Lessee",
      items: [
        item(
          "ผู้เช่าตกลงที่จะปฏิบัติ ตามข้อกำหนดและเงื่อนไข ดังต่อไปนี้โดยเคร่งครัด",
          "The Lessee agrees to strictly comply with the following terms and conditions:",
        ),
        item(
          "6.1 ผู้เช่าตกลงใช้ ทรัพย์สินที่เช่า เพื่อการพักอาศัยของผู้เช่า และบุคคลที่ระบุไว้ในสัญญานี้ เท่านั้น และจะไม่ใช้ทรัพย์สินที่เช่า เพื่อวัตถุประสงค์อื่น โดยไม่ได้รับความยินยอม จากผู้ให้เช่า",
          "6.1 The Lessee agrees to use the leased property solely for the residence of the Lessee and the persons named in this agreement, and shall not use the leased property for any other purpose without the Lessor's consent.",
        ),
        item(
          "6.2 ผู้เช่าตกลงว่าจะไม่ใช้ หรือยินยอมให้บุคคลใดใช้ ทรัพย์สินที่เช่า เพื่อประกอบกิจการ การกระทำ หรือกิจกรรมใด ๆ ที่ขัดต่อกฎหมาย ศีลธรรมอันดี หรือข้อบังคับ ของนิติบุคคลอาคารชุด",
          "6.2 The Lessee agrees not to use, or allow any person to use, the leased property to conduct any business, act, or activity that is contrary to the law, public morals, or the regulations of the condominium juristic person.",
        ),
        item(
          "6.3 ผู้เช่ามีหน้าที่ดูแลรักษา ทรัพย์สินที่เช่า รวมถึงเฟอร์นิเจอร์ เครื่องใช้ไฟฟ้า และทรัพย์สินอื่น ที่ผู้ให้เช่าจัดไว้ภายในห้อง ให้อยู่ในสภาพเรียบร้อย และเหมาะสมแก่การใช้งาน โดยผู้เช่า ต้องรับผิดชอบ ต่อความเสียหาย ที่เกิดจากการใช้งาน โดยประมาทเลินเล่อ หรือผิดวิธีของผู้เช่า หรือบุคคลที่ ผู้เช่าอนุญาต ให้เข้ามาใช้ทรัพย์สินที่เช่า",
          "6.3 The Lessee is responsible for maintaining the leased property, including the furniture, electrical appliances, and other property provided by the Lessor inside the unit, in good and usable condition. The Lessee shall be responsible for any damage caused by negligent or improper use by the Lessee or any person permitted by the Lessee to use the leased property.",
        ),
        item(
          "6.4 ผู้เช่าจะไม่ทำการดัดแปลง ต่อเติม รื้อถอน เจาะ ติดตั้ง หรือเปลี่ยนแปลง ส่วนหนึ่งส่วนใด ของทรัพย์สินที่เช่า รวมถึงอุปกรณ์หรือระบบต่าง ๆ ภายในห้อง เว้นแต่จะได้รับความยินยอม เป็นลายลักษณ์อักษร จากผู้ให้เช่าก่อนดำเนินการ",
          "6.4 The Lessee shall not alter, extend, demolish, drill, install, or modify any part of the leased property, including any equipment or systems inside the unit, without prior written consent from the Lessor.",
        ),
        item(
          "6.5 ผู้เช่าจะไม่ให้เช่าช่วง โอนสิทธิหรือหน้าที่ตามสัญญา หรือยินยอมให้บุคคลอื่น เข้าครอบครองหรือใช้ ทรัพย์สินที่เช่าแทนผู้เช่า ไม่ว่าทั้งหมดหรือบางส่วน",
          "6.5 The Lessee shall not sublease, assign its rights or obligations under this agreement, or allow any other person to occupy or use the leased property in the Lessee's place, whether in whole or in part.",
        ),
      ],
    },
    {
      titleTh: "7. ข้อห้ามในการอยู่อาศัย",
      titleEn: "7. Prohibitions on Residency",
      items: [
        item(
          "ผู้เช่าตกลงที่จะปฏิบัติ ตามข้อกำหนดและเงื่อนไข ดังต่อไปนี้โดยเคร่งครัด",
          "The Lessee agrees to strictly comply with the following terms and conditions:",
        ),
        item(
          "7.1 ผู้เช่าห้ามสูบบุหรี่ ภายในห้องเช่า บริเวณระเบียง หรือบริเวณอื่นใด ที่กฎหมายหรือข้อบังคับ ของนิติบุคคลอาคารชุด กำหนดให้เป็น พื้นที่ห้ามสูบบุหรี่ หากผู้เช่าฝ่าฝืน ผู้เช่าต้องรับผิดชอบ ค่าใช้จ่าย ในการทำความสะอาด กำจัดกลิ่น ค่าซ่อมแซม หรือค่าใช้จ่ายอื่นใด ที่เกิดขึ้นจริง จากการฝ่าฝืนดังกล่าว และหากผู้เช่าฝ่าฝืนซ้ำ ผู้ให้เช่ามีสิทธิ บอกเลิกสัญญา ตามกฎหมายและเงื่อนไข ที่กำหนดไว้ในสัญญาฉบับนี้",
          "7.1 The Lessee shall not smoke inside the leased unit, on the balcony, or in any other area designated as a no-smoking area by law or by the regulations of the condominium juristic person. If the Lessee violates this, the Lessee shall be responsible for cleaning costs, odor removal, repair costs, or any other actual expenses arising from such violation, and if the Lessee repeats the violation, the Lessor has the right to terminate this agreement in accordance with the law and the conditions set out herein.",
        ),
        item(
          "7.2 ผู้เช่าห้ามนำสัตว์เลี้ยง เข้ามาเลี้ยงหรือพักอาศัย ในทรัพย์สินที่เช่า หากการเลี้ยงสัตว์ดังกล่าว ขัดต่อข้อบังคับ ของนิติบุคคลอาคารชุด",
          "7.2 The Lessee shall not bring any pets into or keep them in the leased property if keeping such pets is contrary to the regulations of the condominium juristic person.",
        ),
        item(
          "7.3 ผู้เช่าต้องไม่กระทำการใด ๆ อันก่อให้เกิดความเดือดร้อน รำคาญ เสียงดัง หรือกระทบต่อสิทธิ ในการอยู่อาศัยโดยปกติ ของผู้อยู่อาศัยรายอื่น",
          "7.3 The Lessee shall not engage in any act that causes nuisance, disturbance, excessive noise, or otherwise affects the normal residential rights of other residents.",
        ),
        item(
          "7.4 ผู้เช่าต้องปฏิบัติตามกฎหมาย ระเบียบ ข้อบังคับ และประกาศของ นิติบุคคลอาคารชุด รวมถึงกฎระเบียบอื่น ที่เกี่ยวข้องกับการใช้ ทรัพย์สินที่เช่าโดยเคร่งครัด",
          "7.4 The Lessee must strictly comply with the laws, rules, regulations, and announcements of the condominium juristic person, including any other regulations relating to the use of the leased property.",
        ),
      ],
    },
    {
      titleTh: "8. ค่าสาธารณูปโภค และค่าใช้จ่าย จากการใช้ทรัพย์สินที่เช่า",
      titleEn: "8. Utilities and Expenses from Use of the Leased Property",
      items: [
        item(
          "8.1 ผู้เช่าตกลงเป็นผู้รับผิดชอบ ค่าใช้จ่ายที่เกิดจาก การใช้ทรัพย์สินที่เช่า ตลอดระยะเวลาการเช่า ได้แก่ ค่าไฟฟ้า ค่าน้ำประปา ค่าอินเทอร์เน็ต ค่าเคเบิลทีวี (ถ้ามี) รวมถึงค่าใช้จ่ายอื่นใด ที่เกิดจากการใช้ห้อง หรือการขอใช้บริการเพิ่มเติม ของผู้เช่า ผู้เช่าตกลงชำระ ค่าใช้จ่ายดังกล่าว ตามจำนวนที่เรียกเก็บจริง และ ภายในกำหนดเวลา ที่ผู้ให้บริการ หรือนิติบุคคลอาคารชุดกำหนด",
          "8.1 The Lessee agrees to be responsible for the expenses arising from the use of the leased property throughout the lease term, including electricity, water supply, internet, and cable TV (if any), as well as any other expenses arising from the use of the unit or additional services requested by the Lessee. The Lessee agrees to pay such expenses according to the amount actually charged and within the time period set by the service provider or the condominium juristic person.",
        ),
      ],
    },
    {
      titleTh: "9. การซ่อมแซม และความเสียหาย",
      titleEn: "9. Repairs and Damages",
      items: [
        item(
          "9.1 ความเสียหายหรือการชำรุด ที่เกิดจากการเสื่อมสภาพ ตามอายุการใช้งาน หรือการใช้งานตามปกติ ของทรัพย์สินที่เช่า ผู้ให้เช่าเป็นผู้รับผิดชอบ ค่าใช้จ่ายในการซ่อมแซม",
          "9.1 Damage or deterioration resulting from normal wear and tear or normal use of the leased property shall be the Lessor's responsibility to repair, at the Lessor's expense.",
        ),
        item(
          "9.2 ความเสียหายที่เกิดจาก การใช้งานผิดวิธี การกระทำโดยประมาทเลินเล่อ หรือการละเลยของ ผู้เช่า หรือบุคคลที่ผู้เช่าอนุญาต ให้เข้ามาใช้ทรัพย์สินที่เช่า ผู้เช่าต้องเป็นผู้รับผิดชอบ ค่าใช้จ่ายในการซ่อมแซม และค่าเสียหาย ที่เกิดขึ้นทั้งหมด",
          "9.2 Damage arising from improper use, negligence, or carelessness by the Lessee or any person permitted by the Lessee to use the leased property shall be the Lessee's responsibility, and the Lessee must bear all repair costs and damages incurred.",
        ),
        item(
          "9.3 เมื่อผู้เช่าพบ ความชำรุดเสียหาย หรือเหตุผิดปกติที่สำคัญ ผู้เช่าต้องแจ้งให้ผู้ให้เช่า ทราบโดยทันที เพื่อให้ผู้ให้เช่าสามารถ ดำเนินการตรวจสอบ และซ่อมแซมได้โดยเร็ว",
          "9.3 When the Lessee discovers any significant damage or abnormality, the Lessee must notify the Lessor immediately so that the Lessor can inspect and carry out repairs promptly.",
        ),
      ],
    },
    {
      titleTh: "10. การเข้าตรวจสอบ ทรัพย์สินที่เช่า",
      titleEn: "10. Inspection of the Leased Property",
      items: [
        item(
          "10.1 ผู้ให้เช่ามีสิทธิเข้าตรวจสอบ ทรัพย์สินที่เช่า เพื่อดูแล ตรวจสอบสภาพห้อง หรือดำเนินการ ซ่อมแซมที่จำเป็น โดยผู้ให้เช่าจะแจ้ง ให้ผู้เช่าทราบ ล่วงหน้าไม่น้อยกว่า 24 ชั่วโมง และจะดำเนินการ ในเวลาอันสมควร",
          "10.1 The Lessor has the right to enter and inspect the leased property to maintain and check the condition of the unit or to carry out necessary repairs, provided that the Lessor gives the Lessee at least 24 hours' advance notice and carries out such inspection at a reasonable time.",
        ),
        item(
          "10.2 ทั้งนี้ในกรณีฉุกเฉิน หรือมีเหตุอันควรเชื่อได้ว่า อาจเกิดความเสียหายต่อชีวิต ร่างกาย หรือทรัพย์สิน ผู้ให้เช่าสามารถเข้าตรวจสอบ หรือดำเนินการที่จำเป็นได้ โดยไม่ต้องแจ้งล่วงหน้า",
          "10.2 In an emergency, or where there is reasonable cause to believe that damage to life, body, or property may occur, the Lessor may enter and inspect or take necessary action without prior notice.",
        ),
      ],
    },
    {
      titleTh: "11. การผิดนัดชำระค่าเช่า",
      titleEn: "11. Default in Rent Payment",
      items: [
        item(
          T`11.1 หากผู้เช่าไม่ชำระค่าเช่า ภายในกำหนด และค้างชำระเกิน ${or(d.lateDays)} วัน ผู้เช่าตกลงรับผิดชอบค่าปรับ ดอกเบี้ย หรือค่าใช้จ่ายอื่น ที่เกี่ยวข้อง (ถ้ามี) ตามที่กฎหมายกำหนด และผู้ให้เช่า มีสิทธิเรียกร้อง ให้ผู้เช่าชำระ หนี้ค้างดังกล่าว รวมถึงดำเนินการตามสิทธิ และขั้นตอนที่กฎหมายกำหนด`,
          T`11.1 If the Lessee fails to pay rent by the due date and payment remains overdue for more than ${or(d.lateDays)} days, the Lessee agrees to be responsible for any penalties, interest, or other related expenses (if any) as provided by law, and the Lessor has the right to demand payment of such outstanding debt, including exercising its rights and following the procedures provided by law.`,
        ),
        item(
          "หากการผิดนัดดังกล่าว เข้าข่ายเป็นเหตุ ให้บอกเลิกสัญญา ตามสัญญาฉบับนี้หรือกฎหมาย ผู้ให้เช่ามีสิทธิ บอกเลิกสัญญา และดำเนินการตามกฎหมายต่อไป",
          "If such default constitutes grounds for termination of this agreement under this agreement or under the law, the Lessor has the right to terminate this agreement and proceed in accordance with the law.",
        ),
      ],
    },
    {
      titleTh: "12. การบอกเลิกสัญญา",
      titleEn: "12. Termination of Agreement",
      items: [
        item(
          "12.1 หากผู้เช่าประสงค์ จะบอกเลิกสัญญาเช่า ก่อนครบกำหนด โดยมิได้เกิดจากเหตุ ที่ทรัพย์สินไม่สามารถใช้ เพื่อการอยู่อาศัยได้ตามปกติ เช่น ภัยพิบัติ แผ่นดินไหว หรือเหตุเพลิงไหม้ และมิได้ เกิดจากความผิด ของผู้ให้เช่า ให้ถือเป็นการบอกเลิกสัญญา ก่อนครบกำหนดโดยผู้เช่า และผู้ให้เช่าย่อมมีสิทธิ ริบเงินประกันตามข้อ 5.1 ทั้งหมดทันที",
          "12.1 If the Lessee wishes to terminate this lease agreement before its expiration, and such termination is not due to the leased property being unable to be used for normal residential purposes (such as a natural disaster, earthquake, or fire) and is not due to the Lessor's fault, this shall be deemed early termination by the Lessee, and the Lessor shall have the right to immediately forfeit the entire security deposit under Clause 5.1.",
        ),
        item(
          "12.2 หากผู้เช่าฝ่าฝืน หรือไม่ปฏิบัติตามเงื่อนไข ที่กำหนดไว้ในสัญญาเช่า ผู้ให้เช่ามีสิทธิแจ้งเตือน ผู้เช่าเป็นลายลักษณ์อักษร จำนวน 2 ครั้ง หากภายหลัง การแจ้งเตือนครั้งที่ 2 ผู้เช่ายังคงไม่ปฏิบัติ ตามเงื่อนไข ดังกล่าว ผู้ให้เช่ามีสิทธิ บอกเลิกสัญญา และริบเงินประกันตามข้อ 5.1 ทั้งหมดทันที",
          "12.2 If the Lessee violates or fails to comply with the conditions set out in this lease agreement, the Lessor has the right to issue the Lessee two (2) written warnings. If, after the second warning, the Lessee still fails to comply with such conditions, the Lessor has the right to terminate this agreement and immediately forfeit the entire security deposit under Clause 5.1.",
        ),
        item(
          "12.3 หากผู้ให้เช่าประสงค์ จะบอกเลิกสัญญา ก่อนครบกำหนด ผู้ให้เช่าต้องแจ้ง ให้ผู้เช่าทราบ เป็นลายลักษณ์อักษร ล่วงหน้าไม่น้อยกว่า 30 วัน และต้องคืนเงินประกันตามข้อ 5.1 ให้แก่ผู้เช่า พร้อมชดใช้ค่าเสียหาย ตามที่กฎหมายกำหนด",
          "12.3 If the Lessor wishes to terminate this agreement before its expiration, the Lessor must notify the Lessee in writing at least 30 days in advance, and must return the security deposit under Clause 5.1 to the Lessee, together with compensation for damages as required by law.",
        ),
      ],
    },
    {
      titleTh: "13. การคืนทรัพย์สินที่เช่า",
      titleEn: "13. Return of the Leased Property",
      items: [
        item(
          "เมื่อสัญญาสิ้นสุดลง ไม่ว่าด้วยเหตุใด ผู้เช่าต้องส่งมอบ ทรัพย์สินที่เช่าคืน แก่ผู้ให้เช่า ภายในกำหนดเวลาที่ตกลงกัน โดยมีหน้าที่ดังต่อไปนี้",
          "Upon termination of this agreement for any reason, the Lessee must return the leased property to the Lessor within the agreed time period, with the following obligations:",
        ),
        item(
          "13.1 คืนกุญแจ คีย์การ์ด รีโมต และอุปกรณ์ที่เกี่ยวข้อง กับทรัพย์สินที่เช่า ทั้งหมดให้แก่ผู้ให้เช่า",
          "13.1 Return all keys, key cards, remote controls, and equipment related to the leased property to the Lessor.",
        ),
        item(
          "13.2 ขนย้ายทรัพย์สินส่วนตัว ของผู้เช่า ออกจากทรัพย์สินที่เช่า ให้เรียบร้อย",
          "13.2 Remove all of the Lessee's personal belongings from the leased property.",
        ),
        item(
          "13.3 ส่งมอบทรัพย์สินที่เช่า ในสภาพสะอาด เรียบร้อย และอยู่ในสภาพเดียวกับ วันที่รับมอบทรัพย์สิน เว้นแต่ความเสื่อมสภาพ หรือการชำรุด ที่เกิดจากการใช้งานตามปกติ",
          "13.3 Return the leased property in a clean and orderly condition, and in the same condition as on the date of handover, except for deterioration or damage resulting from normal use.",
        ),
      ],
    },
    {
      titleTh: "14. กฎหมายที่ใช้บังคับ และการระงับข้อพิพาท",
      titleEn: "14. Governing Law and Dispute Resolution",
      items: [
        item(
          "14.1 สัญญาฉบับนี้อยู่ภายใต้บังคับ แห่งกฎหมายของราชอาณาจักรไทย หากเกิดข้อพิพาท หรือข้อขัด แย้ง ใด ๆ อันเกี่ยวเนื่องกับ สัญญาฉบับนี้ คู่สัญญาตกลงที่จะเจรจา และไกล่เกลี่ยเพื่อหา ข้อยุติร่วมกันก่อน หากไม่สามารถตกลงกันได้ ให้คู่สัญญาดำเนินการ ตามสิทธิและกระบวนการ ที่กฎหมายกำหนด",
          "14.1 This agreement is governed by the laws of the Kingdom of Thailand. In the event of any dispute or disagreement relating to this agreement, the parties agree to first negotiate and mediate in good faith to reach a mutual resolution. If the parties are unable to reach an agreement, the parties shall proceed in accordance with their rights and the procedures provided by law.",
        ),
        item(
          "14.2 สัญญาฉบับนี้จัดทำขึ้นเป็น 2 ฉบับ มีข้อความถูกต้อง ตรงกันทุกประการ คู่สัญญาทั้งสองฝ่าย ได้อ่านและเข้าใจข้อความ ในสัญญาโดยละเอียดแล้ว เห็นชอบ และยอมรับเงื่อนไขทั้งหมด จึงได้ลงลายมือชื่อไว้ เป็นหลักฐานต่อหน้ากัน และคู่สัญญาแต่ละฝ่าย เก็บรักษาสัญญาไว้ฝ่ายละ 1 ฉบับ",
          "14.2 This agreement is made in 2 originals, each of identical content. Both parties have read and fully understood the contents of this agreement in detail, and agree to and accept all of the conditions herein. The parties have therefore signed this agreement as evidence in each other's presence, and each party retains one original copy.",
        ),
      ],
    },
  ];
}

function SignLine({ label, role }: { label: string; role: string }) {
  return (
    <View style={styles.signLine}>
      <BiText>{label}</BiText>
      <View style={styles.signDash} />
      <BiText>{role}</BiText>
    </View>
  );
}

function SignBox({
  en,
  th,
  nameEn,
  nameTh,
  showEn,
  showTh,
}: {
  en?: string;
  th: string;
  nameEn?: string;
  nameTh?: string;
  showEn: boolean;
  showTh: boolean;
}) {
  return (
    <View style={styles.signBox}>
      {showEn && en && <SignLine label="Signed" role={`"${en}"`} />}
      {showEn && en && nameEn && (
        <Text style={styles.signName}>{nameEn}</Text>
      )}
      {showTh && <SignLine label="ลงชื่อ" role={th} />}
      {showTh && nameTh && (
        <BiText style={styles.signName}>{nameTh}</BiText>
      )}
      <View style={styles.signDateLine}>
        <BiText>{showTh && !showEn ? "วันที่" : "Date"}</BiText>
        <View style={styles.signDash} />
      </View>
    </View>
  );
}

// โหมดไทย+อังกฤษ: รวมหัวข้อทั้งสองภาษาเป็นบรรทัดเดียว เช่น "1. Parties / คู่สัญญา"
// (ตัดเลขข้อฝั่งไทยออกเพราะขึ้นที่ฝั่งอังกฤษไปแล้ว)
function combinedTitle(b: Block): string {
  return `${b.titleEn} / ${b.titleTh.replace(/^\d+\.\s*/, "")}`;
}

// ตัดเลขข้อย่อยนำหน้า (เช่น "2.1 ") ออกจาก segment แรก คืนค่าพร้อมบอกว่าตัดจริงหรือไม่
// (ใช้แยกจาก glueClauseNumber ซึ่งแค่รวมเลขให้ติดคำแรก ไม่ได้ตัดทิ้ง)
function stripClauseNumber(segs: RichSegment[]): { segs: RichSegment[]; stripped: boolean } {
  const [first, ...rest] = segs;
  if (!first || first.bold) return { segs, stripped: false };
  const text = first.text.replace(/^\d+(?:\.\d+)?\s+/, "");
  if (text === first.text) return { segs, stripped: false };
  return { segs: [{ ...first, text }, ...rest], stripped: true };
}

// เยื้องชดเชยความกว้างของเลขข้อที่ตัดออก (ฝั่งไทยในโหมดไทย+อังกฤษ) ให้ข้อความเริ่มตรงกับ
// ตำแหน่งที่ข้อความอังกฤษเริ่มหลังเลขข้อพอดี แทนที่จะชิดซ้ายกว่าเพราะไม่มีเลขคั่นแล้ว
const NUMBER_COMPENSATE_INDENT = " ".repeat(8);

// เนื้อหาข้อสัญญา 1 ข้อ ของภาษาเดียว (ใช้ทั้งโหมดเดี่ยวและแต่ละหมวดของโหมดไทย+อังกฤษ)
// title: กำหนดหัวข้อเองได้ (โหมดไทย+อังกฤษใช้หัวข้อรวม "1. Parties / คู่สัญญา" ครั้งเดียว
// นำหน้าฝั่งอังกฤษ ส่วนฝั่งไทยไม่แสดงหัวข้อซ้ำ — ส่ง title={null} เพื่อซ่อน)
// stripNumbers: โหมดไทย+อังกฤษฝั่งไทยเท่านั้น — ตัดเลขข้อย่อยซ้ำออก (ขึ้นที่ฝั่งอังกฤษแล้ว)
// แล้วเยื้องเพิ่มชดเชยให้ตรงกับฝั่งอังกฤษ
function ClauseBlockSection({
  block,
  isEnglish,
  title,
  stripNumbers = false,
}: {
  block: Block;
  isEnglish: boolean;
  title?: string | null;
  stripNumbers?: boolean;
}) {
  const heading = title === undefined ? (isEnglish ? block.titleEn : block.titleTh) : title;
  return (
    <View style={styles.clauseBlock} wrap={false}>
      {heading && <BiText style={styles.clauseTitle}>{heading}</BiText>}
      {block.items.map((it, i) => {
        const raw = isEnglish ? it.en : it.th;
        const { segs, stripped } = stripNumbers
          ? stripClauseNumber(raw)
          : { segs: raw, stripped: false };
        const basePrefix =
          it.mode === "flush" ? "" : it.mode === "nested" ? NESTED_INDENT : FIRST_LINE_INDENT;
        const prefix = stripped ? basePrefix + NUMBER_COMPENSATE_INDENT : basePrefix;
        return (
          <View key={i} wrap={false}>
            <RichText
              style={isEnglish ? styles.paraEn : styles.para}
              segments={withPrefix(prefix, glueClauseNumber(segs))}
            />
          </View>
        );
      })}
    </View>
  );
}

// เนื้อหาข้อสัญญา 1 ข้อ แบบสลับทีละข้อย่อย (อังกฤษแล้วตามด้วยไทยทันทีทีละคู่) — ใช้กับข้อ 5
// เป็นต้นไปในโหมดไทย+อังกฤษ เพราะมีข้อย่อยจำนวนมากและสั้น การแยกเป็นหมวดเต็ม (ClauseBlockSection
// ที่โชว์อังกฤษทั้งข้อก่อนแล้วค่อยไทยทั้งข้อ) ทำให้ไล่จับคู่ประโยคที่ตรงกันข้ามภาษายาก จึงให้
// อังกฤษ-ไทยของข้อย่อยเดียวกันอยู่ติดกันแทน (แต่ละคู่ wrap={false} กันบรรทัดอังกฤษกับคำแปล
// ไทยของมันถูกตัดคนละหน้า ส่วนตัวหมวดเองปล่อยให้ขึ้นหน้าใหม่ได้ระหว่างคู่ เพราะข้อยาวเกินไป
// สำหรับหน้าเดียวเมื่อมีทั้งสองภาษา)
// หมายเหตุ: เคยลองครอบหัวข้อรวมไว้กับคู่ข้อย่อยแรก (ทั้งอังกฤษ+ไทย, แล้วลองแค่อังกฤษอย่างเดียว)
// ด้วย wrap={false} เพื่อกันหัวข้อค้างโดดเดี่ยวท้ายหน้า แต่ทั้งสองแบบยังทำให้ react-pdf คำนวณ
// การตัดหน้าผิดจนข้อความซ้อนทับกัน (อ่านไม่ออก) ได้อยู่ดีเมื่ออยู่ใกล้ขอบหน้าพอดี — ลองใช้
// minPresenceAhead ก็ไม่มีผลใด ๆ เลยแม้ตั้งค่าสูงเกินจริง (ทดสอบแล้ว) สรุปคือ react-pdf
// เวอร์ชันนี้ไม่มีกลไกที่เชื่อถือได้สำหรับกันหัวข้อลอยเดี่ยวโดยไม่เสี่ยง bug ซ้อนทับ ซึ่งร้ายแรง
// กว่ามาก จึงปล่อยหัวข้อเป็นอิสระ (wrap ปกติ) ยอมรับหัวข้อลอยเดี่ยวเป็นครั้งคราวแทน
function ClauseBlockInterleaved({ block }: { block: Block }) {
  return (
    <View style={styles.clauseBlock}>
      <BiText style={styles.clauseTitle}>{combinedTitle(block)}</BiText>
      {block.items.map((it, i) => {
        const basePrefix =
          it.mode === "flush" ? "" : it.mode === "nested" ? NESTED_INDENT : FIRST_LINE_INDENT;
        const { segs: thSegs, stripped } = stripClauseNumber(it.th);
        const thPrefix = stripped ? basePrefix + NUMBER_COMPENSATE_INDENT : basePrefix;
        return (
          <View key={i} wrap={false}>
            <RichText
              style={styles.paraEn}
              segments={withPrefix(basePrefix, glueClauseNumber(it.en))}
            />
            <RichText style={styles.para} segments={withPrefix(thPrefix, glueClauseNumber(thSegs))} />
          </View>
        );
      })}
    </View>
  );
}

// ดัชนี block (0-based) ของข้อ 5, 7, 8, 10, 12 — ใช้บังคับขึ้นหน้าใหม่ก่อนข้อเหล่านี้เฉพาะโหมด
// ไทย+อังกฤษ ตามที่ผู้ใช้ระบุตำแหน่งหน้าที่ต้องการไว้ชัดเจน
const FORCE_PAGE_BREAK_INDICES = new Set([4, 6, 7, 9, 11]);
// ข้อ 14 (ข้อสุดท้าย) บังคับขึ้นหน้าใหม่เสมอทุกโหมดภาษา เพื่อให้ตามด้วยบล็อกลายเซ็นในหน้าเดียวกัน
// พอดี แทนที่จะเหลือข้อ 14 ท้ายหน้าก่อนหน้าแล้วดันลายเซ็นไปหน้าใหม่ที่โล่งเกือบเปล่า
const LAST_CLAUSE_INDEX = 13;

function LeaseContractDocument({ data, lang }: { data: ContractData; lang: Lang }) {
  const showTh = lang === "TH" || lang === "BOTH";
  const showEn = lang === "EN" || lang === "BOTH";
  // ช่องลงชื่อ: ใช้ภาษาเดียวเสมอ ไม่ใช่ show ทั้งคู่แบบเนื้อหาสัญญา — BOTH/EN ใช้อังกฤษ, TH ใช้ไทย
  const signShowEn = lang === "EN" || lang === "BOTH";
  const signShowTh = lang === "TH";
  const blocks = leaseBlocks(data);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {showEn && <Text style={styles.title}>Lease Agreement</Text>}
        {showTh && (
          <Text style={[styles.title, showEn ? { marginTop: 4 } : {}]}>
            สัญญาเช่า
          </Text>
        )}
        {showEn && (
          <RichText style={styles.headerLine} segments={T`Made at ${or(data.contractPlace)}`} />
        )}
        {showEn && (
          <RichText
            style={[styles.headerLine, !showTh ? { marginBottom: 14 } : {}]}
            segments={T`Dated ${engDate(data.contractDate)}`}
          />
        )}
        {showTh && (
          <RichText style={styles.headerLine} segments={T`ทำขึ้น ณ ${or(data.contractPlace)}`} />
        )}
        {showTh && (
          <RichText
            style={[styles.headerLine, { marginBottom: 14 }]}
            segments={T`วันที่ ${thaiDate(data.contractDate)}`}
          />
        )}

        {/* โหมดไทย+อังกฤษ ข้อ 1-4: แยกเป็นหมวดต่อข้อ — อังกฤษทั้งข้อก่อน (เหมือนสัญญาอังกฤษ
            ล้วนทุกประการ) แล้วตามด้วยไทยทั้งข้อ (เหมือนสัญญาไทยล้วน) ข้อ 5 เป็นต้นไปมีข้อย่อย
            จำนวนมากและสั้น จึงสลับทีละคู่แทน (ClauseBlockInterleaved) กันไล่จับคู่ประโยคยาก
            บังคับขึ้นหน้าใหม่ก่อนข้อ 5/7/8/10/12 ตามที่ผู้ใช้ระบุ กันเนื้อหาไล่ชนกันจนแน่นเกินไป
            (เฉพาะโหมดไทย+อังกฤษ) ส่วนข้อ 14 บังคับขึ้นหน้าใหม่ทุกโหมด กันหน้าลายเซ็นโล่งเปล่า */}
        {blocks.map((b, idx) => {
          const isBoth = showEn && showTh;
          const forceBreak =
            (isBoth && FORCE_PAGE_BREAK_INDICES.has(idx)) || idx === LAST_CLAUSE_INDEX;
          if (isBoth && idx >= 4) {
            return (
              <View key={b.titleTh} break={forceBreak}>
                <ClauseBlockInterleaved block={b} />
              </View>
            );
          }
          return (
            <View key={b.titleTh} break={forceBreak}>
              {showEn && (
                <ClauseBlockSection
                  block={b}
                  isEnglish
                  title={isBoth ? combinedTitle(b) : undefined}
                />
              )}
              {showTh && (
                <ClauseBlockSection
                  block={b}
                  isEnglish={false}
                  title={isBoth ? null : undefined}
                  stripNumbers={isBoth}
                />
              )}
            </View>
          );
        })}

        {/* ลายเซ็น — เว้นบรรทัดไว้เซ็นมือ ใช้ภาษาเดียว (ไม่ซ้อนไทย+อังกฤษเหมือนเนื้อหาสัญญา):
            โหมด BOTH/EN ใช้อังกฤษ, โหมด TH เท่านั้นถึงใช้ไทย */}
        <View style={styles.signWrap} wrap={false}>
          <View style={styles.signRow}>
            <SignBox
              en="Lessor"
              th="ผู้ให้เช่า"
              nameEn={data.lessorNameEn || data.lessorName}
              nameTh={data.lessorName}
              showEn={signShowEn}
              showTh={signShowTh}
            />
            <SignBox en="Witness" th="พยาน" showEn={signShowEn} showTh={signShowTh} />
          </View>
          <View style={styles.signRow}>
            <SignBox
              en="Lessee"
              th="ผู้เช่า"
              nameEn={data.tenantNameEn || data.tenantName}
              nameTh={data.tenantName}
              showEn={signShowEn}
              showTh={signShowTh}
            />
            <SignBox en="Witness" th="พยาน" showEn={signShowEn} showTh={signShowTh} />
          </View>
        </View>

        <View style={styles.footerWrap} fixed>
          {showEn && (
            <BiText style={styles.footerText}>
              This document was generated by the Havenz Property system — please verify accuracy
              before signing.
            </BiText>
          )}
          {showTh && (
            <BiText style={styles.footerText}>
              เอกสารนี้จัดทำจากระบบ Havenz Property — กรุณาตรวจสอบความถูกต้องก่อนลงนาม
            </BiText>
          )}
        </View>
      </Page>
    </Document>
  );
}

// ==================== สัญญาซื้อขาย / เอกสารทั่วไป (ใช้ฟอนต์ชุดเดียวกัน) ====================

function GenericContractDocument({
  type,
  data,
}: {
  type: ContractType;
  data: ContractData;
}) {
  const sections = contractSections(type);
  const partyALabel = type === "RENT" ? "ผู้ให้เช่า" : "ผู้ขาย";
  const partyBLabel = type === "RENT" ? "ผู้เช่า" : "ผู้ซื้อ";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{CONTRACT_META[type].label}</Text>

        {sections.map((section) => {
          const isNotes = section.fields.some((f) => f.type === "textarea");
          return (
            <View key={section.title} style={styles.section} wrap={false}>
              <BiText style={styles.sectionTitle}>{section.title}</BiText>
              {isNotes
                ? section.fields.map((f) => (
                    <BiText key={f.name} style={styles.para}>
                      {data[f.name] || "-"}
                    </BiText>
                  ))
                : section.fields.map((f) => (
                    <View key={f.name} style={styles.row}>
                      <BiText style={styles.label}>{f.label}</BiText>
                      <BiText style={styles.value}>{data[f.name] || "-"}</BiText>
                    </View>
                  ))}
            </View>
          );
        })}

        <View style={styles.signRow}>
          <SignBox th={partyALabel} nameTh={data.lessorName} showEn={false} showTh />
          <SignBox th={partyBLabel} nameTh={data.lesseeName} showEn={false} showTh />
        </View>

        <View style={styles.footerWrap} fixed>
          <BiText style={styles.footerText}>
            เอกสารนี้จัดทำจากระบบ Havenz Property — กรุณาตรวจสอบความถูกต้องก่อนลงนาม
          </BiText>
        </View>
      </Page>
    </Document>
  );
}

// ==================== สัญญาแต่งตั้งตัวแทนนายหน้า (ภาษาไทยล้วน — เซล/เจ้าของทรัพย์สิน 2 ฝ่าย) ====================

const BROKER_TERM_TABLE = [
  { term: "สัญญา 6 เดือน", rate: "เท่ากับค่าเช่า 0.5 เดือน" },
  { term: "สัญญา 1 ปี", rate: "เท่ากับค่าเช่า 1 เดือน" },
  { term: "สัญญา 2 ปี", rate: "เท่ากับค่าเช่า 1.5 เดือน" },
  { term: "สัญญา 3 ปี", rate: "เท่ากับค่าเช่า 2 เดือน" },
];

// ค่าคอมมิชชั่นเป็น "จำนวนเดือนของค่าเช่า" ตามระยะเวลาสัญญา (เดือน):
// ต่ำกว่า 1 ปี = 0.5 เดือน (คงที่), 12 เดือนแรก = 1 เดือน (คงที่), เดือนที่เกิน 12 ขึ้นไปคิด
// เฉลี่ยต่อเนื่อง (ไม่ใช่ปัดเป็นรายปี) ที่อัตรา 0.5 เดือนค่าเช่า ต่อ 12 เดือน — เช่น สัญญา 17
// เดือน = 1 + (17-12)/24 = 1.2083 เดือน (ตรงกับตัวอย่างที่ผู้ใช้คำนวณมาให้: ค่าเช่า 80,000
// -> ปีแรก 80,000 + (5 เดือนที่เกิน x 80,000x0.5/12) = 80,000 + 16,666.67 = 96,666.67)
function brokerCommissionMonths(durationMonths: number): number {
  if (!durationMonths || durationMonths <= 0) return 0;
  if (durationMonths < 12) return 0.5;
  const extraMonths = durationMonths - 12;
  return 1 + extraMonths / 24;
}

// เว้นวรรคจริงแทรกไว้ทุก ๆ ช่วงสั้น ๆ (ไม่เกิน ~25 ตัวอักษรต่อช่วง ที่จุดแบ่งวลีที่อ่านได้
// ปกติ) กัน react-pdf/textkit auto-insert breathing space ของตัวเอง (ดู insertBreathingSpaces
// ใน pdf-fonts.tsx) ที่มักตกกลางคำแบบไม่เป็นธรรมชาติ (เช่น "ดำ เนินการ", "เงื่อน ไข") หรือแย่กว่า
// คือขึ้นยัติภังค์ (-) กลางคำเมื่อไม่มีจุดตัดที่ดีเลยในช่วงยาวเกินไป (เกิดขึ้นจริงในข้อ 4 เดิม)
const BROKER_CLAUSES = [
  "ค่าตัวแทนจะชำระ เต็มจำนวนทันที ในวันที่ลงนามสัญญาเช่า และมีการรับเงินมัดจำครบถ้วน แล้ว " +
    "ถือว่างานของสมบูรณ์ ในวันนั้นแล้ว และไม่มีการคืนเงิน ไม่ว่ากรณีใด แม้แต่ผู้เช่าผิดสัญญา หรือย้ายออกก่อนกำหนด",
  "กรณีต่ออายุสัญญา: ปีที่ 2 ถึงปีที่ 4 คิดอัตราปีละ 0.5 เท่าของค่าเช่า 1 เดือน เป็นต้นไป",
  "กรณีผู้เช่าผิดเงื่อนไขการจอง และยกเลิกก่อนลงนามสัญญาเช่า โดยเงินมัดจำตกเป็นของ เจ้าของทรัพย์สิน " +
    "เจ้าของทรัพย์สินตกลง แบ่งเงินจำนวน 30% ของเงินดังกล่าวให้ทาง Havenz Property",
  "หากเจ้าของทรัพย์สินยกเลิก การดำเนินการเอง ปฏิเสธการทำสัญญา โดยไม่ใช่ความผิดของลูกค้า " +
    "หรือทำสัญญาเช่า โดยตรง กับทางผู้เช่าที่ Havenz Property เป็นผู้แนะนำให้ " +
    "ทางเจ้าของทรัพย์ยินดีตกลง ชำระค่าตอบแทนตัวแทน นายหน้า ให้เต็มจำนวน ตามอัตราที่ระบุไว้ ในข้อ 1",
];

function BrokerSignBox({ name, role }: { name?: string; role: string }) {
  return (
    <View style={styles.brokerSignBox}>
      <View style={styles.brokerSignLine} />
      <BiText style={styles.brokerSignName}>{`(${name || "-"})`}</BiText>
      <BiText style={styles.brokerSignRole}>{role}</BiText>
    </View>
  );
}

function BrokerContractDocument({ data }: { data: ContractData }) {
  return (
    <Document>
      <Page size="A4" style={[styles.page, styles.brokerPage]}>
        <Text style={[styles.brokerDate, { marginBottom: 6 }]}>
          {`วันที่ ${data.contractDate ? thaiDate(data.contractDate) : "-"}`}
        </Text>

        <Text style={[styles.brokerTitle, { marginBottom: 6 }]}>
          สัญญาแต่งตั้งตัวแทนนายหน้าอสังหาริมทรัพย์
        </Text>

        <BiText style={styles.brokerAddressee}>
          {`เรียน ${data.ownerName || "-"} (เจ้าของทรัพย์สิน)`}
        </BiText>

        <BiText style={[styles.brokerPara, { marginBottom: 8 }]}>
          {"Havenz Property ขอขอบคุณที่ท่านมอบความ ไว้วางใจ แต่งตั้งให้เป็นผู้ดำเนินการ " +
            "ด้านการตลาด ประชาสัมพันธ์ และจัดหาผู้เช่า ให้แก่ทรัพย์สินของท่าน " +
            "ตามรายละเอียดและเงื่อนไข ดังด้านล่างนี้"}
        </BiText>

        <View style={[styles.section, { marginBottom: 8 }]} wrap={false}>
          <View style={styles.row}>
            <BiText style={styles.brokerLabel}>ประเภททรัพย์</BiText>
            <BiText style={styles.brokerValue}>{data.propertyType || "-"}</BiText>
          </View>
          <View style={styles.row}>
            <BiText style={styles.brokerLabel}>โครงการ / เลขที่ห้อง / ชั้น</BiText>
            <BiText style={styles.brokerValue}>
              {`${data.propertyProject || "-"} / ${data.propertyRoom || "-"} / ${data.propertyFloor || "-"}`}
            </BiText>
          </View>
          <View style={styles.row}>
            <BiText style={styles.brokerLabel}>อัตราค่าเช่าต่อเดือน</BiText>
            <BiText style={styles.brokerValue}>
              {data.monthlyRent ? `${bahtNumber(data.monthlyRent)} บาท` : "-"}
            </BiText>
          </View>
          <View style={styles.row}>
            <BiText style={styles.brokerLabel}>ชื่อผู้เช่า</BiText>
            <BiText style={styles.brokerValue}>{data.tenantName || "-"}</BiText>
          </View>
          <View style={styles.row}>
            <BiText style={styles.brokerLabel}>ระยะเวลาเช่า</BiText>
            <BiText style={styles.brokerValue}>
              {data.contractTermMonths ? `${data.contractTermMonths} เดือน` : "-"}
            </BiText>
          </View>
        </View>

        <BiText style={[styles.sectionTitle, { marginBottom: 3, paddingBottom: 1 }]}>
          อัตราค่าตอบแทนนายหน้า (สัญญาฉบับแรก)
        </BiText>
        <View style={[styles.brokerTableWrap, { marginBottom: 8 }]} wrap={false}>
          <View style={styles.brokerTableRow}>
            {BROKER_TERM_TABLE.map((row, i) => (
              <BiText
                key={row.term}
                style={[
                  i < BROKER_TERM_TABLE.length - 1 ? styles.brokerCell : styles.brokerCellLast,
                  styles.brokerHeaderCell,
                  { padding: 4 },
                ]}
              >
                {row.term}
              </BiText>
            ))}
          </View>
          <View style={[styles.brokerTableRow, styles.brokerRowBorderTop]}>
            {BROKER_TERM_TABLE.map((row, i) => (
              <BiText
                key={row.term}
                style={[
                  i < BROKER_TERM_TABLE.length - 1 ? styles.brokerCell : styles.brokerCellLast,
                  { padding: 4 },
                ]}
              >
                {row.rate}
              </BiText>
            ))}
          </View>
        </View>

        {(() => {
          const termMonths = Number(data.contractTermMonths) || 0;
          const rent = Number(String(data.monthlyRent ?? "").replace(/,/g, "")) || 0;
          if (!termMonths || !rent) return null;
          const amount = Math.round(rent * brokerCommissionMonths(termMonths));
          return (
            <BiText style={[styles.brokerPara, { marginBottom: 8, fontWeight: "bold" }]}>
              {`ค่าคอมมิชชั่น ที่เจ้าของทรัพย์สินต้องชำระ (สัญญา ${termMonths} เดือน): ${bahtNumber(String(amount))} บาท`}
            </BiText>
          );
        })()}

        <BiText style={[styles.sectionTitle, { marginBottom: 3, paddingBottom: 1 }]}>
          เงื่อนไข และข้อตกลง
        </BiText>
        {BROKER_CLAUSES.map((text, i) => (
          <BiText key={i} style={styles.brokerPara}>
            {`${i + 1}) ${text}`}
          </BiText>
        ))}
        <BiText style={[styles.brokerPara, { marginTop: 6 }]}>
          {"เจ้าของทรัพย์สินรับทราบ และยินยอมปฏิบัติตามเงื่อนไข ทั้งหมดข้างต้น"}
        </BiText>

        <View style={[styles.signRow, { marginTop: 40 }]}>
          <BrokerSignBox name={data.ownerName} role="เจ้าของทรัพย์สิน" />
          <BrokerSignBox name={data.salesRepName} role="ที่ปรึกษาด้านอสังหาริมทรัพย์" />
        </View>

        <View style={styles.footerWrap} fixed>
          <BiText style={styles.footerText}>
            เอกสารนี้จัดทำจากระบบ Havenz Property — กรุณาตรวจสอบความถูกต้องก่อนลงนาม
          </BiText>
        </View>
      </Page>
    </Document>
  );
}

export async function renderContractPdf(
  type: ContractType,
  data: ContractData,
  lang: Lang = "BOTH",
): Promise<Buffer> {
  if (type === "RENT") {
    return renderToBuffer(<LeaseContractDocument data={data} lang={lang} />);
  }
  if (type === "BROKER") {
    return renderToBuffer(<BrokerContractDocument data={data} />);
  }
  return renderToBuffer(<GenericContractDocument type={type} data={data} />);
}

export { bahtNumber };
