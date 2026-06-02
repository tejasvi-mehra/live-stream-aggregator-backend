import { Hono } from 'hono';
import { resolveYouTubeLive } from '../lib/youtubeLive.js';

export const youtubeRoutes = new Hono();

youtubeRoutes.get('/live', async (c) => {
  const channelUrl = c.req.query('channelUrl');
  const channelId = c.req.query('channelId');
  const result = await resolveYouTubeLive(channelUrl, channelId);
  return c.json(result, result.error && !result.isLive ? 200 : 200);
});
