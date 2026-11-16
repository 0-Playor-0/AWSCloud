import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { ConsentDialog } from "@/components/ConsentDialog";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { extract } from "@/lib/api";
import { describeError, type ShownError } from "@/lib/errors";
import { prepareCrop, type PreparedImage } from "@/lib/image";
import { t } from "@/lib/strings";
import type { DocType, ExtractResponse } from "@/lib/types";

interface Props {
  docType: DocType;
  consented: boolean;
  onConsent: () => void;
  onExtracted: (res: ExtractResponse) => void;
  onCapReached: () => void;
}

const ASPECTS = [
  { label: "3 : 1", value: 3 },
  { label: "4 : 3", value: 4 / 3 },
];

export function PhotoInput({ docType, consented, onConsent, onExtracted, onCapReached }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(ASPECTS[0].value);
  const [area, setArea] = useState<Area | null>(null);
  const [prepared, setPrepared] = useState<PreparedImage | null>(null);
  const [busy, setBusy] = useState<"preparing" | "sending" | null>(null);
  const [error, setError] = useState<ShownError | null>(null);
  const [askConsent, setAskConsent] = useState(false);

  // Free object URLs (the photo and the preview) when replaced or on unmount.
  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);
  useEffect(() => () => { if (prepared) URL.revokeObjectURL(prepared.previewUrl); }, [prepared]);

  const pick = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setPrepared(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setSrc(URL.createObjectURL(file));
  };

  const applyCrop = async () => {
    if (!src || !area) return;
    setBusy("preparing");
    setError(null);
    try {
      setPrepared(await prepareCrop(src, area));
    } catch {
      setError({ code: "image_load_failed", message: t("photo.loadFailed"), hint: "" });
    } finally {
      setBusy(null);
    }
  };

  const send = () => (consented ? upload() : setAskConsent(true));

  const upload = async () => {
    if (!prepared) return;
    setBusy("sending");
    setError(null);
    const res = await extract(docType, prepared.base64);
    setBusy(null);
    if (res.ok) return onExtracted(res.data);
    if (res.error.code === "daily_cap_reached") return onCapReached();
    if (res.error.code === "id_number_detected" || res.error.code === "image_too_large") setPrepared(null);
    setError(describeError(res.error));
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        <p>{t("photo.guidance")}</p>
        {docType === "aadhaar" && <p className="mt-2 font-semibold">{t("photo.aadhaarGuidance")}</p>}
      </Alert>

      {!prepared && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("photo.pick")}</span>
          <input type="file" accept="image/*" className="min-h-11 text-sm"
            onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      )}

      {src && !prepared && (
        <>
          <div className="relative h-64 w-full overflow-hidden rounded-md bg-ink/80">
            <Cropper image={src} crop={crop} zoom={zoom} aspect={aspect} onCropChange={setCrop}
              onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-1 items-center gap-2 text-sm">
              {t("photo.zoom")}
              <input type="range" min={1} max={4} step={0.05} value={zoom} className="min-h-11 flex-1"
                onChange={(e) => setZoom(Number(e.target.value))} />
            </label>
            <div className="flex gap-1" role="group" aria-label="Crop shape">
              {ASPECTS.map((a) => (
                <Button key={a.label} size="sm" variant={aspect === a.value ? "default" : "outline"}
                  aria-pressed={aspect === a.value} onClick={() => setAspect(a.value)}>{a.label}</Button>
              ))}
            </div>
          </div>
          <Button onClick={applyCrop} disabled={!area || busy !== null}>
            {busy === "preparing" ? t("photo.preparing") : t("photo.useCrop")}
          </Button>
        </>
      )}

      {prepared && (
        <figure className="flex flex-col gap-2">
          <figcaption className="text-sm font-semibold">{t("photo.previewTitle")}</figcaption>
          <img src={prepared.previewUrl} alt={t("photo.previewAlt")} data-testid="upload-preview"
            className="max-h-64 w-full rounded-md border border-ink/20 object-contain" />
          <p className="font-mono text-xs text-ink/70">{prepared.width} × {prepared.height} px · JPEG</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={send} disabled={busy !== null}>
              {busy === "sending" ? t("photo.sending") : t("photo.send")}
            </Button>
            <Button variant="outline" onClick={() => setPrepared(null)} disabled={busy !== null}>
              {t("photo.recrop")}
            </Button>
          </div>
        </figure>
      )}

      <div aria-live="polite" className="sr-only">{busy ? t(busy === "sending" ? "photo.sending" : "photo.preparing") : ""}</div>
      {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}

      <ConsentDialog
        open={askConsent}
        onCancel={() => setAskConsent(false)}
        onAgree={() => {
          setAskConsent(false);
          onConsent();
          void upload();
        }}
      />
    </div>
  );
}
