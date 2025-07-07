require('dotenv').config();

// Import required modules
const express = require("express");
const cors = require("cors");
const { Pool } = require('pg');
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const OpenAI = require("openai");
const secretKey = process.env.JWT_SECRET || "FinalProject@1234";
const bcrypt = require("bcrypt");
const app = express();
const port = process.env.PORT || 3000;

// Health check endpoint for AWS monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(bodyParser.json()); // Parse JSON request bodies
const upload = multer({ dest: "uploads/" }); // Configure multer for file uploads

// PostgreSQL connection pool using environment variables
const isProduction = process.env.NODE_ENV === 'production';
const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Test database connection on startup
pool.connect((err, client, done) => {
  if (err) {
    console.error("Error connecting to PostgreSQL database: ", err);
    return;
  }
  console.log("Connected to PostgreSQL database");
  done();
});

// CORS configuration for development and production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        "http://think-chef-frontend-2025.s3-website.us-east-2.amazonaws.com"
      ]
    : true, // Allow all origins in development
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Generate JWT token for a user
function generateToken(user) {
  const payload = {
    userId: user.user_id,
    username: user.username,
    email: user.email,
  };
  return jwt.sign(payload, secretKey, { expiresIn: "1h" });
}

// Middleware to verify JWT token or Firebase ID token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log("=== TOKEN VERIFICATION DEBUG ===");
  console.log("Auth header:", authHeader);
  console.log("Token exists:", !!token);
  
  if (!token) {
    console.log("ERROR: No token provided");
    return res.status(401).send("Unauthorized: No token provided");
  }
  
  try {
    // Try to decode the token without verification to check if it's a Firebase token
    const decodedPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    
    console.log("Decoded payload keys:", Object.keys(decodedPayload));
    console.log("Token issuer:", decodedPayload.iss);
    console.log("Token sub:", decodedPayload.sub);
    console.log("Token exp:", decodedPayload.exp);
    console.log("Current time:", Date.now() / 1000);
    
    // Check if it's a Firebase ID token (has 'iss' field with Firebase issuer)
    if (decodedPayload.iss && decodedPayload.iss.includes('securetoken.google.com')) {
      // This is a Firebase ID token
      if (decodedPayload.exp && decodedPayload.exp < Date.now() / 1000) {
        console.log("ERROR: Firebase token expired");
        return res.status(401).send("Unauthorized: Token expired");
      }
      req.userId = decodedPayload.sub || decodedPayload.user_id; // Firebase uses 'sub' for user ID
      console.log("SUCCESS: Firebase token verified, user ID:", req.userId);
      next();
    } else {
      // This is a JWT token created by our backend
      console.log("Processing as JWT token");
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          console.log("JWT verification error:", err);
          if (err.name === 'TokenExpiredError') {
            return res.status(401).send("Unauthorized: Token expired");
          }
          return res.status(401).send("Unauthorized: Invalid token");
        }
        req.userId = decoded.userId;
        console.log("SUCCESS: JWT token verified, user ID:", req.userId);
        next();
      });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).send("Unauthorized: Invalid token format");
  }
}

// Middleware to verify Firebase token (if using Firebase Auth)
async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("No token provided");
  const token = authHeader.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (err) {
    return res.status(401).send("Invalid or expired token");
  }
}

// Ensure AWS credentials are present in environment variables
if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_REGION
) {
  console.error("AWS credentials are missing in environment variables.");
  process.exit(1);
}

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3(); // S3 client instance

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// User registration endpoint
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).send("All fields are required");
  }
  // Generate unique user ID
  const user_id = 'local_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 15);
  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password: ", err);
      return res.status(500).send("Error registering user");
    }
    const query =
      "INSERT INTO users (user_id, username, email, password_hash, provider) VALUES ($1, $2, $3, $4, $5)";
    pool.query(
      query,
      [user_id, username, email, hashedPassword, 'email'],
      (err, results) => {
        if (err) {
          console.error("Error registering user: ", err);
          return res.status(500).send("Error registering user");
        }
        // Generate a token for the newly registered user
        const token = generateToken({
          user_id: user_id,
          username: username,
          email: email
        });
        res.status(201).json({
          message: "User registered successfully",
          user: {
            user_id: user_id,
            username: username,
            email: email
          },
          token: token
        });
      }
    );
  });
});

