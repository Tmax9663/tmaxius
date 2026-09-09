# FreePaths / MyPaths 定價決策（PLAN_PRICING）

> 狀態：**已定案（2026-09-06）**
> 決策：馬幣 RM 計價・**一次性買斷**為主・Basic 先「信任制不加鎖」，Advanced 沿用 mypaths 現有 **API Key 分級**（plus/premium）。

## 1. 產品定位

| 產品 | 內容 | 授權對象 |
|---|---|---|
| **Basic**（FreePaths：八字/五行/格局/運勢四頁，Android APK 離線＋Web） | 完整四頁、姓名 5 筆 | 學生（課堂） |
| **Advanced**（mypaths plus/premium：合婚合盤・社交名片・AI・備份匯入・高額度） | 全功能 Web（API Key 分級） | 學生／進階使用者 |

## 2. 定價表（RM，一次性買斷）

| SKU | 內容 | 價格 | 備註 |
|---|---|---|---|
| Basic 學生版 | 四頁完整（APK＋Web 授權使用） | **RM 39／人** | 團購 10+ 人 → RM 29／人 |
| Advanced 學生版 | Basic 內容＋合婚/社交名片/AI/備份 | **RM 99／人** | 以 mypaths plus 或 premium Key 交付 |
| 教師／班級授權 | 全班（≤40 人）使用 Basic 或 Advanced | **Basic RM 499／班／年**；**Advanced RM 1,199／班／年** | 含一年內版本更新 |
| 講師商用授權 | 自行開課發放、不限學生數 | RM 2,499（一次性，或相談） | 含改名/加 logo（另行開發） |

> 換算參考：RM39≈US$8.7≈NT$280；RM99≈US$22≈NT$710。
> **低標（勿再低）**：Basic RM39、Advanced RM99；低於此不足以回饋開發時數。

## 3. 免費公開版策略（避免自相矛盾）

- 公開網址 freepaths.tmaxius.workers.dev 改為 **閹割 Demo**：僅「八字」頁完整示範，其餘分頁鎖（或每日限次）。
- 付費 Basic = 完整 APK／完整 Web（課堂授權碼名單內）。
- （如暫不鎖，最遲在開始對外收費前完成此調整。）

## 4. 交付與收款流程（零金流，沿用 WhatsApp）

1. 老師／學生以 WhatsApp／銀行轉帳付款（+60 6019-3639-663）。
2. **Basic**：記入課堂名單（信任制）→ 提供 APK 檔或 freepaths 網址＋課堂代號。
3. **Advanced**：於 mypaths「個人 → 控制台」建立 **plus 或 premium API Key** → WhatsApp 交付給學生，學生貼到個人頁啟用。
4. 教師／班級授權：依付款建立班級名單（每班上限 40），同班共用 Basic 或 Advanced 名額。

## 5. 收入情境（一班 15 人）

| 情境 | 收入 |
|---|---|
| 15 人 × Basic RM39 | RM 585 |
| 15 人 × Advanced RM99 | RM 1,485 |
| 教師 Basic RM499/年 ＋ 10 人買 Advanced | RM 499 + 990 |
| 兩班 Advanced 教師授權 | 2 × RM 1,199 |

## 6. 條款速記（對外說帖）

- 一次性買斷＝當版本（含一年內更新）；之後大版本升級另計（建議 RM 10–30 小額）。
- 學生版限本人使用；全班共用請購「班級授權」。
- 離線可用（QuickJS 引擎打包於 APK）；Advanced 需連網（Web/Key）。
- 收費後仍維持「僅供娛樂參考」聲明，避免責任。

## 7. 後續可能開發（依需求）

- Basic 啟動碼／班級名單登錄（若信任制被濫用再上）。
- Web Demo 閹割（見 §3）。
- Advanced 收費自動化（金流＋自動發 Key）——目前人手發放已可營運。