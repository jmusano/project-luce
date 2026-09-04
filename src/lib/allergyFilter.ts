/**
 * Local tree-nut allergy filter for Naomi.
 * Pure functions only — never show tree nuts as food.
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
  "tree nut",
  "tree nuts",
  "nut butter",
  "peanut butter",
  "almond butter",
  "mixed nuts",
] as const;

const TEACH_LINE = "Nuts make Naomi sick — don't eat them.";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True if text mentions a tree nut as something edible / snack / meal. */
export function containsTreeNutFood(text: string): boolean {
  const lower = text.toLowerCase();
  return TREE_NUT_FOOD_TERMS.some((term) => {
    const re = new RegExp("\\b" + escapeRegExp(term) + "\\b", "i");
    return re.test(lower);
  });
}

export type PictureChoice = {
  id: string;
  emoji: string;
  label: string;
};

/**
 * Strip or rewrite any picture choice whose label is tree-nut food.
 * Safe replacements keep the turn playable for a 3yo.
 */
export function filterPictureChoices(choices: PictureChoice[]): PictureChoice[] {
  return choices.map((c) => {
    if (!containsTreeNutFood(c.label)) return c;
    return {
      ...c,
      emoji: "🍎",
      label: "apple",
    };
  });
}

/**
 * Scrub food-related speech/captions. Optionally weave a short teach line.
 */
export function filterSpeechText(
  text: string,
  options: { includeTeachLine?: boolean } = {},
): string {
  let out = text;
  for (const term of TREE_NUT_FOOD_TERMS) {
    const re = new RegExp("\\b" + escapeRegExp(term) + "\\b", "gi");
    out = out.replace(re, "yummy fruit");
  }
  out = out.replace(/\byummy fruit\s+yummy fruit\b/gi, "yummy fruit");

  if (options.includeTeachLine && !out.includes("Nuts make Naomi sick")) {
    out = out.trim() + " " + TEACH_LINE;
  }
  return out.trim();
}

export function getAllergyTeachLine(): string {
  return TEACH_LINE;
}
