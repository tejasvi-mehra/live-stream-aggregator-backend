import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { config } from './config.js';
import { hlsRoutes } from './routes/hls.js';
import { youtubeRoutes } from './routes/youtube.js';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: config.corsOrigins,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
);

app.get('/health', (c) => {
  return c.json({ ok: true, service: 'live-stream-aggregator-backend' });
});

app.route('/api/hls', hlsRoutes);
app.route('/api/youtube', youtubeRoutes);

serve(
  {
    fetch: app.fetch,
    port: config.port,
  },
  (info) => {
    console.log(`live-stream-aggregator-backend listening on http://localhost:${info.port}`);
  }
);
