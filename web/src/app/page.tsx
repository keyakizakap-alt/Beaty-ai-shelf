import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";

const problems = [
  {
    title: "AIの推薦は、目に見えない",
    body: "検索順位は計測できても、ChatGPTやGeminiが「乾燥肌の化粧水」で何を薦めているかは、自分で聞くまで分かりません。しかも答えは聞くたびに変わります。",
  },
  {
    title: "手作業の確認は、続かない",
    body: "担当者が毎週いくつものAIに同じ質問をして、結果を表にまとめる。その作業に時間を取られ、肝心の改善に手が回りません。",
  },
  {
    title: "一般的な対策は、化粧品では危うい",
    body: "「効果をはっきり書く」といった一般的なAI検索対策は、化粧品では薬機法に触れるおそれがあります。",
  },
];

const features = [
  {
    title: "美容に特化した質問で、定点観測",
    body: "カテゴリ・肌悩み・年代・価格帯から、消費者が実際にAIへ投げかける形の質問を作り、同じ条件で繰り返し確かめます。",
  },
  {
    title: "競合と並べて、差が分かる",
    body: "自社と競合が回答に登場した割合、何番目に挙げられたか、AIが参照したサイトを並べ、競合だけが薦められた質問を一覧にします。",
  },
  {
    title: "改善の文章を、薬機法の観点で確認",
    body: "商品ページやSNSの文案を貼り付けると、化粧品で使えない可能性がある表現に印をつけ、言い換えの方向と根拠を示します。",
  },
];

const plans = [
  {
    name: "記録ツール",
    price: "無料",
    note: "提供中",
    items: ["質問の自動作成", "AIの回答の記録と集計", "表現チェック", "データはブラウザ内に保存"],
  },
  {
    name: "スタンダード",
    price: "月額 19,800円（税別）",
    note: "提供予定",
    items: ["1ブランド・競合5社", "主要なAIへの自動の定点観測（週1回）", "週次レポートと変化の通知", "チームで共有"],
  },
  {
    name: "エージェンシー",
    price: "月額 49,800円〜（税別）",
    note: "提供予定",
    items: ["複数ブランドの管理", "取引先向けレポート", "請求書払い"],
  },
];

const securityPoints = [
  {
    title: "ブランド名をAIに送らない",
    body: "無料診断でAIの提供元に送るのは、一般的な質問文だけです。ブランド名や競合名は送りません。",
  },
  {
    title: "記録はブラウザの中だけに",
    body: "記録ツールのデータは、お使いのブラウザの中だけに保存され、運営者のサーバーには送信されません。",
  },
  {
    title: "学習に使われない有料APIのみ",
    body: "AIは各社の有料APIだけを使います。各社とも、送信内容をモデルの学習に使わないとしています。",
  },
  {
    title: "許可したもの以外は動かさない",
    body: "外部のスクリプトや解析タグを読み込まず、許可したスクリプト以外は実行できない設定にしています。",
  },
];

