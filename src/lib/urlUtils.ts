import { config } from '../config.js';

export class UrlValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UrlValidationError';
  }
}

const PRIVATE_IPV4_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
];

export const validateTargetUrl = (rawUrl: string): URL => {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UrlValidationError('Invalid URL');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UrlValidationError('Only http and https URLs are allowed');
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '::1' ||
    hostname === '[::1]'
  ) {
    throw new UrlValidationError('Localhost targets are not allowed');
  }

  const ipv4Match = hostname.match(/^(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (ipv4Match) {
    const ip = ipv4Match[1];
    if (PRIVATE_IPV4_RANGES.some((pattern) => pattern.test(ip))) {
      throw new UrlValidationError('Private network targets are not allowed');
    }
  }

  if (config.proxyAllowlist.length > 0) {
    const allowed = config.proxyAllowlist.some(
      (entry) => hostname === entry || hostname.endsWith(`.${entry}`)
    );
    if (!allowed) {
      throw new UrlValidationError(`Host ${hostname} is not in PROXY_ALLOWLIST`);
    }
  }

  return parsed;
};

export const fetchWithTimeout = async (
  url: string,
  init: RequestInit = {}
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.fetchTimeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': config.userAgent,
        Accept: '*/*',
        ...init.headers,
      },
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timeout);
  }
};

export const buildProxyUrl = (targetUrl: string): string => {
  return `${config.publicApiBase}/api/hls/proxy?url=${encodeURIComponent(targetUrl)}`;
};

export const resolvePlaylistUri = (line: string, baseUrl: URL): string => {
  if (line.startsWith('http://') || line.startsWith('https://')) {
    return line;
  }
  return new URL(line, baseUrl).toString();
};

export const isManifestBody = (body: string, contentType: string | null): boolean => {
  if (contentType?.includes('mpegurl') || contentType?.includes('m3u8')) {
    return true;
  }
  return body.includes('#EXTM3U');
};

export interface HlsHealthStatus {
  reachable: boolean;
  latencyMs: number | null;
  checkedAt: string;
  error?: string;
}
