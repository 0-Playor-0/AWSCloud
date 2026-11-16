import { tKey } from "./strings";

/** "aadhaar" → "Aadhaar"; engine ids for duplicates ("other_2") → "Other / portal screenshot 2". */
export function docLabel(id: string): string {
  const m = /^(.*)_(\d+)$/.exec(id);
  if (m && tKey(`doc.${m[1]}`) !== `doc.${m[1]}`) return `${tKey(`doc.${m[1]}`)} ${m[2]}`;
  return tKey(`doc.${id}`);
}
