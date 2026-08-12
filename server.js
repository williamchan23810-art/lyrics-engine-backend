import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 5000;

// Universal CORS Middleware for GitHub Pages Client
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Initialize Gemini Client with Render Environment Variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID || "8c478376-6cca-4f50-871b-03d4948fbd56";
const APPSHEET_APP_KEY = process.env.APPSHEET_APP_KEY;

// ==========================================
// ROUTE 1: GET Track & Synchronized Lyrics
// ==========================================
app.get('/api/track/:id', async (req, res) => {
  const { id } = req.params;

  if (APPSHEET_APP_KEY) {
    try {
      const response = await fetch(`https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/Table 1/Action`, {
        method: 'POST',
        headers: {
          'ApplicationAccessKey': APPSHEET_APP_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Action: "Find",
          Properties: { Locale: "en-US" },
          Selector: `Filter(Table 1, [_RowNumber] = "${id}")`
        })
      });

      const data = await response.json();
      if (data && data[0]) {
        const row = data[0];
        return res.json({
          trackId: row._RowNumber || id,
          title: row.Title || row.SongName || "Karaoke & Songs Appreciation",
          artist: row.Artist || "William H Chan Studio",
          audioUrl: row.AudioURL || row.Audio || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          lyrics: typeof row.LyricsJSON === 'string' ? JSON.parse(row.LyricsJSON) : (row.LyricsJSON || [])
        });
      }
    } catch (e) {
      console.error("AppSheet REST API Error:", e);
    }
  }

  // Fallback Payload
  res.json({
    trackId: id,
    title: "Karaoke & Songs Appreciation",
    artist: "William H Chan Studio",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    lyrics: [
      { startTime: 0, text: "Welcome to Lyrics-Engine Studio" },
      { startTime: 5, text: "Synchronized audio playback active" },
      { startTime: 10, text: "Switch typography using Cambria font controls" },
      { startTime: 15, text: "Click AI Storyboard to generate video prompts" }
    ]
  });
});

// ==========================================
// ROUTE 2: Dynamic Gemini AI Storyboard Generator
// ==========================================
app.post('/api/ai/storyboard', async (req, res) => {
  const { title, artist, lyrics } = req.body;

  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `You are an expert AI Cinematographer. Analyze the following track and return ONLY a valid JSON object matching this schema:
{
  "title": "Song Title",
  "conceptOverview": "A brief 2-sentence visual overview of the video concept.",
  "scenes": [
    {
      "sceneNumber": 1,
      "lyricSegment": "Exact line or snippet",
      "visualDescription": "Detailed shot description and lighting mood",
      "aiVideoPrompt": "Cinematic text-to-video generation prompt ending with --ar 16:9"
    }
  ]
}

Song Title: ${title || 'AppSheet Track'}
Artist: ${artist || 'Unknown'}
Lyrics:
${lyrics || 'Instrumental'}`;

      const result = await model.generateContent(prompt);
      const storyboardData = JSON.parse(result.response.text());
      return res.json(storyboardData);
    } catch (err) {
      console.error("Gemini Storyboard Generation Error:", err);
    }
  }

  // Fallback Storyboard Payload
  const lyricLines = lyrics ? lyrics.split('\n').filter(l => l.trim()) : [];
  res.json({
    title: title || "AppSheet Track",
    conceptOverview: `A visual narrative depicting key themes in "${title || 'AppSheet Track'}" by ${artist || 'William H Chan Studio'}.`,
    scenes: [
      {
        sceneNumber: 1,
        lyricSegment: lyricLines[0] || "Intro Line",
        visualDescription: "Atmospheric opening shot establishing tone and setting.",
        aiVideoPrompt: "Cinematic wide shot, dramatic moody lighting, photorealistic 8k --ar 16:9"
      },
      {
        sceneNumber: 2,
        lyricSegment: lyricLines[1] || "Verse Line",
        visualDescription: "Medium focal length tracking shot following character motion.",
        aiVideoPrompt: "Medium shot, golden hour illumination, warm tones, high detail --ar 16:9"
      },
      {
        sceneNumber: 3,
        lyricSegment: lyricLines[2] || "Chorus Line",
        visualDescription: "Peak visual energy matching chorus intensity.",
        aiVideoPrompt: "Dynamic camera movement, vibrant neon aesthetics, volumetric haze --ar 16:9"
      },
      {
        sceneNumber: 4,
        lyricSegment: lyricLines[3] || "Outro Line",
        visualDescription: "Resolving lingering shot concluding narrative arc.",
        aiVideoPrompt: "Wide reflective horizon at dusk, subtle particle effects, cinematic finish --ar 16:9"
      }
    ]
  });
});

