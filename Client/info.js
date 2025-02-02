const apiKey = "50ad6c97";
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get("movieId");

// Retrieve the current user
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || !currentUser.email) {
  alert("You must be logged in to access this page.");
  window.location.href = "./mainPage.html"; // Redirect to login if no user is logged in
}

document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "./search.html";
});

async function fetchMovieDetails() {
  try {
    const response = await axios.get(
      `https://www.omdbapi.com/?apikey=${apiKey}&i=${movieId}`
    );
    const movie = response.data;

    // Populate movie details
    document.getElementById("moviePoster").src =
      movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/500";
    document.getElementById("movieTitle").textContent = movie.Title;
    document.getElementById("movieRelease").textContent = movie.Released;
    document.getElementById("movieGenre").textContent = movie.Genre;
    document.getElementById("movieDirector").textContent = movie.Director;
    document.getElementById("movieActors").textContent = movie.Actors;
    document.getElementById("moviePlot").textContent = movie.Plot;
    document.getElementById("movieRating").textContent = movie.imdbRating;
    document.getElementById(
      "imdbLink"
    ).href = `https://www.imdb.com/title/${movie.imdbID}/`;

    fetchTrailer(movie.Title);
    updateFavoriteButton(movie);
  } catch (error) {
    console.error("Error fetching movie details:", error);
    alert("Failed to load movie details. Please try again later.");
  }
}

async function fetchTrailer(title) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(
        title + " trailer"
      )}&key=AIzaSyB2pXKXyZgY9M-wxBg_kAOHEfLgvOS-E4Y`
    );
    const videoId = response.data.items[0].id.videoId;
    const trailerFrame = document.getElementById("trailerFrame");
    trailerFrame.src = `https://www.youtube.com/embed/${videoId}`;
    document.getElementById("trailerSection").style.display = "block";
  } catch (error) {
    console.error("Error fetching trailer:", error);
    document.getElementById("trailerSection").style.display = "none";
  }
}

function updateFavoriteButton(movie) {
  const favoriteButton = document.getElementById("favoriteButton");

  // Check if the movie is already in the user's favorites
  axios
    .get(`/favorites?email=${encodeURIComponent(currentUser.email)}`)
    .then((response) => {
      const favorites = response.data.favorites || [];
      const isFavorite = favorites.some((fav) => fav.imdbID === movie.imdbID);

      // Update button text based on favorite status
      favoriteButton.textContent = isFavorite
        ? "Remove from Favorites"
        : "Add to Favorites";

      // Add event listener to handle add/remove
      favoriteButton.onclick = () => {
        if (isFavorite) {
          // Remove from favorites
          axios
            .delete("/favorites", {
              data: { email: currentUser.email, imdbID: movie.imdbID },
            })
            .then(() => {
              Swal.fire(
                "Removed!",
                "The movie has been removed from your favorites.",
                "success"
              );
              updateFavoriteButton(movie); // Refresh button state
            })
            .catch((error) => {
              console.error("Error removing favorite:", error);
              alert("Failed to remove movie from favorites. Try again.");
            });
        } else {
          // Add to favorites
          axios
            .post("/favorites", {
              email: currentUser.email,
              movie: {
                imdbID: movie.imdbID,
                title: movie.Title,
                releaseDate: movie.Released,
                poster: movie.Poster,
                rating: movie.imdbRating,
              },
            })
            .then(() => {
              Swal.fire(
                "Added!",
                "The movie has been added to your favorites.",
                "success"
              );
              updateFavoriteButton(movie); // Refresh button state
            })
            .catch((error) => {
              console.error("Error adding favorite:", error);
              alert("Failed to add movie to favorites. Try again.");
            });
        }
      };
    })
    .catch((error) => {
      console.error("Error fetching favorites:", error);
      alert("Failed to check favorite status. Try again later.");
    });
}
function logoutUser() {
  // Clear the current user's data from localStorage
  localStorage.removeItem("currentUser");

  // Clear search-related data
  localStorage.removeItem("searchInput");
  localStorage.removeItem("moviesPerPage");

  // Redirect to the main page    fetch("/logout", { method: "POST" })
  fetch("/logout", { method: "POST" })
    .then(() => {
      window.location.href = "./mainPage.html"; // Redirect to home page after logout
    })
    .catch((error) => console.error("Logout failed:", error));
}

// Fetch movie details on page load
fetchMovieDetails();
