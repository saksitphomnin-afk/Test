/**
 * คำนวณต้นทุน/ค่าใช้จ่ายในการโอนกรรมสิทธิ์คอนโด (ห้องชุด) ณ กรมที่ดิน
 *
 * ค่าใช้จ่ายหลักในการซื้อ-ขายห้องชุด (อ้างอิงอัตรามาตรฐานกรมที่ดิน):
 *  - ค่าธรรมเนียมการโอน            2.0%  ของ "ราคาประเมิน" (หรือราคาซื้อขาย แล้วแต่ตกลง)
 *  - ภาษีธุรกิจเฉพาะ + ท้องถิ่น    3.3%  ของราคาขาย (เก็บเมื่อถือครอง < 5 ปี และไม่มีชื่อในทะเบียนบ้านครบ 1 ปี)
 *  - อากรแสตมป์                    0.5%  ของราคาขาย (เก็บแทน เมื่อ "ไม่ต้อง" เสียภาษีธุรกิจเฉพาะ)
 *  - ภาษีเงินได้หัก ณ ที่จ่าย            คำนวณแบบขั้นบันไดจากราคาประเมิน ตามจำนวนปีที่ถือครอง
 *
 * หมายเหตุ: เป็นการประมาณการเพื่อใช้อ้างอิงเบื้องต้น อัตราจริงอาจเปลี่ยนตามมาตรการรัฐในแต่ละช่วงเวลา
 */

export const TRANSFER_FEE_RATE = 0.02; // ค่าธรรมเนียมการโอน 2%
export const SBT_RATE = 0.033; // ภาษีธุรกิจเฉพาะ 3.3% (รวมภาษีท้องถิ่น)
export const STAMP_DUTY_RATE = 0.005; // อากรแสตมป์ 0.5%

/** ฝ่ายที่รับผิดชอบค่าใช้จ่ายแต่ละรายการ */
export type Payer = "buyer" | "seller" | "split";

export type TransferCostInput = {
  /** ราคาซื้อขายจริง (บาท) */
  salePrice: number;
  /** ราคาประเมินราชการ (บาท) — ถ้าไม่ระบุจะใช้ราคาซื้อขายแทน */
  appraisedPrice?: number;
  /** จำนวนปีที่ผู้ขายถือครอง (ปี) */
  holdingYears: number;
  /** ผู้ขายมีชื่อในทะเบียนบ้านของห้องนี้เกิน 1 ปีหรือไม่ (มีผลต่อการยกเว้นภาษีธุรกิจเฉพาะ) */
  sellerRegisteredOverOneYear?: boolean;
};

export type CostItem = {
  key: string;
  label: string;
  /** อัตราที่ใช้ (เช่น 0.02) — undefined หากไม่ใช่อัตราคงที่ */
  rate?: number;
  /** ฐานที่ใช้คำนวณ (บาท) */
  base: number;
  amount: number;
  /** ฝ่ายที่มักรับผิดชอบตามธรรมเนียม (ปรับได้ในหน้าเว็บ) */
  defaultPayer: Payer;
  note?: string;
};

export type TransferCostResult = {
  items: CostItem[];
  total: number;
  /** ต้องเสียภาษีธุรกิจเฉพาะหรือไม่ (ถ้าไม่ จะเก็บอากรแสตมป์แทน) */
  subjectToSbt: boolean;
  appraisedPrice: number;
};

/**
 * ภาษีเงินได้บุคคลธรรมดา หัก ณ ที่จ่าย จากการขายอสังหาริมทรัพย์
 *
 * วิธีคำนวณ (กรณีได้มาโดยการซื้อ — มิใช่มรดก/ให้):
 *  1) หักค่าใช้จ่ายเป็นการเหมาตามจำนวนปีที่ถือครอง จากราคาประเมิน
 *  2) เงินได้คงเหลือ หารด้วยจำนวนปีที่ถือครอง = เงินได้ต่อปี
 *  3) คำนวณภาษีต่อปีแบบขั้นบันได (อัตราภาษีเงินได้บุคคลธรรมดา แต่เริ่มเก็บตั้งแต่บาทแรก)
 *  4) คูณกลับด้วยจำนวนปีที่ถือครอง = ภาษีหัก ณ ที่จ่าย
 */
export function calcWithholdingTax(
  appraisedPrice: number,
  holdingYears: number,
): number {
  if (appraisedPrice <= 0) return 0;

  // ปีถือครองเพื่อการคำนวณ: อย่างน้อย 1 ปี และไม่เกิน 8 ปี (เกิน 8 ใช้เพดาน 8)
  const yearsForRate = Math.min(Math.max(Math.ceil(holdingYears), 1), 8);

  // อัตราหักค่าใช้จ่ายเป็นการเหมาตามจำนวนปีที่ถือครอง
  const EXPENSE_RATE: Record<number, number> = {
    1: 0.92,
    2: 0.84,
    3: 0.77,
    4: 0.71,
    5: 0.65,
    6: 0.6,
    7: 0.55,
    8: 0.5,
  };

  const expenseRate = EXPENSE_RATE[yearsForRate];
  const netIncome = appraisedPrice * (1 - expenseRate);
  const incomePerYear = netIncome / yearsForRate;
  const taxPerYear = progressiveTax(incomePerYear);
  return Math.round(taxPerYear * yearsForRate);
}

