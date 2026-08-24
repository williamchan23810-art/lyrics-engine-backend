// netlify/functions/render-video-background.js
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const os = require('os');

ffmpeg.setFfmpegPath(ffmpegPath);

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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-assembly-'));

  try {
    const { title = 'Song Storyboard', images = [], durationPerFrameSec = 8 } = JSON.parse(event.body || '{}');

    if (!images || images.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No image keyframes provided.' }),
      };
    }

    // Write base64 buffers to temp files
    const imagePaths = images.map((imgBase64, idx) => {
      const imgPath = path.join(tmpDir, `frame_${idx}.jpg`);
      const base64Data = imgBase64.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
      return imgPath;
    });

    // Generate FFMPEG Concat Demuxer Script
    const listPath = path.join(tmpDir, 'input.txt');
    let listContent = '';
    imagePaths.forEach((p) => {
      listContent += `file '${p.replace(/\\/g, '/')}'\nduration ${durationPerFrameSec}\n`;
    });
    listContent += `file '${imagePaths[imagePaths.length - 1].replace(/\\/g, '/')}'\n`;
    fs.writeFileSync(listPath, listContent);

    const outputPath = path.join(tmpDir, 'output.mp4');

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(listPath)
        .inputOptions(['-f concat', '-safe 0'])
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-preset fast',
          '-r 30',
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const videoBuffer = fs.readFileSync(outputPath);
    const videoBase64 = videoBuffer.toString('base64');

    fs.rmSync(tmpDir, { recursive: true, force: true });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        videoFileName: `${title.replace(/[^a-zA-Z0-9]/g, '')}-Story-Reel.mp4`,
        videoBase64: `data:video/mp4;base64,${videoBase64}`,
      }),
    };
  } catch (err) {
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Video stitching failed.' }),
    };
  }
};
