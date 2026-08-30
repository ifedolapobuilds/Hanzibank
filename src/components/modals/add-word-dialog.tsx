"use client";

import React, { useState, useEffect } from "react";
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
  }) => void;
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
  ) => void;
  editingWord?: WordItem | null;
  isDuplicateEnglish: (english: string, excludeId?: string) => boolean;
}

export function AddWordDialog({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingWord,
  isDuplicateEnglish,
}: AddWordDialogProps) {
  const [english, setEnglish] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [character, setCharacter] = useState("");
  const [category, setCategory] = useState("greetings");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [isCustomCat, setIsCustomCat] = useState(false);

  useEffect(() => {
    if (editingWord) {
      setEnglish(editingWord.english);
      setPinyin(editingWord.pinyin);
      setCharacter(editingWord.character);
      if (DEFAULT_CATEGORIES.includes(editingWord.category as any)) {
        setCategory(editingWord.category);
        setIsCustomCat(false);
      } else {
        setCategory("custom");
        setCustomCategory(editingWord.category);
        setIsCustomCat(true);
      }
      setTags(editingWord.tags || []);
      setNotes(editingWord.notes || "");
      setAllowDuplicate(false);
    } else {
      setEnglish("");
      setPinyin("");
      setCharacter("");
      setCategory("greetings");
      setCustomCategory("");
      setIsCustomCat(false);
      setTags([]);
      setNotes("");
      setAllowDuplicate(false);
    }
  }, [editingWord, isOpen]);

  const charCount = getCharacterCount(character);
  const convertedPinyin = convertNumberedToDiacriticPinyin(pinyin);
  const isDuplicate = isDuplicateEnglish(english, editingWord?.id);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!english.trim() || !pinyin.trim() || !character.trim()) return;
    if (isDuplicate && !allowDuplicate) return;

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

    if (editingWord && onUpdate) {
      onUpdate(editingWord.id, payload);
    } else {
      onSave(payload);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
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

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* English Input */}
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
                  {charCount} {charCount === 1 ? "char" : "chars"}
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
                !english.trim() ||
                !pinyin.trim() ||
                !character.trim() ||
                (isDuplicate && !allowDuplicate)
              }
              className="bg-primary text-primary-foreground font-semibold"
            >
              {editingWord ? "Save Changes" : "Add to Word Bank"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
