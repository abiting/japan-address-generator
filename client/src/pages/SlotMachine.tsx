// Slot Machine — Detective Conan Edition
// Design: Compact square layout optimized for iframe embedding
// Style: Casino red/gold with vertical scroll reel animation (RAF-based, snaps to cell)

import { useEffect, useRef, useState, useCallback } from "react";

const CHARS = [
  "/manus-storage/char_01_5bc55a42.png",
  "/manus-storage/char_02_046a8223.png",
  "/manus-storage/char_03_8a1ac675.png",
  "/manus-storage/char_04_2d368c32.png",
  "/manus-storage/char_05_3364444c.png",
  "/manus-storage/char_06_0fbe9a6e.png",
  "/manus-storage/char_07_2d71ff07.png",
  "/manus-storage/char_08_56093021.png",
  "/manus-storage/char_09_e5b0c803.png",
  "/manus-storage/char_10_540ac6fb.png",
  "/manus-storage/char_11_04eee064.png",
  "/manus-storage/char_12_906503ca.png",
  "/manus-storage/char_13_19bbbebb.png",
  "/manus-storage/char_14_9c6eb733.png",
  "/manus-storage/char_15_eb187663.png",
  "/manus-storage/char_16_8e52df9d.png",
  "/manus-storage/char_17_24ed65fd.png",
  "/manus-storage/char_18_6c2a7c2b.png",
  "/manus-storage/char_19_7f8bbc49.png",
  "/manus-storage/char_20_f6748cc7.png",
  "/manus-storage/char_21_ebce64cd.png",
  "/manus-storage/char_22_386ce831.png",
  "/manus-storage/char_23_b27aef62.png",
  "/manus-storage/char_24_a56bc81e.png",
  "/manus-storage/char_25_07d4ba92.png",
  "/manus-storage/char_26_798ca2f8.png",
  "/manus-storage/char_27_8abd546f.png",
  "/manus-storage/char_28_ce9ac3e7.png",
  "/manus-storage/char_29_3685c44f.png",
];

const N = CHARS.length; // 29

