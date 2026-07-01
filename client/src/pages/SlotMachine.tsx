// SlotMachine — parent controls ALL timing via refs/state
// Reel is purely reactive: it spins when active=true, stops when shouldStop=true

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
const CONAN_IDX = 0;
const HAIBARA_IDX = 29;
const HEIJI_IDX = 8;
const KID_IDX = 12;

const TICK_MS = 60;      // ms per frame (fast spin)
const SLOW_TICK_MS = 100; // ms per frame when about to stop

function getResult(r: [number, number, number]): { msg: string; color: string } {
  const [a, b, c] = r;
  if (a === b && b === c) return { msg: "恭喜中獎！", color: "#ffd700" };
  const conanCount = r.filter((x) => x === CONAN_IDX).length;
  const haibaraCount = r.filter((x) => x === HAIBARA_IDX).length;
  const heijiCount = r.filter((x) => x === HEIJI_IDX).length;
  const kidCount = r.filter((x) => x === KID_IDX).length;
  if (conanCount + haibaraCount === 3 && conanCount >= 1 && haibaraCount >= 1)
    return { msg: "柯哀好嗑！", color: "#ffb3d9" };
  if (conanCount + heijiCount === 3 && conanCount >= 1 && heijiCount >= 1)
    return { msg: "基友無敵！", color: "#ffa040" };
  if (conanCount + kidCount === 3 && conanCount >= 1 && kidCount >= 1)
    return { msg: "兄弟齊心！", color: "#80d0ff" };
  if (a === b || b === c || a === c) return { msg: "運氣不錯！", color: "#90ee90" };
  return { msg: "再接再厲！", color: "#ffaaaa" };
}

// ─── Reel ─────────────────────────────────────────────────────────────────────
// Props controlled entirely by parent:
//   active: whether this reel should be spinning
//   shouldStop: when true, finish current frame then snap to finalIndex
//   finalIndex: target index to land on
//   initOffset: starting position offset (so reels show different chars)
//   onStopped: callback when reel has fully stopped
interface ReelProps {
  active: boolean;
  shouldStop: boolean;
  finalIndex: number;
  initOffset: number;
  onStopped: () => void;
}

