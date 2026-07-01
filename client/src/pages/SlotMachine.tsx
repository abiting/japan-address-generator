// Slot Machine — Detective Conan Edition
// Design: Compact square layout optimized for iframe embedding
// Style: Playful, vibrant — red/gold casino aesthetic with anime flair

import { useEffect, useRef, useState } from "react";

// All 29 cropped character images via storage proxy
const CHARS = [
  "/manus-storage/char_01_38eef70e.png",
  "/manus-storage/char_02_27ad5a26.png",
  "/manus-storage/char_03_f782639b.png",
  "/manus-storage/char_04_ab42768b.png",
  "/manus-storage/char_05_86f2885f.png",
  "/manus-storage/char_06_669e2475.png",
  "/manus-storage/char_07_e7f22386.png",
  "/manus-storage/char_08_c91e76e6.png",
  "/manus-storage/char_09_426211da.png",
  "/manus-storage/char_10_f99aee37.png",
  "/manus-storage/char_11_400f11fd.png",
  "/manus-storage/char_12_8dfe1b29.png",
  "/manus-storage/char_13_efda780a.png",
  "/manus-storage/char_14_24843576.png",
  "/manus-storage/char_15_91dcacf0.png",
  "/manus-storage/char_16_705cdbc7.png",
  "/manus-storage/char_17_dce43c7b.png",
  "/manus-storage/char_18_c19ed985.png",
  "/manus-storage/char_19_65b70f4c.png",
  "/manus-storage/char_20_b795067e.png",
  "/manus-storage/char_21_f53fb052.png",
  "/manus-storage/char_22_53592098.png",
  "/manus-storage/char_23_0d7b8f72.png",
  "/manus-storage/char_24_1218c3d9.png",
  "/manus-storage/char_25_da381016.png",
  "/manus-storage/char_26_6b9410e7.png",
  "/manus-storage/char_27_fdb8237a.png",
  "/manus-storage/char_28_92b91eab.png",
  "/manus-storage/char_29_03a9111f.png",
];

function useSlotReel(isSpinning: boolean, finalIndex: number | null) {
  const [displayIndex, setDisplayIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isSpinning) {
      intervalRef.current = setInterval(() => {
        setDisplayIndex(Math.floor(Math.random() * CHARS.length));
      }, 80);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (finalIndex !== null) setDisplayIndex(finalIndex);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSpinning, finalIndex]);

  return displayIndex;
}

