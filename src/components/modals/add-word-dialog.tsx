"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_CATEGORIES, WordItem } from "@/lib/constants/categories";
import { getCharacterCount, convertNumberedToDiacriticPinyin } from "@/lib/utils/pinyin";
import { Icons } from "@/components/icons";

interface AddWordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wordData: {
    english: string;
    pinyin: string;
    character: string;
    category: string;
    tags: string[];
    notes?: string;
  }) => Promise<any> | void;
  onUpdate?: (
    id: string,
    wordData: {
      english: string;
      pinyin: string;
      character: string;
      category: string;
      tags: string[];
      notes?: string;
    }
  ) => Promise<any> | void;
  isDuplicateEnglish: (english: string, excludeId?: string) => boolean;
  editingWord?: WordItem | null;
}

export function AddWordDialog({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  isDuplicateEnglish,
  editingWord,
}: AddWordDialogProps) {
  const [english, setEnglish] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [character, setCharacter] = useState("");
  const [category, setCategory] = useState("greetings");
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState("");
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (editingWord) {
      setEnglish(editingWord.english);
      setPinyin(editingWord.pinyin);
      setCharacter(editingWord.character);
      const isPredefined = DEFAULT_CATEGORIES.some(
        (c) => c === editingWord.category
      );
      if (isPredefined) {
        setCategory(editingWord.category);
        setIsCustomCat(false);
        setCustomCategory("");
      } else {
        setIsCustomCat(true);
        setCustomCategory(editingWord.category);
        setCategory("custom");
      }
      setTags(editingWord.tags || []);
      setNotes(editingWord.notes || "");
      setAllowDuplicate(false);
      setDbError(null);
    } else {
      setEnglish("");
      setPinyin("");
      setCharacter("");
      setCategory("greetings");
      setIsCustomCat(false);
      setCustomCategory("");
      setTags([]);
      setNotes("");
      setAllowDuplicate(false);
      setDbError(null);
    }
  }, [editingWord, isOpen]);

  const convertedPinyin = useMemo(() => {
    return convertNumberedToDiacriticPinyin(pinyin);
  }, [pinyin]);

  const characterCount = useMemo(() => {
    return getCharacterCount(character);
  }, [character]);

  const isDuplicate = useMemo(() => {
    if (!english.trim()) return false;
    return isDuplicateEnglish(english, editingWord?.id);
  }, [english, isDuplicateEnglish, editingWord]);

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter" && e.key !== ",") return;
    e.preventDefault();
    const clean = tagInput.trim().replace(/^#/, "").toLowerCase();
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !pinyin.trim() || !character.trim()) return;
    if (isDuplicate && !allowDuplicate) return;

    setDbError(null);
    setIsSubmitting(true);

    const finalCategory = isCustomCat
      ? customCategory.trim() || "miscellaneous"
      : category;

    const payload = {
      english: english.trim(),
      pinyin: convertedPinyin.trim(),
      character: character.trim(),
      category: finalCategory,
      tags,
      notes: notes.trim(),
    };

    try {
      if (editingWord && onUpdate) {
        await onUpdate(editingWord.id, payload);
      } else {
        await onSave(payload);
      }
      onClose();
    } catch (err: any) {
      console.error("Database submission error:", err);
      setDbError(
        err.message?.includes("user_english_idx") || err.code === "23505"
          ? "A word with this English meaning already exists in your account."
          : err.message || "Failed to save word to database. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {editingWord ? <Icons.Edit size={18} /> : <Icons.Plus size={18} />}
            </span>
            <span>{editingWord ? "Edit Word Entry" : "Add Word to Bank"}</span>
          </DialogTitle>
          <DialogDescription>
            Enter the English meaning, Pinyin pronunciation, and Chinese character.
          </DialogDescription>
        </DialogHeader>

        {dbError && (
          <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <Icons.Alert size={16} className="shrink-0" />
            <span>{dbError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="english-input">
              English Meaning <span className="text-primary">*</span>
            </Label>
            <Input
              id="english-input"
              required
              placeholder="e.g. Hello / Dumplings / Forbidden City"
              value={english}
              onChange={(e) => setEnglish(e.target.value)}
              className="text-base"
            />
            {/* Duplicate Warning */}
            {isDuplicate && (
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
                <div className="flex items-center gap-1.5 font-medium">
                  <Icons.Alert size={15} />
                  <span>Duplicate warning: &apos;{english}&apos; already exists in your word bank.</span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Checkbox
                    id="allow-dup"
                    checked={allowDuplicate}
                    onCheckedChange={(checked) => setAllowDuplicate(!!checked)}
                  />
                  <label
                    htmlFor="allow-dup"
                    className="text-xs font-medium text-foreground cursor-pointer"
                  >
                    Allow duplicate entry (e.g. different context / definition)
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Pinyin & Character Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pinyin */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pinyin-input">
                  Pinyin <span className="text-primary">*</span>
                </Label>
                <span className="text-[11px] font-normal text-muted-foreground">e.g. nǐ hǎo or ni3 hao3</span>
              </div>
              <Input
                id="pinyin-input"
                required
                placeholder="nǐ hǎo (or ni3 hao3)"
                value={pinyin}
                onChange={(e) => setPinyin(e.target.value)}
              />
              {convertedPinyin !== pinyin && pinyin.trim() && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">
                  Converted: <strong>{convertedPinyin}</strong>
                </span>
              )}
            </div>

            {/* Character */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="character-input">
                  Simplified Hanzi <span className="text-primary">*</span>
                </Label>
                <span className="text-[11px] font-medium text-primary">
                  {characterCount} {characterCount === 1 ? "char" : "chars"}
                </span>
              </div>
              <Input
                id="character-input"
                required
                placeholder="你好"
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                className="hanzi-char text-lg"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Select
                value={isCustomCat ? "custom" : category}
                onValueChange={(val) => {
                  if (val === "custom") {
                    setIsCustomCat(true);
                  } else {
                    setIsCustomCat(false);
                    setCategory(val);
                  }
                }}
              >
                <SelectTrigger className="w-full capitalize">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">+ Add custom category...</SelectItem>
                </SelectContent>
              </Select>

              {isCustomCat && (
                <Input
                  placeholder="New category name..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags-input">Tags (press Enter or comma to add)</Label>
            <Input
              id="tags-input"
              placeholder="e.g. HSK1, daily, slang..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
            />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive text-muted-foreground"
                    >
                      <Icons.X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes-input">Usage Notes / Example (Optional)</Label>
            <Textarea
              id="notes-input"
              placeholder="Example sentence or mnemonic notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !english.trim() ||
                !pinyin.trim() ||
                !character.trim() ||
                (isDuplicate && !allowDuplicate)
              }
              className="bg-primary text-primary-foreground font-medium min-w-[130px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Icons.Rotate size={16} className="animate-spin" />
                  <span>Saving...</span>
                </span>
              ) : editingWord ? (
                "Save Changes"
              ) : (
                "Add to Word Bank"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
