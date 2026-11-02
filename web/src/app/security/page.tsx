import type { Metadata } from "next";
import { connection } from "next/server";
import { LegalPage } from "../legal-layout";

export const metadata: Metadata = {
  title: "セキュリティへの取り組み",
  description: "Beauty AI Shelf のデータの扱い、通信の保護、AI利用時の安全対策、不正利用対策、利用している外部サービスについて説明します。",
};

const dataRows = [
  { feature: "記録ツール（ブランド設定・質問・回答の記録）", where: "お使いのブラウザ内のみ", external: "なし", retention: "ブラウザから削除するまで（「データ管理」でいつでも削除可）" },
  { feature: "表現チェック", where: "保存しない（端末内で処理）", external: "なし", retention: "画面を閉じると消える" },
  { feature: "無料診断", where: "保存しない（サーバーのメモリ上でのみ処理）", external: "質問文のみ（OpenAI・Google）。ブランド名は送らない", retention: "処理後に破棄" },
  { feature: "運用ログ", where: "配信基盤（Vercel）のログ", external: "なし", retention: "配信基盤の保存期間に従う。IPは復元できない形に変換して記録" },
];

const vendors = [
  { name: "Vercel Inc.", purpose: "Webサイトの配信・実行", data: "アクセスログ（IPアドレス等）" },
  { name: "OpenAI", purpose: "無料診断でのAIへの質問（ChatGPT）", data: "一般的な質問文のみ。APIで送られたデータは既定で学習に使われない" },
  { name: "Google", purpose: "無料診断でのAIへの質問（Gemini）", data: "一般的な質問文のみ。有料サービスの送信内容は製品改善に使われない" },
];

export default async function SecurityPage() {
  await connection();
  const contact = process.env.SECURITY_CONTACT ?? "";
  const hasContact = /^(mailto:[^\s@]+@[^\s@]+|https:\/\/\S+)$/.test(contact);

  return (
    <LegalPage title="セキュリティへの取り組み" updated="2026年11月2日">
      <p>
        Beauty AI Shelf は、化粧品ブランドの未発表の戦略や競合の情報を扱う可能性があるツールです。そのため「必要以上のデータを預からない」ことを基本方針とし、預かる場合も最小限・短期間にとどめる設計にしています。ここでは、現在の提供範囲で実施している対策を具体的に説明します。第三者認証（ISMS等）は現時点で取得していません。
      </p>

      <section>
        <h2>1. データの扱い</h2>
        <ul className="mt-4 !list-none divide-y divide-line border-y border-line !pl-0">
          {dataRows.map((r) => (
            <li key={r.feature} className="py-4">
              <p className="font-bold">{r.feature}</p>
              <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[7rem_1fr]">
                <dt className="text-ink-3">保存場所</dt>
                <dd>{r.where}</dd>
                <dt className="text-ink-3">外部への送信</dt>
                <dd>{r.external}</dd>
                <dt className="text-ink-3">保存期間</dt>
                <dd>{r.retention}</dd>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>2. AIを利用する際の安全対策</h2>
        <ul>
          <li>AIの提供元に送るのは、カテゴリと悩みから作った一般的な質問文だけです。<strong>ブランド名や競合名は送りません</strong>（自動テストで常に確認しています）。</li>
          <li>各社の有料APIを利用しています。OpenAI はAPIで送られたデータを既定でモデルの学習に使わないとしており、Google は有料サービスで送られた内容を製品の改善に使わないとしています。</li>
          <li>AIの回答は、文字として表示するだけで、ページ上でプログラムとして実行されることはありません。</li>
          <li>ブランドの検出や割合の計算はAIに任せず、決まったルールで行います。同じ記録からは必ず同じ結果が出て、根拠になった回答を確認できます。</li>
        </ul>
      </section>

      <section>
        <h2>3. 通信とWebサイトの保護</h2>
        <ul>
          <li>すべての通信を HTTPS で暗号化し、ブラウザに HTTPS のみで接続するよう指示しています（HSTS）。</li>
          <li>ページごとに使い捨ての値（nonce）を発行し、許可したスクリプト以外は実行できないようにしています（Content Security Policy）。外部のスクリプトや広告・解析タグは読み込んでいません。</li>
          <li>他のサイトにページを埋め込まれないようにし、なりすまし画面による誤操作を防いでいます。</li>
          <li>カメラ・マイク・位置情報など、使わない端末機能はすべて無効にしています。</li>
        </ul>
      </section>

      <section>
        <h2>4. 不正利用への対策</h2>
        <ul>
          <li>無料診断は、このサイトの画面からの送信だけを受け付けます。</li>
          <li>同じ送信元からの回数と、1日あたりの合計回数に上限を設けています。あわせて、AIの提供元の管理画面でも利用金額の上限を設定して運用します。</li>
          <li>入力内容の形式・長さ・大きさを検証し、想定外の入力は処理しません。</li>
          <li>エラーが起きても、内部の情報や秘密の値を画面に表示しません。お問い合わせの際に使える受付番号を表示します。</li>
        </ul>
      </section>

      <section>
        <h2>5. 開発・運用での対策</h2>
        <ul>
          <li>APIキーなどの秘密の値はプログラムに書かず、配信基盤の環境変数で管理しています。ブラウザには送りません。</li>
          <li>変更のたびに、自動テスト、型の検査、依存ライブラリの既知の脆弱性の検査を自動で実行しています。</li>
          <li>運用ログには個人を特定できる情報や、ブランド名・AIの回答を記録しません。</li>
        </ul>
      </section>

      <section>
        <h2>6. 利用している外部サービス</h2>
        <ul className="mt-4 !list-none divide-y divide-line border-y border-line !pl-0">
          {vendors.map((v) => (
            <li key={v.name} className="py-4">
              <p className="font-bold">{v.name}</p>
              <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[7rem_1fr]">
                <dt className="text-ink-3">目的</dt>
                <dd>{v.purpose}</dd>
                <dt className="text-ink-3">扱う情報</dt>
                <dd>{v.data}</dd>
              </dl>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>7. 有料プランの提供に向けて予定している対策</h2>
        <p>チームでのデータ共有や自動の定点観測を提供する際には、データをサーバーで預かることになります。その際は次の対策を行ったうえで提供します（予定）。</p>
        <ul>
          <li>ログインの二段階認証と、会社・チーム単位でのデータの分離（他社のデータを参照できない仕組み）</li>
          <li>保存データと通信の暗号化、定期的なバックアップと復旧手順の整備</li>
          <li>重要な操作の記録（監査ログ）と、契約終了時のデータ削除</li>
        </ul>
      </section>

      <section>
        <h2>8. 脆弱性の報告</h2>
        {hasContact ? (
          <p>
            セキュリティ上の問題を見つけた場合は、
            <a href={contact} className="text-accent underline underline-offset-4">
              {contact.replace(/^mailto:/, "")}
            </a>
            までご連絡ください。報告の窓口は
            <a href="/.well-known/security.txt" className="text-accent underline underline-offset-4">
              security.txt
            </a>
            でも公開しています。
          </p>
        ) : (
          <p>報告の窓口は現在準備中です。開設後、このページと security.txt で案内します。</p>
        )}
      </section>
    </LegalPage>
  );
}
