// ==========================================
// ROUTE 4: Automated Song Data & Shorts Prompt Grabber
// ==========================================
app.post('/api/ai/auto-song-generator', async (req, res) => {
  const { title, artist } = req.body;

  if (!title || !artist) {
    return res.status(400).json({ error: "Both Song Name and Artist Name are required." });
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `You are an expert Audio Engineer and Video Storyboard Director.
Target Track:
- Song Name: "${title}"
- Artist Name: "${artist}"

Tasks:
1. Retrieve or generate the complete lyrics for this song.
2. Format the lyrics into a timestamped JSON array of lines spaced naturally by vocal phrasing (in seconds).
3. Generate a 4-scene video storyboard with cinematic text-to-video prompts optimized for YouTube Shorts/Reels (16:9 widescreen or vertical composition).

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "${title}",
  "artist": "${artist}",
  "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  "lyrics": [
    { "startTime": 0, "text": "First lyric line..." },
    { "startTime": 5, "text": "Second lyric line..." }
  ],
  "storyboard": {
    "conceptOverview": "2-sentence creative visual overview of the video concept.",
    "scenes": [
      {
        "sceneNumber": 1,
        "lyricSegment": "Exact lyric line",
        "visualDescription": "Detailed shot description and lighting mood",
        "aiVideoPrompt": "Cinematic text-to-video prompt ending with --ar 16:9"
      }
    ]
  }
}`;

      const result = await model.generateContent(prompt);
      const generatedData = JSON.parse(result.response.text());
      return res.json(generatedData);
    } catch (err) {
      console.error("Auto Grabber Error:", err);
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
