//not working properly 

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  try {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    const urlParam = (req.query.url || "").toString();
    if (!urlParam) {
      res.status(400).send("Missing URL");
      return;
    }

    // Extract YouTube video ID
    let videoId;
    try {
      const urlObj = new URL(urlParam);
      if (urlObj.hostname === "youtu.be") {
        videoId = urlObj.pathname.replace("/", "").split("?")[0];
      } else if (urlObj.hostname.includes("youtube.com")) {
        videoId = urlObj.searchParams.get("v");
      }
    } catch (e) {
      res.status(400).send("Invalid YouTube URL");
      return;
    }

    if (!videoId) {
      res.status(400).send("Invalid YouTube URL");
      return;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const cookiesPath = path.join(process.cwd(), 'pages', 'api', 'cookie.txt');
    if (!fs.existsSync(cookiesPath)) {
      res.status(500).send("Error: pages/api/cookie.txt not found. Please export your YouTube cookies and save as 'pages/api/cookie.txt'.");
      return;
    }

    // Use yt-dlp with cookies
    const { stdout, stderr } = await execAsync(
      `yt-dlp --no-check-certificate --cookies "${cookiesPath}" -x --audio-format mp3 -o - "${videoUrl}"`
    );

    // Error handling
    if (
      (stderr && !stderr.includes("WARNING:")) ||
      (stderr && stderr.toLowerCase().includes('sign in to confirm you’re not a bot')) ||
      (stderr && stderr.toLowerCase().includes('error')) ||
      (stdout && stdout.toLowerCase().includes('error'))
    ) {
      if (stderr.toLowerCase().includes('sign in to confirm you’re not a bot')) {
        res.status(403).send("YouTube is blocking automated requests for this video. Please export a fresh cookies.txt while signed in, or try another video.");
      } else {
        res.status(500).send(`yt-dlp Error: ${stderr}`);
      }
      return;
    }

    // Set headers and send audio
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", `inline; filename="audio.mp3"`);
    res.send(stdout);

  } catch (err) {
    console.error("API Error:", err.message);
    res.status(500).send(`Error: ${err.message}`);
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
};