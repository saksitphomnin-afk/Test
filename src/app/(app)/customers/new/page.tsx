import { CustomerForm } from "@/components/CustomerForm";

export const dynamic = "force-dynamic";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">เพิ่มลูกค้า (Enquiry)</h1>
        <p className="mt-1 text-sm text-gray-500">
          ระบบจะเช็คกันลูกค้าชน — ถ้าเบอร์/ไลน์/ชื่อ ซ้ำกับที่คนในทีมดูแลอยู่ จะเพิ่มไม่ได้
        </p>
      </div>
      <CustomerForm apiUrl="/api/customers" method="POST" submitLabel="เพิ่มลูกค้า" />
    </div>
  );
}
