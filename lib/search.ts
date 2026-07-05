// Shared search scoring engine — works in both server and client contexts.
// Implements ranked OR: every matched token contributes to the score,
// partial matches still surface (no hard zero-out).

export type SearchableFields = {
  name: string;
  cat: string;
  category: string;
  sub?: string;
  gender: string;
  fit: string;
  fabric: string;
  occasion: string;
  line: string;
  colour?: string;
  badge?: string | null;
  description?: string;
  shortDescription?: string;
  note?: string;
  features?: string[];
  spec?: string[];
  filterTags?: Record<string, string[]>;
};

// ── Stemmer ──────────────────────────────────────────────────────────────
// Lightweight English suffix stripper. Designed to be safe (never produces
// a stem shorter than 3 chars) and to handle common e-commerce plurals
// without breaking words like "dress" → "dres" or "pieces" → "piec".

const DOUBLE_CONSONANT_ES = /([^aeiou])\1es$/;
const CONSONANT_IES = /[^aeiou]ies$/;

export function stem(word: string): string {
  if (word.length < 4) return word;

  // "ies" → "y" (ladies→lady, accessories→accessory)
  if (CONSONANT_IES.test(word)) return word.slice(0, -3) + "y";

  // Double-consonant + "es" → single consonant (dresses→dress, blouses stays)
  if (DOUBLE_CONSONANT_ES.test(word)) return word.slice(0, -2);

  // "ses", "zes", "xes", "ches", "shes" → drop "es" (pieces→piece, blouses→blouse)
  if (/(?:se|ze|xe|che|she)s$/.test(word)) return word.slice(0, -1);

  // Generic "es" after sibilant-like endings → drop "es"
  if (/[sxz]es$/.test(word) || /[sc]hes$/.test(word)) return word.slice(0, -2);

  // Plain "s" (not "ss") → drop "s" (suits→suit, shirts→shirt)
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 4) {
    return word.slice(0, -1);
  }

  // "ing" → drop (tailoring→tailor) but guard against too-short results
  if (word.endsWith("ing") && word.length > 6) return word.slice(0, -3);

  // "ed" → drop (tailored→tailor) but guard against too-short results
  if (word.endsWith("ed") && word.length > 5) return word.slice(0, -2);

  return word;
}

// ── Tokenizer ────────────────────────────────────────────────────────────

export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

// ── Scorer ───────────────────────────────────────────────────────────────
// Tiered weights:
//   Name match:     +10
//   Category match: +5
//   Rest match:     +2
// Bonus when ALL tokens match at least one field: +20 × tokenCount
// This guarantees full-phrase matches always outrank partial matches.

const WEIGHT_NAME = 10;
const WEIGHT_CAT = 5;
const WEIGHT_REST = 2;
const BONUS_ALL_MATCH = 20;

function includes(haystack: string, needle: string): boolean {
  return haystack.includes(needle);
}

function matchesField(field: string, token: string, stemmed: string): boolean {
  return includes(field, token) || (stemmed !== token && includes(field, stemmed));
}

export function scoreProduct(fields: SearchableFields, tokens: string[]): number {
  if (tokens.length === 0) return 0;

  // Pre-build lowercased search corpus strings
  const name = fields.name.toLowerCase();
  const cat = `${fields.cat} ${fields.category} ${fields.sub ?? ""} ${fields.gender}`.toLowerCase();

  // Build the "rest" corpus from all remaining fields
  const restParts: string[] = [
    fields.fabric,
    fields.occasion,
    fields.fit,
    fields.line,
    fields.colour ?? "",
    fields.badge ?? "",
    fields.description ?? "",
    fields.shortDescription ?? "",
    fields.note ?? "",
  ];
  if (fields.features?.length) restParts.push(fields.features.join(" "));
  if (fields.spec?.length) restParts.push(fields.spec.join(" "));
  if (fields.filterTags) {
    for (const vals of Object.values(fields.filterTags)) {
      restParts.push(vals.join(" "));
    }
  }
  const rest = restParts.join(" ").toLowerCase();

  let score = 0;
  let matchedCount = 0;

  for (const t of tokens) {
    const st = stem(t);
    let matched = false;

    // Name match (highest weight)
    if (matchesField(name, t, st)) {
      score += WEIGHT_NAME;
      matched = true;
    }
    // Category match
    else if (matchesField(cat, t, st)) {
      score += WEIGHT_CAT;
      matched = true;
    }
    // Rest fields match
    else if (matchesField(rest, t, st)) {
      score += WEIGHT_REST;
      matched = true;
    }

    if (matched) matchedCount++;
  }

  // Bonus: if every token matched something, boost significantly so
  // full-phrase matches always outrank partial matches.
  if (matchedCount === tokens.length && tokens.length > 1) {
    score += BONUS_ALL_MATCH * tokens.length;
  }

  return score;
}