function Reel({
  isSpinning,
  finalIndex,
  delay,
}: {
  isSpinning: boolean;
  finalIndex: number | null;
  delay: number;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (isSpinning) {
      const t = setTimeout(() => setActive(true), delay);
      return () => clearTimeout(t);
    } else {
      setActive(false);
    }
  }, [isSpinning, delay]);

  const idx = useSlotReel(active, active ? null : finalIndex);

  return (
    <div
      className="reel-container"
      style={{
        flex: "none",
        width: "30%",
        aspectRatio: "1 / 1",
        background: "linear-gradient(180deg, #f5efe0 0%, #ede3cc 50%, #f5efe0 100%)",
        border: "3px solid #c8860a",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxShadow: "inset 0 0 20px rgba(0,0,0,0.8), 0 0 8px rgba(200,134,10,0.4)",
        position: "relative",
      }}
    >
      {/* Shine overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 50%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <img
        src={CHARS[idx]}
        alt="character"
        style={{
          width: "90%",
          height: "90%",
          objectFit: "contain",
          transition: active ? "none" : "transform 0.3s ease",
          transform: active ? "scale(1.05)" : "scale(1)",
          filter: active ? "brightness(1.2)" : "brightness(1)",
          imageRendering: "auto",

        }}
      />
    </div>
  );
}

type GameState = "idle" | "spinning" | "result";

export default function SlotMachine() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [finals, setFinals] = useState<[number, number, number] | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const handleSpin = () => {
    if (gameState === "spinning") return;
    setGameState("spinning");
    setFinals(null);
    setIsWin(false);

    // Determine result after 2s
    setTimeout(() => {
      const r1 = Math.floor(Math.random() * CHARS.length);
      // ~15% chance of winning (two or three match)
      const winType = Math.random();
      let r2: number, r3: number;
      if (winType < 0.05) {
        // Jackpot: all three match
        r2 = r1;
        r3 = r1;
      } else if (winType < 0.20) {
        // Two match
        const pos = Math.floor(Math.random() * 3);
        if (pos === 0) { r2 = r1; r3 = Math.floor(Math.random() * CHARS.length); }
        else if (pos === 1) { r2 = Math.floor(Math.random() * CHARS.length); r3 = r1; }
        else { r2 = r1; r3 = r1; }
      } else {
        // No match — ensure all different
        do { r2 = Math.floor(Math.random() * CHARS.length); } while (r2 === r1);
        do { r3 = Math.floor(Math.random() * CHARS.length); } while (r3 === r1 || r3 === r2);
      }

      const won = r1 === r2 || r2 === r3 || r1 === r3;
      setFinals([r1, r2, r3]);
      setIsWin(won);
      setSpinCount((c) => c + 1);

      setTimeout(() => setGameState("result"), 400);
    }, 2000);
  };

  const reelSpinning = gameState === "spinning";

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0d0500 0%, #1f0a00 50%, #0d0500 100%)",
        fontFamily: "'Zen Maru Gothic', 'Noto Sans TC', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Machine body */}
      <div
        style={{
          width: "min(92vw, 92vh)",
          height: "min(92vw, 92vh)",
          background: "linear-gradient(160deg, #8b1a1a 0%, #5c0f0f 40%, #3d0808 100%)",
          borderRadius: "20px",
          border: "4px solid #c8860a",
          boxShadow: "0 0 40px rgba(200,134,10,0.5), inset 0 0 30px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4% 5%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative corner diamonds */}
        {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "12px",
              height: "12px",
              background: "#c8860a",
              transform: "rotate(45deg)",
              ...(pos.includes("top") ? { top: "8px" } : { bottom: "8px" }),
              ...(pos.includes("left") ? { left: "8px" } : { right: "8px" }),
            }}
          />
        ))}

        {/* Title */}
        <div style={{ textAlign: "center", lineHeight: 1.1 }}>
          <div
            style={{
              fontSize: "clamp(14px, 4vw, 22px)",
              fontWeight: "900",
              color: "#ffd700",
              textShadow: "0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.8)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            名探偵コナン
          </div>
          <div
            style={{
              fontSize: "clamp(9px, 2.5vw, 13px)",
              color: "#c8860a",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              marginTop: "2px",
            }}
          >
            SLOT MACHINE
          </div>
        </div>

        {/* Reels area */}
        <div
          style={{
        width: "100%",
          display: "flex",
          gap: "3%",
          padding: "3% 0",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Reel
              key={`${i}-${spinCount}`}
              isSpinning={reelSpinning}
              finalIndex={finals ? finals[i] : null}
              delay={i * 150}
            />
          ))}
        </div>

        {/* Result message */}
        <div
          style={{
            height: "clamp(20px, 5vh, 32px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {gameState === "result" && (
            <div
              style={{
                fontSize: "clamp(12px, 3.5vw, 18px)",
                fontWeight: "800",
                color: isWin ? "#ffd700" : "#ff6b6b",
                textShadow: isWin
                  ? "0 0 12px rgba(255,215,0,0.9)"
                  : "0 0 8px rgba(255,107,107,0.6)",
                letterSpacing: "0.1em",
                animation: "fadeIn 0.4s ease",
              }}
            >
              {isWin ? "🎉 中獎了！" : "再試一次！"}
            </div>
          )}
        </div>

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={gameState === "spinning"}
          style={{
            width: "70%",
            padding: "3% 0",
            background:
              gameState === "spinning"
                ? "linear-gradient(180deg, #555 0%, #333 100%)"
                : "linear-gradient(180deg, #ff4444 0%, #cc0000 50%, #990000 100%)",
            border: "3px solid",
            borderColor: gameState === "spinning" ? "#666" : "#ff8888",
            borderRadius: "50px",
            color: "#fff",
            fontSize: "clamp(13px, 3.5vw, 18px)",
            fontWeight: "900",
            letterSpacing: "0.2em",
            cursor: gameState === "spinning" ? "not-allowed" : "pointer",
            boxShadow:
              gameState === "spinning"
                ? "none"
                : "0 4px 15px rgba(255,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
            transition: "all 0.2s ease",
            transform: gameState === "spinning" ? "scale(0.97)" : "scale(1)",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (gameState !== "spinning") {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          {gameState === "spinning" ? "轉動中…" : "SPIN"}
        </button>

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
