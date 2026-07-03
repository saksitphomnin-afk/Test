"use client";

import { useActionState, useState } from "react";
import {
  resetPassword,
  setCustomerPrefix,
  deleteUser,
  type UserFormState,
} from "@/actions/users";
import { Input } from "@/components/ui/Field";
import { buttonClasses } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/constants";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  customerPrefix: string | null;
  createdAt: Date;
};

export function UserRow({ user, isSelf }: { user: UserItem; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<UserFormState, FormData>(
    resetPassword.bind(null, user.id),
    {},
  );
  const [prefixState, prefixAction] = useActionState<UserFormState, FormData>(
    setCustomerPrefix.bind(null, user.id),
    {},
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-gray-900">
            {user.name}
            {isSelf && (
              <span className="ml-2 text-xs text-gray-400">(คุณ)</span>
            )}
          </p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ทีมงาน"} ·{" "}
            {formatDateTime(user.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={buttonClasses("secondary", "sm")}
          >
            รีเซ็ตรหัส
          </button>
          {!isSelf && (
            <form
              action={deleteUser.bind(null, user.id)}
              onSubmit={(e) => {
                if (!confirm(`ลบบัญชี ${user.name}?`)) e.preventDefault();
              }}
            >
              <button type="submit" className={buttonClasses("danger", "sm")}>
                ลบ
              </button>
            </form>
          )}
        </div>
      </div>

      <form
        action={prefixAction}
        className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3"
      >
        <label className="text-sm text-gray-600">อักษรย่อรหัสลูกค้า:</label>
        <input
          name="prefix"
          defaultValue={user.customerPrefix ?? ""}
          placeholder="เช่น SP"
          maxLength={6}
          className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm uppercase focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <button type="submit" className={buttonClasses("secondary", "sm")}>
          บันทึกอักษรย่อ
        </button>
        <span className="text-xs text-gray-400">
          รหัสลูกค้าจะเป็น {(user.customerPrefix || "??").toUpperCase()}-0001, -0002 …
        </span>
        {prefixState.error && (
          <p className="w-full text-sm text-rose-700">{prefixState.error}</p>
        )}
        {prefixState.ok && (
          <p className="w-full text-sm text-green-700">บันทึกอักษรย่อแล้ว</p>
        )}
      </form>

      {open && (
        <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1">
            <Input
              name="password"
              type="text"
              placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
              required
            />
          </div>
          <button type="submit" className={buttonClasses("primary", "sm")}>
            บันทึกรหัสใหม่
          </button>
          {state.error && (
            <p className="w-full text-sm text-rose-700">{state.error}</p>
          )}
          {state.ok && (
            <p className="w-full text-sm text-green-700">
              เปลี่ยนรหัสผ่านเรียบร้อยแล้ว
            </p>
          )}
        </form>
      )}
    </div>
  );
}
