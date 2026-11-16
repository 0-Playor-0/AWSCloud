import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

let counter = 0;
export function newId(): string {
  counter += 1;
  return `doc-${counter}`;
}
