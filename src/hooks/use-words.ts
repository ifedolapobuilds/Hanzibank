"use client";

import { useState, useEffect, useCallback } from "react";
import { WordItem } from "@/lib/constants/categories";
import { SEED_WORDS } from "@/lib/constants/seed-words";
import { getCharacterCount, convertNumberedToDiacriticPinyin } from "@/lib/utils/pinyin";

const STORAGE_KEY = "hanzibank_words_data";

export function useWords() {
  const [words, setWords] = useState<WordItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load words on mount from LocalStorage or seed data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setWords(parsed);
      } else {
        // Initialize with rich seed data
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
          dateAdded: new Date(Date.now() - (index * 86400000)).toISOString(),
          dateModified: new Date().toISOString(),
          timesReviewed: 0,
          timesCorrect: 0,
          timesIncorrect: 0,
          lastPracticed: null,
        }));
        setWords(initialWords);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialWords));
      }
    } catch (e) {
      console.error("Failed to load words from storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Persist whenever words state changes
  const saveWords = useCallback((updated: WordItem[]) => {
    setWords(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to persist words to storage", e);
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
    (newWordData: {
      english: string;
      pinyin: string;
      character: string;
      category?: string;
      tags?: string[];
      notes?: string;
    }): WordItem => {
      const characterCount = getCharacterCount(newWordData.character);
      const formattedPinyin = convertNumberedToDiacriticPinyin(newWordData.pinyin);

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
      saveWords(updated);
      return newWord;
    },
    [words, saveWords]
  );

  // Update existing word (updates dateModified, keeps stats)
  const updateWord = useCallback(
    (
      id: string,
      updates: Partial<Omit<WordItem, "id" | "userId" | "dateAdded" | "timesReviewed" | "timesCorrect" | "timesIncorrect" | "lastPracticed">>
    ) => {
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
            dateModified: new Date().toISOString(),
          };
        }
        return w;
      });

      saveWords(updated);
    },
    [words, saveWords]
  );

  // Delete word
  const deleteWord = useCallback(
    (id: string) => {
      const updated = words.filter((w) => w.id !== id);
      saveWords(updated);
    },
    [words, saveWords]
  );

  // Bulk import words
  const bulkImportWords = useCallback(
    (
      importedItems: Array<{
        english: string;
        pinyin: string;
        character: string;
        category?: string;
        tags?: string[];
        notes?: string;
      }>
    ) => {
      const batchDate = new Date().toISOString();
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
      saveWords(updated);
      return newEntries.length;
    },
    [words, saveWords]
  );

  // Record flip-card review
  const recordReview = useCallback(
    (wordId: string) => {
      const now = new Date().toISOString();
      const updated = words.map((w) => {
        if (w.id === wordId) {
          return {
            ...w,
            timesReviewed: (w.timesReviewed || 0) + 1,
            lastPracticed: now,
          };
        }
        return w;
      });
      saveWords(updated);
    },
    [words, saveWords]
  );

  // Record matching game outcome
  const recordMatch = useCallback(
    (wordId: string, isCorrect: boolean) => {
      const now = new Date().toISOString();
      const updated = words.map((w) => {
        if (w.id === wordId) {
          return {
            ...w,
            timesReviewed: (w.timesReviewed || 0) + 1,
            timesCorrect: isCorrect ? (w.timesCorrect || 0) + 1 : (w.timesCorrect || 0),
            timesIncorrect: !isCorrect ? (w.timesIncorrect || 0) + 1 : (w.timesIncorrect || 0),
            lastPracticed: now,
          };
        }
        return w;
      });
      saveWords(updated);
    },
    [words, saveWords]
  );

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

  return {
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
  };
}
