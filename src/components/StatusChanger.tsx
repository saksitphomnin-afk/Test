"use client";

import { useTransition } from "react";
import type { RoomStatus } from "@prisma/client";
import { updateStatus } from "@/actions/rooms";
import { STATUS_ORDER, STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusChanger({
  roomId,
  status,
}: {
  roomId: string;
  status: RoomStatus;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {STATUS_ORDER.map((s) => {
        const meta = STATUS_META[s];
        const active = s === status;
        return (
          <button
            key={s}
            type="button"
            disabled={isPending || active}
            onClick={() =>
              startTransition(() => {
                void updateStatus(roomId, s);
              })
            }
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset transition disabled:cursor-default",
              active
                ? meta.badge
                : "bg-white text-gray-500 ring-gray-300 hover:bg-gray-50",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
