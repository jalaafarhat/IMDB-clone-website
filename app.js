const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static("Client"));
app.use(express.json());
app.use(
  session({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

const usersFilePath = path.join(__dirname, "users.json");
const favoritesFilePath = path.join(__dirname, "UsersFavorites.json");

// Helper functions
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
const isValidPassword = (password) => password.length >= 6;

// Default route
app.get("/", (req, res) => {
  res.redirect("/mainPage.html");
});

// Register route
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required!" });
  }
  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format!" });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters!",
    });
  }
  let users = fs.existsSync(usersFilePath)
    ? JSON.parse(fs.readFileSync(usersFilePath))
    : [];
  if (users.some((user) => user.email === email)) {
    return res
      .status(400)
      .json({ success: false, message: "Email already registered!" });
  }
  users.push({ name, email, password });
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
  res.json({ success: true, message: "Registration successful!" });
});

// Login route
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let users = fs.existsSync(usersFilePath)
    ? JSON.parse(fs.readFileSync(usersFilePath))
    : [];
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }
  req.session.user = user;
  res.json({ success: true, user: { name: user.name, email: user.email } });
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/homePage.html");
  });
});

// Get user favorites
app.get("/favorites", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const email = req.session.user.email;
  let favoritesData = fs.existsSync(favoritesFilePath)
    ? JSON.parse(fs.readFileSync(favoritesFilePath))
    : {};
  res.json({ success: true, favorites: favoritesData[email] || [] });
});

// Add to favorites
app.post("/favorites", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const { movie } = req.body;
  const email = req.session.user.email;
  let favoritesData = fs.existsSync(favoritesFilePath)
    ? JSON.parse(fs.readFileSync(favoritesFilePath))
    : {};
  favoritesData[email] = favoritesData[email] || [];
  if (favoritesData[email].some((fav) => fav.imdbID === movie.imdbID)) {
    return res
      .status(400)
      .json({ success: false, message: "Movie is already in favorites" });
  }
  favoritesData[email].push(movie);
  fs.writeFileSync(favoritesFilePath, JSON.stringify(favoritesData, null, 2));
  res.json({ success: true, message: "Movie added to favorites" });
});

// Remove from favorites
app.delete("/favorites", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const { imdbID } = req.body;
  const email = req.session.user.email;
  let favoritesData = fs.existsSync(favoritesFilePath)
    ? JSON.parse(fs.readFileSync(favoritesFilePath))
    : {};
  if (!favoritesData[email]) {
    return res
      .status(404)
      .json({ success: false, message: "No favorites found" });
  }
  favoritesData[email] = favoritesData[email].filter(
    (fav) => fav.imdbID !== imdbID
  );
  fs.writeFileSync(favoritesFilePath, JSON.stringify(favoritesData, null, 2));
  res.json({ success: true, message: "Movie removed from favorites" });
});
app.get("/check-session", (req, res) => {
  if (req.session.user) {
    res.json({ success: true, user: req.session.user });
  } else {
    res.json({ success: false });
  }
});

// Start the server

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
