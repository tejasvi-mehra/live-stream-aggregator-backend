import { config } from '../config.js';
import { fetchWithTimeout } from './urlUtils.js';
import type { ParsedChannelRef } from './youtubeLive.js';

export interface YouTubeDataApiLiveResult {
  isLive: boolean;
  channelId?: string;
  title?: string;
  error?: string;
}

interface YouTubeApiChannelResponse {
  items?: Array<{ id?: string }>;
}

interface YouTubeApiSearchResponse {
  items?: Array<{
    snippet?: {
      title?: string;
      liveBroadcastContent?: string;
    };
  }>;
}

export const buildYouTubeDataApiUrl = (
  path: string,
  params: Record<string, string>,
  apiKey: string = config.youtubeDataApiKey
): string => {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set('key', apiKey);
  return url.toString();
};

const dataApiUrl = (path: string, params: Record<string, string>): string =>
  buildYouTubeDataApiUrl(path, params);

const fetchDataApi = async <T>(url: string): Promise<T> => {
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`YouTube Data API HTTP ${response.status}`);
  }
  return (await response.json()) as T;
};

export const resolveChannelIdViaDataApi = async (
  ref: ParsedChannelRef,
  channelUrl?: string
): Promise<string> => {
  if (ref.channelId) {
    return ref.channelId;
  }

  if (ref.handle) {
    const url = dataApiUrl('channels', {
      part: 'id',
      forHandle: ref.handle,
    });
    const payload = await fetchDataApi<YouTubeApiChannelResponse>(url);
    const channelId = payload.items?.[0]?.id;
    if (channelId) {
      return channelId;
    }
    throw new Error(`Could not resolve YouTube handle @${ref.handle} via Data API`);
  }

  if (ref.username) {
    const url = dataApiUrl('channels', {
      part: 'id',
      forUsername: ref.username,
    });
    const payload = await fetchDataApi<YouTubeApiChannelResponse>(url);
    const channelId = payload.items?.[0]?.id;
    if (channelId) {
      return channelId;
    }
    throw new Error(`Could not resolve YouTube user ${ref.username} via Data API`);
  }

  if (channelUrl) {
    throw new Error('Could not resolve YouTube channel URL via Data API');
  }

  throw new Error('Missing YouTube channel reference');
};

export const checkLiveViaDataApi = async (
  ref: ParsedChannelRef,
  channelUrl?: string
): Promise<YouTubeDataApiLiveResult> => {
  if (!config.youtubeDataApiKey) {
    return { isLive: false, error: 'YOUTUBE_DATA_API_KEY is not configured' };
  }

  try {
    const channelId = await resolveChannelIdViaDataApi(ref, channelUrl);
    const url = dataApiUrl('search', {
      part: 'snippet',
      channelId,
      eventType: 'live',
      type: 'video',
      maxResults: '1',
    });
    const payload = await fetchDataApi<YouTubeApiSearchResponse>(url);
    const liveItem = payload.items?.[0];

    if (!liveItem) {
      return { isLive: false, channelId, error: 'Not live' };
    }

    return {
      isLive: true,
      channelId,
      title: liveItem.snippet?.title,
    };
  } catch (error) {
    return {
      isLive: false,
      error: error instanceof Error ? error.message : 'YouTube Data API lookup failed',
    };
  }
};
