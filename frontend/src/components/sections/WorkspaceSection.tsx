import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Check,
  CheckSquare,
  FilePlus2,
  FileText,
  LoaderCircle,
  RotateCcw,
  ScanText,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AppLanguage,
  CitizenDocument,
  DocumentKind,
  PurposeId,
  SectionId,
} from '../../types/documents';
import { extractDocument } from '../../lib/api';
import { toBackendDocType } from '../../lib/backendAdapter';
import { readLines } from '../../lib/ocr';
import { sanitizeLines } from '../../lib/sanitize';
import {
  DEMO_PRESETS,
  PURPOSE_OPTIONS,
  stripLongNumbers,
} from '../../utils/comparisonEngine';
import { UI_COPY } from '../../utils/i18n';

interface WorkspaceSectionProps {
  language: AppLanguage;
  purpose: PurposeId;
  onChangePurpose: (p: PurposeId) => void;
  documents: CitizenDocument[];
  onChangeDocuments: React.Dispatch<React.SetStateAction<CitizenDocument[]>>;
  activePresetId: string;
  onSelectPreset: (presetId: string) => void;
  onCompareAndViewReport: () => void;
  isComparing: boolean;
  comparisonError: string | null;
  onJumpTo: (id: SectionId) => void;
}

interface OcrUiState {
  phase: 'idle' | 'reading' | 'ready' | 'sending' | 'sent';
  progress: number;
  removedNumbers: number;
  warnings?: string[];
  error?: string;
}

const DOC_KIND_OPTIONS: { kind: DocumentKind; label: string; shortCode: string }[] = [
  { kind: 'aadhaar', label: 'Aadhaar Card', shortCode: 'AADHAAR' },
  { kind: 'pan', label: 'PAN Card', shortCode: 'PAN' },
  { kind: 'marksheet', label: 'Class 10 Marksheet', shortCode: 'CLASS 10' },
  { kind: 'passbook', label: 'Bank Passbook', shortCode: 'PASSBOOK' },
  { kind: 'passport', label: 'Passport', shortCode: 'PASSPORT' },
  { kind: 'other', label: 'Other / Portal Screenshot', shortCode: 'OTHER / PORTAL' },
];

