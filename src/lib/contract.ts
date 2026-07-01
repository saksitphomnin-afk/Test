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

const rentTerms: Section = {
  title: "เงื่อนไขการเช่า",
  fields: [
    { name: "rentPrice", label: "ค่าเช่าต่อเดือน (บาท)", type: "number" },
    { name: "deposit", label: "เงินประกัน (บาท)", type: "number" },
    { name: "termMonths", label: "ระยะเวลาเช่า (เดือน)", type: "number" },
    { name: "paymentDay", label: "ชำระค่าเช่าทุกวันที่" },
    { name: "startDate", label: "วันเริ่มสัญญา", type: "date" },
    { name: "endDate", label: "วันสิ้นสุดสัญญา", type: "date" },
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

const meta = (type: ContractType): Section => ({
  title: "รายละเอียดสัญญา",
  fields: [
    { name: "contractDate", label: "วันที่ทำสัญญา", type: "date" },
    { name: "place", label: "สถานที่ทำสัญญา" },
  ],
});

export function contractSections(type: ContractType): Section[] {
  return [
    meta(type),
    partyA(type),
    partyB(type),
    property,
    type === "RENT" ? rentTerms : saleTerms,
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
    roomNumber: string;
    floor?: string | null;
    sizeSqm?: number | null;
    ownerName: string;
    ownerPhone: string;
    salePrice?: number | null;
    rentPrice?: number | null;
  },
): ContractData {
  return {
    contractDate: new Date().toISOString().slice(0, 10),
    lessorName: room.ownerName,
    lessorPhone: room.ownerPhone,
    propertyProject: room.projectName,
    propertyRoom: room.roomNumber,
    propertyFloor: room.floor ?? "",
    propertySize: room.sizeSqm ? String(room.sizeSqm) : "",
    rentPrice: room.rentPrice ? String(room.rentPrice) : "",
    salePrice: room.salePrice ? String(room.salePrice) : "",
  };
}
