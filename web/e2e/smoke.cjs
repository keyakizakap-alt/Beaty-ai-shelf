/* 主要フローのE2Eスモークテスト。BASE_URL のサーバーに対して実行する。
 * 使い方: BASE_URL=http://localhost:3100 SHOTS=./shots node e2e/smoke.cjs */
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://localhost:3100";
const SHOTS = process.env.SHOTS;
let failures = 0;

function check(cond, msg) {
  if (cond) console.log("  ok  " + msg);
  else {
    failures++;
    console.log("  NG  " + msg);
  }
}

async function shot(page, name) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage: true });
}

(async () => {
  const browser = await chromium.launch();
  for (const vp of [
    { name: "mobile", viewport: { width: 390, height: 844 } },
    { name: "desktop", viewport: { width: 1280, height: 900 } },
  ]) {
    console.log(`\n[${vp.name}]`);
    const ctx = await browser.newContext({ viewport: vp.viewport, locale: "ja-JP" });
    await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    // 1. トップページ
    await page.goto(BASE + "/");
    check((await page.locator("h1").innerText()).includes("薦めていますか"), "トップの見出しが表示される");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(!overflow, "横スクロールが発生しない");
    await shot(page, `${vp.name}-01-top`);
    check(await page.getByRole("heading", { name: "料金" }).isVisible(), "料金が表示される");

    // 1b. 無料診断（APIキーが無い環境では「準備中」を正直に表示し、偽の結果を出さない）
    await page.getByRole("link", { name: "自社ブランドを無料で診断" }).click();
    await page.waitForURL("**/diagnosis");
    const keysConfigured = process.env.EXPECT_DIAGNOSIS === "1";
    await page.locator("[aria-busy='true']").waitFor({ state: "detached", timeout: 10000 }).catch(() => {});
    if (keysConfigured) {
      check(await page.getByRole("button", { name: "無料で診断する" }).isVisible(), "診断フォームが表示される");
    } else {
      check(await page.getByText("現在準備中です").isVisible(), "キー未設定時は準備中と表示される");
      check((await page.getByRole("button", { name: "無料で診断する" }).count()) === 0, "キー未設定時は診断ボタンを出さない");
      check(await page.getByRole("link", { name: "無料の記録ツールを使う" }).isVisible(), "代わりの記録ツールへ案内する");
    }
    await shot(page, `${vp.name}-01b-diagnosis`);

    // 2. 未設定でレポートを開くと設定を促す
    await page.goto(BASE + "/app/report");
    check(await page.getByText("まず、自社ブランドと競合ブランドを設定してください").isVisible(), "未設定時は設定を促す");

    // 3. ブランド設定（入力エラー → 正常）
    await page.goto(BASE + "/app/setup");
    await page.getByRole("button", { name: "保存する" }).click();
    check(await page.getByRole("alert").getByText("自社ブランド名を入力してください").isVisible(), "必須エラーが表示される");
    await page.getByLabel("ブランド名", { exact: true }).fill("ミナモ");
    await page.getByLabel("別の表記（読点で区切る）").fill("MINAMO、みなも");
    await page.getByLabel("競合 1：ブランド名").fill("ルーセント");
    await page.getByRole("button", { name: "競合ブランドを追加" }).click();
    await page.getByLabel("競合 2：ブランド名").fill("アオバ製薬");
    await page.getByRole("button", { name: "敏感肌" }).click();
    await shot(page, `${vp.name}-02-setup`);
    await page.getByRole("button", { name: "保存する" }).click();
    await page.waitForURL("**/app/questions");
    const qCount = await page.locator("ol > li").count();
    check(qCount >= 5, `質問が自動作成される（${qCount}件）`);
    await shot(page, `${vp.name}-03-questions`);

    // 4. 回答の記録
    await page.getByRole("link", { name: "記録する" }).first().click();
    await page.waitForURL("**/app/record**");
    await page.getByLabel("AIの回答").fill("おすすめは、ルーセントの化粧水と、MINAMOのローションです。アオバ製薬も人気です。");
    check(await page.getByText("2番目").first().isVisible(), "自社ブランドの順位がプレビューされる");
    await shot(page, `${vp.name}-04-record`);
    await page.getByRole("button", { name: "この回答を保存" }).click();
    check(await page.getByRole("status").getByText("2番目に登場").isVisible(), "保存結果が表示される");

    await page.locator("label", { hasText: "Gemini" }).click();
    await page.getByLabel("AIの回答").fill("乾燥肌にはアオバ製薬の化粧水がおすすめです。");
    await page.getByRole("button", { name: "この回答を保存" }).click();
    check(await page.getByText("自社ブランドは登場していません").first().isVisible(), "自社が出ない回答も保存できる");

    // 5. レポート
    await page.getByRole("navigation", { name: /メインメニュー/ }).first().locator("a", { hasText: /レポート/ }).click().catch(async () => {
      await page.goto(BASE + "/app/report");
    });
    await page.goto(BASE + "/app/report");
    const statText = await page.getByLabel("主な指標").innerText();
    check(statText.includes("50%"), "自社の登場割合が50%と計算される");
    check(await page.getByText("改善の手がかり").isVisible(), "改善の手がかりが表示される");
    check(await page.getByText(/1件中1件で自社が登場せず|件で自社が登場せず/).first().isVisible(), "競合だけが登場した質問が出る");
    await shot(page, `${vp.name}-05-report`);

    // 6. 再読み込みしてもデータが残る
    await page.reload();
    check((await page.getByLabel("主な指標").innerText()).includes("50%"), "再読み込み後もデータが残る");

    // 7. 表現チェック
    await page.goto(BASE + "/app/check");
    await page.getByLabel("確認する文章").fill("たった1週間でシミが消える！皮膚科医も推薦。肌荒れを防ぐ化粧水です。");
    check(await page.getByText("要修正").first().isVisible(), "違反の可能性がある表現を検出する");
    const items = await page.locator("ol li").filter({ hasText: "根拠" }).count();
    check(items >= 2, `指摘が複数表示される（${items}件）`);
    await shot(page, `${vp.name}-06-check`);

    // 8. データ削除
    await page.goto(BASE + "/app/data");
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "すべてのデータを削除" }).click();
    await page.waitForURL(BASE + "/app");
    check(await page.getByRole("heading", { name: "はじめに" }).isVisible(), "削除後は初期状態に戻る");

    // 9. サンプル
    await page.getByRole("button", { name: "サンプルで試す" }).click();
    await page.waitForURL("**/app/report");
    check(await page.getByText("架空のブランドで作ったサンプルデータ").isVisible(), "サンプル表示中であることが明示される");
    await shot(page, `${vp.name}-07-sample-report`);

    check(errors.length === 0, `コンソールエラーなし ${errors.length ? JSON.stringify(errors.slice(0, 3)) : ""}`);
    await ctx.close();
  }
  await browser.close();
  console.log(failures ? `\n${failures}件失敗` : "\nすべて成功");
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
