"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { Play, Pause, Volume2, VolumeX } from "lucide-react"

export default function Player({ currentSong, onAudioContextChange, onAnalyserChange, onPlayingChange, isPlaying }) {
  const audioRef = useRef(null)
  const youtubePlayerRef = useRef(null)
  const audioContextRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const analyserRef = useRef(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  const [youtubeReady, setYoutubeReady] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const connectedFlagKey = useRef("wacConnected")

  const cleanupAudioContext = useCallback(() => {
    console.log("[v0] Cleaning up audio context")

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect()
        console.log("[v0] Source node disconnected")
      } catch (error) {
        console.log("[v0] Source already disconnected:", error.message)
      }
      sourceNodeRef.current = null
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
        console.log("[v0] Analyser disconnected")
      } catch (error) {
        console.log("[v0] Analyser already disconnected:", error.message)
      }
      analyserRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        audioContextRef.current.close()
        console.log("[v0] Audio context closed")
      } catch (error) {
        console.log("[v0] Error closing audio context:", error.message)
      }
      audioContextRef.current = null
    }
  }, [])

  const setupAudioContext = useCallback(
    (audioElement) => {
      if (!audioElement) {
        console.log("[v0] No audio element provided")
        return
      }

      // Avoid creating multiple sources for the same HTMLMediaElement lifetime
      if (audioElement.dataset && audioElement.dataset[connectedFlagKey.current] === "1") {
        console.log("[v0] Media element already connected; skipping source creation")
        return
      }

      console.log("[v0] Setting up audio context for new song")

      // Clean up any existing audio context first
      cleanupAudioContext()

      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)()
        const analyser = audioContext.createAnalyser()

        // Wait a bit to ensure previous cleanup is complete
        setTimeout(() => {
          try {
            const source = audioContext.createMediaElementSource(audioElement)

            analyser.fftSize = 256
            source.connect(analyser)
            analyser.connect(audioContext.destination)

            audioContextRef.current = audioContext
            sourceNodeRef.current = source
            analyserRef.current = analyser

            if (audioElement.dataset) audioElement.dataset[connectedFlagKey.current] = "1"

            onAudioContextChange(audioContext)
            onAnalyserChange(analyser)

            console.log("[v0] Audio context setup successful")
          } catch (error) {
            console.error("[v0] Error creating media element source:", error)
            audioContext.close()
          }
        }, 100)
      } catch (error) {
        console.error("[v0] Error setting up audio context:", error)
      }
    },
    [cleanupAudioContext, onAudioContextChange, onAnalyserChange],
  )

  const handleLoadedMetadata = useCallback(() => {
    console.log("[v0] Metadata loaded")
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setupAudioContext(audioRef.current)
      setIsBuffering(false)
    }
  }, [setupAudioContext])

  // Buffering state handlers for reliable UX
  const attachBufferingHandlers = useCallback((el) => {
    if (!el) return
    const onCanPlay = () => setIsBuffering(false)
    const onPlaying = () => setIsBuffering(false)
    const onLoadedData = () => setIsBuffering(false)
    const onWaiting = () => setIsBuffering(true)
    const onError = () => setIsBuffering(false)
    const onStalled = () => setIsBuffering(true)
    const onAbort = () => setIsBuffering(false)

    el.addEventListener("canplay", onCanPlay)
    el.addEventListener("playing", onPlaying)
    el.addEventListener("loadeddata", onLoadedData)
    el.addEventListener("waiting", onWaiting)
    el.addEventListener("error", onError)
    el.addEventListener("stalled", onStalled)
    el.addEventListener("abort", onAbort)

    return () => {
      el.removeEventListener("canplay", onCanPlay)
      el.removeEventListener("playing", onPlaying)
      el.removeEventListener("loadeddata", onLoadedData)
      el.removeEventListener("waiting", onWaiting)
      el.removeEventListener("error", onError)
      el.removeEventListener("stalled", onStalled)
      el.removeEventListener("abort", onAbort)
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [])

  const handlePlay = useCallback(() => {
    console.log("[v0] Audio started playing")
    onPlayingChange(true)
  }, [onPlayingChange])

  const handlePause = useCallback(() => {
    console.log("[v0] Audio paused")
    onPlayingChange(false)
  }, [onPlayingChange])

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

      window.onYouTubeIframeAPIReady = () => {
        setYoutubeReady(true)
      }
    } else {
      setYoutubeReady(true)
    }
  }, [])

  useEffect(() => {
    if (!currentSong) {
      console.log("[v0] No current song, cleaning up")
      cleanupAudioContext()
      return
    }

    console.log("[v0] Switching to new song:", currentSong.title)

    // Always cleanup first
    cleanupAudioContext()

    if (currentSong.type === "local") {
      // Create a new audio element for each song to avoid connection issues
      const newAudio = document.createElement("audio")
      newAudio.crossOrigin = "anonymous"
      
      // Remove old audio element if it exists
      if (audioRef.current) {
        const oldAudio = audioRef.current
        oldAudio.removeEventListener("loadedmetadata", handleLoadedMetadata)
        oldAudio.removeEventListener("timeupdate", handleTimeUpdate)
        oldAudio.removeEventListener("play", handlePlay)
        oldAudio.removeEventListener("pause", handlePause)
        oldAudio.pause()
        oldAudio.src = ""
        oldAudio.load()
      }

      // Set the new audio element
      audioRef.current = newAudio

      // Add event listeners for new song
      newAudio.addEventListener("loadedmetadata", handleLoadedMetadata)
      newAudio.addEventListener("timeupdate", handleTimeUpdate)
      newAudio.addEventListener("play", handlePlay)
      newAudio.addEventListener("pause", handlePause)
      attachBufferingHandlers(newAudio)

      // Set the source and load
      newAudio.src = currentSong.url
      newAudio.load()

      console.log("[v0] Local audio setup complete")
    } else if (currentSong.type === "youtube") {
      // Play YouTube via our audio streaming API using the in-DOM audio element
      const el = audioRef.current
      if (!el) return
      el.removeEventListener("loadedmetadata", handleLoadedMetadata)
      el.removeEventListener("timeupdate", handleTimeUpdate)
      el.removeEventListener("play", handlePlay)
      el.removeEventListener("pause", handlePause)
      el.pause()
      el.src = ""
      el.load()

      el.addEventListener("loadedmetadata", handleLoadedMetadata)
      el.addEventListener("timeupdate", handleTimeUpdate)
      el.addEventListener("play", handlePlay)
      el.addEventListener("pause", handlePause)
      attachBufferingHandlers(el)

      const ytUrl = currentSong.url || (currentSong.videoId ? `https://www.youtube.com/watch?v=${currentSong.videoId}` : "")
      setIsBuffering(true)
      el.src = `/api/yt-audio?url=${encodeURIComponent(ytUrl)}`
      el.load()

      console.log("[v0] YouTube audio via <audio> setup complete")
    }
  }, [
    currentSong,
    youtubeReady,
    cleanupAudioContext,
    handleLoadedMetadata,
    handleTimeUpdate,
    handlePlay,
    handlePause,
    onPlayingChange,
  ])

  useEffect(() => {
    return () => {
      console.log("[v0] Component unmounting, cleaning up")
      cleanupAudioContext()
      if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
        youtubePlayerRef.current.destroy()
      }
    }
  }, [cleanupAudioContext])

  const togglePlay = () => {
    if (!currentSong) return

    if ((currentSong.type === "local" || currentSong.type === "youtube") && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    } else if (currentSong.type === "youtube" && youtubePlayerRef.current) {
      // Fallback to iframe player (should not hit when using audio route)
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo()
      } else {
        youtubePlayerRef.current.playVideo()
      }
    }
  }

  const handleSeek = (value) => {
    const newTime = value[0]
    if ((currentSong?.type === "local" || currentSong?.type === "youtube") && audioRef.current) {
      // Seeking streamed YouTube might be limited; set currentTime when possible
      try {
        audioRef.current.currentTime = newTime
      } catch {}
      setCurrentTime(newTime)
    } else if (currentSong?.type === "youtube" && youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(newTime)
    }
  }

  const handleVolumeChange = (value) => {
    const newVolume = value[0]
    setVolume(newVolume)

    if ((currentSong?.type === "local" || currentSong?.type === "youtube") && audioRef.current) {
      audioRef.current.volume = newVolume / 100
    } else if (currentSong?.type === "youtube" && youtubePlayerRef.current) {
      if (isMuted) {
        youtubePlayerRef.current.unMute()
      } else {
        youtubePlayerRef.current.mute()
      }
      youtubePlayerRef.current.setVolume(newVolume)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if ((currentSong?.type === "local" || currentSong?.type === "youtube") && audioRef.current) {
      audioRef.current.muted = !isMuted
    } else if (currentSong?.type === "youtube" && youtubePlayerRef.current) {
      if (isMuted) {
        youtubePlayerRef.current.unMute()
      } else {
        youtubePlayerRef.current.mute()
      }
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">{currentSong ? currentSong.title : "No song selected"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <audio
          key={`${currentSong?.type || 'none'}-${currentSong?.url || currentSong?.videoId || 'none'}`}
          ref={audioRef}
          crossOrigin="anonymous"
        />

        <div id="youtube-player" style={{ display: "none" }}></div>

        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={handleSeek}
            className="w-full"
            disabled={!currentSong || isBuffering}
          />
          <div className="flex justify-between text-sm text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <Button
            onClick={togglePlay}
            disabled={!currentSong || isBuffering}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 rounded-full w-12 h-12"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </Button>
        </div>

        {isBuffering && (
          <div className="flex items-center justify-center text-slate-300 text-sm">
            <svg className="animate-spin mr-2 h-4 w-4 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            Loading YouTube audio...
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Button onClick={toggleMute} variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
          <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="flex-1" />
          <span className="text-sm text-slate-400 w-8">{volume}</span>
        </div>
      </CardContent>
    </Card>
  )
}
