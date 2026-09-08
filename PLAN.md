# MyPaths 生命數據庫 — 產品分級與 Credits 計費規劃（PLAN）

> 狀態：**草案（v0.1）** — 尚未實作，供產品定價與技術遷移討論。
> 現行版本：v2.6.2（2026-09-06）。本文假想目標版本：v2.7.0（credits 化）。

---

## 1. 現況與動機

### 1.1 現行等級（`server/levels.js`）

| 等級 | 每日次數 | 每分鐘 | 收費 | 說明 |
|---|---|---|---|---|
| `free` | 30 | 5 | 無 | 匿名訪客 |
| `plus` | 100 | 10 | 無（WhatsApp 申請 API Key） | — |
| `premium` | 300 | 30 | 無 | — |
| `admin` | 5000 | 300 | 無 | 站長／測試用 |

### 1.2 現行問題

1. 只有「每日次數」，沒有「月額度／credits」——無法做訂閱制定價。
2. 所有動作成本相同：AI 深度解讀與基礎排盤都扣 1 次，成本結構失真。
3. 功能閘門零散：目前僅兩處做等級檢查
   - 社交名片（`src/components/CongSocialSection.jsx`）：`CARD_PREMIUM_LEVELS = {plus, premium, admin}`
   - 資料備份／匯入（`src/components/tabs/ProfileTab.jsx`）：`BACKUP_LEVELS = {plus, premium, admin}`
4. 無價格、無金流、無用量帳本（credit ledger）。

---

## 2. 等級定位（Value Proposition）

| | Free | Plus | Premium | Admin |
|---|---|---|---|---|
| **定位** | 完整體驗核心算命 | 個人深度使用 | 高用量／命理從業者 | 站長內部（不販售） |
| **一句話** | 免費試用全部排盤 | 解鎖產出型功能 | 把 app 當工作工具 | 測試／客服／稽核 |
| **主打賣點** | 八字起手式 | 社交名片＋備份＋AI | AI 無限感＋PDF＋500 盤 | — |

**產品原則**

- 免費 = 核心排盤**全功能試用**（限制「量」與「產出型功能」，不閹割算法）。
- 付費 = 解鎖「產出型功能」（名片／備份／AI／PDF）＋更高額度。
- Admin 不販售；企業需求另以 Team 子帳號（選配）提供。

---

## 3. 功能分級表（Feature Matrix）

| 功能 | 目前 API／元件 | free | plus | premium | admin |
|---|---|---|---|---|---|
| 八字（四柱/十神/神煞/大運） | `/api/bazi`、BaziTab（client） | ✅ | ✅ | ✅ | ✅ |
| 五行／身強弱／從格 | `/api/wuxing`、WuXingTab | ✅ | ✅ | ✅ | ✅ |
| 格局／今日運勢 | `/api/chart`、GuirenTab | ✅ | ✅ | ✅ | ✅ |
| 命理方案（年度報告） | FangAnTab（client） | ✅ | ✅ | ✅ | ✅ |
| 飛星排盤 | FeiXingTab（client） | ✅ | ✅ | ✅ | ✅ |
| V數 | VChartDataTab（client） | ✅ | ✅ | ✅ | ✅ |
| 易占 | `/api/yizhan` | ✅ | ✅ | ✅ | ✅ |
| 擇日（黃曆） | `/api/zeri` | ✅ | ✅ | ✅ | ✅ |
| 合婚／合盤（雙人） | GuirenTab「今日運勢」 | 🔒 | ✅ 付費動作 | ✅ | ✅ |
| AI 深度解讀 | `/api/ai-context`、AiTab | 🔒（或每日 3 次試用） | ✅ 付費動作 | ✅ 高額度 | ✅ |
| 社交名片（從格 PNG／列印） | CongSocialSection | 🔒 | ✅ | ✅ | ✅ |
| 資料備份／匯入 | ProfileTab（userStore） | 🔒 | ✅ | ✅ | ✅ |
| 個人頁用量儀表板 | ProfileTab（`/api/account`） | ✅（簡） | ✅ | ✅ | ✅ |
| 多命盤歷史保存 | App「資料列表」 | ≤ 5 盤 | ≤ 50 盤 | ≤ 500 盤 | 不限 |
| PDF／高清報告匯出 | （未來） | 🔒 | 🔒 或按次 | ✅ | ✅ |
| 月曆運勢圖（流月視覺化） | （未來） | 🔒 | ✅ | ✅ | ✅ |
| 建 API Key／子帳號管理 | AdminTab／Team | 🔒 | 🔒 | 🔒 | ✅ |
| 優先支援 | — | — | 一般 | 優先 | — |

