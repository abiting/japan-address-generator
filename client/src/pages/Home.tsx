import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateRandomAddress, type Address } from "@/lib/address-data";
import { Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Home() {
  const [address, setAddress] = useState<Address>(generateRandomAddress());
  const [isAnimating, setIsAnimating] = useState(false);

  const handleGenerate = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setAddress(generateRandomAddress());
      setIsAnimating(false);
    }, 300); // Short delay for animation effect
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`已複製${label}`);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements - Removed as per user request */}

      <main className="w-full max-w-2xl z-10 relative">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-widest text-primary">
            Virtual Japan Address Generator
          </h1>
        </div>

        <Card className="border-2 border-primary/10 shadow-xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 pb-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-serif tracking-wider flex items-center gap-2">
                <span className="w-2 h-8 bg-primary rounded-sm inline-block"></span>
                生成結果
              </CardTitle>
              <Button 
                onClick={handleGenerate} 
                variant="outline" 
                size="icon"
                className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                <RefreshCw className={`h-5 w-5 ${isAnimating ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-8 space-y-8">
            {/* Postal Code Section */}
            <div className={`transition-all duration-500 ${isAnimating ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}>
              <div className="group relative bg-secondary/10 p-6 rounded-lg border border-secondary/20 hover:border-secondary/50 transition-colors">
                <p className="text-xs text-muted-foreground mb-2 font-sans uppercase tracking-widest">Postal Code</p>
                <div className="flex justify-between items-end">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-serif text-secondary-foreground">〒</span>
                    <span className="text-4xl font-mono font-bold tracking-wider text-primary">
                      {address.postalCode}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(address.postalCode, "郵遞區號")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    複製
                  </Button>
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className={`transition-all duration-500 delay-75 ${isAnimating ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}>
              <div className="group relative bg-background p-6 rounded-lg border border-border hover:border-primary/30 transition-colors shadow-sm">
                <p className="text-xs text-muted-foreground mb-2 font-sans uppercase tracking-widest">Full Address</p>
                <div className="flex justify-between items-start gap-4">
                  <p className="text-2xl font-serif leading-relaxed text-foreground">
                    {address.fullAddress}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => copyToClipboard(address.fullAddress, "完整地址")}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    複製
                  </Button>
                </div>
              </div>
            </div>

            {/* Breakdown Section */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 delay-150 ${isAnimating ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`}>
              <AddressComponent 
                label="都道府県（Prefecture）" 
                value={address.prefecture} 
                onCopy={() => copyToClipboard(address.prefecture, "都道府県")}
              />
              <AddressComponent 
                label="市区町村（City/Ward）" 
                value={address.city} 
                onCopy={() => copyToClipboard(address.city, "市区町村")}
              />
              <AddressComponent 
                label="町名（Town）" 
                value={address.town} 
                onCopy={() => copyToClipboard(address.town, "町名")}
              />
              <AddressComponent 
                label="番地（Block/Number）" 
                value={address.block} 
                onCopy={() => copyToClipboard(address.block, "番地")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center space-y-2">
          <Button 
            onClick={handleGenerate} 
            size="lg" 
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-12 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-serif tracking-widest"
          >
            重新生成
          </Button>
          <div className="mt-8 space-y-2">
            <p className="text-xs text-muted-foreground">
              請注意，本工具僅供示例與測試用途，請勿用於非法行為。
            </p>
            <p className="text-xs text-muted-foreground pt-2">
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
        </div>
      </main>
    </div>
  );
}

function AddressComponent({ label, value, onCopy }: { label: string, value: string, onCopy: () => void }) {
  return (
    <div className="group bg-muted/30 p-4 rounded border border-transparent hover:border-border transition-colors flex justify-between items-center">
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        <p className="font-medium text-lg">{value}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onCopy}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}
