export const DEFAULT_CATEGORIES = [
  "greetings",
  "pronouns",
  "connectors",
  "question words",
  "nouns",
  "verbs",
  "adjectives",
  "measure words",
  "time words",
  "seasons",
  "numbers",
  "food and drink",
  "fruits",
  "cooking and kitchen items",
  "travel",
  "places",
  "Beijing landmarks",
  "countries",
  "languages",
  "occupations",
  "family",
  "sports",
  "home furnishings and rooms",
  "weights and measures",
  "miscellaneous",
] as const;

export type Category = (typeof DEFAULT_CATEGORIES)[number] | string;

export interface WordItem {
  id: string;
  userId: string;
  english: string;
  pinyin: string;
  character: string;
  characterCount: number;
  category: string;
  tags: string[];
  notes?: string | null;
  dateAdded: string | Date;
  dateModified: string | Date;
  // Stats
  timesReviewed?: number;
  timesCorrect?: number;
  timesIncorrect?: number;
  lastPracticed?: string | Date | null;
}

export interface WordStats {
  id: string;
  wordId: string;
  timesReviewed: number;
  timesCorrect: number;
  timesIncorrect: number;
  lastPracticed: string | Date | null;
}
