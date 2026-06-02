import {
  fetchWithTimeout,
  HlsHealthStatus,
  isManifestBody,
  validateTargetUrl,
} from './urlUtils.js';
import { pickMediaUri } from './playlistParser.js';

export const checkHlsHealth = async (rawUrl: string): Promise<HlsHealthStatus> => {
  const started = performance.now();
  const checkedAt = new Date().toISOString();

  try {
    const targetUrl = validateTargetUrl(rawUrl);
    const manifestResponse = await fetchWithTimeout(targetUrl.toString(), {
      headers: {
        Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, */*',
      },
    });

    if (!manifestResponse.ok) {
      throw new Error(`HTTP ${manifestResponse.status}`);
    }

    const manifestBody = await manifestResponse.text();
    if (!isManifestBody(manifestBody, manifestResponse.headers.get('content-type'))) {
      throw new Error('Response is not a valid HLS manifest');
    }

    const mediaUri = pickMediaUri(manifestBody, targetUrl);
    if (mediaUri) {
      const segmentResponse = await fetchWithTimeout(mediaUri, {
        method: 'GET',
        headers: {
          Range: 'bytes=0-8191',
          Accept: 'video/mp2t, application/octet-stream, */*',
        },
      });

      if (!segmentResponse.ok && segmentResponse.status !== 206) {
        throw new Error(`Segment probe HTTP ${segmentResponse.status}`);
      }
    }

    return {
      reachable: true,
      latencyMs: Math.round(performance.now() - started),
      checkedAt,
    };
  } catch (error) {
    return {
      reachable: false,
      latencyMs: null,
      checkedAt,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
};

export const checkHlsHealthBatch = async (urls: string[]): Promise<Record<string, HlsHealthStatus>> => {
  const entries = await Promise.all(
    urls.map(async (url) => [url, await checkHlsHealth(url)] as const)
  );
  return Object.fromEntries(entries);
};
