# セキュリティ設計

- 作成日：2026-11-02
- 対象：`web/`（Next.js 16.4.3）。記録ツール、表現チェック、無料診断、公開ページ
- 参考：OWASP ASVS（Application Security Verification Standard）、OWASP Top 10 for LLM Applications。番号との厳密な対応は未監査であり、下表は考え方の対応づけである。

## 1. 基本方針
1. **預からない**：記録はブラウザ内のみ。診断結果は保存しない。ログにブランド名・回答本文・生のIPを残さない。
2. **送らない**：AIの提供元に送るのは一般的な質問文だけ。ブランド名・競合名は送らない（テストで保証）。
3. **実行させない**：厳格なCSP（nonce + strict-dynamic、`'unsafe-inline'` なしのscript-src）。外部スクリプト・解析タグを読み込まない。
4. **判断させない**：ブランド検出・集計はLLMを使わない決定論的処理。AIの出力は文字列として扱う。
5. **正直に書く**：取得していない認証、未実施の対策は「予定」と明記する。

## 2. 守るもの
| 資産 | 例 | 保管場所 |
|---|---|---|
| ブランドの戦略情報 | 自社・競合ブランド名、狙う市場、記録した回答 | 利用者のブラウザ（localStorage） |
| APIキー | `OPENAI_API_KEY` / `GEMINI_API_KEY` | 配信基盤の環境変数（サーバー側のみ） |
| 費用 | AIのAPI利用料 | 各社の課金 |
| 信頼 | 表示内容の正しさ、サイトの改ざん防止 | — |

## 3. 脅威と対策
| 脅威 | 対策 | 実装箇所 | テスト |
|---|---|---|---|
| XSS（スクリプト注入） | Reactの自動エスケープ、`dangerouslySetInnerHTML` 不使用、nonce付きCSP、外部スクリプトなし | `src/proxy.ts` | `security.test.ts`（CSP内容）、E2Eでコンソールエラー0 |
| クリックジャッキング | `frame-ancestors 'none'`、`X-Frame-Options: DENY` | `src/proxy.ts`、`next.config.ts` | ヘッダー確認（curl） |
| 通信の盗聴・改ざん | HSTS（2年、preload）、`upgrade-insecure-requests` | `next.config.ts` | ヘッダー確認 |
| CSRF・他サイトからのAPI悪用 | Origin と Host の一致を必須、JSON以外は415 | `src/lib/security.ts`、API | `route.test.ts`、`security.test.ts` |
| 費用を狙った大量呼び出し | IPごと（1時間3回）と1日合計（50回）の上限、ボット用の隠し欄、各社管理画面の上限 | `src/lib/rate-limit.ts` | `diagnosis.test.ts`、`route.test.ts` |
| 巨大な送信による停止 | 本文を10KBで打ち切り（Content-Lengthの偽装にも対応）、入力の長さ・件数制限、読み込みファイル5MB・件数上限 | `readJsonLimited`、`validateDiagnosisInput`、`parseWorkspace` | `security.test.ts` |
| 送信元IPのなりすまし | Vercelが上書きするヘッダーを使用、IP形式以外は無視 | `clientIp` | `security.test.ts` |
| APIキーの漏えい | サーバー側の環境変数のみ（`NEXT_PUBLIC_` を使わない）、応答・ログに含めない | `registry.ts`、API | `route.test.ts`（応答にキーが含まれない） |
| 内部情報の漏えい | エラー時は定型文と受付番号のみ、`X-Powered-By` を出さない | API、`next.config.ts` | `route.test.ts` |
| 機密情報の第三者送信（LLM02 機微情報の漏えい） | ブランド名を質問文に含めない、学習に使われない有料APIのみ | `diagnosis.ts` | `diagnosis.test.ts` |
| プロンプトインジェクション（LLM01） | 利用者の入力をプロンプトに入れない（質問文は選択肢から生成）。AIの回答はコードで照合するだけで、指示として解釈しない | `diagnosis.ts`、`detect.ts` | `diagnosis.test.ts` |
| 出力の不適切な扱い（LLM05） | AIの回答は文字列として表示、引用URLはドメイン名のみ表示 | 診断画面 | — |
| 過剰な依存・誤情報（LLM09） | 集計はルールで行い、回答は「参考値」「1回は偶然に左右」と明記 | 画面の注記 | — |
| 無制限の消費（LLM10） | 回数制限、同時実行数6、1呼び出し45秒で打ち切り | `rate-limit.ts`、`diagnosis.ts` | `diagnosis.test.ts`（時間切れ） |
| CSVインジェクション | `= + - @` で始まる値を無害化 | `src/lib/csv.ts` | — |
| 読み込みデータの改ざん | 型・値の検証、言及は保存値を使わず再計算 | `parseWorkspace` | `core.test.ts` |
| 依存ライブラリの脆弱性 | CIで `npm audit --audit-level=moderate`、Dependabot、CodeQL。Next.js の月例セキュリティリリースに追従（[運用手順書](../operations/deploy-runbook.md)） | `.github/` | CI |
| 未使用機能を狙った攻撃 | 画像最適化（`/_next/image`）を無効化。Server Actions・`use cache` は使わない | `next.config.ts` | 404 を確認 |
| CIの部品の改ざん（サプライチェーン） | GitHub Actions をタグではなくコミットIDで固定 | `.github/workflows/` | — |
| CIの権限悪用 | ワークフローを読み取り権限のみ、`persist-credentials: false` | `.github/workflows/` | — |

