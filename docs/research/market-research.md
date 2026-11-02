# 市場調査レポート（Phase 1）

- 調査日：2026-11-02
- 調査者：Claude Code（AIエージェント）
- 調査方法：Web検索（一次情報・公式リリース・業界メディア・アプリストア掲載情報）
- 表記ルール：**[事実]** 出典で確認できたこと / **[推測]** 出典からの推論 / **[未検証]** 裏取りできていない仮説

> 注意：本調査はWeb検索のみで行い、ユーザーインタビューは未実施です。数値の多くは企業の独自調査（対象・定義がばらばら）なので、規模感の目安として扱ってください。

---

## 0. 要点（結論）

1. **国内化粧品市場は約2.6兆円で微増、うちスキンケアが約46%** [事実]。市場は大きいが、成長は単価の上昇とインバウンド需要によるもの。
2. **大手は「AIで商品を見つけて買う」体験に集中投資**している（Ulta×Google Gemini、Sephora×ChatGPT、@cosmeの成分検索・Copilot）[事実]。汎用の「美容相談AI」「成分検索」で個人開発が勝つのは難しい。
3. **一方で「買った後に肌に合わなかった」問題は解決されていない**。敏感肌層では、買った化粧品で肌の状態が悪くなった経験が57.9%、合うか不安で購入を迷った経験が45.1%、悩みの1位は「どの製品が自分に合うのかわからない」[事実・企業調査]。
4. 既存サービスは「一般的な成分の評価（Yuka、CosDNA）」「商品検索（@cosme）」「肌日記（肌log、Trigger）」に分かれており、**「自分が合わなかった商品の全成分を突き合わせて、共通する成分を見つけ、次に買う商品を事前に確認する」流れを日本語でまとめて提供しているサービスは見当たらない**[推測：検索範囲内で未発見]。
5. B2B（小規模ブランド向け）では、**薬機法チェックツールが月額11万円台〜と高く**[事実：比較記事]、小規模D2Cブランドには手が届きにくい余地がある。ただし判定ミスの責任リスクが大きい。

---

## 1. 顧客セグメント

| セグメント | 規模感・特徴 | 主な情報源 |
|---|---|---|
| A. 一般消費者（特に敏感肌・肌荒れしやすい層） | 敏感肌の自覚：20〜30代で約2割、ニキビに悩む女性では33.2%（調査ごとに定義が違う） | ナイル調査、TPCマーケティングリサーチ |
| B. 成分を見て買う消費者 | 30〜50代女性の約6割が購入時に成分を意識（2025年5月公表） | レカルカ調査（ネットショップ担当者フォーラム） |
| C. 中小・新興化粧品ブランド（D2C） | 小ロットOEM・D2C支援が充実し、参入しやすくなっている。受託製造市場は3,675億円（2025年度、前年比103.6%） | 矢野経済研究所、サティス製薬 |
| D. EC運営者・大手リテーラー | AIエージェント経由の購入（Agentic Commerce）に対応を始めている | Google Cloud、PYMNTS、Glossy |
| E. 美容部員・美容アドバイザー | 店頭での肌診断・接客。今回は一次情報が不足 | [未検証] |
| F. 商品企画・マーケティング担当 | 口コミ分析（VOC）にAIを使い始めている | アイスタイル（@cosme Copilot）、ベクスト |

## 2. 顧客課題

### A/B：一般消費者
- **合う商品がわからない**：敏感肌の悩みの1位は「どの製品が自分に合うのかわからない」[事実]
- **買って失敗した経験が多い**：敏感肌女性の57.9%が、購入した美容商品で症状が悪化した経験あり。化粧水で肌に合わなかった経験は7割超[事実・企業調査]
- **購入をためらう**：45.1%が、合うか不安で敏感肌用化粧品の購入を迷った経験あり[事実]
- **原因成分がわからない**：成分を「避けたい」ニーズが増えている（アイスタイルのリリース）[事実]。ただし、自分が何を避けるべきかは自分で推理するしかない[推測]
- **時間・金銭的な損失**：合わない商品を使わずに放置（数千円/本）、肌荒れが治るまでの期間、皮膚科に行く費用[推測：定量データ未取得]

