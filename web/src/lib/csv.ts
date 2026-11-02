import { ENGINES, type Workspace } from "./types";

function cell(v: string | number): string {
  const s = String(v);
  // 表計算ソフトでの数式実行（CSVインジェクション）を防ぐ
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** 記録を1行1回答のCSVにする（Excelで文字化けしないようBOM付き） */
export function observationsToCsv(ws: Workspace): string {
  const q = new Map(ws.questions.map((x) => [x.id, x.text]));
  const b = new Map(ws.brands.map((x) => [x.id, x.name]));
  const e = new Map(ENGINES.map((x) => [x.id, x.label]));
  const own = ws.brands.find((x) => x.isOwn);
  const header = ["記録日時", "AI", "質問", "自社の順位", "登場したブランド（登場順）", "回答"];
  const rows = ws.observations.map((o) => {
    const ownM = own ? o.mentions.find((m) => m.brandId === own.id) : undefined;
    return [
      o.createdAt,
      e.get(o.engine) ?? o.engine,
      q.get(o.questionId) ?? "",
      ownM ? ownM.rank : "",
      o.mentions.map((m) => b.get(m.brandId) ?? "").join(" > "),
      o.answerText,
    ];
  });
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
