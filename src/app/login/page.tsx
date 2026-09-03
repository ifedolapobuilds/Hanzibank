"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/providers";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectedFrom = searchParams.get("redirectedFrom") || "/bank";
  const urlError = searchParams.get("error");

  const { user, isLoading, signInWithOtp } = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(urlError);

  // If already logged in, redirect to app
  useEffect(() => {
    if (!isLoading && user) {
      router.push(redirectedFrom);
    }
  }, [user, isLoading, router, redirectedFrom]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        redirectedFrom
      )}`;
      await signInWithOtp(email.trim(), redirectUrl);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMessage(err.message || "Failed to send login link. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-border/80 bg-card/85 backdrop-blur-md shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Sign In with Magic Link</CardTitle>
        <CardDescription>
          We'll email you a secure, passwordless one-click sign-in link.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div className="py-4 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Icons.Check size={28} />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-lg">Check your inbox</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                We sent a login magic link to <strong className="text-foreground">{email}</strong>. Click the link in your email to instantly enter the app.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSuccess(false)}
              className="mt-2 text-xs"
            >
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
                <Icons.X size={15} className="flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="h-11 pl-3.5 bg-background text-sm"
                  autoFocus
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full h-11 bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Icons.Rotate size={16} className="animate-spin" />
                  Sending Magic Link...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Send Magic Link</span>
                  <Icons.ArrowRight size={16} />
                </span>
              )}
            </Button>

            <div className="pt-2 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <Icons.Shield size={13} className="text-emerald-500" />
              <span>Secure authentication powered by Supabase Auth</span>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-background via-card/20 to-background">
      {/* Top Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
          <BrandLogo variant="full" height={32} />
        </Link>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Toggle theme"
          >
            {theme === "dark" ? <Icons.Moon size={18} className="text-yellow-400" /> : <Icons.Sun size={18} className="text-amber-500" />}
          </Button>

          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
              <Icons.Rotate size={13} className="rotate-180" />
              <span>Back to Home</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 text-primary mb-2 shadow-inner">
              <span className="font-hanzi text-2xl font-bold">字</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome to HanziBank
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to sync your personal Mandarin word bank across your laptop and mobile devices.
            </p>
          </div>

          <Suspense fallback={
            <Card className="p-8 text-center bg-card/85 backdrop-blur-md">
              <Icons.Rotate size={24} className="animate-spin mx-auto text-primary" />
              <p className="text-xs text-muted-foreground mt-2">Loading login...</p>
            </Card>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 text-center text-xs text-muted-foreground border-t border-border/40">
        <p>© {new Date().getFullYear()} HanziBank. Personal Mandarin Vocabulary & Practice.</p>
      </footer>
    </div>
  );
}
