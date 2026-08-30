"use client";

import React from "react";
import { DEFAULT_CATEGORIES, WordItem } from "@/lib/constants/categories";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface PracticeFilters {
  count: number | "all";
  dateRange: "all" | "7d" | "30d";
  category: string;
  charCount: "all" | 1 | 2 | "3+";
  performance: "all" | "weak" | "unpracticed";
}

interface PracticeSelectorProps {
  filters: PracticeFilters;
  onChange: (filters: PracticeFilters) => void;
  totalAvailable: number;
  selectedCount: number;
}

export function PracticeSelector({
  filters,
  onChange,
  totalAvailable,
  selectedCount,
}: PracticeSelectorProps) {
  const updateFilter = <K extends keyof PracticeFilters>(
    key: K,
    value: PracticeFilters[K]
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-4">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Icons.Filter size={16} />
            </span>
            <span>Practice Set Configuration</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Filter words to target specific vocabulary, categories, or weak spots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="jade" className="text-xs px-3 py-1 font-semibold">
            {selectedCount} / {totalAvailable} words selected
          </Badge>
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        {/* Set Size / Random N */}
        <div className="space-y-1.5">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground">
            Round Size (Random N)
          </label>
          <Select
            value={filters.count.toString()}
            onValueChange={(val) =>
              updateFilter("count", val === "all" ? "all" : parseInt(val, 10))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select round size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 random words</SelectItem>
              <SelectItem value="8">8 random words</SelectItem>
              <SelectItem value="10">10 random words</SelectItem>
              <SelectItem value="15">15 random words</SelectItem>
              <SelectItem value="20">20 random words</SelectItem>
              <SelectItem value="all">All matching words</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground">
            Category
          </label>
          <Select
            value={filters.category}
            onValueChange={(val) => updateFilter("category", val)}
          >
            <SelectTrigger className="w-full capitalize">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DEFAULT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Character Count */}
        <div className="space-y-1.5">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground">
            Character Length
          </label>
          <Select
            value={filters.charCount.toString()}
            onValueChange={(val) =>
              updateFilter(
                "charCount",
                val === "all" ? "all" : val === "3+" ? "3+" : (parseInt(val, 10) as any)
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Length</SelectItem>
              <SelectItem value="1">1 Character (Single)</SelectItem>
              <SelectItem value="2">2 Characters (Compound)</SelectItem>
              <SelectItem value="3+">3+ Characters (Phrases/Idioms)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Performance / Weak words */}
        <div className="space-y-1.5">
          <label className="font-semibold uppercase tracking-wider text-muted-foreground">
            Target Performance
          </label>
          <Select
            value={filters.performance}
            onValueChange={(val) => updateFilter("performance", val as any)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Words (Default)</SelectItem>
              <SelectItem value="weak">Weak Words (Accuracy &lt; 70%)</SelectItem>
              <SelectItem value="unpracticed">Unpracticed Words</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/**
 * Filter utility function applying combinable logic (AND)
 */
export function filterWords(words: WordItem[], filters: PracticeFilters): WordItem[] {
  let result = [...words];

  // Category filter
  if (filters.category !== "all") {
    result = result.filter(
      (w) => w.category.toLowerCase() === filters.category.toLowerCase()
    );
  }

  // Character length filter
  if (filters.charCount !== "all") {
    if (filters.charCount === "3+") {
      result = result.filter((w) => w.characterCount >= 3);
    } else {
      result = result.filter((w) => w.characterCount === filters.charCount);
    }
  }

  // Performance filter
  if (filters.performance === "weak") {
    result = result.filter((w) => {
      const attempts = (w.timesCorrect || 0) + (w.timesIncorrect || 0);
      if (attempts === 0) return false;
      const acc = ((w.timesCorrect || 0) / attempts) * 100;
      return acc < 70;
    });
  } else if (filters.performance === "unpracticed") {
    result = result.filter((w) => (w.timesReviewed || 0) === 0);
  }

  // Date range filter
  if (filters.dateRange !== "all") {
    const days = filters.dateRange === "7d" ? 7 : 30;
    const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
    result = result.filter((w) => new Date(w.dateAdded).getTime() >= threshold);
  }

  // Random N Shuffle & Slice
  if (filters.count !== "all" && typeof filters.count === "number") {
    const shuffled = [...result].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, filters.count);
  }

  return result;
}
