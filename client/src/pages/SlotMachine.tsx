import { useEffect, useRef, useState } from "react";

const CHARS: { src: string; name: string }[] = [
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_1.webp",      name: "江戶川柯南" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_2.webp",      name: "江戶川柯南②" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_3.webp.avif", name: "角色 3" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_4.webp.avif", name: "角色 4" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_5.webp.avif", name: "角色 5" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_6.webp.avif", name: "角色 6" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_7.webp.avif", name: "角色 7" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_9.webp.avif", name: "角色 9" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_10.webp.avif", name: "服部平次" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_11.webp.avif", name: "角色 11" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_12.webp.avif", name: "角色 12" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_13.webp.avif", name: "角色 13" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_14.webp.avif", name: "怪盜基德" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_15.webp.avif", name: "角色 15" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_16.webp.avif", name: "角色 16" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_17.webp.avif", name: "角色 17" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_18.webp.avif", name: "角色 18" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_19.webp.avif", name: "角色 19" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_20.webp.avif", name: "角色 20" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_21.webp.avif", name: "角色 21" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_22.webp.avif", name: "角色 22" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_23.webp.avif", name: "角色 23" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_24.webp.avif", name: "角色 24" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_25.webp.avif", name: "角色 25" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_26.webp.avif", name: "角色 26" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_27.webp.avif", name: "角色 27" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_28.webp.avif", name: "角色 28" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_29.webp.avif", name: "角色 29" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/sticker_30.webp.avif", name: "角色 30" },
  { src: "https://coai.abiting.cc/wp-content/uploads/2026/08/小哀.webp.avif",         name: "灰原哀" },
];

const N = CHARS.length;
const CONAN_IDX   = 0;
const HAIBARA_IDX = 29;
const HEIJI_IDX   = 8;
const KID_IDX     = 12;

const TICK   = 55;
const COPIES = 6;

// 依視窗寬度決定格子尺寸
function getCellSize(): number {
  const vw = window.innerWidth;
  if (vw <= 360) return 90;
  if (vw <= 430) return 100;
  if (vw <= 520) return 110;
  return 160;
}

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
  cell: number;
}

function Reel({ spinning, finalIndex, reelIndex, cell }: ReelProps) {
  const strip = Array.from({ length: COPIES * N }, (_, i) => CHARS[i % N]);
  const currentCellRef = useRef(reelIndex * 3);
  const [translateY, setTranslateY] = useState(-(reelIndex * 3) * cell);
  const [transition, setTransition] = useState("none");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 當 cell 尺寸改變時重設位置（視窗 resize）
  useEffect(() => {
    setTranslateY(-currentCellRef.current * cell);
  }, [cell]);

  useEffect(() => {
    if (spinning) {
      setTransition("none");
      intervalRef.current = setInterval(() => {
        currentCellRef.current += 1;
        if (currentCellRef.current >= (COPIES - 2) * N) {
          currentCellRef.current -= N;
        }
        setTranslateY(-currentCellRef.current * cell);
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
      setTranslateY(-targetCell * cell);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [spinning, finalIndex, cell]);

  return (
    <div style={{
      width: `${cell}px`,
      height: `${cell}px`,
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
            width: `${cell}px`,
            height: `${cell}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
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
  const [phase, setPhase]         = useState<Phase>("idle");
  const [spinning, setSpinning]   = useState(false);
  const [finals, setFinals]       = useState<[number, number, number]>([CONAN_IDX, CONAN_IDX, CONAN_IDX]);
  const [result, setResult]       = useState<{ msg: string; color: string } | null>(null);
  const [spinCount, setSpinCount] = useState(0);
  const [cell, setCell]           = useState(() => getCellSize());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 監聽視窗 resize，動態更新格子尺寸
  useEffect(() => {
    const onResize = () => setCell(getCellSize());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  // 機台寬度 = 3格 + 2間距(12px) + 左右padding(28px*2)
  const machineWidth = cell * 3 + 12 * 2 + 28 * 2;

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at center, #3a0a0a 0%, #1a0505 60%, #0d0202 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Noto Serif JP', serif",
      padding: "16px",
      boxSizing: "border-box",
    }}>
      <div style={{
        background: "linear-gradient(160deg, #2d1a0a 0%, #1a0d05 100%)",
        border: "3px solid #8b6914",
        borderRadius: "20px",
        padding: "28px 28px 24px",
        boxShadow: "0 0 60px rgba(180,120,0,0.4), 0 0 120px rgba(180,80,0,0.2), inset 0 1px 0 rgba(255,200,80,0.15)",
        position: "relative",
        width: `${machineWidth}px`,
        maxWidth: "100%",
        boxSizing: "border-box",
      }}>
        {/* 四角螺絲 */}
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

        {/* 標題 */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div style={{
            fontSize: "clamp(18px, 6vw, 30px)",
            fontWeight: "bold",
            color: "#ffd700",
            textShadow: "0 0 20px rgba(255,215,0,0.6), 0 2px 4px rgba(0,0,0,0.8)",
            letterSpacing: "0.1em",
          }}>名探偵コナン</div>
          <div style={{
            fontSize: "10px", color: "#c8a020",
            letterSpacing: "0.35em", marginTop: "4px", opacity: 0.8,
          }}>SLOT MACHINE</div>
        </div>

        {/* 轉輪區 */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
          padding: "12px 10px",
          background: "rgba(0,0,0,0.3)",
          borderRadius: "12px",
          border: "1px solid rgba(200,134,10,0.3)",
        }}>
          {([0, 1, 2] as const).map(i => (
            <Reel key={i} spinning={spinning} finalIndex={finals[i]} reelIndex={i} cell={cell} />
          ))}
        </div>

        {/* 結果文字 */}
        <div style={{
          textAlign: "center",
          height: "28px",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {phase === "spinning" && (
            <span style={{ color: "#c8a020", fontSize: "13px", opacity: 0.7 }}>轉動中…</span>
          )}
          {phase === "result" && result && (
            <span style={{
              color: result.color,
              fontSize: "clamp(16px, 5vw, 20px)",
              fontWeight: "bold",
              textShadow: `0 0 14px ${result.color}`,
            }}>{result.msg}</span>
          )}
          {phase === "idle" && (
            <span style={{ color: "#8b6914", fontSize: "12px", opacity: 0.6 }}>按下 SPIN 開始</span>
          )}
        </div>

        {/* SPIN 按鈕 */}
        <button
          onClick={handleSpin}
          disabled={phase === "spinning"}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "clamp(15px, 4vw, 18px)",
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

        {/* 次數計數 */}
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
