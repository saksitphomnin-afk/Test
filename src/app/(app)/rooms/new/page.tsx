import { RoomForm } from "@/components/RoomForm";
import { createRoom } from "@/actions/rooms";

export default function NewRoomPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">เพิ่มห้องใหม่</h1>
        <p className="mt-1 text-sm text-gray-500">
          กรอกรายละเอียดห้องและอัปโหลดรูปภาพ
        </p>
      </div>
      <RoomForm action={createRoom} submitLabel="เพิ่มห้อง" />
    </div>
  );
}
