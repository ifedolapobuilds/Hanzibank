"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/providers";

export default function LandingPage() {
  const { user, isLoading } = useAuth();
  const { theme, setTheme } = useTheme();

  // Interactive Demo Card Flip State for the Hero
  const [demoFlipped, setDemoFlipped] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Landing Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 group transition-transform active:scale-95">
            <BrandLogo variant="full" height={32} />
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
              title="Toggle theme"
            >
              {theme === "dark" ? <Icons.Moon size={18} className="text-yellow-400" /> : <Icons.Sun size={18} className="text-amber-500" />}
            </Button>

            {!isLoading && user ? (
              <Link href="/bank">
                <Button className="bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20 hover:bg-primary/90 gap-1.5 rounded-xl h-9 text-xs sm:text-sm">
                  <span>Enter App</span>
                  <Icons.ArrowRight size={14} />
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20 hover:bg-primary/90 gap-1.5 rounded-xl h-9 text-xs sm:text-sm">
                  <Icons.User size={14} />
                  <span>Log In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-primary/15 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-yellow-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

          <div className="container max-w-6xl mx-auto px-4 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Hero Content */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold shadow-sm">
                  <Icons.Sparkles size={14} className="text-yellow-400" />
                  <span>Personal Mandarin Practice App</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-5xl font-medium tracking-tight text-foreground leading-[1.15]">
                  Master Chinese Vocabulary,{" "}
                  <span className="bg-gradient-to-r from-primary via-purple-400 to-yellow-400 bg-clip-text text-transparent">
                    One Card at a Time.
                  </span>
                </h1>

                <p className="text-base sm:text-md text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Manage your personal Chinese word bank with automated tone diacritics, 3D interactive flip-card review, rapid matching games, and seamless cloud synchronization.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                  {!isLoading && user ? (
                    <Link href="/bank" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto h-12 px-6 bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 gap-2 rounded-xl text-base">
                        <span>Open Word Bank</span>
                        <Icons.ArrowRight size={18} />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/login" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto h-12 px-6 bg-primary text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:bg-primary/90 gap-2 rounded-xl text-base">
                        <span>Log In to Get Started</span>
                        <Icons.ArrowRight size={18} />
                      </Button>
                    </Link>
                  )}

                  <a href="#features" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-5 border-border/80 rounded-xl text-sm font-medium">
                      See How It Works
                    </Button>
                  </a>
                </div>

                {/* Micro social proof badges */}
                <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Icons.Check size={15} className="text-emerald-500" />
                    <span>Cross-Device Sync</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icons.Check size={15} className="text-emerald-500" />
                    <span>Accurate Tone Diacritics</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Icons.Check size={15} className="text-emerald-500" />
                    <span>PWA Installable</span>
                  </div>
                </div>
              </div>

              {/* Right Hero Interactive 3D Card Preview */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[340px] perspective-1000">
                  <div className="text-center pb-2 text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1">
                    <Icons.Rotate size={12} className="text-primary animate-pulse" />
                    <span>Click card to test flip</span>
                  </div>

                  <div
                    className={`relative w-full h-[280px] duration-500 transform-style-3d transition-transform cursor-pointer select-none ${demoFlipped ? "rotate-y-180" : ""
                      }`}
                    onClick={() => setDemoFlipped(!demoFlipped)}
                  >
                    {/* Front: English */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl border-2 border-border/80 bg-card p-6 flex flex-col justify-between shadow-2xl hover:border-primary/50 transition-all">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[11px] font-semibold bg-muted/60">
                          Greetings
                        </Badge>
                        <span className="text-xs text-muted-foreground">2 characters</span>
                      </div>

                      <div className="text-center space-y-1 my-auto">
                        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                          English
                        </span>
                        <h3 className="text-3xl font-extrabold text-foreground">
                          Hello
                        </h3>
                      </div>

                      <div className="text-center text-xs text-primary font-medium flex items-center justify-center gap-1">
                        <Icons.Rotate size={13} /> Tap to reveal Hanzi
                      </div>
                    </div>

                    {/* Back: Pinyin + Hanzi */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl border-2 border-primary/40 bg-gradient-to-b from-primary/10 via-card to-card p-6 flex flex-col justify-between shadow-2xl">
                      <div className="flex items-center justify-between">
                        <Badge variant="violet" className="text-[11px] font-semibold">
                          Greetings
                        </Badge>
                        <span className="text-xs text-emerald-500 font-medium">Mastered</span>
                      </div>

                      <div className="text-center space-y-1 my-auto">
                        <span className="text-base font-semibold text-primary/90 tracking-wide">
                          nǐ hǎo
                        </span>
                        <div className="hanzi-char text-5xl font-bold text-foreground font-hanzi">
                          你好
                        </div>
                      </div>

                      <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                        <Icons.Rotate size={13} /> Tap to flip back
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase Section */}
        <section id="features" className="py-16 sm:py-20 bg-muted/20 border-t border-border/60">
          <div className="container max-w-6xl mx-auto px-4 sm:px-8 space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <Badge variant="outline" className="text-xs font-semibold px-3 py-0.5">
                Core Capabilities
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight">
                Everything you need to master your vocab
              </h2>
              <p className="text-sm text-muted-foreground">
                Designed specifically for Chinese learners who want a clean, distraction-free environment for retaining vocabulary.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <Card className="p-6 space-y-4 bg-card/90 border-border/70 shadow-sm hover:shadow-md hover:border-primary/40 transition-all rounded-2xl">
                <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icons.Book size={22} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold">Personal Word Bank</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Store words with English meaning, Hanzi characters, and automatic Pinyin tone diacritics. Filter by category, tag, or character count.
                  </p>
                </div>
              </Card>

              {/* Feature 2 */}
              <Card className="p-6 space-y-4 bg-card/90 border-border/70 shadow-sm hover:shadow-md hover:border-primary/40 transition-all rounded-2xl">
                <div className="h-11 w-11 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                  <Icons.Cards size={22} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold">3D Flip-Card Review</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Test your memory with fluid 3D card flips. Build custom study sets by random sample, category, or focus on your weakest words.
                  </p>
                </div>
              </Card>

              {/* Feature 3 */}
              <Card className="p-6 space-y-4 bg-card/90 border-border/70 shadow-sm hover:shadow-md hover:border-primary/40 transition-all rounded-2xl">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Icons.Game size={22} />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold">Matching Game</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Reinforce associations with speed matching between English, Pinyin, and Characters. Track round streaks and accuracy stats.
                  </p>
                </div>
              </Card>
            </div>

            {/* Bottom CTA Banner */}
            <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-primary/20 via-card to-card border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div className="space-y-1.5 text-center sm:text-left">
                <h3 className="text-3xl font-medium tracking-tight">
                  Ready to practice your Chinese?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sign in with your email to start building and syncing your vocabulary bank.
                </p>
              </div>

              {!isLoading && user ? (
                <Link href="/bank" className="flex-shrink-0">
                  <Button size="lg" className="h-11 px-6 bg-primary text-primary-foreground font-medium shadow-md hover:bg-primary/90 rounded-xl text-sm gap-2">
                    <span>Enter Word Bank</span>
                    <Icons.ArrowRight size={16} />
                  </Button>
                </Link>
              ) : (
                <Link href="/login" className="flex-shrink-0">
                  <Button size="lg" className="h-11 px-6 bg-primary text-primary-foreground font-medium shadow-md hover:bg-primary/90 rounded-xl text-sm gap-2">
                    <span>Log In to App</span>
                    <Icons.ArrowRight size={16} />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Landing Footer */}
      <footer className="border-t border-border/50 py-8 bg-background">
        <div className="container max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <BrandLogo variant="mark" height={30} />
            <span>© {new Date().getFullYear()} HanziBank. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Log In
            </Link>
            <Link href="/bank" className="hover:text-foreground transition-colors">
              Word Bank
            </Link>
            <Link href="/review" className="hover:text-foreground transition-colors">
              Flip Cards
            </Link>
            <Link href="/matching" className="hover:text-foreground transition-colors">
              Matching Game
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
