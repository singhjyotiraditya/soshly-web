/**
 * Upload place photos via Cloudinary (POST /api/upload) and return download URLs.
 */
export async function uploadPlacePhotos(
  files: File[],
  _userId: string,
  tasteListId: string
): Promise<string[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  formData.set("folder", `tastelists/placePhotos/${tasteListId}`);
  files.forEach((file) => formData.append("files", file));

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Upload failed");
  }

  const data = (await res.json()) as { imgUrls?: string[]; imgUrl?: string };
  return data.imgUrls ?? (data.imgUrl ? [data.imgUrl] : []);
}
