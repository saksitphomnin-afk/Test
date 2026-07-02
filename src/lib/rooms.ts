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
