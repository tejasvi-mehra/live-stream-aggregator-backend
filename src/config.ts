const parseList = (value: string | undefined): string[] => {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

export const DEFAULT_CORS_ORIGIN_PATTERNS = [
  '^http://localhost(:\\d+)?$',
  '^https://live-stream-aggregator\\.vercel\\.app$',
  '^https://live-stream-aggregator-[a-z0-9-]+-tejasvimehras-projects\\.vercel\\.app$',
] as const;

const parseCorsOriginPatterns = (
  value: string | undefined,
  fallbackPatterns: readonly string[]
): RegExp[] => {
  const patterns = value?.trim()
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [...fallbackPatterns];

  return patterns.map((pattern) => {
    try {
      return new RegExp(pattern);
    } catch {
      throw new Error(`Invalid CORS_ORIGIN regex pattern: ${pattern}`);
    }
  });
};

const corsOriginPatterns = parseCorsOriginPatterns(
  process.env.CORS_ORIGIN,
  DEFAULT_CORS_ORIGIN_PATTERNS
);

export const isAllowedCorsOrigin = (origin: string | undefined): string | null => {
  if (!origin) {
    return null;
  }

  return corsOriginPatterns.some((pattern) => pattern.test(origin)) ? origin : null;
};

export const config = {
  port: Number(process.env.PORT ?? 3002),
  corsOriginPatterns,
  publicApiBase: (process.env.PUBLIC_API_BASE ?? 'http://localhost:3002').replace(/\/$/, ''),
  proxyAllowlist: parseList(process.env.PROXY_ALLOWLIST),
  fetchTimeoutMs: Number(process.env.FETCH_TIMEOUT_MS ?? 10000),
  userAgent:
    process.env.USER_AGENT ??
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  youtubeDataApiKey: process.env.YOUTUBE_DATA_API_KEY?.trim() ?? '',
  youtubeLiveMethod: (process.env.YOUTUBE_LIVE_METHOD ?? 'auto') as 'scrape' | 'data_api' | 'auto',
};
