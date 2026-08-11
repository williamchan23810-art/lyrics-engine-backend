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

// API Gateway Endpoint: Serve dynamic track metadata & lyrics JSON
app.get('/api/track/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
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
});

// Production environment routing: Serve static build from Vite
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Lyrics-Engine Server running on port ${PORT}`);
});
