"use client";

import React from "react";
import Image from "next/image";
import { useTheme } from "@/components/providers";

interface BrandLogoProps {
  variant?: "full" | "mark";
  height?: number;
  className?: string;
}

export function BrandLogo({ variant = "full", height = 32, className = "" }: BrandLogoProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  if (variant === "mark") {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Dynamic Logomark SVG based on theme */}
        <Image
          src={isDark ? "/brand/Hanzibank monocol logomark_yellow.svg" : "/brand/Hanzibank monocol logomark_hot violet.svg"}
          alt="HanziBank Logomark"
          width={height}
          height={height}
          className="h-auto w-auto object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src={isDark ? "/brand/Hanzibank monocol logo_yellow.svg" : "/brand/Hanzibank monocol logo_hot violet.svg"}
        alt="HanziBank Logo"
        width={height * 5.76}
        height={height}
        className="h-auto object-contain transition-all"
        style={{ height: `${height}px` }}
        priority
      />
    </div>
  );
}
