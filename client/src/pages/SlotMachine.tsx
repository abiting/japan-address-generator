// Slot Machine v8 — CSS animation approach
// Strategy:
// 1. Each reel has a strip of N*COPIES cells
// 2. During spin: CSS keyframe animation scrolls from 0 to -N*cellH (one full loop), infinite
// 3. On stop: pause animation, read computed translateY, calculate snap target, apply CSS transition
// 4. On next spin: resume from snapped position (no jump)

import { useEffect, useRef, useState, useCallback } from "react";

const CHARS = [
  "/manus-storage/new_char_01_251fa438.png",
  "/manus-storage/new_char_02_45161b3b.png",
  "/manus-storage/new_char_03_8ada82a4.png",
  "/manus-storage/new_char_04_9cae5d50.png",
  "/manus-storage/new_char_05_b7b01a6a.png",
  "/manus-storage/new_char_06_b0942a74.png",
  "/manus-storage/new_char_07_d55f23d7.png",
  "/manus-storage/new_char_08_43882b68.png",
  "/manus-storage/new_char_09_0c094d18.png",
  "/manus-storage/new_char_10_d9f3f062.png",
  "/manus-storage/new_char_11_9602a36b.png",
  "/manus-storage/new_char_12_61cac6e2.png",
  "/manus-storage/new_char_13_52bd027e.png",
  "/manus-storage/new_char_14_bf49a4b6.png",
  "/manus-storage/new_char_15_a93e3530.png",
  "/manus-storage/new_char_16_72485dcd.png",
  "/manus-storage/new_char_17_74b471d5.png",
  "/manus-storage/new_char_18_70b6a132.png",
  "/manus-storage/new_char_19_2c316fa2.png",
  "/manus-storage/new_char_20_b005ba88.png",
  "/manus-storage/new_char_21_498b56f3.png",
  "/manus-storage/new_char_22_1d886615.png",
  "/manus-storage/new_char_23_eb7af15d.png",
  "/manus-storage/new_char_24_33fbcca5.png",
];

const N = CHARS.length; // 24
const CONAN_IDX = 0;
const HAIBARA_IDX = 3;
const COPIES = 6; // 6 * 24 = 144 cells

function getResult(r: [number, number, number]): { msg: string; color: string } {
  const [a, b, c] = r;
  if (a === b && b === c) return { msg: "🎉 恭喜中獎！", color: "#ffd700" };
  const conanCount = r.filter((x) => x === CONAN_IDX).length;
  const haibaraCount = r.filter((x) => x === HAIBARA_IDX).length;
  if ((conanCount === 2 && haibaraCount === 1) || (conanCount === 1 && haibaraCount === 2))
    return { msg: "💕 柯哀好嗑！", color: "#ffb3d9" };
  if (a === b || b === c || a === c) return { msg: "✨ 運氣不錯！", color: "#90ee90" };
  return { msg: "再接再厲！", color: "#ffaaaa" };
}

// Parse translateY from computed matrix transform
function getTranslateY(el: HTMLElement): number {
  const style = window.getComputedStyle(el);
  const transform = style.transform;
  if (!transform || transform === "none") return 0;
  // matrix(a,b,c,d,tx,ty) or matrix3d(...)
  const match = transform.match(/matrix(?:3d)?\(([^)]+)\)/);
  if (!match) return 0;
  const values = match[1].split(",").map(parseFloat);
  // For matrix: ty is index 5; for matrix3d: ty is index 13
  return values.length === 6 ? values[5] : values[13];
}

interface ReelProps {
  reelId: string;
  spinTrigger: number;
  targetIndex: number;
  stopDelay: number;
  onStopped: () => void;
}

