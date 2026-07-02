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
import type { Style } from "@react-pdf/types";
import type { ContractType } from "@prisma/client";
import { contractSections, type ContractData } from "@/lib/contract";
import { LEASE_CLAUSES, thaiDate, engDate, bahtNumber, type Lang } from "@/lib/lease-clauses";
import { CONTRACT_META } from "@/lib/constants";

export type { Lang };

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
  // --- lease-specific ---
  leaseTitleEn: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  leaseTitleTh: { fontSize: 16, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  leaseHeaderLine: { fontSize: 10, textAlign: "center", color: "#4b5563", marginBottom: 14 },
  partyBlock: { marginBottom: 10 },
  clauseBlock: { marginBottom: 12 },
  clauseTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1d4ed8",
  },
  clauseParaEn: { marginBottom: 4, fontSize: 10.5 },
  clauseParaTh: { marginBottom: 6, fontSize: 10.5 },
  langDivider: { marginBottom: 2 },
  fieldLine: { flexDirection: "row", marginBottom: 2 },
  fieldLabel: { color: "#6b7280", fontSize: 9.5 },
  fieldValue: { fontSize: 10.5 },
});

// ==================== SALE / GENERIC CONTRACT (unchanged behaviour) ====================

function GenericContractDocument({
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

// ==================== RENT / FULL LEASE DOCUMENT ====================

function FieldLine({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.fieldLine}>
      <Text style={styles.fieldLabel}>{label}: </Text>
      <Text style={styles.fieldValue}>{value && value.trim() ? value : "…………………………"}</Text>
    </View>
  );
}

// ==================== workaround: react-pdf / textkit word-wrap bug ====================
// @react-pdf/renderer (via @react-pdf/textkit) only knows how to break lines at literal
// ASCII space characters. Thai script has no spaces between words, so a long Thai clause
// between two spaces is treated as ONE giant "word" (syllable/box) by the Knuth-Plass line
// breaker. When that unbreakable box is wider than the remaining line width, the layout
// engine can drop/mis-slice trailing characters of that box when forcing a line break —
// this is what was clipping the last digit of Buddhist years (and, more generally, the
// last character of many wrapped Thai lines throughout the document).
//
// Nested <Text> elements are laid out by react-pdf as separate inline "runs" — the
// word-wrap step (wrapWords) processes each run independently, so a run boundary acts as a
// forced, safe break opportunity even with no space present. Splitting each paragraph into
// one nested <Text> per space-delimited token (re-joining with literal single-space <Text>
// nodes) keeps every "word" bounded to a normal-sized run, avoiding the oversized
// unbreakable box that triggers the clipping bug — without changing any visible spacing.
function WrappedParagraph({
  text,
  style,
}: {
  text: string;
  style: Style;
}) {
  const tokens = text.split(" ");
  return (
    <Text style={style}>
      {tokens.map((token, i) => (
        <Text key={i}>
          {token}
          {i < tokens.length - 1 ? " " : ""}
        </Text>
      ))}
    </Text>
  );
}

function LeaseContractDocument({ data, lang }: { data: ContractData; lang: Lang }) {
  const showEn = lang === "EN" || lang === "BOTH";
  const showTh = lang === "TH" || lang === "BOTH";

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {showEn && (
          <Text style={styles.leaseTitleEn}>Condominium Unit Lease Agreement</Text>
        )}
        {showTh && <Text style={styles.leaseTitleTh}>สัญญาเช่าห้องชุด</Text>}
        <Text style={styles.leaseHeaderLine}>
          {showEn && (
            <>
              {`Made at ${data.contractPlace || "…………………………"} on `}
              <Text>{engDate(data.contractDate)}</Text>
            </>
          )}
          {showEn && showTh ? "  /  " : ""}
          {showTh && (
            <>
              {`ทำที่ ${data.contractPlace || "…………………………"} วันที่ `}
              <Text>{thaiDate(data.contractDate)}</Text>
            </>
          )}
        </Text>

        {/* Parties */}
        <View style={styles.partyBlock} wrap={false}>
          <Text style={styles.clauseTitle}>
            {showEn && showTh
              ? "LESSOR / ผู้ให้เช่า"
              : showEn
                ? "LESSOR"
                : "ผู้ให้เช่า"}
          </Text>
          {showEn && (
            <>
              <FieldLine label="Name" value={data.lessorName} />
              <FieldLine
                label="National ID / Passport / Juristic person reg. no."
                value={data.lessorIdOrPassport}
              />
              <FieldLine label="Nationality" value={data.lessorNationality} />
              <FieldLine label="Address" value={data.lessorAddress} />
              <FieldLine label="Phone" value={data.lessorPhone} />
            </>
          )}
          {showTh && (
            <>
              <FieldLine label="ชื่อ-นามสกุล" value={data.lessorName} />
              <FieldLine
                label="เลขบัตรประชาชน/พาสปอร์ต/เลขทะเบียนนิติบุคคล"
                value={data.lessorIdOrPassport}
              />
              <FieldLine label="สัญชาติ" value={data.lessorNationality} />
              <FieldLine label="ที่อยู่" value={data.lessorAddress} />
              <FieldLine label="เบอร์โทร" value={data.lessorPhone} />
            </>
          )}
        </View>

        <View style={styles.partyBlock} wrap={false}>
          <Text style={styles.clauseTitle}>
            {showEn && showTh
              ? "TENANT / ผู้เช่า"
              : showEn
                ? "TENANT"
                : "ผู้เช่า"}
          </Text>
          {showEn && (
            <>
              <FieldLine label="Name" value={data.tenantName} />
              <FieldLine
                label="National ID / Passport / Juristic person reg. no."
                value={data.tenantIdOrPassport}
              />
              <FieldLine label="Nationality" value={data.tenantNationality} />
              <FieldLine label="Address" value={data.tenantAddress} />
              <FieldLine label="Phone" value={data.tenantPhone} />
            </>
          )}
          {showTh && (
            <>
              <FieldLine label="ชื่อ-นามสกุล" value={data.tenantName} />
              <FieldLine
                label="เลขบัตรประชาชน/พาสปอร์ต/เลขทะเบียนนิติบุคคล"
                value={data.tenantIdOrPassport}
              />
              <FieldLine label="สัญชาติ" value={data.tenantNationality} />
              <FieldLine label="ที่อยู่" value={data.tenantAddress} />
              <FieldLine label="เบอร์โทร" value={data.tenantPhone} />
            </>
          )}
        </View>

        <View style={styles.partyBlock} wrap={false}>
          <Text style={styles.clauseTitle}>
            {showEn && showTh
              ? "LEASED PREMISES / ทรัพย์สินที่เช่า"
              : showEn
                ? "LEASED PREMISES"
                : "ทรัพย์สินที่เช่า"}
          </Text>
          {showEn && (
            <>
              <FieldLine label="Project" value={data.propertyProject} />
              <FieldLine label="Building" value={data.propertyBuilding} />
              <FieldLine label="Unit No." value={data.propertyUnitNo} />
              <FieldLine label="Floor" value={data.propertyFloor} />
              <FieldLine label="Size (sqm)" value={data.propertySize} />
              <FieldLine label="Address" value={data.propertyAddress} />
            </>
          )}
          {showTh && (
            <>
              <FieldLine label="โครงการ" value={data.propertyProject} />
              <FieldLine label="อาคาร/ตึก" value={data.propertyBuilding} />
              <FieldLine label="เลขห้อง" value={data.propertyUnitNo} />
              <FieldLine label="ชั้น" value={data.propertyFloor} />
              <FieldLine label="ขนาด (ตร.ม.)" value={data.propertySize} />
              <FieldLine label="ที่ตั้ง" value={data.propertyAddress} />
            </>
          )}
        </View>

        {showEn && (
          <WrappedParagraph
            style={{ marginBottom: showTh ? 2 : 12, fontSize: 10.5 }}
            text="In this regard, the Lessor desires to let and the Tenant desires to rent the Leased premises under the terms and conditions set forth in this agreement as follows:"
          />
        )}
        {showTh && (
          <WrappedParagraph
            style={{ marginBottom: 12, fontSize: 10.5 }}
            text="ทั้งนี้ ผู้ให้เช่ามีความประสงค์ให้เช่าและผู้เช่าตกลงเช่าทรัพย์สินที่เช่า โดยคู่สัญญาทั้งสองฝ่ายตกลงกันตามเงื่อนไขดังต่อไปนี้"
          />
        )}

        {/* Clauses */}
        {LEASE_CLAUSES.map((clause) => {
          const enParas = clause.bodyEn(data);
          const thParas = clause.bodyTh(data);
          return (
            <View key={clause.id} style={styles.clauseBlock}>
              <Text style={styles.clauseTitle}>
                {clause.numberLabel}.{" "}
                {showEn && showTh
                  ? `${clause.titleEn} / ${clause.titleTh}`
                  : showEn
                    ? clause.titleEn
                    : clause.titleTh}
              </Text>
              {showEn &&
                enParas.map((p, i) => (
                  <WrappedParagraph key={`en-${i}`} style={styles.clauseParaEn} text={p} />
                ))}
              {showTh &&
                thParas.map((p, i) => (
                  <WrappedParagraph key={`th-${i}`} style={styles.clauseParaTh} text={p} />
                ))}
            </View>
          );
        })}

        {showEn && (
          <WrappedParagraph
            style={{ marginTop: 8, marginBottom: showTh ? 2 : 24, fontSize: 10.5 }}
            text="This agreement is made in 3 identical copies. Both parties have read and fully understood the contents hereof and, finding them to be in accordance with their intentions, have signed below in the presence of witnesses. Each party retains one copy."
          />
        )}
        {showTh && (
          <WrappedParagraph
            style={{ marginTop: showEn ? 0 : 8, marginBottom: 24, fontSize: 10.5 }}
            text="สัญญาฉบับนี้ทำขึ้นเป็น 3 ฉบับ มีข้อความถูกต้องตรงกัน คู่สัญญาได้อ่านและเข้าใจข้อความโดยละเอียดตลอดแล้ว เห็นว่าเป็นไปตามความประสงค์ของคู่สัญญา จึงได้ลงลายมือชื่อไว้เป็นสำคัญต่อหน้าพยาน และคู่สัญญาต่างยึดถือไว้ฝ่ายละ 1 ฉบับ"
          />
        )}

        {/* Signatures */}
        <View style={styles.signatures} wrap={false}>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text>{showEn && showTh ? "Lessor / ผู้ให้เช่า" : showEn ? "Lessor" : "ผู้ให้เช่า"}</Text>
          </View>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text>{showEn && showTh ? "Tenant / ผู้เช่า" : showEn ? "Tenant" : "ผู้เช่า"}</Text>
          </View>
        </View>
        <View style={[styles.signatures, { marginTop: 36 }]} wrap={false}>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text>
              {showEn && showTh ? "Witness / พยาน" : showEn ? "Witness" : "พยาน"}
            </Text>
          </View>
          <View style={styles.signBox}>
            <View style={styles.signLine} />
            <Text>
              {showEn && showTh ? "Witness / พยาน" : showEn ? "Witness" : "พยาน"}
            </Text>
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
  lang: Lang = "BOTH",
): Promise<Buffer> {
  if (type === "RENT") {
    return renderToBuffer(<LeaseContractDocument data={data} lang={lang} />);
  }
  return renderToBuffer(<GenericContractDocument type={type} data={data} />);
}

// re-export for callers that may want raw baht formatting
export { bahtNumber };
