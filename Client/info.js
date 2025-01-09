const apiKey = "50ad6c97";
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get("movieId");
let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "search.html";
});

async function fetchMovieDetails() {
  try {
    const response = await axios.get(
      `https://www.omdbapi.com/?apikey=${apiKey}&i=${movieId}`
    );
    const movie = response.data;

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
  }
}

function updateFavoriteButton(movie) {
  const favoriteButton = document.getElementById("favoriteButton");
  const isFavorite = favorites.some((fav) => fav.imdbID === movie.imdbID);

  favoriteButton.textContent = isFavorite
    ? "Remove from Favorites"
    : "Add to Favorites";

  favoriteButton.addEventListener("click", () => {
    if (isFavorite) {
      Swal.fire({
        title: "This movie is already in your favorites!",
        text: "Do you want to remove it?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          favorites = favorites.filter((fav) => fav.imdbID !== movie.imdbID);
          localStorage.setItem("favorites", JSON.stringify(favorites));
          Swal.fire(
            "Deleted!",
            "The movie has been removed from your favorites.",
            "success"
          );
          updateFavoriteButton(movie);
        }
      });
    } else {
      favorites.push({
        imdbID: movie.imdbID,
        title: movie.Title,
        releaseDate: movie.Released,
        poster: movie.Poster,
        rating: movie.imdbRating, // Add the rating field
      });
      localStorage.setItem("favorites", JSON.stringify(favorites));
      Swal.fire(
        "Added!",
        "The movie has been added to your favorites.",
        "success"
      );
      updateFavoriteButton(movie);
    }
  });
}

fetchMovieDetails();
