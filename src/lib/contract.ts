import type { ContractType } from "@prisma/client";

export type FieldType = "text" | "date" | "number" | "textarea";

export interface Field {
  name: string;
  label: string;
  type?: FieldType;
  full?: boolean; // กินเต็มความกว้าง
}

export interface Section {
  title: string;
  fields: Field[];
}

// ---------- RENT (สัญญาเช่าห้องชุดฉบับเต็ม) ----------

const rentLessor: Section = {
  title: "ผู้ให้เช่า (Lessor)",
  fields: [
    { name: "lessorName", label: "ชื่อ-นามสกุล / Name" },
    {
      name: "lessorNameEn",
      label: "ชื่อ-นามสกุล (ภาษาอังกฤษ) / Name in English (กรณีลูกค้า/เจ้าของต่างชาติ ไม่บังคับ)",
    },
    {
      name: "lessorIdOrPassport",
      label: "เลขบัตรประชาชน/พาสปอร์ต/เลขทะเบียนนิติบุคคล",
    },
    { name: "lessorNationality", label: "สัญชาติ / Nationality" },
    { name: "lessorPhone", label: "เบอร์โทร / Phone" },
    { name: "lessorAddress", label: "ที่อยู่ / Address", type: "textarea", full: true },
  ],
};

const rentTenant: Section = {
  title: "ผู้เช่า (Tenant)",
  fields: [
    { name: "tenantName", label: "ชื่อ-นามสกุล / Name" },
    {
      name: "tenantNameEn",
      label: "ชื่อ-นามสกุล (ภาษาอังกฤษ) / Name in English (กรณีลูกค้า/เจ้าของต่างชาติ ไม่บังคับ)",
    },
    {
      name: "tenantIdOrPassport",
      label: "เลขบัตรประชาชน/พาสปอร์ต/เลขทะเบียนนิติบุคคล",
    },
    { name: "tenantNationality", label: "สัญชาติ / Nationality" },
    { name: "tenantPhone", label: "เบอร์โทร / Phone" },
    { name: "tenantAddress", label: "ที่อยู่ / Address", type: "textarea", full: true },
  ],
};

const rentProperty: Section = {
  title: "ทรัพย์สินที่เช่า (Leased Premises)",
  fields: [
    { name: "propertyProject", label: "ชื่อโครงการ / Project" },
    { name: "propertyBuilding", label: "อาคาร/ตึก / Building" },
    { name: "propertyUnitNo", label: "เลขห้อง / Unit No." },
    { name: "propertyFloor", label: "ชั้น / Floor" },
    { name: "propertySize", label: "ขนาด (ตร.ม.) / Size (sqm)" },
    { name: "propertyAddress", label: "ที่ตั้ง / Address", type: "textarea", full: true },
  ],
};

const rentTermSection: Section = {
  title: "ระยะเวลาของสัญญา (Lease Term)",
  fields: [
    { name: "startDate", label: "วันเริ่มสัญญา / Start date", type: "date" },
    { name: "durationMonths", label: "ระยะเวลา (เดือน) / Duration (months)", type: "number" },
    {
      name: "endDate",
      label: "วันสิ้นสุดสัญญา / End date (คำนวณอัตโนมัติ แก้ไขเองได้)",
      type: "date",
    },
  ],
};

const rentPaymentSection: Section = {
  title: "ค่าเช่าและเงินประกัน (Rent & Deposit)",
  fields: [
    { name: "monthlyRent", label: "ค่าเช่าต่อเดือน (บาท) / Monthly rent (Baht)", type: "number" },
    {
      name: "paymentDueDay",
      label: "ชำระค่าเช่าทุกวันที่ / Payment due day",
      type: "number",
    },
    {
      name: "depositAmount",
      label: "เงินประกันสัญญา (บาท) / Security deposit (Baht) (เสนอ 2 เท่าค่าเช่าอัตโนมัติ แก้ไขเองได้)",
      type: "number",
    },
    { name: "bankName", label: "ชื่อธนาคาร / Bank" },
    { name: "bankBranch", label: "สาขา / Branch" },
    { name: "bankAccountNumber", label: "เลขบัญชี / Account Number" },
    { name: "bankAccountName", label: "ชื่อบัญชี / Account Name" },
    {
      name: "lateDays",
      label: "ผิดนัดชำระเกินกี่วันถือว่าผิดสัญญา (วัน)",
      type: "number",
    },
  ],
};

const rentMeta: Section = {
  title: "รายละเอียดสัญญา (Agreement Details)",
  fields: [
    { name: "contractPlace", label: "ทำสัญญาที่ / Place of execution" },
    { name: "contractDate", label: "วันที่ทำสัญญา / Date", type: "date" },
  ],
};

const rentOther: Section = {
  title: "ข้อตกลงอื่นๆ (ข้อ 10.6) / Other agreements (Clause 10.6)",
  fields: [
    {
      name: "otherAgreements",
      label: "ข้อตกลงเพิ่มเติม / Additional terms",
      type: "textarea",
      full: true,
    },
  ],
};

// ---------- BROKER (สัญญาแต่งตั้งตัวแทนนายหน้า — ภาษาไทยล้วน มีแค่เซล/เจ้าของ 2 ฝ่าย) ----------

const brokerMeta: Section = {
  title: "รายละเอียดสัญญา",
  fields: [
    { name: "contractDate", label: "วันที่", type: "date" },
    { name: "ownerName", label: "เรียน (ชื่อ-นามสกุลเจ้าของทรัพย์สิน)" },
    { name: "salesRepName", label: "ชื่อเซล/ผู้ดูแล (Havenz Property)" },
  ],
};

