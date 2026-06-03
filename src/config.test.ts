import { describe, expect, it, vi, afterEach } from 'vitest';

describe('config corsOrigins', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to localhost when CORS_ORIGIN is unset', async () => {
    vi.stubEnv('CORS_ORIGIN', '');
    const { config } = await import('./config.js');
    expect(config.corsOrigins).toEqual(['http://localhost:3001']);
  });

  it('parses comma-separated CORS_ORIGIN values', async () => {
    vi.stubEnv(
      'CORS_ORIGIN',
      'http://localhost:3001, https://live-stream-aggregator.vercel.app'
    );
    const { config } = await import('./config.js');
    expect(config.corsOrigins).toEqual([
      'http://localhost:3001',
      'https://live-stream-aggregator.vercel.app',
    ]);
  });
});
