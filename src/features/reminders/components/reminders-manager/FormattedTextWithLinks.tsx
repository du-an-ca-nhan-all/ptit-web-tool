'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Phân tích và render văn bản chứa URL thành các liên kết clickable an toàn
 */
export function FormattedTextWithLinks({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+|(?:\b(?:www\.|meet\.google\.com|zoom\.us|teams\.microsoft\.com|[a-zA-Z0-9-]+\.(?:edu|com|org|net|vn|io|app|me|gg|link)\b)[^\s]*))/gi;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const rawUrl = match[0];
    const href = rawUrl.startsWith('http://') || rawUrl.startsWith('https://') ? rawUrl : `https://${rawUrl}`;
    parts.push(
      <a
        key={match.index}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="text-blue-600 hover:text-blue-800 underline font-semibold inline-flex items-center gap-0.5 break-all"
      >
        <span>{rawUrl}</span>
        <ExternalLink className="w-2.5 h-2.5 shrink-0 inline ml-0.5" />
      </a>
    );
    lastIndex = urlRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : <>{text}</>;
}
