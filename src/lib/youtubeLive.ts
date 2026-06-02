import { config } from '../config.js';
import { fetchWithTimeout } from './urlUtils.js';
import { checkLiveViaDataApi } from './youtubeDataApi.js';

export interface YouTubeLiveResult {
  isLive: boolean;
  channelId?: string;
  title?: string;
  error?: string;
  method?: 'scrape' | 'data_api';
}

export interface ParsedChannelRef {
  channelId?: string;
  handle?: string;
  username?: string;
}

export const parseChannelRef = (channelUrl: string): ParsedChannelRef => {
  const url = new URL(channelUrl);

  const channelMatch = url.pathname.match(/\/channel\/(UC[\w-]+)/i);
  if (channelMatch) {
    return { channelId: channelMatch[1] };
  }

  const handleMatch = url.pathname.match(/\/@([\w.-]+)/);
  if (handleMatch) {
    return { handle: handleMatch[1] };
  }

  const userMatch = url.pathname.match(/\/user\/([\w.-]+)/);
  if (userMatch) {
    return { username: userMatch[1] };
  }

  throw new Error('Unsupported YouTube channel URL. Use /channel/UC..., /@handle, or /user/name.');
};

const channelPageUrl = (ref: ParsedChannelRef, channelUrl?: string): string => {
  if (ref.channelId) {
    return `https://www.youtube.com/channel/${ref.channelId}`;
  }
  if (ref.handle) {
    return `https://www.youtube.com/@${ref.handle}`;
  }
  if (ref.username) {
    return `https://www.youtube.com/user/${ref.username}`;
  }
  if (channelUrl) {
    return channelUrl.replace(/\/$/, '');
  }
  throw new Error('Could not build YouTube channel URL');
};

const channelLivePageUrl = (channelId: string): string => {
  return `https://www.youtube.com/channel/${channelId}/live`;
};

const fetchYouTubePage = async (url: string): Promise<string> => {
  const response = await fetchWithTimeout(url, {
    headers: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  if (!response.ok) {
    throw new Error(`YouTube page HTTP ${response.status}`);
  }

  return response.text();
};

export const extractChannelId = (html: string): string | null => {
  const patterns = [
    /"channelId":"(UC[\w-]{22})"/,
    /"externalId":"(UC[\w-]{22})"/,
    /"browseId":"(UC[\w-]{22})"/,
    /\/channel\/(UC[\w-]{22})/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

export const parseLiveStatus = (html: string): { isLive: boolean; title?: string } => {
  if (/LIVE_STREAM_OFFLINE|"isLive":false|"isLiveBroadcast":false/.test(html)) {
    if (!/"isLive":true|"isLiveBroadcast":true/.test(html)) {
      return { isLive: false };
    }
  }

  if (/"isLive":true|"isLiveBroadcast":true|"status":"LIVE"/.test(html)) {
    const titleMatch =
      html.match(/"title":\{"simpleText":"([^"]+)"/) ??
      html.match(/"title":\{"runs":\[\{"text":"([^"]+)"/);
    return {
      isLive: true,
      title: titleMatch?.[1],
    };
  }

  return { isLive: false };
};

const resolveChannelId = async (ref: ParsedChannelRef, channelUrl?: string): Promise<string> => {
  if (ref.channelId) {
    return ref.channelId;
  }

  const pageUrl = channelPageUrl(ref, channelUrl);
  const html = await fetchYouTubePage(pageUrl);
  const channelId = extractChannelId(html);

  if (!channelId) {
    throw new Error('Could not resolve YouTube channel ID from channel page');
  }

  return channelId;
};

const checkChannelLive = async (channelId: string): Promise<{ isLive: boolean; title?: string }> => {
  const html = await fetchYouTubePage(channelLivePageUrl(channelId));
  return parseLiveStatus(html);
};

const resolveYouTubeLiveViaScrape = async (
  channelUrl?: string | null,
  channelId?: string | null
): Promise<YouTubeLiveResult> => {
  let ref: ParsedChannelRef;
  if (channelId) {
    ref = { channelId };
  } else if (channelUrl) {
    ref = parseChannelRef(channelUrl);
  } else {
    return { isLive: false, error: 'channelUrl or channelId query param required', method: 'scrape' };
  }

  const resolvedChannelId = await resolveChannelId(ref, channelUrl ?? undefined);
  const live = await checkChannelLive(resolvedChannelId);

  if (!live.isLive) {
    return { isLive: false, channelId: resolvedChannelId, error: 'Not live', method: 'scrape' };
  }

  return {
    isLive: true,
    channelId: resolvedChannelId,
    title: live.title,
    method: 'scrape',
  };
};

export const resolveYouTubeLive = async (
  channelUrl?: string | null,
  channelId?: string | null
): Promise<YouTubeLiveResult> => {
  try {
    let ref: ParsedChannelRef;
    if (channelId) {
      ref = { channelId };
    } else if (channelUrl) {
      ref = parseChannelRef(channelUrl);
    } else {
      return { isLive: false, error: 'channelUrl or channelId query param required' };
    }

    const method = config.youtubeLiveMethod;

    if (method === 'data_api') {
      if (!config.youtubeDataApiKey) {
        return {
          isLive: false,
          error: 'YOUTUBE_LIVE_METHOD=data_api requires YOUTUBE_DATA_API_KEY',
        };
      }
      const apiResult = await checkLiveViaDataApi(ref, channelUrl ?? undefined);
      return { ...apiResult, method: 'data_api' };
    }

    if (method === 'auto' && config.youtubeDataApiKey) {
      const apiResult = await checkLiveViaDataApi(ref, channelUrl ?? undefined);
      if (apiResult.isLive || apiResult.error === 'Not live') {
        return { ...apiResult, method: 'data_api' };
      }
    }

    return await resolveYouTubeLiveViaScrape(channelUrl, channelId);
  } catch (error) {
    if (config.youtubeLiveMethod === 'auto' && config.youtubeDataApiKey) {
      try {
        return await resolveYouTubeLiveViaScrape(channelUrl, channelId);
      } catch {
        // fall through to outer error
      }
    }

    return {
      isLive: false,
      error: error instanceof Error ? error.message : 'YouTube lookup failed',
      method: 'scrape',
    };
  }
};

export const getYouTubeUserAgent = (): string => config.userAgent;
