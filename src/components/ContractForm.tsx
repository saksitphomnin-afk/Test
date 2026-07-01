"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ContractType } from "@prisma/client";
import {
  saveContract,
  type ContractFormState,
} from "@/actions/contracts";
import {
  contractSections,
  type ContractData,
} from "@/lib/contract";
import { CONTRACT_META } from "@/lib/constants";
import { Input, Textarea, FormRow } from "@/components/ui/Field";
import { buttonClasses, LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClasses("primary", "md")}
    >
      {pending ? "กำลังบันทึก..." : "บันทึกสัญญา"}
    </button>
  );
}

export function ContractForm({
  roomId,
  prefill,
  savedData,
  savedContractIds,
}: {
  roomId: string;
  prefill: Record<ContractType, ContractData>;
  savedData: Partial<Record<ContractType, ContractData>>;
  savedContractIds: Partial<Record<ContractType, string>>;
}) {
  const [type, setType] = useState<ContractType>("RENT");
  const [savedIds, setSavedIds] =
    useState<Partial<Record<ContractType, string>>>(savedContractIds);

  const [state, formAction] = useActionState<ContractFormState, FormData>(
    saveContract.bind(null, roomId, type),
    {},
  );

  useEffect(() => {
    if (state.contractId) {
      setSavedIds((prev) => ({ ...prev, [type]: state.contractId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.contractId]);

  const currentId = savedIds[type];
  const values: ContractData = {
    ...prefill[type],
    ...(savedData[type] ?? {}),
  };

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
        {(["RENT", "SALE"] as ContractType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition",
              type === t
                ? "bg-brand-600 text-white"
                : "text-gray-600 hover:bg-gray-100",
            )}
          >
            {CONTRACT_META[t].label}
          </button>
        ))}
      </div>

      <form key={type} action={formAction} className="space-y-6">
        {contractSections(type).map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {section.fields.map((f) => (
                <FormRow
                  key={f.name}
                  label={f.label}
                  htmlFor={f.name}
                  className={f.full ? "sm:col-span-2" : undefined}
                >
                  {f.type === "textarea" ? (
                    <Textarea
                      id={f.name}
                      name={f.name}
                      defaultValue={values[f.name] ?? ""}
                    />
                  ) : (
                    <Input
                      id={f.name}
                      name={f.name}
                      type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      defaultValue={values[f.name] ?? ""}
                    />
                  )}
                </FormRow>
              ))}
            </div>
          </section>
        ))}

        {state.error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <LinkButton href={`/rooms/${roomId}`} variant="secondary">
            กลับ
          </LinkButton>
          {currentId && (
            <a
              href={`/api/contract/${currentId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("secondary", "md")}
            >
              ⬇ ดาวน์โหลด PDF
            </a>
          )}
          <SubmitButton />
        </div>
        {currentId && (
          <p className="text-right text-xs text-gray-400">
            บันทึกสัญญาแล้ว — กดดาวน์โหลด PDF ได้เลย (แก้ไขแล้วอย่าลืมกดบันทึกอีกครั้ง)
          </p>
        )}
      </form>
    </div>
  );
}
