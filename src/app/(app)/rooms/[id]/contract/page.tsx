import Link from "next/link";
import { notFound } from "next/navigation";
import type { ContractType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { ContractForm } from "@/components/ContractForm";
import { prefillFromRoom, type ContractData } from "@/lib/contract";

export const dynamic = "force-dynamic";

export default async function ContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const room = await prisma.room.findUnique({
    where: { id },
    include: { contracts: true },
  });
  if (!room) notFound();

  const customers = await prisma.customer.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true, name: true, phone: true },
  });

  const prefill = {
    RENT: prefillFromRoom("RENT", room),
    SALE: prefillFromRoom("SALE", room),
  };

  const savedData: Partial<Record<ContractType, ContractData>> = {};
  const savedContractIds: Partial<Record<ContractType, string>> = {};
  const savedBooking: Partial<
    Record<
      ContractType,
      {
        customerId: string | null;
        bookingPaid: boolean;
        bookingAmount: number | null;
        slipUrl: string | null;
      }
    >
  > = {};
  for (const c of room.contracts) {
    savedData[c.type] = c.data as ContractData;
    savedContractIds[c.type] = c.id;
    savedBooking[c.type] = {
      customerId: c.customerId,
      bookingPaid: c.bookingPaid,
      bookingAmount: c.bookingAmount,
      slipUrl: c.slipUrl,
    };
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/rooms/${id}`}
          className="text-sm text-brand-600 hover:underline"
        >
          ← กลับไปหน้าห้อง
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-gray-900">
          ออกสัญญา (เช่า / ซื้อขาย)
        </h1>
        <p className="text-sm text-gray-500">
          {room.projectName} · ห้อง {room.roomNumber} — กรอกข้อมูลแล้วดาวน์โหลดเป็น PDF
        </p>
      </div>

      <ContractForm
        roomId={id}
        prefill={prefill}
        savedData={savedData}
        savedContractIds={savedContractIds}
        savedBooking={savedBooking}
        customers={customers}
      />
    </div>
  );
}
