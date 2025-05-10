require('dotenv').config({ path: '../.env' }); 

/*
console.log(process.env.AWS_ACCESS_KEY_ID);
console.log(process.env.AWS_SECRET_ACCESS_KEY);
console.log(process.env.AWS_REGION);
*/

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
// Specify the destination directory for file uploads
const secretKey = "FinalProject@1234";
const bcrypt = require("bcrypt");
const app = express();
const port = 3000;


app.use(bodyParser.json()); 
const upload = multer({ dest: "uploads/" }); 

// Create connection to MySQL database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "vedang18",
  database: "finalproject",
  dataStrings: true,
});

// Connect to MySQL database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
    return;
  }
  console.log("Connected to MySQL database");
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
      "INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)";
    connection.query(
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
  const query = "SELECT * FROM users WHERE email = ?";
  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error("Error logging in: ", err);
      return res.status(500).send("Error logging in");
    }
    if (results.length === 0) {
      return res.status(401).send("Invalid email or password");
    }
    // Compare the hashed password from the database with the provided password
    const user = results[0];
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
  const query = "SELECT * FROM ingredients WHERE recipe_id = ?";
  connection.query(query, [recipeId], (err, results) => {
    if (err) {
      console.error("Error retrieving ingredients: ", err);
      return res.status(500).send("Error retrieving ingredients");
    }
    res.status(200).json(results);
  });
});