// User login endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("Email and password are required");
  }
  const query = "SELECT * FROM users WHERE email = $1";
  pool.query(query, [email], (err, results) => {
    if (err) {
      console.error("Error logging in: ", err);
      return res.status(500).send("Error logging in");
    }
    if (results.rows.length === 0) {
      return res.status(401).send("Invalid email or password");
    }
    // Compare the hashed password from the database with the provided password
    const user = results.rows[0];
    bcrypt.compare(password, user.password_hash, (bcryptErr, bcryptResult) => {
      if (bcryptErr) {
        console.error("Error comparing passwords: ", bcryptErr);
        return res.status(500).send("Error logging in");
      }
      if (!bcryptResult) {
        return res.status(401).send("Invalid email or password");
      }
      // Passwords match, generate JWT token
      const token = generateToken(user);
      res.status(200).json({ user, token });
    });
  });
});

// Get ingredients for a specific recipe
app.get("/api/recipes/:id/ingredients", (req, res) => {
  const recipeId = req.params.id;
  const query = "SELECT * FROM ingredients WHERE recipe_id = $1";
  pool.query(query, [recipeId], (err, results) => {
    if (err) {
      console.error("Error retrieving ingredients: ", err);
      return res.status(500).send("Error retrieving ingredients");
    }
    res.status(200).json(results.rows);
  });
});

// Get user rating for a recipe
app.get("/api/recipes/:id/ratings/user", verifyToken, (req, res) => {
  const recipeId = req.params.id;
  const userId = req.userId;
  const query = "SELECT stars FROM ratings WHERE recipe_id = $1 AND user_id = $2";
  pool.query(query, [recipeId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching user rating: ", err);
      return res.status(500).send("Error checking rating");
    }
    if (results.rows.length === 0) {
      return res.status(200).json({ hasRated: false });
    }
    res.status(200).json({ hasRated: true, userRating: results.rows[0].stars });
  });
});

const fs = require("fs");

// Upload image to S3
app.post("/api/upload-image", upload.single("image"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded");
  }
  // Read the file from disk
  fs.readFile(file.path, (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return res.status(500).send("Error reading file");
    }
    const params = {
      Bucket: "imagebucketforproject2",
      Key: `images/${file.originalname}`,
      Body: data,
      ContentType: file.mimetype
    };
    // Upload file to S3
    s3.upload(params, (err, s3Data) => {
      if (err) {
        console.error("Error uploading file to S3:", err);
        console.error("S3 Params:", params);
        if (err.stack) console.error(err.stack);
        return res.status(500).send("Error uploading file to S3: " + err.message);
      }
      res.status(200).json({ imageUrl: s3Data.Location });
      // Delete file from disk after upload
      fs.unlink(file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting file from disk:", unlinkErr);
        }
      });
    });
  });
});

// Create a rating for a recipe
app.post("/api/recipes/:id/ratings/create", verifyToken, (req, res) => {
  const recipeId = req.params.id;
  const { rating } = req.body;
  const userId = req.userId; // Use user ID from token instead of request body
  
  console.log("=== RATING CREATION DEBUG ===");
  console.log("Recipe ID:", recipeId);
  console.log("User ID from token:", userId);
  console.log("Rating value:", rating);
  console.log("Request body:", req.body);
  
  if (!rating || rating < 1 || rating > 5) {
    console.log("ERROR: Invalid rating value");
    return res.status(400).send("Invalid rating value");
  }
  
  if (!userId) {
    console.log("ERROR: User ID is undefined");
    return res.status(401).send("User ID not found in token");
  }
  
  console.log("Creating rating for recipe:", recipeId, "user:", userId, "rating:", rating);
  
  const query =
    "INSERT INTO ratings (recipe_id, user_id, stars) VALUES ($1, $2, $3)";
  pool.query(query, [recipeId, userId, rating], (err, results) => {
    if (err) {
      console.error("Error adding rating: ", err);
      return res.status(500).send("Error adding rating");
    }
    console.log("SUCCESS: Rating added successfully");
    res.status(201).send("Rating added successfully");
  });
});

