import { CostCalculator } from "@/components/CostCalculator";

export const metadata = {
  title: "คำนวณต้นทุน — Condo Stock",
};

export default function CalculatorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">คำนวณต้นทุนการโอน</h1>
        <p className="mt-1 text-sm text-gray-500">
          ประมาณการค่าธรรมเนียมและภาษีในการโอนกรรมสิทธิ์ห้องชุด
          (ค่าโอน ภาษีธุรกิจเฉพาะ อากรแสตมป์ และภาษีเงินได้หัก ณ ที่จ่าย)
        </p>
      </div>
      <CostCalculator />
    </div>
  );
}
