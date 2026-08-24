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

    const apiKey = process.env.GEMINI_API_KEY;

    // TIER 1: Official Google Imagen 3 Predict Endpoint
    if (apiKey) {
      try {
        const imagenUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
        
        const googleResponse = await fetch(imagenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt: prompt.trim() }],
            parameters: {
              sampleCount: 1,
              aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
              personGeneration: 'ALLOW_ADULT',
            },
          }),
        });

        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          const base64Bytes = googleData.predictions?.[0]?.bytesBase64Encoded;
          if (base64Bytes) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                source: 'google-imagen-3',
                imageBase64: `data:image/jpeg;base64,${base64Bytes}`,
              }),
            };
          }
        } else {
          console.warn('Google Imagen 3 returned status:', googleResponse.status);
        }
      } catch (googleErr) {
        console.warn('Google Imagen 3 execution warning, engaging failover:', googleErr.message);
      }
    }

    // TIER 2: Zero-Failure Ultra-HD Photorealistic Engine (Failover)
    const seed = Math.floor(Math.random() * 1000000);
    const width = aspectRatio === '9:16' ? 768 : 1280;
    const height = aspectRatio === '9:16' ? 1280 : 720;
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const fallbackImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    const imageFetch = await fetch(fallbackImageUrl);
    if (!imageFetch.ok) {
      throw new Error(`Fallback rendering failed with status ${imageFetch.status}`);
    }

    const arrayBuffer = await imageFetch.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString('base64');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        source: 'flux-fallback-engine',
        imageBase64: `data:image/jpeg;base64,${base64String}`,
      }),
    };
  } catch (err) {
    console.error('Image Generation Fatal Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Image synthesis failed' }),
    };
  }
};
