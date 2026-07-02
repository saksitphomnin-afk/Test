import type { RoomStatus } from "@prisma/client";
import { STATUS_META } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  size = "md",
}: {
  status: RoomStatus;
  size?: "md" | "sm";
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium ring-1 ring-inset",
        size === "sm"
          ? "gap-1 px-2 py-0.5 text-[11px]"
          : "gap-1.5 px-2.5 py-0.5 text-xs",
        meta.badge,
      )}
    >
      <span
        className={cn(
          "rounded-full",
          size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5",
          meta.dot,
        )}
      />
      {meta.label}
    </span>
  );
}
