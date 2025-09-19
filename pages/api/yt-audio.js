import ytdl from "@distube/ytdl-core"

function normalizeYoutubeUrl(raw) {
  try {
    const u = new URL(raw)
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "").trim()
      if (id) return `https://www.youtube.com/watch?v=${id}`
    }
    if (/\.youtube\./.test(u.hostname)) {
      const v = u.searchParams.get("v")
      if (v) return `https://www.youtube.com/watch?v=${v}`
    }
  } catch {}
  return raw
}

export default async function handler(req, res) {
  try {
    const urlParam = (req.query.url || "").toString()
    if (!urlParam) {
      res.status(400).send("Missing url")
      return
    }

    const normalized = normalizeYoutubeUrl(urlParam)
    if (!ytdl.validateURL(normalized)) {
      res.status(400).send("Invalid YouTube URL")
      return
    }

    const info = await ytdl.getInfo(normalized)
    const audioOnly = ytdl.filterFormats(info.formats, "audioonly") || []
    // Prefer MP4/M4A container when available, else fallback to webm/opus
    const mp4First = audioOnly.find((f) => (f.container === "mp4") || (f.mimeType || "").includes("audio/mp4"))
    const chosen = mp4First || audioOnly[0]
    if (!chosen) {
      res.status(500).send("No audio stream available")
      return
    }

    // Headers
    res.setHeader("Cache-Control", "no-store")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("Content-Disposition", "inline; filename=audio.m4a")

    const contentType = chosen.mimeType || (chosen.container === "mp4" ? "audio/mp4; codecs=\"mp4a.40.2\"" : "audio/webm; codecs=\"opus\"")
    res.setHeader("Content-Type", contentType)

    // If ytdl exposes content length, forward it
    const len = Number(chosen.contentLength || 0)
    if (!Number.isNaN(len) && len > 0) {
      res.setHeader("Content-Length", String(len))
    }

    // Always send 200 OK (avoid partial content issues)
    res.status(200)

    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': '*/*',
      'Origin': 'https://www.youtube.com',
      'Referer': 'https://www.youtube.com/'
    }

    const stream = ytdl(normalized, {
      quality: "highestaudio",
      filter: "audioonly",
      highWaterMark: 1 << 25,
      format: chosen,
      requestOptions: {
        headers: {
          ...commonHeaders,
          ...(req.headers.range ? { Range: req.headers.range } : {}),
        },
      },
    })

    stream.on("error", (err) => {
      console.error("/pages/api/yt-audio stream error", err)
      try { res.end() } catch {}
    })

    stream.pipe(res)
  } catch (err) {
    console.error('/pages/api/yt-audio error', err)
    res.status(500).send(typeof err?.message === 'string' ? err.message : 'Failed to fetch audio')
  }
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: false,
  },
} 