const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const AWS = require("aws-sdk");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Specify the destination directory for file uploads
const secretKey = "FinalProject@1234";
const bcrypt = require("bcrypt");
const app = express();
const port = 3000;

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

const corsOptions = {
  origin: "http://localhost:5173", // Allow requests only from this origin
  credentials: true, //access-control-allow-credentials:true
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
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).send("Unauthorized: No token provided");
  }
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).send("Unauthorized: Invalid token");
    }
    req.userId = decoded.userId; // Attach user ID to request object for further processing
    next();
  });
}

// Configure AWS SDK with your credentials and region
AWS.config.update({
  accessKeyId: "",
  secretAccessKey: "",
  region: "ap-south-1",
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

// Recipe Management
app.get("/api/recipes", (req, res) => {
  // Implementation to retrieve all recipes
  const query = "SELECT * FROM recipes";
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving recipes: ", err);
      return res.status(500).send("Error retrieving recipes");
    }
    res.status(200).json(results);
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
  // Implementation to retrieve a specific recipe by ID
  const userId = req.params.id;
  const query = "SELECT * FROM Recipes WHERE user_id = ?";
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
  const { title, description, user_id, image, Instructions } = req.body;
  const ingredients = req.body.ingredients; // Array of ingredients

  // Insert recipe first
  const recipeQuery =
    "INSERT INTO recipes (title, description, user_id, image, Instruction) VALUES (?, ?, ?, ?,?)";
  connection.query(
    recipeQuery,
    [title, description, user_id, image, Instructions],
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

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
