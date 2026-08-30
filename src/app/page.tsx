"use client";

import React, { useState, useMemo } from "react";
import { Navbar } from "@/components/navbar";
import { WordCard } from "@/components/word-card";
import { AddWordDialog } from "@/components/modals/add-word-dialog";
import { ImportDialog } from "@/components/modals/import-dialog";
import { AuthDialog } from "@/components/modals/auth-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icons } from "@/components/icons";
import { useWords } from "@/hooks/use-words";
import { DEFAULT_CATEGORIES, WordItem } from "@/lib/constants/categories";

type SortOption = "newest" | "oldest" | "alpha-asc" | "alpha-desc" | "category";

export default function WordBankPage() {
  const {
    words,
    isLoading,
    isDuplicateEnglish,
    addWord,
    updateWord,
    deleteWord,
    bulkImportWords,
    recordReview,
    exportAsJson,
  } = useWords();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<WordItem | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    words.forEach((w) => {
      w.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [words]);

  // Filtered and Sorted words
  const filteredWords = useMemo(() => {
    let result = words.filter((w) => {
      // Search query (English, Pinyin, or Character)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesEnglish = w.english.toLowerCase().includes(q);
        const matchesPinyin = w.pinyin.toLowerCase().includes(q);
        const matchesChar = w.character.includes(q);
        if (!matchesEnglish && !matchesPinyin && !matchesChar) {
          return false;
        }
      }

      // Category
      if (selectedCategory !== "all" && w.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Tag
      if (selectedTag !== "all" && !w.tags?.includes(selectedTag)) {
        return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
        case "oldest":
          return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        case "alpha-asc":
          return a.english.localeCompare(b.english);
        case "alpha-desc":
          return b.english.localeCompare(a.english);
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return result;
  }, [words, searchQuery, selectedCategory, selectedTag, sortBy]);

  // Overall Stats
  const totalReviews = useMemo(
    () => words.reduce((acc, w) => acc + (w.timesReviewed || 0), 0),
    [words]
  );
  const totalCorrect = useMemo(
    () => words.reduce((acc, w) => acc + (w.timesCorrect || 0), 0),
    [words]
  );
  const totalAttempts = useMemo(
    () =>
      words.reduce(
        (acc, w) => acc + (w.timesCorrect || 0) + (w.timesIncorrect || 0),
        0
      ),
    [words]
  );
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : null;

  return (
    <>
      <Navbar
        totalWords={words.length}
        onOpenAddModal={() => {
          setEditingWord(null);
          setIsAddModalOpen(true);
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <main className="flex-1 container px-4 sm:px-8 py-6 space-y-6 max-w-7xl mx-auto pb-24 md:pb-12">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Card className="lg:col-span-7 bg-gradient-to-br from-primary/15 via-card to-card border-primary/25 shadow-sm p-6 sm:p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="violet" className="text-xs px-3 py-1 font-semibold shadow-sm">
                  <Icons.Sparkles size={13} className="mr-1.5 inline text-yellow-400" />
                  Mandarin Bank
                </Badge>
              </div>
              <div className="space-y-2 pt-1">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight">
                  Vocabulary Management
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Maintain, review, and master your personal Chinese word bank with automatic tone diacritics, character breakdown, and cross-device synchronization.
                </p>
              </div>
            </div>
          </Card>

          <Card className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-5 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center justify-between border-b pb-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Bank Performance Overview
              </span>
              <Badge variant="outline" className="text-[10px] bg-muted/60">
                Live Stats
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Words
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground font-aeternum">
                  {words.length}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Active entries in bank
                </div>
              </div>

              <div className="space-y-1.5 p-3.5 rounded-xl bg-muted/40 border border-border/50">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Practice Accuracy
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 font-aeternum">
                  {overallAccuracy !== null ? `${overallAccuracy}%` : "100%"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Across {totalReviews} reviews
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Controls & Filters Bar */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Icons.Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search English, Pinyin (nǐ hǎo), or Hanzi (你好)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 text-sm bg-card/70"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icons.X size={16} />
                </button>
              )}
            </div>

            {/* Quick Actions (Add Word, Import, Export) */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setEditingWord(null);
                  setIsAddModalOpen(true);
                }}
                className="h-11 px-4 gap-2 bg-primary text-primary-foreground font-semibold shadow"
              >
                <Icons.Plus size={16} />
                <span>Add Word</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsImportModalOpen(true)}
                className="h-11 px-3.5 gap-2 border-border/80"
                title="Bulk CSV or JSON import"
              >
                <Icons.Upload size={16} />
                <span className="hidden sm:inline">Import</span>
              </Button>

              <Button
                variant="outline"
                onClick={exportAsJson}
                className="h-11 px-3.5 gap-2 border-border/80"
                title="Export word bank JSON backup"
              >
                <Icons.Download size={16} />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>

          {/* Filter & View Mode Strip */}
          <Card className="p-3.5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Category & Tag Dropdowns */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-muted-foreground font-semibold flex items-center gap-1">
                  <Icons.Filter size={14} /> Category:
                </span>
                <div className="w-[180px]">
                  <Select
                    value={selectedCategory}
                    onValueChange={(val) => setSelectedCategory(val)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories ({words.length})</SelectItem>
                      {DEFAULT_CATEGORIES.map((cat) => {
                        const count = words.filter(
                          (w) => w.category.toLowerCase() === cat.toLowerCase()
                        ).length;
                        if (count === 0) return null;
                        return (
                          <SelectItem key={cat} value={cat} className="capitalize text-xs">
                            {cat} ({count})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {allTags.length > 0 && (
                  <>
                    <span className="text-muted-foreground font-semibold ml-2 flex items-center gap-1">
                      <Icons.Tag size={13} /> Tag:
                    </span>
                    <div className="w-[140px]">
                      <Select
                        value={selectedTag}
                        onValueChange={(val) => setSelectedTag(val)}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="All Tags" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tags</SelectItem>
                          {allTags.map((tag) => (
                            <SelectItem key={tag} value={tag} className="text-xs">
                              #{tag}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              {/* Sort & View Mode Switcher */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-semibold">Sort by:</span>
                  <div className="w-[160px]">
                    <Select
                      value={sortBy}
                      onValueChange={(val) => setSortBy(val as SortOption)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Sort order" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Recently Added</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="alpha-asc">English (A → Z)</SelectItem>
                        <SelectItem value="alpha-desc">English (Z → A)</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Grid / Table View Switcher */}
                <div className="hidden sm:flex items-center rounded-xl bg-muted/60 p-1 border">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      viewMode === "grid"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Grid view"
                  >
                    <Icons.Cards size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      viewMode === "table"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Table view"
                  >
                    <Icons.Book size={15} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Words Presentation (Grid vs Table) */}
        {filteredWords.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredWords.map((word) => (
                <WordCard
                  key={word.id}
                  word={word}
                  onEdit={(w) => {
                    setEditingWord(w);
                    setIsAddModalOpen(true);
                  }}
                  onDelete={deleteWord}
                  onReviewed={recordReview}
                />
              ))}
            </div>
          ) : (
            /* Table View */
            <Card className="overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>English</TableHead>
                    <TableHead>Pinyin</TableHead>
                    <TableHead>Hanzi</TableHead>
                    <TableHead>Length</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWords.map((word) => (
                    <TableRow key={word.id}>
                      <TableCell className="font-semibold">{word.english}</TableCell>
                      <TableCell className="font-medium text-muted-foreground">{word.pinyin}</TableCell>
                      <TableCell className="hanzi-char text-lg font-bold text-primary">{word.character}</TableCell>
                      <TableCell>{word.characterCount} char</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {word.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {word.tags?.map((t) => (
                            <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingWord(word);
                            setIsAddModalOpen(true);
                          }}
                          className="h-8 px-2 text-xs"
                        >
                          <Icons.Edit size={13} className="mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWord(word.id)}
                          className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Icons.Trash size={13} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )
        ) : (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/10 space-y-4 my-8">
            <div className="p-4 rounded-full bg-primary/10 text-primary">
              <Icons.Search size={32} />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold">No words found</CardTitle>
              <CardDescription className="text-sm max-w-sm">
                {searchQuery || selectedCategory !== "all" || selectedTag !== "all"
                  ? "Try resetting your search filters or add a new word matching your query."
                  : "Your word bank is currently empty. Add your first word or import a CSV file to get started."}
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedTag("all");
                if (words.length === 0) {
                  setIsAddModalOpen(true);
                }
              }}
              className="bg-primary text-primary-foreground font-semibold"
            >
              {words.length === 0 ? "Add First Word" : "Clear Filters"}
            </Button>
          </Card>
        )}
      </main>

      {/* Add & Edit Modal */}
      <AddWordDialog
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingWord(null);
        }}
        onSave={addWord}
        onUpdate={updateWord}
        editingWord={editingWord}
        isDuplicateEnglish={isDuplicateEnglish}
      />

      {/* Bulk Importer Modal */}
      <ImportDialog
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={bulkImportWords}
        existingEnglishWords={words.map((w) => w.english)}
      />

      {/* Auth Modal */}
      <AuthDialog
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
