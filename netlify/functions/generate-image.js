// netlify/functions/generate-image.js
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({ status: 'ok' }) };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Missing GEMINI_API_KEY in environment variables.' }),
    };
  }

  try {
    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON request body.' }),
      };
    }

    const { prompt, aspectRatio = '16:9' } = payload;
    if (!prompt || !prompt.trim()) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt is required.' }),
      };
    }

    // Call Google Generative AI Imagen 3 Endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.trim(),
        numberOfImages: 1,
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
        outputMimeType: 'image/jpeg',
      }),
    });

    const rawText = await apiResponse.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: `Upstream API returned non-JSON: ${rawText.slice(0, 100)}` }),
      };
    }

    if (!apiResponse.ok) {
      const errMsg = data.error?.message || `Image API error (Status ${apiResponse.status})`;
      return {
        statusCode: apiResponse.status,
        headers,
        body: JSON.stringify({ error: errMsg }),
      };
    }

    const imgBytes = data.generatedImages?.[0]?.image?.imageBytes;
    if (!imgBytes) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'No image data returned from Imagen 3 model.' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        imageBase64: `data:image/jpeg;base64,${imgBytes}`,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal Server Error' }),
    };
  }
};
