import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController.js';

const postRoutes = new Hono();

postRoutes.get('/', getPosts);
postRoutes.get('/:id', getPostById);
postRoutes.post('/', authMiddleware, createPost);
postRoutes.put('/:id', authMiddleware, updatePost);
postRoutes.delete('/:id', authMiddleware, deletePost);

export default postRoutes;