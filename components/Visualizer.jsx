"use client"

import { useRef, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Slider } from "./ui/slider"
import { BarChart3, Activity, Zap, Waves, Circle, Settings, Hexagon, Star, Sparkles } from "lucide-react"

export default function Visualizer({ audioContext, analyser, isPlaying }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])

  const [visualMode, setVisualMode] = useState("spectrum")
  const [colorScheme, setColorScheme] = useState("purple")
  const [animationSpeed, setAnimationSpeed] = useState([1])
  const [complexity, setComplexity] = useState([50])
  const [showSettings, setShowSettings] = useState(false)

  const visualModes = [
    { id: "spectrum", name: "Spectrum", icon: BarChart3 },
    { id: "waveform", name: "Waveform", icon: Activity },
    { id: "circular", name: "Circular", icon: Circle },
    { id: "particles", name: "Particles", icon: Zap },
    { id: "ripple", name: "Ripple", icon: Waves },
    { id: "spiral", name: "Spiral", icon: Hexagon },
    { id: "fireworks", name: "Fireworks", icon: Star },
    { id: "galaxy", name: "Galaxy", icon: Sparkles },
  ]

  const colorSchemes = {
    purple: { primary: [147, 51, 234], secondary: [168, 85, 247], accent: [196, 181, 253] },
    blue: { primary: [59, 130, 246], secondary: [96, 165, 250], accent: [147, 197, 253] },
    green: { primary: [34, 197, 94], secondary: [74, 222, 128], accent: [134, 239, 172] },
    orange: { primary: [249, 115, 22], secondary: [251, 146, 60], accent: [253, 186, 116] },
    pink: { primary: [236, 72, 153], secondary: [244, 114, 182], accent: [251, 182, 206] },
    cyan: { primary: [6, 182, 212], secondary: [34, 211, 238], accent: [103, 232, 249] },
    red: { primary: [239, 68, 68], secondary: [248, 113, 113], accent: [252, 165, 165] },
  }

  useEffect(() => {
    particlesRef.current = Array.from({ length: 200 }, (_, i) => ({
      x: Math.random() * 800,
      y: Math.random() * 400,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: Math.random(),
      maxLife: Math.random() * 100 + 50,
      size: Math.random() * 3 + 1,
      angle: Math.random() * Math.PI * 2,
      speed: Math.random() * 2 + 1,
    }))
  }, [])

  useEffect(() => {
    if (!analyser || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, "rgb(15, 23, 42)")
        gradient.addColorStop(1, "rgb(30, 41, 59)")
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    let frame = 0

    const draw = () => {
      if (!isPlaying) return

      const width = canvas.width
      const height = canvas.height
      frame += animationSpeed[0]

      analyser.getByteFrequencyData(dataArray)

      switch (visualMode) {
        case "spectrum":
          drawSpectrum(ctx, dataArray, width, height, frame)
          break
        case "waveform":
          analyser.getByteTimeDomainData(dataArray)
          drawWaveform(ctx, dataArray, width, height, frame)
          break
        case "circular":
          drawCircular(ctx, dataArray, width, height, frame)
          break
        case "particles":
          drawParticles(ctx, dataArray, width, height, frame)
          break
        case "ripple":
          drawRipple(ctx, dataArray, width, height, frame)
          break
        case "spiral":
          drawSpiral(ctx, dataArray, width, height, frame)
          break
        case "fireworks":
          drawFireworks(ctx, dataArray, width, height, frame)
          break
        case "galaxy":
          drawGalaxy(ctx, dataArray, width, height, frame)
          break
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, isPlaying, visualMode, colorScheme, animationSpeed, complexity])

  const drawSpectrum = (ctx, dataArray, width, height, frame) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "rgba(15, 23, 42, 0.3)")
    gradient.addColorStop(1, "rgba(30, 41, 59, 0.3)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    const colors = colorSchemes[colorScheme]
    const barCount = Math.min(Math.floor(complexity[0] * 2.56), 128)
    const barWidth = (width * 0.9) / barCount
    const startX = width * 0.05

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length)
      const barHeight = (dataArray[dataIndex] / 255) * height * 0.85

      if (barHeight > 5) {
        const x = startX + i * barWidth
        const y = height - barHeight

        for (let layer = 2; layer >= 0; layer--) {
          const layerHeight = barHeight * (1 - layer * 0.05)
          const layerX = x + layer * 1.5
          const layerY = height - layerHeight

          const barGradient = ctx.createLinearGradient(0, layerY, 0, height)
          barGradient.addColorStop(0, `rgba(${colors.primary.join(",")}, ${0.9 - layer * 0.1})`)
          barGradient.addColorStop(0.3, `rgba(${colors.secondary.join(",")}, ${0.8 - layer * 0.1})`)
          barGradient.addColorStop(1, `rgba(${colors.accent.join(",")}, ${0.6 - layer * 0.1})`)

          ctx.fillStyle = barGradient
          ctx.fillRect(layerX, layerY, barWidth - 1, layerHeight)

          if (layer === 0) {
            ctx.shadowColor = `rgba(${colors.primary.join(",")}, 0.8)`
            ctx.shadowBlur = 15 + Math.sin(frame * 0.02 + i * 0.1) * 8
            ctx.fillRect(layerX, layerY, barWidth - 1, layerHeight)
            ctx.shadowBlur = 0
          }
        }
      }
    }
  }

  const drawWaveform = (ctx, dataArray, width, height, frame) => {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) / 2,
    )
    gradient.addColorStop(0, "rgba(15, 23, 42, 0.1)")
    gradient.addColorStop(1, "rgba(30, 41, 59, 0.2)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    const colors = colorSchemes[colorScheme]
    const centerY = height / 2

    for (let wave = 0; wave < 4; wave++) {
      ctx.lineWidth = 4 - wave * 0.5
      ctx.strokeStyle = `rgba(${colors.primary.join(",")}, ${0.9 - wave * 0.15})`
      ctx.beginPath()

      const sliceWidth = width / dataArray.length
      let x = 0

      for (let i = 0; i < dataArray.length; i++) {
        const v = dataArray[i] / 128.0
        const amplitude = (complexity[0] / 100) * (1 + wave * 0.2)
        const waveOffset = Math.sin(frame * 0.02 + i * 0.05 + (wave * Math.PI) / 2) * (wave + 1) * 3
        const y = centerY + (v - 1) * centerY * amplitude + waveOffset

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
        x += sliceWidth
      }

      ctx.stroke()

      ctx.shadowColor = `rgba(${colors.secondary.join(",")}, 0.7)`
      ctx.shadowBlur = 20 - wave * 3
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }

  const drawCircular = (ctx, dataArray, width, height, frame) => {
    ctx.fillStyle = "rgba(15, 23, 42, 0.1)"
    ctx.fillRect(0, 0, width, height)

    const colors = colorSchemes[colorScheme]
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.4
    const barCount = Math.floor(complexity[0] * 1.28)

    for (let i = 0; i < barCount; i++) {
      const angle = (i / barCount) * Math.PI * 2 + frame * 0.01
      const dataIndex = Math.floor((i / barCount) * dataArray.length)
      const barHeight = (dataArray[dataIndex] / 255) * maxRadius * 0.6

      const innerRadius = maxRadius * 0.3
      const outerRadius = innerRadius + barHeight

      const x1 = centerX + Math.cos(angle) * innerRadius
      const y1 = centerY + Math.sin(angle) * innerRadius
      const x2 = centerX + Math.cos(angle) * outerRadius
      const y2 = centerY + Math.sin(angle) * outerRadius

      const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
      gradient.addColorStop(0, `rgba(${colors.accent.join(",")}, 0.8)`)
      gradient.addColorStop(1, `rgba(${colors.primary.join(",")}, 0.9)`)

      ctx.strokeStyle = gradient
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  }

  const drawParticles = (ctx, dataArray, width, height, frame) => {
    ctx.fillStyle = "rgba(15, 23, 42, 0.05)"
    ctx.fillRect(0, 0, width, height)

    const colors = colorSchemes[colorScheme]
    const particleCount = Math.floor(complexity[0] * 5)

    for (let i = 0; i < particleCount; i++) {
      const dataIndex = Math.floor((i / particleCount) * dataArray.length)
      const intensity = dataArray[dataIndex] / 255

      const x = (i / particleCount) * width + Math.sin(frame * 0.02 + i) * 50 * intensity
      const y = height * 0.5 + Math.cos(frame * 0.015 + i * 0.5) * height * 0.3 * intensity
      const size = 2 + intensity * 8

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
      gradient.addColorStop(0, `rgba(${colors.primary.join(",")}, ${intensity})`)
      gradient.addColorStop(1, `rgba(${colors.secondary.join(",")}, 0)`)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawRipple = (ctx, dataArray, width, height, frame) => {
    ctx.fillStyle = "rgba(15, 23, 42, 0.1)"
    ctx.fillRect(0, 0, width, height)

    const colors = colorSchemes[colorScheme]
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.5

    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    const intensity = average / 255

    for (let ring = 0; ring < 5; ring++) {
      const radius = (maxRadius * intensity * (ring + 1)) / 5 + Math.sin(frame * 0.02 + ring) * 20
      const alpha = (1 - ring / 5) * intensity

      ctx.strokeStyle = `rgba(${colors.primary.join(",")}, ${alpha})`
      ctx.lineWidth = 3 - ring * 0.5
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()

      ctx.shadowColor = `rgba(${colors.secondary.join(",")}, ${alpha * 0.5})`
      ctx.shadowBlur = 10
      ctx.stroke()
      ctx.shadowBlur = 0
    }
  }

  const drawSpiral = (ctx, dataArray, width, height, frame) => {
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.min(width, height) / 2,
    )
    gradient.addColorStop(0, "rgba(15, 23, 42, 0.1)")
    gradient.addColorStop(1, "rgba(30, 41, 59, 0.3)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    const colors = colorSchemes[colorScheme]
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.4
    const points = Math.floor(complexity[0] * 3)

    for (let i = 0; i < points; i++) {
      const dataIndex = Math.floor((i / points) * dataArray.length)
      const intensity = dataArray[dataIndex] / 255

      const spiralAngle = (i / points) * Math.PI * 8 + frame * 0.02
      const radius = (i / points) * maxRadius * (0.5 + intensity * 0.5)

      const x = centerX + Math.cos(spiralAngle) * radius
      const y = centerY + Math.sin(spiralAngle) * radius

      const size = 2 + intensity * 6

      const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, size)
      pointGradient.addColorStop(0, `rgba(${colors.primary.join(",")}, ${intensity})`)
      pointGradient.addColorStop(1, `rgba(${colors.secondary.join(",")}, 0)`)

      ctx.fillStyle = pointGradient
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawFireworks = (ctx, dataArray, width, height, frame) => {
    ctx.fillStyle = "rgba(15, 23, 42, 0.1)"
    ctx.fillRect(0, 0, width, height)

    const colors = colorSchemes[colorScheme]
    const explosions = Math.floor(complexity[0] / 20)

    for (let explosion = 0; explosion < explosions; explosion++) {
      const dataIndex = Math.floor((explosion / explosions) * dataArray.length)
      const intensity = dataArray[dataIndex] / 255

      if (intensity > 0.3) {
        const centerX = (explosion / explosions) * width
        const centerY = height * 0.3 + Math.sin(frame * 0.01 + explosion) * height * 0.2
        const particles = Math.floor(intensity * 20)

        for (let p = 0; p < particles; p++) {
          const angle = (p / particles) * Math.PI * 2
          const distance = intensity * 80 * Math.sin(frame * 0.05 + p * 0.1)

          const x = centerX + Math.cos(angle) * distance
          const y = centerY + Math.sin(angle) * distance

          const size = 1 + intensity * 3

          ctx.fillStyle = `rgba(${colors.primary.join(",")}, ${intensity * 0.8})`
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fill()

          ctx.strokeStyle = `rgba(${colors.secondary.join(",")}, ${intensity * 0.4})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(x, y)
          ctx.stroke()
        }
      }
    }
  }

  const drawGalaxy = (ctx, dataArray, width, height, frame) => {
    ctx.fillStyle = "rgba(15, 23, 42, 0.05)"
    ctx.fillRect(0, 0, width, height)

    const colors = colorSchemes[colorScheme]
    const centerX = width / 2
    const centerY = height / 2
    const arms = 4
    const particles = Math.floor(complexity[0] * 4)

    for (let arm = 0; arm < arms; arm++) {
      for (let i = 0; i < particles; i++) {
        const dataIndex = Math.floor((i / particles) * dataArray.length)
        const intensity = dataArray[dataIndex] / 255

        const armAngle = (arm / arms) * Math.PI * 2
        const spiralAngle = armAngle + (i / particles) * Math.PI * 6 + frame * 0.01
        const radius = (i / particles) * Math.min(width, height) * 0.4

        const x = centerX + Math.cos(spiralAngle) * radius
        const y = centerY + Math.sin(spiralAngle) * radius

        const size = 0.5 + intensity * 4
        const alpha = intensity * (1 - i / particles)

        const starGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2)
        starGradient.addColorStop(0, `rgba(${colors.primary.join(",")}, ${alpha})`)
        starGradient.addColorStop(0.5, `rgba(${colors.secondary.join(",")}, ${alpha * 0.5})`)
        starGradient.addColorStop(1, `rgba(${colors.accent.join(",")}, 0)`)

        ctx.fillStyle = starGradient
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      const ctx = canvas.getContext("2d")
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  return (
    <Card className="bg-slate-900/30 backdrop-blur-xl border-slate-700/50 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-white">Audio Visualizer</CardTitle>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="outline"
            size="sm"
            className="border-slate-600/50 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg  text-slate-200 hover:text-white hover:bg-slate-700/50 backdrop-blur-sm"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {visualModes.map((mode) => {
            const Icon = mode.icon
            return (
              <Button
                key={mode.id}
                onClick={() => setVisualMode(mode.id)}
                variant={visualMode === mode.id ? "default" : "outline"}
                size="sm"
                className={
                  visualMode === mode.id
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg text-white"
                    : "border-slate-600/50 bg-slate-800/50 text-slate-100 hover:text-white hover:bg-slate-700/70 hover:border-slate-500 backdrop-blur-sm"
                }
              >
                <Icon className="w-4 h-4 mr-1" />
                {mode.name}
              </Button>
            )
          })}
        </div>

        {showSettings && (
          <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 backdrop-blur-sm space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">Color Scheme</label>
              <div className="flex gap-2 flex-wrap">
                {Object.keys(colorSchemes).map((scheme) => (
                  <button
                    key={scheme}
                    onClick={() => setColorScheme(scheme)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      colorScheme === scheme ? "border-white scale-110" : "border-slate-600 hover:scale-105"
                    }`}
                    style={{
                      background: `rgb(${colorSchemes[scheme].primary.join(",")})`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">
                Animation Speed: {animationSpeed[0]}x
              </label>
              <Slider
                value={animationSpeed}
                onValueChange={setAnimationSpeed}
                max={3}
                min={0.1}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-200 mb-2 block">Complexity: {complexity[0]}%</label>
              <Slider value={complexity} onValueChange={setComplexity} max={100} min={10} step={5} className="w-full" />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-80 bg-slate-950/50 rounded-xl border border-slate-700/50 shadow-inner backdrop-blur-sm"
            style={{ width: "100%", height: "320px" }}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-xl backdrop-blur-sm">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <p className="text-slate-200 font-medium">Play a song to see visualization</p>
                <p className="text-slate-400 text-sm mt-1">Choose from 8 different modes and customize colors</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
