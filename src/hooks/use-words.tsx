"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { WordItem } from "@/lib/constants/categories";
import { SEED_WORDS } from "@/lib/constants/seed-words";
import { getCharacterCount, convertNumberedToDiacriticPinyin } from "@/lib/utils/pinyin";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const STORAGE_KEY = "hanzibank_words_data";

// Helper to transform Supabase row to client WordItem
export function fromSupabaseRow(row: any): WordItem {
  const stats = Array.isArray(row.stats) ? row.stats[0] : row.stats;
  return {
    id: row.id,
    userId: row.user_id,
    english: row.english,
    pinyin: row.pinyin,
    character: row.character,
    characterCount: row.character_count ?? getCharacterCount(row.character || ""),
    category: row.category || "miscellaneous",
    tags: row.tags || [],
    notes: row.notes || null,
    dateAdded: row.date_added || new Date().toISOString(),
    dateModified: row.date_modified || new Date().toISOString(),
    timesReviewed: stats?.times_reviewed ?? 0,
    timesCorrect: stats?.times_correct ?? 0,
    timesIncorrect: stats?.times_incorrect ?? 0,
    lastPracticed: stats?.last_practiced ?? null,
  };
}

interface WordsContextType {
  words: WordItem[];
  isLoading: boolean;
  isDuplicateEnglish: (english: string, excludeId?: string) => boolean;
  addWord: (newWordData: {
    english: string;
    pinyin: string;
    character: string;
    category?: string;
    tags?: string[];
    notes?: string;
  }) => Promise<WordItem>;
  updateWord: (
    id: string,
    updates: Partial<Omit<WordItem, "id" | "userId" | "dateAdded" | "timesReviewed" | "timesCorrect" | "timesIncorrect" | "lastPracticed">>
  ) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  bulkImportWords: (
    importedItems: Array<{
      english: string;
      pinyin: string;
      character: string;
      category?: string;
      tags?: string[];
      notes?: string | null;
    }>
  ) => Promise<number>;
  recordReview: (wordId: string) => Promise<void>;
  recordMatch: (wordId: string, isCorrect: boolean) => Promise<void>;
  exportAsJson: () => void;
  pendingLocalMigrationCount: number;
  migrateLocalWordsToCloud: () => Promise<number>;
  dismissLocalMigration: () => void;
}

const WordsContext = createContext<WordsContextType>({
  words: [],
  isLoading: true,
  isDuplicateEnglish: () => false,
  addWord: async () => ({} as WordItem),
  updateWord: async () => {},
  deleteWord: async () => {},
  bulkImportWords: async () => 0,
  recordReview: async () => {},
  recordMatch: async () => {},
  exportAsJson: () => {},
  pendingLocalMigrationCount: 0,
  migrateLocalWordsToCloud: async () => 0,
  dismissLocalMigration: () => {},
});