## 4. HTTPセキュリティヘッダー（全ページ）
| ヘッダー | 値 |
|---|---|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; …; upgrade-insecure-requests` |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` |
| X-Content-Type-Options | `nosniff` |
| X-Frame-Options | `DENY` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | カメラ・マイク・位置情報・決済・USB 等を無効化 |
| Cross-Origin-Opener-Policy / Resource-Policy | `same-origin` |

`style-src` の `'unsafe-inline'` は、グラフの幅などの style 属性に必要なため許可している。スクリプトの実行にはつながらない。

**トレードオフ**：nonce をページごとに埋め込むため、全ページをリクエスト時に描画する（静的な先行描画とCDNキャッシュを使わない）。表示速度とサーバー負荷はわずかに増えるが、B2B向けの信頼性を優先した（ADR-006）。

## 5. 運用手順
| 項目 | 手順 |
|---|---|
| APIキーの管理 | 各社の管理画面で発行し、Vercel の環境変数（Production のみ）に登録。チャットやリポジトリに書かない。利用上限と予算アラートを必ず設定 |
| キーの漏えい時 | 1) 各社の管理画面でキーを無効化 2) 新しいキーを発行し環境変数を更新・再デプロイ 3) 各社の利用履歴で不正利用を確認 |
| 不正利用の兆候 | ログの `event: "diagnosis"` で 429 の急増、同じ `ipHash` の集中を確認。必要なら `DIAGNOSIS_DAILY_LIMIT` を下げる、またはキーを外して診断を停止（自動で「準備中」表示になる） |
| 脆弱性の報告窓口 | `SECURITY_CONTACT`（mailto: または https:）を設定すると `/.well-known/security.txt` と `/security` に表示 |
| ログ | `LOG_SALT` を設定し、IPのハッシュを推測されにくくする |

## 6. 公表済みの脆弱性への対応状況（2026-11-03）
| 公表日 | 内容 | 本アプリへの影響 | 対応 |
|---|---|---|---|
| 2026-10-14 | Next.js：`use cache` の RCE（GHSA-673q-mjm6-r5xr、Critical）、画像最適化の RCE（CVE-2026-96889、Critical）、Server Actions の DoS（GHSA-p3m5-59mp-jv5r、High） | Cache Components を有効にしているため対象だった | 16.4.1 以降で修正。16.4.4 に更新済み。画像最適化は無効化、Server Actions は不使用 |
| 2026-10-14 | React：RSC の RCE（GHSA-xqc2-xf4c-x3h3、Critical）、Server Functions の DoS（GHSA-h3gv-c5rc-p453、High） | Next.js 同梱のサーバー部品が対象 | Next.js 16.4.1 以降で修正。react / react-dom も 19.3.1 に更新 |
| 2026-11-03 予定 | Next.js 月例セキュリティリリース（Medium 7件） | 詳細は未公表 | **確認時点で未公開**。公開後すぐ更新する |

出典：Next.js 公式ブログ（https://nextjs.org/blog/nextjs-security-update-october-14-2026、https://nextjs.org/blog/upcoming-nextjs-security-release-november-2026）、React の GitHub 勧告。いずれも 2026-11-03 取得。

## 7. 残るリスクと今後の対策
| リスク | 現状 | 対策（予定） |
|---|---|---|
| 回数制限がインスタンスごと | 複数インスタンスでは合計が上限を超えうる | Upstash Redis 等の共有ストア、または Vercel Firewall のレート制限・BotID |
| ブラウザ内データの保護 | 端末を共有すると他人が閲覧できる | 有料版でサーバー保存＋ログインに移行 |
| 第三者による検証なし | 自動テストと自己点検のみ | 公開前の脆弱性診断（外部）、有料化前にペネトレーションテスト |
| 有料版のデータ預かり | 未実装 | 二段階認証、テナント分離（Supabase の行レベルセキュリティ）、暗号化、監査ログ、バックアップ、契約終了時の削除 |
| 法務 | 未確認 | プライバシーポリシー・利用規約・セキュリティページの記載を専門家が確認 |
