import {
  buildProxyUrl,
  fetchWithTimeout,
  validateTargetUrl,
} from './urlUtils.js';
import { isManifestBuffer, rewritePlaylist } from './playlistRewrite.js';

export const proxyHlsResource = async (rawUrl: string): Promise<Response> => {
  const targetUrl = validateTargetUrl(rawUrl);
  const upstream = await fetchWithTimeout(targetUrl.toString(), {
    headers: {
      Accept: 'application/vnd.apple.mpegurl, application/x-mpegURL, video/mp2t, */*',
    },
  });

  if (!upstream.ok) {
    return new Response(`Upstream HTTP ${upstream.status}`, { status: upstream.status });
  }

  const contentType = upstream.headers.get('content-type');
  const buffer = await upstream.arrayBuffer();

  if (isManifestBuffer(buffer, contentType)) {
    const manifestBody = new TextDecoder().decode(buffer);
    const rewritten = rewritePlaylist(manifestBody, targetUrl, buildProxyUrl);
    return new Response(rewritten, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-store',
      },
    });
  }

  const passthroughHeaders: Record<string, string> = {
    'Content-Type': contentType ?? 'application/octet-stream',
    'Cache-Control': 'no-store',
  };

  const contentLength = upstream.headers.get('content-length');
  if (contentLength) {
    passthroughHeaders['Content-Length'] = contentLength;
  }

  const contentRange = upstream.headers.get('content-range');
  if (contentRange) {
    passthroughHeaders['Content-Range'] = contentRange;
  }

  return new Response(buffer, {
    status: upstream.status,
    headers: passthroughHeaders,
  });
};