// Get average rating for a recipe
app.get("/api/recipes/:id/ratings", (req, res) => {
  const recipeId = req.params.id;
  const query =
    "SELECT AVG(stars) AS average_rating FROM ratings WHERE recipe_id = $1";
  pool.query(query, [recipeId], (err, results) => {
    if (err) {
      console.error("Error retrieving rating: ", err);
      return res.status(500).send("Error retrieving rating");
    }
    const averageRating = results.rows[0]?.average_rating || 0;
    res.status(200).json({ averageRating });
  });
});

// Paginated recipe list with search and average rating
app.get("/api/recipes", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;
  const searchTerm = req.query.search || '';
  const countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT r.recipe_id
      FROM recipes r 
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
      WHERE r.title ILIKE $1 OR r.description ILIKE $1
      GROUP BY r.recipe_id, r.title, r.description, r.user_id, r.image, r.instruction, r.created_at
    ) as counted_recipes
  `;
  const query = `
    SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author 
    FROM recipes r 
    LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
    LEFT JOIN users u ON r.user_id = u.user_id
    WHERE r.title ILIKE $1 OR r.description ILIKE $1
    GROUP BY r.recipe_id, u.username
    ORDER BY r.created_at DESC
    LIMIT $2 OFFSET $3
  `;
  const searchPattern = `%${searchTerm}%`;
  pool.query(countQuery, [searchPattern], (err, countResult) => {
    if (err) {
      console.error("Error counting recipes: ", err);
      return res.status(500).send("Error retrieving recipes");
    }
    const totalRecipes = parseInt(countResult.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(totalRecipes / limit) || 1;
    if (totalRecipes === 0) {
      return res.status(200).json({
        recipes: [],
        currentPage: page,
        totalPages: 1,
        totalRecipes: 0,
        limit: limit
      });
    }
    pool.query(query, [searchPattern, limit, offset], (err, results) => {
      if (err) {
        console.error("Error retrieving recipes: ", err);
        return res.status(500).send("Error retrieving recipes");
      }
      res.status(200).json({
        recipes: results.rows,
        currentPage: page,
        totalPages: totalPages,
        totalRecipes: totalRecipes,
        limit: limit
      });
    });
  });
});

// Get all ingredients
app.get("/api/ingredients", (req, res) => {
  const query = "SELECT * FROM ingredients";
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving ingredients: ", err);
      return res.status(500).send("Error retrieving recipes");
    }
    res.status(200).json(results.rows);
  });
});

// Get all recipes for a user
app.get("/api/recipes/:id", (req, res) => {
  const userId = req.params.id;
  if (!userId || userId === "undefined" || userId === "null") {
    console.log("Invalid user ID:", userId);
    return res.status(200).json([]);
  }
  const query = "SELECT recipe_id, title, description, user_id, image, instruction, created_at, total_time, servings FROM Recipes WHERE user_id = $1";
  pool.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error retrieving recipe: ", err);
      return res.status(500).send("Error retrieving recipe");
    }
    res.status(200).json(results.rows);
  });
});

// Create a new recipe (with ingredients)
app.post("/api/recipes/create", (req, res) => {
  const { title, description, user_id, image, instructions, totalTime, servings } = req.body;
  const ingredients = req.body.ingredients;
  const recipeQuery =
    "INSERT INTO recipes (title, description, user_id, image, instruction, total_time, servings) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING recipe_id";
  pool.query(
    recipeQuery,
    [title, description, user_id, image, instructions, totalTime, servings],
    (err, results) => {
      if (err) {
        console.error("Error creating recipe: ", err);
        return res.status(500).json({ error: "Error creating recipe" });
      }
      const recipeId = results.rows[0].recipe_id;
      if (!ingredients || ingredients.length === 0) {
        return res.status(201).json({ message: "Recipe created successfully" });
      }
      const ingredientPromises = ingredients.map(ingredient => {
        return new Promise((resolve, reject) => {
          const ingredientQuery = "INSERT INTO ingredients (recipe_id, item, quantity) VALUES ($1, $2, $3)";
          pool.query(ingredientQuery, [recipeId, ingredient.item, ingredient.quantity], (err, results) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      });
      Promise.all(ingredientPromises)
        .then(() => {
          res.status(201).json({ message: "Recipe created successfully" });
        })
        .catch(err => {
          console.error("Error adding ingredients: ", err);
          return res.status(500).json({ error: "Error adding ingredients" });
        });
    }
  );
});

// Delete a recipe by ID
app.delete("/api/recipes/delete/:id", (req, res) => {
  const recipeId = req.params.id;
  const query = "DELETE FROM recipes WHERE recipe_id = $1";
  pool.query(query, [recipeId], (err, results) => {
    if (err) {
      console.error("Error deleting recipe: ", err);
      return res.status(500).send("Error deleting recipe");
    }
    res.status(200).send("Recipe deleted successfully");
  });
});

// Get comments for a recipe
app.get("/api/recipes/:id/comments", (req, res) => {
  const recipeId = req.params.id;
  const query = "SELECT * FROM Comments WHERE recipe_id = $1";
  pool.query(query, [recipeId], (err, results) => {
    if (err) {
      console.error("Error retrieving comments: ", err);
      return res.status(500).send("Error retrieving comments");
    }
    res.status(200).json(results.rows);
  });
});

// Add a comment to a recipe
app.post("/api/recipes/:id/comments/create", verifyToken, (req, res) => {
  const { comment_text, username } = req.body;
  const recipeId = req.params.id;
  const userId = req.userId; // Use user ID from token
  
  if (!comment_text || !comment_text.trim()) {
    return res.status(400).send("Comment text is required");
  }
  
  console.log("Adding comment for recipe:", recipeId, "user:", userId);
  
  const query =
    "INSERT INTO Comments (comment_text, user_id, recipe_id, username) VALUES ($1, $2, $3, $4)";
  pool.query(
    query,
    [comment_text.trim(), userId, recipeId, username],
    (err, results) => {
      if (err) {
        console.error("Error adding comment: ", err);
        return res.status(500).send("Error adding comment");
      }
      res.status(201).send("Comment added successfully");
    }
  );
});

// Sort recipes endpoint (incomplete, add logic as needed)
app.get("/api/recipes/sort/:type", (req, res) => {
  const sortType = req.params.type;
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  console.log(`Fetching sorted recipes (${sortType}) page ${page} with limit ${limit}`);
  const offset = (page - 1) * limit;
  const searchTerm = req.query.search || '';
  let countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT r.recipe_id
      FROM recipes r 
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
      WHERE r.title ILIKE $1 OR r.description ILIKE $1
      GROUP BY r.recipe_id, r.title, r.description, r.user_id, r.image, r.instruction, r.created_at
    ) as counted_recipes
  `;
  let query;
  const searchPattern = `%${searchTerm}%`;
  switch (sortType) {
    case 'top-rated':
      query = `
        SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        GROUP BY r.recipe_id, u.username
        ORDER BY average_rating DESC
        LIMIT $2 OFFSET $3`;
      break;
    case 'rating-asc':
      query = `
        SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        GROUP BY r.recipe_id, u.username
        ORDER BY average_rating ASC
        LIMIT $2 OFFSET $3`;
      break;
    case 'rating-desc':
      query = `
        SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        GROUP BY r.recipe_id, u.username
        ORDER BY average_rating DESC
        LIMIT $2 OFFSET $3`;
      break;
    case 'newest':
      query = `
        SELECT r.*, 0 as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        GROUP BY r.recipe_id, u.username
        ORDER BY r.created_at DESC
        LIMIT $2 OFFSET $3`;
      break;
    case 'oldest':
      query = `
        SELECT r.*, 0 as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        GROUP BY r.recipe_id, u.username
        ORDER BY r.created_at ASC
        LIMIT $2 OFFSET $3`;
      break;
    default:
      query = `
        SELECT r.*, 0 as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title ILIKE $1 OR r.description ILIKE $1
        GROUP BY r.recipe_id, u.username
        LIMIT $2 OFFSET $3`;
  }
  pool.query(countQuery, [searchPattern], (err, countResult) => {
    if (err) {
      console.error("Error counting recipes: ", err);
      return res.status(500).send("Error retrieving recipes");
    }
    const totalRecipes = countResult.rows[0].total;
    const totalPages = Math.ceil(totalRecipes / limit);
    pool.query(query, [searchPattern, limit, offset], (err, results) => {
      if (err) {
        console.error("Error retrieving sorted recipes: ", err);
        return res.status(500).send("Error retrieving recipes");
      }
      // Log the number of results being returned
      console.log(`Returning ${results.rows.length} sorted recipes out of ${totalRecipes} total`);
      res.status(200).json({
        recipes: results.rows,
        currentPage: page,
        totalPages: totalPages,
        totalRecipes: totalRecipes,
        limit: limit // Explicitly include the limit in the response
      });
    });
  });
});

