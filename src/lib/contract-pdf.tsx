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
  // ไม่ใช้ justify — ภาษาไทยไม่มีช่องว่างระหว่างคำตามธรรมชาติ ทำให้ react-pdf
  // ยืดช่องว่างที่มีอยู่ไม่กี่จุดจนห่างผิดปกติในบรรทัดที่มีคำน้อย
  para: { marginBottom: 4, textAlign: "left" },
  // signatures
  signWrap: { marginTop: 4 },
  signRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  signBox: { width: "47%" },
  signLine: { flexDirection: "row", alignItems: "flex-end", marginBottom: 6 },
  signDash: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#111827",
    marginHorizontal: 4,
    marginBottom: 3,
  },
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
    th: boldRoleTerms(seg(th)),
    en: boldRoleTerms(seg(en)),
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
          T`Lessor, name-surname ${or(d.lessorName)}, national ID / passport No. ${or(d.lessorIdOrPassport)}`,
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
          T`and Lessee, name-surname ${or(d.tenantName)}, national ID / passport No. ${or(d.tenantIdOrPassport)}, address ${or(d.tenantAddress)}, telephone ${or(d.tenantPhone)}, hereinafter referred to as the "Lessee"`,
        ),
        flush(
          "ทั้งสองฝ่ายตกลงทำสัญญาโดยมีรายละเอียดดังต่อไปนี้",
          "Both parties agree to enter into this agreement with the following details:",
        ),
      ],
    },
    {
      titleTh: "2. ทรัพย์สินที่ให้เช่า",
      titleEn: "2. Leased Property",
      items: [
        item(
          T`2.1 ผู้ให้เช่าตกลงให้ผู้เช่าเช่าห้องชุดเลขที่ ${or(d.propertyUnitNo)} ชั้น ${or(d.propertyFloor)} อาคาร ${or(d.propertyBuilding)} โครงการ ${or(d.propertyProject)} ที่ตั้ง ${or(d.propertyAddress)}`,
          T`2.1 The Lessor agrees to lease to the Lessee the condominium unit No. ${or(d.propertyUnitNo)}, Floor ${or(d.propertyFloor)}, Building ${or(d.propertyBuilding)}, ${or(d.propertyProject)} project, located at ${or(d.propertyAddress)}`,
        ),
        item(
          "รวมถึงทรัพย์สิน และอุปกรณ์ภายในห้องตามบัญชีรายการแนบท้าย ซึ่งถือเป็นส่วนหนึ่งของสัญญาฉบับนี้",
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
          "เมื่อครบกำหนด หากประสงค์จะต่อสัญญา ทั้งสองฝ่ายต้องตกลงกันเป็นลายลักษณ์อักษรก่อนสัญญาสิ้นสุด",
          "Upon expiration, if either party wishes to renew this agreement, both parties must agree in writing before the agreement expires.",
        ),
      ],
    },
    {
      titleTh: "4. ค่าเช่า/ค่าส่วนกลาง และค่าใช้จ่ายของนิติบุคคลอาคารชุด",
      titleEn: "4. Rent / Common Fees and Condominium Juristic Person Expenses",
      items: [
        item(
          T`4.1 ผู้เช่าตกลงชำระค่าเช่าเดือนละ ${bahtWithWords(d.monthlyRent)}`,
          T`4.1 The Lessee agrees to pay rent of ${bahtEn(d.monthlyRent)} per month`,
        ),
        flush(
          T`ชำระภายในวันที่ ${or(d.paymentDueDay)} ของทุกเดือน โดยโอนเข้าบัญชี`,
          T`to be paid by the ${or(d.paymentDueDay)} of each month via bank transfer to the following account:`,
        ),
        item(T`ธนาคาร: ${or(d.bankName)}`, T`Bank: ${or(d.bankName)}`, { mode: "nested" }),
        item(
          T`ชื่อบัญชี: ${or(d.bankAccountName)}`,
          T`Account Name: ${or(d.bankAccountName)}`,
          { mode: "nested" },
        ),
        item(
          T`เลขที่บัญชี: ${or(d.bankAccountNumber)}`,
          T`Account Number: ${or(d.bankAccountNumber)}`,
          { mode: "nested" },
        ),
        flush(
          'การชำระถือว่าสมบูรณ์เมื่อเงินเข้าบัญชีของ "ผู้ให้เช่า" เรียบร้อยแล้ว',
          'Payment shall be deemed complete upon receipt of funds into the "Lessor"\'s account.',
        ),
        item(
          "4.2 ผู้ให้เช่าตกลงเป็นผู้รับผิดชอบชำระ ค่าส่วนกลาง และค่าใช้จ่ายอื่นใดที่นิติบุคคลอาคารชุดเรียกเก็บ ซึ่งเกิดขึ้นหรือมีหน้าที่ต้องชำระในระหว่างอายุสัญญาเช่าฉบับนี้ ทั้งนี้ เว้นแต่คู่สัญญาทั้งสองฝ่ายจะได้ตกลงกันไว้เป็นอย่างอื่นเป็นลายลักษณ์อักษร",
          "4.2 The Lessor agrees to be responsible for the common area fees and any other expenses charged by the condominium juristic person that are incurred or due during the term of this lease agreement, unless otherwise agreed in writing by both parties.",
        ),
      ],
    },
    {
      titleTh: "5. เงินประกันและเงินล่วงหน้า",
      titleEn: "5. Security Deposit and Advance Payment",
      items: [
        item(
          T`5.1 ผู้เช่าได้ชำระเงินประกันแก่ผู้ให้เช่า จำนวน ${bahtWithWords(d.depositAmount)} ในวันทำสัญญา โดยผู้ให้เช่าจะถือเงินประกันไว้ตลอดอายุสัญญา เพื่อเป็นหลักประกันการปฏิบัติตามสัญญา รวมถึงความเสียหาย หนี้สิน หรือค่าใช้จ่ายใด ๆ ที่ผู้เช่ามีหน้าที่รับผิดชอบตามสัญญา ผู้เช่าไม่สามารถนำเงินประกันมาหักชำระค่าเช่าหรือหนี้ที่ถึงกำหนดชำระได้ เว้นแต่ผู้ให้เช่าจะอนุญาตเป็นลายลักษณ์อักษร`,
          T`5.1 The Lessee has paid a security deposit to the Lessor in the amount of ${bahtEn(d.depositAmount)} on the date of signing this agreement. The Lessor shall hold the deposit throughout the term of this agreement as security for the Lessee's performance hereunder, including any damages, liabilities, or expenses for which the Lessee is responsible. The Lessee may not use the deposit to offset rent or any other debt due, unless permitted in writing by the Lessor.`,
        ),
        item(
          "5.2 ผู้ให้เช่าจะคืนเงินประกันภายใน 15 วัน หลังผู้เช่าคืนห้อง และตรวจสอบแล้วว่าไม่มีความเสียหายหรือค่าใช้จ่ายค้างชำระ โดยผู้เช่าอนุญาตให้หักค่าเสียหายหรือค่าใช้จ่ายที่ผู้เช่าต้องรับผิดชอบก่อนชำระเงินประกันคืนได้",
          "5.2 The Lessor shall return the security deposit within 15 days after the Lessee returns the unit and it has been inspected and found free of damage or outstanding charges, provided that the Lessee agrees that any damages or expenses for which the Lessee is responsible may be deducted before the deposit is returned.",
        ),
      ],
    },
    {
      titleTh: "6. หน้าที่และข้อจำกัดของผู้เช่า",
      titleEn: "6. Duties and Restrictions of the Lessee",
      items: [
        item(
          "ผู้เช่าตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขดังต่อไปนี้โดยเคร่งครัด",
          "The Lessee agrees to strictly comply with the following terms and conditions:",
        ),
        item(
          "6.1 ผู้เช่าตกลงใช้ทรัพย์สินที่เช่าเพื่อการพักอาศัยของผู้เช่าและบุคคลที่ระบุไว้ในสัญญานี้เท่านั้น และจะไม่ใช้ทรัพย์สินที่เช่าเพื่อวัตถุประสงค์อื่นโดยไม่ได้รับความยินยอมจากผู้ให้เช่า",
          "6.1 The Lessee agrees to use the leased property solely for the residence of the Lessee and the persons named in this agreement, and shall not use the leased property for any other purpose without the Lessor's consent.",
        ),
        item(
          "6.2 ผู้เช่าตกลงว่าจะไม่ใช้ หรือยินยอมให้บุคคลใดใช้ทรัพย์สินที่เช่าเพื่อประกอบกิจการ การกระทำ หรือกิจกรรมใด ๆ ที่ขัดต่อกฎหมาย ศีลธรรมอันดี หรือข้อบังคับของนิติบุคคลอาคารชุด",
          "6.2 The Lessee agrees not to use, or allow any person to use, the leased property to conduct any business, act, or activity that is contrary to the law, public morals, or the regulations of the condominium juristic person.",
        ),
        item(
          "6.3 ผู้เช่ามีหน้าที่ดูแลรักษาทรัพย์สินที่เช่า รวมถึงเฟอร์นิเจอร์ เครื่องใช้ไฟฟ้า และทรัพย์สินอื่นที่ผู้ให้เช่าจัดไว้ภายในห้อง ให้อยู่ในสภาพเรียบร้อย และเหมาะสมแก่การใช้งาน โดยผู้เช่าต้องรับผิดชอบต่อความเสียหายที่เกิดจากการใช้งานโดยประมาทเลินเล่อหรือผิดวิธีของผู้เช่า หรือบุคคลที่ผู้เช่าอนุญาตให้เข้ามาใช้ทรัพย์สินที่เช่า",
          "6.3 The Lessee is responsible for maintaining the leased property, including the furniture, electrical appliances, and other property provided by the Lessor inside the unit, in good and usable condition. The Lessee shall be responsible for any damage caused by negligent or improper use by the Lessee or any person permitted by the Lessee to use the leased property.",
        ),
        item(
          "6.4 ผู้เช่าจะไม่ทำการดัดแปลง ต่อเติม รื้อถอน เจาะ ติดตั้ง หรือเปลี่ยนแปลงส่วนหนึ่งส่วนใดของทรัพย์สินที่เช่า รวมถึงอุปกรณ์หรือระบบต่าง ๆ ภายในห้อง เว้นแต่จะได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่าก่อนดำเนินการ",
          "6.4 The Lessee shall not alter, extend, demolish, drill, install, or modify any part of the leased property, including any equipment or systems inside the unit, without prior written consent from the Lessor.",
        ),
        item(
          "6.5 ผู้เช่าจะไม่ให้เช่าช่วง โอนสิทธิหรือหน้าที่ตามสัญญา หรือยินยอมให้บุคคลอื่นเข้าครอบครองหรือใช้ทรัพย์สินที่เช่าแทนผู้เช่า ไม่ว่าทั้งหมดหรือบางส่วน",
          "6.5 The Lessee shall not sublease, assign its rights or obligations under this agreement, or allow any other person to occupy or use the leased property in the Lessee's place, whether in whole or in part.",
        ),
      ],
    },
    {
      titleTh: "7. ข้อห้ามในการอยู่อาศัย",
      titleEn: "7. Prohibitions on Residency",
      items: [
        item(
          "ผู้เช่าตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขดังต่อไปนี้โดยเคร่งครัด",
          "The Lessee agrees to strictly comply with the following terms and conditions:",
        ),
        item(
          "7.1 ผู้เช่าห้ามสูบบุหรี่ภายในห้องเช่า บริเวณระเบียง หรือบริเวณอื่นใดที่กฎหมายหรือข้อบังคับของนิติบุคคลอาคารชุดกำหนดให้เป็นพื้นที่ห้ามสูบบุหรี่ หากผู้เช่าฝ่าฝืน ผู้เช่าต้องรับผิดชอบค่าใช้จ่ายในการทำความสะอาด กำจัดกลิ่น ค่าซ่อมแซม หรือค่าใช้จ่ายอื่นใดที่เกิดขึ้นจริงจากการฝ่าฝืนดังกล่าว และหากผู้เช่าฝ่าฝืนซ้ำ ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาตามกฎหมายและเงื่อนไขที่กำหนดไว้ในสัญญาฉบับนี้",
          "7.1 The Lessee shall not smoke inside the leased unit, on the balcony, or in any other area designated as a no-smoking area by law or by the regulations of the condominium juristic person. If the Lessee violates this, the Lessee shall be responsible for cleaning costs, odor removal, repair costs, or any other actual expenses arising from such violation, and if the Lessee repeats the violation, the Lessor has the right to terminate this agreement in accordance with the law and the conditions set out herein.",
        ),
        item(
          "7.2 ผู้เช่าห้ามนำสัตว์เลี้ยงเข้ามาเลี้ยงหรือพักอาศัยในทรัพย์สินที่เช่า หากการเลี้ยงสัตว์ดังกล่าวขัดต่อข้อบังคับของนิติบุคคลอาคารชุด",
          "7.2 The Lessee shall not bring any pets into or keep them in the leased property if keeping such pets is contrary to the regulations of the condominium juristic person.",
        ),
        item(
          "7.3 ผู้เช่าต้องไม่กระทำการใด ๆ อันก่อให้เกิดความเดือดร้อน รำคาญ เสียงดัง หรือกระทบต่อสิทธิในการอยู่อาศัยโดยปกติของผู้อยู่อาศัยรายอื่น",
          "7.3 The Lessee shall not engage in any act that causes nuisance, disturbance, excessive noise, or otherwise affects the normal residential rights of other residents.",
        ),
        item(
          "7.4 ผู้เช่าต้องปฏิบัติตามกฎหมาย ระเบียบ ข้อบังคับ และประกาศของนิติบุคคลอาคารชุด รวมถึงกฎระเบียบอื่นที่เกี่ยวข้องกับการใช้ทรัพย์สินที่เช่าโดยเคร่งครัด",
          "7.4 The Lessee must strictly comply with the laws, rules, regulations, and announcements of the condominium juristic person, including any other regulations relating to the use of the leased property.",
        ),
      ],
    },
    {
      titleTh: "8. ค่าสาธารณูปโภคและค่าใช้จ่ายจากการใช้ทรัพย์สินที่เช่า",
      titleEn: "8. Utilities and Expenses from Use of the Leased Property",
      items: [
        item(
          "8.1 ผู้เช่าตกลงเป็นผู้รับผิดชอบค่าใช้จ่ายที่เกิดจากการใช้ทรัพย์สินที่เช่าตลอดระยะเวลาการเช่า ได้แก่ ค่าไฟฟ้า ค่าน้ำประปา ค่าอินเทอร์เน็ต ค่าเคเบิลทีวี (ถ้ามี) รวมถึงค่าใช้จ่ายอื่นใดที่เกิดจากการใช้ห้องหรือการขอใช้บริการเพิ่มเติมของผู้เช่า ผู้เช่าตกลงชำระค่าใช้จ่ายดังกล่าวตามจำนวนที่เรียกเก็บจริง และภายในกำหนดเวลาที่ผู้ให้บริการหรือนิติบุคคลอาคารชุดกำหนด",
          "8.1 The Lessee agrees to be responsible for the expenses arising from the use of the leased property throughout the lease term, including electricity, water supply, internet, and cable TV (if any), as well as any other expenses arising from the use of the unit or additional services requested by the Lessee. The Lessee agrees to pay such expenses according to the amount actually charged and within the time period set by the service provider or the condominium juristic person.",
        ),
      ],
    },
    {
      titleTh: "9. การซ่อมแซม และความเสียหาย",
      titleEn: "9. Repairs and Damages",
      items: [
        item(
          "9.1 ความเสียหายหรือการชำรุดที่เกิดจากการเสื่อมสภาพตามอายุการใช้งานหรือการใช้งานตามปกติของทรัพย์สินที่เช่า ผู้ให้เช่าเป็นผู้รับผิดชอบค่าใช้จ่ายในการซ่อมแซม",
          "9.1 Damage or deterioration resulting from normal wear and tear or normal use of the leased property shall be the Lessor's responsibility to repair, at the Lessor's expense.",
        ),
        item(
          "9.2 ความเสียหายที่เกิดจากการใช้งานผิดวิธี การกระทำโดยประมาทเลินเล่อ หรือการละเลยของผู้เช่าหรือบุคคลที่ผู้เช่าอนุญาตให้เข้ามาใช้ทรัพย์สินที่เช่า ผู้เช่าต้องเป็นผู้รับผิดชอบค่าใช้จ่ายในการซ่อมแซมและค่าเสียหายที่เกิดขึ้นทั้งหมด",
          "9.2 Damage arising from improper use, negligence, or carelessness by the Lessee or any person permitted by the Lessee to use the leased property shall be the Lessee's responsibility, and the Lessee must bear all repair costs and damages incurred.",
        ),
        item(
          "9.3 เมื่อผู้เช่าพบความชำรุดเสียหายหรือเหตุผิดปกติที่สำคัญ ผู้เช่าต้องแจ้งให้ผู้ให้เช่าทราบโดยทันที เพื่อให้ผู้ให้เช่าสามารถดำเนินการตรวจสอบและซ่อมแซมได้โดยเร็ว",
          "9.3 When the Lessee discovers any significant damage or abnormality, the Lessee must notify the Lessor immediately so that the Lessor can inspect and carry out repairs promptly.",
        ),
      ],
    },
    {
      titleTh: "10. การเข้าตรวจสอบทรัพย์สินที่เช่า",
      titleEn: "10. Inspection of the Leased Property",
      items: [
        item(
          "10.1 ผู้ให้เช่ามีสิทธิเข้าตรวจสอบทรัพย์สินที่เช่า เพื่อดูแล ตรวจสอบสภาพห้อง หรือดำเนินการซ่อมแซมที่จำเป็น โดยผู้ให้เช่าจะแจ้งให้ผู้เช่าทราบล่วงหน้าไม่น้อยกว่า 24 ชั่วโมง และจะดำเนินการในเวลาอันสมควร",
          "10.1 The Lessor has the right to enter and inspect the leased property to maintain and check the condition of the unit or to carry out necessary repairs, provided that the Lessor gives the Lessee at least 24 hours' advance notice and carries out such inspection at a reasonable time.",
        ),
        item(
          "10.2 ทั้งนี้ในกรณีฉุกเฉินหรือมีเหตุอันควรเชื่อได้ว่าอาจเกิดความเสียหายต่อชีวิต ร่างกาย หรือทรัพย์สิน ผู้ให้เช่าสามารถเข้าตรวจสอบหรือดำเนินการที่จำเป็นได้โดยไม่ต้องแจ้งล่วงหน้า",
          "10.2 In an emergency, or where there is reasonable cause to believe that damage to life, body, or property may occur, the Lessor may enter and inspect or take necessary action without prior notice.",
        ),
      ],
    },
    {
      titleTh: "11. การผิดนัดชำระค่าเช่า",
      titleEn: "11. Default in Rent Payment",
      items: [
        item(
          T`11.1 หากผู้เช่าไม่ชำระค่าเช่าภายในกำหนด และค้างชำระเกิน ${or(d.lateDays)} วัน ผู้เช่าตกลงรับผิดชอบค่าปรับ ดอกเบี้ย หรือค่าใช้จ่ายอื่นที่เกี่ยวข้อง (ถ้ามี) ตามที่กฎหมายกำหนด และผู้ให้เช่ามีสิทธิเรียกร้องให้ผู้เช่าชำระหนี้ค้างดังกล่าว รวมถึงดำเนินการตามสิทธิและขั้นตอนที่กฎหมายกำหนด`,
          T`11.1 If the Lessee fails to pay rent by the due date and payment remains overdue for more than ${or(d.lateDays)} days, the Lessee agrees to be responsible for any penalties, interest, or other related expenses (if any) as provided by law, and the Lessor has the right to demand payment of such outstanding debt, including exercising its rights and following the procedures provided by law.`,
        ),
        item(
          "หากการผิดนัดดังกล่าวเข้าข่ายเป็นเหตุให้บอกเลิกสัญญาตามสัญญาฉบับนี้หรือกฎหมาย ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาและดำเนินการตามกฎหมายต่อไป",
          "If such default constitutes grounds for termination of this agreement under this agreement or under the law, the Lessor has the right to terminate this agreement and proceed in accordance with the law.",
        ),
      ],
    },
    {
      titleTh: "12. การบอกเลิกสัญญา",
      titleEn: "12. Termination of Agreement",
      items: [
        item(
          "หากฝ่ายใดประสงค์จะเลิกสัญญาก่อนครบกำหนด ต้องแจ้งอีกฝ่ายเป็นลายลักษณ์อักษรล่วงหน้าไม่น้อยกว่า 30 วัน และการคืนเงินประกันหรือการชดใช้ค่าเสียหายให้เป็นไปตามเงื่อนไขของสัญญา และกฎหมาย",
          "If either party wishes to terminate this agreement before its expiration, that party must give the other party at least 30 days' prior written notice, and the return of the security deposit or compensation for damages shall be in accordance with the terms of this agreement and the law.",
        ),
      ],
    },
    {
      titleTh: "13. การคืนทรัพย์สินที่เช่า",
      titleEn: "13. Return of the Leased Property",
      items: [
        item(
          "เมื่อสัญญาสิ้นสุดลงไม่ว่าด้วยเหตุใด ผู้เช่าต้องส่งมอบทรัพย์สินที่เช่าคืนแก่ผู้ให้เช่าภายในกำหนดเวลาที่ตกลงกัน โดยมีหน้าที่ดังต่อไปนี้",
          "Upon termination of this agreement for any reason, the Lessee must return the leased property to the Lessor within the agreed time period, with the following obligations:",
        ),
        item(
          "13.1 คืนกุญแจ คีย์การ์ด รีโมต และอุปกรณ์ที่เกี่ยวข้องกับทรัพย์สินที่เช่าทั้งหมดให้แก่ผู้ให้เช่า",
          "13.1 Return all keys, key cards, remote controls, and equipment related to the leased property to the Lessor.",
        ),
        item(
          "13.2 ขนย้ายทรัพย์สินส่วนตัวของผู้เช่าออกจากทรัพย์สินที่เช่าให้เรียบร้อย",
          "13.2 Remove all of the Lessee's personal belongings from the leased property.",
        ),
        item(
          "13.3 ส่งมอบทรัพย์สินที่เช่าในสภาพสะอาด เรียบร้อย และอยู่ในสภาพเดียวกับวันที่รับมอบทรัพย์สิน เว้นแต่ความเสื่อมสภาพหรือการชำรุดที่เกิดจากการใช้งานตามปกติ",
          "13.3 Return the leased property in a clean and orderly condition, and in the same condition as on the date of handover, except for deterioration or damage resulting from normal use.",
        ),
      ],
    },
    {
      titleTh: "14. กฎหมายที่ใช้บังคับและการระงับข้อพิพาท",
      titleEn: "14. Governing Law and Dispute Resolution",
      items: [
        item(
          "14.1 สัญญาฉบับนี้อยู่ภายใต้บังคับแห่งกฎหมายของราชอาณาจักรไทย หากเกิดข้อพิพาทหรือข้อขัดแย้งใด ๆ อันเกี่ยวเนื่องกับสัญญาฉบับนี้ คู่สัญญาตกลงที่จะเจรจาและไกล่เกลี่ยเพื่อหาข้อยุติร่วมกันก่อน หากไม่สามารถตกลงกันได้ ให้คู่สัญญาดำเนินการตามสิทธิและกระบวนการที่กฎหมายกำหนด",
          "14.1 This agreement is governed by the laws of the Kingdom of Thailand. In the event of any dispute or disagreement relating to this agreement, the parties agree to first negotiate and mediate in good faith to reach a mutual resolution. If the parties are unable to reach an agreement, the parties shall proceed in accordance with their rights and the procedures provided by law.",
        ),
        item(
          "14.2 สัญญาฉบับนี้จัดทำขึ้นเป็น 2 ฉบับ มีข้อความถูกต้องตรงกันทุกประการ คู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญาโดยละเอียดแล้ว เห็นชอบและยอมรับเงื่อนไขทั้งหมด จึงได้ลงลายมือชื่อไว้เป็นหลักฐานต่อหน้ากัน และคู่สัญญาแต่ละฝ่ายเก็บรักษาสัญญาไว้ฝ่ายละ 1 ฉบับ",
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
  showEn,
  showTh,
}: {
  en?: string;
  th: string;
  showEn: boolean;
  showTh: boolean;
}) {
  return (
    <View style={styles.signBox}>
      {showEn && en && <SignLine label="Signed" role={`"${en}"`} />}
      {showTh && <SignLine label="ลงชื่อ" role={th} />}
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
            <RichText style={styles.para} segments={withPrefix(prefix, glueClauseNumber(segs))} />
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
function ClauseBlockInterleaved({ block }: { block: Block }) {
  return (
    <View style={styles.clauseBlock}>
      {block.items.map((it, i) => {
        const basePrefix =
          it.mode === "flush" ? "" : it.mode === "nested" ? NESTED_INDENT : FIRST_LINE_INDENT;
        const { segs: thSegs, stripped } = stripClauseNumber(it.th);
        const thPrefix = stripped ? basePrefix + NUMBER_COMPENSATE_INDENT : basePrefix;
        return (
          // wrap={false} ครอบหัวข้อรวมไว้กับคู่ข้อย่อยแรกด้วย (เฉพาะ i===0) กันหัวข้อค้าง
          // โดดเดี่ยวท้ายหน้าแล้วเนื้อหาทั้งหมดไปขึ้นหน้าใหม่
          <View key={i} wrap={false}>
            {i === 0 && <BiText style={styles.clauseTitle}>{combinedTitle(block)}</BiText>}
            <RichText
              style={styles.para}
              segments={withPrefix(basePrefix, glueClauseNumber(it.en))}
            />
            <RichText style={styles.para} segments={withPrefix(thPrefix, glueClauseNumber(thSegs))} />
          </View>
        );
      })}
    </View>
  );
}

function LeaseContractDocument({ data, lang }: { data: ContractData; lang: Lang }) {
  const showTh = lang === "TH" || lang === "BOTH";
  const showEn = lang === "EN" || lang === "BOTH";
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
            จำนวนมากและสั้น จึงสลับทีละคู่แทน (ClauseBlockInterleaved) กันไล่จับคู่ประโยคยาก */}
        {blocks.map((b, idx) => {
          const isBoth = showEn && showTh;
          if (isBoth && idx >= 4) {
            return (
              <View key={b.titleTh}>
                <ClauseBlockInterleaved block={b} />
              </View>
            );
          }
          return (
            <View key={b.titleTh}>
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

        {/* ลายเซ็น — เว้นบรรทัดไว้เซ็นมือ */}
        <View style={styles.signWrap} wrap={false}>
          <View style={styles.signRow}>
            <SignBox en="Lessor" th="ผู้ให้เช่า" showEn={showEn} showTh={showTh} />
            <SignBox en="Witness" th="พยาน" showEn={showEn} showTh={showTh} />
          </View>
          <View style={styles.signRow}>
            <SignBox en="Lessee" th="ผู้เช่า" showEn={showEn} showTh={showTh} />
            <SignBox en="Witness" th="พยาน" showEn={showEn} showTh={showTh} />
          </View>
        </View>

        <View style={styles.footerWrap} fixed>
          {showEn && (
            <BiText style={styles.footerText}>
              This document was generated by the Place co. system — please verify accuracy
              before signing.
            </BiText>
          )}
          {showTh && (
            <BiText style={styles.footerText}>
              เอกสารนี้จัดทำจากระบบ Place co. — กรุณาตรวจสอบความถูกต้องก่อนลงนาม
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
          <SignBox th={partyALabel} showEn={false} showTh />
          <SignBox th={partyBLabel} showEn={false} showTh />
        </View>

        <View style={styles.footerWrap} fixed>
          <BiText style={styles.footerText}>
            เอกสารนี้จัดทำจากระบบ Place co. — กรุณาตรวจสอบความถูกต้องก่อนลงนาม
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
  return renderToBuffer(<GenericContractDocument type={type} data={data} />);
}

export { bahtNumber };
