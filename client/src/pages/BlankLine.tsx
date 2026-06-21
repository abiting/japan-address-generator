/**
 * Blank Line Emoji Tool — 空行 Emoji 複製工具
 * Design: Japanese Minimalist Zen (same as Home.tsx)
 * Font: Zen Maru Gothic + Noto Sans TC
 * Color: Aizome (Indigo) primary, Washi Paper background
 *
 * Purpose: Let users copy invisible "blank line" characters (U+E0020 Tag Space,
 * U+200B Zero Width Space, U+3000 Ideographic Space, etc.) to create visual
 * paragraph breaks in social platforms that strip normal blank lines.
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ── Character definitions ──────────────────────────────────────────────────
interface BlankChar {
  id: string;
  name: string;
  nameEn: string;
  unicode: string;
  char: string;
  description: string;
  tip: string;
}

const BLANK_CHARS: BlankChar[] = [
  {
    id: "tag-space",
    name: "標簽空格",
    nameEn: "Tag Space",
    unicode: "U+E0020",
    // actual Tag Space character
    char: "\u{E0020}",
    description: "最常用的空格符號，在 Instagram、Facebook、Twitter 等平台均可製造空行效果",
    tip: "貼上後，該行看起來完全空白，但實際上含有不可見符號，可讓平台保留段落間距。",
  },
  {
    id: "ideographic-space",
    name: "全形空格",
    nameEn: "Ideographic Space",
    unicode: "U+3000",
    char: "\u3000",
    description: "日文全形空格，寬度等同一個漢字，在許多東亞語系平台上可作為空行使用",
    tip: "視覺上佔有一個符號的寬度，若平台不接受不可見符號，可嘗試此選項。",
  },
  {
    id: "hair-space",
    name: "髮絲空格",
    nameEn: "Hair Space",
    unicode: "U+200A",
    char: "\u200A",
    description: "極細的空格符號，比標籤空格、全形空格更窄，多用於排版微調",
    tip: "寬度極小，視覺上幾乎不可見，適合需要「最乾淨」空行效果的場合。",
  },
  {
    id: "zwsp",
    name: "零寬空格",
    nameEn: "Zero-Width Space",
    unicode: "U+200B",
    char: "\u200B",
    description: "零寬度的不可見符號，適合在嚴格禁止空行的平台插入隱形分隔",
    tip: "部分平台會過濾此符號，若無效可改用「標簽空格」。",
  },
];

export default function BlankLine() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyChar = (char: BlankChar) => {
    navigator.clipboard.writeText(char.char).then(() => {
      setCopiedId(char.id);
      toast.success(`已複製「${char.name}」`);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <main className="w-full max-w-2xl z-10 relative">

        {/* ── Header ── */}
        <div className="text-center mb-10 space-y-3">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-widest text-primary">
            Blank Line Emoji Generator
          </h1>
          <p className="text-muted-foreground font-sans tracking-wide text-sm max-w-xl mx-auto leading-relaxed font-bold">
            複製不可見的空格（空白）符號，在 Facebook、Instagram 等不支援空行的社群平台製造段落分隔效果
          </p>
        </div>

        {/* ── Character Cards ── */}
        <div className="space-y-4 mb-8">
          {BLANK_CHARS.map((item, index) => (
            <Card
              key={item.id}
              className={`border-2 transition-all duration-200 shadow-md bg-card/80 backdrop-blur-sm ${
                index === 0
                  ? "border-[#9b72cf] shadow-[0_0_0_1px_#c9a8f0,0_4px_24px_rgba(155,114,207,0.25)] hover:shadow-[0_0_0_1px_#d4b8f8,0_6px_32px_rgba(155,114,207,0.35)]"
                  : "border-primary/10 hover:border-primary/30"
              }`}
              style={index === 0 ? {
                borderImage: "linear-gradient(135deg, #c9a8f0, #7c4dbd, #e0c8ff, #9b72cf) 1",
                borderImageSlice: 1,
              } : undefined}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-serif font-bold text-lg text-primary">
                        {item.name}
                      </span>
                      {index === 0 && (
                        <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full" style={{ background: "linear-gradient(135deg, #c9a8f0, #7c4dbd)", color: "#fff", letterSpacing: "0.08em" }}>
                          最常用
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-sans tracking-widest uppercase">
                        {item.nameEn}
                      </span>
                      <span className="text-xs bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded font-mono">
                        {item.unicode}
                      </span>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  <Button
                    variant={copiedId === item.id ? "default" : "outline"}
                    size="sm"
                    className="shrink-0 font-sans tracking-wide transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyChar(item);
                    }}
                  >
                    {copiedId === item.id ? (
                      <><Check className="h-3.5 w-3.5 mr-1.5" />已複製</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5 mr-1.5" />複製</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="text-center space-y-2 pb-4">
          <p className="text-xs text-muted-foreground pt-1">
            Copyright © <a
              href="https://abiting.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors underline decoration-dotted underline-offset-4"
            >
              阿比丁的第二個家
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