export function WordsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [words, setWords] = useState<WordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingLocalMigrationCount, setPendingLocalMigrationCount] = useState(0);

  // Read path: Load words from Supabase if authenticated, or localStorage if guest
  const loadWords = useCallback(async () => {
    setIsLoading(true);
    try {
      if (user) {
        // 1. Authenticated user: Read directly from Supabase Postgres (filtered by RLS)
        const { data, error } = await supabase
          .from("words")
          .select("*, stats:word_stats(*)")
          .order("date_added", { ascending: false });

        if (error) {
          console.error("Failed to fetch words from Supabase:", error);
          throw error;
        }

        const cloudWords = (data || []).map(fromSupabaseRow);
        setWords(cloudWords);

        // 2. Check for offline/localStorage words to offer migration
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed: WordItem[] = JSON.parse(stored);
            const localUnmigrated = parsed.filter(
              (localW) =>
                localW.userId === "local-user" &&
                !cloudWords.some((cw) => cw.english.toLowerCase() === localW.english.toLowerCase())
            );
            setPendingLocalMigrationCount(localUnmigrated.length);
          }
        } catch (e) {
          console.error("Local storage check error", e);
        }
      } else {
        // 3. Guest / Unauthenticated: Load from localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setWords(parsed);
        } else {
          // Initialize guest with seed words
          const initialWords: WordItem[] = SEED_WORDS.map((seed, index) => ({
            id: `seed-${index + 1}-${Date.now()}`,
            userId: "local-user",
            english: seed.english,
            pinyin: seed.pinyin,
            character: seed.character,
            characterCount: getCharacterCount(seed.character),
            category: seed.category,
            tags: seed.tags,
            notes: seed.notes,
            dateAdded: new Date(Date.now() - index * 86400000).toISOString(),
            dateModified: new Date().toISOString(),
            timesReviewed: 0,
            timesCorrect: 0,
            timesIncorrect: 0,
            lastPracticed: null,
          }));
          setWords(initialWords);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initialWords));
        }
      }
    } catch (e) {
      console.error("Error loading words:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  // Persist guest words to localStorage
  const saveGuestWords = useCallback((updated: WordItem[]) => {
    setWords(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist guest words", e);
    }
  }, []);

  // Check duplicate English word (case-insensitive)
  const isDuplicateEnglish = useCallback(
    (english: string, excludeId?: string): boolean => {
      const trimmed = english.trim().toLowerCase();
      return words.some(
        (w) => w.english.trim().toLowerCase() === trimmed && w.id !== excludeId
      );
    },
    [words]
  );

  // Add single word
  const addWord = useCallback(
    async (newWordData: {
      english: string;
      pinyin: string;
      character: string;
      category?: string;
      tags?: string[];
      notes?: string;
    }): Promise<WordItem> => {
      const characterCount = getCharacterCount(newWordData.character);
      const formattedPinyin = convertNumberedToDiacriticPinyin(newWordData.pinyin);

      if (user) {
        // Authenticated: Write directly to Supabase with real user.id
        const { data: insertedWord, error: wordError } = await supabase
          .from("words")
          .insert({
            user_id: user.id,
            english: newWordData.english.trim(),
            pinyin: formattedPinyin.trim(),
            character: newWordData.character.trim(),
            character_count: characterCount,
            category: newWordData.category?.trim() || "miscellaneous",
            tags: newWordData.tags || [],
            notes: newWordData.notes?.trim() || null,
          })
          .select()
          .single();

        if (wordError) throw wordError;

        // Create matching word_stats row
        const { error: statsError } = await supabase
          .from("word_stats")
          .insert({
            word_id: insertedWord.id,
            times_reviewed: 0,
            times_correct: 0,
            times_incorrect: 0,
            last_practiced: null,
          });

        if (statsError) {
          console.warn("Failed to create initial word_stats row:", statsError);
        }

        const newWord = fromSupabaseRow({
          ...insertedWord,
          stats: { times_reviewed: 0, times_correct: 0, times_incorrect: 0, last_practiced: null },
        });

        setWords((prev) => [newWord, ...prev]);
        return newWord;
      } else {
        // Guest fallback
        const newWord: WordItem = {
          id: `word-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          userId: "local-user",
          english: newWordData.english.trim(),
          pinyin: formattedPinyin.trim(),
          character: newWordData.character.trim(),
          characterCount,
          category: newWordData.category?.trim() || "miscellaneous",
          tags: newWordData.tags || [],
          notes: newWordData.notes?.trim() || "",
          dateAdded: new Date().toISOString(),
          dateModified: new Date().toISOString(),
          timesReviewed: 0,
          timesCorrect: 0,
          timesIncorrect: 0,
          lastPracticed: null,
        };

        const updated = [newWord, ...words];
        saveGuestWords(updated);
        return newWord;
      }
    },
    [user, supabase, words, saveGuestWords]
  );

  // Update existing word
  const updateWord = useCallback(
    async (
      id: string,
      updates: Partial<Omit<WordItem, "id" | "userId" | "dateAdded" | "timesReviewed" | "timesCorrect" | "timesIncorrect" | "lastPracticed">>
    ): Promise<void> => {
      const now = new Date().toISOString();

      if (user) {
        const payload: any = {
          date_modified: now,
        };
        if (updates.english !== undefined) payload.english = updates.english.trim();
        if (updates.pinyin !== undefined) {
          payload.pinyin = convertNumberedToDiacriticPinyin(updates.pinyin).trim();
        }
        if (updates.character !== undefined) {
          payload.character = updates.character.trim();
          payload.character_count = getCharacterCount(updates.character);
        }
        if (updates.category !== undefined) payload.category = updates.category.trim();
        if (updates.tags !== undefined) payload.tags = updates.tags;
        if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;

        const { data: updatedWord, error } = await supabase
          .from("words")
          .update(payload)
          .eq("id", id)
          .eq("user_id", user.id)
          .select("*, stats:word_stats(*)")
          .single();

        if (error) throw error;

        const updatedItem = fromSupabaseRow(updatedWord);
        setWords((prev) => prev.map((w) => (w.id === id ? updatedItem : w)));
      } else {
        // Guest fallback
        const updated = words.map((w) => {
          if (w.id === id) {
            const char = updates.character !== undefined ? updates.character.trim() : w.character;
            const charCount = getCharacterCount(char);
            const pinyin = updates.pinyin !== undefined
              ? convertNumberedToDiacriticPinyin(updates.pinyin).trim()
              : w.pinyin;

            return {
              ...w,
              ...updates,
              character: char,
              characterCount: charCount,
              pinyin,
              english: updates.english !== undefined ? updates.english.trim() : w.english,
              dateModified: now,
            };
          }
          return w;
        });

        saveGuestWords(updated);
      }
    },
    [user, supabase, words, saveGuestWords]
  );

  // Delete word
  const deleteWord = useCallback(
    async (id: string): Promise<void> => {
      if (user) {
        const { error } = await supabase
          .from("words")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        setWords((prev) => prev.filter((w) => w.id !== id));
      } else {
        const updated = words.filter((w) => w.id !== id);
        saveGuestWords(updated);
      }
    },
    [user, supabase, words, saveGuestWords]
  );

  // Batched bulk import words (single network request)
  const bulkImportWords = useCallback(
    async (
      importedItems: Array<{
        english: string;
        pinyin: string;
        character: string;
        category?: string;
        tags?: string[];
        notes?: string | null;
      }>
    ): Promise<number> => {
      if (importedItems.length === 0) return 0;
      const batchDate = new Date().toISOString();

      if (user) {
        // 1. Batched insert words into Supabase
        const wordsToInsert = importedItems.map((item) => ({
          user_id: user.id,
          english: item.english.trim(),
          pinyin: convertNumberedToDiacriticPinyin(item.pinyin).trim(),
          character: item.character.trim(),
          character_count: getCharacterCount(item.character),
          category: item.category?.trim() || "miscellaneous",
          tags: item.tags || [],
          notes: item.notes?.trim() || null,
        }));

        const { data: insertedWords, error: insertError } = await supabase
          .from("words")
          .insert(wordsToInsert)
          .select();

        if (insertError) {
          console.error("Bulk insert failed in Supabase:", insertError);
          throw insertError;
        }

        // 2. Batched insert matching word_stats rows
        const statsToInsert = (insertedWords || []).map((w: any) => ({
          word_id: w.id,
          times_reviewed: 0,
          times_correct: 0,
          times_incorrect: 0,
          last_practiced: null,
        }));

        if (statsToInsert.length > 0) {
          const { error: statsError } = await supabase
            .from("word_stats")
            .insert(statsToInsert);
          if (statsError) {
            console.warn("Bulk word_stats insert error:", statsError);
          }
        }

        const mappedNewEntries = (insertedWords || []).map((w: any) =>
          fromSupabaseRow({
            ...w,
            stats: { times_reviewed: 0, times_correct: 0, times_incorrect: 0, last_practiced: null },
          })
        );

        setWords((prev) => [...mappedNewEntries, ...prev]);
        return mappedNewEntries.length;
      } else {
        // Guest fallback
        const newEntries: WordItem[] = importedItems.map((item, i) => ({
          id: `import-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`,
          userId: "local-user",
          english: item.english.trim(),
          pinyin: convertNumberedToDiacriticPinyin(item.pinyin).trim(),
          character: item.character.trim(),
          characterCount: getCharacterCount(item.character),
          category: item.category?.trim() || "miscellaneous",
          tags: item.tags || [],
          notes: item.notes?.trim() || "",
          dateAdded: batchDate,
          dateModified: batchDate,
          timesReviewed: 0,
          timesCorrect: 0,
          timesIncorrect: 0,
          lastPracticed: null,
        }));

        const updated = [...newEntries, ...words];
        saveGuestWords(updated);
        return newEntries.length;
      }
    },
    [user, supabase, words, saveGuestWords]
  );

  // Record flip-card review (upserts word_stats in Supabase)
  const recordReview = useCallback(
    async (wordId: string): Promise<void> => {
      const now = new Date().toISOString();
      const currentWord = words.find((w) => w.id === wordId);
      const newReviews = (currentWord?.timesReviewed || 0) + 1;

      // Optimistic state update
      setWords((prev) =>
        prev.map((w) =>
          w.id === wordId
            ? { ...w, timesReviewed: newReviews, lastPracticed: now }
            : w
        )
      );

      if (user) {
        try {
          await supabase.from("word_stats").upsert(
            {
              word_id: wordId,
              times_reviewed: newReviews,
              last_practiced: now,
            },
            { onConflict: "word_id" }
          );
        } catch (e) {
          console.error("Failed to sync review stats to Supabase:", e);
        }
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: WordItem[] = JSON.parse(stored);
          const updated = parsed.map((w) =>
            w.id === wordId ? { ...w, timesReviewed: newReviews, lastPracticed: now } : w
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      }
    },
    [user, supabase, words]
  );

  // Record matching game outcome (upserts word_stats in Supabase)
  const recordMatch = useCallback(
    async (wordId: string, isCorrect: boolean): Promise<void> => {
      const now = new Date().toISOString();
      const currentWord = words.find((w) => w.id === wordId);
      const newReviews = (currentWord?.timesReviewed || 0) + 1;
      const newCorrect = isCorrect ? (currentWord?.timesCorrect || 0) + 1 : currentWord?.timesCorrect || 0;
      const newIncorrect = !isCorrect ? (currentWord?.timesIncorrect || 0) + 1 : currentWord?.timesIncorrect || 0;

      // Optimistic state update
      setWords((prev) =>
        prev.map((w) =>
          w.id === wordId
            ? {
                ...w,
                timesReviewed: newReviews,
                timesCorrect: newCorrect,
                timesIncorrect: newIncorrect,
                lastPracticed: now,
              }
            : w
        )
      );

      if (user) {
        try {
          await supabase.from("word_stats").upsert(
            {
              word_id: wordId,
              times_reviewed: newReviews,
              times_correct: newCorrect,
              times_incorrect: newIncorrect,
              last_practiced: now,
            },
            { onConflict: "word_id" }
          );
        } catch (e) {
          console.error("Failed to sync match stats to Supabase:", e);
        }
      } else {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: WordItem[] = JSON.parse(stored);
          const updated = parsed.map((w) =>
            w.id === wordId
              ? {
                  ...w,
                  timesReviewed: newReviews,
                  timesCorrect: newCorrect,
                  timesIncorrect: newIncorrect,
                  lastPracticed: now,
                }
              : w
          );
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      }
    },
    [user, supabase, words]
  );

  // Migrate existing localStorage words to Supabase
  const migrateLocalWordsToCloud = useCallback(async (): Promise<number> => {
    if (!user) return 0;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return 0;

      const parsed: WordItem[] = JSON.parse(stored);
      const unmigrated = parsed.filter(
        (localW) =>
          !words.some((cw) => cw.english.toLowerCase() === localW.english.toLowerCase())
      );

      if (unmigrated.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        setPendingLocalMigrationCount(0);
        return 0;
      }

      const count = await bulkImportWords(
        unmigrated.map((w) => ({
          english: w.english,
          pinyin: w.pinyin,
          character: w.character,
          category: w.category,
          tags: w.tags,
          notes: w.notes,
        }))
      );
      localStorage.removeItem(STORAGE_KEY);
      setPendingLocalMigrationCount(0);
      return count;
    } catch (e) {
      console.error("Migration failed:", e);
      throw e;
    }
  }, [user, words, bulkImportWords]);

  const dismissLocalMigration = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPendingLocalMigrationCount(0);
  }, []);

  // Export word bank as JSON
  const exportAsJson = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(words, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hanzibank-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [words]);

  const value = useMemo(
    () => ({
      words,
      isLoading,
      isDuplicateEnglish,
      addWord,
      updateWord,
      deleteWord,
      bulkImportWords,
      recordReview,
      recordMatch,
      exportAsJson,
      pendingLocalMigrationCount,
      migrateLocalWordsToCloud,
      dismissLocalMigration,
    }),
    [
      words,
      isLoading,
      isDuplicateEnglish,
      addWord,
      updateWord,
      deleteWord,
      bulkImportWords,
      recordReview,
      recordMatch,
      exportAsJson,
      pendingLocalMigrationCount,
      migrateLocalWordsToCloud,
      dismissLocalMigration,
    ]
  );

  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>;
}

export function useWords() {
  return useContext(WordsContext);
}
