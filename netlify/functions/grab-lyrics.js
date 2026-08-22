// netlify/functions/grab-lyrics.js

exports.handler = async function (event, context) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle pre-flight request
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const songName = (payload.songName || payload.title || '').trim();
    const artistName = (payload.artistName || payload.artist || '').trim();
    const audioDurationMs = payload.audioDurationMs || 0;

    if (!songName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Song Name is required.' })
      };
    }

    // Step 2A: Query LRCLIB with fuzzy search
    const searchQuery = `${songName} ${artistName}`.trim();
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'LyricsEngineStudio/1.0 (williamhchanstudio)'
      }
    });

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `LRCLIB upstream returned status ${response.status}` })
      };
    }

    const searchResults = await response.json();

    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `No lyrics found for "${songName}".` })
      };
    }

    // Step 2B: Find the best match (prioritize syncedLyrics)
    const bestMatch = searchResults.find((r) => r.syncedLyrics) || searchResults[0];

    // Case 1: Synced lyrics available
    if (bestMatch.syncedLyrics) {
      const parsedLines = parseLrcToSchema(bestMatch.syncedLyrics);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          synced: true,
          trackId: `${bestMatch.trackName}-${bestMatch.artistName || 'Unknown'}`,
          title: bestMatch.trackName,
          artist: bestMatch.artistName,
          duration: bestMatch.duration || 0,
          lines: parsedLines
        })
      };
    }

    // Case 2: Plain lyrics fallback
    if (bestMatch.plainLyrics) {
      const fallbackLines = parsePlainLyricsToSchema(bestMatch.plainLyrics);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success_unsynced',
          synced: false,
          trackId: `${bestMatch.trackName}-${bestMatch.artistName || 'Unknown'}`,
          title: bestMatch.trackName,
          artist: bestMatch.artistName,
          duration: bestMatch.duration || 0,
          lines: fallbackLines
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Lyrics text not available for this track.' })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};

/**
 * Parses synchronized LRC format into tokenized line schema
 */
function parseLrcToSchema(lrcText) {
  const rawLines = lrcText.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  let lineCounter = 0;

  for (const raw of rawLines) {
    const match = raw.match(timeRegex);
    if (!match) continue;

    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    const msStr = match[3];
    const ms = msStr.length === 2 ? parseInt(msStr, 10) * 10 : parseInt(msStr, 10);
    const startTimeMs = (min * 60 + sec) * 1000 + ms;
    const text = match[4].trim();

    if (!text) continue;

    // Tokenize words for Western languages / characters for Asian scripts
    const tokens = text.includes(' ')
      ? text.split(' ').map((word, i) => ({
          char: word + ' ',
          phonetic: '',
          startMs: startTimeMs + i * 350,
          endMs: startTimeMs + (i + 1) * 350
        }))
      : Array.from(text).map((char, i) => ({
          char,
          phonetic: '',
          startMs: startTimeMs + i * 220,
          endMs: startTimeMs + (i + 1) * 220
        }));

    const lineDuration =
      tokens.length > 0 ? tokens[tokens.length - 1].endMs - startTimeMs : 2000;

    result.push({
      lineIndex: lineCounter++,
      startTimeMs,
      endTimeMs: startTimeMs + lineDuration,
      originalText: text,
      tokens
    });
  }

  // Adjust line end-times to avoid overlapping with next line
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].endTimeMs > result[i + 1].startTimeMs) {
      result[i].endTimeMs = result[i + 1].startTimeMs;
    }
  }

  return result;
}

/**
 * Fallback parser for plain text lyrics
 */
function parsePlainLyricsToSchema(plainText) {
  const lines = plainText.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((text, idx) => ({
    lineIndex: idx,
    startTimeMs: idx * 3000,
    endTimeMs: (idx + 1) * 3000,
    originalText: text,
    tokens: text.split(' ').map((word, wIdx) => ({
      char: word + ' ',
      phonetic: '',
      startMs: idx * 3000 + wIdx * 300,
      endMs: idx * 3000 + (wIdx + 1) * 300
    }))
  }));
}
