export interface ExpenseRecord {
  date: string;
  category: string;
  description: string;
  amount: number;
  uncleared: boolean;
}

type CategoryMap = Record<string, string[]>;

const EXPENSE_CATEGORIES: CategoryMap = {
  Shopping: [
    "book", "gift", "clothes", "shoes", "bag", "amazon", "lazada",
    "shopee", "sofa", "tuya", "adapter", "phone", "belt", "coffee table",
    "battery", "key", "ladle", "lamp", "perfume", "rug", "stairs",
    "home appliance", "housewares", "shirt", "shorts", "toothpaste",
  ],
  Food: ["food", "lunch", "dinner", "breakfast", "snack", "meal", "drink"],
  Transport: [
    "mrt", "bts", "taxi", "motorcycle", "bus", "rabbit", "grab", "uber",
    "train", "flight", "tsubaru", "airport", "express", "two row car",
    "arl", "srt",
  ],
  Utilities: [
    "mobile", "top-up", "mobile top up", "icloud", "internet", "bill",
    "subscription", "netflix", "spotify",
  ],
  Entertainment: [
    "movie", "cinema", "game", "concert", "ticket", "show", "party",
    "bar", "club", "youtube", "disney", "badminton",
  ],
  Personal: [
    "haircut", "gym", "sport", "massage", "spa", "doctor", "medicine",
    "driving", "medical", "personal care",
  ],
  "Housing/Car": ["car", "rent", "condo", "electricity", "water", "home", "house"],
};

function autoCategory(description: string): string {
  const lower = description.toLowerCase();
  for (const [cat, keywords] of Object.entries(EXPENSE_CATEGORIES)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return cat;
    }
  }
  return "Other";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Parse an /expense or /income command text.
 * Returns null if format is invalid.
 */
export function parseRecordMessage(
  text: string,
  isExpense: boolean
): ExpenseRecord | null {
  const clean = text.replace(/^\/(expense|income)\s*/i, "").trim();
  if (!clean) return null;

  const parts = clean.split(/\s+/);
  if (parts.length < 2) return null;

  const amount = parseFloat(parts[0]);
  if (isNaN(amount)) return null;

  if (isExpense) {
    const lastWord = parts[parts.length - 1];
    const capitalised = lastWord.charAt(0).toUpperCase() + lastWord.slice(1);

    let category: string;
    let description: string;

    if (EXPENSE_CATEGORIES[capitalised] !== undefined) {
      category = capitalised;
      description = parts.slice(1, -1).join(" ");
    } else {
      description = parts.slice(1).join(" ");
      category = autoCategory(description);
    }

    return { date: todayIso(), category, description, amount, uncleared: false };
  } else {
    const description = parts.slice(1).join(" ");
    return { date: todayIso(), category: "Income", description, amount, uncleared: false };
  }
}
