export interface TruncatedText {
  text: string;
  truncated: boolean;
  totalChars: number;
}

export function truncateText(value: unknown, full: boolean, maxChars = 800): TruncatedText {
  const text = typeof value === "string" ? value : value == null ? "" : JSON.stringify(value);
  if (full || text.length <= maxChars) {
    return { text, truncated: false, totalChars: text.length };
  }

  return {
    text: `${text.slice(0, maxChars)}...`,
    truncated: true,
    totalChars: text.length
  };
}
