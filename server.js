import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// AppSheet API Configuration
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID || "8c478376-6cca-4f50-871b-03d4948fbd56";
const APPSHEET_APP_KEY = process.env.APPSHEET_APP_KEY;

/**
 * Helper to query AppSheet API v2
 */
async function queryAppSheet(tableName, action = "Find", selector = "") {
  const url = `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${tableName}/Action`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'ApplicationAccessKey': APPSHEET_APP_KEY || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      Action: action,
      Properties: { Locale: "en-US" },
      Selector: selector
    })
  });

  if (!response.ok) {
    throw new Error(`AppSheet API Http Error: ${response.statusText}`);
  }

  return await response.json();
}

// ==========================================
// API ROUTE 1: Track Catalog from AppSheet
// ==========================================
app.get('/api/tracks', async (req, res) => {
  try {
    const rawData = await queryAppSheet("Table 1", "Find");
    
    const tracks = rawData.map(row => ({
      trackId: row._RowNumber || row.ID || row.TrackID,
      title: row.Title || row.SongName || "Untitled Track",
      artist: row.Artist || "Unknown Artist",
      audioUrl: row.AudioURL || row.Audio || "",
      hasLyrics: Boolean(row.Lyrics || row.LyricsJSON)
    }));

    res.json(tracks);
  } catch (error) {
    console.error("AppSheet Catalog Fetch Error:", error);
    // Fallback data if AppSheet key is not yet configured in environment
    res.json([
      {
        trackId: "1",
        title: "Sample Song Title",
        artist: "Artist Name",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        hasLyrics: true
      }
    ]);
  }
});

// ==========================================
// API ROUTE 2: Single Track Details & Lyrics
// ==========================================
app.get('/api/track/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const rawData = await queryAppSheet("Table 1", "Find", `Filter(Table 1, [_RowNumber] = "${id}")`);
    const row = rawData[0];

    if (!row) {
      // Fallback response for initial testing / development
      return res.json({
        trackId: id,
        title: "Sample Song Title",
        artist: "Artist Name",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        lyrics: [
          { startTime: 0, text: "Intro Instrumental..." },
          { startTime: 10, text: "First line of synchronized lyrics" },
          { startTime: 15, text: "Second line scrolling into view smoothly" },
          { startTime: 20, text: "Enjoy your custom Lyrics-Engine interface!" }
        ]
      });
    }

    let parsedLyrics = [];
    try {
      parsedLyrics = typeof row.LyricsJSON === 'string' ? JSON.parse(row.LyricsJSON) : (row.LyricsJSON || []);
    } catch (e) {
      if (row.Lyrics) {
        parsedLyrics = row.Lyrics.split('\n').map((line, idx) => ({
          startTime: idx * 5,
          text: line.trim()
        }));
      }
    }

    res.json({
      trackId: row._RowNumber || id,
      title: row.Title || row.SongName || "Untitled Track",
      artist: row.Artist || "Unknown Artist",
      audioUrl: row.AudioURL || row.Audio,
      lyrics: parsedLyrics
    });
  } catch (error) {
    console.error("AppSheet Single Track Fetch Error:", error);
    res.json({
      trackId: id,
      title: "Sample Track (Fallback)",
      artist: "Lyrics Engine",
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      lyrics: [
        { startTime: 0, text: "Welcome to Lyrics-Engine Studio" },
        { startTime: 5, text: "Connect your AppSheet API key to load live tracks" }
      ]
    });
  }
});

// ==========================================
// API ROUTE 3: AI Storyboard Generator
// ==========================================
app.post('/api/ai/storyboard', (req, res) => {
  const { title, artist, lyrics } = req.body;

  const lyricLines = lyrics ? lyrics.split('\n').filter(l => l.trim().length > 0) : [];

  res.json({
    title: title || "Untitled Track",
    conceptOverview: `A visual narrative depicting key themes in "${title || 'this track'}" by ${artist || 'Artist'}. Designed for high-engagement short videos.`,
    scenes: [
      {
        sceneNumber: 1,
        lyricSegment: lyricLines[0] || "Intro Instrumental",
        visualDescription: "Atmospheric establishing shot setting up mood and environment.",
        aiVideoPrompt: "Cinematic wide shot, dramatic moody lighting, 8k resolution, photorealistic, slow panning shot --ar 16:9"
      },
      {
        sceneNumber: 2,
        lyricSegment: lyricLines[1] || lyricLines[0] || "Verse Theme",
        visualDescription: "Close-up performance element or character expression.",
        aiVideoPrompt: "Medium close-up shot, shallow depth of field, warm golden hour glow, highly detailed --ar 16:9"
      },
      {
        sceneNumber: 3,
        lyricSegment: lyricLines[2] || "Chorus Climax",
        visualDescription: "High-energy visual climax matching peak musical intensity.",
        aiVideoPrompt: "Dynamic motion shot, vibrant colorful neon aesthetics, volumetric lighting, hyper-realistic --ar 16:9"
      },
      {
        sceneNumber: 4,
        lyricSegment: lyricLines[3] || "Outro Fade",
        visualDescription: "Resolving shot concluding the visual story arc.",
        aiVideoPrompt: "Wide reflective horizon, sunset fading into night, calm cinematic composition --ar 16:9"
      }
    ]
  });
});

// ==========================================
// STATIC ASSETS (Vite Production Build)
// ==========================================
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Lyrics-Engine Server running on port ${PORT}`);
});
