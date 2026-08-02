import { useCallback, useEffect, useRef, useState } from "react";
import * as OpenCC from "opencc-js";

type Mode = "t2s" | "s2t";

const MODES: { value: Mode; label: string; from: string; to: string }[] = [
  { value: "t2s", label: "繁體 → 簡體", from: "tw", to: "cn" },
  { value: "s2t", label: "簡體 → 繁體", from: "cn", to: "tw" },
];

export default function ChineseConverter() {
  const [mode, setMode]       = useState<Mode>("t2s");
  const [input, setInput]     = useState("");
  const [output, setOutput]   = useState("");
  const [copied, setCopied]   = useState(false);
  const converterRef = useRef<((s: string) => string) | null>(null);

  // 初始化 converter
  useEffect(() => {
    const m = MODES.find(m => m.value === mode)!;
    converterRef.current = OpenCC.Converter({ from: m.from as any, to: m.to as any });
    if (input) setOutput(converterRef.current(input));
  }, [mode]);

  const handleInput = useCallback((val: string) => {
    setInput(val);
    setCopied(false);
    if (!val) { setOutput(""); return; }
    if (converterRef.current) setOutput(converterRef.current(val));
  }, []);

  const handleSwap = () => {
    const next: Mode = mode === "t2s" ? "s2t" : "t2s";
    setMode(next);
    // 把輸出貼回輸入
    if (output) {
      setInput(output);
      setOutput("");
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setCopied(false);
  };

  const currentMode = MODES.find(m => m.value === mode)!;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "40px 16px 60px",
      fontFamily: "'Noto Sans TC', 'Noto Sans SC', sans-serif",
      boxSizing: "border-box",
    }}>
      {/* 標題 */}
      <div style={{ textAlign: "center", marginBottom: "36px" }}>
        <h1 style={{
          fontSize: "clamp(22px, 5vw, 36px)",
          fontWeight: 800,
          color: "#e2e8f0",
          margin: 0,
          letterSpacing: "0.05em",
        }}>繁簡中文轉換工具</h1>
        <p style={{
          fontSize: "14px",
          color: "#94a3b8",
          marginTop: "10px",
          letterSpacing: "0.05em",
        }}>繁簡轉換 🔁 简繁转换</p>
      </div>

      {/* 模式切換 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "28px",
        background: "rgba(255,255,255,0.06)",
        borderRadius: "50px",
        padding: "6px",
        border: "1px solid rgba(255,255,255,0.1)",
      }}>
        {MODES.map(m => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            style={{
              padding: "8px 20px",
              borderRadius: "50px",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s",
              background: mode === m.value
                ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                : "transparent",
              color: mode === m.value ? "#fff" : "#94a3b8",
              boxShadow: mode === m.value ? "0 2px 12px rgba(99,102,241,0.4)" : "none",
            }}
          >{m.label}</button>
        ))}
      </div>

      {/* 轉換區 */}
      <div style={{
        width: "100%",
        maxWidth: "860px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}>
        {/* 輸入框 */}
        <div style={{ position: "relative" }}>
          <textarea
            value={input}
            onChange={e => handleInput(e.target.value)}
            placeholder={mode === "t2s" ? "請輸入繁體中文…" : "请输入简体中文…"}
            rows={7}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.05)",
              color: "#e2e8f0",
              fontSize: "16px",
              lineHeight: 1.7,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
              fontFamily: "inherit",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(99,102,241,0.6)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; }}
          />
          <div style={{
            position: "absolute",
            bottom: "12px",
            right: "14px",
            fontSize: "12px",
            color: "#475569",
          }}>{input.length} 字</div>
        </div>

        {/* 操作按鈕列 */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}>
          {/* 清除按鈕 */}
          <button
            onClick={handleClear}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.07)",
              color: "#cbd5e1",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.13)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; }}
          >清除</button>
        </div>

        {/* 輸出框 */}
        <div>
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            marginBottom: "8px",
          }}>
            <button
              onClick={handleCopy}
              disabled={!output}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(99,102,241,0.4)",
                background: copied
                  ? "rgba(34,197,94,0.15)"
                  : "rgba(99,102,241,0.15)",
                color: copied ? "#4ade80" : "#818cf8",
                fontSize: "13px",
                cursor: output ? "pointer" : "not-allowed",
                opacity: output ? 1 : 0.4,
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
            >
              {copied ? "✓ 已複製" : "複製"}
            </button>
          </div>
          <div style={{
            width: "100%",
            minHeight: "160px",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(0,0,0,0.25)",
            color: output ? "#e2e8f0" : "#475569",
            fontSize: "16px",
            lineHeight: 1.7,
            boxSizing: "border-box",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            userSelect: "text",
          }}>
            {output || (input ? "轉換中…" : "轉換結果將顯示於此")}
          </div>
          {output && (
            <div style={{
              textAlign: "right",
              fontSize: "12px",
              color: "#475569",
              marginTop: "6px",
            }}>{output.length} 字</div>
          )}
        </div>

        {/* 說明 */}
        <div style={{
          marginTop: "8px",
          padding: "14px 18px",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          fontSize: "13px",
          color: "#64748b",
          lineHeight: 1.7,
        }}>
          使用 <strong style={{ color: "#818cf8" }}>OpenCC</strong> 開放中文轉換引擎，在瀏覽器本地執行，不需要網路連線，輸入內容不會上傳至任何伺服器。
        </div>
      </div>
    </div>
  );
}
