import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { FurnitureCategory } from "@prisma/client";
import { BiText } from "@/lib/pdf-fonts";
import { getImageBytes } from "@/lib/storage";
import { FURNITURE_CATEGORIES, FURNITURE_CATEGORY_LABEL } from "@/lib/furniture";

const styles = StyleSheet.create({
  page: {
    fontFamily: "THSarabun",
    fontSize: 12,
    paddingTop: 96,
    paddingBottom: 48,
    paddingHorizontal: 48,
    color: "#111827",
  },
  header: {
    position: "absolute",
    top: 32,
    left: 48,
    right: 48,
  },
  // textAlign ต้องตั้งที่ตัว Text เอง react-pdf ไม่ไล่ inherit จาก View แม่เหมือน CSS ปกติ
  title: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 12, color: "#4b5563", marginTop: 2, textAlign: "center" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "bold", textAlign: "center", marginBottom: 18 },
  subTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#b45309",
    marginBottom: 8,
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cell: { width: "31%", marginBottom: 16 },
  photo: { width: "100%", height: 130, objectFit: "cover", borderRadius: 4 },
  caption: { fontSize: 10.5, textAlign: "center", marginTop: 4 },
  signWrap: { marginTop: 40, alignItems: "center" },
  signLine: {
    borderTopWidth: 1,
    borderTopColor: "#111827",
    width: 220,
    marginBottom: 4,
    paddingTop: 4,
  },
  signLabel: { fontSize: 11, textAlign: "center" },
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

export interface FurnitureItemInput {
  category: FurnitureCategory;
  isDefect: boolean;
  caption: string;
  url: string;
}

export interface FurniturePdfInput {
  projectName: string;
  roomNumber: string;
  floor?: string | null;
  ownerName: string;
  items: FurnitureItemInput[];
}

type ResolvedItem = { caption: string; buffer: Buffer };

function PhotoGrid({ items }: { items: ResolvedItem[] }) {
  return (
    <View style={styles.grid}>
      {items.map((item, i) => (
        <View key={i} style={styles.cell} wrap={false}>
          <Image src={item.buffer} style={styles.photo} />
          <BiText style={styles.caption}>{item.caption || "-"}</BiText>
        </View>
      ))}
    </View>
  );
}

function FurnitureDocument({
  projectName,
  roomNumber,
  floor,
  ownerName,
  categorized,
}: {
  projectName: string;
  roomNumber: string;
  floor?: string | null;
  ownerName: string;
  categorized: { category: FurnitureCategory; normal: ResolvedItem[]; defect: ResolvedItem[] }[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <Text style={styles.title}>{`Furniture List - ${projectName}`}</Text>
          <Text style={styles.subtitle}>
            {`Unit No. ${roomNumber}${floor ? `  floor ${floor}` : ""}`}
          </Text>
        </View>

        {categorized.map(({ category, normal, defect }) => (
          <View key={category} style={styles.section}>
            <BiText style={styles.sectionTitle}>{`${FURNITURE_CATEGORY_LABEL[category]} Area`}</BiText>
            <PhotoGrid items={normal} />
            {defect.length > 0 && (
              <>
                <Text style={styles.subTitle}>Defect</Text>
                <PhotoGrid items={defect} />
              </>
            )}
          </View>
        ))}

        <View style={styles.signWrap}>
          <View style={styles.signLine} />
          <Text style={styles.signLabel}>ลงชื่อเจ้าของทรัพย์สิน / Owner Signature</Text>
          <BiText style={styles.signLabel}>{ownerName}</BiText>
        </View>

        <Text style={styles.footer} fixed>
          เอกสารนี้จัดทำจากระบบ Place co. — เฟอร์นิเจอร์ลิสต์ประกอบสัญญาเท่านั้น
        </Text>
      </Page>
    </Document>
  );
}

export async function renderFurniturePdf(input: FurniturePdfInput): Promise<Buffer> {
  const resolve = async (items: FurnitureItemInput[]): Promise<ResolvedItem[]> => {
    const out: ResolvedItem[] = [];
    for (const item of items) {
      const buffer = await getImageBytes(item.url);
      if (!buffer) continue;
      out.push({ caption: item.caption, buffer });
    }
    return out;
  };

  const categorized = [];
  for (const cat of FURNITURE_CATEGORIES) {
    const items = input.items.filter((it) => it.category === cat.value);
    if (items.length === 0) continue;
    const normal = await resolve(items.filter((it) => !it.isDefect));
    const defect = await resolve(items.filter((it) => it.isDefect));
    categorized.push({ category: cat.value, normal, defect });
  }

  return renderToBuffer(
    <FurnitureDocument
      projectName={input.projectName}
      roomNumber={input.roomNumber}
      floor={input.floor}
      ownerName={input.ownerName}
      categorized={categorized}
    />,
  );
}
