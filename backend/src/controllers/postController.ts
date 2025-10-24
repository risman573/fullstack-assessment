import { Context } from 'hono';
import { z } from 'zod';
import { query } from '../config/database.js';

// Validation schemas
const createPostSchema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(10),
});

const updatePostSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  content: z.string().min(10).optional(),
});

export const getPosts = async (c: Context) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query('SELECT COUNT(*) FROM posts');
    const totalPosts = parseInt(countResult.rows[0].count);

    // Get posts with user info
    const result = await query(
      `SELECT
        p.id, p.title, p.content, p.user_id, p.created_at, p.updated_at,
        u.name as author_name, u.email as author_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return c.json({
      posts: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts,
        limit,
      },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};

export const getPostById = async (c: Context) => {
  try {
    const id = c.req.param('id');

    const result = await query(
      `SELECT
        p.id, p.title, p.content, p.user_id, p.created_at, p.updated_at,
        u.name as author_name, u.email as author_email
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Post not found' }, 404);
    }

    return c.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Get post error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};

export const createPost = async (c: Context) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const { title, content } = createPostSchema.parse(body);

    const result = await query(
      `INSERT INTO posts (title, content, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, title, content, user_id, created_at, updated_at`,
      [title, content, user.userId]
    );

    return c.json({
      message: 'Post created successfully',
      post: result.rows[0],
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error }, 400);
    }
    console.error('Create post error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};

export const updatePost = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const data = updatePostSchema.parse(body);

    // Check if post exists and belongs to user
    const postCheck = await query(
      'SELECT user_id FROM posts WHERE id = $1',
      [id]
    );

    if (postCheck.rows.length === 0) {
      return c.json({ error: 'Post not found' }, 404);
    }

    if (postCheck.rows[0].user_id !== user.userId) {
      return c.json({ error: 'Unauthorized to update this post' }, 403);
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.content) {
      updates.push(`content = $${paramCount++}`);
      values.push(data.content);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE posts
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, title, content, user_id, created_at, updated_at`,
      values
    );

    return c.json({
      message: 'Post updated successfully',
      post: result.rows[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error }, 400);
    }
    console.error('Update post error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};

export const deletePost = async (c: Context) => {
  try {
    const user = c.get('user');
    const id = c.req.param('id');

    // Check if post exists and belongs to user
    const postCheck = await query(
      'SELECT user_id FROM posts WHERE id = $1',
      [id]
    );

    if (postCheck.rows.length === 0) {
      return c.json({ error: 'Post not found' }, 404);
    }

    if (postCheck.rows[0].user_id !== user.userId) {
      return c.json({ error: 'Unauthorized to delete this post' }, 403);
    }

    await query('DELETE FROM posts WHERE id = $1', [id]);

    return c.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};