// Update the search suggestions endpoint (implementation omitted)
app.get("/api/search/suggestions", (req, res) => {
  const searchTerm = String(req.query.term || '').trim();
  if (!searchTerm) {
    return res.status(200).json([]);
  }
  console.log('Backend searching for:', searchTerm); // Debug log
  const query = `
    SELECT recipe_id, title, description 
    FROM recipes 
    WHERE LOWER(title) LIKE LOWER($1) 
    OR LOWER(description) LIKE LOWER($2)
    LIMIT 5
  `;
  const searchPattern = `%${searchTerm}%`;
  pool.query(
    query, 
    [searchPattern, searchPattern],
    (err, results) => {
      if (err) {
        console.error("Error searching recipes:", err);
        return res.status(500).send("Error searching recipes");
      }
      console.log('Search results:', results.rows); // Debug log
      res.status(200).json(results.rows);
    }
  );
});

// Add this endpoint for updating recipes
app.put("/api/recipes/update/:id", (req, res) => {
  const recipeId = req.params.id;
  const { title, description, instruction, ingredients, image, totalTime, servings } = req.body;

  // Start a transaction
  pool.connect((err, client, done) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).send("Error updating recipe");
    }

    client.query('BEGIN', (err) => {
      if (err) {
        done();
        return res.status(500).send("Error starting transaction");
      }
      // First update the recipe - match the capital "I" in Instruction
      const recipeQuery = `
        UPDATE recipes 
        SET title = $1, description = $2, instruction = $3, image = $4, total_time = $5, servings = $6
        WHERE recipe_id = $7
      `;
      client.query(
        recipeQuery,
        [title, description, instruction, image, totalTime, servings, recipeId],
        (error) => {
          if (error) {
            console.error("Error updating recipe:", error);
            return client.query('ROLLBACK', () => {
              done();
              res.status(500).send("Error updating recipe");
            });
          }

          // Delete existing ingredients
          client.query(
            "DELETE FROM ingredients WHERE recipe_id = $1",
            [recipeId],
            (error) => {
              if (error) {
                console.error("Error deleting ingredients:", error);
                return client.query('ROLLBACK', () => {
                  done();
                  res.status(500).send("Error updating recipe");
                });
              }

              // Insert new ingredients (if needed)
              if (ingredients && ingredients.length > 0) {
                // Create promises for each ingredient insertion
                const insertPromises = ingredients.map(ing => {
                  return new Promise((resolve, reject) => {
                    client.query(
                      "INSERT INTO ingredients (recipe_id, item, quantity) VALUES ($1, $2, $3)",
                      [recipeId, ing.item, ing.quantity],
                      (error) => {
                        if (error) {
                          reject(error);
                        } else {
                          resolve();
                        }
                      }
                    );
                  });
                });
                
                // Execute all insert promises
                Promise.all(insertPromises)
                  .then(() => {
                    // Commit the transaction after all inserts succeed
                    client.query('COMMIT', (err) => {
                      done();
                      if (err) {
                        console.error("Error committing transaction:", err);
                        return res.status(500).send("Error updating recipe");
                      }
                      res.status(200).json({ message: "Recipe updated successfully" });
                    });
                  })
                  .catch(error => {
                    console.error("Error inserting ingredients:", error);
                    client.query('ROLLBACK', () => {
                      done();
                      res.status(500).send("Error updating recipe");
                    });
                  });
              } else {
                // No ingredients to insert, just commit
                client.query('COMMIT', (err) => {
                  done();
                  if (err) {
                    console.error("Error committing transaction:", err);
                    return res.status(500).send("Error updating recipe");
                  }
                  res.status(200).json({ message: "Recipe updated successfully" });
                });
              }
            }
          );
        }
      );
    });
  });
});

