const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;
const SKIP_BELOW_BYTES = 500 * 1024; // ไฟล์เล็กอยู่แล้วไม่ต้องบีบซ้ำ

/**
 * ย่อขนาด + บีบอัดรูปฝั่งเบราว์เซอร์ก่อนอัปโหลด
 * จำเป็นเพราะ Netlify Functions จำกัดขนาด request ไว้ที่ ~6MB —
 * รูปถ่ายจากมือถือหลายรูปรวมกันมักเกินเพดานนี้ได้ง่าย
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < SKIP_BELOW_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

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
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // เบราว์เซอร์เก่า/ไม่รองรับ API ที่ใช้ — ส่งไฟล์ต้นฉบับแทน
    return file;
  }
}

export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
