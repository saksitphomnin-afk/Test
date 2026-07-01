import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { AddUserForm } from "@/components/admin/AddUserForm";
import { UserRow } from "@/components/admin/UserRow";

const MESSAGES: Record<string, { text: string; tone: "ok" | "err" }> = {
  deleted: { text: "ลบบัญชีเรียบร้อยแล้ว", tone: "ok" },
  self: { text: "ไม่สามารถลบบัญชีของตัวเองได้", tone: "err" },
  hasdata: {
    text: "ลบไม่ได้ เพราะบัญชีนี้มีการเพิ่มห้อง/Remark/สัญญาไว้ในระบบ",
    tone: "err",
  },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; err?: string }>;
}) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const notice = MESSAGES[sp.msg ?? ""] ?? MESSAGES[sp.err ?? ""];

  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">จัดการผู้ใช้</h1>
        <p className="mt-1 text-sm text-gray-500">
          สร้างบัญชีให้สมาชิกทีม รีเซ็ตรหัสผ่าน หรือลบบัญชี
        </p>
      </div>

      {notice && (
        <p
          className={
            "rounded-lg px-3 py-2 text-sm " +
            (notice.tone === "ok"
              ? "bg-green-50 text-green-700"
              : "bg-rose-50 text-rose-700")
          }
        >
          {notice.text}
        </p>
      )}

      <AddUserForm />

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">
          สมาชิกทั้งหมด ({users.length})
        </h2>
        {users.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === admin.id} />
        ))}
      </div>
    </div>
  );
}
