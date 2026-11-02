# Beauty AI Shelf（Webアプリ）

化粧品ブランド向けの「AI推薦モニター」試作版です。AIのAPIは使わず、利用者がAIに質問して得た回答を貼り付けて記録します。

## できること
- ブランド設定（自社・競合・表記ゆれ・狙う市場）
- 美容に特化した質問の自動作成（カテゴリ×悩み×年代×価格帯）
- 回答の記録とブランド登場順の自動検出（決定論的な文字列照合）
- レポート（登場割合・平均順位・1番目の割合・AI別・週別・競合だけが登場した質問）、CSV書き出し
- 薬機法の表現チェック（ルールベースの一次確認。根拠つき）
- データの書き出し・読み込み・全削除（データはブラウザ内のみに保存）

## 開発
```bash
npm ci
npm run dev        # http://localhost:3000
npm run lint && npm run typecheck && npm test && npm run build
```

## E2E・アクセシビリティ検査（ビルド後）
```bash
PORT=3100 npm start &
BASE_URL=http://localhost:3100 npm run e2e
BASE_URL=http://localhost:3100 npm run a11y
```

## 構成
- `src/lib/` … コアロジック（LLM不使用）。`detect.ts` ブランド検出、`metrics.ts` 集計、`questions.ts` 質問生成、`yakki.ts` 表現チェック、`storage.ts` 保存と入力検証
- `src/app/` … 画面（Next.js App Router）
- `e2e/` … Playwright によるスモークテスト、axe-core による検査