### C：小規模ブランド
- 広告・LPの表現が薬機法・景品表示法に違反しないかの確認。専門家への依頼もツールも高い[事実：ツール料金]／[推測：小規模ブランドの負担感]
- 顧客の声が自社EC・Amazon・楽天・@cosmeに散らばっていて分析しにくい[推測]

### D/F：EC・企画担当
- AIエージェント経由の購入に向けて、商品データを整える必要が出てきている（Ulta×Google の Universal Commerce Protocol 等）[事実]。日本の中小ECで需要があるかは[未検証]。

## 3. 現在の代替手段

| 課題 | 代替手段 | 限界 |
|---|---|---|
| 合う商品を探す | @cosme・LIPSの口コミ、成分検索（@cosme 2026年2月〜） | 他人の肌の評価であり、自分が何に反応するかはわからない |
| 成分の安全性を見る | Yuka、CosDNA、INCIDecoder、Think Dirty | 「一般的な刺激性」の評価であり、その人固有の反応歴を反映しない。英語中心 |
| 肌の変化を記録する | 肌log、Trigger: Skin Tracker、FeelinMySkin | 日記が中心。商品の全成分を突き合わせる機能は弱い／iPhoneのみ／英語中心 |
| 原因成分を調べる | 皮膚科のパッチテスト | 正確だが手間と費用がかかる。日常的な買い物のたびには使えない |
| 広告表現を確認する | 薬機法チェックツール（LOGRIZa等）、専門家 | 月額11万円＋従量課金など、小規模事業者には高い |

## 4. 競合サービス

| サービス | 種類 | 主な機能 | 出典 |
|---|---|---|---|
| @cosme（アイスタイル） | 口コミ・EC | 2026年2月から成分で「含む／除外」検索。2026年1月からブランド向けに「@cosme Copilot」（口コミのAI分析） | istyle.co.jp PDF、ネットショップ担当者フォーラム |
| LIPS（AppBrew） | 口コミ・EC | 写真付き口コミ、パーソナルカラー・顔診断、通販 | App Store |
| Yuka | 成分スコア | バーコードを読み取り100点満点で評価 | 各種レビュー記事 |
| CosDNA / INCIDecoder | 成分辞典 | 成分ごとの刺激性・ニキビのできやすさ、成分の役割解説 | incidecoder.com 他 |
| SkinSort | ルーティン・成分 | 成分チェッカー、ルーティン作成、似た商品検索。英語 | skinsort.com |
| 肌log | 肌記録 | 写真で記録、使ったアイテムとの関連を分析。iPhoneのみ | App Store |
| Trigger: Skin Tracker | 肌記録 | 習慣と肌の反応の関連をAIで分析（2026年7月公開）。英語 | アプリ紹介ページ |
| Perfect Corp（YouCam） | B2B/B2C | AI肌診断API、バーチャル試着。2026年Q2のB2B収益は横ばいで、理由に「AIアプリとの競争激化」を挙げる | Business Wire（2026-07-27） |
| Ulta AI / Sephora（ChatGPT） | 大手リテーラー | AIエージェントによる商品発見・購入 | Google Cloud Press（2026-04-22）、PYMNTS、Glossy |

## 5. 競合の強みと弱み

- **@cosme/LIPS**：強み＝口コミ量、商品データ、集客力。弱み＝自分の肌の反応歴という「その人だけのデータ」を持っていない。商品を売る側なので、「買わない方がいい」とは言いにくい[推測]。
- **成分スコア系（Yuka等）**：強み＝手軽さ。弱み＝一律の評価で、科学的な妥当性への批判もある（「実際の使い方を考慮していない」との指摘）。日本の全成分表示名称には弱い[推測]。
- **肌記録系**：強み＝続けやすい記録UI。弱み＝成分レベルの分析が浅い、日本語・Android対応が限られる。
- **大手のAI購買**：強み＝データと資本。弱み＝自社の品ぞろえ内での提案に限られる。

## 6. 未解決の課題

