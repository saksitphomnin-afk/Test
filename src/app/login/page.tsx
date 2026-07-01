"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "@/actions/login";
import { Input, Label } from "@/components/ui/Field";
import { buttonClasses } from "@/components/ui/Button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClasses("primary", "md") + " w-full"}
    >
      {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Place co."
            className="mx-auto mb-3 h-14 w-auto"
          />
          <p className="mt-1 text-sm text-gray-500">
            ระบบจัดการสต็อกห้องคอนโด
          </p>
        </div>

        <form
          action={formAction}
          className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <Label htmlFor="email" required>
              อีเมล
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password" required>
              รหัสผ่าน
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>

          {state.error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {state.error}
            </p>
          )}

          <SubmitButton />
        </form>

        <p className="mt-4 text-center text-xs text-gray-400">
          บัญชีสร้างโดยผู้ดูแลระบบเท่านั้น
        </p>
      </div>
    </div>
  );
}
