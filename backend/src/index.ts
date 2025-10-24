import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import dotenv from 'dotenv';
import { corsMiddleware } from './middleware/cors.js';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';

dotenv.config();dotenv.config();
console.log('✅ Loaded DATABASE_URL:', process.env.DATABASE_URL);

const app = new Hono();

// Middleware
app.use('*', corsMiddleware);

// Health check
app.get('/', (c) => {
  return c.json({
    message: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/posts', postRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '4001');

console.log(`🚀 Server is running on port ${port}`);
console.log(`📍 API URL: http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});