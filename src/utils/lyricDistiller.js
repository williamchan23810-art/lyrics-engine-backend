// src/utils/lyricDistiller.js

const FILLER_REGEX = /^(oh|yeah|ooh|woah|whoa|ah|ahh|la|na|h\s*o|uh|mm|mmm|baby)[\s,!?.~-]*$/i;

/**
 * Distills raw timestamped lyrics into clean, non-repetitive narrative beats.
 * @param {Array} rawLines - Array of { startTime, text, tokens }
 * @returns {Array} distilledLines - Cleaned lines without filler or duplicate stanzas
 */
export function distillLyrics(rawLines = []) {
  if (!rawLines || rawLines.length === 0) return [];

  const seenPhrases = new Set();
  const distilled = [];

  for (const line of rawLines) {
    const rawText = (line.text || line.originalText || '').trim();
    if (!rawText) continue;

    // 1. Strip vocal ad-libs and standalone interjections
    if (FILLER_REGEX.test(rawText)) {
      continue;
    }

    // 2. Normalize text for duplicate detection (ignore punctuation & casing)
    const normalized = rawText
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 3. Skip if line is too short or already seen (removes duplicate choruses)
    if (normalized.length <= 1 || seenPhrases.has(normalized)) {
      continue;
    }

    seenPhrases.add(normalized);
    distilled.push({
      ...line,
      text: rawText
    });
  }

  return distilled;
}
