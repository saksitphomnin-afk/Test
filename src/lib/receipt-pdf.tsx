import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { thaiDate, bahtNumber, bahtText } from "@/lib/lease-clauses";
import { BiText } from "@/lib/pdf-fonts";

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
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    fontSize: 10.5,
    color: "#4b5563",
  },
  box: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    padding: 16,
    marginBottom: 24,
  },
  row: { flexDirection: "row", marginBottom: 10 },
  label: { width: "35%", color: "#6b7280" },
  value: { width: "65%", fontWeight: "bold" },
  amountBox: {
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    marginTop: 8,
    paddingTop: 12,
  },
  amountValue: { fontSize: 16, fontWeight: "bold", color: "#1d4ed8" },
  amountWords: { fontSize: 10.5, color: "#6b7280", marginTop: 2 },
  signatures: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 64,
  },
  signBox: { width: "45%", alignItems: "center" },
  signLine: {
    borderTopWidth: 1,
    borderTopColor: "#111827",
    width: "100%",
    marginBottom: 4,
    paddingTop: 4,
  },
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
  roomLabel: string;
  bookingAmount: number;
}

function ReceiptDocument({ receiptNo, payerName, roomLabel, bookingAmount }: ReceiptInput) {
  const today = thaiDate(new Date().toISOString());
  const amountText = `${bahtNumber(String(bookingAmount))} บาท`;
  const amountWords = bahtText(String(bookingAmount));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>ใบเสร็จรับเงิน (เงินจอง)</Text>
        <Text style={styles.subtitle}>Booking Payment Receipt</Text>

        <View style={styles.metaRow}>
          <BiText>เลขที่ใบเสร็จ: {receiptNo}</BiText>
          <Text>วันที่: {today}</Text>
        </View>

        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>ผู้จ่ายเงิน / ชื่อลูกค้า</Text>
            <BiText style={styles.value}>{payerName}</BiText>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ห้อง</Text>
            <BiText style={styles.value}>{roomLabel}</BiText>
          </View>

          <View style={styles.amountBox}>
            <View style={styles.row}>
              <Text style={styles.label}>จำนวนเงิน</Text>
              <BiText style={styles.amountValue}>{amountText}</BiText>
            </View>
            {amountWords && (
              <Text style={styles.amountWords}>({amountWords})</Text>
            )}
          </View>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text>(ผู้รับเงิน)</Text>
          </View>
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