1. **「自分の反応歴 × 全成分」の突き合わせ**：合わなかった商品と問題なかった商品を比べて、共通する成分の候補を出す仕組みが、日本語の個人向けツールとしてほとんど無い[推測：検索範囲内]。
2. **購入前の個人別チェック**：店頭やECで、気になる商品の全成分を「自分が避けたい成分リスト」と照らし合わせる手段が無い。
3. **皮膚科受診時に持っていく記録**：使った商品・成分・反応が時系列で整理されていない[推測]。
4. **小規模ブランドの表現チェック**：安価で手軽な一次チェック手段が少ない。

## 7. 市場参入の難易度

| 領域 | 難易度 | 理由 |
|---|---|---|
| 一般的な美容相談AI・成分検索 | 高 | 大手がすでに提供。差別化しにくい |
| バーチャル試着・肌画像診断 | 高 | 技術・データで大手に勝てない。肌画像は個人情報の扱いが重い |
| 個人の反応歴に基づく成分分析 | 中 | 商品データベースが無料で手に入らない → **ユーザーが全成分表示を撮影・貼り付けし、AIで読み取る**ことで回避できる |
| B2B 薬機法チェック | 中〜高 | 技術的には作れるが、見落とした場合の責任が重い |

## 8. 課金可能性

- B2C：個人の美容アプリへの課金は一般に低め。ただし「失敗した買い物（数千円）を1回減らせる」ことは金額で説明しやすい[推測]。想定：無料＋月額300〜500円の有料プラン[未検証]。
- B2B：薬機法チェックは月額数万円でも需要がある可能性[推測]。VOC分析は既存ツールが多い。
- 将来の可能性：本人の同意を得た匿名の「反応が出た成分」の集計データは、ブランドの商品企画に価値がある可能性[未検証・法務確認が必要]。

## 9. 出典（取得日はすべて 2026-11-02）

| # | 出典 | URL | 種別 |
|---|---|---|---|
| 1 | 矢野経済研究所 化粧品市場 2025年度（2026-10-16発表） | https://www.yano.co.jp/press-release/show/press_id/4207 | 公式（調査会社） |
| 2 | 訪日ラボ 同上の解説 | https://honichi.com/news/2026/10/28/cosme2025/ | 業界メディア |
| 3 | アイスタイル 成分検索機能リリース（2026-02） | https://www.istyle.co.jp/news/uploads/20260212.pdf | 公式 |
| 4 | ネットショップ担当者フォーラム「@cosme Copilot」（2026-01-09） | https://netshop.impress.co.jp/n/2026/01/09/15391 | 業界メディア |
| 5 | Google Cloud Press Corner：Ulta Beauty × Gemini（2026-04-22） | https://www.googlecloudpresscorner.com/2026-04-22-Ulta-Beauty-and-Google-Introduce-Gemini-Enabled-Shopping-Experiences-That-Streamline-Beauty-Discovery-and-Purchase | 公式 |
| 6 | PYMNTS：Beauty Giants Race to Own the AI Shopping Moment | https://www.pymnts.com/artificial-intelligence-2/2026/beauty-giants-race-to-own-the-ai-shopping-moment/ | 業界メディア |
| 7 | Glossy：Sephora/Ultaとエージェント型購買 | https://www.glossy.co/beauty/is-agentic-shopping-the-next-big-thing-in-beauty-sephora-and-ulta-are-betting-yes/ | 業界メディア |
| 8 | Perfect Corp 2026年Q2決算（2026-07-27） | https://www.businesswire.com/news/home/20260727619550/en/ | 公式（IR） |
| 9 | レカルカ調査 成分意識（2025-05） | https://netshop.impress.co.jp/node/14092 | 業界メディア（企業調査） |
| 10 | ナイル 敏感肌調査 | https://nyle.co.jp/news/230125-1 | 企業調査 |
| 11 | TPCマーケティングリサーチ 敏感肌コスメ実態（2025） | https://www.dreamnews.jp/press/0000337694/ | 企業調査 |
| 12 | 薬機法チェックAIツール比較（2026） | https://atsoho.com/blog/yakkiho-check-ai-tool-comparison | 非公式（比較メディア） |
| 13 | 機械良文（薬事法広告研究所） | https://netshop.impress.co.jp/node/10694 | 業界メディア |
| 14 | SkinSort | https://skinsort.com/guide/build-and-log-your-routine | 公式（サービス） |
| 15 | 肌log（App Store） | https://apps.apple.com/jp/app/id6756219046 | アプリストア |
| 16 | Trigger: Skin Tracker | https://mwm.ai/ja/apps/trigger-skin-tracker/6787020115 | アプリ紹介 |
| 17 | INCIDecoder | https://incidecoder.com/about | 公式（サービス） |
| 18 | Yukaへの批判的考察 | https://anniessa.substack.com/p/is-your-skincare-app-lying-to-you | 非公式（個人ブログ） |
| 19 | 美的.com 化粧品の使用期限 | https://www.biteki.com/skin-care/trouble/471993 | 業界メディア |
| 20 | 消費者庁 ステマ規制 措置命令の経緯（宣伝会議） | https://www.advertimes.com/20240620/article464264/ | 業界メディア |
| 21 | ベクスト VOC分析AIエージェント（2026-05） | https://aeo.washinmura.jp/ai/%E3%83%99%E3%82%AF%E3%82%B9%E3%83%88%E6%A0%AA%E5%BC%8F%E4%BC%9A%E7%A4%BE/en/news/2026-05-13-vext-begins-r-and-d-on-voc-analysis-spec-2 | 企業リリース転載 |

