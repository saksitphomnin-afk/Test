import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { TemplateUploadForm } from "@/components/TemplateUploadForm";
import { TemplateList } from "@/components/TemplateList";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await requireUser();
  const templates = await prisma.contractTemplate.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">รวมไฟล์สัญญา</h1>
        <p className="text-sm text-gray-500">
          แบบฟอร์มสัญญาให้ดาวน์โหลด เช่น ตัวอย่างสัญญาภาษาไทย ตัวอย่างสัญญาภาษาอังกฤษ
        </p>
      </div>

      {user.role === "ADMIN" && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">เพิ่มไฟล์</h2>
          <TemplateUploadForm />
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {templates.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500">ยังไม่มีไฟล์ในคลังนี้</p>
        ) : (
          <TemplateList templates={templates} isAdmin={user.role === "ADMIN"} />
        )}
      </div>
    </div>
  );
}
