"use client";

import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WebPlayerProps {
  audioUrl: string;
  title: string;
  onPositionChange?: (position: number) => void;
  initialPosition?: number;
}

export function WebPlayer({
  audioUrl,
  title,
  onPositionChange,
  initialPosition = 0,
}: WebPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialPosition);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      if (initialPosition > 0) {
        audio.currentTime = initialPosition;
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [initialPosition]);

  // Save position periodically
  useEffect(() => {
    if (!onPositionChange) return;

    const interval = setInterval(() => {
      if (audioRef.current && isPlaying) {
        onPositionChange(audioRef.current.currentTime);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [isPlaying, onPositionChange]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changeSpeed = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];

    audio.playbackRate = newSpeed;
    setPlaybackRate(newSpeed);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl bg-white p-8">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Title */}
      <h3 className="mb-6 line-clamp-2 text-lg font-bold tracking-tight text-[#1a1a1a]">
        {title}
      </h3>

      {/* Progress Bar */}
      <div className="mb-6">
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={seek}
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={duration || 100}
          aria-valuenow={currentTime}
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#e5e5e5] accent-[#1a1a1a]"
        />
        <div className="mt-2 flex justify-between text-xs font-normal text-[#737373]">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6" role="group" aria-label="Playback controls">
        {/* Skip Back */}
        <button
          onClick={() => skip(-15)}
          aria-label="Skip back 15 seconds"
          className="rounded-full p-3 text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          <SkipBack className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1a1a1a] text-white transition-colors hover:bg-white hover:text-[#1a1a1a] hover:border hover:border-[#1a1a1a]"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Play className="ml-1 h-6 w-6" aria-hidden="true" />
          )}
        </button>

        {/* Skip Forward */}
        <button
          onClick={() => skip(30)}
          aria-label="Skip forward 30 seconds"
          className="rounded-full p-3 text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          <SkipForward className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="mt-6 flex items-center justify-center gap-4" role="group" aria-label="Additional controls">
        {/* Speed */}
        <button
          onClick={changeSpeed}
          aria-label={`Playback speed ${playbackRate}x. Click to change.`}
          className={cn(
            "rounded-lg px-3 py-1 text-sm font-bold transition-colors",
            playbackRate !== 1
              ? "bg-[#1a1a1a] text-white"
              : "text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white"
          )}
        >
          {playbackRate}x
        </button>

        {/* Mute */}
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className="rounded-lg p-2 text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a] hover:text-white"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Volume2 className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Browser Limitation Notice */}
      <p className="mt-8 text-center text-xs font-normal leading-relaxed text-[#737373]">
        Note: Audio may pause when switching browser tabs. For background
        playback, use the mobile app.
      </p>
    </div>
  );
}
