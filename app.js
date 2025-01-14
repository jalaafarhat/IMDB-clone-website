const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve static files in the "Client" folder
app.use(express.static("Client"));

// Middleware to parse JSON requests
app.use(express.json());

// Path to UserFavorites.json
const favoritesFilePath = path.join(__dirname, "UsersFavorites.json");

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
  const user = users.find((u) => u.email === email && u.password === password);
  // Login successful
  if (user) {
    res.json({ success: true });
  } else {
    res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }
});

app.get("/favorites", (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  fs.readFile(favoritesFilePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading favorites file:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    const favoritesData = JSON.parse(data || "{}");
    const userFavorites = favoritesData[email] || []; // Return an empty list if no favorites exist

    res.json({ success: true, favorites: userFavorites });
  });
});
app.post("/favorites", (req, res) => {
  const { email, movie } = req.body;

  if (!email || !movie) {
    return res
      .status(400)
      .json({ success: false, message: "Email and movie data are required" });
  }

  fs.readFile(favoritesFilePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading favorites file:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    const favoritesData = JSON.parse(data || "{}");

    if (!favoritesData[email]) {
      favoritesData[email] = [];
    }

    // Check if the movie is already in the favorites
    const isFavorite = favoritesData[email].some(
      (fav) => fav.imdbID === movie.imdbID
    );

    if (isFavorite) {
      return res
        .status(400)
        .json({ success: false, message: "Movie is already in favorites" });
    }

    favoritesData[email].push(movie);

    fs.writeFile(
      favoritesFilePath,
      JSON.stringify(favoritesData, null, 2),
      (err) => {
        if (err) {
          console.error("Error writing to favorites file:", err);
          return res
            .status(500)
            .json({ success: false, message: "Server error" });
        }

        res.json({ success: true, message: "Movie added to favorites" });
      }
    );
  });
});

app.delete("/favorites", (req, res) => {
  const { email, imdbID } = req.body;

  if (!email || !imdbID) {
    return res
      .status(400)
      .json({ success: false, message: "Email and IMDb ID are required" });
  }

  fs.readFile(favoritesFilePath, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading favorites file:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    const favoritesData = JSON.parse(data || "{}");

    if (!favoritesData[email]) {
      return res
        .status(404)
        .json({ success: false, message: "User has no favorites" });
    }

    // Filter out the movie by IMDb ID
    favoritesData[email] = favoritesData[email].filter(
      (fav) => fav.imdbID !== imdbID
    );

    fs.writeFile(
      favoritesFilePath,
      JSON.stringify(favoritesData, null, 2),
      (err) => {
        if (err) {
          console.error("Error writing to favorites file:", err);
          return res
            .status(500)
            .json({ success: false, message: "Server error" });
        }

        res.json({ success: true, message: "Movie removed from favorites" });
      }
    );
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
