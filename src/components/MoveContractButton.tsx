"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveContractToRoom } from "@/actions/contracts";
import { buttonClasses } from "@/components/ui/Button";

export function MoveContractButton({
  contractId,
  newRoomId,
  contractHref,
}: {
  contractId: string;
  newRoomId: string;
  contractHref: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (
      !confirm(
        "ย้ายสัญญาจากห้องเดิมมาห้องนี้? ข้อมูลห้อง/ราคาจะถูกอัปเดตตามห้องใหม่ ส่วนข้อมูลอื่นที่กรอกไว้จะคงเดิม",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await moveContractToRoom(contractId, newRoomId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(contractHref);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={buttonClasses("primary", "sm")}
      >
        {isPending ? "กำลังย้าย..." : "ย้ายมาห้องนี้"}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
