import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { thaiDate, engDate, bahtNumber, bahtText } from "@/lib/lease-clauses";
import { BiText } from "@/lib/pdf-fonts";

const BORDER = "#111827";

const styles = StyleSheet.create({
  page: {
    fontFamily: "THSarabun",
    fontSize: 12,
    padding: 48,
    color: "#111827",
    lineHeight: 1.6,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    fontSize: 10.5,
    color: "#4b5563",
  },
  infoBlock: { marginBottom: 16 },
  infoLine: { marginBottom: 4 },
  tableWrap: {
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },
  tableRow: { flexDirection: "row" },
  tableRowBorderTop: { borderTopWidth: 1, borderTopColor: BORDER },
  headerCell: {
    backgroundColor: "#f3f4f6",
    fontWeight: "bold",
    padding: 6,
    textAlign: "center",
  },
  cellNo: {
    width: "10%",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    padding: 6,
    textAlign: "center",
  },
  cellDesc: {
    width: "60%",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    padding: 6,
  },
  cellAmount: {
    width: "30%",
    padding: 6,
    textAlign: "right",
  },
  totalLabelCell: {
    width: "70%",
    borderRightWidth: 1,
    borderRightColor: BORDER,
    padding: 6,
    fontWeight: "bold",
  },
  totalAmountCell: {
    width: "30%",
    padding: 6,
    textAlign: "right",
    fontWeight: "bold",
    color: "#1d4ed8",
  },
  totalWordsRow: { paddingHorizontal: 6, paddingBottom: 6 },
  totalWords: { fontSize: 10.5, color: "#6b7280" },
  paymentLine: { fontSize: 10.5, marginBottom: 24, color: "#374151" },
  signTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
  },
  signBottomWrap: { alignItems: "center", marginTop: 40 },
  signBox: { width: "45%", alignItems: "center" },
  signLine: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    width: "100%",
    marginBottom: 4,
    paddingTop: 4,
    textAlign: "center",
  },
  signRole: { fontSize: 10.5, color: "#6b7280", textAlign: "center" },
  notes: { marginTop: 32, fontSize: 10, color: "#6b7280" },
  noteLine: { marginBottom: 2 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

export interface ReceiptInput {
  receiptNo: string;
  payerName: string;
  payerAddress: string;
  ownerName: string;
  salesRepName: string;
  roomLabel: string;
  bookingAmount: number;
  depositAmount: number;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function ReceiptDocument({
  receiptNo,
  payerName,
  payerAddress,
  ownerName,
  salesRepName,
  roomLabel,
  bookingAmount,
  depositAmount,
}: ReceiptInput) {
  const issueDate = new Date().toISOString().slice(0, 10);
  const holdUntilDate = addDays(issueDate, 30);
  const total = bookingAmount + depositAmount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ใบรับเงินมัดจำ</Text>
        <Text style={styles.subtitle}>DEPOSIT RECEIPT</Text>

        <View style={styles.metaRow}>
          <BiText>{`เลขที่ / No: ${receiptNo}`}</BiText>
          <BiText>{`วันที่ / Date: ${thaiDate(issueDate)} (${engDate(issueDate)})`}</BiText>
        </View>

        <View style={styles.infoBlock}>
          <BiText style={styles.infoLine}>
            {`ได้รับเงินจาก / Received from: ${payerName}`}
          </BiText>
          <BiText style={styles.infoLine}>
            {`ที่อยู่ / Address: ${payerAddress || "-"}`}
          </BiText>
          <BiText style={styles.infoLine}>{`ห้อง / Unit: ${roomLabel}`}</BiText>
        </View>

        <View style={styles.tableWrap}>
          <View style={styles.tableRow}>
            <Text style={[styles.cellNo, styles.headerCell]}>ลำดับ / No</Text>
            <Text style={[styles.cellDesc, styles.headerCell]}>
              รายการ / Description
            </Text>
            <Text style={[styles.cellAmount, styles.headerCell]}>
              จำนวนเงิน (บาท) / Amount
            </Text>
          </View>

          <View style={[styles.tableRow, styles.tableRowBorderTop]}>
            <Text style={styles.cellNo}>1</Text>
            <BiText style={styles.cellDesc}>
              {`เงินจอง คุ้มครองสิทธิ์ถึงวันที่ ${thaiDate(holdUntilDate)} / Advance Booking (valid ${engDate(issueDate)} - ${engDate(holdUntilDate)})`}
            </BiText>
            <Text style={styles.cellAmount}>{bahtNumber(String(bookingAmount))}</Text>
          </View>

          <View style={[styles.tableRow, styles.tableRowBorderTop]}>
            <Text style={styles.cellNo}>2</Text>
            <BiText style={styles.cellDesc}>เงินประกันสัญญา / Security Deposit</BiText>
            <Text style={styles.cellAmount}>{bahtNumber(String(depositAmount))}</Text>
          </View>

          <View style={[styles.tableRow, styles.tableRowBorderTop]}>
            <Text style={styles.totalLabelCell}>รวมเป็นเงินทั้งสิ้น / Grand Total</Text>
            <Text style={styles.totalAmountCell}>{bahtNumber(String(total))}</Text>
          </View>
          {bahtText(String(total)) && (
            <View style={styles.totalWordsRow}>
              <Text style={styles.totalWords}>({bahtText(String(total))})</Text>
            </View>
          )}
        </View>

        <Text style={styles.paymentLine}>
          ชำระโดย / Payment method: [ ] เงินสด / Cash    [ ] โอนเงิน / Bank Transfer
          ................ ธนาคาร / Bank ................
        </Text>

        <View style={styles.signTopRow}>
          <View style={styles.signBox}>
            <BiText style={styles.signLine}>{`(${payerName})`}</BiText>
            <Text style={styles.signRole}>ผู้ชำระเงิน / Payer</Text>
          </View>
          <View style={styles.signBox}>
            <BiText style={styles.signLine}>{`(${ownerName})`}</BiText>
            <Text style={styles.signRole}>ผู้รับเงิน / Payee</Text>
          </View>
        </View>

        <View style={styles.signBottomWrap}>
          <View style={styles.signBox}>
            <BiText style={styles.signLine}>{`(${salesRepName})`}</BiText>
            <Text style={styles.signRole}>ผู้ดูแลการขาย / Sales Representative</Text>
          </View>
        </View>

        <View style={styles.notes}>
          <Text style={styles.noteLine}>
            1. หากยกเลิกการจองภายหลัง เงินจองและเงินประกันจะไม่ได้รับคืน
          </Text>
          <Text style={styles.noteLine}>
            2. เอกสารฉบับนี้เป็นเพียงหลักฐานการรับเงิน ไม่ใช่สัญญาเช่าหรือสัญญาซื้อขาย
          </Text>
          <Text style={styles.noteLine}>
            3. เอกสารนี้มีผลสมบูรณ์เมื่อได้รับชำระเงินจริงเรียบร้อยแล้วเท่านั้น
          </Text>
        </View>

        <Text style={styles.footer} fixed>
          เอกสารนี้จัดทำจากระบบ Place co. — ใบเสร็จรับเงินมัดจำ/เงินจองเท่านั้น
        </Text>
      </Page>
    </Document>
  );
}

export async function renderReceiptPdf(input: ReceiptInput): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument {...input} />);
}
