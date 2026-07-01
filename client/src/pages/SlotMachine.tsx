// Slot Machine — Detective Conan Edition
// Key fix: cumulative px (no modulo during spin) → precise snap to targetIndex

import { useEffect, useRef, useState, useCallback } from "react";

const CHARS = [
  "/manus-storage/char_01_22802bad.png", // 0: 柯南
  "/manus-storage/char_02_defeba6e.png", // 1: 灰原哀
  "/manus-storage/char_03_cf9da978.png",
  "/manus-storage/char_04_f6244eb9.png",
  "/manus-storage/char_05_0bb16693.png",
  "/manus-storage/char_06_ea6d16a8.png",
  "/manus-storage/char_07_c6f0c306.png",
  "/manus-storage/char_08_eb63908f.png",
  "/manus-storage/char_09_531ed1ef.png",
  "/manus-storage/char_10_0cb12083.png",
  "/manus-storage/char_11_14d85704.png",
  "/manus-storage/char_12_c9064d6a.png",
  "/manus-storage/char_13_2e259fda.png",
  "/manus-storage/char_14_fdcfa790.png",
  "/manus-storage/char_15_9c2b6cd1.png",
  "/manus-storage/char_16_3c7c5659.png",
  "/manus-storage/char_17_7cac8e87.png",
  "/manus-storage/char_18_32331d7c.png",
  "/manus-storage/char_19_4cebc8d2.png",
  "/manus-storage/char_20_8bf8739f.png",
  "/manus-storage/char_21_87ee92fd.png",
  "/manus-storage/char_22_9884c1cb.png",
  "/manus-storage/char_23_eb5902d0.png",
  "/manus-storage/char_24_8500d1c8.png",
  "/manus-storage/char_26_3fdd9a8c.png",
  "/manus-storage/char_27_6f01b778.png",
  "/manus-storage/char_28_9518c0e0.png",
  "/manus-storage/char_29_db5d987a.png",
  "/manus-storage/char_30_fd8923f7.png",
];

const N = CHARS.length; // 28
const CONAN_IDX = 0;
const HAIBARA_IDX = 1;

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

// ─── Reel ─────────────────────────────────────────────────────────────────────
// The strip renders REPS * N cells. We track cumulative px (never modulo'd during
// animation) so the snap target is always a clean integer multiple of cellH.
const REPS = 8; // enough repetitions so we never run out of strip

interface ReelProps {
  spinning: boolean;
  targetIndex: number;
  stopDelay: number;
  onStopped: () => void;
}

