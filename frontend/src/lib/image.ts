// Crop in the browser (HANDOFF.md 4.1). The cropped image is used for on-device OCR and shown
// to the user; it is never uploaded.

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CroppedImage {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
}

const MAX_SIDE = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = src;
  });
}

/** Draw only the crop (longest side <= 1600 px) and return it as a PNG blob. */
export async function cropImage(src: string, area: CropArea): Promise<CroppedImage> {
  const img = await loadImage(src);
  const scale = Math.min(1, MAX_SIDE / Math.max(area.width, area.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width * scale));
  canvas.height = Math.max(1, Math.round(area.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_canvas");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode_failed"))), "image/png"),
  );
  const { width, height } = canvas;
  canvas.width = canvas.height = 0; // release pixels
  return { blob, previewUrl: URL.createObjectURL(blob), width, height };
}
