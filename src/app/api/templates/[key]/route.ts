export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** เสิร์ฟไฟล์แบบฟอร์มสัญญาที่เก็บใน Netlify Blobs (คีย์แบบสุ่ม เดายาก) */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("contract-templates");
    const res = await store.getWithMetadata(key, { type: "arrayBuffer" });
    if (!res) return new Response("Not found", { status: 404 });

    const contentType =
      (res.metadata?.contentType as string) || "application/pdf";

    return new Response(new Uint8Array(res.data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
