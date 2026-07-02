import fs from "fs";
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
import { LEASE_CLAUSES, thaiDate, engDate, bahtNumber, or, type Lang } from "@/lib/lease-clauses";
import { CONTRACT_META } from "@/lib/constants";

export type { Lang };

// อ่านไฟล์ฟอนต์ตอน module โหลด แล้วฝังเป็น base64 data URL แทนการอ้าง path/URL
// ตรง ๆ — กัน @react-pdf/renderer พึ่งพา process.cwd() หรือ fetch กลับมาที่เว็บตัวเอง
// ตอน runtime บน serverless (Netlify) ซึ่งเปราะบางกว่ามาก ไฟล์ถูกบังคับรวมเข้า
// function bundle ผ่าน outputFileTracingIncludes ใน next.config.ts แล้ว
function fontDataUrl(file: string): string {
  const filePath = path.join(process.cwd(), "public/fonts", file);
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:font/ttf;base64,${base64}`;
}

Font.register({
  family: "Sarabun",
  fonts: [
    { src: fontDataUrl("Sarabun-Regular.ttf") },
    { src: fontDataUrl("Sarabun-Bold.ttf"), fontWeight: "bold" },
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
  proseParaEn: { marginBottom: 8, fontSize: 10.5 },
  proseParaTh: { marginBottom: 10, fontSize: 10.5 },
  bankBlock: { marginLeft: 14, marginTop: 2, marginBottom: 8 },
});

const valueRunStyle: Style = { fontWeight: "bold", textDecoration: "underline" };

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

// Variant of WrappedParagraph for "flowing prose with inline filled-in values" paragraphs
// (parties recital, leased-premises recital). Segments are plain-text chunks or
// bold+underlined "value" chunks; every chunk is still split on spaces into its own
// nested <Text> run so the anti-clipping fix above applies here too.
interface ProseSegment {
  text: string;
  value?: boolean;
}

function ProseParagraph({
  segments,
  style,
}: {
  segments: ProseSegment[];
  style: Style;
}) {
  // Concatenate all segment text into one string while remembering, per character,
  // which segment (and therefore whether it's a "value" span) it came from. Then
  // re-tokenize the whole string on spaces so punctuation glued to a value (e.g. "Doe,")
  // doesn't produce an extra bare token with wrong spacing.
  // A join space is inserted between consecutive segments unless the next segment
  // starts with punctuation meant to attach directly to the previous word (e.g. a
  // segment written as ", residing at" for the English recital's comma-joined clauses).
  let combined = "";
  const segmentIndexByChar: number[] = [];
  segments.forEach((seg, segIdx) => {
    if (segIdx > 0 && !/^[,;:.)]/.test(seg.text)) {
      combined += " ";
      segmentIndexByChar.push(-1);
    }
    for (const ch of seg.text) {
      combined += ch;
      segmentIndexByChar.push(segIdx);
    }
  });

  const tokens: { token: string; value: boolean }[] = [];
  const pushToken = (start: number, end: number) => {
    if (end <= start) return;
    const token = combined.slice(start, end);
    let isValue = false;
    for (let i = start; i < end; i++) {
      if (segments[segmentIndexByChar[i]]?.value) {
        isValue = true;
        break;
      }
    }
    tokens.push({ token, value: isValue });
  };
  let tokenStart = 0;
  for (let i = 0; i < combined.length; i++) {
    if (combined[i] === " ") {
      pushToken(tokenStart, i);
      tokenStart = i + 1;
    }
  }
  pushToken(tokenStart, combined.length);

  return (
    <Text style={style}>
      {tokens.map((t, i) => (
        <Text key={i} style={t.value ? valueRunStyle : undefined}>
          {t.token}
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

        {/* Parties — flowing prose recital with bold+underlined filled-in values */}
        <View style={styles.partyBlock} wrap={false}>
          <Text style={styles.clauseTitle}>
            {showEn && showTh ? "PARTIES / คู่สัญญา" : showEn ? "PARTIES" : "คู่สัญญา"}
          </Text>
          {showEn && (
            <ProseParagraph
              style={styles.proseParaEn}
              segments={[
                { text: "This agreement is made between" },
                { text: or(data.lessorName), value: true },
                { text: ", residing at" },
                { text: or(data.lessorAddress), value: true },
                { text: ", national ID / passport / juristic person registration number" },
                { text: or(data.lessorIdOrPassport), value: true },
                { text: ", nationality" },
                { text: or(data.lessorNationality), value: true },
                { text: ", telephone number" },
                { text: or(data.lessorPhone), value: true },
                { text: ', hereinafter referred to as the "Lessor", of the one part, and' },
                { text: or(data.tenantName), value: true },
                { text: ", residing at" },
                { text: or(data.tenantAddress), value: true },
                { text: ", national ID / passport / juristic person registration number" },
                { text: or(data.tenantIdOrPassport), value: true },
                { text: ", nationality" },
                { text: or(data.tenantNationality), value: true },
                { text: ", telephone number" },
                { text: or(data.tenantPhone), value: true },
                { text: ', hereinafter referred to as the "Tenant", of the other part.' },
              ]}
            />
          )}
          {showTh && (
            <ProseParagraph
              style={styles.proseParaTh}
              segments={[
                { text: "สัญญาฉบับนี้ทำขึ้นระหว่าง" },
                { text: or(data.lessorName), value: true },
                { text: "ที่อยู่" },
                { text: or(data.lessorAddress), value: true },
                { text: "เลขบัตรประชาชน/หนังสือเดินทาง/เลขทะเบียนนิติบุคคล" },
                { text: or(data.lessorIdOrPassport), value: true },
                { text: "สัญชาติ" },
                { text: or(data.lessorNationality), value: true },
                { text: "เบอร์โทรศัพท์" },
                { text: or(data.lessorPhone), value: true },
                { text: 'ซึ่งต่อไปในสัญญานี้เรียกว่า "ผู้ให้เช่า" ฝ่ายหนึ่ง กับ' },
                { text: or(data.tenantName), value: true },
                { text: "ที่อยู่" },
                { text: or(data.tenantAddress), value: true },
                { text: "เลขบัตรประชาชน/หนังสือเดินทาง/เลขทะเบียนนิติบุคคล" },
                { text: or(data.tenantIdOrPassport), value: true },
                { text: "สัญชาติ" },
                { text: or(data.tenantNationality), value: true },
                { text: "เบอร์โทรศัพท์" },
                { text: or(data.tenantPhone), value: true },
                { text: 'ซึ่งต่อไปในสัญญานี้เรียกว่า "ผู้เช่า" อีกฝ่ายหนึ่ง' },
              ]}
            />
          )}
        </View>

        {/* Leased Premises — flowing prose recital */}
        <View style={styles.partyBlock} wrap={false}>
          <Text style={styles.clauseTitle}>
            {showEn && showTh
              ? "LEASED PREMISES / ทรัพย์สินที่เช่า"
              : showEn
                ? "LEASED PREMISES"
                : "ทรัพย์สินที่เช่า"}
          </Text>
          {showEn && (
            <ProseParagraph
              style={styles.proseParaEn}
              segments={[
                { text: "Whereas the Lessor is the owner of a unit in the condominium project of" },
                { text: or(data.propertyProject), value: true },
                { text: ", Building" },
                { text: or(data.propertyBuilding), value: true },
                { text: ", Room No." },
                { text: or(data.propertyUnitNo), value: true },
                { text: ", Floor" },
                { text: or(data.propertyFloor), value: true },
                { text: ", with a size of approximately" },
                { text: or(data.propertySize), value: true },
                { text: "square metres, located at" },
                { text: or(data.propertyAddress), value: true },
                { text: ', hereinafter referred to as the "Leased premises".' },
              ]}
            />
          )}
          {showTh && (
            <ProseParagraph
              style={styles.proseParaTh}
              segments={[
                { text: "โดยผู้ให้เช่าเป็นเจ้าของกรรมสิทธิ์ห้องชุดในโครงการ" },
                { text: or(data.propertyProject), value: true },
                { text: "อาคาร/ตึก" },
                { text: or(data.propertyBuilding), value: true },
                { text: "เลขห้อง" },
                { text: or(data.propertyUnitNo), value: true },
                { text: "ชั้น" },
                { text: or(data.propertyFloor), value: true },
                { text: "ขนาดพื้นที่ประมาณ" },
                { text: or(data.propertySize), value: true },
                { text: "ตารางเมตร ตั้งอยู่ที่" },
                { text: or(data.propertyAddress), value: true },
                { text: 'ซึ่งต่อไปในสัญญานี้เรียกว่า "ทรัพย์สินที่เช่า"' },
              ]}
            />
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
          const isRental = clause.id === "rental";
          const hasBankInfo = Boolean(
            (data.bankName && data.bankName.trim()) ||
              (data.bankBranch && data.bankBranch.trim()) ||
              (data.bankAccountNumber && data.bankAccountNumber.trim()) ||
              (data.bankAccountName && data.bankAccountName.trim()),
          );
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
                enParas.flatMap((p, i) => {
                  const nodes = [
                    <WrappedParagraph key={`en-${i}`} style={styles.clauseParaEn} text={p} />,
                  ];
                  if (isRental && i === 0 && hasBankInfo) {
                    nodes.push(
                      <View key="en-bank" style={styles.bankBlock}>
                        <FieldLine label="Bank" value={data.bankName} />
                        <FieldLine label="Branch" value={data.bankBranch} />
                        <FieldLine label="Account Number" value={data.bankAccountNumber} />
                        <FieldLine label="Account Name" value={data.bankAccountName} />
                      </View>,
                    );
                  }
                  return nodes;
                })}
              {showTh &&
                thParas.flatMap((p, i) => {
                  const nodes = [
                    <WrappedParagraph key={`th-${i}`} style={styles.clauseParaTh} text={p} />,
                  ];
                  if (isRental && i === 0 && hasBankInfo) {
                    nodes.push(
                      <View key="th-bank" style={styles.bankBlock}>
                        <FieldLine label="ชื่อธนาคาร" value={data.bankName} />
                        <FieldLine label="สาขา" value={data.bankBranch} />
                        <FieldLine label="หมายเลขบัญชี" value={data.bankAccountNumber} />
                        <FieldLine label="ชื่อบัญชี" value={data.bankAccountName} />
                      </View>,
                    );
                  }
                  return nodes;
                })}
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
