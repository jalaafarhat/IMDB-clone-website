const apiKey = "50ad6c97";
const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get("movieId");

// Redirect if movieId is invalid
if (!movieId) {
  alert("Invalid movie ID. Returning to search.");
  window.location.href = "./search.html";
}

// Retrieve the current user
const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser?.email) {
  alert("You must be logged in to access this page.");
  window.location.href = "./mainPage.html";
}

// Back button functionality
document.getElementById("backButton").addEventListener("click", () => {
  window.location.href = "./search.html";
});

// Fetch and display movie details
async function fetchMovieDetails() {
  try {
    // First ensure movie exists in our database
    const omdbResponse = await axios.get(
      `https://www.omdbapi.com/?apikey=${apiKey}&i=${movieId}`
    );

    if (omdbResponse.data.Response === "False")
      throw new Error(omdbResponse.data.Error || "Movie not found");

    const movieData = omdbResponse.data;

    // Save movie to our database if not exists
    await axios.post("/movies", {
      imdbID: movieData.imdbID,
      title: movieData.Title,
      releaseDate: movieData.Released,
      poster: movieData.Poster,
      rating: movieData.imdbRating,
      genre: movieData.Genre,
      director: movieData.Director,
      actors: movieData.Actors.split(", "),
      plot: movieData.Plot,
    });

    // Now populate UI
    document.getElementById("moviePoster").src =
      movieData.Poster !== "N/A"
        ? movieData.Poster
        : "https://via.placeholder.com/500";
    document.getElementById("movieTitle").textContent = movieData.Title;
    document.getElementById("movieRelease").textContent = movieData.Released;
    document.getElementById("movieGenre").textContent = movieData.Genre;
    document.getElementById("movieDirector").textContent = movieData.Director;
    document.getElementById("movieActors").textContent = movieData.Actors;
    document.getElementById("moviePlot").textContent = movieData.Plot;
    document.getElementById("movieRating").textContent = movieData.imdbRating;
    document.getElementById(
      "imdbLink"
    ).href = `https://www.imdb.com/title/${movieData.imdbID}/`;

    await fetchMovieLinks(movieData.imdbID);
    await fetchTrailer(movieData.Title);
    updateFavoriteButton(movieData);
  } catch (error) {
    console.error("Error loading movie:", error);
    swal.fire(error.message || "Failed to load movie details");
  }
}

// Fetch movie links from our database
let currentLinksPage = 1;
const linksPerPage = 5;

async function fetchMovieLinks(movieId) {
  try {
    const { data } = await axios.get(`/movies/${movieId}/public-links`);
    const linksList = document.getElementById("linksList");
    const pagination = document.getElementById("linksPagination");

    linksList.innerHTML = "";
    pagination.innerHTML = "";
    // Add null check and default values
    const publicLinks =
      data.links?.map((link) => ({
        name: link.name || "Unnamed Link",
        link: link.link || "#",
        addedBy: link.addedBy || "Anonymous",
        isPublic: link.isPublic,
      })) || [];

    const totalPages = Math.ceil(publicLinks.length / linksPerPage);
    const startIndex = (currentLinksPage - 1) * linksPerPage;
    const endIndex = startIndex + linksPerPage;
    const paginatedLinks = publicLinks.slice(startIndex, endIndex);

    // Display links
    paginatedLinks.forEach((link, index) => {
      const globalIndex = startIndex + index + 1;
      const listItem = document.createElement("li");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center";
      listItem.innerHTML = `
        <div>
          <span class="me-3">${globalIndex}.</span>
          <a href="${link.link}" target="_blank" class="text-info">${link.name}</a>
          <small class="text-muted ms-2">(Added by ${link.addedBy})</small>
        </div>
        <span class="badge bg-success">Public</span>
      `;
      linksList.appendChild(listItem);
    });

    // Create pagination buttons
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement("li");
        pageItem.className = `page-item ${
          i === currentLinksPage ? "active" : ""
        }`;
        pageItem.innerHTML = `
          <button class="page-link" onclick="changeLinksPage(${i})">${i}</button>
        `;
        pagination.appendChild(pageItem);
      }
      document.getElementById("linksSection").style.display = "block";
    } else if (publicLinks.length > 0) {
      document.getElementById("linksSection").style.display = "block";
    } else {
      document.getElementById("linksSection").style.display = "none";
    }
  } catch (error) {
    console.error("Error fetching links:", error);
  }
}

// Add page change handler
window.changeLinksPage = (newPage) => {
  currentLinksPage = newPage;
  fetchMovieLinks(urlParams.get("movieId"));
};

// Update addFavorite function to reset to first page
async function addFavorite(movie) {
  const modal = new bootstrap.Modal(document.getElementById("linksModal"));
  modal.show();

  document.getElementById("submitLinks").onclick = async () => {
    try {
      const linkName = document.getElementById("linkName").value.trim();
      const linkUrl = document.getElementById("linkUrl").value.trim();
      const isPublic = document.getElementById("linkVisibility").checked;

      if (!linkName || !linkUrl) {
        throw new Error("Please fill in both link name and URL");
      }

      // Save to database
      await axios.post("/movies/links", {
        movieId: movie.imdbID,
        link: linkUrl,
        name: linkName,
        isPublic,
        addedBy: currentUser.email,
      });

      currentLinksPage = 1;
      await fetchMovieLinks(movie.imdbID);

      Swal.fire("Success!", "Link added successfully", "success");
      modal.hide();
    } catch (error) {
      Swal.fire("Error!", error.message, "error");
    }
  };
}
// Fetch YouTube trailer
async function fetchTrailer(title) {
  try {
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(
        title + " trailer"
      )}&key=AIzaSyB2pXKXyZgY9M-wxBg_kAOHEfLgvOS-E4Y`
    );

    if (response.data.items?.length) {
      const videoId = response.data.items[0].id.videoId;
      document.getElementById(
        "trailerFrame"
      ).src = `https://www.youtube.com/embed/${videoId}`;
      document.getElementById("trailerSection").style.display = "block";
    }
  } catch (error) {
    console.error("Error loading trailer:", error);
  }
}

// Update favorite button state
function updateFavoriteButton(movie) {
  const favoriteButton = document.getElementById("favoriteButton");
  axios
    .get(`/favorites?email=${encodeURIComponent(currentUser.email)}`)
    .then(({ data }) => {
      const isFavorite = data.favorites?.some((f) => f.imdbID === movie.imdbID);
      favoriteButton.textContent = isFavorite
        ? "Remove from Favorites"
        : "Add to Favorites";
      favoriteButton.onclick = () =>
        isFavorite ? removeFavorite(movie) : addFavorite(movie);
    })
    .catch((error) => console.error("Error checking favorites:", error));
}

// Remove from favorites
function removeFavorite(movie) {
  axios
    .delete("/favorites", {
      data: { email: currentUser.email, imdbID: movie.imdbID },
    })
    .then(() => {
      Swal.fire("Removed!", "Removed from favorites", "success");
      updateFavoriteButton(movie);
    })
    .catch((error) => {
      Swal.fire(
        "Error!",
        error.response?.data?.message || error.message,
        "error"
      );
    });
}

// Logout
function logoutUser() {
  localStorage.removeItem("currentUser");
  fetch("/logout", { method: "POST" })
    .then(() => (window.location.href = "./mainPage.html"))
    .catch(console.error);
}

// Initialize
fetchMovieDetails();