/**
 * ภาษีเงินได้แบบขั้นบันได — ใช้สำหรับ "เงินได้ต่อปี" ในการคำนวณหัก ณ ที่จ่าย
 * (การขายอสังหาฯ เก็บตั้งแต่บาทแรก ไม่มีขั้นยกเว้น 150,000 บาทแรก)
 */
function progressiveTax(income: number): number {
  const brackets = [
    { upTo: 300_000, rate: 0.05 },
    { upTo: 500_000, rate: 0.1 },
    { upTo: 750_000, rate: 0.15 },
    { upTo: 1_000_000, rate: 0.2 },
    { upTo: 2_000_000, rate: 0.25 },
    { upTo: 5_000_000, rate: 0.3 },
    { upTo: Infinity, rate: 0.35 },
  ];

  let tax = 0;
  let lower = 0;
  for (const b of brackets) {
    if (income <= lower) break;
    const taxable = Math.min(income, b.upTo) - lower;
    tax += taxable * b.rate;
    lower = b.upTo;
  }
  return tax;
}

/** คำนวณต้นทุนการโอนทั้งหมด */
export function calcTransferCost(input: TransferCostInput): TransferCostResult {
  const salePrice = Math.max(input.salePrice || 0, 0);
  const appraisedPrice = Math.max(
    input.appraisedPrice && input.appraisedPrice > 0
      ? input.appraisedPrice
      : salePrice,
    0,
  );
  const holdingYears = Math.max(input.holdingYears || 0, 0);

  // เสียภาษีธุรกิจเฉพาะเมื่อถือครอง < 5 ปี และไม่ได้มีชื่อในทะเบียนบ้านครบ 1 ปี
  const subjectToSbt =
    holdingYears < 5 && !input.sellerRegisteredOverOneYear;

  const items: CostItem[] = [];

  // 1) ค่าธรรมเนียมการโอน — ฐานราคาประเมิน
  items.push({
    key: "transferFee",
    label: "ค่าธรรมเนียมการโอน",
    rate: TRANSFER_FEE_RATE,
    base: appraisedPrice,
    amount: Math.round(appraisedPrice * TRANSFER_FEE_RATE),
    defaultPayer: "split",
    note: "2% ของราคาประเมิน (นิยมออกคนละครึ่ง)",
  });

  // 2) ภาษีธุรกิจเฉพาะ หรือ อากรแสตมป์ (อย่างใดอย่างหนึ่ง) — ฐานราคาขาย
  if (subjectToSbt) {
    items.push({
      key: "sbt",
      label: "ภาษีธุรกิจเฉพาะ (รวมท้องถิ่น)",
      rate: SBT_RATE,
      base: salePrice,
      amount: Math.round(salePrice * SBT_RATE),
      defaultPayer: "seller",
      note: "3.3% เก็บเมื่อถือครอง < 5 ปี",
    });
  } else {
    items.push({
      key: "stampDuty",
      label: "อากรแสตมป์",
      rate: STAMP_DUTY_RATE,
      base: salePrice,
      amount: Math.round(salePrice * STAMP_DUTY_RATE),
      defaultPayer: "seller",
      note: "0.5% (เก็บแทนภาษีธุรกิจเฉพาะ)",
    });
  }

  // 3) ภาษีเงินได้หัก ณ ที่จ่าย — ฐานราคาประเมิน
  items.push({
    key: "withholdingTax",
    label: "ภาษีเงินได้หัก ณ ที่จ่าย",
    base: appraisedPrice,
    amount: calcWithholdingTax(appraisedPrice, holdingYears),
    defaultPayer: "seller",
    note: "คำนวณขั้นบันไดตามจำนวนปีที่ถือครอง",
  });

  const total = items.reduce((sum, it) => sum + it.amount, 0);

  return { items, total, subjectToSbt, appraisedPrice };
}

/**
 * รวมยอดตามฝ่ายที่รับผิดชอบ (split = คนละครึ่ง)
 * @param payerOf คืนค่าฝ่ายที่รับผิดชอบของแต่ละรายการ (ตาม key) — ถ้าไม่ส่งจะใช้ defaultPayer
 */
export function sumByPayer(
  items: CostItem[],
  payerOf?: (item: CostItem) => Payer,
): { buyer: number; seller: number } {
  let buyer = 0;
  let seller = 0;
  for (const it of items) {
    const payer = payerOf ? payerOf(it) : it.defaultPayer;
    if (payer === "buyer") buyer += it.amount;
    else if (payer === "seller") seller += it.amount;
    else {
      buyer += it.amount / 2;
      seller += it.amount / 2;
    }
  }
  return { buyer: Math.round(buyer), seller: Math.round(seller) };
}
