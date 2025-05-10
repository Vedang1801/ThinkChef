-- PostgreSQL Schema for Recipe Application

-- Create users table
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile_details TEXT
);

-- Create index on username
CREATE INDEX idx_username ON users(username);

-- Create recipes table
CREATE TABLE recipes (
  recipe_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INTEGER REFERENCES users(user_id),
  Instruction TEXT, -- Changed to TEXT from VARCHAR(1000) for more space
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  image VARCHAR(255),
  is_vegetarian BOOLEAN,
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

-- Create ratings table
CREATE TABLE ratings (
  rating_id SERIAL PRIMARY KEY,
  recipe_id INTEGER REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(user_id),
  stars INTEGER NOT NULL
);

-- Create comments table (note: using lowercase for table name in PostgreSQL)
CREATE TABLE comments (
  comment_id SERIAL PRIMARY KEY,
  comment_text TEXT,
  user_id INTEGER REFERENCES users(user_id),
  recipe_id INTEGER REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  username VARCHAR(255) REFERENCES users(username),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);