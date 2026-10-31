"use client";
import React from "react";
import Link from "next/link";

export default function Logo({
  className = "",
  size = "md", // "sm" | "md" | "lg" | "xl"
  iconOnly = false,
  href,
}) {
  const heights = {
    sm: "h-8 sm:h-9",
    md: "h-11 sm:h-12",
    lg: "h-14 sm:h-16",
    xl: "h-20",
  };

  const hClass = heights[size] || heights.md;

  const content = iconOnly ? (
    <svg
      viewBox="0 0 128 128"
      className={`${hClass} w-auto aspect-square ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RecruitAI Logo"
    >
      <defs>
        <linearGradient id="logoBadgeGradSm" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#143426" />
          <stop offset="50%" stopColor="#1e4d39" />
          <stop offset="100%" stopColor="#28684d" />
        </linearGradient>
        <linearGradient id="logoCenterWaveSm" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#52b788" />
          <stop offset="100%" stopColor="#e8f8ed" />
        </linearGradient>
      </defs>
      <g transform="translate(8, 8)">
        <rect width="112" height="112" rx="28" fill="url(#logoBadgeGradSm)" />
        <rect
          x="1.5"
          y="1.5"
          width="109"
          height="109"
          rx="26.5"
          fill="none"
          stroke="#68d391"
          strokeWidth="1.5"
          strokeOpacity="0.32"
        />
        <rect x="23" y="46" width="7.5" height="20" rx="3.75" fill="#74c69d" opacity="0.75" />
        <rect x="37" y="34" width="7.5" height="44" rx="3.75" fill="#95d5b2" opacity="0.9" />
        <rect x="52.25" y="24" width="7.5" height="64" rx="3.75" fill="url(#logoCenterWaveSm)" />
        <rect x="67.5" y="34" width="7.5" height="44" rx="3.75" fill="#95d5b2" opacity="0.9" />
        <rect x="81.5" y="46" width="7.5" height="20" rx="3.75" fill="#74c69d" opacity="0.75" />
        <circle cx="56" cy="24" r="5.5" fill="#ffffff" />
        <circle cx="56" cy="24" r="2.8" fill="#20553e" />
        <path
          d="M 27 56 Q 56 18 85 56"
          fill="none"
          stroke="#b7e4c7"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="2 3.5"
          opacity="0.65"
        />
      </g>
    </svg>
  ) : (
    <svg
      viewBox="0 0 380 106"
      className={`${hClass} w-auto object-contain ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="RecruitAI - AI Recruitment Agent"
    >
      <defs>
        <linearGradient id="logoBadgeGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#143426" />
          <stop offset="50%" stopColor="#1e4d39" />
          <stop offset="100%" stopColor="#28684d" />
        </linearGradient>
        <linearGradient id="logoCenterWaveFull" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#52b788" />
          <stop offset="100%" stopColor="#e8f8ed" />
        </linearGradient>
        <linearGradient id="logoAccentText" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#225b43" />
          <stop offset="100%" stopColor="#348663" />
        </linearGradient>
      </defs>

      {/* ICON BADGE */}
      <g transform="translate(8, 9)">
        <rect width="88" height="88" rx="22" fill="url(#logoBadgeGradFull)" />
        <rect
          x="1"
          y="1"
          width="86"
          height="86"
          rx="21"
          fill="none"
          stroke="#68d391"
          strokeWidth="1.2"
          strokeOpacity="0.32"
        />
        <rect x="18" y="36" width="6" height="16" rx="3" fill="#74c69d" opacity="0.75" />
        <rect x="29" y="27" width="6" height="34" rx="3" fill="#95d5b2" opacity="0.9" />
        <rect x="41" y="19" width="6" height="50" rx="3" fill="url(#logoCenterWaveFull)" />
        <rect x="53" y="27" width="6" height="34" rx="3" fill="#95d5b2" opacity="0.9" />
        <rect x="64" y="36" width="6" height="16" rx="3" fill="#74c69d" opacity="0.75" />
        <circle cx="44" cy="19" r="4.5" fill="#ffffff" />
        <circle cx="44" cy="19" r="2.2" fill="#20553e" />
        <path
          d="M 21 44 Q 44 14 67 44"
          fill="none"
          stroke="#b7e4c7"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 3"
          opacity="0.6"
        />
      </g>

      {/* WORDMARK */}
      <g transform="translate(114, 0)">
        <text
          x="0"
          y="59"
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
          fontSize="46"
          fontWeight="800"
          fill="#141b18"
          letterSpacing="-0.035em"
        >
          Recruit<tspan fill="url(#logoAccentText)">AI</tspan>
        </text>

        {/* Subtitle */}
        <text
          x="2"
          y="83"
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif"
          fontSize="11"
          fontWeight="600"
          fill="#586d63"
          letterSpacing="0.22em"
        >
          AI RECRUITMENT AGENT
        </text>
      </g>
    </svg>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
