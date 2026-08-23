// netlify/functions/storyboard.js

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: 'OK' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { title, artist, lines, aspectRatio = '16:9' } = JSON.parse(event.body || '{}');

    if (!title || !lines || lines.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Title and distilled lyrics are required.' })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'GEMINI_API_KEY is not configured.' })
      };
    }

    const systemPrompt = `
You are a World-Class Cinematic Visual Director.
Analyze the distilled song lyrics. Each lyric line represents a key narrative turning point.
Generate a structured scene-by-scene visual script for AI video generation (Midjourney, Runway Gen-3, Sora, Google Veo).

Target Aspect Ratio: ${aspectRatio}

STRICT GUIDELINES:
1. Do NOT generate duplicate scenes. Each scene must advance the story visually.
2. Provide highly descriptive photorealistic prompts (lighting, camera lens, atmospheric depth, color grading).
3. Provide dynamic motion prompts for Image-to-Video generators.

STRICT JSON OUTPUT ONLY:
{
  "songOverview": {
    "title": "${title}",
    "artist": "${artist || 'Unknown'}",
    "coreTheme": "1-2 sentences on the emotional/poetic core",
    "emotionalArc": "Progression of mood across the song",
    "cinematicStyle": "e.g., 35mm film, moody warm anamorphic, mist and golden hour"
  },
  "scenes": [
    {
      "sceneIndex": 1,
      "timeRange": "MM:SS - MM:SS",
      "lyricSegment": "Exact distilled lyric line",
      "visualConcept": "1-sentence narrative context",
      "imagePrompt": "Detailed text-to-image prompt (subject, composition, environment, lighting, angle, 8k photorealistic)",
      "motionPrompt": "Video motion prompt (camera movement, character actions, atmospheric particles)",
      "lighting": "e.g. Volumetric dusk light with warm neon rim",
      "camera": "e.g. 50mm lens, slow cinematic push-in"
    }
  ]
}
`;

    const userLyricsFormatted = lines
      .map((l) => `[${formatTime(l.startTime)}] ${l.text}`)
      .join('\n');

    const userContent = `Song: ${title} by ${artist}\nDistilled Lyrics:\n${userLyricsFormatted}`;
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userContent }] }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      return { statusCode: response.status, headers, body: JSON.stringify({ error: err }) };
    }

    const data = await response.json();
    const result = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text || '{}');

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function formatTime(sec) {
  const s = Math.floor(sec || 0);
  return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}
