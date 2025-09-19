"use client"

import { useState } from "react"
import UploadForm from "../components/UploadForm"
import SongList from "../components/SongList"
import Player from "../components/Player"
import Visualizer from "../components/Visualizer"

export default function MusicVisualizerApp() {
  const [songs, setSongs] = useState([])
  const [currentSong, setCurrentSong] = useState(null)
  const [audioContext, setAudioContext] = useState(null)
  const [analyser, setAnalyser] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const addSong = (song) => {
    setSongs((prev) => [...prev, { ...song, id: Date.now() }])
  }

  const selectSong = (song) => {
    setCurrentSong(song)
    setIsPlaying(false)
  }

  const removeSong = (songId) => {
    setSongs((prev) => prev.filter((song) => song.id !== songId))
    // If the current song is being removed, clear it
    if (currentSong?.id === songId) {
      setCurrentSong(null)
      setIsPlaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/10 to-transparent"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="inline-block">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-purple-200 to-indigo-200 bg-clip-text text-transparent mb-4 tracking-tight">
              Music Visualizer
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-indigo-500 mx-auto rounded-full mb-4"></div>
          </div>
          <p className="text-slate-300 text-lg font-light">
            Experience your music like never before with premium visualizations
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-1 space-y-6">
            <UploadForm onAddSong={addSong} />
            <SongList songs={songs} currentSong={currentSong} onSelectSong={selectSong} onRemoveSong={removeSong} />
          </div>

          <div className="xl:col-span-3 space-y-6">
            <Visualizer audioContext={audioContext} analyser={analyser} isPlaying={isPlaying} />
            <Player
              currentSong={currentSong}
              onAudioContextChange={setAudioContext}
              onAnalyserChange={setAnalyser}
              onPlayingChange={setIsPlaying}
              isPlaying={isPlaying}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
