const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.static(path.join(__dirname, "Client"))); // Serve static files from the "Client" folder
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
//userschema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  links: [
    {
      movieId: String,
      link: String,
      name: String,
      isPublic: Boolean,
      addedAt: { type: Date, default: Date.now },
    },
  ],
});
//favorites schema
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
//movies schema
const movieSchema = new mongoose.Schema({
  imdbID: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  releaseDate: String,
  poster: String,
  rating: String,
  genre: String,
  director: String,
  actors: [String],
  plot: String,
  links: [
    {
      link: { type: String, required: true },
      name: { type: String, required: true },
      isPublic: { type: Boolean, default: false },
      addedBy: { type: String, required: true },
      addedAt: { type: Date, default: Date.now },
      reviews: [
        {
          userEmail: { type: String, required: true },
          rating: { type: Number, min: 1, max: 5, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
  ],
});

const User = mongoose.model("User", userSchema);
const FavoriteMovies = mongoose.model("FavoriteMovies", favoriteSchema);
const Movie = mongoose.model("Movie", movieSchema);

// Helper functions
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
const isValidPassword = (password) => password.length >= 6;

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "Client", "mainPage.html")); // Serve the main page
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

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Admin login
    if (email === "admin@gmail.com" && isPasswordValid) {
      req.session.user = user;
      return res.json({
        success: true,
        redirect: "/admin.html",
      });
    }

    // Regular user
    req.session.user = { name: user.name, email: user.email };
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (error) {
    console.error("Login error:", error);
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

// Get all movies
app.get("/movies", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json({ success: true, movies });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add new movie
// Add or update movie
app.post("/movies", async (req, res) => {
  try {
    const { imdbID } = req.body;

    // Check if the movie already exists
    const existingMovie = await Movie.findOne({ imdbID });

    if (existingMovie) {
      // If the movie exists, update it with the new data
      await Movie.updateOne({ imdbID }, { $set: req.body });
      return res.json({
        success: true,
        message: "Movie updated successfully!",
      });
    } else {
      // If the movie doesn't exist, create a new one
      const movie = new Movie(req.body);
      await movie.save();
      return res.json({ success: true, message: "Movie added successfully!" });
    }
  } catch (error) {
    console.error("Error adding/updating movie:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Add link to a movie
app.post("/movies/links", async (req, res) => {
  try {
    const { movieId, link, name, isPublic, addedBy } = req.body;
    if (!movieId || !link || !name || !addedBy) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }
    // Update movie links
    const movie = await Movie.findOneAndUpdate(
      { imdbID: movieId },
      {
        $push: {
          links: {
            link: link,
            name: name,
            isPublic: isPublic,
            addedBy: addedBy,
          },
        },
      },
      { new: true, upsert: true }
    );

    // Update user's links
    await User.findOneAndUpdate(
      { email: addedBy },
      { $push: { links: { movieId, link, name, isPublic } } },
      { upsert: true }
    );

    res.json({ success: true, movie });
  } catch (error) {
    console.error("Error adding link:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get public links for a specific movie
app.get("/movies/:movieId/public-links", async (req, res) => {
  try {
    const movie = await Movie.findOne({ imdbID: req.params.movieId });
    if (!movie)
      return res
        .status(404)
        .json({ success: false, message: "Movie not found" });

    const publicLinks = movie.links.filter((link) => link.isPublic);
    res.json({ success: true, links: publicLinks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Fix Review Retrieval
app.get("/movies/:movieId/links/:linkId/reviews", async (req, res) => {
  try {
    const movie = await Movie.findOne({ imdbID: req.params.movieId });
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const link = movie.links.id(req.params.linkId);
    if (!link) return res.status(404).json({ message: "Link not found" });

    res.json({ success: true, reviews: link.reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
//adding review for user
app.post("/movies/links/review", async (req, res) => {
  try {
    const { movieId, linkId, userEmail, rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid rating" });
    }

    const movie = await Movie.findOne({ imdbID: movieId });
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const link = movie.links.id(linkId);
    if (!link) return res.status(404).json({ message: "Link not found" });

    const existingReview = link.reviews.find((r) => r.userEmail === userEmail);

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.createdAt = new Date();
    } else {
      link.reviews.push({ userEmail, rating });
    }

    await movie.save();
    res.json({
      success: true,
      message: existingReview ? "Review updated" : "Review added",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
//delete reviews for user
app.delete("/movies/links/review", async (req, res) => {
  try {
    const { movieId, linkId, userEmail } = req.body;

    const movie = await Movie.findOne({ imdbID: movieId });
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    const link = movie.links.id(linkId);
    if (!link) return res.status(404).json({ message: "Link not found" });

    link.reviews = link.reviews.filter((r) => r.userEmail !== userEmail);

    await movie.save();
    res.json({ success: true, message: "Review deleted" });
  } catch (error) {
    console.error("Error deleting review:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
//delete links for user
app.delete("/movies/links/:linkId", async (req, res) => {
  try {
    const movie = await Movie.findOne({ "links._id": req.params.linkId });
    if (!movie) return res.status(404).json({ message: "Link not found" });

    const link = movie.links.id(req.params.linkId);
    if (link.addedBy !== req.body.userEmail) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    movie.links.pull(req.params.linkId);
    await movie.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update existing link
app.put("/movies/links/:linkId", async (req, res) => {
  try {
    const movie = await Movie.findOne({ "links._id": req.params.linkId });
    if (!movie) return res.status(404).json({ message: "Link not found" });

    const link = movie.links.id(req.params.linkId);
    if (link.addedBy !== req.body.userEmail) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    link.set({
      name: req.body.name,
      link: req.body.link,
      isPublic: req.body.isPublic,
    });

    await movie.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete all links for a user/movie
app.delete("/movies/links/all", async (req, res) => {
  try {
    await Movie.updateMany(
      { imdbID: req.body.movieId },
      { $pull: { links: { addedBy: req.body.userEmail } } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Get user's links with movie data
app.get("/users/:email/links", async (req, res) => {
  try {
    const movies = await Movie.find({ "links.addedBy": req.params.email });
    const links = [];

    movies.forEach((movie) => {
      movie.links
        .filter((link) => link.addedBy === req.params.email)
        .forEach((link) => {
          const reviews = link.reviews || [];
          const avgRating =
            reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;

          links.push({
            movieId: movie.imdbID,
            movieTitle: movie.title,
            moviePoster: movie.poster,
            linkId: link._id,
            linkName: link.name,
            linkUrl: link.link,
            isPublic: link.isPublic,
            addedAt: link.addedAt,
            avgRating: avgRating,
            reviewCount: reviews.length,
          });
        });
    });

    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Admin routes
app.get("/admin/links", async (req, res) => {
  try {
    // Verify admin user
    if (!req.session.user || req.session.user.email !== "admin@gmail.com") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const movies = await Movie.find({ "links.isPublic": true })
      .populate("links")
      .exec();

    const links = [];
    movies.forEach((movie) => {
      movie.links
        .filter((link) => link.isPublic)
        .forEach((link) => {
          links.push({
            _id: link._id,
            name: link.name,
            movieTitle: movie.title,
            addedBy: link.addedBy,
            reviews: link.reviews,
            link: link.link,
          });
        });
    });

    // Sort by number of reviews descending
    links.sort((a, b) => b.reviews.length - a.reviews.length);

    res.json({ success: true, links });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//delete links for admin
app.delete("/admin/links/:linkId", async (req, res) => {
  try {
    // 1. Verify admin user
    if (!req.session.user || req.session.user.email !== "admin@gmail.com") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Admin privileges required",
      });
    }

    // 2. Find the movie containing the link
    const movie = await Movie.findOne({ "links._id": req.params.linkId });
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Link not found",
      });
    }

    // 3. Remove the link
    movie.links.pull(req.params.linkId); // Uses Mongoose pull method
    await movie.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Admin link deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during deletion",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
