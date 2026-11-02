/**
 * 化粧品広告表現の一次チェック（ルールベース・LLM不使用）。
 *
 * 根拠：
 * - 平成23年7月21日 薬食発0721第1号「化粧品の効能の範囲の改正について」（56項目）
 * - 静岡県「違反事例（誇大広告）」資料（化粧品の不可表現の例示）
 *   https://www.pref.shizuoka.jp/_res/projects/default_project/_page_/001/025/361/ihanjirei66.pdf
 * - 医薬品等適正広告基準（平成29年9月29日 薬生発0929第4号）の考え方（最大級表現、安全性の保証、医薬関係者の推薦など）
 *
 * 注意：違反かどうかは広告全体の文脈で行政が総合的に判断する。本チェックは見落とし防止の一次チェックであり、
 * 適法性を保証しない。
 */

export type Severity = "high" | "medium" | "low";
export type ProductType = "cosmetic" | "quasi_drug";

export interface Rule {
  id: string;
  pattern: RegExp;
  severity: Severity;
  category: string;
  reason: string;
  suggestion: string;
  source: string;
  /** 医薬部外品で、承認された効能の範囲なら認められうる表現 */
  quasiDrugMayAllow?: boolean;
  /** 一致の直前（最大20文字）がこの正規表現に一致し、かつ一致部分が allowMatch にも一致すれば、56項目の範囲として除外する */
  allowIfPrecededBy?: RegExp;
  allowMatch?: RegExp;
}

const SRC_SHIZUOKA = "静岡県「違反事例（誇大広告）」";
const SRC_56 = "化粧品の効能の範囲（薬食発0721第1号）";
const SRC_STD = "医薬品等適正広告基準";