const brokerProperty: Section = {
  title: "รายละเอียดทรัพย์สิน",
  fields: [
    { name: "propertyType", label: "ประเภททรัพย์" },
    { name: "propertyProject", label: "โครงการ" },
    { name: "propertyRoom", label: "เลขที่ห้อง" },
    { name: "propertyFloor", label: "ชั้น" },
    { name: "monthlyRent", label: "อัตราค่าเช่าต่อเดือน (บาท)", type: "number" },
    { name: "tenantName", label: "ชื่อผู้เช่า (ถ้ามี)" },
  ],
};

// ---------- SALE (คงรูปแบบเดิม ไม่เปลี่ยนแปลง) ----------

const partyA = (type: ContractType): Section => ({
  title: type === "RENT" ? "ผู้ให้เช่า" : "ผู้ขาย",
  fields: [
    { name: "lessorName", label: "ชื่อ-นามสกุล" },
    { name: "lessorIdCard", label: "เลขบัตรประชาชน" },
    { name: "lessorPhone", label: "เบอร์โทร" },
    { name: "lessorAddress", label: "ที่อยู่", full: true },
  ],
});

const partyB = (type: ContractType): Section => ({
  title: type === "RENT" ? "ผู้เช่า" : "ผู้ซื้อ",
  fields: [
    { name: "lesseeName", label: "ชื่อ-นามสกุล" },
    { name: "lesseeIdCard", label: "เลขบัตรประชาชน" },
    { name: "lesseePhone", label: "เบอร์โทร" },
    { name: "lesseeAddress", label: "ที่อยู่", full: true },
  ],
});

const property: Section = {
  title: "ทรัพย์สิน",
  fields: [
    { name: "propertyProject", label: "ชื่อโครงการ" },
    { name: "propertyRoom", label: "เลขห้อง" },
    { name: "propertyFloor", label: "ชั้น" },
    { name: "propertySize", label: "ขนาด (ตร.ม.)" },
    { name: "propertyAddress", label: "ที่ตั้ง/ที่อยู่", full: true },
  ],
};

const saleTerms: Section = {
  title: "เงื่อนไขการซื้อขาย",
  fields: [
    { name: "salePrice", label: "ราคาซื้อขาย (บาท)", type: "number" },
    { name: "depositAmount", label: "เงินมัดจำ (บาท)", type: "number" },
    { name: "remainingAmount", label: "ยอดคงเหลือ (บาท)", type: "number" },
    { name: "transferDate", label: "วันโอนกรรมสิทธิ์", type: "date" },
  ],
};

const saleMeta: Section = {
  title: "รายละเอียดสัญญา",
  fields: [
    { name: "contractDate", label: "วันที่ทำสัญญา", type: "date" },
    { name: "place", label: "สถานที่ทำสัญญา" },
  ],
};

export function contractSections(type: ContractType): Section[] {
  if (type === "RENT") {
    return [
      rentMeta,
      rentLessor,
      rentTenant,
      rentProperty,
      rentTermSection,
      rentPaymentSection,
      rentOther,
    ];
  }
  if (type === "BROKER") {
    return [brokerMeta, brokerProperty];
  }
  return [
    saleMeta,
    partyA(type),
    partyB(type),
    property,
    saleTerms,
    {
      title: "หมายเหตุ / เงื่อนไขเพิ่มเติม",
      fields: [{ name: "notes", label: "หมายเหตุ", type: "textarea", full: true }],
    },
  ];
}

export type ContractData = Record<string, string>;

/** ค่าเริ่มต้นจากข้อมูลห้อง เพื่อ pre-fill ฟอร์มสัญญา */
export function prefillFromRoom(
  type: ContractType,
  room: {
    projectName: string;
    tower?: string | null;
    roomNumber: string;
    floor?: string | null;
    sizeSqm?: number | null;
    ownerName: string;
    ownerPhone: string;
    salePrice?: number | null;
    rentPrice?: number | null;
    roomType?: string | null;
  },
): ContractData {
  const today = new Date().toISOString().slice(0, 10);

  if (type === "BROKER") {
    return {
      contractDate: today,
      ownerName: room.ownerName,
      propertyType: room.roomType ?? "",
      propertyProject: room.projectName,
      propertyRoom: room.roomNumber,
      propertyFloor: room.floor ?? "",
      monthlyRent: room.rentPrice ? String(room.rentPrice) : "",
    };
  }

  if (type === "RENT") {
    return {
      contractDate: today,
      lessorName: room.ownerName,
      lessorPhone: room.ownerPhone,
      propertyProject: room.projectName,
      propertyBuilding: room.tower ?? "",
      propertyUnitNo: room.roomNumber,
      propertyFloor: room.floor ?? "",
      propertySize: room.sizeSqm ? String(room.sizeSqm) : "",
      monthlyRent: room.rentPrice ? String(room.rentPrice) : "",
    };
  }

  return {
    contractDate: today,
    lessorName: room.ownerName,
    lessorPhone: room.ownerPhone,
    propertyProject: room.projectName,
    propertyRoom: room.roomNumber,
    propertyFloor: room.floor ?? "",
    propertySize: room.sizeSqm ? String(room.sizeSqm) : "",
    salePrice: room.salePrice ? String(room.salePrice) : "",
  };
}
