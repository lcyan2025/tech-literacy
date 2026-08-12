# Notion to Supabase migration mapping

本文件定義一次性匯入工具的資料對照規則。正式切換前，必須以匯入報告核對筆數、關聯、排序與圖片。

## 資料表對照

| Notion 資料庫／類型 | Supabase 資料表 | 對照方式 |
| --- | --- | --- |
| Route | `site_pages` | `Route` → `route_path`；`PageName` → `page_name` |
| Article、Announcement、IntroCard、MeetTheTeam、MindMap、QuickLinkCard、Timeline | `content_sections` | 每個 Route 關聯項目建立一筆 section；保留 `section_type` |
| ArticleItem 及其他 `*Item` | `content_items` | 根項目 `parent_id = null`；Sub-item 使用父項目 ID |
| Course | `courses` | 保留課程原欄位；`Highlights` 先以 JSON 陣列保存 |
| Expertise | `expertise_records` | `Number／ID` → `legacy_id`；保留排序 |
| Activity | `activities` | `isVisible` → `is_published`；`Type` → `activity_type` |
| Comment | `comments` | 前台送出的內容一律先建立為 `pending` |
| Notion Files | `media_assets` 與 Supabase Storage | 圖片下載後改用固定 Storage 路徑，避免 Notion 暫時網址過期 |

## 關聯與排序

1. 先建立所有 `site_pages`，以原始 Notion page ID 寫入 `legacy_id`。
2. 依 Route 的 relation 建立 `content_sections`，以 section 類型與原始 page ID 保留可追溯性。
3. 各 section 的 Items 建立為 `content_items`；無父項目的資料列 `parent_id = null`，Sub-item 指向父項目。
4. 使用 Notion relation 的原始順序作為 `sort_order`；若 relation 未提供穩定排序，退回使用 `ID`。
5. 內容欄位以純文字或受控 HTML 保存；匯入工具不得直接信任外部 HTML。

## 圖片與檔案

- 下載每個 Notion file，記錄原始 URL、檔名與下載結果。
- 上傳至 `site-media` bucket，路徑應包含內容類型、資料列 ID 與原始副檔名。
- 將永久公開 URL 寫入對應的 `*_image_url` 或 `image_url`，並同步建立 `media_assets`。
- 下載失敗時保留失敗清單，不得以暫時網址當成已完成。

## 匯入驗證

- Route、Course、Expertise、Activity、Comment 各資料表筆數與原始 Notion 查詢結果一致。
- 每一筆 Route relation 都能找到對應 section；每一筆 Sub-item 都能找到父項目。
- 每張圖片都能以 Storage URL 取得；失敗項目列入報告。
- 舊站 `https://tech-literacy.vercel.app/` 在切換前保持可用；新站先以獨立網址驗證。
