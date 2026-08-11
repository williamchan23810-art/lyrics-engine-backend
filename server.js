import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for your live GitHub Pages frontend and local dev environments
app.use(cors({
  origin: [
    'https://williamchan23810-art.github.io',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// AppSheet Configuration Settings
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID || "8c478376-6cca-4f50-871b-03d4948fbd56";
const APPSHEET_APP_KEY = process.env.APPSHEET_APP_KEY;

// ==========================================
// ROUTE 1: GET Track & Synchronized Lyrics
// ==========================================
app.get('/api/track/:id', async (req, res) => {
  const { id } = req.params;

  // Query AppSheet REST API v2 if the Application Access Key is present
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
          title: row.Title || row.SongName || "AppSheet Track",
          artist: row.Artist || "AppSheet Artist",
          audioUrl: row.AudioURL || row.Audio || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          lyrics: typeof row.LyricsJSON === 'string' ? JSON.parse(row.LyricsJSON) : (row.LyricsJSON || [])
        });
      }
    } catch (e) {
      console.error("AppSheet REST API Error:", e);
    }
  }

  // Fallback Payload: Ensures UI renders immediately even without an active key
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
// ROUTE 2: AI Storyboard Prompt Generator
// ==========================================
app.post('/api/ai/storyboard', (req, res) => {
  const { title, artist, lyrics } = req.body;
  const lyricLines = lyrics ? lyrics.split('\n').filter(l => l.trim()) : [];

  const storyboardPayload = {
    title: title || "Untitled Track",
    conceptOverview: `A visual narrative depicting key themes in "${title || 'this track'}" by ${artist || 'Artist'}. Optimized for video generation.`,
    scenes: [
      {
        sceneNumber: 1,
        lyricSegment: lyricLines[0] || "Intro Line",
        visualDescription: "Atmospheric opening shot establishing tone and setting.",
        aiVideoPrompt: "Cinematic wide shot, dramatic moody lighting, photorealistic, 8k --ar 16:9"
      },
      {
        sceneNumber: 2,
        lyricSegment: lyricLines[1] || "Verse Line",
        visualDescription: "Medium focal length shot tracking subject motion.",
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
  };

  res.json(storyboardPayload);
});

// Start Express Gateway
app.listen(PORT, () => console.log(`Lyrics-Engine Gateway listening on port ${PORT}`));
