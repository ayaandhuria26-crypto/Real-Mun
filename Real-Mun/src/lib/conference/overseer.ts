import type { Phase } from "./types";

export function maxWordsForPhase(phase: Phase): number {
  switch (phase.type) {
    case "opening_speeches":
      return 130;
    case "moderated_caucus":
      return 100;
    case "unmoderated_caucus":
      return 35;
    case "closing":
      return 90;
    default:
      return 80;
  }
}

export function normalizeWhitespace(text: string, ownCountry?: string): string {
  // Strip non-Latin script characters
  let t = text.replace(
    /[Ѐ-ӿԀ-ԯ֐-׿؀-ۿ܀-ݏऀ-ॿ　-〿぀-ゟ゠-ヿ㐀-䶿一-鿿가-힯豈-﫿＀-￯]/g,
    ""
  );

  // Collapse whitespace
  t = t.replace(/\s+/g, " ").trim();

  // Strip self-labeling (e.g., "Brazil:", "[Brazil]", "Brazil -", "The delegation of Brazil:")
  if (ownCountry) {
    const escaped = ownCountry.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t
      .replace(new RegExp(`^${escaped}:\\s*`, "i"), "")
      .replace(new RegExp(`^\\[${escaped}\\]\\s*`, "i"), "")
      .replace(new RegExp(`^${escaped}\\s+-\\s*`, "i"), "")
      .replace(new RegExp(`^The delegation of ${escaped}:\\s*`, "i"), "");
  }

  // Strip meta-commentary leakage
  t = t
    .replace(/^or implies it[\s:,]*/i, "")
    .replace(/^to be safe[\s:,]*/i, "")
    .replace(/^here is my speech[\s:,]*/i, "")
    .replace(/^response[\s:,]*/i, "")
    .replace(/^note[\s:,]*/i, "")
    .replace(/^speech[\s:,]*/i, "");

  // Strip leading non-letter characters
  t = t.replace(/^[^A-Za-z]+/, "");

  return t.trim();
}

export function trimToWordCap(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords && /[.!?…]$/.test(text.trim())) {
    return text.trim();
  }

  if (words.length <= maxWords) {
    return text.trim();
  }

  const sliced = words.slice(0, maxWords).join(" ");

  // Snap back to last full sentence
  const sentenceEnd = /[.!?…](?:\s|$)/g;
  let lastEnd = -1;
  let match: RegExpExecArray | null;
  while ((match = sentenceEnd.exec(sliced)) !== null) {
    lastEnd = match.index + 1;
  }

  if (lastEnd > 0) {
    return sliced.slice(0, lastEnd).trim();
  }

  // No sentence boundary: drop partial word + ellipsis
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > 0) {
    return sliced.slice(0, lastSpace).trim() + "…";
  }

  return sliced + "…";
}

export function maxTurnsForPhase(phase: Phase): number {
  switch (phase.type) {
    case "roll_call":
      return 8;
    case "opening_speeches":
      return (phase.speakerOrder?.length ?? 4) + 2;
    case "moderated_caucus":
      return (phase.speakerOrder?.length ?? 5) + 2;
    case "unmoderated_caucus":
      return 8;
    default:
      return 4;
  }
}
