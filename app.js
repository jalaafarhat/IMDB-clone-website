const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files in the "Client" folder
app.use(express.static("Client"));

// Middleware to parse JSON requests
app.use(express.json());

// Default route
app.get("/", (req, res) => {
  res.redirect("/mainPage.html");
});

// Register route
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const usersFile = path.join(__dirname, "users.json");

  // Read existing users
  let users = [];
  if (fs.existsSync(usersFile)) {
    const usersData = fs.readFileSync(usersFile);
    users = JSON.parse(usersData);
  }

  // Check if email already exists
  if (users.some((user) => user.email === email)) {
    return res.status(400).json({
      success: false,
      message: "Email already registered.",
    });
  }

  // Add new user
  users.push({ name, email, password });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  res.json({ success: true, message: "Registration successful!" });
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const usersFile = path.join(__dirname, "users.json");

  // Check if users.json exists
  if (!fs.existsSync(usersFile)) {
    return res.status(404).json({ success: false, message: "No users found." });
  }

  // Read users from the file
  const usersData = fs.readFileSync(usersFile);
  const users = JSON.parse(usersData);

  // Find the user by email
  const user = users.find((u) => u.email === email);
  // Login successful
  res.json({ success: true, message: "Login successful!" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
