export interface User {
  id: number;
  email: string;
  name: string;
  password: string;
  created_at: Date;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface JWTPayload {
  userId: number;
  email: string;
}

export interface Context {
  user?: {
    userId: number;
    email: string;
  };
}