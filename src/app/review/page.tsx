"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Navbar } from "@/components/navbar";
import { PracticeSelector, PracticeFilters, filterWords } from "@/components/practice-selector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useWords } from "@/hooks/use-words";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function ReviewPage() {
  const { words, recordReview } = useWords();
  const { user, signOut } = useAuth();

  const [filters, setFilters] = useState<PracticeFilters>({
    count: 10,
    dateRange: "all",
    category: "all",
    charCount: "all",
    performance: "all",
  });

  const [isPracticing, setIsPracticing] = useState(false);
  const [activeDeck, setActiveDeck] = useState<typeof words>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filtered pool for review
  const selectedPool = useMemo(() => {
    return filterWords(words, filters);
  }, [words, filters]);

  const startSession = () => {
    if (selectedPool.length === 0) return;
    const shuffled = [...selectedPool].sort(() => Math.random() - 0.5);
    setActiveDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsPracticing(true);

    // Record review for the first card
    if (shuffled[0]) {
      recordReview(shuffled[0].id);
    }
  };

  const handleNextCard = useCallback(() => {
    if (currentIndex < activeDeck.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setIsFlipped(false);
      if (activeDeck[nextIdx]) {
        recordReview(activeDeck[nextIdx].id);
      }
    }
  }, [currentIndex, activeDeck, recordReview]);

  const handlePrevCard = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    if (!isPracticing) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleFlipCard();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleNextCard();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handlePrevCard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPracticing, handleFlipCard, handleNextCard, handlePrevCard]);

  const currentWord = activeDeck[currentIndex];
  const progressPercent =
    activeDeck.length > 0
      ? Math.round(((currentIndex + 1) / activeDeck.length) * 100)
      : 0;

  return (
    <>
      <Navbar
        totalWords={words.length}
        userEmail={user?.email}
        onSignOut={signOut}
      />

      <main className="flex-1 container px-4 sm:px-8 py-6 space-y-6 max-w-4xl mx-auto pb-24 md:pb-12">
        {!isPracticing ? (
          <div className="space-y-6">
            {/* Header Hero Banner */}
            <Card className="bg-gradient-to-br from-primary/10 via-card to-card border-primary/25 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="violet" className="text-xs px-2.5 py-0.5 font-semibold">
                    <Icons.Cards size={13} className="mr-1 inline text-yellow-400" />
                    Review Mode
                  </Badge>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  Flip-Card Memory Review
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Review words back and forth to reinforce vocabulary recall. Every card view silently increments your mastery review statistics.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Practice Set Selector */}
            <PracticeSelector
              filters={filters}
              onChange={setFilters}
              totalAvailable={words.length}
              selectedCount={selectedPool.length}
            />

            {/* Start Button */}
            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                disabled={selectedPool.length === 0}
                onClick={startSession}
                className="w-full sm:w-auto px-10 h-14 rounded-2xl text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 gap-2"
              >
                <Icons.Sparkles size={20} />
                <span>Start Reviewing ({selectedPool.length} Cards)</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Active Review Session */
          <div className="space-y-6">
            {/* Session Top Bar */}
            <Card className="p-4 flex items-center justify-between shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPracticing(false)}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Icons.ArrowLeft size={16} />
                <span>Exit Review</span>
              </Button>

              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-3 py-1 font-semibold text-xs bg-muted/50">
                  Card {currentIndex + 1} of {activeDeck.length}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startSession}
                  className="gap-1.5"
                  title="Reshuffle deck"
                >
                  <Icons.Rotate size={14} />
                  <span className="hidden sm:inline">Shuffle</span>
                </Button>
              </div>
            </Card>

            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Giant 3D Flip Card */}
            {currentWord && (
              <div className="perspective-1000 w-full min-h-[380px] sm:min-h-[440px] select-none my-4">
                <div
                  className={cn(
                    "relative w-full h-full min-h-[380px] sm:min-h-[440px] duration-500 transform-style-3d transition-transform cursor-pointer",
                    isFlipped ? "rotate-y-180" : ""
                  )}
                  onClick={handleFlipCard}
                >
                  {/* FRONT: English */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border-2 border-border/90 bg-card p-8 sm:p-12 flex flex-col justify-between shadow-xl hover:border-primary/50 transition-all">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize text-xs font-semibold px-3 py-1 bg-muted/60">
                        {currentWord.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        {currentWord.characterCount} {currentWord.characterCount === 1 ? "character" : "characters"}
                      </span>
                    </div>

                    <div className="my-auto text-center space-y-3">
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        English Meaning
                      </span>
                      <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
                        {currentWord.english}
                      </h2>
                      <p className="text-xs text-muted-foreground pt-4 flex items-center justify-center gap-1.5">
                        <Icons.Rotate size={14} className="text-primary animate-pulse" />
                        Click card or press <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono border">Space</kbd> to reveal Hanzi
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                      <span>Practice Review</span>
                      <span className="italic font-medium">{currentWord.tags?.map((t) => `#${t}`).join(" ")}</span>
                    </div>
                  </div>

                  {/* BACK: Hanzi + Pinyin */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl border-2 border-primary/40 bg-gradient-to-b from-primary/10 via-card to-card p-8 sm:p-12 flex flex-col justify-between shadow-2xl">
                    <div className="flex items-center justify-between">
                      <Badge variant="violet" className="capitalize text-xs font-semibold px-3 py-1">
                        {currentWord.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-medium">
                        Revealed
                      </span>
                    </div>

                    <div className="my-auto text-center space-y-4">
                      <div className="text-6xl sm:text-8xl font-extrabold tracking-wider text-primary hanzi-char drop-shadow-md">
                        {currentWord.character}
                      </div>
                      <div className="text-2xl sm:text-3xl font-semibold text-foreground/90 font-sans tracking-wide">
                        {currentWord.pinyin}
                      </div>
                      {currentWord.notes && (
                        <p className="text-sm text-muted-foreground italic max-w-md mx-auto pt-2">
                          &ldquo;{currentWord.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                      <span className="font-semibold text-foreground">{currentWord.english}</span>
                      <span>Click to flip back</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="outline"
                size="lg"
                disabled={currentIndex === 0}
                onClick={handlePrevCard}
                className="flex-1 rounded-2xl h-12 gap-2"
              >
                <Icons.ArrowLeft size={18} />
                <span>Previous</span>
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={handleFlipCard}
                className="px-6 rounded-2xl h-12 gap-2 font-medium"
              >
                <Icons.Rotate size={18} />
                <span className="hidden sm:inline">Flip Card</span>
              </Button>

              {currentIndex < activeDeck.length - 1 ? (
                <Button
                  size="lg"
                  onClick={handleNextCard}
                  className="flex-1 rounded-2xl h-12 gap-2 bg-primary text-primary-foreground font-medium"
                >
                  <span>Next Card</span>
                  <Icons.ArrowRight size={18} />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setIsPracticing(false)}
                  className="flex-1 rounded-2xl h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow"
                >
                  <Icons.Check size={18} />
                  <span>Finish Review</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
