import { NextRequest, NextResponse } from "next/server";
import { cloudinary } from "@/lib/cloudinary";
import type { UploadApiResponse } from "cloudinary";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const folder = (formData.get("folder") as string) ?? "tastelists";

    // Support multiple files (key "files") or single file (key "file")
    const multiple = formData.getAll("files") as File[];
    const single = formData.get("file") as File | null;
    const files = multiple.length > 0 ? multiple : single ? [single] : [];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Invalid or missing image file(s)" },
        { status: 400 }
      );
    }

    const imgUrls: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}` },
          { status: 400 }
        );
      }

      const fileBuffer = await file.arrayBuffer();
      const mimeType = file.type;
      const base64Data = Buffer.from(fileBuffer).toString("base64");
      const fileUri = `data:${mimeType};base64,${base64Data}`;

      const result = await cloudinary.uploader.upload(fileUri, {
        invalidate: true,
        resource_type: "auto",
        filename_override: file.name,
        folder,
        use_filename: true,
      });

      imgUrls.push((result as UploadApiResponse).secure_url);
    }

    return NextResponse.json({
      success: true,
      imgUrl: imgUrls[0],
      imgUrls,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
