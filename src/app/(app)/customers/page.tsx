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

  // จับคู่ห้อง + ใบเสร็จให้แต่ละลูกค้า (เอาสัญญาล่าสุดพอถ้ามีหลายรายการ) — ดึงสัญญาทั้งหมด
  // (ไม่กรองแค่จ่ายเงินจองแล้ว) เพื่อรู้ว่าลูกค้าคนนี้เคยแมทกับห้องไหนบ้าง จะได้ลิงก์ไปทำสัญญา
  // ต่อจากห้องเดิมได้เลยจากหน้า Enquiry โดยไม่ต้องเข้าไปที่หน้าห้อง — ส่วนคอลัมน์ใบเสร็จยังคง
  // แสดงเฉพาะสัญญาที่จ่ายเงินจองแล้วเหมือนเดิม
  const customerIds = customers.map((c) => c.id);
  const allContracts =
    customerIds.length > 0
      ? await prisma.contract.findMany({
          where: { customerId: { in: customerIds } },
          orderBy: { updatedAt: "desc" },
          select: {
            id: true,
            customerId: true,
            roomId: true,
            bookingPaid: true,
            slipUrl: true,
            bookingAmount: true,
            room: { select: { projectName: true, roomNumber: true } },
          },
        })
      : [];
  const contractByCustomerId = new Map<string, (typeof allContracts)[number]>();
  const latestRoomIdByCustomerId = new Map<string, string>();
  for (const c of allContracts) {
    if (!c.customerId) continue;
    if (!latestRoomIdByCustomerId.has(c.customerId)) {
      latestRoomIdByCustomerId.set(c.customerId, c.roomId);
    }
    if (c.bookingPaid && !contractByCustomerId.has(c.customerId)) {
      contractByCustomerId.set(c.customerId, c);
    }
  }

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
        <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">รหัส</th>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="px-4 py-3">เบอร์</th>
                <th className="px-4 py-3 text-right">งบ (บาท)</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">Remark</th>
                <th className="px-4 py-3">ห้อง / ใบเสร็จ</th>
                {isAdmin && <th className="px-4 py-3">ผู้ดูแล</th>}
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const meta = CUSTOMER_STATUS_META[c.status];
                const canManage = isAdmin || c.createdById === user.id;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">
                      {c.code ?? "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {c.name}
                      {c.lineId && (
                        <span className="block text-xs font-normal text-gray-400">
                          LINE: {c.lineId}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <a
                        href={`tel:${c.phone}`}
                        className="text-brand-600 hover:underline"
                      >
                        {c.phone}
                      </a>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-gray-700">
                      {c.budget != null ? c.budget.toLocaleString("en-US") : "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                          meta.badge,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </td>
                    <td className="max-w-[240px] px-4 py-3 text-gray-500">
                      <span className="block truncate" title={c.note ?? ""}>
                        {c.note || "-"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {(() => {
                        const matched = contractByCustomerId.get(c.id);
                        if (!matched) return <span className="text-gray-300">-</span>;
                        return (
                          <div>
                            <span className="block text-gray-700">
                              ห้อง {matched.room.projectName} {matched.room.roomNumber}
                            </span>
                            {matched.slipUrl && (
                              <a
                                href={`/api/contract/${matched.id}/receipt`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-brand-600 hover:underline"
                              >
                                ⬇ ใบเสร็จ
                              </a>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    {isAdmin && (
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {c.createdBy.name}
                        <span className="block text-xs text-gray-400">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {canManage ? (
                        <div className="flex items-center justify-end gap-2">
                          <LinkButton
                            href={
                              latestRoomIdByCustomerId.has(c.id)
                                ? `/rooms/${latestRoomIdByCustomerId.get(c.id)}/contract?customerId=${c.id}`
                                : `/customers/${c.id}/match`
                            }
                            variant="secondary"
                            size="sm"
                          >
                            ทำสัญญา
                          </LinkButton>
                          <LinkButton
                            href={`/customers/${c.id}/edit`}
                            variant="secondary"
                            size="sm"
                          >
                            แก้ไข
                          </LinkButton>
                          <DeleteCustomerButton id={c.id} />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
