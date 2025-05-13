-- PostgreSQL Schema for Recipe Application with transactions

-- Start transaction for the entire schema creation
BEGIN;

-- Create users table with support for Firebase Auth
CREATE TABLE users (
  user_id VARCHAR(255) PRIMARY KEY, -- Changed from SERIAL to VARCHAR to support Firebase Auth UIDs
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255), -- Optional now with Firebase Auth
  profile_details TEXT,
  provider VARCHAR(50), -- To track authentication provider (e.g., 'firebase', 'email', 'google')
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on username and email
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_email ON users(email);

-- Create recipes table with support for string user_ids
CREATE TABLE recipes (
  recipe_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE SET NULL, -- Allow recipes to remain if user is deleted
  instruction TEXT, -- Lowercase column name for consistency
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  image VARCHAR(255),
  is_vegetarian BOOLEAN DEFAULT FALSE,
  cuisine_type VARCHAR(50),
  total_time VARCHAR(50),
  servings VARCHAR(20)
);

-- Create ingredients table
CREATE TABLE ingredients (
  ingredient_id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  item VARCHAR(255) NOT NULL,
  quantity VARCHAR(100) NOT NULL
);

-- Create ratings table with support for string user_ids
CREATE TABLE ratings (
  rating_id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(recipe_id, user_id) -- Prevent duplicate ratings
);

-- Create comments table with support for string user_ids
CREATE TABLE comments (
  comment_id SERIAL PRIMARY KEY,
  comment_text TEXT NOT NULL, -- Ensure comments have content
  user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE SET NULL, -- Keep comments if user is deleted
  recipe_id INTEGER REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  username VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add an initial test Firebase user
INSERT INTO users (user_id, username, email, provider)
VALUES ('test-firebase-uid', 'Test User', 'test@example.com', 'firebase');

-- Commit all changes
COMMIT;