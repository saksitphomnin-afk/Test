import { prisma } from "@/lib/db";

/** Distinct condo/project names already used in the database, sorted A→Z. */
export async function getDistinctProjectNames(): Promise<string[]> {
  const rows = await prisma.room.findMany({
    distinct: ["projectName"],
    select: { projectName: true },
    orderBy: { projectName: "asc" },
  });
  return rows.map((r) => r.projectName);
}

/**
 * รวมสถานีรถไฟฟ้า + ระยะทาง ของแต่ละโครงการที่เคยกรอกไว้แล้ว (จากห้องไหนก็ได้ในโครงการนั้น)
 * ใช้จำสถานีให้อัตโนมัติเวลาเพิ่มห้องใหม่ในโครงการเดิม กันเซลแต่ละคนต้องพิมพ์ระยะซ้ำ ๆ
 * ทุกครั้ง — key คือชื่อโครงการเป๊ะ ๆ (ตรงกับที่ ProjectNameField ใช้แนะนำ)
 */
export async function getProjectStationsMap(): Promise<
  Record<string, { station: string; distanceMeters: number }[]>
> {
  const rows = await prisma.roomStation.findMany({
    select: {
      station: true,
      distanceMeters: true,
      room: { select: { projectName: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const map: Record<string, { station: string; distanceMeters: number }[]> = {};
  for (const r of rows) {
    const key = r.room.projectName;
    const list = (map[key] ??= []);
    if (!list.some((s) => s.station === r.station)) {
      list.push({ station: r.station, distanceMeters: r.distanceMeters });
    }
  }
  return map;
}

/** Distinct room types (e.g. "1Bed 1Bath") already used, sorted A→Z, nulls excluded. */
export async function getDistinctRoomTypes(): Promise<string[]> {
  const rows = await prisma.room.findMany({
    where: { roomType: { not: null } },
    distinct: ["roomType"],
    select: { roomType: true },
    orderBy: { roomType: "asc" },
  });
  return rows
    .map((r) => r.roomType)
    .filter((t): t is string => !!t && t.trim().length > 0);
}
