import path from "path";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ContractType } from "@prisma/client";
import { contractSections, type ContractData } from "@/lib/contract";
import { CONTRACT_META } from "@/lib/constants";

// บน serverless (Netlify/Vercel) ไฟล์ใน public อาจไม่อยู่ใน bundle ของฟังก์ชัน
// จึงโหลดฟอนต์จาก URL ของเว็บ (static asset ถูกเสิร์ฟเสมอ) เมื่อรู้ base URL
// ส่วนตอน dev บนเครื่องใช้ path ไฟล์โดยตรง
function siteBaseUrl(): string | undefined {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.URL) return process.env.URL; // Netlify
  if (process.env.DEPLOY_PRIME_URL) return process.env.DEPLOY_PRIME_URL; // Netlify preview
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // Vercel
  return undefined;
}

function fontSrc(file: string): string {
  const base = siteBaseUrl();
  return base
    ? `${base.replace(/\/$/, "")}/fonts/${file}`
    : path.join(process.cwd(), "public/fonts", file);
}

Font.register({
  family: "Sarabun",
  fonts: [
    { src: fontSrc("Sarabun-Regular.ttf") },
    { src: fontSrc("Sarabun-Bold.ttf"), fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Sarabun",
    fontSize: 11,
    padding: 40,
    color: "#111827",
    lineHeight: 1.5,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    color: "#1d4ed8",
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: "35%", color: "#6b7280" },
  value: { width: "65%" },
  notes: { marginTop: 2 },
  signatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 48,
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
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
  },
});

function ContractDocument({
  type,
  data,
}: {
  type: ContractType;
  data: ContractData;
}) {
  const sections = contractSections(type);
  const partyALabel = type === "RENT" ? "ผู้ให้เช่า" : "ผู้ขาย";
  const partyBLabel = type === "RENT" ? "ผู้เช่า" : "ผู้ซื้อ";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{CONTRACT_META[type].label}</Text>

        {sections.map((section) => {
          const isNotes = section.fields.some((f) => f.type === "textarea");
          return (
            <View key={section.title} style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {isNotes
                ? section.fields.map((f) => (
                    <Text key={f.name} style={styles.notes}>
                      {data[f.name] || "-"}
                    </Text>
                  ))
                : section.fields.map((f) => (
                    <View key={f.name} style={styles.row}>
                      <Text style={styles.label}>{f.label}</Text>
                      <Text style={styles.value}>{data[f.name] || "-"}</Text>
                    </View>
                  ))}
            </View>
          );
        })}

        <View style={styles.signatures}>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text>({partyALabel})</Text>
          </View>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text>({partyBLabel})</Text>
          </View>
        </View>

        <Text style={styles.footer} fixed>
          เอกสารนี้จัดทำจากระบบ Place co. — กรุณาตรวจสอบความถูกต้องก่อนลงนาม
        </Text>
      </Page>
    </Document>
  );
}

export async function renderContractPdf(
  type: ContractType,
  data: ContractData,
): Promise<Buffer> {
  return renderToBuffer(<ContractDocument type={type} data={data} />);
}
