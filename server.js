import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

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

const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID || "8c478376-6cca-4f50-871b-03d4948fbd56";
const APPSHEET_APP_KEY = process.env.APPSHEET_APP_KEY;

// Route 1: Retrieve Track Data & Lyrics
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
          title: row.Title || row.SongName || "AppSheet Track",
          artist: row.Artist || "AppSheet Artist",
          audioUrl: row.AudioURL || row.Audio || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
          lyrics: typeof row.LyricsJSON === 'string' ? JSON.parse(row.LyricsJSON) : (row.LyricsJSON || [])
        });
      }
    } catch (e) {
      console.error("AppSheet Fetch Error:", e);
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

// Route 2: Storyboard Agent Execution
app.post('/api/ai/storyboard', (req, res) => {
  const { title, artist, lyrics } = req.body;
  const lyricLines = lyrics ? lyrics.split('\n').filter(l => l.trim()) : [];

  res.json({
    title: title || "Untitled Track",
    conceptOverview: `Visual narrative portraying core thematic beats in "${title || 'this track'}" by ${artist || 'Artist'}. Designed for high-engagement video platforms.`,
    scenes: [
      {
        sceneNumber: 1,
        lyricSegment: lyricLines[0] || "Intro Line",
        visualDescription: "Cinematic establishing shot setting up narrative mood.",
        aiVideoPrompt: "Cinematic wide shot, atmospheric moody lighting, photorealistic, 8k --ar 16:9"
      },
      {
        sceneNumber: 2,
        lyricSegment: lyricLines[1] || "Verse Line",
        visualDescription: "Medium focal length shot tracking character expression.",
        aiVideoPrompt: "Medium shot, golden hour glow, warm color grading, hyper-detailed --ar 16:9"
      },
      {
        sceneNumber: 3,
        lyricSegment: lyricLines[2] || "Chorus Peak",
        visualDescription: "Dynamic visual climax aligned with peak musical energy.",
        aiVideoPrompt: "Fast motion camera tracking, vibrant neon aesthetics, volumetric haze --ar 16:9"
      },
      {
        sceneNumber: 4,
        lyricSegment: lyricLines[3] || "Outro Fade",
        visualDescription: "Resolving lingering shot concluding the narrative arc.",
        aiVideoPrompt: "Wide horizon reflection at dusk, subtle particle atmosphere, cinematic finish --ar 16:9"
      }
    ]
  });
});

app.listen(PORT, () => console.log(`Gateway listening on port ${PORT}`));
