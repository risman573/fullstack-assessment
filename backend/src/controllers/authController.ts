import { Context } from 'hono';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../config/database.js';
import { generateToken } from '../utils/jwt.js';

// Validation schemas
const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const signUp = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = signUpSchema.parse(body);

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    return c.json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error }, 400);
    }
    console.error('Sign up error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};

export const signIn = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password } = signInSchema.parse(body);

    // Find user
    const result = await query(
      'SELECT id, email, password, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Validation error', details: error }, 400);
    }
    console.error('Sign in error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};

export const signOut = async (c: Context) => {
  // Since we're using JWT, sign out is handled on client side
  // But we can add token to blacklist if needed (optional)
  return c.json({ message: 'Signed out successfully' });
};

export const getProfile = async (c: Context) => {
  try {
    const user = c.get('user');

    const result = await query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [user.userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
};