## 10. 未検証の仮説（次に確かめること）

| # | 仮説 | 確かめ方 |
|---|---|---|
| H1 | 敏感肌の人は「合わなかった商品」を3つ以上覚えていて、記録する気がある | SNS・知人10人に聞く／LPでの事前登録率 |
| H2 | 全成分表示の写真から、AIで成分名を95%以上正しく読み取れる | 30商品で精度を測る（Phase 7の評価データ） |
| H3 | 共通成分の候補を示されると「次の買い物の参考になる」と感じる | MVPで初回利用後のアンケート |
| H4 | 月額300〜500円を払う人が利用者の2〜5%いる | 公開後の課金率 |
| H5 | 日本語でこの流れを提供する競合は無い | アプリストア・Webの追加調査 |
| H6 | 匿名の集計データにブランドが価値を感じる | 将来のヒアリング（MVP対象外） |

---

## 11. 追加調査：「すでにお金が払われている領域」（2026-11-02 追記）

ユーザーの指示（売れないものは考えない）を受け、**同じ課題にすでに支払いが発生しているか**を中心に追加調査した。

### 11-1. 薬機法・景表法チェック（支払実績：強い）
- 有料ツールが多数：トランスコープ Basic 月額11,000円／Pro 38,500円、Cosme-Design.jp 月額30,000円（税別、成分表示チェックを含む）、Medrock 月額3万円〜、ADJUDGE 月額55,000円（税込）、LOGRIZa 月額110,000円＋従量 [事実：比較記事・非公式。料金は公式で要確認]
- 無料ツールもある：機械良文（1回200文字まで）、セルフ薬機法チェック（1,500文字まで）
- 比較記事では17社以上が紹介されており、**競争は激しい**
- 景表法は2023年の改正で課徴金・直罰が強化。SNS広告・インフルエンサー広告での摘発が増えているとの解説あり [非公式：法律事務所・解説記事]

### 11-2. サロン向け口コミ返信AI（支払実績：あるが価格競争）
- ReviewAnswer 月額3,980円＋返信生成1,000円、AI Review 月額1万円、CREVIA 月額3,300円、MapBoost 2,980円〜、クチコミAI 980円〜 [事実：各社サイト・非公式比較]
- 美容所数は274,070店（令和5年度、厚生労働省 衛生行政報告例）、個人経営が中心

### 11-3. AI検索での露出（LLMO/AIO/GEO）（支払実績：あり・急成長）
- 国内ツールは20〜40種類。Brand UP 7,980円、GEO AIO TRACKER 9,800円〜、LLM Insight 24,800円〜、DolphinX 3万円〜、ミエルカGEO 49,800円（税抜） [非公式：比較記事]
- 単発診断：Owned 5万円（税別、先着30社） [企業リリース]
- 海外：Otterly 約29ドル〜、Peec AI 約89〜95ドル〜、Profound 99〜499ドル〜 [非公式：比較記事]
- 約70%の企業が、生成AIで自社がどう表示されるかを確認したことがない（火燵の調査） [企業調査]
- **化粧品ブランドのAI回答での平均露出率は29.4%**（Z Creative Partners、2026-06-24。調査方法の詳細は未確認） [企業調査]
- Orosy「AI棚どり」：ブランド名からChatGPTでの言及・推奨を評価。中小メーカー・D2Cが対象 [企業リリース] → **直接の競合**
- 美容に特化し、改善案を薬機法に照らして出す国内ツールは、調べた範囲では見当たらない [推測]

