import type { RoomStatus } from "@prisma/client";
import { STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: RoomStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        meta.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