function Reel({ active, shouldStop, finalIndex, initOffset, onStopped }: ReelProps) {
  const [curIdx, setCurIdx] = useState(() => initOffset % N);
  const [nextIdx, setNextIdx] = useState(() => (initOffset + 1) % N);
  const [animating, setAnimating] = useState(false);
  const [stopped, setStopped] = useState(true);

  const activeRef = useRef(false);
  const shouldStopRef = useRef(false);
  const finalIdxRef = useRef(finalIndex);
  const curIdxRef = useRef(initOffset % N);
  const nextIdxRef = useRef((initOffset + 1) % N);
  const tickRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs in sync
  useEffect(() => { finalIdxRef.current = finalIndex; }, [finalIndex]);
  useEffect(() => { shouldStopRef.current = shouldStop; }, [shouldStop]);

  const clearTimers = useCallback(() => {
    if (tickRef.current) { clearTimeout(tickRef.current); tickRef.current = null; }
    if (animRef.current) { clearTimeout(animRef.current); animRef.current = null; }
  }, []);

  const doTick = useCallback(() => {
    if (!activeRef.current) return;
    setAnimating(true);
  }, []);

  const scheduleTick = useCallback((delay: number) => {
    if (tickRef.current) clearTimeout(tickRef.current);
    tickRef.current = setTimeout(doTick, delay);
  }, [doTick]);

  // Handle animation completion
  useEffect(() => {
    if (!animating) return;
    if (animRef.current) clearTimeout(animRef.current);
    animRef.current = setTimeout(() => {
      if (!activeRef.current) return;

      const newCur = nextIdxRef.current;
      const newNext = (newCur + 1) % N;

      // Check if we should stop on this frame
      if (shouldStopRef.current && newCur === finalIdxRef.current) {
        curIdxRef.current = newCur;
        nextIdxRef.current = newNext;
        setCurIdx(newCur);
        setNextIdx(newNext);
        setAnimating(false);
        activeRef.current = false;
        setStopped(true);
        onStopped();
        return;
      }

      curIdxRef.current = newCur;
      nextIdxRef.current = newNext;
      setCurIdx(newCur);
      setNextIdx(newNext);
      setAnimating(false);

      const delay = shouldStopRef.current ? SLOW_TICK_MS : TICK_MS;
      scheduleTick(delay);
    }, TICK_MS);

    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [animating, onStopped, scheduleTick]);

  // React to active changing
  useEffect(() => {
    if (active) {
      // Start spinning
      activeRef.current = true;
      shouldStopRef.current = false;
      setStopped(false);
      setAnimating(false);
      // Randomize start position
      const start = (Math.floor(Math.random() * N) + initOffset) % N;
      curIdxRef.current = start;
      nextIdxRef.current = (start + 1) % N;
      setCurIdx(start);
      setNextIdx((start + 1) % N);
      scheduleTick(0);
    } else {
      // Stopped externally (shouldn't happen normally)
      activeRef.current = false;
      clearTimers();
    }
    return clearTimers;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const char0 = CHARS[curIdx];
  const char1 = CHARS[nextIdx];

  return (
    <div style={{
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
    }}>
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
      <div style={{
        width: "100%",
        height: "200%",
        display: "flex",
        flexDirection: "column",
        transform: animating ? "translateY(-50%)" : "translateY(0)",
        transition: animating ? `transform ${TICK_MS}ms linear` : "none",
        willChange: "transform",
      }}>
        {[char0, char1].map((ch, i) => (
          <div key={i} style={{
            width: "100%",
            height: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10%",
            boxSizing: "border-box",
          }}>
            <img src={ch.src} alt={ch.name} style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
type Phase = "idle" | "spinning" | "result";

export default function SlotMachine() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [finals, setFinals] = useState<[number, number, number]>([CONAN_IDX, CONAN_IDX, CONAN_IDX]);
  const [result, setResult] = useState<{ msg: string; color: string } | null>(null);
  const [spinCount, setSpinCount] = useState(0);

  // Per-reel state controlled by parent
  const [reelActive, setReelActive] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const [reelShouldStop, setReelShouldStop] = useState<[boolean, boolean, boolean]>([false, false, false]);
  const stoppedCount = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const handleSpin = () => {
    if (phase === "spinning") return;

    // Pick finals
    const roll = Math.random();
    let r0: number, r1: number, r2: number;

    if (roll < 0.04) {
      const idx = Math.floor(Math.random() * N);
      r0 = r1 = r2 = idx;
    } else if (roll < 0.10) {
      if (Math.random() < 0.5) {
        [r0, r1, r2] = [CONAN_IDX, CONAN_IDX, HAIBARA_IDX].sort(() => Math.random() - 0.5) as [number, number, number];
      } else {
        [r0, r1, r2] = [HAIBARA_IDX, HAIBARA_IDX, CONAN_IDX].sort(() => Math.random() - 0.5) as [number, number, number];
      }
    } else if (roll < 0.16) {
      if (Math.random() < 0.5) {
        [r0, r1, r2] = [CONAN_IDX, CONAN_IDX, HEIJI_IDX].sort(() => Math.random() - 0.5) as [number, number, number];
      } else {
        [r0, r1, r2] = [HEIJI_IDX, HEIJI_IDX, CONAN_IDX].sort(() => Math.random() - 0.5) as [number, number, number];
      }
    } else if (roll < 0.22) {
      if (Math.random() < 0.5) {
        [r0, r1, r2] = [CONAN_IDX, CONAN_IDX, KID_IDX].sort(() => Math.random() - 0.5) as [number, number, number];
      } else {
        [r0, r1, r2] = [KID_IDX, KID_IDX, CONAN_IDX].sort(() => Math.random() - 0.5) as [number, number, number];
      }
    } else if (roll < 0.40) {
      r0 = Math.floor(Math.random() * N);
      do { r1 = Math.floor(Math.random() * N); } while (r1 === r0);
      r2 = Math.random() < 0.5 ? r0 : r1;
      [r0, r1, r2] = [r0, r1, r2].sort(() => Math.random() - 0.5) as [number, number, number];
    } else {
      r0 = Math.floor(Math.random() * N);
      do { r1 = Math.floor(Math.random() * N); } while (r1 === r0);
      do { r2 = Math.floor(Math.random() * N); } while (r2 === r0 || r2 === r1);
    }

    setFinals([r0, r1, r2]);
    setResult(null);
    stoppedCount.current = 0;
    setPhase("spinning");
    setSpinCount((c) => c + 1);
    clearAllTimers();

    // Start all 3 reels simultaneously
    setReelActive([true, true, true]);
    setReelShouldStop([false, false, false]);

    // Stop left at 2s, mid at 3s, right at 4s
    const t0 = setTimeout(() => setReelShouldStop([true, false, false]), 2000);
    const t1 = setTimeout(() => setReelShouldStop([true, true, false]), 3000);
    const t2 = setTimeout(() => setReelShouldStop([true, true, true]), 4000);
    timersRef.current = [t0, t1, t2];
  };

  const handleReelStopped = useCallback(() => {
    stoppedCount.current += 1;
    if (stoppedCount.current >= 3) {
      setPhase("result");
    }
  }, []);

  useEffect(() => {
    if (phase === "result") {
      setResult(getResult(finals));
      setReelActive([false, false, false]);
    }
  }, [phase, finals]);

  // Cleanup on unmount
  useEffect(() => () => clearAllTimers(), []);

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
              key={`reel-${i}`}
              active={reelActive[i]}
              shouldStop={reelShouldStop[i]}
              finalIndex={finals[i]}
              initOffset={i * 10}
              onStopped={handleReelStopped}
            />
          ))}
        </div>

        <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, #c8860a, transparent)", opacity: 0.6 }} />

        {/* Result */}
        <div style={{ minHeight: "28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {result ? (
            <div style={{
              fontSize: "clamp(14px, 4vw, 18px)",
              fontWeight: "700",
              color: result.color,
              textShadow: `0 0 12px ${result.color}88`,
              letterSpacing: "0.08em",
            }}>
              {result.msg}
            </div>
          ) : phase === "idle" ? (
            <div style={{ fontSize: "clamp(11px, 3vw, 13px)", color: "#8a6030", opacity: 0.7, letterSpacing: "0.1em" }}>
              按下 SPIN 開始
            </div>
          ) : null}
        </div>

        {/* Spin count */}
        {spinCount > 0 && (
          <div style={{
            position: "absolute",
            top: "16px",
            right: "28px",
            background: "#ffd700",
            color: "#1a0500",
            fontSize: "11px",
            fontWeight: "800",
            borderRadius: "4px",
            padding: "2px 6px",
            letterSpacing: "0.05em",
          }}>
            {spinCount}
          </div>
        )}

        {/* SPIN button */}
        <button
          onClick={handleSpin}
          disabled={phase === "spinning"}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "clamp(14px, 4vw, 17px)",
            fontWeight: "800",
            letterSpacing: "0.25em",
            color: phase === "spinning" ? "#8a6030" : "#fff8ee",
            background: phase === "spinning"
              ? "linear-gradient(180deg, #3a1500 0%, #2a0a00 100%)"
              : "linear-gradient(180deg, #e03000 0%, #a02000 100%)",
            border: `2px solid ${phase === "spinning" ? "#5a3010" : "#ff6030"}`,
            borderRadius: "12px",
            cursor: phase === "spinning" ? "not-allowed" : "pointer",
            boxShadow: phase === "spinning" ? "none" : "0 4px 20px rgba(200,50,0,0.5), inset 0 1px 0 rgba(255,150,100,0.3)",
            transition: "all 0.2s",
            outline: "none",
          }}
        >
          {phase === "spinning" ? "轉動中…" : "SPIN"}
        </button>
      </div>
    </div>
  );
}
