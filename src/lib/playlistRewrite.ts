import { resolvePlaylistUri } from './urlUtils.js';

const URI_ATTRIBUTE_PATTERN = /URI=("([^"]*)"|'([^']*)'|([^,\s]+))/gi;

export const rewriteTagLineUris = (
  line: string,
  baseUrl: URL,
  toProxyUrl: (absoluteUrl: string) => string
): string => {
  if (!line.startsWith('#')) {
    return line;
  }

  return line.replace(URI_ATTRIBUTE_PATTERN, (_match, _quoted, doubleQuoted, singleQuoted, unquoted) => {
    const rawUri = doubleQuoted ?? singleQuoted ?? unquoted;
    if (!rawUri) {
      return _match;
    }
    const absolute = resolvePlaylistUri(rawUri, baseUrl);
    return `URI="${toProxyUrl(absolute)}"`;
  });
};

export const rewritePlaylist = (
  manifestBody: string,
  baseUrl: URL,
  toProxyUrl: (absoluteUrl: string) => string
): string => {
  return manifestBody
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return line;
      }
      if (trimmed.startsWith('#')) {
        return rewriteTagLineUris(line, baseUrl, toProxyUrl);
      }
      const absolute = resolvePlaylistUri(trimmed, baseUrl);
      return toProxyUrl(absolute);
    })
    .join('\n');
};

export const isManifestBuffer = (buffer: ArrayBuffer, contentType: string | null): boolean => {
  if (contentType?.includes('mpegurl') || contentType?.includes('m3u8')) {
    return true;
  }
  const prefix = new TextDecoder().decode(buffer.slice(0, Math.min(buffer.byteLength, 16)));
  return prefix.startsWith('#EXTM3U');
};
