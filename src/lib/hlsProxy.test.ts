import { describe, expect, it } from 'vitest';
import { isManifestBuffer } from './playlistRewrite.js';

describe('hlsProxy binary passthrough detection', () => {
  it('does not classify MPEG-TS bytes as a manifest', () => {
    const tsPrefix = Uint8Array.from([0x47, 0x40, 0x00, 0x10, 0x00]).buffer;
    expect(isManifestBuffer(tsPrefix, 'video/mp2t')).toBe(false);
  });

  it('preserves binary payload shape when passed to Response', () => {
    const bytes = Uint8Array.from([0x00, 0xff, 0x00, 0x7f]).buffer;
    const response = new Response(bytes, {
      headers: { 'Content-Type': 'video/mp2t' },
    });

    return response.arrayBuffer().then((buffer) => {
      expect(Array.from(new Uint8Array(buffer))).toEqual([0x00, 0xff, 0x00, 0x7f]);
    });
  });
});
