// netlify/functions/grab-lyrics.js

exports.handler = async function (event, context) {
  // 1. Enable CORS for local dev and live builds
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
    const title = payload.title?.trim();
    const artist = payload.artist?.trim() || '';
    const audioDurationMs = payload.audioDurationMs || 0;

    if (!title) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Song title is required.' })
      };
    }

    // 2. Query LRCLIB
    const queryUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    
    const response = await fetch(queryUrl, {
      headers: {
        'User-Agent': 'LyricsEngineStudio/1.0 (williamhchanstudio)'
      }
    });

    if (!response.ok) {
      // If exact search fails, try general search endpoint as fallback
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${artist}`)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'LyricsEngineStudio/1.0 (williamhchanstudio)' }
      });

      if (searchRes.ok) {
        const searchList = await searchRes.json();
        const firstMatch = searchList.find((item) => item.syncedLyrics);
        
        if (firstMatch && firstMatch.syncedLyrics) {
          const lines = parseLrc(firstMatch.syncedLyrics);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              status: 'success',
              trackId: `${title}-${artist || 'unknown'}`,
              title: firstMatch.trackName || title,
              artist: firstMatch.artistName || artist,
              durationMs: firstMatch.duration ? Math.round(firstMatch.duration * 1000) : audioDurationMs,
              lines
            })
          };
        }
      }

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No synchronized lyrics found for this track.' })
      };
    }

    const data = await response.json();

    if (data.syncedLyrics) {
      const lines = parseLrc(data.syncedLyrics);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          trackId: `${title}-${artist || 'unknown'}`,
          title: data.trackName || title,
          artist: data.artistName || artist,
          durationMs: data.duration ? Math.round(data.duration * 1000) : audioDurationMs,
          lines
        })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Synced lyrics unavailable for this track.' })
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
 * Parses raw LRC string into structured line & token schema
 */
function parseLrc(lrcText) {
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

    // Distribute time across characters
    const chars = Array.from(text);
    const charSpan = 220; // default 220ms interpolation
    const endTimeMs = startTimeMs + (chars.length * charSpan);

    const tokens = chars.map((char, i) => ({
      char,
      phonetic: '',
      startMs: startTimeMs + (i * charSpan),
      endMs: startTimeMs + ((i + 1) * charSpan)
    }));

    result.push({
      lineIndex: lineCounter++,
      startTimeMs,
      endTimeMs,
      originalText: text,
      tokens
    });
  }

  // Adjust line end times so they do not overlap next line's start
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i].endTimeMs > result[i + 1].startTimeMs) {
      result[i].endTimeMs = result[i + 1].startTimeMs;
    }
  }

  return result;
}
