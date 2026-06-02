import { describe, expect, it } from 'vitest';
import { buildYouTubeDataApiUrl } from './youtubeDataApi.js';

describe('YouTube Data API helpers', () => {
  it('builds a search URL with live event filter', () => {
    const url = new URL(
      buildYouTubeDataApiUrl(
        'search',
        {
          part: 'snippet',
          channelId: 'UC1234567890123456789012',
          eventType: 'live',
          type: 'video',
          maxResults: '1',
        },
        'test-key'
      )
    );

    expect(url.pathname).toContain('/youtube/v3/search');
    expect(url.searchParams.get('eventType')).toBe('live');
    expect(url.searchParams.get('key')).toBe('test-key');
  });
});
