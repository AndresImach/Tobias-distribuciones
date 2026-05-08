import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.size) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${randomUUID()}.${ext}`;
    let url: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const bytes = await file.arrayBuffer();
      const blob = await put(`products/${filename}`, Buffer.from(bytes), {
        access: "public",
        contentType: file.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      url = blob.url;
    } else {
      // Local dev: write to public/uploads/products/
      const { writeFile, mkdir } = await import("fs/promises");
      const { join } = await import("path");
      const uploadsDir = join(process.cwd(), "public", "uploads", "products");
      await mkdir(uploadsDir, { recursive: true });
      const bytes = await file.arrayBuffer();
      await writeFile(join(uploadsDir, filename), Buffer.from(bytes));
      url = `/uploads/products/${filename}`;
    }

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
