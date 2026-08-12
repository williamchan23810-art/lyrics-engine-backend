import { GoogleGenerativeAI } from '@google/generative-ai';

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

  const apiKey = process.env.GEMINI_API_KEY;

  // Diagnostic Check: If Key is Missing Entirely
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'DIAGNOSTIC_FAILURE: GEMINI_API_KEY is not defined in Netlify process.env' 
      })
    };
  }

  try {
    const { title, artist } = JSON.parse(event.body || '{}');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `You are an expert Audio Engineer. Generate structured JSON for song "${title}" by "${artist}".
Return JSON schema:
{
  "title": "${title}",
  "artist": "${artist}",
  "audioUrl": null,
  "lyrics": [
    { "startTime": 0, "text": "Thematic highlight for ${title}" },
    { "startTime": 8, "text": "Key chorus cue" }
  ],
  "storyboard": {
    "conceptOverview": "Visual summary for ${title}",
    "scenes": [
      {
        "sceneNumber": 1,
        "lyricSegment": "${title}",
        "visualDescription": "Cinematic shot",
        "aiVideoPrompt": "Cinematic lighting --ar 16:9"
      }
    ]
  }
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (err) {
    // Expose exact API/Runtime error string directly to frontend for debugging
    console.error('LIVE_GEMINI_ERROR:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'GEMINI_RUNTIME_EXCEPTION',
        message: err.message || String(err),
        stack: err.stack || null
      })
    };
  }
}