> 備註：admin 含上述全部能力（供站長測試各等級路徑），但**不作為販售等級**。

---

## 4. Credits 計費矩陣（Billing Matrix）

### 4.1 單位定義

- **1 credit ≈ 一次基礎排盤運算**（八字／五行／格局／運勢／飛星／V數／易占／擇日）。
- 扣點以「動作」為單位（每個 endpoint 宣告 `cost`），**非以頁面**。
- 不重複扣：同一「開始分析」session 內切換 tab 不重複計費（沿用現行 `x-analysis-id` 機制）。

### 4.2 動作成本表

| 動作 | Endpoint／元件 | 成本 (credits) | 說明 |
|---|---|---|---|
| 基礎排盤（任一核心 tab） | `/api/bazi` `/api/wuxing` `/api/chart` `/api/yizhan` `/api/zeri` + client 引擎 | **1** | 含流月／流年欄（預設） |
| 流年／流月批量查詢（> 12 欄） | GuirenTab「流月」 | **2** | 每批 12 個月 |
| 合婚／合盤（雙人運算） | GuirenTab「今日運勢→合婚/合盤」 | **3** | 雙盤＋比較 |
| AI 深度解讀 | `/api/ai-context` | **5** | LLM 成本最高 |
| 社交名片 PNG 生成／分享 | CongSocialSection | **2** | canvas 渲染 |
| PDF 報告匯出 | （未來） | **5** | |
| 資料備份／匯入 | ProfileTab | **0** | 低耗、鼓勵留存，不懲罰 |
| 個人頁／帳戶查詢 | `/api/account` `/api/rate-limit*` | **0** | 永不計費 |

### 4.3 月額度方案與價格

| 方案 | 建議價格 | credits／月 | 分鐘安全帽 | 定位 |
|---|---|---|---|---|
| **Free** | $0 | **300**（≈ 每日 10 次） | 5／分 | 嘗鮮 |
| **Plus** | **US$4.99／月** | **3,000** | 10／分 | 個人深度（名片＋備份＋AI 少量） |
| **Premium** | **US$12.99／月** | **12,000** | 30／分 | 從業者（AI＋PDF＋500 盤） |
| **加購包**（選配） | US$5／包 | +3,000（不遞延） | — | 爆量應急 |
| **Team**（選配） | US$29.99／月 | 30,000（子 key 共享） | 60／分 | 工作室 |

**用量直覺**

- Plus 3,000／月 ≈ 每天 ~100 次基礎排盤 **或** ~8 次 AI、~16 次合盤——對個人極充裕。
- Premium 12,000／月 ≈ 每天 ~400 次基礎排盤——足以支撐對外服務。
- Free 300／月 保留「每日 10 次」的慣性感，低於現行 30／日但改為月結更寬鬆（30 天內可自行調配）。

**幣別**：建議以 USD 為基準（Stripe/Paddle 皆以 USD 計價），地區定價（RM/TWD）由金流端打折或匯率換算。

### 4.4 用罄與防濫用規則

