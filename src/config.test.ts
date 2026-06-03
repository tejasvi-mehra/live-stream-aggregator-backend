import { describe, expect, it, vi, afterEach } from 'vitest';

describe('config CORS origin patterns', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses default regex patterns when CORS_ORIGIN is unset', async () => {
    vi.stubEnv('CORS_ORIGIN', '');
    const { config, isAllowedCorsOrigin } = await import('./config.js');

    expect(config.corsOriginPatterns).toHaveLength(3);
    expect(isAllowedCorsOrigin('http://localhost:3001')).toBe('http://localhost:3001');
    expect(isAllowedCorsOrigin('http://localhost')).toBe('http://localhost');
    expect(isAllowedCorsOrigin('https://live-stream-aggregator.vercel.app')).toBe(
      'https://live-stream-aggregator.vercel.app'
    );
    expect(
      isAllowedCorsOrigin(
        'https://live-stream-aggregator-git-main-tejasvimehras-projects.vercel.app'
      )
    ).toBe('https://live-stream-aggregator-git-main-tejasvimehras-projects.vercel.app');
    expect(
      isAllowedCorsOrigin(
        'https://live-stream-aggregator-1g7i3is3w-tejasvimehras-projects.vercel.app'
      )
    ).toBe('https://live-stream-aggregator-1g7i3is3w-tejasvimehras-projects.vercel.app');
    expect(isAllowedCorsOrigin('https://evil.example.com')).toBeNull();
  });

  it('parses comma-separated CORS_ORIGIN regex patterns', async () => {
    vi.stubEnv('CORS_ORIGIN', '^http://localhost(:\\d+)?$,^https://example\\.com$');
    const { isAllowedCorsOrigin } = await import('./config.js');

    expect(isAllowedCorsOrigin('http://localhost:5173')).toBe('http://localhost:5173');
    expect(isAllowedCorsOrigin('https://example.com')).toBe('https://example.com');
    expect(isAllowedCorsOrigin('https://live-stream-aggregator.vercel.app')).toBeNull();
  });

  it('throws when CORS_ORIGIN contains an invalid regex', async () => {
    vi.stubEnv('CORS_ORIGIN', '[invalid');

    await expect(import('./config.js')).rejects.toThrow('Invalid CORS_ORIGIN regex pattern');
  });
});