export const RULES: Rule[] = [
  {
    id: "medical",
    pattern: /(治る|治す|治ります|治療|治癒|快方|完治|改善(する|します|させ))/g,
    severity: "high",
    category: "医薬品的な表現",
    reason: "「治る」「治療」「改善」などは医薬品の効能を示す表現で、化粧品では使えません。",
    suggestion: "化粧品の効能の範囲（例：「肌を整える」「肌荒れを防ぐ」）に言い換えてください。",
    source: SRC_SHIZUOKA,
  },
  {
    id: "regenerate",
    pattern: /(再生|蘇る|よみがえる|若返|細胞(を|レベル|から)|デトックス|発毛|育毛)/g,
    severity: "high",
    category: "医薬品的な表現",
    reason: "「再生」「デトックス」「発毛」などは化粧品の効能を超える表現です。",
    suggestion: "「肌にはりを与える」「頭皮、毛髪をすこやかに保つ」など56項目の範囲で表現してください。",
    source: SRC_SHIZUOKA,
  },
  {
    id: "wrinkle",
    pattern: /(シワ|しわ|皺|小じわ|小ジワ)(が|を)?(消え|消す|なくな|無くな|なくす|解消|予防|防ぐ|改善|減ら|伸ば)/g,
    severity: "high",
    category: "シワ",
    reason: "シワの予防・解消は化粧品では表現できません。",
    suggestion:
      "効能評価試験で確認済みであれば「乾燥による小じわを目立たなくする」と表現できます（56項目の(56)）。",
    source: SRC_SHIZUOKA,
  },
  {
    id: "sagging",
    pattern: /(たるみ|タルミ|ほうれい線)(が|を)?(消え|解消|なくな|改善|引き上げ|リフトアップ)/g,
    severity: "high",
    category: "シワ・タルミ",
    reason: "タルミの解消などは化粧品の効能を超える表現です。",
    suggestion: "「肌をひきしめる」「肌にはりを与える」など56項目の範囲で表現してください。",
    source: SRC_SHIZUOKA,
  },
  {
    id: "spots",
    pattern: /(シミ|しみ|ソバカス|そばかす|色素沈着|ニキビ跡|ニキビ痕|炎症痕)(が|を)?(消え|消す|薄く|うすく|なくな|改善|出来にくい|できにくい|防ぐ|予防)/g,
    severity: "high",
    category: "シミ・美白",
    reason:
      "シミ・ソバカスを消す・薄くするなどの表現は化粧品では使えません。「防ぐ」も化粧品では「日やけによる」場合に限られます。",
    suggestion:
      "日焼け止めなら「日やけによるシミ、ソバカスを防ぐ」（56項目の(37)）。医薬部外品は承認された効能（例：メラニンの生成を抑え、しみ、そばかすを防ぐ）の範囲で表現してください。",
    source: SRC_SHIZUOKA,
    quasiDrugMayAllow: true,
    allowIfPrecededBy: /日(やけ|焼け)による(シミ|しみ)?[、,]?\s*$/,
    allowMatch: /(防ぐ)$/,
  },
  {
    id: "whitening",
    pattern: /(美白|ホワイトニング|肌が白くなる|肌を白く(する|します))/g,
    severity: "medium",
    category: "シミ・美白",
    reason: "「美白」は医薬部外品で承認された効能の範囲でのみ使える表現です。化粧品では使えません。",
    suggestion:
      "化粧品なら「メーキャップ効果により肌を明るく見せる」など。医薬部外品は「メラニンの生成を抑え、しみ、そばかすを防ぐ」の意味である旨を併記してください。",
    source: SRC_SHIZUOKA,
    quasiDrugMayAllow: true,
  },
  {
    id: "acne",
    pattern: /(ニキビ|にきび|吹き出物|アクネ)(が|を)?(治|消え|なくな|改善|撃退|予防|防ぐ)/g,
    severity: "high",
    category: "ニキビ",
    reason: "ニキビを治す・予防する表現は化粧品では使えません（洗顔料の「洗浄によりニキビを防ぐ」を除く）。",
    suggestion: "洗顔料なら「（洗浄により）ニキビ、アセモを防ぐ」（56項目の(18)）と表現できます。",
    source: SRC_SHIZUOKA,
    quasiDrugMayAllow: true,
    allowIfPrecededBy: /洗浄により[）)]?\s*$/,
    allowMatch: /防ぐ$/,
  },
  {
    id: "aging",
    pattern: /(アンチエイジング|老化(防止|を防|予防)|若さを取り戻|エイジングを止|抗老化|抗加齢)/g,
    severity: "high",
    category: "エイジング",
    reason: "「アンチエイジング」「老化防止」などは化粧品の効能を超えるエイジング表現です。",
    suggestion: "「エイジングケア（年齢に応じたお手入れ）」のように、意味を明示した表現にしてください。",
    source: SRC_SHIZUOKA,
  },
  {
    id: "slimming",
    pattern: /(痩せ|やせる|痩身|スリミング|ファーミング|セルライト|脂肪(燃焼|分解|を落))/g,
    severity: "high",
    category: "痩身",
    reason: "痩身を示す表現は化粧品では使えません。",
    suggestion: "メーキャップ効果（例：「すっきりとした印象に見せる」）の範囲で表現してください。",
    source: SRC_SHIZUOKA,
  },
  {
    id: "hair_repair",
    pattern: /(髪|毛髪)(が|を|の)?(回復|修復|補修|本質から改善|蘇)/g,
    severity: "medium",
    category: "ヘアケア",
    reason: "「傷んだ髪が回復」「髪の本質から改善」などは化粧品の効能を超える表現とされています。",
    suggestion: "「毛髪にはり、こしを与える」「裂毛、切毛、枝毛を防ぐ」など56項目の範囲で表現してください。",
    source: SRC_SHIZUOKA,
  },
  {
    id: "pores",
    pattern: /(毛穴)(が|を)?(消え|なくな|無くな|引き締まる|閉じる|小さくな)/g,
    severity: "medium",
    category: "毛穴",
    reason: "毛穴が消える・小さくなるなどの表現は化粧品の効能を超える可能性が高い表現です。",
    suggestion: "「肌のキメを整える」「肌をひきしめる」、またはメーキャップ効果として「毛穴を目立たなく見せる」と表現してください。",
    source: SRC_56,
  },
  {
    id: "penetration",
    pattern: /(真皮|肌の奥|肌の内側|細胞)(まで|に)?(浸透|届)/g,
    severity: "medium",
    category: "浸透",
    reason: "角質層を超えて浸透するかのような表現は認められません。",
    suggestion: "「角質層まで浸透」とし、範囲が角質層であることを明記してください。",
    source: SRC_56,
  },
  {
    id: "disease",
    pattern: /(アトピー|湿疹|皮膚炎|炎症を(抑|鎮)|抗炎症|殺菌|抗菌|花粉症)/g,
    severity: "high",
    category: "疾病・医薬的作用",
    reason: "疾病名や、炎症を抑える・殺菌などの医薬的作用は化粧品では表現できません。",
    suggestion: "疾病名を使わず、「肌荒れを防ぐ」「皮膚をすこやかに保つ」などで表現してください。",
    source: SRC_STD,
  },
  {
    id: "safety",
    pattern: /(副作用(が|は)?(ない|なし|ゼロ)|安全(です|性100|性は保証)|100%安全|絶対(に)?(安全|大丈夫)|誰にでも合う|肌トラブル(は|が)?(起きない|起こらない|ゼロ))/g,
    severity: "high",
    category: "安全性の保証",
    reason: "安全性を保証する表現は、適正広告基準で禁止されています。",
    suggestion: "「すべての方に肌トラブルが起きないわけではありません」などの注意書きを添え、保証する表現を避けてください。",
    source: SRC_STD,
  },
  {
    id: "superlative",
    pattern: /(最高|最強|世界初|日本初|業界初|No\.?\s?1|ナンバーワン|ナンバー1|一番効く|最も効く|究極)/gi,
    severity: "medium",
    category: "最大級・優位性の表現",
    reason: "効能や安全性について最大級の表現は認められません。No.1などは客観的な根拠と調査概要の明記が必要です。",
    suggestion: "根拠（調査機関・期間・対象）を併記するか、表現を削除してください。",
    source: SRC_STD,
  },
  {
    id: "doctor",
    pattern: /(医師|皮膚科医|薬剤師|ドクター|専門医|美容皮膚科)(が|も)?(推薦|推奨|おすすめ|監修|愛用|認めた)/g,
    severity: "high",
    category: "医薬関係者の推薦",
    reason: "医薬関係者が推薦・認めたかのような表現は、適正広告基準で禁止されています。",
    suggestion: "推薦・推奨の表現を削除してください。",
    source: SRC_STD,
  },
  {
    id: "instant",
    pattern: /(即効|すぐに効|一晩で|1日で|たった\d+(日|週間|ヶ月|か月|カ月)で|使った瞬間|劇的|奇跡)/g,
    severity: "medium",
    category: "効果の誇張",
    reason: "効果の速さや程度を誇張する表現は誤解を招くおそれがあります（景品表示法の優良誤認にも注意）。",
    suggestion: "使用感（例：「使うたびにしっとり」）など、事実に基づく表現にしてください。",
    source: SRC_STD,
  },
  {
    id: "effect_guarantee",
    pattern: /(必ず|確実に|100%)(効|変わ|実感)/g,
    severity: "high",
    category: "効果の保証",
    reason: "効能・効果を保証する表現は認められません。",
    suggestion: "保証する表現を削除してください。",
    source: SRC_STD,
  },
];

