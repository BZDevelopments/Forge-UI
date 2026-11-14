export interface FuzzyMatch {
  score: number;
  /** Indices of matched characters in the haystack, useful for highlighting. */
  indices: number[];
}

const WORD_BOUNDARY = /[\s\-_/.:]/;

function matchTerm(q: string, t: string): FuzzyMatch | null {
  const indices: number[] = [];
  let score = 0;
  let ti = 0;
  let streak = 0;

  for (let qi = 0; qi < q.length; qi++) {
    const char = q[qi]!;
    let found = -1;
    for (; ti < t.length; ti++) {
      if (t[ti] === char) {
        found = ti;
        break;
      }
    }
    if (found === -1) return null;

    const previous = indices[indices.length - 1];
    if (previous !== undefined && found === previous + 1) {
      streak += 1;
      score += 5 + streak * 2;
    } else {
      streak = 0;
      score += 1;
    }
    if (found === 0) score += 8;
    else if (WORD_BOUNDARY.test(t[found - 1]!)) score += 6;

    indices.push(found);
    ti = found + 1;
  }

  // Prefer tighter spans when scores tie.
  const span = indices[indices.length - 1]! - indices[0]! + 1;
  score -= (span - q.length) * 0.5;
  if (t.startsWith(q)) score += 20;
  return { score, indices };
}

/**
 * Subsequence matcher with scoring. Consecutive characters, word starts, and prefix matches score higher.
 * Each whitespace-separated word in the query must match on its own, so "table server" finds "Data table: Server-side".
 * Returns `null` when any word is not a subsequence of the text.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return { score: 0, indices: [] };
  const t = text.toLowerCase();

  let score = 0;
  const indices = new Set<number>();
  for (const term of terms) {
    const match = matchTerm(term, t);
    if (!match) return null;
    score += match.score;
    for (const index of match.indices) indices.add(index);
  }
  // Shorter haystacks win ties.
  score -= t.length * 0.02;
  return { score, indices: [...indices].sort((a, b) => a - b) };
}
