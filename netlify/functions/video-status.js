// netlify/functions/video-status.js
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing GEMINI_API_KEY' }) };

  try {
    const { operationName } = JSON.parse(event.body || '{}');
    if (!operationName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing operationName parameter' }) };
    }

    // Poll the Google Long-Running Operation Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to query operation status');
    }

    // Check if generation is done
    if (data.done) {
      const videoUri = data.response?.generatedVideos?.[0]?.video?.uri;
      const videoBase64 = data.response?.generatedVideos?.[0]?.video?.bytesBase64Encoded;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          done: true,
          videoUrl: videoUri || (videoBase64 ? `data:video/mp4;base64,${videoBase64}` : null),
        }),
      };
    }

    // Still processing
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ done: false, status: 'processing' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
