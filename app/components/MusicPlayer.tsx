"use client";

import { useEffect, useRef, useState } from "react";

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Create audio in client only
    const a = new Audio("/music/song.mp3");
    a.loop = true;
    a.preload = "auto";
    a.playsInline = true; // important for iOS
    audioRef.current = a;

    const onCanPlay = () => setReady(true);
    a.addEventListener("canplaythrough", onCanPlay);

    return () => {
      a.pause();
      a.removeEventListener("canplaythrough", onCanPlay);
      audioRef.current = null;
    };
  }, []);

  async function start() {
    const a = audioRef.current;
    if (!a) return;

    try {
      // iOS requires a direct user gesture to play
      await a.play();
      setPlaying(true);
    } catch (e) {
      // If it fails, user can try again
      console.error("Audio play blocked:", e);
      setPlaying(false);
    }
  }

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      start();
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!playing ? (
        <button
          onClick={start}
          className="rounded-full px-4 py-2 text-sm font-semibold
                     bg-white/15 backdrop-blur-md border border-white/20
                     shadow-lg hover:bg-white/20 active:scale-95 transition"
          disabled={!ready}
        >
          {ready ? "Tap to play 🎶" : "Loading music…"}
        </button>
      ) : (
        <button
          onClick={toggle}
          className="rounded-full px-4 py-2 text-sm font-semibold
                     bg-white/15 backdrop-blur-md border border-white/20
                     shadow-lg hover:bg-white/20 active:scale-95 transition"
        >
          Pause ⏸️
        </button>
      )}
    </div>
  );
}
