import { describe, expect, it } from 'vitest';
import {
  extractChannelId,
  parseChannelRef,
  parseLiveStatus,
} from './youtubeLive.js';

describe('parseChannelRef', () => {
  it('parses /channel/UC URLs', () => {
    expect(parseChannelRef('https://www.youtube.com/channel/UC1234567890123456789012')).toEqual({
      channelId: 'UC1234567890123456789012',
    });
  });

  it('parses /@handle URLs', () => {
    expect(parseChannelRef('https://www.youtube.com/@NFL')).toEqual({ handle: 'NFL' });
  });
});

describe('extractChannelId', () => {
  it('extracts channelId from embedded JSON', () => {
    const html = '{"channelId":"UC1234567890123456789012","title":"Example"}';
    expect(extractChannelId(html)).toBe('UC1234567890123456789012');
  });
});

describe('parseLiveStatus', () => {
  it('returns live when isLive flag is true', () => {
    const html = '{"isLive":true,"title":{"simpleText":"Live Game"}}';
    expect(parseLiveStatus(html)).toEqual({
      isLive: true,
      title: 'Live Game',
    });
  });

  it('returns offline when live flags are absent', () => {
    const html = 'LIVE_STREAM_OFFLINE';
    expect(parseLiveStatus(html)).toEqual({ isLive: false });
  });
});
