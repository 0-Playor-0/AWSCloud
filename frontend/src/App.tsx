/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { TopMasthead } from './components/TopMasthead';
import { NewspaperBackground } from './components/NewspaperBackground';
import { HeroSection } from './components/sections/HeroSection';
import { ProblemSection } from './components/sections/ProblemSection';
import { HowItWorksSection } from './components/sections/HowItWorksSection';
import { WorkspaceSection } from './components/sections/WorkspaceSection';
import { ReportSection } from './components/sections/ReportSection';
import { AppLanguage, CitizenDocument, ComparisonReport, PurposeId, SectionId } from './types/documents';
import { compareDocuments, fetchStats } from './lib/api';
import { ComparisonInputError, prepareComparison, toComparisonReport } from './lib/backendAdapter';
import type { StatsResponse } from './lib/backendTypes';
import { buildComparisonReport, DEMO_PRESETS } from './utils/comparisonEngine';
import { UI_COPY } from './utils/i18n';

export default function App() {
  const initialPreset = DEMO_PRESETS[0];

  const [language, setLanguage] = useState<AppLanguage>('en');
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [activePresetId, setActivePresetId] = useState<string>(initialPreset.id);
  const [purpose, setPurpose] = useState<PurposeId>(initialPreset.purpose);
  const [documents, setDocuments] = useState<CitizenDocument[]>(
    () => structuredClone(initialPreset.documents)
  );
  const [checksRun, setChecksRun] = useState<number>(0);
  const [mismatchesFound, setMismatchesFound] = useState<number>(0);
  const [backendStats, setBackendStats] = useState<StatsResponse | null>(null);
  const [backendReport, setBackendReport] = useState<ComparisonReport | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Track active section in viewport to dynamically shift emphasis across background cartoons
  useEffect(() => {
    const sectionIds: SectionId[] = ['hero', 'problem', 'how-it-works', 'workspace', 'report'];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('data-section') as SectionId | null;
          if (id) setActiveSection(id);
        }
      },
      {
        rootMargin: '-20% 0px -45% 0px',
        threshold: [0.05, 0.25, 0.5],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    void fetchStats().then((result) => {
      if (active && result.ok) setBackendStats(result.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const previewReport = useMemo(
    () => buildComparisonReport(documents, purpose),
    [documents, purpose]
  );
  const report = backendReport ?? previewReport;

  const handleJumpTo = (id: SectionId) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = DEMO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    documents.forEach((document) => {
      if (document.uploadedImageUrl) URL.revokeObjectURL(document.uploadedImageUrl);
    });
    setActivePresetId(preset.id);
    setPurpose(preset.purpose);
    setDocuments(structuredClone(preset.documents));
    setBackendReport(null);
    setComparisonError(null);
  };

  const handleChangePurpose = (nextPurpose: PurposeId) => {
    setPurpose(nextPurpose);
    setBackendReport(null);
    setComparisonError(null);
  };

  const handleChangeDocuments: Dispatch<SetStateAction<CitizenDocument[]>> = (nextDocs) => {
    setActivePresetId('custom');
    setDocuments(nextDocs);
    setBackendReport(null);
    setComparisonError(null);
  };

  const handleRunComparison = async () => {
    setIsComparing(true);
    setComparisonError(null);
    try {
      const prepared = prepareComparison(purpose, documents);
      const result = await compareDocuments(prepared);
      if (!result.ok) {
        setComparisonError(`${result.error.message} ${result.error.hint}`.trim());
        return;
      }
      setBackendReport(
        toComparisonReport(result.data, documents, purpose, prepared.redactedNumberCount)
      );
      setChecksRun((prev) => prev + 1);
      if (result.data.summary.status === 'mismatches_found') {
        setMismatchesFound((prev) => prev + 1);
      }
      void fetchStats().then((stats) => {
        if (stats.ok) setBackendStats(stats.data);
      });
      handleJumpTo('report');
    } catch (error) {
      setComparisonError(
        error instanceof ComparisonInputError
          ? error.message
          : 'The documents could not be compared. Please check the fields and try again.'
      );
    } finally {
      setIsComparing(false);
    }
  };

  const soFarCopy = UI_COPY[language].soFar;
  const footerCopy = UI_COPY[language].footer;

  return (
    <div className="min-h-screen newsprint-bg text-[#14213d] flex flex-col">
      <TopMasthead
        activeSection={activeSection}
        onJumpTo={handleJumpTo}
        language={language}
        onChangeLanguage={setLanguage}
      />

      {/* Full-canvas living illustrated newspaper sheet behind the centered Namma Check flow */}
      <div className="relative flex-1 overflow-x-clip">
        <NewspaperBackground activeSection={activeSection} />

        {/* Matching subtle black ink mist along the far-left and far-right edges of the page */}
        <div
          aria-hidden="true"
          className="no-print pointer-events-none fixed sm:absolute inset-y-0 left-0 z-20 w-10 sm:w-12"
          style={{
            background:
              'linear-gradient(to right, rgba(14, 16, 20, 0.16) 0%, rgba(14, 16, 20, 0.06) 45%, rgba(14, 16, 20, 0) 100%)',
          }}
        />
        <div
          aria-hidden="true"
          className="no-print pointer-events-none fixed sm:absolute inset-y-0 right-0 z-20 w-10 sm:w-12"
          style={{
            background:
              'linear-gradient(to left, rgba(14, 16, 20, 0.16) 0%, rgba(14, 16, 20, 0.06) 45%, rgba(14, 16, 20, 0) 100%)',
          }}
        />

        {/* Preserved narrow centred Namma Check experience on a light ivory sheet with subtle black edge mist */}
        <main className="relative z-10 mx-auto w-full max-w-[1040px] px-4 sm:px-8 bg-[#fcfaf5]/98 sm:bg-[#fcfaf5]/98 sm:shadow-[0_0_22px_4px_rgba(14,16,20,0.14)] border-x-[1.5px] border-[#0e1014]/65">
          {/* Subtle black ink mist flanking the central column without obscuring cartoons */}
          <div
            aria-hidden="true"
            className="no-print pointer-events-none hidden sm:block absolute inset-y-0 -left-12 w-12"
            style={{
              background:
                'linear-gradient(to left, rgba(14, 16, 20, 0.16) 0%, rgba(14, 16, 20, 0.06) 45%, rgba(14, 16, 20, 0) 100%)',
            }}
          >
            <div className="absolute inset-y-0 right-1.5 w-px bg-[#0e1014]/25" />
          </div>
          <div
            aria-hidden="true"
            className="no-print pointer-events-none hidden sm:block absolute inset-y-0 -right-12 w-12"
            style={{
              background:
                'linear-gradient(to right, rgba(14, 16, 20, 0.16) 0%, rgba(14, 16, 20, 0.06) 45%, rgba(14, 16, 20, 0) 100%)',
            }}
          >
            <div className="absolute inset-y-0 left-1.5 w-px bg-[#0e1014]/25" />
          </div>

          <HeroSection language={language} onJumpTo={handleJumpTo} />
          <ProblemSection language={language} />
          <HowItWorksSection language={language} />
          <WorkspaceSection
            language={language}
            purpose={purpose}
            onChangePurpose={handleChangePurpose}
            documents={documents}
            onChangeDocuments={handleChangeDocuments}
            activePresetId={activePresetId}
            onSelectPreset={handleSelectPreset}
            onCompareAndViewReport={handleRunComparison}
            isComparing={isComparing}
            comparisonError={comparisonError}
            onJumpTo={handleJumpTo}
          />
          <ReportSection
            language={language}
            report={report}
            onJumpTo={handleJumpTo}
          />

          {/* Compact 05 // So far backend stats strip */}
          <section className="no-print py-8">
            <p className="font-mono text-[11px] tracking-[0.1em] text-[#c8322b] uppercase font-semibold">
              {soFarCopy.kicker}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-6">
              <div>
                <div className="font-sans text-3xl font-extrabold text-[#14213d] tabular-nums">
                  {Math.max(backendStats?.checks ?? 0, checksRun)}
                </div>
                <div className="font-mono text-xs text-[#14213d]/75">
                  {soFarCopy.checksRun}
                </div>
              </div>
              <div>
                <div className="font-sans text-3xl font-extrabold text-[#c8322b] tabular-nums">
                  {Math.max(backendStats?.checks_with_mismatch ?? 0, mismatchesFound)}
                </div>
                <div className="font-mono text-xs text-[#14213d]/75">
                  {soFarCopy.mismatchesFound}
                </div>
              </div>
            </div>
            <p className="mt-4 font-mono text-xs text-[#14213d]/75 underline decoration-[#14213d]/40">
              {soFarCopy.publicCode}
            </p>
          </section>
        </main>
      </div>

      {/* Quiet Editorial Colophon Footer with Indic script transliterations */}
      <footer className="no-print relative z-10 border-t border-[#14213d]/15 bg-[#f6f1e7] py-6">
        <div className="mx-auto max-w-[1040px] px-4 sm:px-8 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[#14213d]">
            <span className="font-masthead font-extrabold tracking-[0.08em] text-base uppercase">
              NAMMA CHECK
            </span>
            <span className="text-xs text-[#14213d]/70">
              ನಮ್ಮ ಚೆಕ್ · நம்ம செக் · నమ్మ చెక్ · നമ്മ ചെക്ക് · नम्मा चेक · নম্মা চেক
            </span>
          </div>
          <p className="text-[11px] text-[#14213d]/60">
            {footerCopy.scriptNote}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] text-[#14213d]/65 font-mono">
            <span>{footerCopy.note}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
