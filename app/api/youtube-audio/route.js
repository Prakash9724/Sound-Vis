import ytdl from "ytdl-core"
import { Readable } from "stream"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function nodeReadableToWebReadable(nodeReadable) {
  if (Readable && typeof Readable.toWeb === "function") {
    try {
      return Readable.toWeb(nodeReadable)
    } catch {}
  }
  return new ReadableStream({
    start(controller) {
      nodeReadable.on("data", (chunk) => controller.enqueue(chunk))
      nodeReadable.on("end", () => controller.close())
      nodeReadable.on("error", (err) => controller.error(err))
    },
    cancel() {
      try {
        nodeReadable.destroy()
      } catch {}
    },
  })
}

function normalizeYoutubeUrl(raw) {
  try {
    const u = new URL(raw)
    // youtu.be short URL
    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "").trim()
      if (id) return `https://www.youtube.com/watch?v=${id}`
    }
    // music.youtube or m.youtube -> www.youtube
    if (/\.youtube\./.test(u.hostname)) {
      const v = u.searchParams.get("v")
      if (v) return `https://www.youtube.com/watch?v=${v}`
    }
  } catch {}
  return raw
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    let url = searchParams.get("url")

    if (!url) {
      return new Response("Missing url", { status: 400 })
    }

    url = normalizeYoutubeUrl(url)

    if (!ytdl.validateURL(url)) {
      return new Response("Invalid YouTube URL", { status: 400 })
    }

    const rangeHeader = request.headers.get("range") || undefined

    const info = await ytdl.getInfo(url)
    // Filter audio-only formats
    const audioOnly = ytdl.filterFormats(info.formats, "audioonly") || []
    // Prefer mp4/m4a, else fallback to webm/opus
    const preferredMp4 = audioOnly.find((f) => (f.mimeType || "").includes("audio/mp4"))
    const fallback = audioOnly[0]
    const chosen = preferredMp4 || fallback

    if (!chosen) {
      return new Response("No audio stream available", { status: 500 })
    }

    const headers = new Headers()
    headers.set("Cache-Control", "no-store")
    headers.set("Access-Control-Allow-Origin", "*")

    const contentType = chosen.mimeType?.split(";")?.[0] || (preferredMp4 ? "audio/mp4" : "audio/webm")
    headers.set("Content-Type", contentType)
    headers.set("Accept-Ranges", "bytes")

    const requestOptions = {}
    if (rangeHeader) {
      requestOptions.headers = { Range: rangeHeader }
    }

    const stream = ytdl(url, {
      quality: preferredMp4 ? "highestaudio" : "highestaudio",
      filter: "audioonly",
      highWaterMark: 1 << 25,
      requestOptions,
      format: chosen,
    })

    // We don't always know total length; let the browser handle progressive
    if (rangeHeader) {
      return new Response(nodeReadableToWebReadable(stream), { status: 206, headers })
    }

    return new Response(nodeReadableToWebReadable(stream), { status: 200, headers })
  } catch (err) {
    console.error("/api/youtube-audio error", err)
    const message = typeof err?.message === "string" ? err.message : "Failed to fetch audio"
    return new Response(message, { status: 500 })
  }
} 