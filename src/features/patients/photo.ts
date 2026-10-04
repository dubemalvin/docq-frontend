import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** The version in the URL changes whenever the photo does, so the browser never shows a stale one. */
export const photoUrl = (patientId: string, version: string | null) =>
  `/api/patients/${patientId}/photo/?v=${encodeURIComponent(version ?? "")}`;

/** Shrinks a phone photo (often 5-12 MB) to a small JPEG. Re-encoding on a canvas
 *  also strips EXIF metadata such as the GPS location the photo was taken at. */
export async function resizeImage(file: File, maxSize = 640): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Couldn't read that image. Please use a JPG, PNG or WebP photo.");
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that image."))),
      "image/jpeg",
      0.85,
    ),
  );
}

export function useUploadPhoto(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", await resizeImage(file), "photo.jpg");
      return api(`/patients/${patientId}/photo/`, { method: "POST", body: form });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useRemovePhoto(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/patients/${patientId}/photo/`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });
}