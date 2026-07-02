import { RoomForm } from "@/components/RoomForm";
import { getDistinctProjectNames } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function NewRoomPage() {
  const projects = await getDistinctProjectNames();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">เพิ่มห้องใหม่</h1>
        <p className="mt-1 text-sm text-gray-500">
          กรอกรายละเอียดห้องและอัปโหลดรูปภาพ
        </p>
      </div>
      <RoomForm apiUrl="/api/rooms" method="POST" submitLabel="เพิ่มห้อง" projects={projects} />
    </div>
  );
}
