"use client";

import React, { useState, useEffect, useMemo } from "react";
import confetti from "canvas-confetti";
import { Navbar } from "@/components/navbar";
import { PracticeSelector, PracticeFilters, filterWords } from "@/components/practice-selector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { useWords } from "@/hooks/use-words";
import { formatTime, cn } from "@/lib/utils";
import { WordItem } from "@/lib/constants/categories";

type PairingMode = "english-character" | "english-pinyin" | "pinyin-character";

interface GameCard {
  id: string;
  wordId: string;
  text: string;
  side: "left" | "right";
  isChinese?: boolean;
}

export default function MatchingGamePage() {
  const { words, recordMatch } = useWords();

  // Setup options
  const [pairingMode, setPairingMode] = useState<PairingMode>("english-character");
  const [roundSize, setRoundSize] = useState<number>(6);
  const [filters, setFilters] = useState<PracticeFilters>({
    count: "all",
    dateRange: "all",
    category: "all",
    charCount: "all",
    performance: "all",
  });

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [roundWords, setRoundWords] = useState<WordItem[]>([]);
  const [leftCards, setLeftCards] = useState<GameCard[]>([]);
  const [rightCards, setRightCards] = useState<GameCard[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<GameCard | null>(null);
  const [selectedRight, setSelectedRight] = useState<GameCard | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [mismatchedPair, setMismatchedPair] = useState<{ leftId: string; rightId: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Filter available words
  const availableWords = useMemo(() => {
    return filterWords(words, filters);
  }, [words, filters]);

  // Start game round
  const startGame = () => {
    if (availableWords.length < 2) return;

    // Pick random N words based on round size
    const shuffledPool = [...availableWords].sort(() => Math.random() - 0.5);
    const chosenWords = shuffledPool.slice(0, Math.min(roundSize, shuffledPool.length));

    // Construct left & right representations
    const left: GameCard[] = [];
    const right: GameCard[] = [];

    chosenWords.forEach((word) => {
      let leftText = "";
      let rightText = "";
      let isLeftChinese = false;
      let isRightChinese = false;

      switch (pairingMode) {
        case "english-character":
          leftText = word.english;
          rightText = word.character;
          isRightChinese = true;
          break;
        case "english-pinyin":
          leftText = word.english;
          rightText = word.pinyin;
          break;
        case "pinyin-character":
          leftText = word.pinyin;
          rightText = word.character;
          isRightChinese = true;
          break;
      }

      left.push({
        id: `left-${word.id}`,
        wordId: word.id,
        text: leftText,
        side: "left",
        isChinese: isLeftChinese,
      });

      right.push({
        id: `right-${word.id}`,
        wordId: word.id,
        text: rightText,
        side: "right",
        isChinese: isRightChinese,
      });
    });

    setRoundWords(chosenWords);
    setLeftCards([...left].sort(() => Math.random() - 0.5));
    setRightCards([...right].sort(() => Math.random() - 0.5));
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedIds([]);
    setMismatchedPair(null);
    setMistakes(0);
    setSeconds(0);
    setIsCompleted(false);
    setIsPlaying(true);
  };

  // Timer tick
  useEffect(() => {
    if (!isPlaying || isCompleted) return;
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isCompleted]);

  // Handle card selection
  const handleSelectCard = (card: GameCard) => {
    if (mismatchedPair || matchedIds.includes(card.wordId)) return;

    if (card.side === "left") {
      if (selectedLeft?.id === card.id) {
        setSelectedLeft(null);
      } else {
        setSelectedLeft(card);
        if (selectedRight) {
          evaluateMatch(card, selectedRight);
        }
      }
    } else {
      if (selectedRight?.id === card.id) {
        setSelectedRight(null);
      } else {
        setSelectedRight(card);
        if (selectedLeft) {
          evaluateMatch(selectedLeft, card);
        }
      }
    }
  };

  // Match evaluation logic
  const evaluateMatch = (left: GameCard, right: GameCard) => {
    if (left.wordId === right.wordId) {
      // Correct match!
      recordMatch(left.wordId, true);
      const nextMatched = [...matchedIds, left.wordId];
      setMatchedIds(nextMatched);
      setSelectedLeft(null);
      setSelectedRight(null);

      // Check victory
      if (nextMatched.length === roundWords.length) {
        setIsCompleted(true);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } else {
      // Incorrect match!
      recordMatch(left.wordId, false);
      recordMatch(right.wordId, false);
      setMistakes((prev) => prev + 1);
      setMismatchedPair({ leftId: left.id, rightId: right.id });

      setTimeout(() => {
        setMismatchedPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 750);
    }
  };

  return (
    <>
      <Navbar totalWords={words.length} />

      <main className="flex-1 container px-4 sm:px-8 py-6 space-y-6 max-w-4xl mx-auto pb-24 md:pb-12">
        {!isPlaying ? (
          <div className="space-y-6">
            {/* Header Hero Banner */}
            <Card className="bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/25 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="jade" className="text-xs px-2.5 py-0.5 font-semibold">
                    <Icons.Game size={13} className="mr-1 inline" />
                    Practice Mode
                  </Badge>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  Mandarin Matching Game
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Match words rapidly between English meanings, Pinyin tones, and Chinese Hanzi to build quick recognition.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Game Configuration Card */}
            <Card className="p-6 space-y-6 shadow-sm">
              <div className="flex items-center gap-2 border-b pb-3">
                <Icons.Game size={18} className="text-primary" />
                <h3 className="text-base font-semibold">Round Settings</h3>
              </div>

              {/* Pairing Mode Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Pairing Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "english-character", title: "English ↔ Hanzi", desc: "Meaning to Character" },
                    { id: "english-pinyin", title: "English ↔ Pinyin", desc: "Meaning to Pronunciation" },
                    { id: "pinyin-character", title: "Pinyin ↔ Hanzi", desc: "Tones to Character" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPairingMode(m.id as PairingMode)}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all duration-200 flex flex-col space-y-1",
                        pairingMode === m.id
                          ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/30 shadow-sm"
                          : "border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span className="font-bold text-sm text-foreground">{m.title}</span>
                      <span className="text-[11px] text-muted-foreground">{m.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Round Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Round Size (Pairs per round)
                </label>
                <div className="flex items-center gap-3">
                  {[4, 6, 8, 10, 12].map((size) => (
                    <Button
                      key={size}
                      type="button"
                      variant={roundSize === size ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRoundSize(size)}
                      className={cn(
                        "rounded-xl h-10 w-12 font-bold",
                        roundSize === size ? "bg-primary text-white" : ""
                      )}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Practice Set Selector */}
            <PracticeSelector
              filters={filters}
              onChange={setFilters}
              totalAvailable={words.length}
              selectedCount={availableWords.length}
            />

            {/* Start Round Button */}
            <div className="flex justify-center pt-2">
              <Button
                size="lg"
                disabled={availableWords.length < 2}
                onClick={startGame}
                className="w-full sm:w-auto px-10 h-14 rounded-2xl text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 gap-2"
              >
                <Icons.Game size={20} />
                <span>Start Matching Round ({Math.min(roundSize, availableWords.length)} Pairs)</span>
              </Button>
            </div>
          </div>
        ) : (
          /* Active Gameplay Board */
          <div className="space-y-6">
            {/* Top Scorebar Card */}
            <Card className="p-4 flex items-center justify-between shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPlaying(false)}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <Icons.ArrowLeft size={16} />
                <span>Quit Round</span>
              </Button>

              <div className="flex items-center gap-6 text-sm font-medium">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Icons.Clock size={16} />
                  <span className="font-mono text-foreground font-bold">
                    {formatTime(seconds)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>Mistakes:</span>
                  <span
                    className={cn(
                      "font-bold font-mono",
                      mistakes === 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {mistakes}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>Matched:</span>
                  <Badge variant="jade" className="font-bold text-xs px-2 py-0.5">
                    {matchedIds.length} / {roundWords.length}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Board Column Layout */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  {pairingMode.split("-")[0].toUpperCase()}
                </span>
                <div className="space-y-2.5">
                  {leftCards.map((card) => {
                    const isMatched = matchedIds.includes(card.wordId);
                    const isSelected = selectedLeft?.id === card.id;
                    const isError = mismatchedPair?.leftId === card.id;

                    return (
                      <button
                        key={card.id}
                        disabled={isMatched}
                        onClick={() => handleSelectCard(card)}
                        className={cn(
                          "w-full p-4 rounded-2xl border text-left font-semibold transition-all duration-200 flex items-center justify-between min-h-[64px] sm:min-h-[72px] select-none",
                          isMatched
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 opacity-60 pointer-events-none"
                            : isError
                            ? "bg-rose-500/20 border-rose-500 text-rose-700 animate-shake"
                            : isSelected
                            ? "bg-primary/15 border-primary text-primary ring-2 ring-primary/40 shadow-md scale-[1.02]"
                            : "bg-card hover:bg-muted/40 hover:border-primary/40 border-border text-foreground shadow-sm"
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm sm:text-base tracking-tight",
                            card.isChinese ? "hanzi-char text-xl sm:text-2xl font-bold" : ""
                          )}
                        >
                          {card.text}
                        </span>
                        {isMatched && <Icons.Check size={18} className="text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  {pairingMode.split("-")[1].toUpperCase()}
                </span>
                <div className="space-y-2.5">
                  {rightCards.map((card) => {
                    const isMatched = matchedIds.includes(card.wordId);
                    const isSelected = selectedRight?.id === card.id;
                    const isError = mismatchedPair?.rightId === card.id;

                    return (
                      <button
                        key={card.id}
                        disabled={isMatched}
                        onClick={() => handleSelectCard(card)}
                        className={cn(
                          "w-full p-4 rounded-2xl border text-left font-semibold transition-all duration-200 flex items-center justify-between min-h-[64px] sm:min-h-[72px] select-none",
                          isMatched
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 opacity-60 pointer-events-none"
                            : isError
                            ? "bg-rose-500/20 border-rose-500 text-rose-700 animate-shake"
                            : isSelected
                            ? "bg-primary/15 border-primary text-primary ring-2 ring-primary/40 shadow-md scale-[1.02]"
                            : "bg-card hover:bg-muted/40 hover:border-primary/40 border-border text-foreground shadow-sm"
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm sm:text-base tracking-tight",
                            card.isChinese ? "hanzi-char text-xl sm:text-2xl font-bold" : ""
                          )}
                        >
                          {card.text}
                        </span>
                        {isMatched && <Icons.Check size={18} className="text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Round Completion Victory Dialog */}
        <Dialog open={isCompleted} onOpenChange={setIsCompleted}>
          <DialogContent className="sm:max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 shadow-inner my-2">
              <Icons.Trophy size={36} />
            </div>

            <DialogHeader className="text-center sm:text-center">
              <DialogTitle className="text-2xl font-extrabold tracking-tight">Round Completed!</DialogTitle>
              <DialogDescription className="text-xs">
                Excellent practice! Your mastery statistics have been updated.
              </DialogDescription>
            </DialogHeader>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-3 gap-2 p-4 rounded-2xl bg-muted/50 border text-center my-2">
              <div>
                <div className="text-lg font-bold font-mono text-foreground">
                  {formatTime(seconds)}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium">
                  Time
                </div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {Math.round((roundWords.length / (roundWords.length + mistakes)) * 100)}%
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium">
                  Accuracy
                </div>
              </div>
              <div>
                <div className="text-lg font-bold font-mono text-rose-600 dark:text-rose-400">
                  {mistakes}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium">
                  Mistakes
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsPlaying(false)}
                className="flex-1 rounded-xl h-11"
              >
                Change Settings
              </Button>
              <Button
                onClick={startGame}
                className="flex-1 rounded-xl h-11 bg-primary text-primary-foreground font-semibold shadow"
              >
                Play Again
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
