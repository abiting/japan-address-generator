// Slot Machine — Detective Conan Edition
// Rewrite v3: CSS transition-based snap for pixel-perfect stop + instant full speed

import { useEffect, useRef, useState, useCallback } from "react";

const CHARS = [
  "/manus-storage/char_01_22802bad.png", // 0: 柯南
  "/manus-storage/char_02_defeba6e.png", // 1: 灰原哀
  "/manus-storage/char_03_cf9da978.png",
  "/manus-storage/char_04_99a8e9d5.png",
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

const N = CHARS.length; // 29
const CONAN_IDX = 0;
const HAIBARA_IDX = 1;

// Strip layout: we render 3 copies of the full list.
// Copy 0: indices 0..N-1
// Copy 1: indices N..2N-1   ← we spin INTO this copy
// Copy 2: indices 2N..3N-1
// During spin we animate translateY at constant speed using RAF.
// When stop is triggered we compute the exact px for targetIndex in copy 1 (or 2),
// then use a CSS cubic-bezier transition to snap there precisely.
const COPIES = 3;
const TOTAL = N * COPIES;

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

interface ReelProps {
  spinning: boolean;
  targetIndex: number;
  stopDelay: number;   // ms after spin starts to begin decel
  onStopped: () => void;
}

function Reel({ spinning, targetIndex, stopDelay, onStopped }: ReelProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const currentPxRef = useRef(0);   // current translateY magnitude (positive = scrolled down)
  const stoppedRef = useRef(false);
  const cellHRef = useRef(0);

  // Measure cell height
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const update = () => { cellHRef.current = el.clientHeight; };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setTranslate = (px: number, transition = "none") => {
    const el = stripRef.current;
    if (!el) return;
    el.style.transition = transition;
    el.style.transform = `translateY(${-px}px)`;
  };

  useEffect(() => {
    if (!spinning) {
      cancelAnimationFrame(rafRef.current);
      // Reset strip to top (copy 0, index 0) instantly
      currentPxRef.current = 0;
      stoppedRef.current = false;
      setTranslate(0);
      return;
    }

    // ── Start: position strip so copy 0 is visible (px=0 shows index 0 of copy 0)
    // We'll spin downward, so translateY goes increasingly negative (px increases).
    // Start at px = 0 (top of strip).
    currentPxRef.current = 0;
    stoppedRef.current = false;
    setTranslate(0);

    const SPEED = 1.4; // px per ms — fast from frame 1
    startTimeRef.current = performance.now();
    let lastTime = performance.now();

    const loop = (now: number) => {
      const cellH = cellHRef.current;
      if (cellH <= 0) { lastTime = now; rafRef.current = requestAnimationFrame(loop); return; }

      const elapsed = now - startTimeRef.current;
      const dt = now - lastTime;
      lastTime = now;

      if (!stoppedRef.current) {
        // Advance at constant speed
        currentPxRef.current += dt * SPEED;

        // Visual wrap: keep within strip bounds to avoid blank space
        const totalH = cellH * TOTAL;
        if (currentPxRef.current >= totalH - cellH * N) {
          // Jump back by N cells (one full copy) — seamless because strip repeats
          currentPxRef.current -= cellH * N;
        }

        setTranslate(currentPxRef.current);

        // Time to stop?
        if (elapsed >= stopDelay) {
          stoppedRef.current = true;

          // Compute snap target: we want to show targetIndex.
          // Pick copy 1 (offset = N * cellH) as the landing zone — it's always
          // reachable since we've been spinning and wrapping within copy 0/1.
          // Find the nearest occurrence of targetIndex at or ahead of currentPxRef.
          const targetPxInCopy1 = (N + targetIndex) * cellH;

          // We need targetPx > currentPxRef so we always scroll forward.
          // If copy 1 is already behind us, use copy 2.
          let snapPx = targetPxInCopy1;
          if (snapPx <= currentPxRef.current + cellH * 2) {
            snapPx = (N * 2 + targetIndex) * cellH;
          }

          // Decel distance must be at least 2 full loops for visual richness
          const minExtra = cellH * N * 1; // at least 1 extra loop
          if (snapPx < currentPxRef.current + minExtra) {
            snapPx += cellH * N;
          }

          const decelMs = 900;
          setTranslate(snapPx, `transform ${decelMs}ms cubic-bezier(0.25, 0.1, 0.25, 1.0)`);
          currentPxRef.current = snapPx;

          setTimeout(() => {
            // After transition ends, hard-set to exact pixel (no drift)
            setTranslate(snapPx, "none");
            onStopped();
          }, decelMs + 50);

          return; // stop RAF
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning, targetIndex, stopDelay]);

  const cells = Array.from({ length: TOTAL }, (_, i) => CHARS[i % N]);

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
            padding: "8%", boxSizing: "border-box",
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

  // Stop delays: reel 0 stops first, then 1, then 2
  const stopDelays = [800, 1500, 2200];

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
