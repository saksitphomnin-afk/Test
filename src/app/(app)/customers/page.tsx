import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { LinkButton } from "@/components/ui/Button";
import { DeleteCustomerButton } from "@/components/DeleteCustomerButton";
import { DocumentMenu } from "@/components/DocumentMenu";
import { KebabMenu, KebabMenuLink } from "@/components/KebabMenu";
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

  // จับคู่ห้อง + เอกสารให้แต่ละลูกค้า (เอาสัญญาล่าสุดพอถ้ามีหลายรายการ) — ดึงสัญญาทั้งหมด
  // (ไม่กรองแค่จ่ายเงินจองแล้ว) เพื่อรู้ว่าลูกค้าคนนี้เคยแมทกับห้องไหนบ้าง จะได้ลิงก์ไปทำสัญญา/ดูสัญญา/
  // เฟอร์นิเจอร์ต่อจากห้องเดิมได้เลยจากหน้า Enquiry โดยไม่ต้องเข้าไปที่หน้าห้อง — ส่วนตัวเลือก
  // "ดาวน์โหลดใบเสร็จ" ใน dropdown เอกสารเท่านั้นที่ยังต้องเช็คว่าจ่ายเงินจองแล้วและมีสลิปก่อน
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
  for (const c of allContracts) {
    if (!c.customerId) continue;
    if (!contractByCustomerId.has(c.customerId)) {
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
        <>
          {/* มือถือ/แท็บเล็ตแคบ: การ์ดเรียงต่อกัน อ่าน/ปัดง่ายกว่าตารางที่ต้องเลื่อนซ้าย-ขวา */}
          <div className="space-y-3 sm:hidden">
            {customers.map((c) => {
              const meta = CUSTOMER_STATUS_META[c.status];
              const canManage = isAdmin || c.createdById === user.id;
              const matched = contractByCustomerId.get(c.id);
              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">{c.name}</p>
                      <p className="font-mono text-xs text-gray-400">{c.code ?? "-"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                          meta.badge,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                      {canManage && (
                        <KebabMenu>
                          {matched && (
                            <KebabMenuLink href={`/customers/${c.id}/match`}>
                              เปลี่ยนห้อง/โครงการ
                            </KebabMenuLink>
                          )}
                          <KebabMenuLink href={`/customers/${c.id}/edit`}>แก้ไข</KebabMenuLink>
                          <DeleteCustomerButton id={c.id} asMenuItem />
                        </KebabMenu>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                    <a href={`tel:${c.phone}`} className="text-brand-600 hover:underline">
                      📞 {c.phone}
                    </a>
                    <span className="text-right text-gray-700 tabular-nums">
                      {c.budget != null ? `฿${c.budget.toLocaleString("en-US")}` : "-"}
                    </span>
                  </div>

                  {c.note && (
                    <p className="mt-1.5 truncate text-xs text-gray-500" title={c.note}>
                      📝 {c.note}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                    {matched ? (
                      <DocumentMenu
                        roomLabel={`ห้อง ${matched.room.projectName} ${matched.room.roomNumber}`}
                        contractHref={`/rooms/${matched.roomId}/contract?customerId=${c.id}`}
                        receiptHref={
                          matched.bookingPaid && matched.slipUrl
                            ? `/api/contract/${matched.id}/receipt`
                            : undefined
                        }
                        furnitureHref={`/customers/${c.id}/furniture`}
                      />
                    ) : (
                      <span className="text-xs text-gray-300">ยังไม่แมทห้อง</span>
                    )}
                    {canManage && !matched && (
                      <LinkButton href={`/customers/${c.id}/match`} size="sm">
                        ทำสัญญา
                      </LinkButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* จอกว้าง: ตารางแบบเดิม แต่ยุบปุ่มรองลงในเมนู ⋮ ให้แถวโล่งขึ้น */}
          <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm sm:block">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">รหัส</th>
                  <th className="px-4 py-3">ชื่อ</th>
                  <th className="px-4 py-3">เบอร์</th>
                  <th className="px-4 py-3 text-right">งบ (บาท)</th>
                  <th className="px-4 py-3">สถานะ</th>
                  <th className="px-4 py-3">Remark</th>
                  <th className="px-4 py-3">ห้อง / เอกสาร</th>
                  {isAdmin && <th className="px-4 py-3">ผู้ดูแล</th>}
                  <th className="px-4 py-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  const meta = CUSTOMER_STATUS_META[c.status];
                  const canManage = isAdmin || c.createdById === user.id;
                  const matched = contractByCustomerId.get(c.id);
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
                        {matched ? (
                          <DocumentMenu
                            roomLabel={`ห้อง ${matched.room.projectName} ${matched.room.roomNumber}`}
                            contractHref={`/rooms/${matched.roomId}/contract?customerId=${c.id}`}
                            receiptHref={
                              matched.bookingPaid && matched.slipUrl
                                ? `/api/contract/${matched.id}/receipt`
                                : undefined
                            }
                            furnitureHref={`/customers/${c.id}/furniture`}
                          />
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
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
                          <div className="flex items-center justify-end gap-1">
                            {!matched && (
                              <LinkButton
                                href={`/customers/${c.id}/match`}
                                variant="secondary"
                                size="sm"
                              >
                                ทำสัญญา
                              </LinkButton>
                            )}
                            <KebabMenu>
                              {matched && (
                                <KebabMenuLink href={`/customers/${c.id}/match`}>
                                  เปลี่ยนห้อง/โครงการ
                                </KebabMenuLink>
                              )}
                              <KebabMenuLink href={`/customers/${c.id}/edit`}>
                                แก้ไข
                              </KebabMenuLink>
                              <DeleteCustomerButton id={c.id} asMenuItem />
                            </KebabMenu>
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
        </>
      )}
    </div>
  );
}
