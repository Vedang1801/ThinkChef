"use strict";
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
// Create connection to MySQL database
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "cs612week3lab",
});
// Connect to MySQL database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to database: ", err);
    return;
  }
  console.log("Connected to MySQL database");
});
// Middleware to parse JSON body
app.use(bodyParser.json());

/*User Management
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).send('All fields are required');
    }
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    connection.query(query, [username, email, password], (err, results) => {
        if (err) {
            console.error('Error registering user: ', err);
            return res.status(500).send('Error registering user');
        }
        res.status(201).send('User registered successfully');
    });
});
app.post('/api/login', (req, res) => {
    // Implementation for user login
});
app.post('/api/logout', (req, res) => {
    // Implementation for user logout
});
// Recipe Management
app.get('/api/recipes', (req, res) => {
    // Implementation to retrieve all recipes
});
app.get('/api/recipes/:id', (req, res) => {
    // Implementation to retrieve a specific recipe by ID
});
app.post('/api/recipes/create', (req, res) => {
    // Implementation to create a new recipe
});
app.put('/api/recipes/:id/update', (req, res) => {
    // Implementation to update an existing recipe by ID
});
app.delete('/api/recipes/:id/delete', (req, res) => {
    // Implementation to delete a recipe by ID
});
// Comments Management
app.get('/api/recipes/:id/comments', (req, res) => {
    // Implementation to retrieve comments for a specific recipe by ID
});
app.post('/api/recipes/:id/comments/create', (req, res) => {
    // Implementation to add a new comment to a recipe
});
// Start the server
app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
*/

//... (rest of the code remains the same)

// User Management
app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).send("All fields are required");
  }
  const query = "INSERT INTO users (username, email, password) VALUES (?,?,?)";
  connection.query(query, [username, email, password], (err, results) => {
    if (err) {
      console.error("Error registering user: ", err);
      return res.status(500).send("Error registering user");
    }
    res.status(201).send("User registered successfully");
  });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send("All fields are required");
  }
  const query = "SELECT * FROM users WHERE username =? AND password =?";
  connection.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("Error logging in user: ", err);
      return res.status(500).send("Error logging in user");
    }
    if (results.length === 0) {
      return res.status(401).send("Invalid username or password");
    }
    res.status(200).send("User logged in successfully");
  });
});

app.post("/api/logout", (req, res) => {
  // Implementation for user logout (e.g., clear session, etc.)
  res.status(200).send("User logged out successfully");
});

// Recipe Management
app.get("/api/recipes", (req, res) => {
  const query = "SELECT * FROM recipes";
  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error retrieving recipes: ", err);
      return res.status(500).send("Error retrieving recipes");
    }
    res.status(200).send(results);
  });
});

app.get("/api/recipes/:id", (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM recipes WHERE id =?";
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving recipe: ", err);
      return res.status(500).send("Error retrieving recipe");
    }
    if (results.length === 0) {
      return res.status(404).send("Recipe not found");
    }
    res.status(200).send(results[0]);
  });
});

app.post("/api/recipes/create", (req, res) => {
  const { title, description, ingredients, instructions } = req.body;
  if (!title || !description || !ingredients || !instructions) {
    return res.status(400).send("All fields are required");
  }
  const query =
    "INSERT INTO recipes (title, description, ingredients, instructions) VALUES (?,?,?,?)";
  connection.query(
    query,
    [title, description, ingredients, instructions],
    (err, results) => {
      if (err) {
        console.error("Error creating recipe: ", err);
        return res.status(500).send("Error creating recipe");
      }
      res.status(201).send("Recipe created successfully");
    }
  );
});

app.put("/api/recipes/:id/update", (req, res) => {
  const id = req.params.id;
  const { title, description, ingredients, instructions } = req.body;
  if (!title || !description || !ingredients || !instructions) {
    return res.status(400).send("All fields are required");
  }
  const query =
    "UPDATE recipes SET title =?, description =?, ingredients =?, instructions =? WHERE id =?";
  connection.query(
    query,
    [title, description, ingredients, instructions, id],
    (err, results) => {
      if (err) {
        console.error("Error updating recipe: ", err);
        return res.status(500).send("Error updating recipe");
      }
      res.status(200).send("Recipe updated successfully");
    }
  );
});

app.delete("/api/recipes/:id/delete", (req, res) => {
  const id = req.params.id;
  const query = "DELETE FROM recipes WHERE id =?";
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error deleting recipe: ", err);
      return res.status(500).send("Error deleting recipe");
    }
    res.status(200).send("Recipe deleted successfully");
  });
});

// Comments Management
app.get("/api/recipes/:id/comments", (req, res) => {
  const id = req.params.id;
  const query = "SELECT * FROM comments WHERE recipe_id =?";
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error("Error retrieving comments: ", err);
      return res.status(500).send("Error retrieving comments");
    }
    res.status(200).send(results);
  });
});

app.post("/api/recipes/:id/comments/create", (req, res) => {
  const id = req.params.id;
  const { author, content } = req.body;
  if (!author || !content) {
    return res.status(400).send("Author and content fields are required");
  }
  const query =
    "INSERT INTO comments (recipe_id, author, content) VALUES (?,?,?)";
  connection.query(query, [id, author, content], (err, results) => {
    if (err) {
      console.error("Error creating comment: ", err);
      return res.status(500).send("Error creating comment");
    }
    res.status(201).send("Comment created successfully");
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
