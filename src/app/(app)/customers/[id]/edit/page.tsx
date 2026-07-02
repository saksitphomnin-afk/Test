import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { CustomerForm } from "@/components/CustomerForm";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();
  // เข้าหน้าแก้ได้เฉพาะเจ้าของ หรือ admin
  if (customer.createdById !== user.id && user.role !== "ADMIN") {
    redirect("/customers");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">แก้ไขลูกค้า</h1>
        <p className="mt-1 text-sm text-gray-500">{customer.name}</p>
      </div>
      <CustomerForm
        apiUrl={`/api/customers/${id}`}
        method="PATCH"
        customer={customer}
        submitLabel="บันทึกการแก้ไข"
      />
    </div>
  );
}
