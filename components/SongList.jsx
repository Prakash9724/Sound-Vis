"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"
import { Trash2, Music, Youtube } from "lucide-react"

export default function SongList({ songs, currentSong, onSelectSong, onRemoveSong }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Music className="w-5 h-5 mr-2" />
          Song List ({songs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {songs.length === 0 ? (
          <div className="text-center py-8">
            <Music className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No songs added yet</p>
            <p className="text-slate-500 text-sm mt-1">Upload a file or add a YouTube link to get started</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {songs.map((song, index) => (
              <div
                key={song.id}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  currentSong?.id === song.id
                    ? "bg-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/20"
                    : "bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="flex-shrink-0 mr-3">
                      {song.type === "local" ? (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <Music className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                          <Youtube className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{song.title}</p>
                      <p className="text-slate-400 text-sm">{song.type === "local" ? "Local File" : "YouTube Video"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-2">
                    <Button
                      onClick={() => onSelectSong(song)}
                      size="sm"
                      className={
                        currentSong?.id === song.id
                          ? "bg-purple-700 hover:bg-purple-800"
                          : "bg-purple-600 hover:bg-purple-700"
                      }
                    >
                      {currentSong?.id === song.id ? "Playing" : "Play"}
                    </Button>
                    <Button
                      onClick={() => onRemoveSong(song.id)}
                      size="sm"
                      variant="outline"
                      className="border-slate-600 text-slate-400 hover:bg-red-600 hover:text-white hover:border-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