const faqs = [
  {
    q: "AIの回答は毎回変わるのに、測る意味はありますか。",
    a: "1回の結果は偶然に左右されますが、同じ質問を同じ条件で繰り返し聞くと、どのブランドが安定して薦められているかという傾向が見えます。本サービスは1回の結果ではなく、割合と推移で示します。",
  },
  {
    q: "消費者が見ている回答と同じですか。",
    a: "同じとは限りません。AIの回答は、利用者の履歴や設定によって変わります。本サービスの結果は「同じ条件で繰り返し測った傾向」としてご覧ください。",
  },
  {
    q: "表現チェックで問題がなければ、広告に使ってよいですか。",
    a: "表現チェックは公開資料にもとづく一次確認で、適法性を保証するものではありません。最終的な判断は、薬事の専門家にご確認ください。",
  },
  {
    q: "入力したデータはどこに保存されますか。",
    a: "無料の記録ツールでは、データはお使いのブラウザの中だけに保存され、運営者のサーバーには送信されません。無料診断でAIの提供元に送るのは一般的な質問文だけで、ブランド名は送りません。診断結果も保存しません。詳しくは「セキュリティへの取り組み」をご覧ください。",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <span className="font-serif text-lg font-semibold tracking-wide">Beauty AI Shelf</span>
        <nav aria-label="サイト">
          <ul className="flex items-center gap-4 text-sm">
            <li className="hidden sm:block">
              <a href="#pricing" className="text-ink-2 hover:text-ink">
                料金
              </a>
            </li>
            <li>
              <Link href="/app" className="font-medium text-ink-2 hover:text-ink">
                記録ツール
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pt-24">
          <p className="text-sm tracking-widest text-accent">化粧品ブランドのマーケティング担当者へ</p>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-wide sm:text-5xl sm:leading-tight">
            AIは、あなたの化粧品を
            <br className="hidden sm:block" />
            薦めていますか。
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-loose text-ink-2">
            「敏感肌に合う化粧水は？」と、検索の代わりにAIへ相談する人が増えています。Beauty AI
            Shelfは、ChatGPTやGeminiが自社と競合のどちらを薦めているかを定点観測し、差を埋めるための文章を薬機法の観点で確認できる、化粧品ブランド向けのツールです。
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/diagnosis">自社ブランドを無料で診断</ButtonLink>
            <ButtonLink href="/app/setup" variant="secondary">
              無料の記録ツールを使う
            </ButtonLink>
          </div>
        </section>

        <section aria-labelledby="problems" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="problems" className="font-serif text-2xl font-semibold tracking-wide">
              こんな課題はありませんか
            </h2>
            <ul className="mt-10 grid gap-12 md:grid-cols-3">
              {problems.map((p) => (
                <li key={p.title}>
                  <h3 className="text-lg font-bold">{p.title}</h3>
                  <p className="mt-3 text-sm leading-loose text-ink-2">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="features" className="border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="features" className="font-serif text-2xl font-semibold tracking-wide">
              Beauty AI Shelf でできること
            </h2>
            <ol className="mt-10 grid gap-12 md:grid-cols-3">
              {features.map((s, i) => (
                <li key={s.title}>
                  <span className="font-serif text-4xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                  <p className="mt-3 text-sm leading-loose text-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="pricing" aria-labelledby="pricing-title" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="pricing-title" className="font-serif text-2xl font-semibold tracking-wide">
              料金
            </h2>
            <p className="mt-3 text-sm text-ink-2">有料プランは提供開始に向けて準備中です。料金は予定であり、変更する場合があります。</p>
            <ul className="mt-10 grid gap-8 md:grid-cols-3">
              {plans.map((p) => (
                <li key={p.name} className="border-t-2 border-ink pt-6">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold">{p.name}</h3>
                    <span className={`text-xs ${p.note === "提供中" ? "text-accent font-bold" : "text-ink-3"}`}>{p.note}</span>
                  </div>
                  <p className="mt-2 font-serif text-xl">{p.price}</p>
                  <ul className="mt-5 space-y-2 text-sm text-ink-2">
                    {p.items.map((it) => (
                      <li key={it} className="flex gap-2">
                        <span aria-hidden className="text-accent">—</span>
                        {it}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="security" className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.6fr]">
            <div>
              <h2 id="security" className="font-serif text-2xl font-semibold leading-snug tracking-wide">
                預からないことで、
                <br />
                守る設計
              </h2>
              <p className="mt-4 text-sm leading-loose text-ink-2">
                ブランドの戦略や競合の情報は、企業にとって大切な情報です。必要以上のデータを預からないことを基本に設計しています。
              </p>
              <Link href="/security" className="mt-6 inline-block text-sm font-medium text-accent underline underline-offset-4">
                セキュリティへの取り組みを見る
              </Link>
            </div>
            <dl className="grid gap-8 sm:grid-cols-2">
              {securityPoints.map((p) => (
                <div key={p.title}>
                  <dt className="font-bold">{p.title}</dt>
                  <dd className="mt-2 text-sm leading-loose text-ink-2">{p.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="faq" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
            <h2 id="faq" className="font-serif text-2xl font-semibold tracking-wide">
              よくある質問
            </h2>
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {faqs.map((f) => (
                <div key={f.q} className="py-6">
                  <dt className="font-bold">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-loose text-ink-2">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="font-serif text-xl font-semibold">まずは、自社ブランドの今を確かめてください。</p>
            <ButtonLink href="/diagnosis">無料で診断する</ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
