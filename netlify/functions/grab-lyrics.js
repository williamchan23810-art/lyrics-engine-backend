// netlify/functions/grab-lyrics.js

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'OK' };
  }

  try {
    let title = '';
    let artist = '';
    let rawQuery = '';

    // Handle both POST JSON body and GET Query parameters
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      title = body.title || body.songTitle || body.track || '';
      artist = body.artist || body.artistName || '';
      rawQuery = body.query || body.q || '';
    } else {
      title = event.queryStringParameters?.title || event.queryStringParameters?.track || '';
      artist = event.queryStringParameters?.artist || '';
      rawQuery = event.queryStringParameters?.query || event.queryStringParameters?.q || '';
    }

    if (!title && !rawQuery) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Please provide a song title or search query.' })
      };
    }

    const LRCLIB_HEADERS = {
      'User-Agent': 'LyricsEngineStudio/1.0 (https://github.com/williamchan23810-art/lyrics-engine-backend)',
      'Accept': 'application/json'
    };

    let record = null;

    // Strategy 1: Direct Exact Match (/api/get)
    if (title && artist) {
      try {
        const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
        const res = await fetch(getUrl, { headers: LRCLIB_HEADERS });
        if (res.ok) {
          record = await res.json();
        }
      } catch (err) {
        console.warn('LRCLIB /api/get failed, trying fallback...', err.message);
      }
    }

    // Strategy 2: Structured Search (/api/search?track_name=...&artist_name=...)
    if (!record && title) {
      try {
        const searchUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}${artist ? `&artist_name=${encodeURIComponent(artist)}` : ''}`;
        const res = await fetch(searchUrl, { headers: LRCLIB_HEADERS });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            // Find first record with synced lyrics, or default to first result
            record = list.find((item) => item.syncedLyrics) || list[0];
          }
        }
      } catch (err) {
        console.warn('LRCLIB /api/search structured failed...', err.message);
      }
    }

    // Strategy 3: General Keyword Query (/api/search?q=...)
    if (!record) {
      const searchTerm = rawQuery || `${title} ${artist}`.trim();
      try {
        const queryUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchTerm)}`;
        const res = await fetch(queryUrl, { headers: LRCLIB_HEADERS });
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            record = list.find((item) => item.syncedLyrics) || list[0];
          }
        }
      } catch (err) {
        console.warn('LRCLIB /api/search query fallback failed...', err.message);
      }
    }

    if (!record) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: `Could not find lyrics for "${title || rawQuery}". Try adjusting the artist or title.` })
      };
    }

    // Parse LRC Timestamps into Structured Lyric Lines
    const parsedLines = [];
    if (record.syncedLyrics) {
      const lrcRows = record.syncedLyrics.split('\n');
      const lrcRegex = /^\[(\d{2}):(\d{2}(?:\.\d{1,3})?)\](.*)$/;

      lrcRows.forEach((row, idx) => {
        const match = row.trim().match(lrcRegex);
        if (match) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseFloat(match[2]);
          const text = match[3].trim();
          const startTime = minutes * 60 + seconds;

          if (text) {
            parsedLines.push({
              lineIndex: parsedLines.length,
              startTime: startTime,
              startTimeMs: Math.round(startTime * 1000),
              text: text,
              tokens: []
            });
          }
        }
      });
    } else if (record.plainLyrics) {
      // Fallback: estimate 3.5s per line if only plain text is available
      const plainRows = record.plainLyrics.split('\n');
      plainRows.forEach((row, idx) => {
        const text = row.trim();
        if (text) {
          const startTime = idx * 3.5;
          parsedLines.push({
            lineIndex: parsedLines.length,
            startTime: startTime,
            startTimeMs: Math.round(startTime * 1000),
            text: text,
            tokens: []
          });
        }
      });
    }

    // Set end times dynamically based on subsequent line start times
    for (let i = 0; i < parsedLines.length; i++) {
      if (i < parsedLines.length - 1) {
        parsedLines[i].endTime = parsedLines[i + 1].startTime;
        parsedLines[i].endTimeMs = parsedLines[i + 1].startTimeMs;
      } else {
        parsedLines[i].endTime = parsedLines[i].startTime + 4.0;
        parsedLines[i].endTimeMs = parsedLines[i].startTimeMs + 4000;
      }
    }

    const payload = {
      trackId: record.id?.toString() || Date.now().toString(),
      title: record.trackName || record.name || title,
      artist: record.artistName || artist || 'Unknown Artist',
      album: record.albumName || '',
      duration: record.duration || (parsedLines.length > 0 ? parsedLines[parsedLines.length - 1].endTime : 180),
      instrumental: !!record.instrumental,
      lyrics: parsedLines
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(payload)
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal error fetching lyrics.' })
    };
  }
};
