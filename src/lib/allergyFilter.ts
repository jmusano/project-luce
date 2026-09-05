/**
 * Local tree-nut allergy filter for Naomi.
 * Pure functions only — never show tree nuts as food.
 * Hard interrupt when nut-food is mentioned; may teach they make Naomi sick.
 */

export const TREE_NUT_FOOD_TERMS = [
  "peanut",
  "peanuts",
  "almond",
  "almonds",
  "cashew",
  "cashews",
  "walnut",
  "walnuts",
  "pecan",
  "pecans",
  "hazelnut",
  "hazelnuts",
  "pistachio",
  "pistachios",
  "macadamia",
  "macadamias",
  "brazil nut",
  "brazil nuts",
  "pine nut",
  "pine nuts",
  "chestnut",
  "chestnuts",
  "tree nut",
  "tree nuts",
  "nut butter",
  "peanut butter",
  "almond butter",
  "cashew butter",
  "mixed nuts",
  "nutella",
  "nougat",
  // bare forms last — word-boundary safe vs doughnut/coconut
  "nuts",
  "nut",
] as const;

/** Food emoji that must never appear as a picture choice. */
export const TREE_NUT_FOOD_EMOJIS = ["🥜"] as const;

const TEACH_LINE = "Nuts make Naomi sick — don't eat them.";

const HARD_INTERRUPT_SPEECH =
  "Whoa — stop. Nuts make Naomi sick — don't eat them. We never eat those. Ask Mommy or Daddy before any snack. Want an apple, or a banana?";

const SAFE_FALLBACK_A: PictureChoice = {
  id: "safe-apple",
  emoji: "🍎",
  label: "apple",
};

const SAFE_FALLBACK_B: PictureChoice = {
  id: "safe-banana",
  emoji: "🍌",
  label: "banana",
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True if text mentions a tree nut as food (or uses a nut-food emoji). */
export function containsTreeNutFood(text: string): boolean {
  if (!text) return false;
  for (const emoji of TREE_NUT_FOOD_EMOJIS) {
    if (text.includes(emoji)) return true;
  }
  const lower = text.toLowerCase();
  // Longer phrases first so "peanut butter" wins before "peanut" / "nut"
  const terms = [...TREE_NUT_FOOD_TERMS].sort((a, b) => b.length - a.length);
  return terms.some((term) => {
    const re = new RegExp("\\b" + escapeRegExp(term) + "\\b", "i");
    return re.test(lower);
  });
}

export type PictureChoice = {
  id: string;
  emoji: string;
  label: string;
};

function isNutFoodChoice(c: PictureChoice): boolean {
  if (TREE_NUT_FOOD_EMOJIS.some((e) => c.emoji.includes(e))) return true;
  return containsTreeNutFood(c.label) || containsTreeNutFood(c.id);
}

/**
 * Strip or rewrite any picture choice whose label/emoji/id is tree-nut food.
 * Safe replacements keep the turn playable for a 3yo. Never leaves a nut shown.
 */
export function filterPictureChoices(choices: PictureChoice[]): PictureChoice[] {
  const safePool = [SAFE_FALLBACK_A, SAFE_FALLBACK_B];
  let safeIdx = 0;
  const usedLabels = new Set<string>();

  return choices.map((c) => {
    if (!isNutFoodChoice(c)) {
      usedLabels.add(c.label.toLowerCase());
      return c;
    }
    // Prefer unique safe replacements when both slots were nuts
    let replacement = safePool[safeIdx % safePool.length];
    safeIdx += 1;
    if (usedLabels.has(replacement.label.toLowerCase())) {
      replacement = safePool[safeIdx % safePool.length];
      safeIdx += 1;
    }
    usedLabels.add(replacement.label.toLowerCase());
    return {
      ...c,
      id: c.id.startsWith("safe-") ? c.id : `safe-${c.id}`,
      emoji: replacement.emoji,
      label: replacement.label,
    };
  });
}

/**
 * Scrub food-related speech/captions. If the source mentioned nut food,
 * always append the teach line (hard local block — never normalize nuts as food).
 */
export function filterSpeechText(
  text: string,
  options: { includeTeachLine?: boolean } = {},
): string {
  const hit = containsTreeNutFood(text);
  // Protect the intentional teach line from nut-word scrubbing.
  const KEEP = "<<<LUCE_TEACH>>>";
  let out = text.replaceAll(TEACH_LINE, KEEP);
  const terms = [...TREE_NUT_FOOD_TERMS].sort((a, b) => b.length - a.length);
  for (const term of terms) {
    const re = new RegExp("\\b" + escapeRegExp(term) + "\\b", "gi");
    out = out.replace(re, "yummy fruit");
  }
  for (const emoji of TREE_NUT_FOOD_EMOJIS) {
    out = out.split(emoji).join("🍎");
  }
  out = out.replace(/\byummy fruit(\s+yummy fruit)+\b/gi, "yummy fruit");
  out = out.replaceAll(KEEP, TEACH_LINE);

  const shouldTeach =
    options.includeTeachLine === true || hit;
  if (shouldTeach && !out.includes("Nuts make Naomi sick")) {
    out = out.trim() + " " + TEACH_LINE;
  }
  return out.trim();
}

export function getAllergyTeachLine(): string {
  return TEACH_LINE;
}

/** True when kid (or any input) triggers the hard local allergy interrupt. */
export function shouldHardAllergyInterrupt(text: string | undefined | null): boolean {
  if (!text) return false;
  return containsTreeNutFood(text);
}

/**
 * Hard local interrupt turn payload — never continue a story beat that
 * treats nuts as food. Teach + two safe pictures only.
 */
export function buildAllergyInterruptTurn(naomiSaid: string): {
  speech: string;
  captions: { naomi?: string; luce: string };
  twoPictureChoices: [PictureChoice, PictureChoice];
} {
  const speech = HARD_INTERRUPT_SPEECH;
  return {
    speech,
    captions: {
      naomi: naomiSaid || undefined,
      luce: speech,
    },
    twoPictureChoices: [
      { ...SAFE_FALLBACK_A },
      { ...SAFE_FALLBACK_B },
    ],
  };
}