// ==========================================
// ROUTE 3: AI Lyrics Editor & Formatter
// ==========================================
app.post('/api/ai/format-lyrics', async (req, res) => {
  const { title, artist, rawLyrics } = req.body;

  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `You are an expert Audio Engineer. Convert these raw lyrics into a JSON array of timestamped lines spaced naturally by vocal phrasing (in seconds). Return ONLY valid JSON:
[
  { "startTime": 0, "text": "First line" },
  { "startTime": 5, "text": "Second line" }
]

Song Title: ${title || 'Untitled'}
Artist: ${artist || 'Unknown'}
Raw Lyrics:
${rawLyrics}`;

      const result = await model.generateContent(prompt);
      const formattedLyrics = JSON.parse(result.response.text());
      return res.json({ lyrics: formattedLyrics });
    } catch (err) {
      console.error("Gemini Lyrics Editor Error:", err);
    }
  }

  // Fallback Formatter
  const fallbackLines = rawLyrics 
    ? rawLyrics.split('\n').filter(l => l.trim()).map((line, idx) => ({ startTime: idx * 5, text: line.trim() }))
    : [{ startTime: 0, text: "No lyrics provided." }];

  res.json({ lyrics: fallbackLines });
});

// ==========================================
// ROUTE 4: Automated Song Data & Shorts Prompt Grabber
// ==========================================
app.post('/api/ai/auto-song-generator', async (req, res) => {
  const { title, artist } = req.body;

  if (!title || !artist) {
    return res.status(400).json({ error: "Both Song Name and Artist Name are required." });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ WARNING: GEMINI_API_KEY is not defined in Render Environment Variables!");
  } else {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `You are an expert Audio Engineer and Video Storyboard Director.
Target Track:
- Song Name: "${title}"
- Artist Name: "${artist}"

Task:
1. Provide the complete real lyrics for this song formatted into a timestamped JSON array spaced naturally by vocal phrasing (in seconds).
2. Create a 4-scene video storyboard with cinematic text-to-video prompts for YouTube Shorts.

Return ONLY a valid JSON object matching this schema:
{
  "title": "${title}",
  "artist": "${artist}",
  "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "lyrics": [
    { "startTime": 0, "text": "First vocal line..." },
    { "startTime": 5, "text": "Second vocal line..." }
  ],
  "storyboard": {
    "conceptOverview": "2-sentence visual overview",
    "scenes": [
      {
        "sceneNumber": 1,
        "lyricSegment": "Target lyric snippet",
        "visualDescription": "Detailed shot description and lighting mood",
        "aiVideoPrompt": "Cinematic text-to-video generation prompt ending with --ar 16:9"
      }
    ]
  }
}`;

      const result = await model.generateContent(prompt);
      const generatedData = JSON.parse(result.response.text());
      return res.json(generatedData);
    } catch (err) {
      console.error("❌ Gemini Auto-Grab Execution Error:", err.message || err);
    }
  }

  // Fallback Payload
  res.json({
    title: title,
    artist: artist,
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    lyrics: [
      { startTime: 0, text: `Auto-generated lyrics for ${title}` },
      { startTime: 5, text: `Performed by ${artist}` },
      { startTime: 10, text: "Synchronized audio playback active" }
    ],
    storyboard: {
      conceptOverview: `A visual narrative depicting key themes in "${title}" by ${artist}.`,
      scenes: [
        {
          sceneNumber: 1,
          lyricSegment: title,
          visualDescription: "Atmospheric opening shot establishing tone.",
          aiVideoPrompt: "Cinematic wide shot, dramatic lighting, photorealistic 8k --ar 16:9"
        }
      ]
    }
  });
});

app.listen(PORT, () => console.log(`Server active on port ${PORT}`));
