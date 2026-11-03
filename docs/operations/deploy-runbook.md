# デプロイ・運用手順書

- 作成日：2026-11-03
- 対象：`web/`（Next.js 16.4.4）を Vercel で公開する場合

## 1. Vercel プロジェクトの設定（必須）
| 項目 | 値 | 備考 |
|---|---|---|
| Git リポジトリ | `keyakizakap-alt/Beaty-ai-shelf` | main への push で本番、PR ごとにプレビューが作られる |
| **Root Directory** | **`web`** | 未設定だと `NEXT_NO_VERSION`（Next.js が見つからない）で失敗する。2026-11-02 の初回デプロイはこれが原因 |
| Framework | Next.js | 自動検出 |
| Node.js | 22.x | `web/package.json` の `engines` でも固定（プロジェクト設定より優先される） |
| 関数の地域 | 東京（hnd1） | `web/vercel.json` で指定 |
| 関数の最大実行時間 | 診断APIは120秒 | 無料プラン（Hobby）の上限は300秒（Vercel 公式ドキュメント、2026-11-03 確認） |

## 2. 環境変数
| 名前 | 必須 | 用途 |
|---|---|---|
| `OPENAI_API_KEY` / `GEMINI_API_KEY` | 任意 | 無料診断で使うAI。どちらも無ければ診断は「準備中」と表示される |
| `OPENAI_MODEL` / `GEMINI_MODEL` | 任意 | モデル名の変更 |
| `DIAGNOSIS_QUESTIONS` / `DIAGNOSIS_PER_IP_LIMIT` / `DIAGNOSIS_DAILY_LIMIT` | 任意 | 診断の質問数と回数の上限（既定 6 / 3 / 50） |
| `SITE_URL` | 任意 | 独自ドメインを使う場合のみ。sitemap・robots・共有用URLに使う。未設定なら Vercel の本番URL |
| `SECURITY_CONTACT` | 任意 | 脆弱性報告の窓口（`mailto:` または `https:`） |
| `LOG_SALT` | 推奨 | ログに残すIPハッシュの推測を難しくする |

APIキーはチャットやリポジトリに書かず、Vercel の画面（Settings → Environment Variables、Production のみ）で登録する。

## 3. リリース前の確認
1. GitHub の CI（lint・型・テスト・ビルド・依存監査）と CodeQL が成功している
2. プレビューURLで、トップ・無料診断・記録ツール・表現チェックを開いて確認する
3. 本番に出たら、セキュリティヘッダーを確認する：`curl -sI https://<本番URL>/ | grep -i -E "content-security|strict-transport"`

## 4. 公開範囲（Deployment Protection）
新規プロジェクトは「Vercel Authentication」が有効で、プレビューURLは Vercel にログインしたチームメンバーしか見られない。本番のURLを一般公開するかどうかは、Settings → Deployment Protection で確認する。

## 5. ロールバック
Vercel の Deployments 画面で、直前の正常なデプロイを選び「Promote to Production」（または Instant Rollback）を行う。コードの修正は main に PR を出して戻す。

## 6. セキュリティリリースへの対応
1. Next.js は月例のセキュリティリリースを事前告知する（https://nextjs.org/blog）。告知を見たら日程を控える
2. 公開されたら、勧告（GHSA）で影響範囲を確認し、`web/` で `npm install next@<修正版> eslint-config-next@<修正版>` を実行
3. CI 成功を確認して main にマージ（Vercel が自動で本番に反映）
4. GitHub の Settings → Code security で「Dependabot security updates」を有効にしておくと、修正版のPRが自動で作られる

### 現在の状況（2026-11-03 時点）
- 2026-10-14 の重大な脆弱性（use cache の RCE、画像最適化の RCE、Server Actions の DoS）：Next.js 16.4.1 以降で修正。本アプリは 16.4.4 で対応済み。画像最適化は使っていないため無効化済み、Server Actions も使っていない
- **2026-11-03 予定の Next.js セキュリティリリース（中程度7件）は、確認時点で npm に未公開**。公開され次第、上記の手順で更新する
