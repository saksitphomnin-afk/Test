"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createUser, type UserFormState } from "@/actions/users";
import { Input, Select, FormRow } from "@/components/ui/Field";
import { buttonClasses } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClasses("primary", "md")}
    >
      {pending ? "กำลังสร้าง..." : "สร้างบัญชี"}
    </button>
  );
}

export function AddUserForm() {
  const [state, formAction] = useActionState<UserFormState, FormData>(
    createUser,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-base font-semibold text-gray-900">เพิ่มสมาชิกทีม</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormRow label="ชื่อ" htmlFor="name" required>
          <Input id="name" name="name" required />
        </FormRow>
        <FormRow label="อีเมล" htmlFor="email" required>
          <Input id="email" name="email" type="email" required />
        </FormRow>
        <FormRow label="รหัสผ่าน" htmlFor="password" required>
          <Input id="password" name="password" type="text" required />
        </FormRow>
        <FormRow label="สิทธิ์" htmlFor="role">
          <Select id="role" name="role" defaultValue="MEMBER">
            <option value="MEMBER">ทีมงาน</option>
            <option value="ADMIN">ผู้ดูแลระบบ</option>
          </Select>
        </FormRow>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          สร้างบัญชีเรียบร้อยแล้ว
        </p>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
