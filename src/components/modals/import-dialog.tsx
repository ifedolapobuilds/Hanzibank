"use client";

import React, { useState } from "react";
import Papa from "papaparse";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Icons } from "@/components/icons";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    words: Array<{
      english: string;
      pinyin: string;
      character: string;
      category?: string;
      tags?: string[];
      notes?: string;
    }>
  ) => Promise<any> | void;
  existingEnglishWords: string[];
}

interface ParsedRow {
  english: string;
  pinyin: string;
  character: string;
  category: string;
  tags: string[];
  notes: string;
  isValid: boolean;
  isDuplicate: boolean;
  errorReason?: string;
}

export function ImportDialog({
  isOpen,
  onClose,
  onImport,
  existingEnglishWords,
}: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setIsProcessing(false);
    setParseError(null);
    setDbError(null);
  };

  const convertNumberedToDiacriticPinyin = (pinyin: string) => {
    // Simple helper if you need to transform pinyin, otherwise return as is
    return pinyin;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setParseError(null);
    setDbError(null);
    setIsProcessing(true);

    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (ext === "json") {
      parseJsonFile(selected);
    } else {
      parseCsvFile(selected);
    }
  };

  const parseJsonFile = (jsonFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error("JSON file must contain an array of word objects.");
        }
        processRawItems(parsed);
      } catch (err: any) {
        setParseError(err.message || "Failed to parse JSON file.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setParseError("Could not read file from disk.");
      setIsProcessing(false);
    };
    reader.readAsText(jsonFile);
  };

  const parseCsvFile = (csvFile: File) => {
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setParseError(results.errors[0]?.message || "Failed to parse CSV.");
          setIsProcessing(false);
          return;
        }
        processRawItems(results.data);
        setIsProcessing(false);
      },
      error: (err) => {
        setParseError(err.message || "CSV parse error.");
        setIsProcessing(false);
      },
    });
  };

  const processRawItems = (items: any[]) => {
    const rows: ParsedRow[] = items.map((item) => {
      const english = String(item.english || "").trim();
      const pinyin = String(item.pinyin || "").trim();
      const character = String(item.character || item.hanzi || item.chinese || "").trim();
      const category = String(item.category || "miscellaneous").trim();

      let tags: string[] = [];
      if (Array.isArray(item.tags)) {
        tags = item.tags.map((t: any) => String(t).trim()).filter(Boolean);
      } else if (typeof item.tags === "string" && item.tags.trim()) {
        tags = item.tags
          .split(/[;,]/)
          .map((t: string) => t.trim())
          .filter(Boolean);
      }

      const notes = String(item.notes || item.note || "").trim();

      const missingFields: string[] = [];
      if (!english) missingFields.push("english");
      if (!pinyin) missingFields.push("pinyin");
      if (!character) missingFields.push("character");

      const isValid = missingFields.length === 0;
      const isDuplicate = existingEnglishWords.some(
        (w) => w.trim().toLowerCase() === english.toLowerCase()
      );

      return {
        english,
        pinyin: convertNumberedToDiacriticPinyin(pinyin),
        character,
        category: category || "miscellaneous",
        tags,
        notes,
        isValid,
        isDuplicate,
        errorReason: isValid
          ? isDuplicate
            ? "Duplicate English word"
            : undefined
          : `Missing required: ${missingFields.join(", ")}`,
      };
    });

    setParsedRows(rows);
  };

  const validRows = parsedRows.filter((r) => r.isValid && (!skipDuplicates || !r.isDuplicate));
  const duplicateCount = parsedRows.filter((r) => r.isValid && r.isDuplicate).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  const handleCommit = async () => {
    if (validRows.length === 0) return;
    setDbError(null);
    setIsProcessing(true);

    try {
      await onImport(
        validRows.map((r) => ({
          english: r.english,
          pinyin: r.pinyin,
          character: r.character,
          category: r.category,
          tags: r.tags,
          notes: r.notes,
        }))
      );
      resetState();
      onClose();
    } catch (err: any) {
      console.error("Bulk import database error:", err);
      setDbError(
        err.message?.includes("user_english_idx") || err.code === "23505"
          ? "Import stopped: One or more words already exist in your word bank. Please enable 'Skip Duplicate English Words'."
          : err.message || "Failed to write imported rows to the database. Please check your connection."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isProcessing && (resetState(), onClose())}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Icons.Upload size={18} />
            </span>
            <span>Bulk Import Words (CSV / JSON)</span>
          </DialogTitle>
          <DialogDescription>
            Import multiple vocabulary entries at once. Required headers: <code>english</code>, <code>pinyin</code>, <code>character</code>.
          </DialogDescription>
        </DialogHeader>

        {dbError && (
          <div className="p-3 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs flex items-center gap-2 my-2">
            <Icons.Shield size={16} className="shrink-0" />
            <span>{dbError}</span>
          </div>
        )}

        {!file ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/20 my-4">
            <div className="p-4 rounded-full bg-primary/10 text-primary mb-3">
              <Icons.Upload size={28} />
            </div>
            <h4 className="text-sm font-semibold mb-1">
              Select or drop your CSV or JSON file here
            </h4>
            <p className="text-xs text-muted-foreground mb-4 max-w-sm">
              Columns: <code>english</code>, <code>pinyin</code> (diacritics or numbers), <code>character</code>, optional <code>category</code>, <code>tags</code>.
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".csv, .json"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button type="button" variant="default" className="pointer-events-none">
                Choose File
              </Button>
            </label>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden pt-2">
            {/* Summary Grid */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-muted/40 rounded-xl border border-border/60 text-center">
              <div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {validRows.length}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Ready to Import
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {duplicateCount}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Duplicates Found
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {invalidCount}
                </div>
                <div className="text-[11px] text-muted-foreground font-medium">
                  Invalid / Missing
                </div>
              </div>
            </div>

            {/* Duplicate Strategy Option */}
            {duplicateCount > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
                <span className="font-medium text-amber-700 dark:text-amber-300">
                  {duplicateCount} duplicate words found in current bank.
                </span>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-dup-import"
                    checked={skipDuplicates}
                    onCheckedChange={(checked) => setSkipDuplicates(!!checked)}
                  />
                  <label
                    htmlFor="skip-dup-import"
                    className="font-medium text-foreground cursor-pointer"
                  >
                    Skip duplicates (Recommended)
                  </label>
                </div>
              </div>
            )}

            {/* Preview Table using shadcn Table */}
            <div className="flex-1 border rounded-xl overflow-y-auto max-h-[260px] bg-card/60">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>English</TableHead>
                    <TableHead>Pinyin</TableHead>
                    <TableHead>Character</TableHead>
                    <TableHead>Category</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={
                        !row.isValid
                          ? "bg-rose-500/10 hover:bg-rose-500/15"
                          : row.isDuplicate
                          ? "bg-amber-500/10 hover:bg-amber-500/15"
                          : ""
                      }
                    >
                      <TableCell>
                        {!row.isValid ? (
                          <Badge variant="destructive" className="text-[10px] py-0">
                            Invalid
                          </Badge>
                        ) : row.isDuplicate ? (
                          <Badge variant="gold" className="text-[10px] py-0">
                            Duplicate
                          </Badge>
                        ) : (
                          <Badge variant="jade" className="text-[10px] py-0">
                            Valid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.english || "—"}</TableCell>
                      <TableCell>{row.pinyin || "—"}</TableCell>
                      <TableCell className="hanzi-char text-base">{row.character || "—"}</TableCell>
                      <TableCell className="text-muted-foreground capitalize">
                        {row.category}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="pt-3 border-t">
          {file && (
            <Button
              type="button"
              variant="outline"
              onClick={resetState}
              className="mr-auto"
            >
              Choose Different File
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={validRows.length === 0 || isProcessing}
            onClick={handleCommit}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow min-w-[150px]"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Icons.Rotate size={16} className="animate-spin" />
                <span>Importing...</span>
              </span>
            ) : (
              `Import ${validRows.length} Words`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
