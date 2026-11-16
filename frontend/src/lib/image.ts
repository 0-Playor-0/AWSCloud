// Crop + re-encode in the browser (HANDOFF.md 4.1): the upload is a fresh JPEG drawn from a
// canvas, so EXIF and everything outside the crop are gone before anything is sent.

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PreparedImage {
  base64: string; // what is sent
  previewUrl: string; // object URL of the same bytes, shown to the user
  width: number;
  height: number;
}

const MAX_SIDE = 1600;
const MAX_MB = 1.4; // contract limit is 1.5 MB decoded

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image_load_failed"));
    img.src = src;
  });
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode_failed"))), "image/png"),
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",", 2)[1] ?? "");
    r.onerror = () => reject(new Error("read_failed"));
    r.readAsDataURL(blob);
  });
}

/** Draw only the crop, then compress to a JPEG with longest side <= 1600 px. */
export async function prepareCrop(src: string, area: CropArea): Promise<PreparedImage> {
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
  const lossless = await canvasBlob(canvas);
  canvas.width = canvas.height = 0; // release pixels
  const { default: compress } = await import("browser-image-compression");
  const jpeg = await compress(new File([lossless], "crop.png", { type: "image/png" }), {
    maxSizeMB: MAX_MB,
    maxWidthOrHeight: MAX_SIDE,
    fileType: "image/jpeg",
    initialQuality: 0.85,
    useWebWorker: false,
  });
  const out = await loadImage(URL.createObjectURL(jpeg));
  return {
    base64: await blobToBase64(jpeg),
    previewUrl: out.src,
    width: out.naturalWidth,
    height: out.naturalHeight,
  };
}
