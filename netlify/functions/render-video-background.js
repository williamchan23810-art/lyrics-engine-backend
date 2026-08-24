// netlify/functions/render-video-background.js
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const os = require('os');

ffmpeg.setFfmpegPath(ffmpegPath);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-render-'));

  try {
    const { title, images, audioUrl, durationPerFrameSec = 10 } = JSON.parse(event.body || '{}');

    if (!images || images.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No image keyframes provided.' }) };
    }

    // Save Base64 Images to Temporary Files
    const imagePaths = images.map((imgBase64, idx) => {
      const imgPath = path.join(tmpDir, `frame_${idx}.jpg`);
      const base64Data = imgBase64.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
      return imgPath;
    });

    // Create FFMPEG Concat File List
    const listPath = path.join(tmpDir, 'input.txt');
    let listContent = '';
    imagePaths.forEach((p) => {
      listContent += `file '${p}'\nduration ${durationPerFrameSec}\n`;
    });
    // Repeat last image to satisfy FFMPEG concat spec
    listContent += `file '${imagePaths[imagePaths.length - 1]}'\n`;
    fs.writeFileSync(listPath, listContent);

    const outputPath = path.join(tmpDir, 'output.mp4');

    // Execute FFMPEG Assembly Pipeline
    await new Promise((resolve, reject) => {
      let command = ffmpeg().input(listPath).inputOptions(['-f concat', '-safe 0']);

      // Attach audio track if present
      if (audioUrl) {
        command = command.input(audioUrl);
      }

      command
        .outputOptions([
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-preset fast',
          '-r 30',
          '-shortest', // Stop video when shortest input (audio or video) ends
        ])
        .output(outputPath)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });

    const videoBuffer = fs.readFileSync(outputPath);
    const videoBase64 = videoBuffer.toString('base64');

    // Cleanup Temp Dir
    fs.rmSync(tmpDir, { recursive: true, force: true });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        videoFileName: `${(title || 'Song').replace(/[^a-zA-Z0-9]/g, '')}-FinalRender.mp4`,
        videoBase64: `data:video/mp4;base64,${videoBase64}`,
      }),
    };
  } catch (err) {
    console.error('Video Assembly Error:', err);
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Video assembly failed.' }),
    };
  }
};