// Reel: uses requestAnimationFrame for precise cell-snapped scrolling
function Reel({
  spinning,
  targetIndex,
  stopDelay,
  onStopped,
}: {
  spinning: boolean;
  targetIndex: number;
  stopDelay: number; // ms before this reel starts decelerating
  onStopped: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // offsetIndex: which cell is currently at the top of the visible window
  const offsetRef = useRef(0); // float, in cell units
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const phaseRef = useRef<"idle" | "fast" | "decel" | "done">("idle");
  const stoppedFiredRef = useRef(false);

  // Build a virtual strip: we render N*3 cells and wrap via modulo
  const VISIBLE = 3; // cells visible in strip (top, center, bottom)
  const STRIP_SIZE = N * 3;

  const getY = (offset: number, cellPx: number) => {
    // offset is in cell units; we want the center cell to show targetIndex
    // translateY moves strip up
    return -offset * cellPx;
  };

  const applyTransform = useCallback((offset: number) => {
    const el = containerRef.current;
    if (!el) return;
    const cellPx = el.parentElement!.clientHeight;
    el.style.transform = `translateY(${getY(offset, cellPx)}px)`;
  }, []);

  useEffect(() => {
    if (!spinning) {
      cancelAnimationFrame(rafRef.current);
      phaseRef.current = "idle";
      stoppedFiredRef.current = false;
      return;
    }

    stoppedFiredRef.current = false;
    phaseRef.current = "fast";
    startTimeRef.current = performance.now();

    // Speed: cells per ms
    const FAST_SPEED = 0.025; // cells/ms
    const DECEL_DURATION = 700; // ms to decelerate

    // We want to land on targetIndex exactly.
    // After stopDelay ms of fast spin, we decelerate to land on targetIndex.
    // We compute how many full loops + targetIndex offset to travel.

    let decelStartOffset = 0;
    let decelStartTime = 0;
    let totalDecelDistance = 0;

    const loop = (now: number) => {
      const elapsed = now - startTimeRef.current;

      if (phaseRef.current === "fast") {
        // Fast constant spin
        offsetRef.current = elapsed * FAST_SPEED;
        applyTransform(offsetRef.current % STRIP_SIZE);

        if (elapsed >= stopDelay) {
          // Transition to decel phase
          phaseRef.current = "decel";
          decelStartOffset = offsetRef.current;
          decelStartTime = now;

          // Compute target: we need to land so that (targetOffset % N) === targetIndex
          // Current position mod N:
          const curMod = decelStartOffset % N;
          // We need to travel at least some distance (min 1 full loop) and land on targetIndex
          // Distance to reach targetIndex from curMod (going forward):
          let distToTarget = (targetIndex - curMod + N) % N;
          if (distToTarget < 2) distToTarget += N; // ensure at least 2 cells of decel
          // Add extra loops for visual effect
          totalDecelDistance = distToTarget + N * 1;
        }
      } else if (phaseRef.current === "decel") {
        const decelElapsed = now - decelStartTime;
        const t = Math.min(decelElapsed / DECEL_DURATION, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        const currentOffset = decelStartOffset + eased * totalDecelDistance;
        offsetRef.current = currentOffset;
        applyTransform(currentOffset % STRIP_SIZE);

        if (t >= 1) {
          // Snap exactly to targetIndex
          const snappedOffset = Math.round(currentOffset / N) * N + targetIndex;
          applyTransform(snappedOffset % STRIP_SIZE);
          offsetRef.current = snappedOffset;
          phaseRef.current = "done";
          if (!stoppedFiredRef.current) {
            stoppedFiredRef.current = true;
            onStopped();
          }
          return;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spinning, targetIndex, stopDelay, applyTransform, onStopped]);

  // Build strip: render STRIP_SIZE cells, display based on current offset
  const cells = Array.from({ length: STRIP_SIZE }, (_, i) => CHARS[i % N]);

  return (
    <div
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
      {/* Top/bottom fade masks */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(245,239,224,0.9) 0%, transparent 30%, transparent 70%, rgba(237,227,204,0.9) 100%)",
      }} />

      {/* Scrolling strip */}
      <div
        ref={containerRef}
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
            }}
          >
            <img
              src={src}
              alt="character"
              style={{ width: "88%", height: "88%", objectFit: "contain" }}
            />
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
  const [isWin, setIsWin] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const stoppedCount = useRef(0);

  const handleSpin = () => {
    if (gameState === "spinning") return;

    const r0 = Math.floor(Math.random() * N);
    let r1: number, r2: number;
    const roll = Math.random();
    if (roll < 0.05) {
      // Jackpot: all three same
      r1 = r0; r2 = r0;
    } else if (roll < 0.20) {
      // Two same
      do { r1 = Math.floor(Math.random() * N); } while (r1 === r0);
      r2 = r0;
    } else {
      // All different
      do { r1 = Math.floor(Math.random() * N); } while (r1 === r0);
      do { r2 = Math.floor(Math.random() * N); } while (r2 === r0 || r2 === r1);
    }

    setFinals([r0, r1, r2]);
    setIsWin(r0 === r1 || r1 === r2 || r0 === r2);
    stoppedCount.current = 0;
    setGameState("spinning");
    setSpinKey((k) => k + 1);
  };

  const handleReelStopped = useCallback(() => {
    stoppedCount.current += 1;
    if (stoppedCount.current >= 3) {
      setGameState("result");
    }
  }, []);

  // Staggered stop delays: reel 0 stops first, then 1, then 2
  const stopDelays = [1000, 1700, 2400];

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
        justifyContent: "flex-start",
        padding: "4% 5%",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}>
        {/* Corner diamonds */}
        {[{ top: "8px", left: "8px" }, { top: "8px", right: "8px" }, { bottom: "8px", left: "8px" }, { bottom: "8px", right: "8px" }].map((pos, i) => (
          <div key={i} style={{ position: "absolute", width: "12px", height: "12px", background: "#c8860a", transform: "rotate(45deg)", ...pos }} />
        ))}

        {/* Title */}
        <div style={{ textAlign: "center", lineHeight: 1.1, marginBottom: "3%" }}>
          <div style={{
            fontSize: "clamp(14px, 4vw, 22px)", fontWeight: "900", color: "#ffd700",
            textShadow: "0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.8)",
            letterSpacing: "0.15em",
          }}>名探偵コナン</div>
          <div style={{
            fontSize: "clamp(9px, 2.5vw, 13px)", color: "#c8860a",
            letterSpacing: "0.3em", textTransform: "uppercase", marginTop: "2px",
          }}>SLOT MACHINE</div>
        </div>

        {/* Reels */}
        <div style={{
          width: "100%",
          display: "flex", gap: "3%",
          alignItems: "center", justifyContent: "center",
          marginBottom: "3%",
        }}>
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
            width: "65%", padding: "3% 0",
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
            marginBottom: "3%",
          }}
          onMouseEnter={(e) => { if (gameState !== "spinning") (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
        >
          {gameState === "spinning" ? "轉動中…" : "SPIN"}
        </button>

        {/* Result area — always reserves space */}
        <div style={{
          height: "clamp(24px, 6vh, 40px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {gameState === "result" && (
            <div style={{
              fontSize: "clamp(14px, 4vw, 20px)", fontWeight: "800",
              color: isWin ? "#ffd700" : "#ffaaaa",
              textShadow: isWin ? "0 0 14px rgba(255,215,0,0.9)" : "0 0 8px rgba(255,170,170,0.6)",
              letterSpacing: "0.1em",
              animation: "fadeIn 0.4s ease",
            }}>
              {isWin ? "🎉 恭喜中獎！" : "再接再厲！"}
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
