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
