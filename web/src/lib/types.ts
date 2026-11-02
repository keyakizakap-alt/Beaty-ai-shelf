export type EngineId = "chatgpt" | "gemini" | "claude" | "perplexity" | "other";

export const ENGINES: { id: EngineId; label: string }[] = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "gemini", label: "Gemini" },
  { id: "claude", label: "Claude" },
  { id: "perplexity", label: "Perplexity" },
  { id: "other", label: "その他" },
];

export interface Brand {
  id: string;
  name: string;
  /** 表記ゆれ（英字・カタカナ・略称など） */
  aliases: string[];
  isOwn: boolean;
}

export interface Profile {
  category: string;
  concerns: string[];
  ageBands: string[];
  priceBand: string;
}

export interface Question {
  id: string;
  text: string;
  /** ライブラリから自動生成された場合 true */
  generated: boolean;
}

export interface Mention {
  brandId: string;
  /** 回答内で何番目に登場したか（1始まり） */
  rank: number;
  /** 正規化前の回答テキスト中の最初の出現位置 */
  index: number;
  matched: string;
}

export interface Observation {
  id: string;
  questionId: string;
  engine: EngineId;
  answerText: string;
  createdAt: string;
  mentions: Mention[];
}

export interface Workspace {
  version: 1;
  brands: Brand[];
  profile: Profile;
  questions: Question[];
  observations: Observation[];
  updatedAt: string;
  /** サンプルデータの場合 true（画面に常に表示する） */
  sample?: boolean;
}
