// Decorative newspaper-border illustrations (desktop only). Imported through import.meta.glob so
// Vite bundles them with hashed names; WebP, converted from the original PNGs (see logs/phase-6.md).
const URLS = import.meta.glob<string>("../assets/images/**/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});

/** URL of an illustration by its path under assets/images without extension, e.g. "cells/crowds_8". */
export function illustration(name: string): string {
  const url = URLS[`../assets/images/${name}.webp`];
  if (!url) throw new Error(`unknown illustration: ${name}`);
  return url;
}

export const CARTOONS = {
  confusedCitizen: illustration("cartoon_confused_citizen_1795762591101"),
  officeQueue: illustration("cartoon_office_queue_1795762591695"),
  overworkedClerk: illustration("cartoon_overworked_clerk_1795762592596"),
  documentDetective: illustration("cartoon_document_detective_1795762593345"),
  paperworkMonster: illustration("cartoon_paperwork_monster_1795762594026"),
  organisedCitizen: illustration("cartoon_organised_citizen_1795762593639"),
} as const;

/** Media query at or above which the illustrated border is rendered at all. */
export const BORDER_MIN_WIDTH = "(min-width: 1024px)";
