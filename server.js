import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // Ensure 'node-fetch' or native fetch (Node 18+) is used

const app = express();
app.use(cors());
app.use(express.json());

// AppSheet API Configuration
const APPSHEET_APP_ID = process.env.APPSHEET_APP_ID;
const APPSHEET_APPLICATION_ACCESS_KEY = process.env.APPSHEET_APP_KEY;

app.get('/api/track/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const response = await fetch(
      `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/Songs/Action`,
      {
        method: 'POST',
        headers: {
          'ApplicationAccessKey': APPSHEET_APPLICATION_ACCESS_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Action: "Find",
          Properties: { Locale: "en-US" },
          Selector: `Filter(Songs, [TrackID] = "${id}")`
        })
      }
    );

    const data = await response.json();
    const songRecord = data[0];

    if (!songRecord) {
      return res.status(404).json({ error: "Track not found" });
    }

    // Transform AppSheet raw row into LyricsEngine JSON structure
    res.json({
      trackId: songRecord.TrackID,
      title: songRecord.Title,
      artist: songRecord.Artist,
      audioUrl: songRecord.AudioURL,
      lyrics: typeof songRecord.LyricsJSON === 'string' 
        ? JSON.parse(songRecord.LyricsJSON) 
        : songRecord.LyricsJSON
    });

  } catch (error) {
    console.error("AppSheet Fetch Error:", error);
    res.status(500).json({ error: "Failed to retrieve track from AppSheet API" });
  }
});