export interface Finding {
  ruleId: string;
  start: number;
  end: number;
  text: string;
  severity: Severity;
  category: string;
  reason: string;
  suggestion: string;
  source: string;
  /** 医薬部外品として、承認効能の範囲なら認められうる */
  conditional: boolean;
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  high: "要修正",
  medium: "要確認",
  low: "参考",
};

export function checkText(input: string, productType: ProductType = "cosmetic"): Finding[] {
  const findings: Finding[] = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    for (const m of input.matchAll(rule.pattern)) {
      const start = m.index ?? 0;
      if (rule.allowIfPrecededBy && rule.allowMatch) {
        const before = input.slice(Math.max(0, start - 20), start);
        if (rule.allowIfPrecededBy.test(before) && rule.allowMatch.test(m[0])) continue;
      }
      const conditional = productType === "quasi_drug" && !!rule.quasiDrugMayAllow;
      findings.push({
        ruleId: rule.id,
        start,
        end: start + m[0].length,
        text: m[0],
        severity: conditional ? "low" : rule.severity,
        category: rule.category,
        reason: conditional
          ? `${rule.reason}医薬部外品の場合、承認された効能・効果の範囲内であれば使用できます。承認書の記載と照合してください。`
          : rule.reason,
        suggestion: rule.suggestion,
        source: rule.source,
        conditional,
      });
    }
  }
  // 同じ範囲に複数のルールが当たった場合は重い方を残す
  const order: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => a.start - b.start || order[a.severity] - order[b.severity]);
  const result: Finding[] = [];
  for (const f of findings) {
    const dup = result.find((r) => f.start < r.end && r.start < f.end);
    if (dup) continue;
    result.push(f);
  }
  return result;
}

