/* axe-core による自動アクセシビリティ検査（WCAG 2.2 A/AA ルール）。
 * 使い方: BASE_URL=http://localhost:3100 node e2e/a11y.cjs */
const { chromium } = require("playwright");
const axePath = require.resolve("axe-core/axe.min.js");

const BASE = process.env.BASE_URL || "http://localhost:3100";
const PAGES = ["/", "/diagnosis", "/app", "/app/setup", "/app/questions", "/app/record", "/app/report", "/app/check", "/app/data", "/terms", "/privacy"];

(async () => {
  const browser = await chromium.launch();
  let total = 0;
  for (const scheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
    const page = await ctx.newPage();
    // サンプルデータを入れて、データありの状態も検査する
    await page.goto(BASE + "/app");
    await page.getByRole("button", { name: "サンプルで試す" }).click();
    await page.waitForURL("**/app/report");
    for (const p of PAGES) {
      await page.goto(BASE + p);
      await page.waitForLoadState("networkidle");
      await page.addScriptTag({ path: axePath });
      const res = await page.evaluate(async () =>
        axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] } }),
      );
      const v = res.violations;
      total += v.length;
      console.log(`${scheme} ${p}: ${v.length ? "NG" : "ok"}`);
      for (const x of v) console.log(`   - [${x.impact}] ${x.id}: ${x.help} (${x.nodes.length}) ${x.nodes[0]?.target}`);
    }
    await ctx.close();
  }
  await browser.close();
  process.exit(total ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
