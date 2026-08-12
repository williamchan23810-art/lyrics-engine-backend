import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const { title, artist } = JSON.parse(event.body || '{}');

    if (!title || !artist) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Both Song Name and Artist Name are required.' })
      };
    }

    if (process.env.GEMINI_API_KEY) {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = `You are an expert Audio Engineer and AI Cinematographer.
Target Song: "${title}" by "${artist}"

Task:
1. Provide a timestamped sequence (spaced by 5-8 seconds) representing key song lines, thematic vocal summaries, and chorus cues.
2. Direct the user to search online for complete verbatim lyrics.
3. Generate a 4-scene video storyboard with cinematic text-to-video prompts for YouTube Shorts.

Return ONLY a valid JSON object matching this schema:
{
  "title": "${title}",
  "artist": "${artist}",
  "audioUrl": null,
  "lyrics": [
    { "startTime": 0, "text": "Verse 1: Visual interpretation of ${title}" },
    { "startTime": 8, "text": "Chorus: Key musical and vocal highlight" },
    { "startTime": 16, "text": "Note: Search online for official full lyrics" }
  ],
  "storyboard": {
    "conceptOverview": "A 2-sentence creative visual overview capturing the mood of ${title} by ${artist}.",
    "scenes": [
      {
        "sceneNumber": 1,
        "lyricSegment": "${title} Opening Theme",
        "visualDescription": "Cinematic shot establishing tone.",
        "aiVideoPrompt": "Cinematic wide shot, dramatic moody lighting, photorealistic 8k --ar 16:9"
      }
    ]
  }
}`;

      const result = await model.generateContent(prompt);
      const generatedData = JSON.parse(result.response.text());

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(generatedData)
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        title,
        artist,
        audioUrl: null,
        lyrics: [
          { startTime: 0, text: `Thematic Overview for ${title}` },
          { startTime: 6, text: `Originally performed by ${artist}` },
          { startTime: 12, text: 'Search online for official full lyrics' }
        ],
        storyboard: {
          conceptOverview: `A visual narrative depicting key themes in "${title}" by ${artist}.`,
          scenes: [
            {
              sceneNumber: 1,
              lyricSegment: title,
              visualDescription: 'Atmospheric opening shot establishing tone.',
              aiVideoPrompt: 'Cinematic wide shot, dramatic lighting, photorealistic 8k --ar 16:9'
            }
          ]
        }
      })
    };
  } catch (err) {
    console.error('Netlify Function Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process request.' })
    };
  }
}
