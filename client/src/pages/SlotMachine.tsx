// Slot Machine — Single-cell scroll loop approach
// Each reel shows 2 visible cells (current + next).
// Animation: CSS transition slides from 0 → -cellH, then instantly resets to 0 with new image.
// This creates a smooth infinite scroll feel with ZERO half-cell issues.
// On stop: finish current transition, then snap to final image.

import { useCallback, useEffect, useRef, useState } from "react";

const CHARS: { src: string; name: string }[] = [
  { src: "/manus-storage/sticker_1_5b7efd09.png",  name: "江戶川柯南" },
  { src: "/manus-storage/sticker_2_79040213.png",  name: "江戶川柯南②" },
  { src: "/manus-storage/sticker_3_6bebf874.png",  name: "角色 3" },
  { src: "/manus-storage/sticker_4_6fbe4095.png",  name: "角色 4" },
  { src: "/manus-storage/sticker_5_c6aa4ab0.png",  name: "角色 5" },
  { src: "/manus-storage/sticker_6_abb39e7f.png",  name: "角色 6" },
  { src: "/manus-storage/sticker_7_7569cf9d.png",  name: "角色 7" },
  { src: "/manus-storage/sticker_9_afd19521.png",  name: "角色 9" },
  { src: "/manus-storage/sticker_10_b73ab927.png", name: "角色 10" },
  { src: "/manus-storage/sticker_11_91cf80f2.png", name: "角色 11" },
  { src: "/manus-storage/sticker_12_0e8f286f.png", name: "角色 12" },
  { src: "/manus-storage/sticker_13_f25ff0af.png", name: "角色 13" },
  { src: "/manus-storage/sticker_14_3ed6df96.png", name: "角色 14" },
  { src: "/manus-storage/sticker_15_4b1839ec.png", name: "角色 15" },
  { src: "/manus-storage/sticker_16_0fbd2644.png", name: "角色 16" },
  { src: "/manus-storage/sticker_17_cbd6beac.png", name: "角色 17" },
  { src: "/manus-storage/sticker_18_cc9d6d4e.png", name: "角色 18" },
  { src: "/manus-storage/sticker_19_91e3cd93.png", name: "角色 19" },
  { src: "/manus-storage/sticker_20_fcf0e3af.png", name: "角色 20" },
  { src: "/manus-storage/sticker_21_d6e6a7c0.png", name: "角色 21" },
  { src: "/manus-storage/sticker_22_dcf0f790.png", name: "角色 22" },
  { src: "/manus-storage/sticker_23_699dcf1a.png", name: "角色 23" },
  { src: "/manus-storage/sticker_24_8f139cf7.png", name: "角色 24" },
  { src: "/manus-storage/sticker_25_f8f5a84b.png", name: "角色 25" },
  { src: "/manus-storage/sticker_26_844f1dac.png", name: "角色 26" },
  { src: "/manus-storage/sticker_27_da77a9d8.png", name: "角色 27" },
  { src: "/manus-storage/sticker_28_3325a434.png", name: "角色 28" },
  { src: "/manus-storage/sticker_29_e3ed9e56.png", name: "角色 29" },
  { src: "/manus-storage/sticker_30_42d32f52.png", name: "角色 30" },
  { src: "/manus-storage/haibara_4f113f15.png",    name: "灰原哀" },
];

const N = CHARS.length;
const CONAN_IDX = 0;     // sticker_1
const HAIBARA_IDX = 29;  // haibara
const HEIJI_IDX = 8;     // sticker_10 (平次) — 0-based index in CHARS
const KID_IDX = 12;      // sticker_14 (基德) — 0-based index in CHARS

function getResult(r: [number, number, number]): { msg: string; color: string } {
  const [a, b, c] = r;
  if (a === b && b === c) return { msg: "恭喜中獎！", color: "#ffd700" };
  const conanCount = r.filter((x) => x === CONAN_IDX).length;
  const haibaraCount = r.filter((x) => x === HAIBARA_IDX).length;
  const heijiCount = r.filter((x) => x === HEIJI_IDX).length;
  const kidCount = r.filter((x) => x === KID_IDX).length;
  // 柯哀好嗑：三格只有柯南和小哀（2+1 或 1+2）
  if (conanCount + haibaraCount === 3 && conanCount >= 1 && haibaraCount >= 1)
    return { msg: "柯哀好嗑！", color: "#ffb3d9" };
  // 基友無敵：三格只有柯南和平次（2+1 或 1+2）
  if (conanCount + heijiCount === 3 && conanCount >= 1 && heijiCount >= 1)
    return { msg: "基友無敵！", color: "#ffa040" };
  // 兄弟齊心：三格只有柯南和基德（2+1 或 1+2）
  if (conanCount + kidCount === 3 && conanCount >= 1 && kidCount >= 1)
    return { msg: "兄弟齊心！", color: "#80d0ff" };
  if (a === b || b === c || a === c) return { msg: "運氣不錯！", color: "#90ee90" };
  return { msg: "再接再厲！", color: "#ffaaaa" };
}

