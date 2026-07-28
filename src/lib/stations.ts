// รายชื่อสถานีรถไฟฟ้า (BTS สายสุขุมวิท/สีลม/ทอง + MRT สายสีน้ำเงิน)
// ใช้ทั้งในฟอร์มเพิ่มห้อง (เลือกสถานีใกล้เคียง) และตัวกรองหน้า Condo
// ระยะห่างกรอกเอง (ดูจาก Google Maps) จึงไม่ต้องเก็บพิกัด

export type TrainLine = {
  key: string;
  label: string; // ชื่อสายภาษาไทย ใช้เป็นหัวกลุ่มใน dropdown
  color: string; // สีประจำสาย (tailwind text color) สำหรับป้าย
};

export type Station = {
  key: string; // รหัสเฉพาะ (stable) เก็บลง DB
  line: string; // อ้างอิง TrainLine.key
  nameTh: string;
  nameEn: string;
};

export const TRAIN_LINES: TrainLine[] = [
  { key: "BTS_SUKHUMVIT", label: "BTS สายสุขุมวิท", color: "text-green-600" },
  { key: "BTS_SILOM", label: "BTS สายสีลม", color: "text-emerald-700" },
  { key: "BTS_GOLD", label: "BTS สายสีทอง", color: "text-amber-600" },
  { key: "MRT_BLUE", label: "MRT สายสีน้ำเงิน", color: "text-blue-700" },
];

