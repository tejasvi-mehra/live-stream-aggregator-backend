import { Hono } from 'hono';
import { checkHlsHealth, checkHlsHealthBatch } from '../lib/hlsHealth.js';
import { proxyHlsResource } from '../lib/hlsProxy.js';
import { UrlValidationError } from '../lib/urlUtils.js';

export const hlsRoutes = new Hono();

hlsRoutes.get('/health', async (c) => {
  const url = c.req.query('url');
  if (!url) {
    return c.json({ error: 'url query param required' }, 400);
  }

  try {
    const status = await checkHlsHealth(url);
    return c.json(status, status.reachable ? 200 : 200);
  } catch (error) {
    if (error instanceof UrlValidationError) {
      return c.json({ reachable: false, error: error.message }, 400);
    }
    throw error;
  }
});

hlsRoutes.post('/health/batch', async (c) => {
  const body = await c.req.json<{ urls?: string[] }>().catch(() => ({ urls: undefined }));
  if (!body.urls || !Array.isArray(body.urls) || body.urls.length === 0) {
    return c.json({ error: 'urls array required' }, 400);
  }

  const results = await checkHlsHealthBatch(body.urls);
  return c.json({ results });
});

hlsRoutes.get('/proxy', async (c) => {
  const url = c.req.query('url');
  if (!url) {
    return c.json({ error: 'url query param required' }, 400);
  }

  try {
    const response = await proxyHlsResource(url);
    return response;
  } catch (error) {
    if (error instanceof UrlValidationError) {
      return c.json({ error: error.message }, 400);
    }
    const message = error instanceof Error ? error.message : 'Proxy failed';
    return c.json({ error: message }, 502);
  }
});
