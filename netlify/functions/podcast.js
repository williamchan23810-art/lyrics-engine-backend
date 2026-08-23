// netlify/functions/podcast.js
const { GoogleGenAI } = require('@google/genai');

exports.handler = async (event) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing GEMINI_API_KEY environment variable' }) };
  }

  try {
    const { title, artist, lyrics, storyboard } = JSON.parse(event.body || '{}');

    if (!title || !lyrics || !lyrics.length) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required song title or lyrics payload' }),
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    // Step 1: Synthesize High-Engagement 2-Host Podcast Script
    const scriptPrompt = `You are an elite podcast producer and cinematic director.
Generate an engaging, emotionally resonant 2-host song appreciation podcast episode for the song "${title}" by "${artist}".

Hosts:
- Alex (Visual director, emotionally perceptive, sets the atmosphere)
- Morgan (Music historian, philosophical, deep-dives into lyrics)

Distilled Song Story Beats:
${JSON.stringify(lyrics.map((l) => l.text || l.originalText))}

Visual Storyboard Direction:
${JSON.stringify(storyboard || {})}

Script Requirements:
1. Banter & Hook: Start naturally with an evocative hook about the song's atmosphere.
2. Poetic Subtext: Unpack the hidden emotional tension and what the songwriter left unsaid.
3. Visual World-Building: Walk listeners through the cinematic scenes (lighting, camera angles, textures) as if describing a short film.
4. Output Format: Return strict JSON matching the schema below.

Schema:
{
  "episodeTitle": "string",
  "synopsis": "string",
  "hosts": ["Alex", "Morgan"],
  "dialogue": [
    { "speaker": "Alex" | "Morgan", "line": "string", "emotion": "reflective" | "curious" | "insightful" | "warm" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: scriptPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsedData = JSON.parse(response.text);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        title,
        artist,
        episodeTitle: parsedData.episodeTitle,
        synopsis: parsedData.synopsis,
        dialogue: parsedData.dialogue,
      }),
    };
  } catch (err) {
    console.error('Podcast generation error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Failed to generate podcast episode' }),
    };
  }
};
