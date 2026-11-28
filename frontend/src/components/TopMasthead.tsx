import React from 'react';
import { AppLanguage, SectionId } from '../types/documents';
import { LANGUAGE_OPTIONS, UI_COPY } from '../utils/i18n';

interface TopMastheadProps {
  activeSection: SectionId;
  onJumpTo: (id: SectionId) => void;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

const SECTION_IDS: SectionId[] = ['hero', 'problem', 'how-it-works', 'workspace', 'report'];

export const TopMasthead: React.FC<TopMastheadProps> = ({
  activeSection,
  onJumpTo,
  language,
  onChangeLanguage,
}) => {
  const copy = UI_COPY[language];

  return (
    <header className="no-print sticky top-0 z-40 w-full overflow-x-clip border-b-2 border-[#c8322b]/80 bg-[#0e1014] text-white shadow-[0_2px_12px_rgba(14,16,20,0.22)]">
      <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between gap-2 md:gap-4 lg:gap-6 px-3 py-3 sm:px-4 lg:px-8">
        {/* Zone 1: Capitalized broadsheet serif wordmark */}
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            onJumpTo('hero');
          }}
          className="font-masthead uppercase text-[17px] sm:text-[18px] lg:text-[22px] xl:text-[24px] font-extrabold tracking-[0.07em] lg:tracking-[0.11em] text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8322b]"
        >
          NAMMA CHECK
        </a>

        {/* Zone 2: Centered, evenly spaced editorial navigation links */}
        <nav
          aria-label="Page sections"
          className="hidden md:flex flex-1 items-center justify-center gap-3.5 lg:gap-7 xl:gap-9 text-[12px] lg:text-[13.5px] xl:text-[14.5px] font-medium tracking-[0.025em] text-white/75 min-w-0"
        >
          {SECTION_IDS.map((id) => {
            const isActive = activeSection === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  onJumpTo(id);
                }}
                className={`whitespace-nowrap shrink-0 py-1 transition-all duration-200 border-b-2 ${
                  isActive
                    ? 'border-[#c8322b] text-white font-semibold'
                    : 'border-transparent hover:border-white/45 hover:text-white'
                }`}
              >
                {copy.nav[id]}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Language switcher (English / हिन्दी / मराठी) & primary action */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <label htmlFor="masthead-language" className="sr-only">
            Language
          </label>
          <select
            id="masthead-language"
            aria-label="Language"
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value as AppLanguage)}
            className="border border-white/30 bg-[#161920] px-2 py-1.5 lg:px-2.5 lg:py-1.5 text-[11.5px] lg:text-[12.5px] font-medium text-white transition-colors hover:border-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8322b] cursor-pointer"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code} className="bg-[#0e1014] text-white">
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onJumpTo('workspace')}
            className="whitespace-nowrap shrink-0 border border-white/80 bg-transparent px-2.5 py-1.5 lg:px-4 lg:py-1.5 text-[11.5px] lg:text-[12.5px] font-semibold tracking-wide text-white transition-colors hover:bg-white hover:text-[#0e1014] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8322b] cursor-pointer"
          >
            {copy.mastheadCta}
          </button>
        </div>
      </div>
    </header>
  );
};
