// Fictional personas (HANDOFF.md 4.9). Field sets only: no numbers, layouts, emblems or QR codes.
import type { DocFields, DocType } from "./types";

export interface SampleDoc {
  doc_type: DocType;
  fields: DocFields;
}

export interface Persona {
  id: string;
  name: string;
  story: string;
  docs: SampleDoc[];
}

export const PERSONAS: Persona[] = [
  {
    id: "kavya",
    name: "Kavya",
    story: "Initials on one card, full name on another; one document has only a birth year.",
    docs: [
      { doc_type: "aadhaar", fields: { name: "R KAVYA", dob: "2006", parent_name: null, gender: "F" } },
      { doc_type: "pan", fields: { name: "KAVYA RAMESH", dob: "2006-08-21", parent_name: "RAMESH S", gender: null } },
      { doc_type: "marksheet10", fields: { name: "KAVYA R", dob: "2006-08-21", parent_name: "RAMESH", gender: null } },
    ],
  },
  {
    id: "anita",
    name: "Anita",
    story: "Surname changed after marriage; day and month swapped on the passbook.",
    docs: [
      { doc_type: "aadhaar", fields: { name: "ANITA SHARMA", dob: "1990-04-07", parent_name: null, gender: "F" } },
      { doc_type: "passbook", fields: { name: "ANITA KUMARI SINGH", dob: "1990-07-04", parent_name: null, gender: null } },
      { doc_type: "other", fields: { name: "ANITA SINGH", dob: "1990-04-07", parent_name: "MOHAN SINGH", gender: "F" } },
    ],
  },
  {
    id: "arjun",
    name: "Arjun",
    story: "Everything lines up apart from punctuation.",
    docs: [
      { doc_type: "pan", fields: { name: "ARJUN MEHTA", dob: "1998-11-02", parent_name: "VIKRAM MEHTA", gender: null } },
      { doc_type: "passport", fields: { name: "Arjun  Mehta", dob: "1998-11-02", parent_name: null, gender: "M" } },
    ],
  },
];
