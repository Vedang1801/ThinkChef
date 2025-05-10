require('dotenv').config({ path: '../.env' }); 


const express = require("express");
const cors = require("cors");
const { Pool } = require('pg'); // Changed from mysql2 to pg
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
// Specify the destination directory for file uploads
const secretKey = process.env.JWT_SECRET || "FinalProject@1234";
const bcrypt = require("bcrypt");
const app = express();
const port = 3000;


app.use(bodyParser.json()); 
const upload = multer({ dest: "uploads/" }); 

// Create connection to PostgreSQL database using environment variables
const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT
});

// Test database connection
pool.connect((err, client, done) => {
  if (err) {
    console.error("Error connecting to PostgreSQL database: ", err);
    return;
  }
  console.log("Connected to PostgreSQL database");
  done();
});

// Development-only CORS configuration
const corsOptions = {
  origin: true, // Allow all origins
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

// app.use(cors());
// app.use(cors({
//   origin: 'http://localhost:5173' // Allow requests only from this origin
// }));

function generateToken(user) {
  const payload = {
    userId: user.user_id,
    username: user.username,
    email: user.email,
    // You can add more user data to the payload as needed
  };
  return jwt.sign(payload, secretKey, { expiresIn: "1h" }); // Token expires in 1 hour
}

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).send("Unauthorized: No token provided");
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).send("Unauthorized: Token expired");
      }
      return res.status(401).send("Unauthorized: Invalid token");
    }
    req.userId = decoded.userId;
    next();
  });
}

// Add this block before AWS.config.update
if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_REGION
) {
  console.error("AWS credentials are missing in environment variables.");
  process.exit(1);
}

// Configure AWS SDK with your credentials and region
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
    

const s3 = new AWS.S3();

// Middleware to parse JSON body
app.use(bodyParser.json());

// User Management
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).send("All fields are required");
  }

  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error("Error hashing password: ", err);
      return res.status(500).send("Error registering user");
    }

    const query =
      "INSERT INTO Users (username, email, password_hash) VALUES ($1, $2, $3)";
    pool.query(
      query,
      [username, email, hashedPassword],
      (err, results) => {
        if (err) {
          console.error("Error registering user: ", err);
          return res.status(500).send("Error registering user");
        }
        res.status(201).send("User registered successfully");
      }
    );
  });
});

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
      // Return both user details and token
      res.status(200).json({ user, token });
    });
  });
});


// Endpoint to retrieve ingredients for a recipe
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
      Bucket: "imagebucketforproject1",
      Key: `images/${file.originalname}`,
      Body: data,
      ContentType: file.mimetype
    };

    // Upload file to S3
    s3.upload(params, (err, s3Data) => {
      if (err) {
        // Improved error logging
        console.error("Error uploading file to S3:", err);
        console.error("S3 Params:", params);
        if (err.stack) console.error(err.stack);
        return res.status(500).send("Error uploading file to S3: " + err.message);
      }
      res.status(200).json({ imageUrl: s3Data.Location });
      fs.unlink(file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error("Error deleting file from disk:", unlinkErr);
        }
      });
    });
  });
});





// Add the following API endpoints to your existing backend code

// Endpoint to create a rating for a recipe
app.post("/api/recipes/:id/ratings/create", verifyToken, (req, res) => {
  const recipeId = req.params.id;
  const { rating, user_id } = req.body;

  // Insert the rating into the database
  const query =
    "INSERT INTO ratings (recipe_id, user_id, stars) VALUES ($1, $2, $3)";
  pool.query(query, [recipeId, user_id, rating], (err, results) => {
    if (err) {
      console.error("Error adding rating: ", err);
      return res.status(500).send("Error adding rating");
    }
    res.status(201).send("Rating added successfully");
  });
});

// Endpoint to retrieve the average rating for a recipe
app.get("/api/recipes/:id/ratings", (req, res) => {
  const recipeId = req.params.id;

  // Retrieve the average rating from the database
  const query =
    "SELECT AVG(stars) AS average_rating FROM ratings WHERE recipe_id = $1";
  pool.query(query, [recipeId], (err, results) => {
    if (err) {
      console.error("Error retrieving rating: ", err);
      return res.status(500).send("Error retrieving rating");
    }
    const averageRating = results.rows[0]?.average_rating || 0; // Handle cases where there are no ratings (averageRating might be NULL)
    res.status(200).json({ averageRating });
  });
});



// Recipe Management
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

    // Fix: If there are no recipes, return empty array and pagination info
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

app.get("/api/ingredients", (req, res) => {
  // Implementation to retrieve all recipes
  const query = "SELECT * FROM ingredients";
  pool.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving ingredients: ", err);
      return res.status(500).send("Error retrieving recipes");
    }
    res.status(200).json(results.rows);
  });
});

app.get("/api/recipes/:id", (req, res) => {
  const userId = req.params.id;
  // Use lowercase "instruction" to match what's in the database
  const query = "SELECT recipe_id, title, description, user_id, image, instruction, created_at FROM Recipes WHERE user_id = $1";
  pool.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error retrieving recipe: ", err);
      return res.status(500).send("Error retrieving recipe");
    }
    // Always return 200 with an array, even if empty
    res.status(200).json(results.rows);
  });
});

app.post("/api/recipes/create", (req, res) => {
  const { title, description, user_id, image, instructions, totalTime, servings } = req.body;
  const ingredients = req.body.ingredients; // Array of ingredients

  // Update SQL query to use lowercase "instruction" to match what's in the database
  const recipeQuery =
    "INSERT INTO recipes (title, description, user_id, image, instruction, total_time, servings) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING recipe_id";
  pool.query(
    recipeQuery,
    [title, description, user_id, image, instructions, totalTime, servings],
    (err, results) => {
      if (err) {
        console.error("Error creating recipe: ", err);
        return res.status(500).json({ error: "Error creating recipe" }); // Return JSON response
      }

      const recipeId = results.rows[0].recipe_id;
      
      // No ingredients to insert
      if (!ingredients || ingredients.length === 0) {
        return res.status(201).json({ message: "Recipe created successfully" }); // Return JSON response
      }

      // PostgreSQL doesn't support bulk insertion the same way as MySQL
      // Create a promise for each ingredient insert
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

      // Execute all ingredient insert queries
      Promise.all(ingredientPromises)
        .then(() => {
          res.status(201).json({ message: "Recipe created successfully" }); // Return JSON response
        })
        .catch(err => {
          console.error("Error adding ingredients: ", err);
          return res.status(500).json({ error: "Error adding ingredients" }); // Return JSON response
        });
    }
  );
});

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
// Comments Management
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

app.post("/api/recipes/:id/comments/create", (req, res) => {
  const { comment_text, user_id, username } = req.body;
  const recipeId = req.params.id;
  const query =
    "INSERT INTO Comments (comment_text, user_id, recipe_id, username) VALUES ($1, $2, $3, $4)";
  pool.query(
    query,
    [comment_text, user_id, recipeId, username],
    (err, results) => {
      if (err) {
        console.error("Error adding comment: ", err);
        return res.status(500).send("Error adding comment");
      }
      res.status(201).send("Comment added successfully");
    }
  );
});

// Add this endpoint for sorting recipes
app.get("/api/recipes/sort/:type", (req, res) => {
  const sortType = req.params.type;
  const page = parseInt(req.query.page) || 1;
  const limit = 12; // Ensure this is 12
  console.log(`Fetching sorted recipes (${sortType}) page ${page} with limit ${limit}`); // Add logging
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

// Update the search suggestions endpoint
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

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});



