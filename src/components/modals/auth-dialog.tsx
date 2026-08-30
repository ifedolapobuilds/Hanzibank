"use client";

import React, { useState } from "react";
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
import { Icons } from "@/components/icons";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string | null;
  onSignIn?: (email: string) => void;
  onSignOut?: () => void;
}

export function AuthDialog({
  isOpen,
  onClose,
  userEmail,
  onSignIn,
  onSignOut,
}: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);

  const handleSendMagicLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (onSignIn) {
      onSignIn(email.trim());
    }
    setIsSent(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icons.User size={18} />
            </span>
            <span>{userEmail ? "Account & Cloud Sync" : "Sign In with Supabase"}</span>
          </DialogTitle>
          <DialogDescription>
            {userEmail
              ? "Your word bank is connected and syncing across your devices."
              : "Enter your email to receive a secure login magic link."}
          </DialogDescription>
        </DialogHeader>

        {userEmail ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white font-bold">
                {userEmail.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{userEmail}</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Icons.Check size={13} /> Cloud Sync Active (Supabase Postgres)
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              {onSignOut && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    onSignOut();
                    onClose();
                  }}
                >
                  Sign Out
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : isSent ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <Icons.Check size={24} />
            </div>
            <h4 className="text-base font-semibold">Magic Link Sent!</h4>
            <p className="text-sm text-muted-foreground">
              We sent a login link to <strong>{email}</strong>. Check your inbox and click the link to sync your word bank.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSent(false);
                  onClose();
                }}
                className="w-full"
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSendMagicLink} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <Input
                type="email"
                required
                placeholder="your-name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Icons.Sparkles size={14} className="text-amber-500" />
                Cross-Device Synchronization
              </div>
              <p>
                Signing in binds your word bank to your personal Supabase Postgres database. You can review cards on your phone and manage words from your laptop seamlessly.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground">
                Send Magic Link
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
