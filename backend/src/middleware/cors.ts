import { Context, Next } from 'hono';

export const corsMiddleware = async (c: Context, next: Next) => {
  const origin = c.req.header('Origin') || '*';

  c.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Allow-Credentials', 'true');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 200);
  }

  await next();
};