// Add endpoint to sync Firebase users with your database - updated to handle duplicate emails
app.post("/api/users/sync", async (req, res) => {
  const { user_id, username, email, provider } = req.body;
  
  if (!user_id || !email) {
    return res.status(400).json({ error: "User ID and email are required" });
  }
  
  try {
    // First check if the user_id already exists (same Firebase user)
    const userByIdQuery = "SELECT * FROM users WHERE user_id = $1";
    const userByIdResult = await pool.query(userByIdQuery, [user_id]);
    
    if (userByIdResult.rows.length > 0) {
      // User with this ID exists, update their info
      const updateQuery = 
        "UPDATE users SET username = $1, provider = $2 WHERE user_id = $3 RETURNING *";
      // Note: We don't update email since it might conflict with another user
      const updateResult = await pool.query(updateQuery, [username, provider, user_id]);
      return res.status(200).json({ message: "User updated", user: updateResult.rows[0] });
    } 
    
    // Check if email already exists with a different user_id
    const emailCheckQuery = "SELECT * FROM users WHERE email = $1";
    const emailCheckResult = await pool.query(emailCheckQuery, [email]);
    
    if (emailCheckResult.rows.length > 0) {
      // There's already a user with this email - handle the situation
      // Option 1: Return a conflict error
      return res.status(409).json({ 
        message: "Email already in use by another account", 
        existingUser: {
          user_id: emailCheckResult.rows[0].user_id,
          username: emailCheckResult.rows[0].username,
          provider: emailCheckResult.rows[0].provider
        }
      });
      
      // Option 2 (alternative): Generate a unique email for storage
      // This would modify the email to make it unique in the database
      // while the actual Firebase auth would use the real email
      // const uniqueEmail = `${email}_${user_id.substring(0, 8)}`;
      // ... continue with insert using uniqueEmail
    }
    
    // Email not found, create new user
    const insertQuery = 
      "INSERT INTO users (user_id, username, email, provider, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *";
    const insertResult = await pool.query(insertQuery, [user_id, username, email, provider]);
    return res.status(201).json({ message: "User created", user: insertResult.rows[0] });
  } catch (error) {
    console.error("Error syncing user:", error);
    return res.status(500).json({ error: "Error synchronizing user" });
  }
});

