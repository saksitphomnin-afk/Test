import type { ContractData } from "@/lib/contract";

/**
 * เนื้อหาสัญญาเช่าห้องชุด (Condominium Unit Lease Agreement) แบบเต็ม
 * เก็บเป็นค่าคงที่ในโค้ด เพื่อให้ contract-pdf.tsx render ได้สะอาด
 * และรองรับ 3 เวอร์ชันภาษา: TH / EN / BOTH
 *
 * หมายเหตุ: ข้อความภาษาไทยเขียนขึ้นใหม่ให้สื่อความหมายตรงกับต้นฉบับภาษาอังกฤษ
 * (ไม่ได้แปลคำต่อคำจากไฟล์ต้นฉบับที่ font เพี้ยน) และไม่มีการอ้างอิงชื่อบริษัทเดิม
 * ("The Bangkok Residence 88") ทั้งหมดถูกทำให้เป็นกลาง เพื่อใช้เป็นเอกสารของ Place co. เอง
 */

export type Lang = "TH" | "EN" | "BOTH";

export interface LeaseClause {
  id: string;
  numberLabel: string; // "1", "2", ... ใช้ต่อหน้าหัวข้อ
  titleEn: string;
  titleTh: string;
  bodyEn: (d: ContractData) => string[]; // แต่ละสมาชิกใน array = ย่อหน้า/ข้อย่อยหนึ่งรายการ
  bodyTh: (d: ContractData) => string[];
}

function baht(v?: string): string {
  if (!v) return "…………………………";
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return new Intl.NumberFormat("th-TH").format(n);
}

