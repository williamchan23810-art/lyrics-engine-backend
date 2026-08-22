// netlify/functions/storyboard.js

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
      body: JSON.stringify({ error: 'Method Not Allowed. Use POST.' }) 
    };
  }

  try {
    const { title, artist, lines, aspectRatio = '9:16' } = JSON.parse(event.body || '{}');

    if (!title || !lines || lines.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Song title and lyric lines are required.' })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured in Netlify environment variables.' })
      };
    }

    const systemPrompt = `
You are an award-winning Cinematic Visual Director and Song Appreciation Storyteller.
Analyze the provided song lyrics, emotional arc, and timestamps.
Generate a cohesive, scene-by-scene visual script optimized for AI video generation (Midjourney, Runway Gen-3, Sora, Luma Dream Machine).

Target Aspect Ratio: ${aspectRatio}

STRICT OUTPUT FORMAT: Return ONLY a valid JSON object matching this schema:
{
  "songOverview": {
    "title": "${title}",
    "artist": "${artist || 'Unknown'}",
    "coreTheme": "1-2 sentences explaining core poetic/emotional meaning",
    "emotionalArc": "Brief description of the mood progression (e.g. Melancholic nostalgia -> Bittersweet hope)",
    "colorPalette": ["#Hex1", "#Hex2", "#Hex3"],
    "cinematicStyle": "e.g. 35mm film grain, moody anamorphic lighting, warm golden hour tones"
  },
  "scenes": [
    {
      "sceneIndex": 1,
      "timeRange": "00:15 - 00:22",
      "lyricSegment": "Exact lyric line or couplet",
      "visualConcept": "Brief 1-sentence narrative context",
      "imagePrompt": "Highly descriptive text-to-image prompt (subject, composition, environment, lighting, camera angle, atmospheric textures, 8k hyperrealistic)",
      "motionPrompt": "Dynamic camera movement and character action for video generator",
      "lighting": "e.g. Low-key dramatic rim lighting with hazy volumetrics",
      "camera": "e.g. 50mm prime, slow cinematic dolly-in at eye level"
    }
  ]
}
`;

    const userLyricsFormatted = lines
      .map((l) => {
        const timeStr = formatSecondsToTimestamp(l.startTime ?? (l.startTimeMs ? l.startTimeMs / 1000 : 0));
        return `[${timeStr}] ${l.text || l.originalText || ''}`;
      })
      .join('\n');

    const userContent = `Song Title: ${title}\nArtist: ${artist || 'Unknown'}\n\nLyrics with Timestamps:\n${userLyricsFormatted}`;

    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\n' + userContent }]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: `Gemini API returned error: ${errText}` })
      };
    }

    const data = await response.json();
    const generatedJson = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedJson) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: 'No output generated from AI agent.' })
      };
    }

    const parsedStoryboard = JSON.parse(generatedJson);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsedStoryboard)
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};

function formatSecondsToTimestamp(seconds) {
  const totalSec = Math.floor(seconds || 0);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
