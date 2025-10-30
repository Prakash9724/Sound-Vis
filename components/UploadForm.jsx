"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"

export default function UploadForm({ onAddSong }) {
  const [youtubeUrl, setYoutubeUrl] = useState("")

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && (file.type.includes("audio") || file.type.includes("video"))) {
      const url = URL.createObjectURL(file)
      onAddSong({
        title: file.name.replace(/\.[^/.]+$/, ""),
        type: "local",
        url: url,
        file: file,
      })
      event.target.value = ""
    }
  }

  const handleYouTubeSubmit = (e) => {
    e.preventDefault()
    if (youtubeUrl.trim()) {
      // Extract video ID from YouTube URL
      const videoId = extractYouTubeId(youtubeUrl)
      if (videoId) {
        onAddSong({
          title: `YouTube Video - ${videoId}`,
          type: "youtube",
          url: youtubeUrl,
          videoId: videoId,
        })
        setYoutubeUrl("")
      }
    }
  }

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Add Music</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Local File Upload */}
        <div>
          <Label htmlFor="file-upload" className="text-slate-300">
            Upload Local File
          </Label>
          <Input
            id="file-upload"
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileUpload}
            className="bg-slate-700 border-slate-600 text-white file:bg-slate-600 file:text-white file:border-0"
          />
        </div>

        {/* YouTube URL */}
        {/* <form onSubmit={handleYouTubeSubmit}>
          <Label htmlFor="youtube-url" className="text-slate-300">
            YouTube URL
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Add
            </Button>
          </div>
        </form> */}
      </CardContent>
    </Card>
  )
}