export const WorkspaceSection: React.FC<WorkspaceSectionProps> = ({
  language,
  purpose,
  onChangePurpose,
  documents,
  onChangeDocuments,
  activePresetId,
  onSelectPreset,
  onCompareAndViewReport,
  isComparing,
  comparisonError,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const t = UI_COPY[language].workspace;
  const purposeCopy = UI_COPY[language].purposes;

  const [openOcrDocId, setOpenOcrDocId] = useState<string | null>(documents[0]?.id ?? null);
  const [ocrStates, setOcrStates] = useState<Record<string, OcrUiState>>({});
  const [ocrConsent, setOcrConsent] = useState<Record<string, boolean>>({});

  const selectedPurposeObj =
    PURPOSE_OPTIONS.find((p) => p.id === purpose) || PURPOSE_OPTIONS[0];

  const updateOcrState = (docId: string, patch: Partial<OcrUiState>) => {
    setOcrStates((current) => ({
      ...current,
      [docId]: {
        ...(current[docId] ?? { phase: 'idle', progress: 0, removedNumbers: 0 }),
        ...patch,
      },
    }));
  };

  const handleFieldChange = (
    docId: string,
    field: 'fullName' | 'dob' | 'parentName' | 'gender',
    value: string
  ) => {
    onChangeDocuments((current) =>
      current.map((document) =>
        document.id === docId ? { ...document, [field]: value, isSample: false } : document
      )
    );
  };

  const handleDocKindChange = (docId: string, nextKind: DocumentKind) => {
    const meta = DOC_KIND_OPTIONS.find((k) => k.kind === nextKind) || DOC_KIND_OPTIONS[0];
    onChangeDocuments((current) =>
      current.map((document) =>
        document.id === docId
          ? { ...document, kind: meta.kind, label: meta.label, shortCode: meta.shortCode }
          : document
      )
    );
  };

  const handleToggleConfirmed = (docId: string) => {
    onChangeDocuments((current) =>
      current.map((document) =>
        document.id === docId ? { ...document, confirmed: !document.confirmed } : document
      )
    );
  };

  const handleToggleOcrLine = (docId: string, lineId: string) => {
    onChangeDocuments((current) =>
      current.map((doc) => {
        if (doc.id !== docId) return doc;
        const updatedLines = doc.ocrLines.map((line) =>
          line.id === lineId ? { ...line, selected: !line.selected } : line
        );
        const toggledLine = updatedLines.find((line) => line.id === lineId);
        if (!toggledLine?.mappedField) {
          return { ...doc, ocrLines: updatedLines };
        }
        const cleanExtracted = toggledLine.text
          .replace(
            /^(Candidate:|Father:|Account Holder:|Nominee \/ Father:|Nominee:|Applicant:|DOB Recorded:|Date of Birth:|DOB:|Year of Birth:|S\/O|D\/O|W\/O)\s*/i,
            ''
          )
          .trim();

        return {
          ...doc,
          ocrLines: updatedLines,
          [toggledLine.mappedField]: toggledLine.selected ? cleanExtracted : '',
        };
      })
    );
  };

  const handleLocalImageUpload = async (docId: string, file: File | undefined) => {
    if (!file) return;
    const previous = documents.find((document) => document.id === docId);
    if (previous?.uploadedImageUrl) URL.revokeObjectURL(previous.uploadedImageUrl);
    const objectUrl = URL.createObjectURL(file);
    setOcrConsent((current) => ({ ...current, [docId]: false }));
    updateOcrState(docId, { phase: 'reading', progress: 0, removedNumbers: 0, error: undefined });
    onChangeDocuments((current) =>
      current.map((document) =>
        document.id === docId
          ? {
              ...document,
              uploadedImageUrl: objectUrl,
              confirmed: false,
              isSample: false,
              fullName: '',
              dob: '',
              parentName: '',
              gender: '',
              ocrLines: [],
            }
          : document
      )
    );

    try {
      const recognized = await readLines(file, (progress) =>
        updateOcrState(docId, { progress: Math.round(progress * 100) })
      );
      const clean = sanitizeLines(recognized);
      if (clean.lines.length === 0) throw new Error('unreadable');
      onChangeDocuments((current) =>
        current.map((document) =>
          document.id === docId && document.uploadedImageUrl === objectUrl
            ? {
                ...document,
                uploadedImageUrl: objectUrl,
                fullName: '',
                dob: '',
                parentName: '',
                gender: '',
                ocrLines: clean.lines.map((line, index) => ({
                  id: `${docId}-ocr-${index + 1}`,
                  text: line.text,
                  confidence: line.confidence,
                  selected: true,
                })),
              }
            : document
        )
      );
      updateOcrState(docId, {
        phase: 'ready',
        progress: 100,
        removedNumbers: clean.removedNumbers,
      });
    } catch {
      updateOcrState(docId, {
        phase: 'idle',
        error: 'The photo could not be read on this device. Try a clearer photo or type the fields instead.',
      });
    }
  };

  const handleSendOcrText = async (document: CitizenDocument) => {
    const lines = document.ocrLines.filter((line) => line.selected);
    if (lines.length === 0) return;
    updateOcrState(document.id, { phase: 'sending', error: undefined });
    const result = await extractDocument(
      toBackendDocType(document.kind),
      lines.map((line) => ({ text: line.text, confidence: line.confidence ?? null })),
    );
    if (!result.ok) {
      updateOcrState(document.id, {
        phase: 'ready',
        error: `${result.error.message} ${result.error.hint}`.trim(),
      });
      return;
    }
    const fields = result.data.fields;
    onChangeDocuments((current) =>
      current.map((item) =>
        item.id === document.id
          ? {
              ...item,
              fullName: fields.name.value ?? '',
              dob: fields.dob.value ?? '',
              parentName: fields.parent_name.value ?? '',
              gender: fields.gender.value ?? '',
              confirmed: false,
              isSample: false,
            }
          : item
      )
    );
    updateOcrState(document.id, {
      phase: 'sent',
      progress: 100,
      warnings: result.data.warnings,
    });
  };

  const handleAddDocument = () => {
    if (documents.length >= 6) return;
    const existingKinds = new Set(documents.map((d) => d.kind));
    const nextOption =
      DOC_KIND_OPTIONS.find((opt) => !existingKinds.has(opt.kind)) || DOC_KIND_OPTIONS[5];
    const newId = `doc-${nextOption.kind}-${Date.now()}`;
    const newDoc: CitizenDocument = {
      id: newId,
      kind: nextOption.kind,
      label: nextOption.label,
      shortCode: nextOption.shortCode,
      fullName: '',
      dob: '',
      parentName: '',
      gender: '',
      confirmed: false,
      isSample: false,
      ocrLines: [],
    };
    onChangeDocuments((current) => [...current, newDoc]);
    setOpenOcrDocId(newId);
  };

  const handleRemoveDocument = (docId: string) => {
    if (documents.length <= 2) return;
    const removed = documents.find((document) => document.id === docId);
    if (removed?.uploadedImageUrl) URL.revokeObjectURL(removed.uploadedImageUrl);
    onChangeDocuments((current) => current.filter((document) => document.id !== docId));
    setOcrConsent((current) => {
      const next = { ...current };
      delete next[docId];
      return next;
    });
    setOcrStates((current) => {
      const next = { ...current };
      delete next[docId];
      return next;
    });
  };

  const handleClearAll = () => {
    documents.forEach((document) => {
      if (document.uploadedImageUrl) URL.revokeObjectURL(document.uploadedImageUrl);
    });
    setOcrConsent({});
    setOcrStates({});
    onChangeDocuments((current) =>
      current.map((document) => ({
        ...document,
        fullName: '',
        dob: '',
        parentName: '',
        gender: '',
        confirmed: false,
        isSample: false,
        uploadedImageUrl: undefined,
        ocrLines: document.ocrLines.map((line) => ({ ...line, selected: false })),
      }))
    );
  };

  const totalLongNumbersDetected = documents.reduce((sum, doc) => {
    const combined = `${doc.fullName} ${doc.dob} ${doc.parentName} ${doc.gender}`;
    return sum + stripLongNumbers(combined).redactedCount;
  }, 0);

  return (
    <section
      id="workspace"
      data-section="workspace"
      className="py-12 sm:py-14 border-b border-[#14213d]/15"
    >
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="font-mono text-[11px] tracking-[0.1em] text-[#c8322b] uppercase font-semibold">
          {t.kicker}
        </p>
        <h2 className="mt-2 font-anton uppercase text-[28px] sm:text-[34px] leading-[1.08] tracking-[0.02em] text-[#14213d] [text-wrap:balance]">
          {t.headingBefore}
          <span className="text-[#c8322b]">{t.headingRed}</span>.
        </h2>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#14213d]/80">
          {t.disclaimer}
        </p>
      </motion.div>

      {/* Step A: 3 Exact Backend Purposes */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#14213d]">
            {t.purposeLabel}
          </span>
          <span className="font-mono text-[10.5px] text-[#14213d]/60">
            {t.purposeHint}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {PURPOSE_OPTIONS.map((opt) => {
            const active = purpose === opt.id;
            const localized = purposeCopy[opt.id];
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangePurpose(opt.id)}
                className={`text-left border p-3.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8322b] ${
                  active
                    ? 'border-[#14213d] bg-[#14213d] text-[#f6f1e7]'
                    : 'border-[#14213d]/20 bg-[#fbf8f2] text-[#14213d] hover:border-[#14213d]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-sans text-[15px] font-bold">
                    {localized.title}
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </div>
                <p
                  className={`mt-1 text-xs ${
                    active ? 'text-[#f6f1e7]/80' : 'text-[#14213d]/65'
                  }`}
                >
                  {localized.shortHint}
                </p>
              </button>
            );
          })}
        </div>

        <p className="mt-2.5 text-xs text-[#14213d]/75 border-b border-[#14213d]/10 pb-3">
          <strong className="font-semibold text-[#14213d]">Rule applied:</strong>{' '}
          {selectedPurposeObj.anchorRule}
        </p>
      </div>

      {/* Step B: Exact Backend Sample Sets (Kavya, Anita, Arjun) */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#14213d]">
            {t.sampleLabel}
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 font-mono text-[11px] text-[#c8322b] hover:underline cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            <span>{t.clearFields}</span>
          </button>
        </div>
        <p className="text-[12.5px] text-[#14213d]/70 mb-2.5">
          {t.sampleHint}
        </p>

        <div className="grid grid-cols-1 gap-2">
          {DEMO_PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`border px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#c8322b] bg-[#c8322b]/[0.07] text-[#14213d]'
                    : 'border-[#14213d]/20 bg-[#fbf8f2] text-[#14213d]/85 hover:border-[#14213d]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[12px] font-semibold">
                    {preset.label}
                  </span>
                  <span className="border border-[#14213d]/25 bg-[#f6f1e7] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-wider text-[#14213d]/70">
                    SAMPLE
                  </span>
                </div>
                <div className="mt-0.5 text-[11.5px] text-[#14213d]/70">
                  {preset.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auto-redaction safeguard indicator */}
      {totalLongNumbersDetected > 0 && (
        <div className="mt-4 flex items-center gap-2 border border-[#1f7a4d]/40 bg-[#1f7a4d]/[0.06] px-3 py-2 text-xs text-[#1f7a4d]">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {totalLongNumbersDetected} long ID number(s) detected and will be removed before text comparison.
          </span>
        </div>
      )}

      {/* Step C: 2–6 Document Cards */}
      <div className="mt-6 space-y-4">
        {documents.map((doc, idx) => {
          const isOcrOpen = openOcrDocId === doc.id;
          const ocrState = ocrStates[doc.id];

          return (
            <div
              key={doc.id}
              className="border border-[#14213d]/25 bg-[#fbf8f2] transition-colors"
            >
              {/* Card Header with selectable Document Type (including Other / Portal Screenshot) */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#14213d]/15 bg-[#f6f1e7]/70 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText className="h-4 w-4 text-[#14213d]/70 shrink-0" aria-hidden="true" />
                  <select
                    aria-label={`Document ${idx + 1} type`}
                    value={doc.kind}
                    onChange={(e) =>
                      handleDocKindChange(doc.id, e.target.value as DocumentKind)
                    }
                    className="bg-transparent font-sans text-base font-bold text-[#14213d] focus:outline-none cursor-pointer border-b border-dashed border-[#14213d]/30 pr-1"
                  >
                    {DOC_KIND_OPTIONS.map((opt) => (
                      <option key={opt.kind} value={opt.kind}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <span className="font-mono text-[10px] tracking-wider text-[#14213d]/55 uppercase">
                    · DOC 0{idx + 1}
                  </span>
                  {doc.isSample && (
                    <span className="border border-[#14213d]/20 bg-[#fbf8f2] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#14213d]/65">
                      SAMPLE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpenOcrDocId(isOcrOpen ? null : doc.id)}
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-[#14213d] hover:text-[#c8322b] cursor-pointer"
                  >
                    <ScanText className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{isOcrOpen ? 'Hide OCR review' : 'OCR lines & review'}</span>
                  </button>

                  {documents.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(doc.id)}
                      aria-label={`Remove ${doc.label}`}
                      className="text-[#14213d]/45 hover:text-[#c8322b] cursor-pointer p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* On-device OCR review drawer */}
              {isOcrOpen && (
                <div className="border-b border-[#14213d]/15 bg-[#f6f1e7]/45 px-4 py-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider text-[#14213d]/70">
                      On-device OCR &amp; review (photo never leaves this device)
                    </span>
                    <label className="inline-flex items-center gap-1.5 border border-[#14213d]/30 bg-[#fbf8f2] px-2.5 py-1 font-mono text-[10.5px] font-medium text-[#14213d] hover:border-[#14213d] cursor-pointer">
                      <Upload className="h-3 w-3" aria-hidden="true" />
                      <span>Choose photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        aria-label={`Choose photo for ${doc.label}`}
                        disabled={ocrState?.phase === 'reading'}
                        className="sr-only"
                        onChange={(event) => {
                          void handleLocalImageUpload(doc.id, event.target.files?.[0]);
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-start">
                    <div className="sm:col-span-2 border border-[#14213d]/20 bg-[#fbf8f2] p-2.5">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-mono text-[9.5px] text-[#14213d]/60 uppercase">
                          Local photo preview
                        </span>
                        <span className="font-mono text-[8.5px] uppercase text-[#1f7a4d]">
                          Never uploaded
                        </span>
                      </div>

                      {doc.uploadedImageUrl ? (
                        <div className="relative overflow-hidden border border-[#14213d]/20 h-28 bg-[#ebe3d3]">
                          <img
                            src={doc.uploadedImageUrl}
                            alt={`Uploaded preview for ${doc.label}`}
                            data-testid="ocr-preview"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="relative border border-dashed border-[#14213d]/30 bg-[#f6f1e7] p-2.5 h-28 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] font-semibold text-[#14213d]/70">
                              {doc.shortCode} SCAN
                            </span>
                            <span className="h-2 w-8 bg-[#14213d]/15" />
                          </div>
                          <div className="border border-[#c8322b]/70 bg-[#fbf8f2]/90 p-1.5">
                            <div className="font-mono text-[9.5px] text-[#14213d] truncate">
                              {doc.fullName || 'Name line'}
                            </div>
                            <div className="font-mono text-[9px] text-[#14213d]/70 truncate">
                              {doc.dob || 'DOB line'}
                            </div>
                          </div>
                          <span className="font-mono text-[8.5px] text-[#14213d]/50">
                            The photo stays in this browser.
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-3 space-y-2">
                      {ocrState?.phase === 'reading' && (
                        <div
                          role="status"
                          data-testid="ocr-progress"
                          className="border border-[#14213d]/20 bg-[#fbf8f2] px-3 py-2 text-xs text-[#14213d]/75"
                        >
                          Reading text on this device… {ocrState.progress}%
                          <div className="mt-1.5 h-1 bg-[#14213d]/10">
                            <div
                              className="h-full bg-[#c8322b] transition-[width]"
                              style={{ width: `${ocrState.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {ocrState?.error && (
                        <div
                          role="alert"
                          className="border border-[#c8322b]/40 bg-[#c8322b]/[0.05] px-3 py-2 text-xs leading-relaxed text-[#8f2520]"
                        >
                          {ocrState.error}
                        </div>
                      )}

                      {ocrState && ocrState.removedNumbers > 0 && (
                        <div
                          role="status"
                          className="border border-[#1f7a4d]/35 bg-[#1f7a4d]/[0.05] px-3 py-2 text-xs text-[#1f7a4d]"
                        >
                          {ocrState.removedNumbers} long identifier number(s) removed before text can be sent.
                        </div>
                      )}

                      {ocrState?.warnings && ocrState.warnings.length > 0 && (
                        <div role="status" className="border border-[#e9a23b]/60 bg-[#e9a23b]/[0.08] px-3 py-2 text-xs leading-relaxed text-[#7a5200]">
                          Review low-confidence fields: {ocrState.warnings.map((warning) => warning.replace('_', ' ')).join(', ')}.
                        </div>
                      )}

                      <p className="font-mono text-[10px] text-[#14213d]/65">
                        Confirm what we read (untick noisy lines):
                      </p>
                      <div data-testid="ocr-lines" className="space-y-1.5">
                        {doc.ocrLines.map((line) => (
                          <label
                            key={line.id}
                            className="flex items-start gap-2 border border-[#14213d]/15 bg-[#fbf8f2] px-2.5 py-1.5 text-xs cursor-pointer hover:border-[#14213d]/35"
                          >
                            <input
                              type="checkbox"
                              checked={line.selected}
                              onChange={() => handleToggleOcrLine(doc.id, line.id)}
                              className="mt-0.5 accent-[#14213d] cursor-pointer"
                            />
                            <span
                              className={`font-mono text-[11px] leading-snug ${
                                line.selected
                                  ? 'text-[#14213d]'
                                  : 'text-[#14213d]/45 line-through'
                              }`}
                            >
                              {line.text}
                            </span>
                          </label>
                        ))}
                        {doc.ocrLines.length === 0 && (
                          <p className="border border-dashed border-[#14213d]/20 bg-[#fbf8f2]/60 px-3 py-2 font-mono text-[10.5px] text-[#14213d]/60">
                            Choose a photo to read its text on this device.
                          </p>
                        )}
                      </div>

                      {doc.uploadedImageUrl && (
                        <div className="border-t border-[#14213d]/10 pt-2.5">
                          <p className="text-[11px] leading-relaxed text-[#14213d]/75">
                            Your photo never leaves this device. Only the selected, sanitized text is sent. It is processed on AWS in Sydney, Australia, and not stored.
                          </p>
                          <label className="mt-2 flex items-start gap-2 text-[11px] leading-relaxed text-[#14213d]/75">
                            <input
                              type="checkbox"
                              checked={ocrConsent[doc.id] ?? false}
                              onChange={(event) =>
                                setOcrConsent((current) => ({
                                  ...current,
                                  [doc.id]: event.target.checked,
                                }))
                              }
                              className="mt-0.5 accent-[#14213d]"
                            />
                            <span>I understand and consent to sending the selected text.</span>
                          </label>
                          <button
                            type="button"
                            data-testid="send-ocr-text"
                            onClick={() => void handleSendOcrText(doc)}
                            disabled={
                              !ocrConsent[doc.id] ||
                              !doc.ocrLines.some((line) => line.selected) ||
                              ocrState?.phase === 'reading' ||
                              ocrState?.phase === 'sending'
                            }
                            className="mt-2 inline-flex items-center gap-1.5 bg-[#14213d] px-3.5 py-2 text-[11px] font-semibold text-[#f6f1e7] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            {ocrState?.phase === 'sending' && (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            )}
                            {ocrState?.phase === 'sent' ? 'Text sent — fields updated' : 'Send confirmed text'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Editable Core Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                <div>
                  <label
                    htmlFor={`${doc.id}-name`}
                    className="block font-mono text-[10.5px] uppercase tracking-wider text-[#14213d]/70 mb-1"
                  >
                    Full Name
                  </label>
                  <input
                    id={`${doc.id}-name`}
                    type="text"
                    value={doc.fullName}
                    placeholder="e.g. RAVI KUMAR K"
                    onChange={(e) => handleFieldChange(doc.id, 'fullName', e.target.value)}
                    className="w-full border border-[#14213d]/25 bg-[#f6f1e7]/65 px-3 py-2 font-mono text-xs text-[#14213d] focus:border-[#14213d] focus:bg-[#fbf8f2] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${doc.id}-dob`}
                    className="block font-mono text-[10.5px] uppercase tracking-wider text-[#14213d]/70 mb-1"
                  >
                    Date of Birth
                  </label>
                  <input
                    id={`${doc.id}-dob`}
                    type="text"
                    value={doc.dob}
                    placeholder="DD/MM/YYYY or YYYY"
                    onChange={(e) => handleFieldChange(doc.id, 'dob', e.target.value)}
                    className="w-full border border-[#14213d]/25 bg-[#f6f1e7]/65 px-3 py-2 font-mono text-xs text-[#14213d] focus:border-[#14213d] focus:bg-[#fbf8f2] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${doc.id}-parent`}
                    className="block font-mono text-[10.5px] uppercase tracking-wider text-[#14213d]/70 mb-1"
                  >
                    Parent / Guardian&apos;s Name
                  </label>
                  <input
                    id={`${doc.id}-parent`}
                    type="text"
                    value={doc.parentName}
                    placeholder="e.g. Suresh Menon Nair"
                    onChange={(e) => handleFieldChange(doc.id, 'parentName', e.target.value)}
                    className="w-full border border-[#14213d]/25 bg-[#f6f1e7]/65 px-3 py-2 font-mono text-xs text-[#14213d] focus:border-[#14213d] focus:bg-[#fbf8f2] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`${doc.id}-gender`}
                    className="block font-mono text-[10.5px] uppercase tracking-wider text-[#14213d]/70 mb-1"
                  >
                    Gender
                  </label>
                  <select
                    id={`${doc.id}-gender`}
                    value={doc.gender}
                    onChange={(e) => handleFieldChange(doc.id, 'gender', e.target.value)}
                    className="w-full border border-[#14213d]/25 bg-[#f6f1e7]/65 px-3 py-2 font-mono text-xs text-[#14213d] focus:border-[#14213d] focus:bg-[#fbf8f2] focus:outline-none"
                  >
                    <option value="">Not listed / Select</option>
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                    <option value="O">Other (O)</option>
                  </select>
                </div>
              </div>

              {/* Step 2: Confirm every field before comparing */}
              <div className="flex items-center justify-between border-t border-[#14213d]/10 bg-[#f6f1e7]/40 px-4 py-2">
                <label className="inline-flex items-center gap-2 text-xs text-[#14213d]/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doc.confirmed}
                    onChange={() => handleToggleConfirmed(doc.id)}
                    className="accent-[#1f7a4d] cursor-pointer"
                  />
                  <span>{t.confirmFieldCheck}</span>
                </label>
                {doc.confirmed && (
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#1f7a4d]">
                    <CheckSquare className="h-3 w-3" aria-hidden="true" />
                    {t.confirmedLabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Document (2–6) & Run Comparison Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAddDocument}
          disabled={documents.length >= 6}
          className="inline-flex items-center gap-2 border border-[#14213d]/30 bg-[#fbf8f2] px-4 py-2.5 text-xs font-semibold text-[#14213d] transition-colors hover:border-[#14213d] disabled:opacity-45 cursor-pointer"
        >
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          <span>
            {t.addDocBtn} ({documents.length}/6)
          </span>
        </button>

        <button
          type="button"
          onClick={onCompareAndViewReport}
          disabled={isComparing}
          className="inline-flex items-center gap-2 bg-[#14213d] px-5 py-2.5 text-xs font-semibold tracking-wide text-[#f6f1e7] transition-colors hover:bg-[#1e3056] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8322b] cursor-pointer disabled:cursor-wait disabled:opacity-65"
        >
          {isComparing && <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          <span>{isComparing ? 'Checking…' : t.compareBtn}</span>
        </button>
      </div>

      {comparisonError && (
        <div
          role="alert"
          className="mt-3 border border-[#c8322b]/45 bg-[#c8322b]/[0.06] px-3.5 py-3 text-xs leading-relaxed text-[#8f2520]"
        >
          {comparisonError}
        </div>
      )}
    </section>
  );
};
