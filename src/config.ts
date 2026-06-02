const parseList = (value: string | undefined): string[] => {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

export const config = {
  port: Number(process.env.PORT ?? 3002),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3001',
  publicApiBase: (process.env.PUBLIC_API_BASE ?? 'http://localhost:3002').replace(/\/$/, ''),
  proxyAllowlist: parseList(process.env.PROXY_ALLOWLIST),
  fetchTimeoutMs: Number(process.env.FETCH_TIMEOUT_MS ?? 10000),
  userAgent:
    process.env.USER_AGENT ??
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  youtubeDataApiKey: process.env.YOUTUBE_DATA_API_KEY?.trim() ?? '',
  youtubeLiveMethod: (process.env.YOUTUBE_LIVE_METHOD ?? 'auto') as 'scrape' | 'data_api' | 'auto',
};
