import { describe, expect, it } from 'vitest';
import { isManifestBuffer, rewritePlaylist, rewriteTagLineUris } from './playlistRewrite.js';

const baseUrl = new URL('https://cdn.example.com/live/master.m3u8');
const toProxyUrl = (url: string) => `http://localhost:3002/api/hls/proxy?url=${encodeURIComponent(url)}`;

describe('rewriteTagLineUris', () => {
  it('rewrites EXT-X-KEY URI attributes', () => {
    const line = '#EXT-X-KEY:METHOD=AES-128,URI="keys/key.bin"';
    const rewritten = rewriteTagLineUris(line, baseUrl, toProxyUrl);
    expect(rewritten).toContain(
      'URI="http://localhost:3002/api/hls/proxy?url=https%3A%2F%2Fcdn.example.com%2Flive%2Fkeys%2Fkey.bin"'
    );
  });

  it('rewrites EXT-X-MAP URI attributes', () => {
    const line = '#EXT-X-MAP:URI="init.mp4"';
    const rewritten = rewriteTagLineUris(line, baseUrl, toProxyUrl);
    expect(rewritten).toContain(
      'URI="http://localhost:3002/api/hls/proxy?url=https%3A%2F%2Fcdn.example.com%2Flive%2Finit.mp4"'
    );
  });

  it('rewrites EXT-X-MEDIA URI attributes', () => {
    const line = '#EXT-X-MEDIA:TYPE=AUDIO,URI="audio/main.m3u8"';
    const rewritten = rewriteTagLineUris(line, baseUrl, toProxyUrl);
    expect(rewritten).toContain('audio%2Fmain.m3u8');
  });
});

describe('rewritePlaylist', () => {
  it('rewrites bare media lines and tag URIs in a media playlist', () => {
    const manifest = [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      '#EXT-X-KEY:METHOD=AES-128,URI="seg.key"',
      '#EXT-X-MAP:URI="init.mp4"',
      '#EXTINF:6.0,',
      'segment000.ts',
    ].join('\n');

    const rewritten = rewritePlaylist(manifest, baseUrl, toProxyUrl);
    expect(rewritten).toContain('seg.key');
    expect(rewritten).toContain('init.mp4');
    expect(rewritten).toContain(
      toProxyUrl('https://cdn.example.com/live/segment000.ts')
    );
  });
});

describe('isManifestBuffer', () => {
  it('detects manifests by content type', () => {
    const buffer = new TextEncoder().encode('#EXTM3U\n').buffer;
    expect(isManifestBuffer(buffer, 'application/vnd.apple.mpegurl')).toBe(true);
  });

  it('detects manifests by EXTM3U prefix', () => {
    const buffer = new TextEncoder().encode('#EXTM3U\n#EXTINF:1,\nseg.ts').buffer;
    expect(isManifestBuffer(buffer, 'text/plain')).toBe(true);
  });

  it('treats binary buffers as non-manifest', () => {
    const buffer = Uint8Array.from([0x47, 0x40, 0x00, 0x10]).buffer;
    expect(isManifestBuffer(buffer, 'video/mp2t')).toBe(false);
  });
});
