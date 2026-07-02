import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { LinkButton } from "@/components/ui/Button";
import { DeleteCustomerButton } from "@/components/DeleteCustomerButton";
import { CUSTOMER_STATUS_META } from "@/lib/customers";
import { formatDateTime } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const customers = await prisma.customer.findMany({
    // member เห็นเฉพาะของตัวเอง / admin เห็นทั้งหมด
    where: isAdmin ? {} : { createdById: user.id },
    include: { createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">
          Enquiry
          <span className="ml-2 text-sm font-normal text-gray-500">
            {customers.length} ราย
          </span>
        </h1>
        <LinkButton href="/customers/new" prefetch={false} size="sm">
          + เพิ่มลูกค้า
        </LinkButton>
      </div>

      <p className="text-sm text-gray-500">
        {isAdmin
          ? "👑 คุณเป็นแอดมิน — เห็นลูกค้าของทุกคนในทีม"
          : "🔒 คุณเห็นเฉพาะลูกค้าที่คุณเพิ่มเองเท่านั้น"}
      </p>

      {customers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center">
          <p className="text-gray-500">ยังไม่มีลูกค้า</p>
          <div className="mt-4">
            <LinkButton href="/customers/new" prefetch={false} size="sm">
              + เพิ่มลูกค้ารายแรก
            </LinkButton>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => {
            const meta = CUSTOMER_STATUS_META[c.status];
            const canManage = isAdmin || c.createdById === user.id;
            return (
              <div
                key={c.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{c.name}</h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                          meta.badge,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      📞{" "}
                      <a
                        href={`tel:${c.phone}`}
                        className="text-brand-600 hover:underline"
                      >
                        {c.phone}
                      </a>
                      {c.lineId ? (
                        <span className="text-gray-500"> · LINE: {c.lineId}</span>
                      ) : null}
                    </p>
                    {c.note && (
                      <p className="mt-1 whitespace-pre-line text-sm text-gray-500">
                        {c.note}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex shrink-0 items-center gap-2">
                      <LinkButton
                        href={`/customers/${c.id}/edit`}
                        variant="secondary"
                        size="sm"
                      >
                        แก้ไข
                      </LinkButton>
                      <DeleteCustomerButton id={c.id} />
                    </div>
                  )}
                </div>
                <div className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-400">
                  {isAdmin && (
                    <>
                      ผู้ดูแล:{" "}
                      <span className="text-gray-600">{c.createdBy.name}</span> ·{" "}
                    </>
                  )}
                  แอดเมื่อ {formatDateTime(c.createdAt)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