function Reel({ spinning, targetIndex, stopDelay, onStopped }: ReelProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const cellHRef = useRef(0);
  const rafRef = useRef(0);

  // Animation state kept in refs to avoid stale closures
  const phaseRef = useRef<"idle" | "fast" | "decel" | "done">("idle");
  const startTimeRef = useRef(0);
  const decelStartPxRef = useRef(0);
  const decelStartTimeRef = useRef(0);
  const decelDistPxRef = useRef(0);
  const cumulativePxRef = useRef(0); // never reset during a spin
  const firedRef = useRef(false);

  // Measure cell height via ResizeObserver (cell = wrapper, since aspect-ratio 1:1)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => { cellHRef.current = el.clientHeight; });
    ro.observe(el);
    cellHRef.current = el.clientHeight;
    return () => ro.disconnect();
  }, []);

  const applyTranslate = (px: number) => {
    if (!stripRef.current) return;
    // Wrap visually so the strip doesn't scroll past its end
    const totalH = cellHRef.current * N * REPS;
    const visual = px % totalH;
    stripRef.current.style.transform = `translateY(${-visual}px)`;
  };

  useEffect(() => {
    if (!spinning) {
      cancelAnimationFrame(rafRef.current);
      phaseRef.current = "idle";
      firedRef.current = false;
      return;
    }

    // Reset for new spin
    cumulativePxRef.current = 0;
    firedRef.current = false;
    phaseRef.current = "fast";
    startTimeRef.current = performance.now();

    const FAST_PX_MS = 1.2;   // px per ms — constant full speed
    const DECEL_MS   = 900;   // deceleration duration
    let lastTime = performance.now();

    const loop = (now: number) => {
      const cellH = cellHRef.current;
      if (cellH <= 0) { lastTime = now; rafRef.current = requestAnimationFrame(loop); return; }

      const dt = now - lastTime;
      lastTime = now;
      const elapsed = now - startTimeRef.current;

      if (phaseRef.current === "fast") {
        // Advance by fixed delta each frame — starts at full speed immediately
        cumulativePxRef.current += dt * FAST_PX_MS;
        applyTranslate(cumulativePxRef.current);

        if (elapsed >= stopDelay) {
          phaseRef.current = "decel";
          decelStartPxRef.current = cumulativePxRef.current;
          decelStartTimeRef.current = now;

          // How many full cells have we scrolled past?
          const scrolledCells = cumulativePxRef.current / cellH; // fractional
          // We want to land on targetIndex.
          // The strip repeats every N cells. Find next occurrence of targetIndex
          // that is at least MIN_EXTRA cells ahead.
          const MIN_EXTRA = 3;
          const fractionalPos = scrolledCells % N;
          let cellsToTarget = (targetIndex - fractionalPos + N) % N;
          if (cellsToTarget < MIN_EXTRA) cellsToTarget += N;
          // Add 2 full loops for visual richness
          cellsToTarget += N * 2;

          decelDistPxRef.current = cellsToTarget * cellH;
        }
      } else if (phaseRef.current === "decel") {
        const dt = now - decelStartTimeRef.current;
        const t = Math.min(dt / DECEL_MS, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        const px = decelStartPxRef.current + eased * decelDistPxRef.current;
        cumulativePxRef.current = px;
        applyTranslate(px);

        if (t >= 1) {
          // Final snap: the exact target position
          const finalPx = decelStartPxRef.current + decelDistPxRef.current;
          // Snap to nearest cell boundary (should already be exact, but round for safety)
          const snapped = Math.round(finalPx / cellH) * cellH;
          cumulativePxRef.current = snapped;
          applyTranslate(snapped);
          phaseRef.current = "done";
          if (!firedRef.current) { firedRef.current = true; onStopped(); }
          return;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spinning, targetIndex, stopDelay, onStopped]);

  const cells = Array.from({ length: N * REPS }, (_, i) => CHARS[i % N]);

  return (
    <div
      ref={wrapperRef}
      style={{
        flex: "none",
        width: "30%",
        aspectRatio: "1 / 1",
        background: "linear-gradient(180deg, #f5efe0 0%, #ede3cc 50%, #f5efe0 100%)",
        border: "3px solid #c8860a",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "inset 0 0 12px rgba(0,0,0,0.15), 0 0 8px rgba(200,134,10,0.4)",
        position: "relative",
      }}
    >
      {/* Fade masks top/bottom */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(245,239,224,0.9) 0%, transparent 25%, transparent 75%, rgba(237,227,204,0.9) 100%)",
      }} />

      {/* Strip */}
      <div ref={stripRef} style={{ display: "flex", flexDirection: "column", willChange: "transform" }}>
        {cells.map((src, i) => (
          <div key={i} style={{
            flexShrink: 0, width: "100%", aspectRatio: "1 / 1",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "6% 8% 10% 8%", boxSizing: "border-box",
          }}>
            <img src={src} alt="character" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
  const [finals, setFinals] = useState<[number, number, number]>([0, 1, 2]);
  const [result, setResult] = useState<{ msg: string; color: string } | null>(null);
  const [spinKey, setSpinKey] = useState(0);
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

  const stopDelays = [900, 1600, 2300];

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
          <div style={{
            fontSize: "clamp(14px, 4vw, 24px)", fontWeight: "900", color: "#ffd700",
            textShadow: "0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.8)",
            letterSpacing: "0.15em",
          }}>名探偵コナン</div>
          <div style={{
            fontSize: "clamp(9px, 2.5vw, 13px)", color: "#c8860a",
            letterSpacing: "0.3em", textTransform: "uppercase", marginTop: "3px",
          }}>SLOT MACHINE</div>
        </div>

        {/* Reels */}
        <div style={{ width: "100%", display: "flex", gap: "3%", alignItems: "center", justifyContent: "center" }}>
          {([0, 1, 2] as const).map((i) => (
            <Reel
              key={`${spinKey}-${i}`}
              spinning={gameState === "spinning"}
              targetIndex={finals[i]}
              stopDelay={stopDelays[i]}
              onStopped={handleReelStopped}
            />
          ))}
        </div>

        {/* SPIN button */}
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
            borderRadius: "50px",
            color: "#fff",
            fontSize: "clamp(13px, 3.5vw, 18px)", fontWeight: "900",
            letterSpacing: "0.2em",
            cursor: gameState === "spinning" ? "not-allowed" : "pointer",
            boxShadow: gameState === "spinning" ? "none" : "0 4px 15px rgba(255,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            transition: "all 0.2s ease",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { if (gameState !== "spinning") (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          {gameState === "spinning" ? "轉動中…" : "SPIN"}
        </button>

        {/* Result area */}
        <div style={{ height: "clamp(22px, 5vh, 36px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {result && (
            <div style={{
              fontSize: "clamp(14px, 4vw, 20px)", fontWeight: "800",
              color: result.color,
              textShadow: `0 0 14px ${result.color}88`,
              letterSpacing: "0.1em",
              animation: "fadeIn 0.4s ease",
            }}>
              {result.msg}
            </div>
          )}
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.8); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </div>
  );
}