export const STATIONS: Station[] = [
  // ── BTS สายสุขุมวิท ──
  { key: "BTS_KHU_KHOT", line: "BTS_SUKHUMVIT", nameTh: "คูคต", nameEn: "Khu Khot" },
  { key: "BTS_YAEK_KPA", line: "BTS_SUKHUMVIT", nameTh: "แยก คปอ.", nameEn: "Yaek Kor Por Aor" },
  { key: "BTS_RTAF_MUSEUM", line: "BTS_SUKHUMVIT", nameTh: "พิพิธภัณฑ์กองทัพอากาศ", nameEn: "RTAF Museum" },
  { key: "BTS_BHUMIBOL_HOSP", line: "BTS_SUKHUMVIT", nameTh: "โรงพยาบาลภูมิพลอดุลยเดช", nameEn: "Bhumibol Adulyadej Hospital" },
  { key: "BTS_SAPHAN_MAI", line: "BTS_SUKHUMVIT", nameTh: "สะพานใหม่", nameEn: "Saphan Mai" },
  { key: "BTS_SAI_YUD", line: "BTS_SUKHUMVIT", nameTh: "สายหยุด", nameEn: "Sai Yud" },
  { key: "BTS_PHAHON_59", line: "BTS_SUKHUMVIT", nameTh: "พหลโยธิน 59", nameEn: "Phahon Yothin 59" },
  { key: "BTS_WAT_PHRA_SRI", line: "BTS_SUKHUMVIT", nameTh: "วัดพระศรีมหาธาตุ", nameEn: "Wat Phra Sri Mahathat" },
  { key: "BTS_11TH_INFANTRY", line: "BTS_SUKHUMVIT", nameTh: "กรมทหารราบที่ 11", nameEn: "11th Infantry Regiment" },
  { key: "BTS_BANG_BUA", line: "BTS_SUKHUMVIT", nameTh: "บางบัว", nameEn: "Bang Bua" },
  { key: "BTS_ROYAL_FOREST", line: "BTS_SUKHUMVIT", nameTh: "กรมป่าไม้", nameEn: "Royal Forest Department" },
  { key: "BTS_KASETSART", line: "BTS_SUKHUMVIT", nameTh: "มหาวิทยาลัยเกษตรศาสตร์", nameEn: "Kasetsart University" },
  { key: "BTS_SENA_NIKHOM", line: "BTS_SUKHUMVIT", nameTh: "เสนานิคม", nameEn: "Sena Nikhom" },
  { key: "BTS_RATCHAYOTHIN", line: "BTS_SUKHUMVIT", nameTh: "รัชโยธิน", nameEn: "Ratchayothin" },
  { key: "BTS_PHAHON_24", line: "BTS_SUKHUMVIT", nameTh: "พหลโยธิน 24", nameEn: "Phahon Yothin 24" },
  { key: "BTS_HA_YAEK_LAT_PHRAO", line: "BTS_SUKHUMVIT", nameTh: "ห้าแยกลาดพร้าว", nameEn: "Ha Yaek Lat Phrao" },
  { key: "BTS_MO_CHIT", line: "BTS_SUKHUMVIT", nameTh: "หมอชิต", nameEn: "Mo Chit" },
  { key: "BTS_SAPHAN_KHWAI", line: "BTS_SUKHUMVIT", nameTh: "สะพานควาย", nameEn: "Saphan Khwai" },
  { key: "BTS_ARI", line: "BTS_SUKHUMVIT", nameTh: "อารีย์", nameEn: "Ari" },
  { key: "BTS_SANAM_PAO", line: "BTS_SUKHUMVIT", nameTh: "สนามเป้า", nameEn: "Sanam Pao" },
  { key: "BTS_VICTORY_MONUMENT", line: "BTS_SUKHUMVIT", nameTh: "อนุสาวรีย์ชัยสมรภูมิ", nameEn: "Victory Monument" },
  { key: "BTS_PHAYA_THAI", line: "BTS_SUKHUMVIT", nameTh: "พญาไท", nameEn: "Phaya Thai" },
  { key: "BTS_RATCHATHEWI", line: "BTS_SUKHUMVIT", nameTh: "ราชเทวี", nameEn: "Ratchathewi" },
  { key: "BTS_SIAM", line: "BTS_SUKHUMVIT", nameTh: "สยาม", nameEn: "Siam" },
  { key: "BTS_CHIT_LOM", line: "BTS_SUKHUMVIT", nameTh: "ชิดลม", nameEn: "Chit Lom" },
  { key: "BTS_PHLOEN_CHIT", line: "BTS_SUKHUMVIT", nameTh: "เพลินจิต", nameEn: "Phloen Chit" },
  { key: "BTS_NANA", line: "BTS_SUKHUMVIT", nameTh: "นานา", nameEn: "Nana" },
  { key: "BTS_ASOK", line: "BTS_SUKHUMVIT", nameTh: "อโศก", nameEn: "Asok" },
  { key: "BTS_PHROM_PHONG", line: "BTS_SUKHUMVIT", nameTh: "พร้อมพงษ์", nameEn: "Phrom Phong" },
  { key: "BTS_THONG_LO", line: "BTS_SUKHUMVIT", nameTh: "ทองหล่อ", nameEn: "Thong Lo" },
  { key: "BTS_EKKAMAI", line: "BTS_SUKHUMVIT", nameTh: "เอกมัย", nameEn: "Ekkamai" },
  { key: "BTS_PHRA_KHANONG", line: "BTS_SUKHUMVIT", nameTh: "พระโขนง", nameEn: "Phra Khanong" },
  { key: "BTS_ON_NUT", line: "BTS_SUKHUMVIT", nameTh: "อ่อนนุช", nameEn: "On Nut" },
  { key: "BTS_BANG_CHAK", line: "BTS_SUKHUMVIT", nameTh: "บางจาก", nameEn: "Bang Chak" },
  { key: "BTS_PUNNAWITHI", line: "BTS_SUKHUMVIT", nameTh: "ปุณณวิถี", nameEn: "Punnawithi" },
  { key: "BTS_UDOM_SUK", line: "BTS_SUKHUMVIT", nameTh: "อุดมสุข", nameEn: "Udom Suk" },
  { key: "BTS_BANG_NA", line: "BTS_SUKHUMVIT", nameTh: "บางนา", nameEn: "Bang Na" },
  { key: "BTS_BEARING", line: "BTS_SUKHUMVIT", nameTh: "แบริ่ง", nameEn: "Bearing" },
  { key: "BTS_SAMRONG", line: "BTS_SUKHUMVIT", nameTh: "สำโรง", nameEn: "Samrong" },
  { key: "BTS_PU_CHAO", line: "BTS_SUKHUMVIT", nameTh: "ปู่เจ้า", nameEn: "Pu Chao" },
  { key: "BTS_CHANG_ERAWAN", line: "BTS_SUKHUMVIT", nameTh: "ช้างเอราวัณ", nameEn: "Chang Erawan" },
  { key: "BTS_NAVAL_ACADEMY", line: "BTS_SUKHUMVIT", nameTh: "โรงเรียนนายเรือ", nameEn: "Royal Thai Naval Academy" },
  { key: "BTS_PAK_NAM", line: "BTS_SUKHUMVIT", nameTh: "ปากน้ำ", nameEn: "Pak Nam" },
  { key: "BTS_SRINAGARINDRA", line: "BTS_SUKHUMVIT", nameTh: "ศรีนครินทร์", nameEn: "Srinagarindra" },
  { key: "BTS_PHRAEK_SA", line: "BTS_SUKHUMVIT", nameTh: "แพรกษา", nameEn: "Phraek Sa" },
  { key: "BTS_SAI_LUAT", line: "BTS_SUKHUMVIT", nameTh: "สายลวด", nameEn: "Sai Luat" },
  { key: "BTS_KHEHA", line: "BTS_SUKHUMVIT", nameTh: "เคหะฯ", nameEn: "Kheha" },

  // ── BTS สายสีลม ── (สยามเป็นจุดเชื่อม อยู่ในสายสุขุมวิทแล้ว)
  { key: "BTS_NATIONAL_STADIUM", line: "BTS_SILOM", nameTh: "สนามกีฬาแห่งชาติ", nameEn: "National Stadium" },
  { key: "BTS_RATCHADAMRI", line: "BTS_SILOM", nameTh: "ราชดำริ", nameEn: "Ratchadamri" },
  { key: "BTS_SALA_DAENG", line: "BTS_SILOM", nameTh: "ศาลาแดง", nameEn: "Sala Daeng" },
  { key: "BTS_CHONG_NONSI", line: "BTS_SILOM", nameTh: "ช่องนนทรี", nameEn: "Chong Nonsi" },
  { key: "BTS_SAINT_LOUIS", line: "BTS_SILOM", nameTh: "เซนต์หลุยส์", nameEn: "Saint Louis" },
  { key: "BTS_SURASAK", line: "BTS_SILOM", nameTh: "สุรศักดิ์", nameEn: "Surasak" },
  { key: "BTS_SAPHAN_TAKSIN", line: "BTS_SILOM", nameTh: "สะพานตากสิน", nameEn: "Saphan Taksin" },
  { key: "BTS_KRUNG_THON_BURI", line: "BTS_SILOM", nameTh: "กรุงธนบุรี", nameEn: "Krung Thon Buri" },
  { key: "BTS_WONGWIAN_YAI", line: "BTS_SILOM", nameTh: "วงเวียนใหญ่", nameEn: "Wongwian Yai" },
  { key: "BTS_PHO_NIMIT", line: "BTS_SILOM", nameTh: "โพธิ์นิมิตร", nameEn: "Pho Nimit" },
  { key: "BTS_TALAT_PHLU", line: "BTS_SILOM", nameTh: "ตลาดพลู", nameEn: "Talat Phlu" },
  { key: "BTS_WUTTHAKAT", line: "BTS_SILOM", nameTh: "วุฒากาศ", nameEn: "Wutthakat" },
  { key: "BTS_BANG_WA", line: "BTS_SILOM", nameTh: "บางหว้า", nameEn: "Bang Wa" },

  // ── BTS สายสีทอง ── (กรุงธนบุรีเป็นจุดเชื่อม อยู่ในสายสีลมแล้ว)
  { key: "BTS_CHAROEN_NAKHON", line: "BTS_GOLD", nameTh: "เจริญนคร", nameEn: "Charoen Nakhon" },
  { key: "BTS_KHLONG_SAN", line: "BTS_GOLD", nameTh: "คลองสาน", nameEn: "Khlong San" },

  // ── MRT สายสีน้ำเงิน ──
  { key: "MRT_LAK_SONG", line: "MRT_BLUE", nameTh: "หลักสอง", nameEn: "Lak Song" },
  { key: "MRT_BANG_KHAE", line: "MRT_BLUE", nameTh: "บางแค", nameEn: "Bang Khae" },
  { key: "MRT_PHASI_CHAROEN", line: "MRT_BLUE", nameTh: "ภาษีเจริญ", nameEn: "Phasi Charoen" },
  { key: "MRT_PHETKASEM_48", line: "MRT_BLUE", nameTh: "เพชรเกษม 48", nameEn: "Phetkasem 48" },
  { key: "MRT_BANG_WA", line: "MRT_BLUE", nameTh: "บางหว้า", nameEn: "Bang Wa" },
  { key: "MRT_BANG_PHAI", line: "MRT_BLUE", nameTh: "บางไผ่", nameEn: "Bang Phai" },
  { key: "MRT_THA_PHRA", line: "MRT_BLUE", nameTh: "ท่าพระ", nameEn: "Tha Phra" },
  { key: "MRT_ITSARAPHAP", line: "MRT_BLUE", nameTh: "อิสรภาพ", nameEn: "Itsaraphap" },
  { key: "MRT_SANAM_CHAI", line: "MRT_BLUE", nameTh: "สนามไชย", nameEn: "Sanam Chai" },
  { key: "MRT_SAM_YOT", line: "MRT_BLUE", nameTh: "สามยอด", nameEn: "Sam Yot" },
  { key: "MRT_WAT_MANGKON", line: "MRT_BLUE", nameTh: "วัดมังกร", nameEn: "Wat Mangkon" },
  { key: "MRT_HUA_LAMPHONG", line: "MRT_BLUE", nameTh: "หัวลำโพง", nameEn: "Hua Lamphong" },
  { key: "MRT_SAM_YAN", line: "MRT_BLUE", nameTh: "สามย่าน", nameEn: "Sam Yan" },
  { key: "MRT_SI_LOM", line: "MRT_BLUE", nameTh: "สีลม", nameEn: "Si Lom" },
  { key: "MRT_LUMPHINI", line: "MRT_BLUE", nameTh: "ลุมพินี", nameEn: "Lumphini" },
  { key: "MRT_KHLONG_TOEI", line: "MRT_BLUE", nameTh: "คลองเตย", nameEn: "Khlong Toei" },
  { key: "MRT_QSNCC", line: "MRT_BLUE", nameTh: "ศูนย์การประชุมแห่งชาติสิริกิติ์", nameEn: "QSNCC" },
  { key: "MRT_SUKHUMVIT", line: "MRT_BLUE", nameTh: "สุขุมวิท", nameEn: "Sukhumvit" },
  { key: "MRT_PHETCHABURI", line: "MRT_BLUE", nameTh: "เพชรบุรี", nameEn: "Phetchaburi" },
  { key: "MRT_PHRA_RAM_9", line: "MRT_BLUE", nameTh: "พระราม 9", nameEn: "Phra Ram 9" },
  { key: "MRT_THAILAND_CULTURAL", line: "MRT_BLUE", nameTh: "ศูนย์วัฒนธรรมแห่งประเทศไทย", nameEn: "Thailand Cultural Centre" },
  { key: "MRT_HUAI_KHWANG", line: "MRT_BLUE", nameTh: "ห้วยขวาง", nameEn: "Huai Khwang" },
  { key: "MRT_SUTTHISAN", line: "MRT_BLUE", nameTh: "สุทธิสาร", nameEn: "Sutthisan" },
  { key: "MRT_RATCHADAPHISEK", line: "MRT_BLUE", nameTh: "รัชดาภิเษก", nameEn: "Ratchadaphisek" },
  { key: "MRT_LAT_PHRAO", line: "MRT_BLUE", nameTh: "ลาดพร้าว", nameEn: "Lat Phrao" },
  { key: "MRT_PHAHON_YOTHIN", line: "MRT_BLUE", nameTh: "พหลโยธิน", nameEn: "Phahon Yothin" },
  { key: "MRT_CHATUCHAK_PARK", line: "MRT_BLUE", nameTh: "สวนจตุจักร", nameEn: "Chatuchak Park" },
  { key: "MRT_KAMPHAENG_PHET", line: "MRT_BLUE", nameTh: "กำแพงเพชร", nameEn: "Kamphaeng Phet" },
  { key: "MRT_BANG_SUE", line: "MRT_BLUE", nameTh: "บางซื่อ", nameEn: "Bang Sue" },
  { key: "MRT_TAO_POON", line: "MRT_BLUE", nameTh: "เตาปูน", nameEn: "Tao Poon" },
  { key: "MRT_BANG_PHO", line: "MRT_BLUE", nameTh: "บางโพ", nameEn: "Bang Pho" },
  { key: "MRT_BANG_O", line: "MRT_BLUE", nameTh: "บางอ้อ", nameEn: "Bang O" },
  { key: "MRT_BANG_PHLAT", line: "MRT_BLUE", nameTh: "บางพลัด", nameEn: "Bang Phlat" },
  { key: "MRT_SIRINDHORN", line: "MRT_BLUE", nameTh: "สิรินธร", nameEn: "Sirindhorn" },
  { key: "MRT_BANG_YI_KHAN", line: "MRT_BLUE", nameTh: "บางยี่ขัน", nameEn: "Bang Yi Khan" },
  { key: "MRT_BANG_KHUN_NON", line: "MRT_BLUE", nameTh: "บางขุนนนท์", nameEn: "Bang Khun Non" },
  { key: "MRT_FAI_CHAI", line: "MRT_BLUE", nameTh: "ไฟฉาย", nameEn: "Fai Chai" },
  { key: "MRT_CHARAN_13", line: "MRT_BLUE", nameTh: "จรัญฯ 13", nameEn: "Charan 13" },
];

const stationMap = new Map(STATIONS.map((s) => [s.key, s]));
const lineMap = new Map(TRAIN_LINES.map((l) => [l.key, l]));

export function getStation(key: string): Station | undefined {
  return stationMap.get(key);
}

export function getLine(key: string): TrainLine | undefined {
  return lineMap.get(key);
}

/** สถานีจัดกลุ่มตามสาย (เรียงตามลำดับ TRAIN_LINES) — ใช้ทำ optgroup */
export function stationsByLine(): { line: TrainLine; stations: Station[] }[] {
  return TRAIN_LINES.map((line) => ({
    line,
    stations: STATIONS.filter((s) => s.line === line.key),
  }));
}

/** ป้ายกำกับสถานีแบบสั้น เช่น "BTS อนุสาวรีย์ชัยฯ" (ตัดคำ "สาย…" ออก) */
export function stationBadgeLabel(key: string): string {
  const st = getStation(key);
  if (!st) return key;
  const sys = st.line.startsWith("MRT") ? "MRT" : "BTS";
  return `${sys} ${st.nameTh}`;
}