function Reel({ reelId, spinTrigger, targetIndex, stopDelay, onStopped }: ReelProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Current offset in px (negative = scrolled down), always a multiple of cellH
  const currentOffsetRef = useRef(0);

  const getCellH = () => wrapperRef.current?.clientHeight ?? 0;

  const clearStop = () => {
    if (stopTimerRef.current) { clearTimeout(stopTimerRef.current); stopTimerRef.current = null; }
  };

  useEffect(() => {
    if (spinTrigger === 0) return;
    const strip = stripRef.current;
    if (!strip) return;

    clearStop();

    const cellH = getCellH();
    if (cellH <= 0) return;

    // Step 1: Freeze current visual position
    const visualY = getTranslateY(strip);
    // Snap to nearest cell boundary
    const snappedY = Math.round(visualY / cellH) * cellH;
    currentOffsetRef.current = snappedY;

    // Step 2: Remove animation, set transform to snapped position
    strip.style.transition = "none";
    strip.style.animation = "none";
    strip.style.transform = `translateY(${snappedY}px)`;

    // Step 3: Force reflow
    strip.getBoundingClientRect();

    // Step 4: Start spinning animation
    // Animation scrolls from snappedY to snappedY - N*cellH over 1.2s, infinite
    const loopH = N * cellH;
    const animName = `spin-${reelId}`;
    // Inject keyframe dynamically
    let styleEl = document.getElementById(`style-${reelId}`) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = `style-${reelId}`;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      @keyframes ${animName} {
        from { transform: translateY(${snappedY}px); }
        to   { transform: translateY(${snappedY - loopH}px); }
      }
    `;

    strip.style.animation = `${animName} 1.2s linear infinite`;

    // Step 5: After stopDelay, snap to target
    stopTimerRef.current = setTimeout(() => {
      const cellH2 = getCellH();
      if (cellH2 <= 0) { onStopped(); return; }

      // Read current visual position from computed style
      const currentY = getTranslateY(strip);
      const snappedCurrent = Math.round(currentY / cellH2) * cellH2;
      const currentCellIndex = Math.round(-snappedCurrent / cellH2); // positive index

      // Find next occurrence of targetIndex at least MIN_AHEAD cells ahead
      const MIN_AHEAD = N + 2;
      const posInLoop = ((currentCellIndex % N) + N) % N;
      let cellsAhead = (targetIndex - posInLoop + N) % N;
      if (cellsAhead < MIN_AHEAD) cellsAhead += N * Math.ceil((MIN_AHEAD - cellsAhead) / N);

      const finalCellIndex = currentCellIndex + cellsAhead;
      // Safety: ensure we don't go past the strip
      const maxCells = N * COPIES - 1;
      const safeFinalCellIndex = finalCellIndex > maxCells
        ? finalCellIndex % N + N * (COPIES - 2)
        : finalCellIndex;

      const finalY = -safeFinalCellIndex * cellH2;
      currentOffsetRef.current = finalY;

      // Stop animation and snap with deceleration
      strip.style.animation = "none";
      strip.style.transform = `translateY(${snappedCurrent}px)`;
      strip.getBoundingClientRect();

      const DECEL_MS = 800;
      strip.style.transition = `transform ${DECEL_MS}ms cubic-bezier(0.2, 0.8, 0.3, 1.0)`;
      strip.style.transform = `translateY(${finalY}px)`;

      setTimeout(() => {
        strip.style.transition = "none";
        onStopped();
      }, DECEL_MS + 50);
    }, stopDelay);

    return clearStop;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinTrigger]);

  const cells = Array.from({ length: N * COPIES }, (_, i) => CHARS[i % N]);

  return (
    <div
      ref={wrapperRef}
      style={{
        flex: "none",
        width: "30%",
        aspectRatio: "1 / 1",
        background: "#f0a07a",
        border: "3px solid #c8860a",
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "inset 0 0 12px rgba(0,0,0,0.2), 0 0 8px rgba(200,134,10,0.4)",
        position: "relative",
      }}
    >
      {/* Top/bottom fade */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.4) 100%)",
      }} />
      <div
        ref={stripRef}
        style={{ display: "flex", flexDirection: "column", willChange: "transform" }}
      >
        {cells.map((src, i) => (
          <div
            key={i}
            style={{
              flexShrink: 0,
              width: "100%",
              aspectRatio: "1 / 1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4%",
              boxSizing: "border-box",
            }}
          >
            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

type GameState = "idle" | "spinning" | "result";

export default function SlotMachine() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [finals, setFinals] = useState<[number, number, number]>([0, 1, 2]);
  const [result, setResult] = useState<{ msg: string; color: string } | null>(null);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const stoppedCount = useRef(0);

  const handleSpin = () => {
    if (gameState === "spinning") return;

    const roll = Math.random();
    let r0: number, r1: number, r2: number;
    if (roll < 0.04) {
      r0 = Math.floor(Math.random() * N); r1 = r0; r2 = r0;
    } else if (roll < 0.10) {
      if (Math.random() < 0.5) { r0 = CONAN_IDX; r1 = CONAN_IDX; r2 = HAIBARA_IDX; }
      else { r0 = HAIBARA_IDX; r1 = HAIBARA_IDX; r2 = CONAN_IDX; }
      const arr = [r0, r1, r2].sort(() => Math.random() - 0.5);
      [r0, r1, r2] = arr as [number, number, number];
    } else if (roll < 0.30) {
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
    setSpinTrigger((k) => k + 1);
  };

  const handleReelStopped = useCallback(() => {
    stoppedCount.current += 1;
    if (stoppedCount.current >= 3) setGameState("result");
  }, []);

  useEffect(() => {
    if (gameState === "result") setResult(getResult(finals));
  }, [gameState, finals]);

  const stopDelays = [900, 1700, 2500];

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #0d0500 0%, #1f0a00 50%, #0d0500 100%)",
      fontFamily: "'Zen Maru Gothic', 'Noto Sans TC', sans-serif",
      overflow: "hidden",
    }}>
      <div style={{
        width: "min(92vw, 92vh)",
        height: "min(92vw, 92vh)",
        background: "linear-gradient(160deg, #8b1a1a 0%, #5c0f0f 40%, #3d0808 100%)",
        borderRadius: "20px",
        border: "4px solid #c8860a",
        boxShadow: "0 0 40px rgba(200,134,10,0.5), inset 0 0 30px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-evenly",
        padding: "5% 5%",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}>
        {/* Corner diamonds */}
        {[{ top: "10px", left: "10px" }, { top: "10px", right: "10px" }, { bottom: "10px", left: "10px" }, { bottom: "10px", right: "10px" }].map((pos, i) => (
          <div key={i} style={{ position: "absolute", width: "12px", height: "12px", background: "#c8860a", transform: "rotate(45deg)", ...pos }} />
        ))}

        {/* Title */}
        <div style={{ textAlign: "center", lineHeight: 1.2 }}>
          <div style={{ fontSize: "clamp(14px, 4vw, 24px)", fontWeight: "900", color: "#ffd700", textShadow: "0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.8)", letterSpacing: "0.15em" }}>名探偵コナン</div>
          <div style={{ fontSize: "clamp(9px, 2.5vw, 13px)", color: "#c8860a", letterSpacing: "0.3em", textTransform: "uppercase", marginTop: "3px" }}>SLOT MACHINE</div>
        </div>

        {/* Reels */}
        <div style={{ width: "100%", display: "flex", gap: "3%", alignItems: "center", justifyContent: "center" }}>
          {([0, 1, 2] as const).map((i) => (
            <Reel
              key={i}
              reelId={`reel-${i}`}
              spinTrigger={spinTrigger}
              targetIndex={finals[i]}
              stopDelay={stopDelays[i]}
              onStopped={handleReelStopped}
            />
          ))}
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={gameState === "spinning"}
          style={{
            width: "62%", padding: "3.5% 0",
            background: gameState === "spinning"
              ? "linear-gradient(180deg, #555 0%, #333 100%)"
              : "linear-gradient(180deg, #ff4444 0%, #cc0000 50%, #990000 100%)",
            border: "3px solid",
            borderColor: gameState === "spinning" ? "#666" : "#ff8888",
            borderRadius: "50px", color: "#fff",
            fontSize: "clamp(13px, 3.5vw, 18px)", fontWeight: "900", letterSpacing: "0.2em",
            cursor: gameState === "spinning" ? "not-allowed" : "pointer",
            boxShadow: gameState === "spinning" ? "none" : "0 4px 15px rgba(255,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            transition: "all 0.2s ease", fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { if (gameState !== "spinning") (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          {gameState === "spinning" ? "轉動中…" : "SPIN"}
        </button>

        {/* Result */}
        <div style={{ height: "clamp(22px, 5vh, 36px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {result && (
            <div style={{
              fontSize: "clamp(14px, 4vw, 20px)", fontWeight: "800",
              color: result.color, textShadow: `0 0 14px ${result.color}88`,
              letterSpacing: "0.1em", animation: "fadeIn 0.4s ease",
            }}>
              {result.msg}
            </div>
          )}
        </div>

        <style>{`@keyframes fadeIn { from { opacity:0; transform:scale(0.8); } to { opacity:1; transform:scale(1); } }`}</style>
      </div>
    </div>
  );
}