app.get("/api/recipes/:id/ratings/user", verifyToken, (req, res) => {
  const recipeId = req.params.id;
  const userId = req.userId;
  const query = "SELECT stars FROM ratings WHERE recipe_id = ? AND user_id = ?";
  connection.query(query, [recipeId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching user rating: ", err);
      return res.status(500).send("Error checking rating");
    }
    if (results.length === 0) {
      return res.status(200).json({ hasRated: false });
    }
    res.status(200).json({ hasRated: true, userRating: results[0].stars });
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
      ContentType: file.mimetype // Add content type for proper MIME handling
      // Do not set ACL if your bucket policy is public-read
    };

    // Upload file to S3
    s3.upload(params, (err, s3Data) => {
      if (err) {
        console.error("Error uploading file:", err);
        return res.status(500).send("Error uploading file to S3");
      }
      // Always return the full S3 URL
      res.status(200).json({ imageUrl: s3Data.Location });
      // Delete the file from disk after uploading to S3
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
    "INSERT INTO ratings (recipe_id, user_id, stars) VALUES (?, ?, ?)";
  connection.query(query, [recipeId, user_id, rating], (err, results) => {
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
    "SELECT AVG(stars) AS average_rating FROM ratings WHERE recipe_id = ?";
  connection.query(query, [recipeId], (err, results) => {
    if (err) {
      console.error("Error retrieving rating: ", err);
      return res.status(500).send("Error retrieving rating");
    }
    const averageRating = results[0].average_rating || 0; // Handle cases where there are no ratings (averageRating might be NULL)
    res.status(200).json({ averageRating });
  });
});



// Recipe Management
app.get("/api/recipes", (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;
  const searchTerm = req.query.search as string || '';

  const countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT r.recipe_id
      FROM recipes r 
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
      WHERE r.title LIKE ? OR r.description LIKE ?
      GROUP BY r.recipe_id
    ) as counted_recipes
  `;
  
  const query = `
    SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author 
    FROM recipes r 
    LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
    LEFT JOIN users u ON r.user_id = u.user_id
    WHERE r.title LIKE ? OR r.description LIKE ?
    GROUP BY r.recipe_id 
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const searchPattern = `%${searchTerm}%`;

  connection.query(countQuery, [searchPattern, searchPattern], (err, countResult) => {
    if (err) {
      console.error("Error counting recipes: ", err);
      return res.status(500).send("Error retrieving recipes");
    }

    // Fix: If there are no recipes, return empty array and pagination info
    const totalRecipes = parseInt(countResult[0]?.total || 0, 10);
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

    connection.query(query, [searchPattern, searchPattern, limit, offset], (err, results) => {
      if (err) {
        console.error("Error retrieving recipes: ", err);
        return res.status(500).send("Error retrieving recipes");
      }
      res.status(200).json({
        recipes: results,
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
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving ingredients: ", err);
      return res.status(500).send("Error retrieving recipes");
    }
    res.status(200).json(results);
  });
});

app.get("/api/recipes/:id", (req, res) => {
  const userId = req.params.id;
  const query = "SELECT recipe_id, title, description, user_id, image, Instruction, created_at FROM Recipes WHERE user_id = ?";
  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error retrieving recipe: ", err);
      return res.status(500).send("Error retrieving recipe");
    }
    if (results.length === 0) {
      return res.status(404).send("Recipe not found");
    }
    res.status(200).json(results);
  });
});

app.post("/api/recipes/create", (req, res) => {
  const { title, description, user_id, image, instructions, totalTime, servings } = req.body;
  const ingredients = req.body.ingredients; // Array of ingredients

  // Insert recipe first
  const recipeQuery =
    "INSERT INTO recipes (title, description, user_id, image, Instruction, total_time, servings) VALUES (?, ?, ?, ?, ?, ?, ?)";
  connection.query(
    recipeQuery,
    [title, description, user_id, image, instructions, totalTime, servings],
    (err, results) => {
      if (err) {
        console.error("Error creating recipe: ", err);
        return res.status(500).send("Error creating recipe");
      }

      const recipeId = results.insertId;

      // Insert ingredients
      const ingredientValues = ingredients.map((ingredient) => [
        recipeId,
        ingredient.item,
        ingredient.quantity,
      ]);
      const ingredientQuery =
        "INSERT INTO ingredients (recipe_id, item, quantity) VALUES ?";
      connection.query(ingredientQuery, [ingredientValues], (err, results) => {
        if (err) {
          console.error("Error adding ingredients: ", err);
          return res.status(500).send("Error adding ingredients");
        }
        res.status(201).send("Recipe created successfully");
      });
    }
  );
});

app.delete("/api/recipes/delete/:id", (req, res) => {
  const recipeId = req.params.id;
  const query = "DELETE FROM recipes WHERE recipe_id = ?";
  connection.query(query, [recipeId], (err, results) => {
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
  const query = "SELECT * FROM Comments WHERE recipe_id = ?";
  connection.query(query, [recipeId], (err, results) => {
    if (err) {
      console.error("Error retrieving comments: ", err);
      return res.status(500).send("Error retrieving comments");
    }
    res.status(200).json(results);
  });
});

app.post("/api/recipes/:id/comments/create", (req, res) => {
  const { comment_text, user_id, username } = req.body;
  const recipeId = req.params.id;
  const query =
    "INSERT INTO Comments (comment_text, user_id, recipe_id, username) VALUES (?, ?, ?, ?)";
  connection.query(
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
  const page = parseInt(req.query.page as string) || 1;
  const limit = 12; // Ensure this is 12
  console.log(`Fetching sorted recipes (${sortType}) page ${page} with limit ${limit}`); // Add logging
  const offset = (page - 1) * limit;
  const searchTerm = req.query.search as string || '';
  
  let countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT r.recipe_id
      FROM recipes r 
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
      WHERE r.title LIKE ? OR r.description LIKE ?
      GROUP BY r.recipe_id
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
        WHERE r.title LIKE ? OR r.description LIKE ?
        GROUP BY r.recipe_id 
        ORDER BY average_rating DESC
        LIMIT ? OFFSET ?`;
      break;
    case 'newest':
      query = `
        SELECT r.*, 0 as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title LIKE ? OR r.description LIKE ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?`;
      break;
    case 'oldest':
      query = `
        SELECT r.*, 0 as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title LIKE ? OR r.description LIKE ?
        ORDER BY r.created_at ASC
        LIMIT ? OFFSET ?`;
      break;
    case 'rating-asc':
      query = `
        SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title LIKE ? OR r.description LIKE ?
        GROUP BY r.recipe_id 
        ORDER BY average_rating ASC
        LIMIT ? OFFSET ?`;
      break;
    case 'rating-desc':
      query = `
        SELECT r.*, COALESCE(AVG(rt.stars), 0) as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title LIKE ? OR r.description LIKE ?
        GROUP BY r.recipe_id 
        ORDER BY average_rating DESC
        LIMIT ? OFFSET ?`;
      break;
    default:
      query = `
        SELECT r.*, 0 as average_rating, u.username as author 
        FROM recipes r 
        LEFT JOIN users u ON r.user_id = u.user_id
        WHERE r.title LIKE ? OR r.description LIKE ?
        LIMIT ? OFFSET ?`;
  }

  connection.query(countQuery, [searchPattern, searchPattern], (err, countResult) => {
    if (err) {
      console.error("Error counting recipes: ", err);
      return res.status(500).send("Error retrieving recipes");
    }

    const totalRecipes = countResult[0].total;
    const totalPages = Math.ceil(totalRecipes / limit);

    connection.query(query, [searchPattern, searchPattern, limit, offset], (err, results) => {
      if (err) {
        console.error("Error retrieving sorted recipes: ", err);
        return res.status(500).send("Error retrieving recipes");
      }
      
      // Log the number of results being returned
      console.log(`Returning ${results.length} sorted recipes out of ${totalRecipes} total`);
      
      res.status(200).json({
        recipes: results,
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
    WHERE LOWER(title) LIKE LOWER(?) 
    OR LOWER(description) LIKE LOWER(?)
    LIMIT 5
  `;

  const searchPattern = `%${searchTerm}%`;
  
  connection.query(
    query, 
    [searchPattern, searchPattern],
    (err, results) => {
      if (err) {
        console.error("Error searching recipes:", err);
        return res.status(500).send("Error searching recipes");
      }
      
      console.log('Search results:', results); // Debug log
      res.status(200).json(results);
    }
  );
});

// Add this endpoint for updating recipes
app.put("/api/recipes/update/:id", (req, res) => {
  const recipeId = req.params.id;
  const { title, description, instruction, ingredients, image, totalTime, servings } = req.body;

  // Start a transaction
  connection.beginTransaction(async (err) => {
    if (err) {
      console.error("Error starting transaction:", err);
      return res.status(500).send("Error updating recipe");
    }

    try {
      // First update the recipe
      const recipeQuery = `
        UPDATE recipes 
        SET title = ?, description = ?, Instruction = ?, image = ?, total_time = ?, servings = ?
        WHERE recipe_id = ?
      `;
      
      await new Promise<void>((resolve, reject) => {
        connection.query(
          recipeQuery,
          [title, description, instruction, image, totalTime, servings, recipeId],
          (error) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });

      // Delete existing ingredients
      await new Promise<void>((resolve, reject) => {
        connection.query(
          "DELETE FROM ingredients WHERE recipe_id = ?",
          [recipeId],
          (error) => {
            if (error) reject(error);
            else resolve();
          }
        );
      });

      // Insert new ingredients (if needed)
      if (ingredients && ingredients.length > 0) {
        const ingredientValues = ingredients.map(ing => [
          recipeId,
          ing.item,
          ing.quantity
        ]);
        
        await new Promise<void>((resolve, reject) => {
          connection.query(
            "INSERT INTO ingredients (recipe_id, item, quantity) VALUES ?",
            [ingredientValues],
            (error) => {
              if (error) reject(error);
              else resolve();
            }
          );
        });
      }

      // Commit the transaction
      connection.commit((err) => {
        if (err) {
          console.error("Error committing transaction:", err);
          return connection.rollback(() => {
            res.status(500).send("Error updating recipe");
          });
        }
        res.status(200).json({ message: "Recipe updated successfully" });
      });

    } catch (error) {
      console.error("Error in update transaction:", error);
      return connection.rollback(() => {
        res.status(500).send("Error updating recipe");
      });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});



