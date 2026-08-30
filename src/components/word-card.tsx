"use client";

import React, { useState } from "react";
import { WordItem } from "@/lib/constants/categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";

interface WordCardProps {
  word: WordItem;
  onEdit: (word: WordItem) => void;
  onDelete: (id: string) => void;
  onReviewed?: (id: string) => void;
}

export function WordCard({ word, onEdit, onDelete, onReviewed }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleFlip = () => {
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    if (nextFlipped && onReviewed) {
      onReviewed(word.id);
    }
  };

  const timesReviewed = word.timesReviewed || 0;
  const timesCorrect = word.timesCorrect || 0;
  const timesIncorrect = word.timesIncorrect || 0;
  const totalAttempts = timesCorrect + timesIncorrect;
  const accuracy = totalAttempts > 0 ? Math.round((timesCorrect / totalAttempts) * 100) : null;

  return (
    <>
      <div className="perspective-1000 w-full h-[240px] group select-none">
        <div
          className={cn(
            "relative w-full h-full duration-500 transform-style-3d transition-transform cursor-pointer",
            isFlipped ? "rotate-y-180" : ""
          )}
          onClick={handleFlip}
        >
          {/* FRONT OF CARD: English word */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl border border-border/70 bg-card/90 backdrop-blur-sm p-5 flex flex-col justify-between shadow-sm group-hover:shadow-md group-hover:border-primary/40 transition-all duration-300">
            {/* Top meta */}
            <div className="flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
              <Badge variant="outline" className="capitalize text-[11px] font-medium bg-muted/60">
                {word.category}
              </Badge>

              {/* Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                    title="Options"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36">
                  <DropdownMenuItem onClick={() => onEdit(word)}>
                    <Icons.Edit size={14} className="mr-1.5" />
                    <span>Edit Word</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <Icons.Trash size={14} className="mr-1.5" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Card Body - English */}
            <div className="my-auto text-center px-2">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-2">
                {word.english}
              </h3>
              <span className="text-[11px] text-muted-foreground mt-1.5 inline-flex items-center gap-1 group-hover:text-primary transition-colors">
                <Icons.Rotate size={12} /> Tap card to reveal Hanzi
              </span>
            </div>

            {/* Bottom stats & character count */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2.5 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground">{word.characterCount}</span>
                <span>{word.characterCount === 1 ? "char" : "chars"}</span>
              </div>

              {accuracy !== null ? (
                <span
                  className={cn(
                    "font-semibold px-2 py-0.5 rounded-full text-[10px]",
                    accuracy >= 80
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : accuracy >= 50
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  )}
                >
                  {accuracy}% accuracy
                </span>
              ) : timesReviewed > 0 ? (
                <span className="text-muted-foreground">{timesReviewed} reviews</span>
              ) : (
                <span className="text-muted-foreground/60 italic">New word</span>
              )}
            </div>
          </div>

          {/* BACK OF CARD: Pinyin + Hanzi Character */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl border border-primary/35 bg-gradient-to-br from-primary/5 via-card to-card p-5 flex flex-col justify-between shadow-md">
            {/* Top meta */}
            <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
              <Badge variant="violet" className="text-[11px] font-semibold">
                {word.category}
              </Badge>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleFlip}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                title="Flip back"
              >
                <Icons.Rotate size={14} />
              </Button>
            </div>

            {/* Card Body - Pinyin & Hanzi */}
            <div className="my-auto text-center px-2">
              <div className="text-3xl sm:text-4xl font-bold tracking-wide text-primary hanzi-char mb-1 drop-shadow-sm">
                {word.character}
              </div>
              <div className="text-base sm:text-lg font-medium text-foreground/90 tracking-wide font-sans">
                {word.pinyin}
              </div>
              {word.notes && (
                <p className="text-[11px] text-muted-foreground italic mt-2 line-clamp-1">
                  &ldquo;{word.notes}&rdquo;
                </p>
              )}
            </div>

            {/* Bottom tag row */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2.5 border-t border-border/50">
              <span className="truncate max-w-[150px] font-medium text-foreground">
                {word.english}
              </span>
              <div className="flex items-center gap-1">
                {word.tags?.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog using shadcn Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-lg">
              <span className="p-2 rounded-xl bg-destructive/10">
                <Icons.Trash size={18} />
              </span>
              <span>Delete Word?</span>
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm">
              Are you sure you want to delete &ldquo;<strong>{word.english}</strong>&rdquo; ({word.character})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onDelete(word.id);
                setShowDeleteConfirm(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