/** 化粧品の効能の範囲（56項目）。画面で参照用に表示する */
export const COSMETIC_EFFICACY_56: string[] = [
  "頭皮、毛髪を清浄にする。",
  "香りにより毛髪、頭皮の不快臭を抑える。",
  "頭皮、毛髪をすこやかに保つ。",
  "毛髪にはり、こしを与える。",
  "頭皮、毛髪にうるおいを与える。",
  "頭皮、毛髪のうるおいを保つ。",
  "毛髪をしなやかにする。",
  "クシどおりをよくする。",
  "毛髪のつやを保つ。",
  "毛髪につやを与える。",
  "フケ、カユミがとれる。",
  "フケ、カユミを抑える。",
  "毛髪の水分、油分を補い保つ。",
  "裂毛、切毛、枝毛を防ぐ。",
  "髪型を整え、保持する。",
  "毛髪の帯電を防止する。",
  "（汚れをおとすことにより）皮膚を清浄にする。",
  "（洗浄により）ニキビ、アセモを防ぐ（洗顔料）。",
  "肌を整える。",
  "肌のキメを整える。",
  "皮膚をすこやかに保つ。",
  "肌荒れを防ぐ。",
  "肌をひきしめる。",
  "皮膚にうるおいを与える。",
  "皮膚の水分、油分を補い保つ。",
  "皮膚の柔軟性を保つ。",
  "皮膚を保護する。",
  "皮膚の乾燥を防ぐ。",
  "肌を柔らげる。",
  "肌にはりを与える。",
  "肌にツヤを与える。",
  "肌を滑らかにする。",
  "ひげを剃りやすくする。",
  "ひげそり後の肌を整える。",
  "あせもを防ぐ（打粉）。",
  "日やけを防ぐ。",
  "日やけによるシミ、ソバカスを防ぐ。",
  "芳香を与える。",
  "爪を保護する。",
  "爪をすこやかに保つ。",
  "爪にうるおいを与える。",
  "口唇の荒れを防ぐ。",
  "口唇のキメを整える。",
  "口唇にうるおいを与える。",
  "口唇をすこやかにする。",
  "口唇を保護する。口唇の乾燥を防ぐ。",
  "口唇の乾燥によるカサツキを防ぐ。",
  "口唇を滑らかにする。",
  "ムシ歯を防ぐ（使用時にブラッシングを行う歯みがき類）。",
  "歯を白くする（使用時にブラッシングを行う歯みがき類）。",
  "歯垢を除去する（使用時にブラッシングを行う歯みがき類）。",
  "口中を浄化する（歯みがき類）。",
  "口臭を防ぐ（歯みがき類）。",
  "歯のやにを取る（使用時にブラッシングを行う歯みがき類）。",
  "歯石の沈着を防ぐ（使用時にブラッシングを行う歯みがき類）。",
  "乾燥による小ジワを目立たなくする。（効能評価試験で確認した場合に限る）",
];
