"use client";

import { deleteRoom } from "@/actions/rooms";
import { buttonClasses } from "@/components/ui/Button";

export function DeleteRoomButton({ id }: { id: string }) {
  return (
    <form
      action={deleteRoom.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("ยืนยันการลบห้องนี้? การลบไม่สามารถกู้คืนได้")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className={buttonClasses("danger", "sm")}>
        ลบห้อง
      </button>
    </form>
  );
}