// ─── Reel ────────────────────────────────────────────────────────────────────
// Uses a 2-cell window: [current, next]
// Each tick: animate slide up by 1 cell (CSS transition), then on transitionend
// instantly reset position and advance indices.
interface ReelProps {
  spinning: boolean;
  finalIndex: number;
  stopDelay: number;
  onStopped: () => void;
}

function Reel({ spinning, finalIndex, stopDelay, onStopped }: ReelProps) {
  // curIdx: the image currently shown (top cell)
  // nextIdx: the image scrolling into view (bottom cell)
  const [curIdx, setCurIdx] = useState(0);
  const [nextIdx, setNextIdx] = useState(1);
  // animating: whether we're mid-transition (-cellH slide)
  const [animating, setAnimating] = useState(false);
  // stopped: fully stopped, showing final result
  const [stopped, setStopped] = useState(true);

  const spinningRef = useRef(false);
  const shouldStopRef = useRef(false);
  const finalIdxRef = useRef(finalIndex);
  const curIdxRef = useRef(0);
  const nextIdxRef = useRef(1);
  const tickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync finalIndex into ref
  useEffect(() => { finalIdxRef.current = finalIndex; }, [finalIndex]);

  // Schedule next tick
  const scheduleTick = useCallback((delay: number) => {
    if (tickTimerRef.current) clearTimeout(tickTimerRef.current);
    tickTimerRef.current = setTimeout(() => {
      if (!spinningRef.current) return;
      // Start slide animation
      setAnimating(true);
    }, delay);
  }, []);

  // When spinning starts
  useEffect(() => {
    if (!spinning) return;

    spinningRef.current = true;
    shouldStopRef.current = false;
    setStopped(false);
    setAnimating(false);

    // Start from a random position
    const start = Math.floor(Math.random() * N);
    curIdxRef.current = start;
    nextIdxRef.current = (start + 1) % N;
    setCurIdx(start);
    setNextIdx((start + 1) % N);

    // Schedule stop after stopDelay
    const stopTimer = setTimeout(() => {
      shouldStopRef.current = true;
    }, stopDelay);

    // Start first tick immediately
    scheduleTick(0);

    return () => {
      clearTimeout(stopTimer);
      if (tickTimerRef.current) clearTimeout(tickTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, stopDelay]);

  // When animation ends (transitionend equivalent via timeout)
  // We use a timeout matching the CSS transition duration instead of onTransitionEnd
  // to avoid issues with display:none or unmounted elements.
  useEffect(() => {
    if (!animating) return;

    // After transition completes (150ms), advance indices
    const t = setTimeout(() => {
      if (!spinningRef.current) return;

      const newCur = nextIdxRef.current;
      const newNext = (newCur + 1) % N;

      // Check if we should stop: if shouldStop and newCur === finalIndex
      if (shouldStopRef.current && newCur === finalIdxRef.current) {
        // Land on final
        curIdxRef.current = newCur;
        nextIdxRef.current = newNext;
        setCurIdx(newCur);
        setNextIdx(newNext);
        setAnimating(false);
        spinningRef.current = false;
        setStopped(true);
        onStopped();
        return;
      }

      // Continue spinning: reset position and advance
      curIdxRef.current = newCur;
      nextIdxRef.current = newNext;
      setCurIdx(newCur);
      setNextIdx(newNext);
      setAnimating(false); // reset to top instantly

      // Schedule next tick — fast spin, slow down when about to stop
      const delay = shouldStopRef.current ? 80 : 30;
      scheduleTick(delay);
    }, 60); // must match CSS transition duration

    return () => clearTimeout(t);
  }, [animating, onStopped, scheduleTick]);

  const char0 = CHARS[curIdx];
  const char1 = CHARS[nextIdx];

  return (
    <div
      style={{
        flex: "none",
        width: "28%",
        aspectRatio: "1 / 1",
        background: stopped ? "#fdf6e8" : "#fff8ee",
        border: `3px solid ${stopped ? "#c8860a" : "#ff6600"}`,
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: stopped
          ? "0 0 10px rgba(200,134,10,0.3), inset 0 2px 8px rgba(0,0,0,0.15)"
          : "0 0 20px rgba(255,102,0,0.8), inset 0 2px 8px rgba(0,0,0,0.1)",
        position: "relative",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* Top/bottom fade masks */}
      {!stopped && (
        <>
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: "25%", zIndex: 3,
            background: "linear-gradient(180deg, rgba(255,248,238,0.85) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "25%", zIndex: 3,
            background: "linear-gradient(0deg, rgba(255,248,238,0.85) 0%, transparent 100%)",
            pointerEvents: "none",
          }} />
        </>
      )}

      {/* Sliding strip: 2 cells stacked */}
      <div
        style={{
          width: "100%",
          height: "200%", // 2 cells
          display: "flex",
          flexDirection: "column",
          transform: animating ? "translateY(-50%)" : "translateY(0)",
          transition: animating ? "transform 60ms linear" : "none",
          willChange: "transform",
        }}
      >
        {[char0, char1].map((ch, i) => (
          <div
            key={i}
            style={{
              width: "100%",
              height: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10%",
              boxSizing: "border-box",
            }}
          >
            <img
              src={ch.src}
              alt={ch.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                imageRendering: "crisp-edges",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type GameState = "idle" | "spinning" | "result";

export default function SlotMachine() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [finals, setFinals] = useState<[number, number, number]>([CONAN_IDX, CONAN_IDX, CONAN_IDX]);
  const [result, setResult] = useState<{ msg: string; color: string } | null>(null);
  const [spinKey, setSpinKey] = useState(0);
  const stoppedCount = useRef(0);

  const handleSpin = () => {
    if (gameState === "spinning") return;

    const roll = Math.random();
    let r0: number, r1: number, r2: number;

    if (roll < 0.04) {
      const idx = Math.floor(Math.random() * N);
      r0 = r1 = r2 = idx;
    } else if (roll < 0.10) {
      // 柯哀好嗑：2+1 or 1+2
      if (Math.random() < 0.5) {
        const arr = [CONAN_IDX, CONAN_IDX, HAIBARA_IDX].sort(() => Math.random() - 0.5);
        [r0, r1, r2] = arr as [number, number, number];
      } else {
        const arr = [HAIBARA_IDX, HAIBARA_IDX, CONAN_IDX].sort(() => Math.random() - 0.5);
        [r0, r1, r2] = arr as [number, number, number];
      }
    } else if (roll < 0.16) {
      // 基友無敵：柯南+平次 2+1 or 1+2
      if (Math.random() < 0.5) {
        const arr = [CONAN_IDX, CONAN_IDX, HEIJI_IDX].sort(() => Math.random() - 0.5);
        [r0, r1, r2] = arr as [number, number, number];
      } else {
        const arr = [HEIJI_IDX, HEIJI_IDX, CONAN_IDX].sort(() => Math.random() - 0.5);
        [r0, r1, r2] = arr as [number, number, number];
      }
    } else if (roll < 0.22) {
      // 兄弟齊心：柯南+基德 2+1 or 1+2
      if (Math.random() < 0.5) {
        const arr = [CONAN_IDX, CONAN_IDX, KID_IDX].sort(() => Math.random() - 0.5);
        [r0, r1, r2] = arr as [number, number, number];
      } else {
        const arr = [KID_IDX, KID_IDX, CONAN_IDX].sort(() => Math.random() - 0.5);
        [r0, r1, r2] = arr as [number, number, number];
      }
    } else if (roll < 0.40) {
      r0 = Math.floor(Math.random() * N);
      do { r1 = Math.floor(Math.random() * N); } while (r1 === r0);
      r2 = Math.random() < 0.5 ? r0 : r1;
      const arr = [r0, r1, r2].sort(() => Math.random() - 0.5);
      [r0, r1, r2] = arr as [number, number, number];
    } else {
      r0 = Math.floor(Math.random() * N);
      do { r1 = Math.floor(Math.random() * N); } while (r1 === r0);
      do { r2 = Math.floor(Math.random() * N); } while (r2 === r0 || r2 === r1);
    }

    setFinals([r0, r1, r2]);
    setResult(null);
    stoppedCount.current = 0;
    setGameState("spinning");
    setSpinKey((k) => k + 1);
  };

  const handleReelStopped = useCallback(() => {
    stoppedCount.current += 1;
    if (stoppedCount.current >= 3) setGameState("result");
  }, []);

  useEffect(() => {
    if (gameState === "result") setResult(getResult(finals));
  }, [gameState, finals]);

  // Stop delays: reel 1 stops first, then 2, then 3 (total ~5s)
  const stopDelays = [2500, 3500, 4500];

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at center, #1a0500 0%, #0a0200 100%)",
      fontFamily: "'Noto Sans TC', sans-serif",
      overflow: "hidden",
    }}>
      <div style={{
        width: "min(92vw, 520px)",
        background: "linear-gradient(160deg, #2a0a00 0%, #1a0500 60%, #0f0300 100%)",
        borderRadius: "24px",
        border: "3px solid #c8860a",
        boxShadow: "0 0 60px rgba(200,134,10,0.4), 0 0 120px rgba(200,134,10,0.15), inset 0 0 40px rgba(0,0,0,0.7)",
        padding: "28px 24px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        position: "relative",
      }}>
        {/* Corner diamonds */}
        {[
          { top: "12px", left: "12px" },
          { top: "12px", right: "12px" },
          { bottom: "12px", left: "12px" },
          { bottom: "12px", right: "12px" },
        ].map((pos, i) => (
          <div key={i} style={{
            position: "absolute",
            width: "10px", height: "10px",
            background: "#c8860a",
            transform: "rotate(45deg)",
            boxShadow: "0 0 6px rgba(200,134,10,0.8)",
            ...pos,
          }} />
        ))}

        {/* Title */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: "clamp(18px, 5vw, 26px)",
            fontWeight: "900",
            color: "#ffd700",
            textShadow: "0 0 20px rgba(255,215,0,0.9), 0 0 40px rgba(255,215,0,0.4), 0 2px 4px rgba(0,0,0,0.9)",
            letterSpacing: "0.12em",
            lineHeight: 1,
          }}>
            名探偵コナン
          </div>
          <div style={{
            fontSize: "clamp(9px, 2.5vw, 11px)",
            color: "#c8860a",
            letterSpacing: "0.4em",
            marginTop: "6px",
            textTransform: "uppercase",
            opacity: 0.9,
          }}>
            SLOT MACHINE
          </div>
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #c8860a, transparent)", opacity: 0.6 }} />

        {/* Reels */}
        <div style={{
          display: "flex",
          gap: "3%",
          justifyContent: "center",
          alignItems: "center",
          padding: "4px 0",
        }}>
          {([0, 1, 2] as const).map((i) => (
            <Reel
              key={`${spinKey}-${i}`}
              spinning={gameState === "spinning"}
              finalIndex={finals[i]}
              stopDelay={stopDelays[i]}
              onStopped={handleReelStopped}
            />
          ))}
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #c8860a, transparent)", opacity: 0.6 }} />

        {/* Result */}
        <div style={{ minHeight: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {result && (
            <div style={{
              fontSize: "clamp(14px, 4vw, 18px)",
              fontWeight: "800",
              color: result.color,
              textShadow: `0 0 16px ${result.color}99`,
              letterSpacing: "0.08em",
              animation: "popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}>
              {result.msg}
            </div>
          )}
          {!result && gameState === "idle" && (
            <div style={{ fontSize: "12px", color: "#664422", letterSpacing: "0.2em" }}>按下 SPIN 開始</div>
          )}
          {!result && gameState === "spinning" && (
            <div style={{ fontSize: "12px", color: "#c8860a", letterSpacing: "0.2em", opacity: 0.8 }}>轉動中…</div>
          )}
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={gameState === "spinning"}
          style={{
            width: "100%",
            padding: "14px 0",
            background: gameState === "spinning"
              ? "linear-gradient(180deg, #3a2010 0%, #2a1508 100%)"
              : "linear-gradient(180deg, #ff5500 0%, #cc2200 40%, #991100 100%)",
            border: "2px solid",
            borderColor: gameState === "spinning" ? "#5a3020" : "#ff8844",
            borderRadius: "50px",
            color: gameState === "spinning" ? "#664422" : "#fff",
            fontSize: "clamp(14px, 4vw, 18px)",
            fontWeight: "900",
            letterSpacing: "0.25em",
            cursor: gameState === "spinning" ? "not-allowed" : "pointer",
            boxShadow: gameState === "spinning"
              ? "none"
              : "0 4px 20px rgba(255,85,0,0.5), 0 1px 0 rgba(255,255,255,0.15) inset",
            transition: "all 0.2s ease",
            fontFamily: "inherit",
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => {
            if (gameState !== "spinning") {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          {gameState === "spinning" ? "轉動中…" : "SPIN"}
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
