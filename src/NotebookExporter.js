/**
 * Utility to format track lyrics, metadata, and AI Storyboard data 
 * into clean, structured Markdown for easy notebook archiving.
 */

export const generateNotebookMarkdown = (trackData, storyboardData) => {
  const dateStamp = new Date().toISOString().split('T')[0];

  let md = `# Track Entry: ${trackData?.title || 'Untitled Track'}\n`;
  md += `**Artist:** ${trackData?.artist || 'Unknown Artist'}\n`;
  md += `**Date Archived:** ${dateStamp}\n`;
  md += `**Track ID:** \`${trackData?.trackId || 'N/A'}\` \n\n`;

  md += `---\n\n## 🎵 Synchronized Lyrics JSON\n\`\`\`json\n`;
  md += JSON.stringify(trackData?.lyrics || [], null, 2);
  md += `\n\`\`\`\n\n`;

  if (storyboardData) {
    md += `---\n\n## 🎬 AI Storyboard Concepts\n`;
    md += `**Overview:** ${storyboardData.conceptOverview || 'N/A'}\n\n`;

    storyboardData.scenes?.forEach((scene) => {
      md += `### Scene ${scene.sceneNumber}: "${scene.lyricSegment}"\n`;
      md += `- **Visual Description:** ${scene.visualDescription}\n`;
      md += `- **AI Video Prompt:** \`${scene.aiVideoPrompt}\` \n\n`;
    });
  }

  return md;
};

export const copyToNotebookClipboard = async (trackData, storyboardData) => {
  const markdown = generateNotebookMarkdown(trackData, storyboardData);
  try {
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch (err) {
    console.error("Clipboard write failed:", err);
    return false;
  }
};
