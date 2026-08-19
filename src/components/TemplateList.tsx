"use client";

import { useState, useTransition } from "react";
import type { ContractTemplate } from "@prisma/client";
import { FileText, Download, Trash2 } from "lucide-react";
import { deleteTemplate } from "@/actions/templates";

export function TemplateList({
  templates,
  isAdmin,
}: {
  templates: ContractTemplate[];
  isAdmin: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  // เก็บ id ที่ลบไปแล้วเพื่อซ่อนออกจากลิสต์ทันที (optimistic)
  const [removed, setRemoved] = useState<string[]>([]);

  function handleDelete(id: string) {
    if (!confirm("ลบไฟล์นี้?")) return;
    setRemoved((prev) => [...prev, id]);
    startTransition(() => deleteTemplate(id));
  }

  const visible = templates.filter((t) => !removed.includes(t.id));

  return (
    <ul className="divide-y divide-gray-100">
      {visible.map((t) => (
        <li key={t.id} className="flex items-center gap-3 px-5 py-3">
          <FileText className="h-5 w-5 shrink-0 text-gray-400" />
          <span className="flex-1 truncate text-sm font-medium text-gray-800">{t.title}</span>
          <a
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            title="ดาวน์โหลด"
            aria-label={`ดาวน์โหลด ${t.title}`}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-600"
          >
            <Download className="h-4 w-4" />
          </a>
          {isAdmin && (
            <button
              type="button"
              title="ลบไฟล์นี้"
              aria-label={`ลบไฟล์ ${t.title}`}
              disabled={isPending}
              onClick={() => handleDelete(t.id)}
              className="rounded-lg p-2 text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
