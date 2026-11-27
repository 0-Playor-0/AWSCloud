import { tKey } from "./strings";

type Translate = (key: string) => string;

/** "aadhaar" → "Aadhaar"; engine ids for duplicates ("other_2") → "Other / portal screenshot 2". */
export function docLabel(id: string, translate: Translate = tKey): string {
  const m = /^(.*)_(\d+)$/.exec(id);
  if (m && translate(`doc.${m[1]}`) !== `doc.${m[1]}`) return `${translate(`doc.${m[1]}`)} ${m[2]}`;
  return translate(`doc.${id}`);
}
