const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const dotenv = require("dotenv");

dotenv.config();

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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Define Mongoose Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

const favoriteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  movies: [
    {
      imdbID: String,
      title: String,
      releaseDate: String,
      poster: String,
      rating: String,
    },
  ],
});

const User = mongoose.model("User", userSchema);
const FavoriteMovies = mongoose.model("FavoriteMovies", favoriteSchema);

// Helper functions
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
const isValidPassword = (password) => password.length >= 6;

// Default route
app.get("/", (req, res) => {
  res.redirect("/mainPage.html");
});

// Register route
app.post("/register", async (req, res) => {
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

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.json({ success: true, message: "Registration successful!" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    req.session.user = { name: user.name, email: user.email };
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Logout route
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/homePage.html");
  });
});

// Get user favorites
app.get("/favorites", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }
    const userFavorites = await FavoriteMovies.findOne({ email });
    res.json({ success: true, favorites: userFavorites?.movies || [] });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add to favorites
app.post("/favorites", async (req, res) => {
  try {
    const { email, movie } = req.body;
    if (!email || !movie) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request" });
    }

    await FavoriteMovies.findOneAndUpdate(
      { email },
      { $push: { movies: movie } },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Movie added to favorites" });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Remove from favorites
app.delete("/favorites", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { imdbID } = req.body;
  const email = req.session.user.email;

  try {
    const userFavorites = await FavoriteMovies.findOne({ email });

    if (!userFavorites) {
      return res
        .status(404)
        .json({ success: false, message: "No favorites found" });
    }

    userFavorites.movies = userFavorites.movies.filter(
      (fav) => fav.imdbID !== imdbID
    );
    await userFavorites.save();

    res.json({ success: true, message: "Movie removed from favorites" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Check session
app.get("/check-session", (req, res) => {
  if (req.session.user) {
    res.json({ success: true, user: req.session.user });
  } else {
    res.json({ success: false });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
