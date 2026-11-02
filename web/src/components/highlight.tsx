import type { ReactNode } from "react";

export interface Span {
  start: number;
  end: number;
  label: string;
  className?: string;
}

/** テキストの指定範囲を <mark> で強調する（範囲は重ならない前提で、重なる場合は先のものを優先） */
export function Highlight({ text, spans }: { text: string; spans: Span[] }) {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  const parts: ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((s, i) => {
    if (s.start < cursor) return;
    if (s.start > cursor) parts.push(text.slice(cursor, s.start));
    parts.push(
      <mark key={i} className={s.className} title={s.label}>
        {text.slice(s.start, s.end)}
        <span className="sr-only">（{s.label}）</span>
      </mark>,
    );
    cursor = s.end;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <p className="whitespace-pre-wrap break-words leading-relaxed">{parts}</p>;
}
