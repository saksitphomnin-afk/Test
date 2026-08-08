// บีบอัดรูปฝั่ง client ก่อนอัปโหลด (ย่อขนาด + ลด quality) — รูปจากมือถือมักหลายเมกาไบต์ต่อรูป
// อัปโหลดทีละหลายรูปพร้อมกันจะโดนลิมิตขนาด request ของแพลตฟอร์ม (เช่น Vercel serverless function
// จำกัด request body ไว้ที่ระดับไม่กี่ MB ซึ่งปรับผ่าน next.config.ts ไม่ได้ เพราะเป็นลิมิตชั้น
// infrastructure ไม่ใช่ของ Next.js) จึงต้องย่อรูปให้เล็กลงมากพอตั้งแต่ต้นทาง
const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;

    // ถ้าบีบแล้วไม่ได้เล็กลงจริง (เช่นรูปเล็กอยู่แล้ว) ใช้ไฟล์เดิมแทน กันกรณี re-encode แล้วใหญ่ขึ้น
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    // เบราว์เซอร์ไม่รองรับ createImageBitmap/canvas หรือรูปเสีย — ใช้ไฟล์ต้นฉบับแทน
    return file;
  }
}
