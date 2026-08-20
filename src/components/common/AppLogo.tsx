'use client';

import React from 'react';
import { Database } from 'lucide-react';

export interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  variant?: 'badge' | 'icon-only' | 'full';
  showGlow?: boolean;
  className?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
  titleClassName?: string;
  subtitleClassName?: string;
}

const SIZE_MAP: Record<string, { px: number; badgeSize: string }> = {
  xs: { px: 20, badgeSize: 'w-5 h-5 rounded-md' },
  sm: { px: 28, badgeSize: 'w-7 h-7 rounded-lg' },
  md: { px: 36, badgeSize: 'w-9 h-9 rounded-xl' },
  lg: { px: 48, badgeSize: 'w-12 h-12 rounded-2xl' },
  xl: { px: 64, badgeSize: 'w-16 h-16 rounded-2xl' },
  '2xl': { px: 84, badgeSize: 'w-21 h-21 rounded-3xl' },
};

/**
 * Modern, distinctive Logo & Icon for PTIT Web Tool (PTIT EduSync)
 * Combines PTIT Crimson/Ruby identity, Academic Mortarboard, Sync Orbital loop,
 * and Telecommunications data waves.
 */
export function AppLogoIcon({
  size = 36,
  className = '',
  idPrefix = 'ptit-logo',
}: {
  size?: number;
  className?: string;
  idPrefix?: string;
}) {
  const bgGradId = `${idPrefix}-bgGrad`;
  const rimGradId = `${idPrefix}-rimGrad`;
  const crimsonGradId = `${idPrefix}-crimson`;
  const cyanGradId = `${idPrefix}-cyan`;
  const goldCapId = `${idPrefix}-goldCap`;
  const stemGradId = `${idPrefix}-stem`;
  const cyanNodeId = `${idPrefix}-cyanNode`;
  const glowFilterId = `${idPrefix}-glow`;
  const dropShadowId = `${idPrefix}-shadow`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#090D16" />
          <stop offset="50%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </linearGradient>

        <linearGradient id={rimGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E11D48" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#6366F1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.9" />
        </linearGradient>

        <linearGradient id={crimsonGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF2E56" />
          <stop offset="45%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>

        <linearGradient id={cyanGradId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="50%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>

        <linearGradient id={goldCapId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <linearGradient id={stemGradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FB7185" />
          <stop offset="40%" stopColor="#E11D48" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        <radialGradient id={cyanNodeId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </radialGradient>

        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id={dropShadowId} x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Base Badge (Squircle) */}
      <rect x="24" y="24" width="464" height="464" rx="112" fill={`url(#${bgGradId})`} />

      {/* Outer Border Stroke with subtle gradient */}
      <rect
        x="24"
        y="24"
        width="464"
        height="464"
        rx="112"
        fill="none"
        stroke={`url(#${rimGradId})`}
        strokeWidth="6"
        strokeOpacity="0.8"
      />

      {/* Main Symbol Group */}
      <g filter={`url(#${dropShadowId})`}>
        {/* 1. Back Sync Orbital Loop */}
        <path
          d="M 325 155 A 135 135 0 1 1 175 390"
          fill="none"
          stroke={`url(#${cyanGradId})`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="14 10"
          opacity="0.4"
        />

        {/* 2. Telecom Waves */}
        <g opacity="0.95">
          <path
            d="M 370 150 A 45 45 0 0 1 405 195"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 390 128 A 78 78 0 0 1 445 198"
            fill="none"
            stroke="#60A5FA"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 410 106 A 110 110 0 0 1 482 202"
            fill="none"
            stroke="#818CF8"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>

        {/* 3. The 'P' Stem */}
        <path
          d="M 145 142 C 145 125 158 112 175 112 L 200 112 C 216 112 229 125 229 142 L 229 368 C 229 385 216 398 200 398 L 175 398 C 158 398 145 385 145 368 Z"
          fill={`url(#${stemGradId})`}
        />

        {/* Pillar Highlight */}
        <rect x="160" y="145" width="8" height="210" rx="4" fill="#FFFFFF" opacity="0.28" />

        {/* Stem Base Data Node */}
        <circle cx="187" cy="355" r="10" fill={`url(#${cyanNodeId})`} filter={`url(#${glowFilterId})`} />

        {/* 4. The 'P' Upper Loop */}
        <path
          d="M 218 112 L 295 112 C 368 112 414 154 414 220 C 414 286 368 328 295 328 L 218 328 L 218 260 L 288 260 C 324 260 348 244 348 220 C 348 196 324 180 288 180 L 218 180 Z"
          fill={`url(#${crimsonGradId})`}
        />

        {/* Highlight Specular */}
        <path
          d="M 228 128 L 292 128 C 350 128 388 158 396 208 C 386 156 342 140 288 140 L 228 140 Z"
          fill="#FFFFFF"
          opacity="0.35"
        />

        {/* 5. Foreground Sync Flow Arc */}
        <path
          d="M 125 285 C 125 385 235 435 340 395 C 390 375 425 330 435 285"
          fill="none"
          stroke={`url(#${cyanGradId})`}
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* Sync Arrow */}
        <polygon points="112,265 142,290 108,305" fill="#38BDF8" />

        {/* Pulse Node */}
        <circle cx="340" cy="395" r="12" fill={`url(#${cyanNodeId})`} filter={`url(#${glowFilterId})`} />

        {/* 6. Academic Mortarboard (Graduation Cap) */}
        <polygon points="184,80 256,48 328,80 256,112" fill={`url(#${goldCapId})`} filter={`url(#${glowFilterId})`} />
        <polygon points="184,80 256,48 256,112" fill="#FBBF24" opacity="0.9" />
        <path d="M 220 96 Q 256 114 292 96 L 292 108 Q 256 126 220 108 Z" fill="#D97706" />
        <path d="M 256,80 Q 300,94 310,130" fill="none" stroke="#FDE047" strokeWidth="4.5" strokeLinecap="round" />
        <circle cx="310" cy="132" r="5.5" fill="#F59E0B" />
      </g>

      {/* Brand Text PTIT */}
      <text
        x="256"
        y="456"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="900"
        fontSize="34"
        letterSpacing="9"
        fill="#94A3B8"
        opacity="0.9"
      >
        PTIT
      </text>
    </svg>
  );
}

export default function AppLogo({
  size = 'md',
  variant = 'badge',
  showGlow = true,
  className = '',
  showSubtitle = true,
  subtitleText = 'PostgreSQL Server-Side',
  titleClassName = '',
  subtitleClassName = '',
}: AppLogoProps) {
  const pixelSize = typeof size === 'number' ? size : SIZE_MAP[size]?.px || 36;
  const uniqueId = React.useId().replace(/[:]/g, '');

  const iconElement = (
    <div
      className={`relative inline-flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
        showGlow ? 'drop-shadow-[0_0_12px_rgba(225,29,72,0.35)]' : ''
      }`}
    >
      <AppLogoIcon size={pixelSize} idPrefix={uniqueId} />
    </div>
  );

  if (variant === 'badge' || variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{iconElement}</div>;
  }

  // Full Variant with Typography
  return (
    <div className={`flex items-center gap-3 select-none group ${className}`}>
      {iconElement}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-white font-black text-base tracking-tight leading-none ${titleClassName}`}
          >
            PTIT <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">EduSync</span>
          </span>
        </div>
        {showSubtitle && (
          <div
            className={`flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono mt-1 ${subtitleClassName}`}
          >
            <Database className="w-2.5 h-2.5" />
            <span>{subtitleText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
