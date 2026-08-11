import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/ai/storyboard', async (req, res) => {
  const { title, artist, lyrics } = req.body;

  // System instructions for structured JSON output
  const systemInstruction = `You are an expert cinematic director. Analyze the provided song title, artist, and lyrics, then generate a 4-scene video storyboard.
Return ONLY a valid JSON object with this exact structure:
{
  "title": "Song Title",
  "conceptOverview": "A 2-sentence visual overview of the video concept.",
  "scenes": [
    {
      "sceneNumber": 1,
      "lyricSegment": "Short lyric snippet",
      "visualDescription": "Description of the visual action and lighting.",
      "aiVideoPrompt": "Cinematic prompt ending with --ar 16:9"
    }
  ]
}`;

  try {
    if (process.env.GEMINI_API_KEY) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Song Title: ${title || 'AppSheet Track'}\nArtist: ${artist || 'Unknown'}\nLyrics:\n${lyrics || ''}`,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json'
        }
      });

      const storyboardData = JSON.parse(response.text);
      return res.json(storyboardData);
    }
  } catch (err) {
    console.error("Gemini AI API Error, falling back:", err);
  }

  // Resilient Fallback Payload
  res.json({
    title: title || "AppSheet Track",
    conceptOverview: `A visual narrative depicting key themes in "${title || 'AppSheet Track'}" by ${artist || 'Elton John'}. Optimized for video generation.`,
    scenes: [
      {
        sceneNumber: 1,
        lyricSegment: "Intro Line",
        visualDescription: "Atmospheric opening shot establishing tone and setting.",
        aiVideoPrompt: "Cinematic wide shot, dramatic moody lighting, photorealistic, 8k --ar 16:9"
      },
      {
        sceneNumber: 2,
        lyricSegment: "Verse Line",
        visualDescription: "Medium focal length shot tracking subject motion.",
        aiVideoPrompt: "Medium shot, golden hour illumination, warm tones, high detail --ar 16:9"
      },
      {
        sceneNumber: 3,
        lyricSegment: "Chorus Line",
        visualDescription: "Peak visual energy matching chorus intensity.",
        aiVideoPrompt: "Dynamic camera movement, vibrant neon aesthetics, volumetric haze --ar 16:9"
      },
      {
        sceneNumber: 4,
        lyricSegment: "Outro Line",
        visualDescription: "Resolving lingering shot concluding narrative arc.",
        aiVideoPrompt: "Wide reflective horizon at dusk, subtle particle effects, cinematic finish --ar 16:9"
      }
    ]
  });
});
