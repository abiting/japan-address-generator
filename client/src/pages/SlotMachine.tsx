import { useEffect, useRef, useState } from "react";

const CHARS: { src: string; name: string }[] = [
  { src: "/manus-storage/sticker_1_5b7efd09.png",  name: "江戶川柯南" },
  { src: "/manus-storage/sticker_2_79040213.png",  name: "江戶川柯南②" },
  { src: "/manus-storage/sticker_3_6bebf874.png",  name: "角色 3" },
  { src: "/manus-storage/sticker_4_6fbe4095.png",  name: "角色 4" },
  { src: "/manus-storage/sticker_5_c6aa4ab0.png",  name: "角色 5" },
  { src: "/manus-storage/sticker_6_abb39e7f.png",  name: "角色 6" },
  { src: "/manus-storage/sticker_7_7569cf9d.png",  name: "角色 7" },
  { src: "/manus-storage/sticker_9_afd19521.png",  name: "角色 9" },
  { src: "/manus-storage/sticker_10_b73ab927.png", name: "服部平次" },
  { src: "/manus-storage/sticker_11_91cf80f2.png", name: "角色 11" },
  { src: "/manus-storage/sticker_12_0e8f286f.png", name: "角色 12" },
  { src: "/manus-storage/sticker_13_f25ff0af.png", name: "角色 13" },
  { src: "/manus-storage/sticker_14_3ed6df96.png", name: "怪盜基德" },
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
const CONAN_IDX   = 0;
const HAIBARA_IDX = 29;
const HEIJI_IDX   = 8;
const KID_IDX     = 12;

const CELL   = 160;
const TICK   = 55;
const COPIES = 6;

function getResult(r: [number, number, number]): { msg: string; color: string } {
  const [a, b, c] = r;
  if (a === b && b === c) return { msg: "恭喜中獎！", color: "#ffd700" };
  const cc = r.filter(x => x === CONAN_IDX).length;
  const hc = r.filter(x => x === HAIBARA_IDX).length;
  const hj = r.filter(x => x === HEIJI_IDX).length;
  const kd = r.filter(x => x === KID_IDX).length;
  if (cc + hc === 3 && cc >= 1 && hc >= 1) return { msg: "柯哀好嗑！", color: "#ffb3d9" };
  if (cc + hj === 3 && cc >= 1 && hj >= 1) return { msg: "基友無敵！", color: "#ffa040" };
  if (cc + kd === 3 && cc >= 1 && kd >= 1) return { msg: "兄弟齊心！", color: "#80d0ff" };
  if (a === b || b === c || a === c)        return { msg: "運氣不錯！", color: "#90ee90" };
  return { msg: "再接再厲！", color: "#ffaaaa" };
}

interface ReelProps {
  spinning: boolean;
  finalIndex: number;
  reelIndex: number;
}

function Reel({ spinning, finalIndex, reelIndex }: ReelProps) {
  const strip = Array.from({ length: COPIES * N }, (_, i) => CHARS[i % N]);
  const currentCellRef = useRef(reelIndex * 3);
  const [translateY, setTranslateY] = useState(-(reelIndex * 3) * CELL);
  const [transition, setTransition] = useState("none");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (spinning) {
      setTransition("none");
      intervalRef.current = setInterval(() => {
        currentCellRef.current += 1;
        if (currentCellRef.current >= (COPIES - 2) * N) {
          currentCellRef.current -= N;
        }
        setTranslateY(-currentCellRef.current * CELL);
      }, TICK);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      const cur = currentCellRef.current;
      const curMod = cur % N;
      let stepsForward = (finalIndex - curMod + N) % N;
      if (stepsForward === 0) stepsForward = N;
      const targetCell = cur + stepsForward;
      currentCellRef.current = targetCell;
      setTransition("transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)");
      setTranslateY(-targetCell * CELL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [spinning, finalIndex]);

  return (
    <div style={{
      width: `${CELL}px`,
      height: `${CELL}px`,
      overflow: "hidden",
      borderRadius: "10px",
      border: `2px solid ${spinning ? "#ff8c00" : "#8b6914"}`,
      background: "#fffbf0",
      boxShadow: spinning
        ? "0 0 14px rgba(255,140,0,0.7), inset 0 0 8px rgba(255,140,0,0.2)"
        : "inset 0 2px 8px rgba(0,0,0,0.15)",
      transition: "border-color 0.2s, box-shadow 0.2s",
      position: "relative",
      flexShrink: 0,
    }}>
      <div style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(180deg, rgba(255,251,240,0.55) 0%, transparent 25%, transparent 75%, rgba(255,251,240,0.55) 100%)",
      }} />
      <div style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%",
        transform: `translateY(${translateY}px)`,
        transition,
        willChange: "transform",
      }}>
        {strip.map((ch, i) => (
          <div key={i} style={{
            width: `${CELL}px`,
            height: `${CELL}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px",
            boxSizing: "border-box",
          }}>
            <img
              src={ch.src}
              alt={ch.name}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

type Phase = "idle" | "spinning" | "result";

export default function SlotMachine() {
  const [phase, setPhase]       = useState<Phase>("idle");
  const [spinning, setSpinning] = useState(false);
  const [finals, setFinals]     = useState<[number, number, number]>([CONAN_IDX, CONAN_IDX, CONAN_IDX]);
  const [result, setResult]     = useState<{ msg: string; color: string } | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSpin = () => {
    if (phase === "spinning") return;
    const roll = Math.random();
    let r0: number, r1: number, r2: number;
    if (roll < 0.04) {
      const idx = Math.floor(Math.random() * N);
      r0 = r1 = r2 = idx;
    } else if (roll < 0.10) {
      const pair = Math.random() < 0.5
        ? [CONAN_IDX, CONAN_IDX, HAIBARA_IDX]
        : [HAIBARA_IDX, HAIBARA_IDX, CONAN_IDX];
      [r0, r1, r2] = pair.sort(() => Math.random() - 0.5) as [number, number, number];
    } else if (roll < 0.16) {
      const pair = Math.random() < 0.5
        ? [CONAN_IDX, CONAN_IDX, HEIJI_IDX]
        : [HEIJI_IDX, HEIJI_IDX, CONAN_IDX];
      [r0, r1, r2] = pair.sort(() => Math.random() - 0.5) as [number, number, number];
    } else if (roll < 0.22) {
      const pair = Math.random() < 0.5
        ? [CONAN_IDX, CONAN_IDX, KID_IDX]
        : [KID_IDX, KID_IDX, CONAN_IDX];
      [r0, r1, r2] = pair.sort(() => Math.random() - 0.5) as [number, number, number];
    } else if (roll < 0.40) {
      r0 = Math.floor(Math.random() * N);
      do { r1 = Math.floor(Math.random() * N); } while (r1 === r0);
      r2 = r0;
    } else {
      r0 = Math.floor(Math.random() * N);
      do { r1 = Math.floor(Math.random() * N); } while (r1 === r0);
      do { r2 = Math.floor(Math.random() * N); } while (r2 === r0 || r2 === r1);
    }
    setFinals([r0, r1, r2]);
    setResult(null);
    setPhase("spinning");
    setSpinning(true);
    setSpinCount(c => c + 1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSpinning(false);
      setPhase("result");
    }, 1500);
  };

  useEffect(() => {
    if (phase === "result") setResult(getResult(finals));
  }, [phase, finals]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at center, #3a0a0a 0%, #1a0505 60%, #0d0202 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Noto Serif JP', serif",
    }}>
      <div style={{
        background: "linear-gradient(160deg, #2d1a0a 0%, #1a0d05 100%)",
        border: "3px solid #8b6914",
        borderRadius: "20px",
        padding: "32px 28px 28px",
        boxShadow: "0 0 60px rgba(180,120,0,0.4), 0 0 120px rgba(180,80,0,0.2), inset 0 1px 0 rgba(255,200,80,0.15)",
        position: "relative",
        display: "inline-block",
      }}>
        {[
          { top: "10px", left: "14px" },
          { top: "10px", right: "14px" },
          { bottom: "10px", left: "14px" },
          { bottom: "10px", right: "14px" },
        ].map((pos, i) => (
          <div key={i} style={{
            position: "absolute", ...pos,
            width: "8px", height: "8px",
            background: "#c8a020", borderRadius: "50%",
            boxShadow: "0 0 6px #ffd700",
          }} />
        ))}

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{
            fontSize: "clamp(22px, 5vw, 30px)",
            fontWeight: "bold",
            color: "#ffd700",
            textShadow: "0 0 20px rgba(255,215,0,0.6), 0 2px 4px rgba(0,0,0,0.8)",
            letterSpacing: "0.1em",
          }}>名探偵コナン</div>
          <div style={{
            fontSize: "11px", color: "#c8a020",
            letterSpacing: "0.35em", marginTop: "4px", opacity: 0.8,
          }}>SLOT MACHINE</div>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          padding: "16px 14px",
          background: "rgba(0,0,0,0.3)",
          borderRadius: "12px",
          border: "1px solid rgba(200,134,10,0.3)",
        }}>
          {([0, 1, 2] as const).map(i => (
            <Reel key={i} spinning={spinning} finalIndex={finals[i]} reelIndex={i} />
          ))}
        </div>

        <div style={{
          textAlign: "center",
          height: "30px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {phase === "spinning" && (
            <span style={{ color: "#c8a020", fontSize: "14px", opacity: 0.7 }}>轉動中…</span>
          )}
          {phase === "result" && result && (
            <span style={{
              color: result.color,
              fontSize: "20px",
              fontWeight: "bold",
              textShadow: `0 0 14px ${result.color}`,
            }}>{result.msg}</span>
          )}
          {phase === "idle" && (
            <span style={{ color: "#8b6914", fontSize: "13px", opacity: 0.6 }}>按下 SPIN 開始</span>
          )}
        </div>

        <button
          onClick={handleSpin}
          disabled={phase === "spinning"}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "18px",
            fontWeight: "bold",
            letterSpacing: "0.2em",
            color: phase === "spinning" ? "#888" : "#fff",
            background: phase === "spinning"
              ? "linear-gradient(180deg, #555 0%, #333 100%)"
              : "linear-gradient(180deg, #e03020 0%, #a01808 50%, #c02010 100%)",
            border: "none",
            borderRadius: "10px",
            cursor: phase === "spinning" ? "not-allowed" : "pointer",
            boxShadow: phase === "spinning"
              ? "none"
              : "0 4px 0 #6a0f08, 0 0 20px rgba(220,50,30,0.4)",
            transition: "all 0.15s",
          }}
        >
          {phase === "spinning" ? "轉動中…" : "SPIN"}
        </button>

        {spinCount > 0 && (
          <div style={{
            position: "absolute", top: "10px", right: "14px",
            background: "#1a0d05",
            border: "1px solid #8b6914",
            borderRadius: "50%",
            width: "28px", height: "28px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "11px", color: "#c8a020",
          }}>{spinCount}</div>
        )}
      </div>
    </div>
  );
}
