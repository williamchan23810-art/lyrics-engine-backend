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
      body: JSON.stringify({ error: 'Missing GEMINI_API_KEY environment variable' }),
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

    // Google Generative Multimodal Image Endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Generate a high-quality cinematic keyframe image in ${aspectRatio} aspect ratio: ${prompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      },
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Fallback: If gemini-2.5-flash-image returns model error, try standard imagen endpoint structure
      const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:generateImages?key=${apiKey}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          numberOfImages: 1,
          aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
          outputMimeType: 'image/jpeg',
        }),
      });

      const fallbackData = await fallbackRes.json();
      if (!fallbackRes.ok) {
        throw new Error(data.error?.message || fallbackData.error?.message || 'Image generation failed');
      }

      const imgBytes = fallbackData.generatedImages?.[0]?.image?.imageBytes;
      if (imgBytes) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            imageBase64: `data:image/jpeg;base64,${imgBytes}`,
          }),
        };
      }
    }

    // Parse image from Gemini Native parts
    const parts = data.candidates?.[0]?.content?.parts || [];
    let imageBase64 = null;

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        const mime = part.inlineData.mimeType || 'image/jpeg';
        imageBase64 = `data:${mime};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageBase64) {
      throw new Error('No image was returned in the model response.');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        imageBase64: imageBase64,
      }),
    };
  } catch (err) {
    console.error('Image Generation Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Image synthesis failed' }),
    };
  }
};
