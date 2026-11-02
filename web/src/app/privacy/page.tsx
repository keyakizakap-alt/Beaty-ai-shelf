import type { Metadata } from "next";
import { LegalPage } from "../legal-layout";

export const metadata: Metadata = { title: "プライバシーポリシー" };

export default function PrivacyPage() {
  return (
    <LegalPage title="プライバシーポリシー（試作版）" updated="2026年11月2日">
      <section>
        <h2>1. 取得する情報</h2>
        <p>本サービスの試作版は、会員登録を必要とせず、氏名やメールアドレスなどの個人情報を取得しません。</p>
      </section>
      <section>
        <h2>2. 入力したデータの保存場所</h2>
        <p>利用者が入力したブランド名、質問、AIの回答、表現チェックの文章は、利用者のブラウザ内の保存領域（ローカルストレージ）にのみ保存され、運営者のサーバーや第三者には送信されません。表現チェックの文章は保存されず、画面を閉じると消えます。</p>
      </section>
      <section>
        <h2>3. 削除方法</h2>
        <p>「データ管理」画面の「すべてのデータを削除」から、いつでも削除できます。ブラウザのサイトデータを消去した場合も削除されます。</p>
      </section>
      <section>
        <h2>4. アクセスログ</h2>
        <p>本サービスを配信するホスティング事業者が、障害対応や不正利用防止のために、IPアドレス等のアクセスログを記録する場合があります。</p>
      </section>
      <section>
        <h2>5. 改定</h2>
        <p>AIへの自動質問など、外部サービスへデータを送信する機能を追加する場合は、送信先と目的を明記したうえで本ポリシーを改定します。</p>
      </section>
    </LegalPage>
  );
}
