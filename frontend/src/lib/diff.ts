// Character-level diff for showing how one value differs from another (hero slips and report).
// Longest common subsequence on characters; characters outside it are marked as different.

export interface Segment {
  text: string;
  same: boolean;
}

export function diffChars(base: string, other: string): Segment[] {
  const a = [...base];
  const b = [...other];
  // lcs[i][j] = LCS length of a[i:] and b[j:]
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: Segment[] = [];
  const push = (ch: string, same: boolean) => {
    const last = out.at(-1);
    if (last && last.same === same) last.text += ch;
    else out.push({ text: ch, same });
  };
  let i = 0;
  for (let j = 0; j < b.length; j++) {
    // advance in `a` only while it keeps the remaining LCS intact
    while (i < a.length && a[i] !== b[j] && lcs[i + 1][j] >= lcs[i][j + 1]) i++;
    if (i < a.length && a[i] === b[j] && lcs[i][j] === lcs[i + 1][j + 1] + 1) {
      push(b[j], true);
      i++;
    } else {
      push(b[j], false);
    }
  }
  return out;
}
