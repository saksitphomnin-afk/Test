"use client";

import { deleteCustomer } from "@/actions/customers";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function DeleteCustomerButton({
  id,
  asMenuItem,
}: {
  id: string;
  // แสดงเป็นแถวเต็มความกว้างสำหรับใช้ใน KebabMenu แทนปุ่มเดี่ยว ๆ
  asMenuItem?: boolean;
}) {
  return (
    <form
      action={deleteCustomer.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("ยืนยันการลบลูกค้ารายนี้? การลบไม่สามารถกู้คืนได้")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className={
          asMenuItem
            ? "block w-full px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            : cn(buttonClasses("danger", "sm"))
        }
      >
        ลบ
      </button>
    </form>
  );
}
