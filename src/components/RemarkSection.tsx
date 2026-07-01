"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addRemark } from "@/actions/rooms";
import { Textarea } from "@/components/ui/Field";
import { buttonClasses } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/constants";

type Log = {
  id: string;
  text: string;
  createdAt: Date;
  user: { name: string };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClasses("primary", "sm")}
    >
      {pending ? "กำลังบันทึก..." : "บันทึก Remark"}
    </button>
  );
}

export function RemarkSection({
  roomId,
  logs,
}: {
  roomId: string;
  logs: Log[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      <form
        ref={formRef}
        action={async (formData) => {
          await addRemark(roomId, formData);
          formRef.current?.reset();
        }}
        className="space-y-2"
      >
        <Textarea
          name="text"
          required
          placeholder="อัปเดตล่าสุดจากเจ้าของ เช่น โทรแล้วยังไม่รับ / ลดราคาได้ / ให้เข้าดูห้องวันเสาร์"
        />
        <div className="flex justify-end">
          <SubmitButton />
        </div>
      </form>

      {logs.length === 0 ? (
        <p className="text-sm text-gray-400">ยังไม่มีประวัติ Remark</p>
      ) : (
        <ol className="space-y-3">
          {logs.map((log) => (
            <li key={log.id} className="relative pl-5">
              <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="whitespace-pre-wrap text-sm text-gray-800">
                  {log.text}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {log.user.name} · {formatDateTime(log.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
