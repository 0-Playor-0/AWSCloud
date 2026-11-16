import { diffChars } from "@/lib/diff";

/** Shows `value` with the characters that differ from `base` marked (colour + underline). */
export function DiffText({ base, value }: { base: string | null; value: string }) {
  if (base === null || base === value) return <span>{value}</span>;
  return (
    <span>
      {diffChars(base, value).map((s, i) =>
        s.same ? <span key={i}>{s.text}</span> : <mark key={i} className="diff-mark">{s.text}</mark>,
      )}
    </span>
  );
}
