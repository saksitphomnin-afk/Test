import { Suspense } from "react";
import type { Prisma, RoomStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { RoomCard } from "@/components/RoomCard";
import { SearchFilter } from "@/components/SearchFilter";
import { LinkButton } from "@/components/ui/Button";
import { STATUS_ORDER } from "@/lib/constants";
import { getDistinctProjectNames } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; project?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const status = sp.status as RoomStatus | undefined;
  const project = sp.project?.trim();

  const where: Prisma.RoomWhereInput = {};
  if (status && STATUS_ORDER.includes(status)) {
    where.status = status;
  }
  if (project) {
    where.projectName = project;
  }
  if (q) {
    where.OR = [
      { projectName: { contains: q, mode: "insensitive" } },
      { roomNumber: { contains: q, mode: "insensitive" } },
      { ownerName: { contains: q, mode: "insensitive" } },
      { ownerPhone: { contains: q } },
      { tower: { contains: q, mode: "insensitive" } },
    ];
  }

  const [rooms, projects] = await Promise.all([
    prisma.room.findMany({
      where,
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    getDistinctProjectNames(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            สต็อกห้องคอนโด
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            พบทั้งหมด{" "}
            <span className="font-medium text-gray-700">{rooms.length}</span>{" "}
            ห้อง
          </p>
        </div>
        <LinkButton href="/rooms/new" size="sm">
          + เพิ่มห้อง
        </LinkButton>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <Suspense fallback={<div className="h-11" />}>
          <SearchFilter projects={projects} />
        </Suspense>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">ยังไม่มีห้องที่ตรงกับเงื่อนไข</p>
          <div className="mt-4">
            <LinkButton href="/rooms/new" size="sm">
              + เพิ่มห้องแรก
            </LinkButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
