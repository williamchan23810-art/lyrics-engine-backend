// netlify/functions/grab-lyrics.js

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const title = payload.songName || payload.title || '';
    const artist = payload.artistName || payload.artist || '';

    if (!title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Song name is required.' })
      };
    }

    // Step 1: Broad Search Query against LRCLIB
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${artist}`.trim())}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'KaraokeLyricsStudio/1.0 (williamhchanstudio)'
      }
    });

    if (!response.ok) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Failed to reach lyrics database.' })
      };
    }

    const searchResults = await response.json();

    if (!Array.isArray(searchResults) || searchResults.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `No lyrics found for "${title}".` })
      };
    }

    // Step 2: Pick the best result (prefer synced lyrics)
    const bestMatch = searchResults.find(r => r.syncedLyrics) || searchResults[0];

    if (bestMatch.syncedLyrics) {
      const parsedLines = parseLrcToSchema(bestMatch.syncedLyrics);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          trackId: `${bestMatch.trackName}-${bestMatch.artistName}`,
          title: bestMatch.trackName,
          artist: bestMatch.artistName,
          duration: bestMatch.duration || 0,
          lines: parsedLines
        })
      };
    }

    // Step 3: Handle plain text lyrics if no sync available
    if (bestMatch.plainLyrics) {
      const lines = bestMatch.plainLyrics.split('\n').filter(Boolean).map((text, idx) => ({
        lineIndex: idx,
        startTimeMs: idx * 3000,
        endTimeMs: (idx + 1) * 3000,
        originalText: text,
        tokens: text.split(' ').map((word, wIdx) => ({
          char: word + ' ',
          phonetic: '',
          startMs: (idx * 3000) + (wIdx * 300),
          endMs: (idx * 3000) + ((wIdx + 1) * 300)
        }))
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success_unsynced',
          trackId: `${bestMatch.trackName}-${bestMatch.artistName}`,
          title: bestMatch.trackName,
          artist: bestMatch.artistName,
          duration: bestMatch.duration || 0,
          lines
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Lyrics text not available for this song.' })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Server error while grabbing lyrics.' })
    };
  }
};

/**
 * Parses LRC lines into character / word tokens
 */
function parseLrcToSchema(lrcText) {
  const lines = lrcText.split('\n');
  const result = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

  let lineCounter = 0;

  for (const raw of lines) {
    const match = raw.match(timeRegex);
    if (!match) continue;

    const min = parseInt(match[1], 10);
    const sec = parseInt(match[2], 10);
    const msStr = match[3];
    const ms = msStr.length === 2 ? parseInt(msStr, 10) * 10 : parseInt(msStr, 10);
    const startTimeMs = (min * 60 + sec) * 1000 + ms;
    const text = match[4].trim();

    if (!text) continue;

    // Tokenize words/characters
    const tokens = text.includes(' ')
      ? text.split(' ').map((word, i) => ({
          char: word + ' ',
          phonetic: '',
          startMs: startTimeMs + (i * 350),
          endMs: startTimeMs + ((i + 1) * 350)
        }))
      : Array.from(text).map((char, i) => ({
          char,
          phonetic: '',
          startMs: startTimeMs + (i * 220),
          endMs: startTimeMs + ((i + 1) * 220)
        }));

    const lineDuration = tokens.length > 0 ? (tokens[tokens.length - 1].endMs - startTimeMs) : 2000;

    result.push({
      lineIndex: lineCounter++,
      startTimeMs,
      endTimeMs: startTimeMs + lineDuration,
      originalText: text,
      tokens
    });
  }

  // Adjust line end times
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].endTimeMs > result[i + 1].startTimeMs) {
      result[i].endTimeMs = result[i + 1].startTimeMs;
    }
  }

  return result;
}