function thaiDate(v?: string): string {
  if (!v) return "…………………………";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const months = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function engDate(v?: string): string {
  if (!v) return "…………………………";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

const or = (v: string | undefined, fallback = "…………………………") =>
  v && v.trim() ? v : fallback;

export const LEASE_CLAUSES: LeaseClause[] = [
  {
    id: "term",
    numberLabel: "1",
    titleEn: "LEASE TERM",
    titleTh: "ระยะเวลาของสัญญา",
    bodyEn: (d) => [
      `The term of this agreement shall be for a period of ${or(
        d.durationMonths,
        "……",
      )} months, commencing on ${engDate(d.startDate)} and ending on ${engDate(
        d.endDate,
      )}.`,
    ],
    bodyTh: (d) => [
      `สัญญาฉบับนี้มีกำหนดระยะเวลาเช่าเป็นเวลา ${or(
        d.durationMonths,
        "……",
      )} เดือน โดยเริ่มต้นตั้งแต่วันที่ ${thaiDate(
        d.startDate,
      )} และสิ้นสุดลงในวันที่ ${thaiDate(d.endDate)}`,
    ],
  },
  {
    id: "rental",
    numberLabel: "2",
    titleEn: "RENTAL AND COMMON FEE",
    titleTh: "ค่าเช่าและส่วนกลาง",
    bodyEn: (d) => [
      `2.1 The Tenant agrees to pay the Lessor rent in the net amount of ${baht(
        d.monthlyRent,
      )} Baht per month (excluding withholding tax), payable no later than the ${or(
        d.paymentDueDay,
        "…",
      )}${ordinalSuffixEn(d.paymentDueDay)} day of every month by transfer into the Lessor's bank account.`,
      `2.2 The Tenant has paid the rent for the first month of this agreement on the date of execution of this agreement. This payment excludes the security deposit.`,
      `2.3 The Lessor shall be responsible for the common fee and any other expenses collected by the condominium juristic person during the term of this agreement, unless otherwise agreed.`,
    ],
    bodyTh: (d) => [
      `2.1 ผู้เช่าตกลงชำระค่าเช่าให้แก่ผู้ให้เช่าเป็นจำนวนเงินสุทธิเดือนละ ${baht(
        d.monthlyRent,
      )} บาท (ไม่รวมภาษีหัก ณ ที่จ่าย) โดยต้องชำระไม่เกินวันที่ ${or(
        d.paymentDueDay,
        "…",
      )} ของทุกเดือน ด้วยวิธีโอนเงินเข้าบัญชีธนาคารของผู้ให้เช่า`,
      `2.2 ผู้เช่าได้ชำระค่าเช่าสำหรับเดือนแรกของสัญญาเรียบร้อยแล้วในวันที่ลงนามในสัญญาฉบับนี้ ทั้งนี้ ค่าเช่าตามข้อนี้ไม่รวมถึงเงินประกันสัญญา`,
      `2.3 ผู้ให้เช่าเป็นผู้รับผิดชอบค่าส่วนกลางหรือค่าใช้จ่ายอื่นใดที่จะเกิดขึ้นในอนาคต ซึ่งเรียกเก็บโดยนิติบุคคลอาคารชุดในระหว่างอายุสัญญาฉบับนี้ เว้นแต่จะตกลงกันเป็นอย่างอื่น`,
    ],
  },
  {
    id: "deposit",
    numberLabel: "3",
    titleEn: "SECURITY DEPOSIT",
    titleTh: "เงินประกันสัญญา",
    bodyEn: (d) => [
      `3.1 Upon execution of this agreement, the Tenant deposits with the Lessor the amount of ${baht(
        d.depositAmount,
      )} Baht as a security deposit ("Security Deposit"). The Lessor shall hold this amount throughout the term of this agreement without interest, as security for any damage to the Leased premises for which the Tenant is responsible, and as security for any future debts owed by the Tenant to the Lessor under this agreement, except that rent may not be deducted from the Security Deposit unless otherwise agreed.`,
      `3.2 The Lessor shall return the Security Deposit to the Tenant, after deducting any damages or other outstanding liabilities for which the Tenant is responsible, within 30 days of the termination or expiration of this agreement under Clause 1. Should the Security Deposit be insufficient to cover such damages, the Tenant shall be liable to pay the Lessor the shortfall within 15 days of receiving notice from the Lessor.`,
      `3.3 Should the Lessor fail to comply with Clause 3.2, the Tenant shall be entitled to claim the portion of the Security Deposit due to be returned, together with default interest at the rate of 15% per annum from the due date under Clause 3.2 until the Lessor completes payment to the Tenant.`,
      `3.4 The Lessor hereby acknowledges receipt of the Security Deposit from the Tenant.`,
    ],
    bodyTh: (d) => [
      `3.1 ในวันที่ทำสัญญาฉบับนี้ ผู้เช่าได้วางเงินประกันไว้แก่ผู้ให้เช่าเป็นจำนวนเงิน ${baht(
        d.depositAmount,
      )} บาท ("เงินประกัน") ซึ่งผู้ให้เช่าจะยึดถือไว้ตลอดอายุสัญญาโดยไม่มีดอกเบี้ย เพื่อเป็นหลักประกันความเสียหายที่อาจเกิดขึ้นแก่ทรัพย์สินที่เช่าอันอยู่ในความรับผิดชอบของผู้เช่า และเพื่อเป็นหลักประกันการชำระหนี้ใด ๆ ในอนาคตที่ผู้เช่าพึงชำระให้แก่ผู้ให้เช่าตามสัญญานี้ ทั้งนี้ ค่าเช่าไม่สามารถนำมาหักกับเงินประกันได้ เว้นแต่จะตกลงกันเป็นอย่างอื่น`,
      `3.2 ผู้ให้เช่าจะคืนเงินประกันให้แก่ผู้เช่า หลังจากหักความเสียหายหรือค่าใช้จ่ายที่ค้างชำระใด ๆ อันเป็นความรับผิดชอบของผู้เช่าแล้ว ภายใน 30 วัน นับถัดจากวันสิ้นสุดสัญญาหรือครบกำหนดระยะเวลาเช่าตามข้อ 1 กรณีที่เงินประกันไม่เพียงพอต่อความเสียหายดังกล่าว ผู้เช่าต้องรับผิดชำระเงินส่วนที่ขาดให้แก่ผู้ให้เช่าให้ครบถ้วนภายใน 15 วัน นับแต่วันที่ได้รับแจ้งจากผู้ให้เช่า`,
      `3.3 กรณีที่ผู้ให้เช่าไม่ปฏิบัติตามกำหนดระยะเวลาตามข้อ 3.2 ผู้เช่ามีสิทธิเรียกร้องเงินประกันในส่วนที่ตนควรได้รับคืนจากผู้ให้เช่า โดยคิดดอกเบี้ยผิดนัดในอัตราร้อยละ 15 ต่อปี นับถัดจากวันที่ครบกำหนดตามข้อ 3.2 จนกว่าผู้ให้เช่าจะชำระเสร็จสิ้นแก่ผู้เช่า`,
      `3.4 ผู้ให้เช่าขอรับรองว่าได้รับเงินประกันจากผู้เช่าไว้เรียบร้อยแล้ว`,
    ],
  },
  {
    id: "tenant-covenants",
    numberLabel: "4",
    titleEn: "TENANT'S COVENANTS",
    titleTh: "ข้อตกลงและข้อปฏิบัติของผู้เช่า",
    bodyEn: () => [
      "The Tenant hereby covenants as follows:",
      "4.1 To punctually pay the rent and other public utility charges at the time and in the manner stipulated in this agreement throughout the lease term. Should the Tenant fail to pay within the stipulated time, the Tenant agrees to pay a fine to the Lessor, and if payment is not completed within 15 days of the due date, the Lessor shall be entitled to terminate this agreement under Clause 6 and forfeit the Security Deposit under Clause 3.1 immediately, without prejudice to the Lessor's right to claim additional damages (if any).",
      "4.2 To observe and comply with the terms and conditions of this agreement, including the rules and regulations prescribed by the condominium juristic person concerning the use of the building and the Leased premises.",
      "4.3 Not to do, nor permit to be done, anything that causes disturbance, nuisance, or infringement of the rights of neighbouring residents while residing at the Leased premises.",
      "4.4 To use the Leased premises for dwelling purposes only, and not to perform or permit any act within or in connection with the Leased premises that violates the law or public morals, or endangers the life or property of others in the vicinity, including possessing no unlawful items.",
      "4.5 To maintain the Leased premises, including floors, walls, ceilings, windows, doors, furniture, appliances and electrical devices and all fixtures, in good and suitable condition throughout the term of this agreement at the Tenant's own expense (minor repairs), except for damage from normal wear and tear or defects existing prior to the Tenant's possession. This does not include repair of structural or public utility systems, which remains the Lessor's responsibility to complete within a reasonable time.",
      "4.6 To be liable for any damage to the Leased premises directly caused by the Tenant, the Tenant's family members, contractors or agents, except for damage from normal wear and tear or defects existing prior to the Tenant's possession.",
      "4.7 To notify the Lessor of any damage or defect at the Leased premises as soon as possible, and no later than 7 days from its occurrence.",
      "4.8 To permit the Lessor or the Lessor's agent to enter the Leased premises for inspection at reasonable times during daylight hours, with at least 7 days' prior notice and the Tenant's consent.",
      "4.9 To permit the Lessor or the Lessor's agent, during the 30 days prior to expiration of this agreement, to show the Leased premises to prospective tenants or purchasers at reasonable times with at least 24 hours' prior notice and the Tenant's consent.",
      "4.10 Not to make any addition, modification or alteration to the Leased premises without the Lessor's prior written consent. If the Tenant does so without consent, the Tenant shall be liable for any resulting damage.",
      "4.11 Any fixture attached to the Leased premises with the Lessor's written consent under Clause 4.10 shall become part of the Leased premises, and ownership shall transfer to the Lessor upon expiration of this agreement.",
      "4.12 Not to use, or permit the use of, the Leased premises or any part thereof for any unlawful or immoral purpose.",
      "4.13 Not to assign any right hereunder, nor sublet the Leased premises or any part thereof, without the Lessor's prior written consent.",
      "4.14 To return all keys, key cards or other items related to the Leased premises to the Lessor upon expiration or termination of this agreement.",
    ],
    bodyTh: () => [
      "ผู้เช่าตกลงว่าจะปฏิบัติตามข้อตกลง ดังนี้",
      "4.1 ชำระค่าเช่าและค่าสาธารณูปโภคอื่น ๆ ให้ครบถ้วนตรงตามกำหนดเวลาที่ระบุไว้ในสัญญาฉบับนี้ตลอดอายุสัญญา หากผู้เช่าไม่ชำระภายในเวลาที่กำหนด ผู้เช่าตกลงยินยอมชำระค่าปรับให้แก่ผู้ให้เช่า และหากไม่ชำระให้เสร็จสิ้นภายใน 15 วัน นับถัดจากวันครบกำหนด ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาตามที่ระบุไว้ในข้อ 6 พร้อมทั้งริบเงินประกันตามข้อ 3.1 ได้ทันที ทั้งนี้ ไม่ตัดสิทธิผู้ให้เช่าที่จะเรียกร้องค่าเสียหายเพิ่มเติม (ถ้ามี)",
      "4.2 ปฏิบัติตามข้อตกลงที่ระบุไว้ในสัญญาฉบับนี้ ตลอดจนกฎระเบียบหรือข้อกำหนดของนิติบุคคลอาคารชุดของโครงการ ซึ่งเกี่ยวข้องกับการใช้อาคารและทรัพย์สินที่เช่า",
      "4.3 ระหว่างที่พักอาศัยอยู่ในทรัพย์สินที่เช่า ผู้เช่าต้องไม่กระทำการอันใดที่ก่อให้เกิดความไม่สงบ ความเดือดร้อนรำคาญ หรือล่วงละเมิดสิทธิใด ๆ แก่ผู้อาศัยในบริเวณใกล้เคียง",
      "4.4 ใช้ทรัพย์สินที่เช่าเพื่อการอยู่อาศัยเท่านั้น และไม่กระทำการหรือยินยอมให้ผู้อื่นกระทำการใดภายในหรือเกี่ยวเนื่องกับทรัพย์สินที่เช่า อันเป็นการขัดต่อกฎหมายหรือศีลธรรมอันดีของประชาชน หรืออาจก่อให้เกิดอันตรายต่อชีวิตหรือทรัพย์สินของผู้อื่นที่อยู่ใกล้เคียง รวมถึงไม่มีไว้ในครอบครองซึ่งสิ่งของที่ผิดกฎหมาย",
      "4.5 ดูแลและบำรุงรักษา (ซ่อมแซมเล็กน้อย) ทรัพย์สินที่เช่าให้อยู่ในสภาพดีและเหมาะสมแก่การอยู่อาศัยตลอดอายุสัญญา โดยค่าใช้จ่ายของผู้เช่าเอง ไม่ว่าจะเป็นพื้น ผนัง เพดาน หน้าต่าง ประตู เฟอร์นิเจอร์ เครื่องใช้ไฟฟ้า และส่วนควบต่าง ๆ ยกเว้นความเสียหายที่เกิดจากการใช้งานตามปกติ หรือความชำรุดบกพร่องที่มีอยู่ก่อนการเข้าครอบครองของผู้เช่า ทั้งนี้ ไม่รวมถึงงานซ่อมแซมโครงสร้างอาคารและระบบสาธารณูปโภค ซึ่งเป็นหน้าที่ของผู้ให้เช่าที่จะดำเนินการแก้ไขให้แล้วเสร็จภายในระยะเวลาอันสมควร",
      "4.6 รับผิดชอบความเสียหายที่เกิดขึ้นกับทรัพย์สินที่เช่าอันเป็นผลโดยตรงจากการกระทำของผู้เช่า บริวาร ผู้รับจ้าง หรือตัวแทนของผู้เช่า เว้นแต่ความเสียหายจากการใช้งานตามปกติ หรือความชำรุดบกพร่องที่มีอยู่ก่อนการเข้าครอบครองของผู้เช่า",
      "4.7 แจ้งความเสียหายหรือความชำรุดบกพร่องที่เกิดขึ้นกับทรัพย์สินที่เช่าให้ผู้ให้เช่าทราบโดยเร็วที่สุด และต้องไม่เกิน 7 วัน นับแต่วันที่พบความเสียหายนั้น",
      "4.8 อนุญาตให้ผู้ให้เช่าหรือตัวแทนเข้าตรวจสภาพทรัพย์สินที่เช่าในเวลากลางวันตามสมควร โดยผู้ให้เช่าต้องแจ้งล่วงหน้าไม่น้อยกว่า 7 วัน และต้องได้รับความยินยอมจากผู้เช่า",
      "4.9 ในช่วง 30 วันก่อนสิ้นสุดสัญญาเช่า อนุญาตให้ผู้ให้เช่าหรือตัวแทนนำผู้จะเช่าหรือผู้จะซื้อรายอื่นเข้าชมทรัพย์สินที่เช่าตามเวลาอันสมควร โดยผู้ให้เช่าต้องแจ้งล่วงหน้าไม่น้อยกว่า 24 ชั่วโมง และต้องได้รับความยินยอมจากผู้เช่า",
      "4.10 ไม่ต่อเติม ดัดแปลง หรือเปลี่ยนแปลงส่วนหนึ่งส่วนใดของทรัพย์สินที่เช่า โดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่าก่อน หากฝ่าฝืน ผู้เช่าต้องรับผิดชอบความเสียหายที่เกิดขึ้นจากการกระทำดังกล่าว",
      "4.11 สิ่งที่ต่อเติมหรือติดตั้งกับทรัพย์สินที่เช่าโดยได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่าตามข้อ 4.10 ให้ถือเป็นส่วนหนึ่งของทรัพย์สินที่เช่า และตกเป็นกรรมสิทธิ์ของผู้ให้เช่าเมื่อสัญญาเช่าสิ้นสุดลง",
      "4.12 ไม่นำทรัพย์สินที่เช่าหรือส่วนหนึ่งส่วนใดไปใช้เพื่อวัตถุประสงค์ที่ผิดกฎหมายหรือขัดต่อศีลธรรมอันดี",
      "4.13 ไม่โอนสิทธิใด ๆ ตามสัญญานี้ หรือนำทรัพย์สินที่เช่าออกให้เช่าช่วงไม่ว่าทั้งหมดหรือบางส่วน โดยไม่ได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ให้เช่าก่อน",
      "4.14 ส่งมอบกุญแจ คีย์การ์ด หรือสิ่งอื่นใดที่เกี่ยวข้องกับทรัพย์สินที่เช่าทั้งหมดคืนแก่ผู้ให้เช่า เมื่อสัญญาเช่าสิ้นสุดหรือเลิกกัน",
    ],
  },
  {
    id: "lessor-covenants",
    numberLabel: "5",
    titleEn: "LESSOR'S COVENANTS",
    titleTh: "ข้อตกลงและข้อปฏิบัติของผู้ให้เช่า",
    bodyEn: () => [
      "The Lessor hereby covenants as follows:",
      "5.1 To deliver the Leased premises, furniture and electrical devices, including all fixtures, in good, usable condition consistent with the purpose of this agreement.",
      "5.2 To be responsible for maintaining the Leased premises in good and usable condition, and to promptly repair any damage not arising from the Tenant's normal use, or any defect existing prior to the Tenant's possession. Where such damage concerns the building structure or public utility systems, the Lessor shall complete the repair within a reasonable time.",
      "5.3 To be responsible for the common fee and any other expenses collected by the condominium juristic person during the term of this agreement, unless otherwise agreed.",
      "5.4 To provide water and electricity for normal use throughout the term of this agreement, unless the Tenant defaults on payment of rent, water, electricity or other utility charges for which the Tenant is responsible, in which case the Lessor may suspend such utilities without liability to the Tenant.",
      "5.5 To deliver all keys, key cards or other items related to the Leased premises to the Tenant upon execution of this agreement.",
    ],
    bodyTh: () => [
      "ผู้ให้เช่าตกลงว่าจะปฏิบัติตามข้อตกลง ดังนี้",
      "5.1 ส่งมอบทรัพย์สินที่เช่า เฟอร์นิเจอร์ และอุปกรณ์ไฟฟ้า รวมทั้งส่วนควบต่าง ๆ ในสภาพดีพร้อมใช้งานตามวัตถุประสงค์ของสัญญานี้",
      "5.2 รับผิดชอบดูแลบำรุงรักษาทรัพย์สินที่เช่าให้อยู่ในสภาพดีและใช้งานได้ตามปกติ และดำเนินการซ่อมแซมความเสียหายที่ไม่ได้เกิดจากการใช้งานตามปกติของผู้เช่า หรือความชำรุดบกพร่องที่มีอยู่ก่อนการเข้าครอบครองของผู้เช่าโดยพลัน หากความเสียหายดังกล่าวเป็นความเสียหายต่อโครงสร้างอาคารหรือระบบสาธารณูปโภค ผู้ให้เช่าจะดำเนินการแก้ไขให้แล้วเสร็จภายในระยะเวลาอันสมควร",
      "5.3 รับผิดชอบค่าส่วนกลางหรือค่าใช้จ่ายอื่นใดที่จะเกิดขึ้นในอนาคต ซึ่งเรียกเก็บโดยนิติบุคคลอาคารชุดในระหว่างอายุสัญญาฉบับนี้ เว้นแต่จะตกลงกันเป็นอย่างอื่น",
      "5.4 จัดให้มีน้ำประปาและไฟฟ้าใช้ได้ตามปกติตลอดอายุสัญญาเช่า เว้นแต่ผู้เช่าผิดนัดชำระค่าเช่า ค่าน้ำประปา ค่าไฟฟ้า หรือค่าสาธารณูปโภคอื่นใดที่อยู่ในความรับผิดชอบของผู้เช่า ผู้ให้เช่ามีสิทธิระงับการให้บริการสาธารณูปโภคดังกล่าวได้โดยไม่ต้องรับผิดต่อผู้เช่า",
      "5.5 ส่งมอบกุญแจ คีย์การ์ด หรือสิ่งอื่นใดที่เกี่ยวข้องกับทรัพย์สินที่เช่าทั้งหมดให้แก่ผู้เช่าในวันที่ทำสัญญานี้",
    ],
  },
  {
    id: "termination",
    numberLabel: "6",
    titleEn: "TERMINATION AND ITS EFFECT",
    titleTh: "การบอกเลิกสัญญาและผลของการบอกเลิกสัญญา",
    bodyEn: () => [
      "6.1 Should either party default or fail to comply with any clause of this agreement, the other party may notify the defaulting party to remedy such default within a reasonable period. If the defaulting party fails to remedy it within such period, the other party may terminate this agreement immediately, without prejudice to its right to claim damages from the defaulting party. Where the Lessor is the defaulting party causing termination, the Lessor shall return the unused advance rent and the Security Deposit under Clause 3.1, after deducting outstanding liabilities and actual damages (if any), to the Tenant within 30 days of termination.",
      "6.2 The Lessor may terminate this agreement, without the Tenant having any right to object, if any of the following occurs: (a) the Tenant defaults on any payment due under this agreement; (b) the Tenant breaches or fails to comply with any term of this agreement; (c) the Tenant is adjudicated bankrupt; or (d) all or part of the Leased premises becomes unfit for residential use for the purpose of this agreement due to fire, legal or zoning restriction imposed by a government authority, or force majeure.",
      "6.3 In the event of 6.2(a) or (b), the Lessor may terminate this agreement only after giving written notice to the Tenant and the Tenant fails to remedy the default within a reasonable period specified in such notice. Notice shall be given in writing, delivered to the Tenant's address stated in this agreement or to the Leased premises by ordinary trade practice (e.g. under the door, posted on the door, or on the notice board).",
      "6.4 Where this agreement is terminated under Clause 6.2(a), (b) or (c), the Lessor shall be entitled to forfeit the Security Deposit under Clause 3.1 together with any rent already paid, and to claim further compensation for actual damage (if any) from the Tenant within 30 days of termination.",
      "6.5 Where this agreement is terminated under Clause 6.2(d), neither party shall have the right to claim damages from the other, and the Lessor shall return the Security Deposit under Clause 3.1, after deducting outstanding liabilities and damages for which the Tenant is responsible, together with any rent paid in advance (if any), to the Tenant within 30 days of termination.",
    ],
    bodyTh: () => [
      "6.1 หากคู่สัญญาฝ่ายหนึ่งฝ่ายใดผิดสัญญาหรือไม่ปฏิบัติตามข้อหนึ่งข้อใดของสัญญาฉบับนี้ คู่สัญญาอีกฝ่ายหนึ่งมีสิทธิแจ้งให้ฝ่ายที่ผิดสัญญาดำเนินการแก้ไขภายในระยะเวลาอันสมควร หากครบกำหนดแล้วยังไม่แก้ไข คู่สัญญาอีกฝ่ายหนึ่งมีสิทธิบอกเลิกสัญญาได้ทันที โดยไม่ตัดสิทธิในการเรียกค่าเสียหายจากฝ่ายที่ผิดสัญญา ทั้งนี้ หากผู้ให้เช่าเป็นฝ่ายผิดสัญญาอันเป็นเหตุให้มีการบอกเลิกสัญญา ผู้ให้เช่าต้องคืนค่าเช่าล่วงหน้าที่คงเหลือและเงินประกันตามข้อ 3.1 ให้แก่ผู้เช่า หลังจากหักค่าใช้จ่ายค้างชำระและค่าเสียหายตามความเป็นจริง (ถ้ามี) ภายใน 30 วัน นับแต่วันที่สัญญาเลิกกัน",
      "6.2 ผู้ให้เช่ามีสิทธิบอกเลิกสัญญาฉบับนี้ได้ โดยผู้เช่าไม่มีสิทธิโต้แย้ง หากเกิดเหตุการณ์ดังต่อไปนี้ (ก) ผู้เช่าไม่ชำระค่าเช่าหรือค่าใช้จ่ายอื่นใดตามที่กำหนดไว้ในสัญญานี้ (ข) ผู้เช่าฝ่าฝืนหรือไม่ปฏิบัติตามข้อตกลงข้อหนึ่งข้อใดที่ระบุไว้ในสัญญานี้ (ค) ผู้เช่าตกเป็นบุคคลล้มละลายตามกฎหมาย หรือ (ง) ทรัพย์สินที่เช่าทั้งหมดหรือบางส่วนไม่สามารถใช้พักอาศัยได้ตามวัตถุประสงค์ของสัญญานี้ อันเนื่องจากอัคคีภัย คำสั่งตามกฎหมาย การจัดสรรเขตของทางราชการ หรือเหตุสุดวิสัยใด ๆ",
      "6.3 กรณีตามข้อ 6.2(ก) หรือ (ข) ผู้ให้เช่าจะบอกเลิกสัญญาได้ต่อเมื่อได้มีหนังสือแจ้งเตือนผู้เช่าแล้ว และผู้เช่าไม่ดำเนินการแก้ไขภายในระยะเวลาอันสมควรที่ระบุไว้ในหนังสือแจ้งเตือนนั้น ทั้งนี้ การบอกเลิกสัญญาและการแจ้งเตือนต้องทำเป็นลายลักษณ์อักษร โดยส่งไปยังที่อยู่ของผู้เช่าตามที่ระบุไว้ในสัญญานี้ หรือส่งไปยังทรัพย์สินที่เช่าโดยตรงตามวิธีการค้าปกติ เช่น สอดไว้ใต้ประตู ติดไว้ที่หน้าประตู หรือปิดประกาศไว้ที่บอร์ดประชาสัมพันธ์",
      "6.4 หากมีการบอกเลิกสัญญาตามข้อ 6.2(ก) (ข) หรือ (ค) ผู้ให้เช่ามีสิทธิริบเงินประกันตามข้อ 3.1 รวมทั้งค่าเช่าที่ได้รับชำระไว้แล้ว และมีสิทธิเรียกร้องค่าเสียหายเพิ่มเติมตามความเป็นจริง (ถ้ามี) จากผู้เช่าได้ภายใน 30 วัน นับแต่วันที่สัญญาเลิกกัน",
      "6.5 หากมีการบอกเลิกสัญญาตามข้อ 6.2(ง) คู่สัญญาทั้งสองฝ่ายไม่มีสิทธิเรียกร้องค่าเสียหายใด ๆ จากอีกฝ่ายหนึ่ง และผู้ให้เช่าต้องคืนเงินประกันตามข้อ 3.1 ให้แก่ผู้เช่า หลังจากหักค่าใช้จ่ายค้างชำระและความเสียหายที่ผู้เช่าต้องรับผิดชอบแล้ว รวมทั้งค่าเช่าหรือเงินใด ๆ ที่ผู้เช่าได้ชำระล่วงหน้าไว้ (ถ้ามี) ภายใน 30 วัน นับแต่วันที่สัญญาเลิกกัน",
    ],
  },
  {
    id: "vacating",
    numberLabel: "7",
    titleEn: "PROVISIONS CONCERNING VACATING THE PREMISES",
    titleTh: "ข้อตกลงเรื่องการส่งมอบคืนทรัพย์สินที่เช่า",
    bodyEn: () => [
      "7.1 Upon expiration or termination of this agreement, the Tenant shall vacate and deliver the Leased premises to the Lessor within 7 days of the termination or expiration date, and shall have no right to claim any relocation expenses from the Lessor. Should this period lapse, the Lessor may remove the Tenant's belongings from the Leased premises and keep them in storage for 15 days, during which the Tenant shall pay a storage fee to the Lessor; the Tenant shall not be entitled to claim damages for such belongings.",
      "7.2 Should the Tenant fail to comply with Clause 7.1, or fail to collect stored belongings within the storage period, the Tenant agrees that: (a) ownership of any belongings remaining at the Leased premises or in storage shall transfer to the Lessor, who may deal with them as the Lessor sees fit; and (b) the Tenant shall pay the Lessor a fine equal to half of the monthly rent, increasing to the full monthly rent if the delay exceeds 15 days from termination, until the Lessor is able to re-let the Leased premises.",
      "7.3 Upon termination or expiration of this agreement, the Tenant shall return the Leased premises to the Lessor in good and clean condition. Should the Lessor incur necessary expenses to restore the Leased premises to its original condition, the Tenant shall reimburse such expenses in full, except for damage from normal wear and tear or defects existing prior to the Tenant's possession.",
    ],
    bodyTh: () => [
      "7.1 เมื่อสัญญาเช่าสิ้นสุดหรือเลิกกัน ผู้เช่าต้องขนย้ายทรัพย์สินและบริวารออกจากทรัพย์สินที่เช่า พร้อมส่งมอบทรัพย์สินที่เช่าคืนแก่ผู้ให้เช่าภายใน 7 วัน นับแต่วันที่สัญญาสิ้นสุดหรือเลิกกัน และผู้เช่าไม่มีสิทธิเรียกร้องค่าขนย้ายใด ๆ จากผู้ให้เช่า หากพ้นกำหนดระยะเวลาดังกล่าว ผู้ให้เช่ามีสิทธิขนย้ายทรัพย์สินของผู้เช่าออกจากทรัพย์สินที่เช่า และเก็บรักษาไว้เป็นเวลา 15 วัน โดยผู้เช่าต้องชำระค่าดูแลรักษาทรัพย์สินดังกล่าวให้แก่ผู้ให้เช่า ทั้งนี้ ผู้เช่าไม่มีสิทธิเรียกร้องค่าเสียหายใด ๆ ต่อทรัพย์สินดังกล่าวจากผู้ให้เช่า",
      "7.2 หากผู้เช่าไม่ปฏิบัติตามข้อ 7.1 หรือพ้นระยะเวลาการเก็บรักษาทรัพย์สินตามข้อ 7.1 แล้ว ผู้เช่าตกลงยินยอมว่า (ก) ทรัพย์สินที่ยังคงเหลืออยู่ในทรัพย์สินที่เช่าหรือที่ผู้ให้เช่าเก็บรักษาไว้นั้น ให้ตกเป็นกรรมสิทธิ์ของผู้ให้เช่า โดยผู้ให้เช่ามีสิทธิดำเนินการใด ๆ กับทรัพย์สินดังกล่าวได้ตามที่เห็นสมควร และ (ข) ผู้เช่าต้องชำระค่าปรับให้แก่ผู้ให้เช่าเป็นจำนวนเท่ากับครึ่งหนึ่งของค่าเช่ารายเดือน และหากเกินกว่า 15 วัน นับแต่วันที่สัญญาเลิกกัน ผู้เช่าต้องชำระค่าปรับเท่ากับค่าเช่ารายเดือนเต็มจำนวน จนกว่าผู้ให้เช่าจะสามารถนำทรัพย์สินที่เช่าออกให้ผู้อื่นเช่าต่อไปได้",
      "7.3 เมื่อสัญญาฉบับนี้สิ้นสุดหรือเลิกกันไม่ว่าด้วยเหตุใด ผู้เช่าต้องส่งมอบทรัพย์สินที่เช่าคืนแก่ผู้ให้เช่าในสภาพดีและสะอาดเรียบร้อย หากผู้ให้เช่าต้องเสียค่าใช้จ่ายที่จำเป็นในการซ่อมแซมหรือปรับปรุงทรัพย์สินที่เช่าให้กลับสู่สภาพเดิม ผู้เช่ายินยอมชดใช้ค่าใช้จ่ายดังกล่าวคืนแก่ผู้ให้เช่าทั้งสิ้น เว้นแต่ความเสียหายอันเกิดจากการใช้งานตามปกติ หรือความชำรุดบกพร่องที่มีอยู่ก่อนการเข้าครอบครองของผู้เช่า",
    ],
  },
  {
    id: "law",
    numberLabel: "8",
    titleEn: "APPLICABLE LAW",
    titleTh: "กฎหมายที่บังคับใช้",
    bodyEn: () => [
      "This agreement shall be governed by the laws of Thailand. In the event of any discrepancy between language versions of this agreement, the Thai version shall prevail.",
    ],
    bodyTh: () => [
      "สัญญาฉบับนี้อยู่ภายใต้บังคับกฎหมายของประเทศไทย ในกรณีที่มีความแตกต่างกันระหว่างสัญญาฉบับภาษาต่าง ๆ ให้ยึดถือฉบับภาษาไทยเป็นที่สุด",
    ],
  },
  {
    id: "transfer",
    numberLabel: "9",
    titleEn: "TRANSFER OF RIGHTS/DUTIES AND CHANGE OF OWNERSHIP",
    titleTh: "การโอนสิทธิและหน้าที่และการเปลี่ยนเจ้าของทรัพย์สินที่เช่า",
    bodyEn: () => [
      "9.1 Unless expressly stated otherwise in this agreement or an addendum hereto, neither party shall transfer its rights, duties and/or liabilities under this agreement to any person without the other party's prior consent.",
      "9.2 The parties agree that, during the lease term, the Lessor may transfer ownership of the Leased premises, in whole or in part, to another person. In the event of such a transfer, the Lessor shall procure that the transferee assumes the rights and obligations specified in this agreement or any addendum hereto.",
    ],
    bodyTh: () => [
      "9.1 เว้นแต่จะกำหนดไว้เป็นอย่างอื่นอย่างชัดแจ้งในสัญญานี้หรือบันทึกข้อตกลงท้ายสัญญานี้ คู่สัญญาแต่ละฝ่ายตกลงจะไม่โอนสิทธิ หน้าที่ และ/หรือความรับผิดตามสัญญาฉบับนี้ให้แก่บุคคลใด โดยมิได้รับความยินยอมจากคู่สัญญาอีกฝ่ายหนึ่งเป็นการล่วงหน้า",
      "9.2 คู่สัญญาตกลงกันว่า ตลอดระยะเวลาการเช่า ผู้ให้เช่าอาจโอนกรรมสิทธิ์ในทรัพย์สินที่เช่าตามสัญญาฉบับนี้ไม่ว่าทั้งหมดหรือบางส่วนให้แก่บุคคลอื่นได้ ในกรณีที่มีการเปลี่ยนแปลงกรรมสิทธิ์ในทรัพย์สินที่เช่า ผู้ให้เช่าตกลงจะดำเนินการให้ผู้รับโอนกรรมสิทธิ์รับไปซึ่งสิทธิและหน้าที่ตามที่กำหนดไว้ในสัญญาฉบับนี้หรือบันทึกข้อตกลงท้ายสัญญาฉบับนี้ทั้งสิ้น",
    ],
  },
  {
    id: "other",
    numberLabel: "10",
    titleEn: "OTHER AGREEMENTS",
    titleTh: "ข้อตกลงอื่นๆ",
    bodyEn: (d) => [
      "10.1 Where interest is to be calculated between the parties, the Lessor and Tenant agree to apply an interest rate of 15% per annum from the date of breach or termination of this agreement.",
      "10.2 The Lessor's acceptance of overdue rent from the Tenant shall not be deemed a waiver of the Lessor's right to take any action against the Tenant for breach of any term of this agreement.",
      "10.3 Should any part of this agreement be invalid or unenforceable, the remaining parts shall continue in full force and effect, separate from the invalid or unenforceable part.",
      "10.4 Should the Tenant wish to renew this agreement, the Tenant shall notify the Lessor in writing no later than 30 days prior to expiration of this agreement, in order to negotiate new terms and conditions.",
      "10.5 Should the Lessor compromise on enforcement of, or not exercise, any right under this agreement, the Lessor may nonetheless rely on the same cause and exercise such right at a later time.",
      d.otherAgreements && d.otherAgreements.trim()
        ? `10.6 Additional agreements: ${d.otherAgreements.trim()}`
        : "10.6 Additional agreements (if any): …………………………………………………………………………………",
    ],
    bodyTh: (d) => [
      "10.1 กรณีต้องคิดดอกเบี้ยระหว่างกัน ผู้ให้เช่าและผู้เช่าตกลงใช้อัตราดอกเบี้ยร้อยละ 15 ต่อปี นับแต่วันที่ผิดสัญญาหรือวันที่เลิกสัญญา",
      "10.2 การที่ผู้ให้เช่ารับชำระค่าเช่าที่ค้างชำระจากผู้เช่า ย่อมไม่ถือเป็นการสละสิทธิใด ๆ ของผู้ให้เช่าในการดำเนินการต่อผู้เช่า หากมีการละเมิดข้อตกลงข้อหนึ่งข้อใดที่ระบุไว้ในสัญญาฉบับนี้",
      "10.3 หากส่วนหนึ่งส่วนใดของสัญญาฉบับนี้เป็นโมฆะหรือไม่สามารถใช้บังคับได้ คู่สัญญาตกลงให้ส่วนอื่นของสัญญาที่ยังมีผลบังคับยังคงใช้บังคับได้ต่อไป แยกต่างหากจากส่วนที่เป็นโมฆะหรือไม่สามารถใช้บังคับนั้น",
      "10.4 กรณีผู้เช่าประสงค์จะต่ออายุสัญญา ผู้เช่าต้องแจ้งเป็นลายลักษณ์อักษรให้ผู้ให้เช่าทราบล่วงหน้าไม่น้อยกว่า 30 วัน ก่อนสัญญาฉบับนี้สิ้นสุดลง เพื่อตกลงระยะเวลาและเงื่อนไขกันใหม่",
      "10.5 กรณีที่ผู้ให้เช่าได้ผ่อนผันการบังคับใช้สิทธิ หรือไม่ได้ใช้สิทธิใด ๆ ตามสัญญานี้ ผู้ให้เช่ายังคงสามารถอ้างเหตุและใช้สิทธิเช่นว่านั้นในภายหลังได้",
      d.otherAgreements && d.otherAgreements.trim()
        ? `10.6 ข้อตกลงเพิ่มเติม: ${d.otherAgreements.trim()}`
        : "10.6 ข้อตกลงเพิ่มเติม (ถ้ามี): …………………………………………………………………………………",
    ],
  },
];

function ordinalSuffixEn(v?: string): string {
  const n = Number(v);
  if (!v || Number.isNaN(n)) return "";
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

export { thaiDate, engDate, baht as bahtNumber };
