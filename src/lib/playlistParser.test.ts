import { describe, expect, it } from 'vitest';
import { pickMediaUri } from './playlistParser.js';

describe('pickMediaUri', () => {
  it('selects the first media segment from a media playlist', () => {
    const manifest = ['#EXTM3U', '#EXTINF:6.0,', 'segment000.ts'].join('\n');
    const uri = pickMediaUri(manifest, new URL('https://cdn.example.com/live/index.m3u8'));
    expect(uri).toBe('https://cdn.example.com/live/segment000.ts');
  });

  it('selects the URI line after EXT-X-STREAM-INF in a master playlist', () => {
    const manifest = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=1280000',
      '720p/index.m3u8',
    ].join('\n');
    const uri = pickMediaUri(manifest, new URL('https://cdn.example.com/master.m3u8'));
    expect(uri).toBe('https://cdn.example.com/720p/index.m3u8');
  });

  it('selects URI embedded in EXT-X-STREAM-INF when present', () => {
    const manifest = [
      '#EXTM3U',
      '#EXT-X-STREAM-INF:BANDWIDTH=1280000,URI="alt/index.m3u8"',
    ].join('\n');
    const uri = pickMediaUri(manifest, new URL('https://cdn.example.com/master.m3u8'));
    expect(uri).toBe('https://cdn.example.com/alt/index.m3u8');
  });
});
