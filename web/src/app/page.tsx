import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { SiteFooter } from "@/components/site-footer";

const steps = [
  {
    title: "消費者の聞き方で、質問をつくる",
    body: "カテゴリ・肌悩み・年代・価格帯を選ぶだけで、「30代の乾燥肌におすすめの化粧水は？」のような、実際にAIへ投げかけられる質問を作ります。",
  },
  {
    title: "AIの回答から、登場順を数える",
    body: "ChatGPTやGeminiの回答を貼り付けると、自社と競合のブランド名を表記ゆれまで含めて探し、何番目に挙げられたかを記録します。",
  },
  {
    title: "差を見て、伝え方を整える",
    body: "競合だけが薦められた質問を一覧にします。商品ページを見直すときは、化粧品の効能の範囲を超えていないか、その場で確認できます。",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <span className="font-serif text-lg font-semibold tracking-wide">Beauty AI Shelf</span>
        <Link href="/app" className="text-sm font-medium text-ink-2 hover:text-ink">
          ツールを開く
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 sm:pt-24">
          <p className="text-sm tracking-widest text-accent">化粧品ブランドのための、AI推薦モニター</p>
          <h1 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-wide sm:text-5xl sm:leading-tight">
            AIは、あなたの化粧品を
            <br className="hidden sm:block" />
            薦めていますか。
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-loose text-ink-2">
            「敏感肌に合う化粧水は？」と、検索の代わりにAIへ相談する人が増えています。Beauty AI
            Shelfは、美容に特化した質問でAIの回答を記録し、自社と競合がどれだけ薦められているかを比べるツールです。
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/app/setup">無料で始める</ButtonLink>
            <ButtonLink href="/app/check" variant="secondary">
              表現チェックを試す
            </ButtonLink>
          </div>
          <p className="mt-4 text-xs text-ink-3">登録不要。入力したデータはお使いのブラウザの中だけに保存されます。</p>
        </section>

        <section aria-labelledby="how" className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 id="how" className="font-serif text-2xl font-semibold tracking-wide">
              できること
            </h2>
            <ol className="mt-10 grid gap-12 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.title}>
                  <span className="font-serif text-4xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                  <p className="mt-3 text-sm leading-loose text-ink-2">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="why" className="border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.4fr]">
            <h2 id="why" className="font-serif text-2xl font-semibold leading-snug tracking-wide">
              汎用の分析ツールでは
              <br />
              足りない理由
            </h2>
            <dl className="space-y-8">
              <div>
                <dt className="font-bold">美容の質問は、条件の組み合わせで決まる</dt>
                <dd className="mt-2 text-sm leading-loose text-ink-2">
                  肌悩み・年代・価格帯・購入場所の組み合わせによって、AIが挙げるブランドは変わります。美容向けの質問の型を最初から用意しています。
                </dd>
              </div>
              <div>
                <dt className="font-bold">改善の文章は、薬機法の範囲で</dt>
                <dd className="mt-2 text-sm leading-loose text-ink-2">
                  「効果をはっきり書く」という一般的な助言は、化粧品では違反になりえます。化粧品で表現できる効能（56項目）と、行政の公開資料をもとに表現を確認できます。
                </dd>
              </div>
              <div>
                <dt className="font-bold">集計は、再現できる方法で</dt>
                <dd className="mt-2 text-sm leading-loose text-ink-2">
                  ブランドの検出と集計は決まったルールで行うため、同じ記録からは必ず同じ結果が出ます。根拠になった回答もすべて確認できます。
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-base font-bold">現在の提供範囲</h2>
            <p className="mt-3 max-w-3xl text-sm leading-loose text-ink-2">
              現在は、AIへの質問をご自身で行い、回答を貼り付けて記録する方式です。AIへの自動の定期質問は準備中です。表現チェックはルールにもとづく一次確認であり、適法性を保証するものではありません。
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