// Recipe Generation using OpenAI
app.post("/api/recipe/generate", async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    // Validate input
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ 
        error: "Please provide a valid array of ingredients" 
      });
    }
    
    console.log("Generating recipe for ingredients:", ingredients);
    
    // Create a prompt for OpenAI
    const prompt = `Create a delicious recipe using these ingredients: ${ingredients.join(', ')}.

Please provide the response in the following JSON format:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity", ...],
  "method": "Step-by-step cooking instructions with each step on a new line, numbered like:\n1. First step here\n2. Second step here\n3. Third step here"
}

Make sure the recipe is practical, delicious, and uses the provided ingredients as main components. You can suggest additional common ingredients if needed. Format the method with clear numbered steps separated by newlines.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [
        {
          role: "system",
          content: "You are a professional chef who creates amazing recipes. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0].message.content;
    
    try {
      // Parse the JSON response
      const recipe = JSON.parse(responseText);
      
      // Validate the response structure
      if (!recipe.title || !recipe.ingredients || !recipe.method) {
        throw new Error("Invalid recipe structure");
      }
      
      return res.status(200).json({ 
        success: true, 
        recipe 
      });
    } catch (jsonError) {
      console.error("Error parsing recipe JSON:", jsonError);
      console.log("Raw OpenAI response:", responseText);
      
      // If JSON parsing fails, try to extract recipe info manually
      const fallbackRecipe = {
        title: `Recipe with ${ingredients.join(', ')}`,
        ingredients: ingredients.map(ing => `${ing} - as needed`),
        method: responseText || "Recipe generation failed. Please try again."
      };
      
      return res.status(200).json({ 
        success: true, 
        recipe: fallbackRecipe
      });
    }
  } catch (error) {
    console.error("Error generating recipe:", error);
    return res.status(500).json({ 
      error: "Failed to generate recipe", 
      message: error.message 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

// Debug endpoints (remove in production)
app.get("/debug-env", (req, res) => { res.json({ PG_HOST: process.env.PG_HOST, PG_USER: process.env.PG_USER, PG_PASSWORD: process.env.PG_PASSWORD ? "***SET***" : "NOT_SET", PG_DATABASE: process.env.PG_DATABASE }); });
app.get("/debug-password", (req, res) => { res.json({ password_length: process.env.PG_PASSWORD ? process.env.PG_PASSWORD.length : 0, password_first_char: process.env.PG_PASSWORD ? process.env.PG_PASSWORD[0] : "none", password_has_dollar: process.env.PG_PASSWORD ? process.env.PG_PASSWORD.includes("$") : false }); });
