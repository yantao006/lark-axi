export function parseLarkCliVersion(output: string): string | undefined {
  const match = output.match(/(?:lark-cli\s+version\s+)?(\d+\.\d+\.\d+)/i);
  return match?.[1];
}

export function compareVersions(left: string, right: string): number {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
