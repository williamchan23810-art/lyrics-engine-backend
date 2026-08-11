import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
app.use(express.json());

// Explicitly pass apiKey options object to satisfy constructor initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_KEY = process.env.APPSHEET_ACCESS_KEY;

app.post('/webhook/lyrics-engine', async (req, res) => {
  const { rowId, songTitle, artist } = req.body;

  if (!rowId || !songTitle || !artist) {
    return res.status(400).json({ error: 'Missing required payload parameters.' });
  }

  // Acknowledge webhook immediately to prevent execution timeout in AppSheet
  res.status(200).json({ status: 'Processing' });

  try {
    const prompt = `Analyze the song "${songTitle}" by "${artist}". Extract the music composer, lyricist, release year, origin backstory, song meaning, and generate an 8-frame Pixar 3D video storyboard sequence in 9:16 portrait ratio. Note: Users can search for full lyrics directly via Google Search.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert musicologist and creative animation director. Return structured output adhering strictly to schema.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            music_composer: { type: Type.STRING },
            lyricist: { type: Type.STRING },
            release_year: { type: Type.INTEGER },
            origin_story: { type: Type.STRING },
            song_meaning: { type: Type.STRING },
            frames: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  frame_number: { type: Type.INTEGER },
                  script: { type: Type.STRING },
                  pixar_prompt: { type: Type.STRING }
                },
                required: ["frame_number", "script", "pixar_prompt"]
              }
            }
          },
          required: ["music_composer", "lyricist", "release_year", "origin_story", "song_meaning", "frames"]
        }
      }
    });

    const parsed = JSON.parse(response.text);

    // Map payload back to AppSheet Table 1
    const updatePayload = {
      Action: "Edit",
      Properties: { Locale: "en-US" },
      Rows: [
        {
          "Row ID": rowId,
          "Status": "complete",
          "Music Composer": parsed.music_composer,
          "Lyricist": parsed.lyricist,
          "Release Year": parsed.release_year,
          "Origin Story": parsed.origin_story,
          "Song Meaning": parsed.song_meaning,
          "Frame 1": `[Script]: ${parsed.frames[0]?.script}\n\n[Pixar Prompt]: ${parsed.frames[0]?.pixar_prompt}`,
          "Frame 2": `[Script]: ${parsed.frames[1]?.script}\n\n[Pixar Prompt]: ${parsed.frames[1]?.pixar_prompt}`,
          "Frame 3": `[Script]: ${parsed.frames[2]?.script}\n\n[Pixar Prompt]: ${parsed.frames[2]?.pixar_prompt}`,
          "Frame 4": `[Script]: ${parsed.frames[3]?.script}\n\n[Pixar Prompt]: ${parsed.frames[3]?.pixar_prompt}`,
          "Frame 5": `[Script]: ${parsed.frames[4]?.script}\n\n[Pixar Prompt]: ${parsed.frames[4]?.pixar_prompt}`,
          "Frame 6": `[Script]: ${parsed.frames[5]?.script}\n\n[Pixar Prompt]: ${parsed.frames[5]?.pixar_prompt}`,
          "Frame 7": `[Script]: ${parsed.frames[6]?.script}\n\n[Pixar Prompt]: ${parsed.frames[6]?.pixar_prompt}`,
          "Frame 8": `[Script]: ${parsed.frames[7]?.script}\n\n[Pixar Prompt]: ${parsed.frames[7]?.pixar_prompt}`
        }
      ]
    };

    const targetUrl = `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/Table%201/Action`;

    await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'ApplicationAccessKey': APPSHEET_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload)
    });

  } catch (err) {
    console.error('Webhook execution failed:', err);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Lyrics Engine middleman running on port ${PORT}`));
