// Character limits for social media platforms
export const PLATFORM_CHARACTER_LIMITS: Record<string, { limit: number; name: string; optimal?: number }> = {
  twitter: { limit: 280, name: 'X (Twitter)' },
  x: { limit: 280, name: 'X (Twitter)' },
  mastodon: { limit: 500, name: 'Mastodon' },
  telegram: { limit: 4096, name: 'Telegram' },
  instagram: { limit: 2200, name: 'Instagram', optimal: 125 },
  facebook: { limit: 63206, name: 'Facebook', optimal: 80 },
  linkedin: { limit: 3000, name: 'LinkedIn', optimal: 150 },
  tiktok: { limit: 2200, name: 'TikTok', optimal: 150 },
  snapchat: { limit: 250, name: 'Snapchat' }
};

// Get the lowest character limit among selected platforms
export function getLowestLimit(platforms: string[]): number {
  if (platforms.length === 0) return 63206; // Default to Facebook's limit
  
  return Math.min(
    ...platforms.map(p => PLATFORM_CHARACTER_LIMITS[p.toLowerCase()]?.limit || 63206)
  );
}

// Get the platform with the lowest character limit
export function getLimitingPlatform(platforms: string[]): { name: string; limit: number } | null {
  if (platforms.length === 0) return null;
  
  let minLimit = Infinity;
  let limitingPlatform = '';
  
  for (const platform of platforms) {
    const config = PLATFORM_CHARACTER_LIMITS[platform.toLowerCase()];
    if (config && config.limit < minLimit) {
      minLimit = config.limit;
      limitingPlatform = config.name;
    }
  }
  
  return limitingPlatform ? { name: limitingPlatform, limit: minLimit } : null;
}

// Check if platforms have different character limits
export function hasDifferentLimits(platforms: string[]): boolean {
  if (platforms.length <= 1) return false;
  
  const limits = new Set(
    platforms.map(p => PLATFORM_CHARACTER_LIMITS[p.toLowerCase()]?.limit || 63206)
  );
  
  return limits.size > 1;
}

/**
 * Smart truncation function that breaks at natural boundaries
 * Priority: sentence end > special characters/emojis > word boundary
 * @param text - The text to truncate
 * @param maxLength - Maximum allowed length
 * @returns Truncated text
 */
export function smartTruncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const reservedForEllipsis = 3;
  const targetLength = maxLength - reservedForEllipsis;
  
  if (targetLength <= 0) return text.substring(0, maxLength);
  
  // Unicode emoji ranges
  const emojiPattern = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu;
  
  // First try: Find last complete sentence (. ! ? 。！？) followed by space/newline/emoji
  const sentenceEndPattern = /[.!?。！？][\s\n]|[.!?。！？](?=[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}])/gu;
  let lastSentenceEnd = -1;
  let match;
  
  // Reset regex state
  sentenceEndPattern.lastIndex = 0;
  while ((match = sentenceEndPattern.exec(text)) !== null) {
    const endPos = match.index + match[0].length;
    if (endPos <= targetLength) {
      lastSentenceEnd = endPos;
    } else {
      break;
    }
  }
  
  // If we found a sentence end that includes at least 40% of content, use it
  if (lastSentenceEnd > targetLength * 0.4) {
    return text.substring(0, lastSentenceEnd).trim();
  }
  
  // Second try: Break at special characters, emojis, or punctuation
  // Looking for: comma, semicolon, colon, dash, pipe, bullet, or emoji followed by space
  const breakPointPattern = /[,;:\-–—|•·]\s|[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}][\s]?/gu;
  let lastBreakPoint = -1;
  
  // Reset regex state
  breakPointPattern.lastIndex = 0;
  while ((match = breakPointPattern.exec(text)) !== null) {
    const endPos = match.index + match[0].length;
    if (endPos <= targetLength) {
      lastBreakPoint = endPos;
    } else {
      break;
    }
  }
  
  // If we found a break point that includes at least 50% of content, use it
  if (lastBreakPoint > targetLength * 0.5) {
    return text.substring(0, lastBreakPoint).trim() + '...';
  }
  
  // Third try: Break at last word boundary (space)
  const truncated = text.substring(0, targetLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If last space is at a reasonable position (60%+ of target), use it
  if (lastSpace > targetLength * 0.6) {
    return text.substring(0, lastSpace).trim() + '...';
  }
  
  // Fourth try: Break at newline
  const lastNewline = truncated.lastIndexOf('\n');
  if (lastNewline > targetLength * 0.4) {
    return text.substring(0, lastNewline).trim() + '...';
  }
  
  // Fallback: Hard cut but avoid breaking emojis
  // Find the last safe position that doesn't break a multi-byte emoji
  let safeEnd = targetLength;
  
  // Check if we're in the middle of an emoji sequence
  const textToCheck = text.substring(0, targetLength + 4);
  const emojis = [...textToCheck.matchAll(emojiPattern)];
  
  for (const emojiMatch of emojis) {
    const emojiStart = emojiMatch.index!;
    const emojiEnd = emojiStart + emojiMatch[0].length;
    
    // If target length cuts through an emoji, adjust to before the emoji
    if (emojiStart < targetLength && emojiEnd > targetLength) {
      safeEnd = emojiStart;
      break;
    }
  }
  
  return text.substring(0, safeEnd).trim() + '...';
}

// Get character count color class based on usage
export function getCharacterCountColor(current: number, limit: number): string {
  const percentage = (current / limit) * 100;
  
  if (percentage >= 100) return 'text-red-600';
  if (percentage >= 80) return 'text-yellow-600';
  return 'text-green-600';
}
