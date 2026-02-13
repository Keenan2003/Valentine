"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import Image from "next/image";

type Step = "intro" | "memories" | "letter" | "ask" | "yes" | "share";

function FloatingHearts() {
  const [hearts, setHearts] = useState<
    {
      id: number;
      left: number;
      delay: number;
      duration: number;
      size: number;
      opacity: number;
    }[]
  >([]);

  useEffect(() => {
    // ✅ Generate ONLY on client to avoid hydration mismatch
    const generated = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 6 + Math.random() * 7,
      size: 14 + Math.random() * 18,
      opacity: 0.15 + Math.random() * 0.25,
    }));
    setHearts(generated);
  }, []);

  // ✅ Render nothing on first paint -> prevents SSR/client mismatch
  if (hearts.length === 0) return null;

  // ✅ Optional upgrade: fade-in so hearts don’t “pop” harshly
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute"
          style={{ left: `${h.left}%`, top: "110%", opacity: h.opacity }}
          animate={{ y: ["0%", "-150%"] }}
          transition={{
            duration: h.duration,
            delay: h.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <div style={{ fontSize: h.size }} className="select-none drop-shadow">
            💗
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default function Page() {
  // ✅ Personalize
  const herName = "Janhavi";
  const yourName = "Keenan";

  // ✅ Passkey (ALWAYS ask password)
  const PASSKEY = "2612";
  const HINT_TEXT = "Hint: our first date 💞";

  // ✅ Music (put your mp3 in public/music/)
  // Example path: public/music/song.mp3  -> "/music/song.mp3"
  const MUSIC_SRC = "/music/song.mp3";

  const [unlocked, setUnlocked] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [wrong, setWrong] = useState(false);

  const [step, setStep] = useState<Step>("intro");
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [note, setNote] = useState("");

  // Music state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicOn, setMusicOn] = useState(false);

  // ✅ Removed auto-unlock localStorage (always ask password)

  function tryUnlock() {
    if (keyInput.trim() === PASSKEY) {
      setUnlocked(true);
      setWrong(false);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 600);
    }
  }

  function popConfetti() {
    confetti({ particleCount: 140, spread: 85, origin: { y: 0.7 } });
  }

  function moveNoButton() {
    const x = Math.floor((Math.random() - 0.5) * 240);
    const y = Math.floor((Math.random() - 0.5) * 160);
    setNoPos({ x, y });
  }

  async function toggleMusic() {
    if (!audioRef.current) return;

    try {
      if (!musicOn) {
        await audioRef.current.play(); // iPhone requires user tap
        setMusicOn(true);
      } else {
        audioRef.current.pause();
        setMusicOn(false);
      }
    } catch {
      // if play is blocked, user can tap again
    }
  }

  async function notifyYes() {
    // sends Telegram notification via backend
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: note?.trim() || "",
          time: new Date().toLocaleString(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!data?.ok) console.log("Telegram failed:", data?.error);
    } catch (e) {
      console.log("Telegram error:", e);
    }
  }

  async function onYes() {
    popConfetti();
    setStep("yes");
    await notifyYes();
  }

  // 🔒 LOCK SCREEN
  if (!unlocked) {
    return (
      <div className="relative min-h-dvh bg-gradient-to-b from-pink-50 via-rose-50 to-white text-slate-900">
        <FloatingHearts />

        <main className="relative mx-auto flex min-h-dvh max-w-[520px] flex-col justify-center px-5 py-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur"
          >
            <p className="text-sm text-slate-500">🔒 Private access</p>
            <h1 className="mt-2 text-3xl font-bold">Enter the passkey 💗</h1>

            <p className="mt-3 text-sm text-slate-600">{HINT_TEXT}</p>

            <motion.div
              animate={wrong ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-5"
            >
              <input
                type="password"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d*"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") tryUnlock();
                }}
                placeholder="Passkey..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-rose-200"
              />
              {wrong && (
                <p className="mt-2 text-sm text-rose-600">
                  Oops 😭 wrong passkey. Try again.
                </p>
              )}
            </motion.div>

            <button
              onClick={tryUnlock}
              className="mt-5 w-full rounded-2xl bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow active:scale-[0.99]"
            >
              Unlock →
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              (Made only for you by me 🥺)
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-pink-50 via-rose-50 to-white text-slate-900">
      <FloatingHearts />

      {/* Audio element (hidden). Put your mp3 in public/music/song.mp3 */}
      <audio ref={audioRef} src={MUSIC_SRC} loop preload="auto" playsInline />

      <main className="relative mx-auto flex min-h-dvh max-w-[520px] flex-col justify-center px-5 py-10">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={toggleMusic}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm"
          >
            {musicOn ? "🔊 Music: ON" : "🔇 Music: OFF"}
          </button>

          {/* reset now just returns to password screen */}
          <button
            onClick={() => {
              setUnlocked(false);
              setStep("intro");
              setKeyInput("");
              setWrong(false);
              setNoPos({ x: 0, y: 0 });
              setNote("");
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
              setMusicOn(false);
            }}
            className="text-xs text-slate-400 underline"
          >
            reset
          </button>
        </div>

        <div className="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur">
          <AnimatePresence mode="wait">
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <p className="text-sm text-slate-500">A tiny website, just for</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">
                  {herName} 💘
                </h1>

                <div className="mt-5 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 p-4">
                  <p className="text-base leading-relaxed">
                    Hii {herName} Baby 🥺
                    <br />
                    I made this little page because I wanted to ask you out
                    in the cutest way possible babe.
                  </p>
                </div>

                <button
                  onClick={() => setStep("memories")}
                  className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3 text-base font-semibold text-white shadow active:scale-[0.99]"
                >
                  Tap to continue →
                </button>

                <p className="mt-3 text-center text-xs text-slate-500">
                  (works best on your phone 📱)
                </p>
              </motion.div>
            )}

            {step === "memories" && (
              <motion.div
                key="memories"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-2xl font-bold">Our memories 💗</h2>

                <p className="mt-2 text-sm text-slate-600">
                  Every picture is a reason I love you.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Image
                    src="/photos/pic1.jpeg"
                    alt="Memory 1"
                    width={600}
                    height={600}
                    className="aspect-square w-full rounded-2xl object-cover"
                    priority
                  />
                  <Image
                    src="/photos/pic2.jpeg"
                    alt="Memory 2"
                    width={600}
                    height={600}
                    className="aspect-square w-full rounded-2xl object-cover"
                  />
                  <Image
                    src="/photos/pic3.jpeg"
                    alt="Memory 3"
                    width={600}
                    height={600}
                    className="aspect-square w-full rounded-2xl object-cover"
                  />
                  <Image
                    src="/photos/pic4.jpeg"
                    alt="Memory 4"
                    width={600}
                    height={600}
                    className="aspect-square w-full rounded-2xl object-cover"
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep("intro")}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep("letter")}
                    className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow"
                  >
                    Next →
                  </button>
                </div>
              </motion.div>
            )}

            {step === "letter" && (
              <motion.div
                key="letter"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-2xl font-bold">A little love letter Baby 💌</h2>

                <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm leading-relaxed">
                  <p>
                    Dear {herName},
                    <br />
                    I don’t know how you do it, but you make my life feel better,
                    happier, and more beautiful. I’m grateful to have you in my life, your smile,
                    your voice, your kindness, and every day feels memorable. Happy Valentine's day Babygirl.
                    <br />
                    <br />
                    I just want you to know: you’re my favorite person babe. Always. I really love you a lot and care about you Babygirl.
                    <br />
                    <br />
                    Love,
                    <br />
                    {yourName} 💗
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setStep("memories")}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => setStep("ask")}
                    className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow"
                  >
                    Next →
                  </button>
                </div>
              </motion.div>
            )}

            {step === "ask" && (
              <motion.div
                key="ask"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-2xl font-bold">Okay… big question 🥹</h2>

                <div className="mt-4 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 p-4">
                  <p className="text-base leading-relaxed">
                    {herName}, will you be my Valentine? 💝
                  </p>
                  <p className="mt-2 text-sm text-slate-600">— {yourName}</p>
                </div>

                <div className="relative mt-6 flex items-center justify-center gap-4">
                  <button
                    onClick={onYes}
                    className="rounded-2xl bg-rose-600 px-6 py-3 text-base font-bold text-white shadow active:scale-[0.99]"
                  >
                    YES 💘
                  </button>

                  <motion.button
                    onMouseEnter={moveNoButton}
                    onTouchStart={moveNoButton}
                    animate={{ x: noPos.x, y: noPos.y }}
                    transition={{ type: "spring", stiffness: 300, damping: 18 }}
                    className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold shadow-sm"
                  >
                    No 😭
                  </motion.button>
                </div>

                <div className="mt-6">
                  <label className="text-sm font-semibold text-slate-700">
                    Leave a cute note (Press "YES" to send the note, "NO" is not an option):
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Type something sweet..."
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-rose-200"
                    rows={3}
                  />
                </div>

                <button
                  onClick={() => setStep("letter")}
                  className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold"
                >
                  ← Back
                </button>
              </motion.div>
            )}

            {step === "yes" && (
              <motion.div
                key="yes"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-3xl font-extrabold">YAYYYYY!!! 💖</h2>

                <div className="mt-4 rounded-2xl bg-rose-50 p-4">
                  <p className="text-base leading-relaxed">
                    Happy Valentine’s Day, {herName} 💞
                    <br />
                    You just made my whole day.
                  </p>
                </div>

                {note.trim().length > 0 && (
                  <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500">Her note:</p>
                    <p className="mt-1 text-sm">{note}</p>
                  </div>
                )}

                <button
                  onClick={() => setStep("share")}
                  className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow"
                >
                  Next →
                </button>

                <button
                  onClick={popConfetti}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold"
                >
                  More confetti 🎉
                </button>
              </motion.div>
            )}

            {step === "share" && (
              <motion.div
                key="share"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                <h2 className="text-2xl font-bold">Screenshot this 💞</h2>

                <div className="mt-4 rounded-2xl bg-gradient-to-r from-pink-100 to-rose-100 p-4">
                  <p className="text-base leading-relaxed">
                    Send me a screenshot of this page 😌
                    <br />
                    So that i know you saw till the end it took me lots of time 👀
                  </p>
                </div>

                <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm text-slate-700">
                    💡 Tip: On iPhone press <b>Side + Volume Up</b> to screenshot.
                  </p>
                </div>

                <button
                  onClick={() => {
                    popConfetti();
                  }}
                  className="mt-6 w-full rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow"
                >
                  Celebrate 🎉
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">Made with 💗</p>
      </main>
    </div>
  );
}
