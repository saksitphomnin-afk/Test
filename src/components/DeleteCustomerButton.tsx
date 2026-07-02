"use client";

import { deleteCustomer } from "@/actions/customers";
import { buttonClasses } from "@/components/ui/Button";

export function DeleteCustomerButton({ id }: { id: string }) {
  return (
    <form
      action={deleteCustomer.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("ยืนยันการลบลูกค้ารายนี้? การลบไม่สามารถกู้คืนได้")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className={buttonClasses("danger", "sm")}>
        ลบ
      </button>
    </form>
  );
}
