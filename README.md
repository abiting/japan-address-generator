# Virtual Japan Address Generator (虛擬日本地址產生器)

這是一個基於 React 19 與 Tailwind CSS 4 構建的靜態網頁應用程式，旨在生成格式正確但內容虛擬的日本地址。本工具特別為嵌入至部落格（如 abiting.cc）的 iframe 進行了優化，並採用了日式極簡禪風（Japanese Minimalist Zen）的設計風格。

## 🌟 核心功能

*   **真實與虛擬結合**：提供真實的郵遞區號（POSTAL CODE）、都道府縣、市區町村及町名資料，但番地（包含丁目、番、號）則為隨機生成的虛擬資訊。
*   **格式精準**：確保生成的地址符合日本標準格式，例如在數字與漢字之間加入適當的空格（如「9 丁目 25 番 20 号」），並使用全形括號。
*   **一鍵複製**：提供便捷的複製按鈕，讓使用者能輕鬆複製生成的完整地址與郵遞區號。
*   **Iframe 嵌入優化**：版面設計考量了小尺寸視窗的顯示效果，確保內容在 iframe 中不會被切斷，並支援垂直捲動。

## 🎨 設計風格 (Japanese Minimalist Zen)

*   **字體**：全站統一使用 **Zen Maru Gothic**（源泉圓體風格），並以 **Noto Sans TC** 作為繁體中文的備用字體，確保文字呈現溫潤且一致的視覺感受。
*   **色彩計畫**：
    *   主色調：藍染（Indigo Dye）
    *   次色調：抹茶綠（Matcha Green）
    *   背景色：和紙（Washi Paper）的米白色調
    *   文字色：墨色（Sumi Ink）
*   **背景紋理**：使用高解析度的乾淨和紙紋理圖片作為背景，並透過雲端 CDN 載入以優化效能。

## 🛠️ 技術堆疊

*   **前端框架**：React 19
*   **樣式工具**：Tailwind CSS 4
*   **建置工具**：Vite
*   **圖示庫**：Lucide React

## 📂 專案結構

```text
client/
├── public/          # 靜態資源
├── src/
│   ├── components/  # 可共用的 UI 元件 (包含 shadcn/ui)
│   ├── lib/         # 工具函式 (如地址生成邏輯)
│   ├── pages/       # 頁面元件 (如 Home.tsx)
│   ├── App.tsx      # 應用程式進入點與路由
│   ├── index.css    # 全域樣式與 Tailwind 設定
│   └── main.tsx     # React 渲染進入點
└── index.html       # HTML 模板
```

## 🚀 開發與部署

### 本地開發

1.  安裝依賴套件：
    ```bash
    pnpm install
    ```
2.  啟動開發伺服器：
    ```bash
    pnpm run dev
    ```

### 效能優化紀錄

*   **字體優化**：移除了未使用的字體（如 Noto Serif TC）與字重（如 300），僅保留必要的 400、500、700 字重，並使用 `display=swap` 策略，顯著提升了 iframe 的初始載入速度。
*   **圖片優化**：將大型背景圖片移至雲端儲存，減少了本地打包體積與載入時間。

## ⚠️ 免責聲明

本工具生成的地址僅供示例與測試用途，請勿用於任何非法行為。

## 📄 授權與版權

Copyright © [阿比丁的第二個家](https://abiting.cc)
