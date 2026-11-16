import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

import { ConsentDialog } from "@/components/ConsentDialog";
import { ErrorAlert } from "@/components/ErrorAlert";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { extract } from "@/lib/api";
import { describeError, type ShownError } from "@/lib/errors";
import { cropImage, type CroppedImage } from "@/lib/image";
import { readLines } from "@/lib/ocr";
import { sanitizeLines } from "@/lib/sanitize";
import { t } from "@/lib/strings";
import type { DocType, ExtractResponse } from "@/lib/types";

interface Props {
  docType: DocType;
  consented: boolean;
  onConsent: () => void;
  onExtracted: (res: ExtractResponse) => void;
  onCapReached: () => void;
}

interface ReadText {
  lines: string[];
  keep: boolean[];
  removedNumbers: number;
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
  const [cropped, setCropped] = useState<CroppedImage | null>(null);
  const [text, setText] = useState<ReadText | null>(null);
  const [progress, setProgress] = useState<number | null>(null); // on-device reading, 0..100
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<ShownError | null>(null);
  const [askConsent, setAskConsent] = useState(false);

  // Free object URLs (the photo and the crop) when replaced or on unmount.
  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);
  useEffect(() => () => { if (cropped) URL.revokeObjectURL(cropped.previewUrl); }, [cropped]);

  const busy = progress !== null || sending;
  const linesToSend = text ? text.lines.filter((_, i) => text.keep[i]) : [];

  const pick = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setCropped(null);
    setText(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setSrc(URL.createObjectURL(file));
  };

  const recrop = () => {
    setCropped(null);
    setText(null);
  };

  const readCrop = async () => {
    if (!src || !area) return;
    setError(null);
    setProgress(0);
    try {
      const img = await cropImage(src, area);
      setCropped(img);
      const raw = await readLines(img.blob, (p) => {
        if (p.status === "recognizing text") setProgress(Math.round(p.progress * 100));
      });
      const clean = sanitizeLines(raw);
      if (clean.lines.length === 0) {
        setError(describeError({ code: "unreadable", message: "", hint: "" }));
        setCropped(null);
      } else {
        setText({ ...clean, keep: clean.lines.map(() => true) });
      }
    } catch {
      setCropped(null);
      setError({ code: "ocr_failed", message: t("photo.ocrFailed"), hint: t("photo.ocrFailedHint") });
    } finally {
      setProgress(null);
    }
  };

  const send = () => (consented ? upload() : setAskConsent(true));

  const upload = async () => {
    if (linesToSend.length === 0) return;
    setSending(true);
    setError(null);
    const res = await extract(docType, linesToSend);
    setSending(false);
    if (res.ok) return onExtracted(res.data);
    if (res.error.code === "daily_cap_reached") return onCapReached();
    if (res.error.code === "id_number_detected") recrop();
    setError(describeError(res.error));
  };

  return (
    <div className="flex flex-col gap-4">
      <Alert variant="info">
        <p>{t("photo.guidance")}</p>
        {docType === "aadhaar" && <p className="mt-2 font-semibold">{t("photo.aadhaarGuidance")}</p>}
      </Alert>

      {!cropped && (
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("photo.pick")}</span>
          <input type="file" accept="image/*" className="min-h-11 text-sm" disabled={busy}
            onChange={(e) => pick(e.target.files?.[0])} />
        </label>
      )}

      {src && !cropped && (
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
            <div className="flex gap-1" role="group" aria-label={t("photo.shape")}>
              {ASPECTS.map((a) => (
                <Button key={a.label} size="sm" variant={aspect === a.value ? "default" : "outline"}
                  aria-pressed={aspect === a.value} onClick={() => setAspect(a.value)}>{a.label}</Button>
              ))}
            </div>
          </div>
          <Button onClick={readCrop} disabled={!area || busy}>{t("photo.useCrop")}</Button>
        </>
      )}

      {cropped && (
        <figure className="flex flex-col gap-2">
          <figcaption className="text-sm font-semibold">{t("photo.previewTitle")}</figcaption>
          <img src={cropped.previewUrl} alt={t("photo.previewAlt")} data-testid="crop-preview"
            className="max-h-48 w-full rounded-md border border-ink/20 object-contain" />
        </figure>
      )}

      {progress !== null && (
        <div className="flex flex-col gap-1" role="status">
          <p className="text-sm">{t("photo.reading")}</p>
          <Progress value={progress} aria-label={t("photo.reading")} />
        </div>
      )}

      {text && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">{t("photo.textTitle")}</legend>
          <p className="text-sm text-ink/70">{t("photo.textHelp")}</p>
          {text.removedNumbers > 0 && (
            <Alert variant="warning" role="status">{t("photo.numbersRemoved", { n: text.removedNumbers })}</Alert>
          )}
          <ul className="flex flex-col gap-1" data-testid="ocr-lines">
            {text.lines.map((line, i) => (
              <li key={i}>
                <label className="flex min-h-11 items-center gap-3 rounded border border-ink/15 bg-white px-3">
                  <input type="checkbox" className="size-5 shrink-0" checked={text.keep[i]}
                    onChange={(e) => setText({ ...text, keep: text.keep.map((k, j) => (j === i ? e.target.checked : k)) })} />
                  <span className={`break-all font-mono text-sm ${text.keep[i] ? "" : "text-ink/70 line-through"}`}>{line}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button onClick={send} disabled={busy || linesToSend.length === 0}>
              {sending ? t("photo.sending") : t("photo.send")}
            </Button>
            <Button variant="outline" onClick={recrop} disabled={busy}>{t("photo.recrop")}</Button>
          </div>
        </fieldset>
      )}

      <div aria-live="polite" className="sr-only">{sending ? t("photo.sending") : ""}</div>
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
