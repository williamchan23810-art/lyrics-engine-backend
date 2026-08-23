// netlify/functions/generate-image.js
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Missing GEMINI_API_KEY in environment variables' }),
    };
  }

  try {
    const { prompt, aspectRatio = '16:9' } = JSON.parse(event.body || '{}');

    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing prompt parameter' }),
      };
    }

    // Call Google Imagen 3 API Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;

    const payload = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: aspectRatio, // "16:9" or "9:16" or "1:1"
        outputMimeType: 'image/jpeg',
        compressionQuality: 85,
        personGeneration: 'ALLOW_ADULT',
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate image via Imagen 3');
    }

    const base64Bytes = data.predictions?.[0]?.bytesBase64Encoded;
    if (!base64Bytes) {
      throw new Error('No image payload returned from Imagen 3 model');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        imageBase64: `data:image/jpeg;base64,${base64Bytes}`,
      }),
    };
  } catch (err) {
    console.error('Imagen 3 Generation Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Image synthesis failed' }),
    };
  }
};