1. **月額度用罄**：不鎖功能、不自動扣款——退回「Free 池」（永遠保留 300/月），或引導加購。
2. **分鐘安全帽保留**：即使 Premium 仍限 30／分（防機器人），admin 300／分。
3. **重置**：每月 1 日 UTC+8 重置，不遞延；首購當月按日比例配發。
4. **計費動作與安全帽雙重檢查**：先檢查 credits 足額，再檢查分鐘帽，任一不足即 402/429。
5. **同一 session 去重**：沿用 `x-analysis-id`，10 分鐘內同 session 多 tab 只扣一次。

---

## 5. 技術遷移計畫（v2.7.0）

### 5.1 資料模型

```
server/levels.js
  LEVELS = {
    free:    { monthlyCredits: 300,  minuteCap: 5,  features: {...} },
    plus:    { monthlyCredits: 3000, minuteCap: 10, features: {...} },
    premium: { monthlyCredits: 12000,minuteCap: 30, features: {...} },
    admin:   { monthlyCredits: 99999,minuteCap: 300,features: {...} },
  }

RateLimiterDO（SQLite）雙層桶：
  minute_bucket : { key, level, ts, count }          // 現行改版
  month_bucket  : { key, level, ym, creditsUsed }    // 新增（ym = YYYY-MM）
```

### 5.2 伺服端改動

| 檔案 | 改動 |
|---|---|
| `server/levels.js` | 欄位改 `monthlyCredits`／`minuteCap`／`features` |
| `server/app.js` | endpoint 宣告 `cost`；`buildChart` 回傳 `yongShen`（從格覆寫）等不變；消費改扣月 credits |
| `server/worker.js` | RateLimiterDO 增加 `month_bucket` 與 `consumeCredits(op, amount)` |
| `server/advancedRateLimiter.js` | 日桶 → 月桶＋分鐘帽 |
| `/api/account` | 回傳 `creditsLeft / creditsTotal / resetAt / features` |
| 新 endpoint | `/api/credits`（剩餘查詢）、`/api/credits/purchase`（兌換碼或金流 webhook） |

### 5.3 前端改動

| 檔案 | 改動 |
|---|---|
| `src/levels-client.js`（新） | 單一 `FEATURES`／`CREDIT_COST` 常數表（取代零散 `BACKUP_LEVELS`、`CARD_PREMIUM_LEVELS`） |
| ProfileTab | 用量卡改「本月 credits 進度條」＋剩餘日數 |
| CongSocialSection／ProfileTab 備份 | 改讀 `features`（保留現行為 backstop） |
| API 層（`src/api.js`） | 402（額度不足）／429 錯誤提示專屬文案 |

### 5.4 金流選項（二擇一）

- **A. 月卡兌換碼（零金流，先做）**：admin 產生 12 碼月卡（含方案＋月份），WhatsApp 交付；兌換時寫入 key 等級與 `month_bucket`。完全沿用現行 WhatsApp 流程，無第三方依賴。
- **B. Stripe/Paddle 訂閱**：需帳號＋webhook；正式上線用。

**建議路徑**：A 先行驗證需求 → B 之後接上。

---

## 6. 驗收標準

1. `node tests/*.test.mjs` 全綠（既有 6 套＋新增 credits 測試：月重置、比例配發、session 去重、402/429 分流）。
2. free 使用者看不到名片／備份；plus 可見（沿用現閘門）——行為不回歸。
3. `/api/account` 回傳新欄位；個人頁顯示 credits 餘額。
4. 兌換碼流程：admin 產生 → 使用者兌換 → 等級與月額度即時生效。
5. 既有四套測試基準不變（levels 表單元測試改寫後通過）。

---

## 7. 待決事項（Open Questions）

- [ ] 價格帶是否採用（$4.99 / $12.99 / Team $29.99）？幣別以 USD 或本地幣？
- [ ] Free 的 AI 是否給「每日 3 次試用」？
- [ ] credits 是否允許「跨月累積」（建議否）？
- [ ] 合婚／合盤與社交名片計費是否先免費衝量、後收費（行銷順序）？
- [ ] 是否需 Team／子帳號（企業）？

---

*本文檔僅為規劃草案；實際 code change 時依 CHANGELOG 規範同步記錄並升版。*
