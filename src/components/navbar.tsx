"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "@/components/icons";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/providers";
import { cn } from "@/lib/utils";

interface NavbarProps {
  totalWords?: number;
  userEmail?: string | null;
  onOpenAuth?: () => void;
  onOpenAddModal?: () => void;
  onOpenImportModal?: () => void;
}

export function Navbar({
  totalWords = 0,
  userEmail = null,
  onOpenAuth,
  onOpenAddModal,
  onOpenImportModal,
}: NavbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const navItems = [
    {
      name: "Word Bank",
      href: "/",
      icon: Icons.Book,
    },
    {
      name: "Flip Cards",
      href: "/review",
      icon: Icons.Cards,
    },
    {
      name: "Matching Game",
      href: "/matching",
      icon: Icons.Game,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Brand Logo with Official SVG assets */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-3 group transition-transform active:scale-95"
          >
            <BrandLogo variant="full" height={30} className="hidden sm:flex" />
            <BrandLogo variant="mark" height={32} className="sm:hidden" />
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-semibold bg-primary/10 text-primary border-primary/20">
              {totalWords} words
            </Badge>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/60">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-background text-foreground shadow-sm font-semibold text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                )}
              >
                <Icon size={16} className={isActive ? "text-primary" : ""} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Action: Add Word Button */}
          {onOpenAddModal && (
            <Button
              onClick={onOpenAddModal}
              size="sm"
              className="hidden sm:flex items-center gap-1.5 bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:bg-primary/90"
            >
              <Icons.Plus size={16} />
              <span>Add Word</span>
            </Button>
          )}

          {/* Quick Action: Import CSV */}
          {onOpenImportModal && (
            <Button
              onClick={onOpenImportModal}
              variant="outline"
              size="sm"
              className="hidden lg:flex items-center gap-1.5"
            >
              <Icons.Upload size={15} />
              <span>Import</span>
            </Button>
          )}

          {/* Theme Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"
                title="Theme switcher"
              >
                {theme === "dark" ? <Icons.Moon size={18} className="text-yellow-400" /> : <Icons.Sun size={18} className="text-amber-500" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Icons.Sun size={14} className="mr-2 text-amber-500" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Icons.Moon size={14} className="mr-2 text-yellow-400" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <span className="mr-2 text-xs">💻</span>
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth Button / Profile Indicator */}
          {userEmail ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl h-9">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px] font-bold">
                    {userEmail.slice(0, 1).toUpperCase()}
                  </div>
                  <span className="text-xs hidden sm:inline max-w-[100px] truncate">
                    {userEmail}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                  Signed in as <strong className="text-foreground">{userEmail}</strong>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onOpenAuth}>
                  <Icons.User size={14} className="mr-2" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenAuth}
              className="rounded-xl h-9 text-xs font-semibold border-border/80"
            >
              <Icons.User size={15} className="mr-1.5 text-muted-foreground" />
              Sync / Cloud
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (PWA Experience) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-t border-border px-4 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} className={isActive ? "text-primary" : ""} />
              <span className="text-[11px]">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
