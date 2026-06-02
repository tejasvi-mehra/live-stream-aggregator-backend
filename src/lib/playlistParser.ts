import { resolvePlaylistUri } from './urlUtils.js';

export const pickMediaUri = (manifestBody: string, baseUrl: URL): string | null => {
  const lines = manifestBody.split('\n').map((line) => line.trim());
  const isMaster = lines.some((line) => line.startsWith('#EXT-X-STREAM-INF'));

  if (isMaster) {
    for (let index = 0; index < lines.length; index += 1) {
      if (lines[index].startsWith('#EXT-X-STREAM-INF')) {
        const tagUriMatch = lines[index].match(/URI=("([^"]*)"|'([^']*)'|([^,\s]+))/i);
        if (tagUriMatch) {
          const rawUri = tagUriMatch[2] ?? tagUriMatch[3] ?? tagUriMatch[4];
          if (rawUri) {
            return resolvePlaylistUri(rawUri, baseUrl);
          }
        }

        const next = lines[index + 1];
        if (next && !next.startsWith('#')) {
          return resolvePlaylistUri(next, baseUrl);
        }
      }
    }
    return null;
  }

  for (const line of lines) {
    if (line && !line.startsWith('#')) {
      return resolvePlaylistUri(line, baseUrl);
    }
  }

  return null;
};
