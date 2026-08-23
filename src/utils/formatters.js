// src/utils/formatters.js

/**
 * Converts strings to PascalCase without spaces or special characters.
 * Example: "leaving on a jet plane" -> "LeavingOnAJetPlane"
 */
export function toPascalCase(str = '') {
  return str
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Formats the standardized NotebookLM notebook display name.
 * Schema: SongAppreciation-[SongName]-[Singer]
 * Example: generateNotebookName("Dust in the Wind", "Kansas")
 * Output:  "SongAppreciation-DustInTheWind-Kansas"
 */
export function generateNotebookName(songTitle, artistName) {
  const cleanTitle = toPascalCase(songTitle || 'Untitled');
  const cleanArtist = toPascalCase(artistName || 'UnknownArtist');
  return `SongAppreciation-${cleanTitle}-${cleanArtist}`;
}
