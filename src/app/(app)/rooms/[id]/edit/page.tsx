import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { RoomForm } from "@/components/RoomForm";
import { updateRoom } from "@/actions/rooms";
import { getDistinctProjectNames } from "@/lib/rooms";

export default async function EditRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [room, projects] = await Promise.all([
    prisma.room.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    getDistinctProjectNames(),
  ]);
  if (!room) notFound();

  const action = updateRoom.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">แก้ไขห้อง</h1>
        <p className="mt-1 text-sm text-gray-500">
          {room.projectName} · ห้อง {room.roomNumber}
        </p>
      </div>
      <RoomForm
        action={action}
        room={room}
        images={room.images}
        submitLabel="บันทึกการแก้ไข"
        cancelHref={`/rooms/${id}`}
        projects={projects}
      />
    </div>
  );
}
