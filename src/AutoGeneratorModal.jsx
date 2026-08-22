// src/AutoGeneratorModal.jsx
const handleStartGrabbing = async (e) => {
  e.preventDefault();
  if (!songTitle.trim() || !artistName.trim()) {
    setError("Please fill out both Song Name and Artist Name.");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const response = await fetch('/.netlify/functions/grab-lyrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        title: songTitle.trim(),
        artist: artistName.trim(),
        songName: songTitle.trim(),
        artistName: artistName.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server responded with HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.lines || data.lines.length === 0) {
      throw new Error("No lyrics found for this song. Please try another track.");
    }

    if (onSongGenerated) {
      onSongGenerated(data);
    }

    onClose();
  } catch (err) {
    console.error("Auto Grabber Error:", err);
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      setError("Network error: Serverless function unreachable. Check deployment status.");
    } else {
      setError(err.message || "Unable to grab track data automatically. Please try again.");
    }
  } finally {
    setLoading(false);
  }
};