### 11-4. 美容 × 生成AI経由の購買（海外）
- 生成AIから小売サイトへの流入が2025年に304%増。美容・パーソナルケアはAI経由の商品発見で最も目立つ分野（Euromonitor、Business Wire 2026-03-18） [公式リリース]
- eMarketer「AI Visibility Index: Personal Care & Beauty」：2026年Q1にChatGPTの回答5,200件超を分析。顔用スキンケアの質問の81%でLa Roche-Posayが推薦された [業界メディア]
- 5W PR：スキンケアのAI引用の約22%を上位4ブランドが占める [企業調査]

### 11-5. API原価
- Gemini 3：Google検索グラウンディングは月5,000クエリまで無料、超過分は1,000クエリあたり14ドル（Google Cloud 公式価格ページ） [公式]
- OpenAI：Web検索ツールは1,000回あたり約10ドル [非公式・二次情報。公式で要確認]

### 追加出典（取得日 2026-11-02）
| 出典 | URL | 種別 |
|---|---|---|
| 薬機法チェックツール比較（Medrock） | https://medrock.co.jp/navi/medical-content/yakkiho-checktool/ | 非公式（比較記事） |
| 薬機法AIチェックサービス17選 | https://biz.you-first.co.jp/yakkihou-ai-check-services/ | 非公式（比較記事） |
| ReviewAnswer | https://www.exceed-system.co.jp/reviewanswer/ | 公式（サービス） |
| AI Review | https://www.adapter.salon/ai-review | 公式（サービス） |
| 厚生労働省 生活衛生関係 | https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/seikatsu-eisei/seikatsu-eisei03/06.html | 公式 |
| AIOツール21選比較（SEED） | https://www.seedinc.jp/column/aio/aio-service-tool/ | 非公式（比較記事） |
| LLMOツール比較（メディアリーチ） | https://mediareach.co.jp/blog/llmo-tool | 非公式（比較記事） |
| Owned AIO診断 | https://aeo.washinmura.jp/ai/owned%E6%A0%AA%E5%BC%8F%E4%BC%9A%E7%A4%BE/en/news/2026-05-21-owned-inc-launches-limited-time-aio-llmo | 企業リリース転載 |
| Orosy AI棚どり | https://aeo.washinmura.jp/ai/corporate-orosy-com/en/news/2026-04-02-are-you-ai-shelf-ready-launching-ai-tana?lang=en | 企業リリース転載 |
| 火燵 生成AI検索の確認状況調査 | https://aeo.washinmura.jp/ai/%E6%A0%AA%E5%BC%8F%E4%BC%9A%E7%A4%BE%E7%81%AB%E7%87%B5/en/news/2026-05-12-2026-survey-approximately-70-of-companie | 企業リリース転載 |
| Euromonitor（Business Wire 2026-03-18） | https://www.businesswire.com/news/home/20260318561945/en/ | 公式リリース |
| eMarketer AI Visibility Index Beauty | https://www.emarketer.com/content/ai-visibility-index-personal-care-beauty-q1-2026-leaderboard | 業界メディア |
| 5W PR Beauty AI Visibility Index | https://www.5wpr.com/ai-visibility-index/beauty-ai-visibility-index-2026/beauty-ai-visibility-index-2026.pdf | 企業調査 |
| AI検索ツール料金比較 | https://ecorpit.com/agent-web-search-api-cost-comparison-2026/ | 非公式 |
| Google Cloud 生成AI料金 | https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing?hl=en | 公式 |
| エステ広告規制（モノリス法律事務所） | https://monolith.law/corporate/esthetic-salons-pharma-ad-rules | 非公式（法律事務所） |
