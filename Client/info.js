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
    Swal.fire(
      "Error",
      error.message || "Failed to load movie details",
      "error"
    );
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

    const publicLinks =
      data.links
        ?.map((link) => ({
          _id: link._id,
          name: link.name || "Unnamed Link",
          link: link.link || "#",
          addedBy: link.addedBy || "Anonymous",
          isPublic: link.isPublic,
          reviews: link.reviews || [],
        }))
        .reverse() || [];

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
          <a href="${link.link}" target="_blank" class="text-info">${
        link.name
      }</a>
          <small class="text-muted ms-2">(Added by ${link.addedBy})</small>
          <span class="badge bg-primary ms-2">⭐ ${calculateAverageRating(
            link.reviews
          )}</span>
        </div>
        <div>
          <span class="badge ${link.isPublic ? "bg-success" : "bg-warning"}">
            ${link.isPublic ? "Public" : "Private"}
          </span>
          <button class="btn btn-sm btn-info ms-2" onclick="showReviewModal('${
            link._id
          }')">
            ${
              link.reviews?.some((r) => r.userEmail === currentUser.email)
                ? "Update Review"
                : "Review"
            }
          </button>
          ${
            link.addedBy === currentUser.email
              ? `
            <button class="btn btn-sm btn-danger me-2" onclick="deleteLink('${link._id}')">
              Delete
            </button>
          `
              : ""
          }
        </div>
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
    Swal.fire("Error", "Failed to load links", "error");
  }
}

// Calculate average rating
function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return "0.0";
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
}

// Show review modal
async function showReviewModal(linkId) {
  try {
    const { data } = await axios.get(
      `/movies/${movieId}/links/${linkId}/reviews`
    );
    const userReview = data.reviews.find(
      (r) => r.userEmail === currentUser.email
    );

    Swal.fire({
      title: userReview ? "Update Review" : "Add Review",
      html: `
        <div class="mb-3">
          <label class="form-label">Rating</label>
          <select id="reviewRating" class="form-select">
            ${[5, 4, 3, 2, 1]
              .map(
                (n) =>
                  `<option value="${n}" ${
                    userReview?.rating === n ? "selected" : ""
                  }>${"⭐".repeat(n)}</option>`
              )
              .join("")}
          </select>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: !!userReview, // Show "Delete" button if the user already left a review
      denyButtonText: "Delete Review",
      confirmButtonText: userReview ? "Update Review" : "Submit Review",
      preConfirm: async () => {
        const rating = Number(document.getElementById("reviewRating").value);
        if (!rating || rating < 1 || rating > 5) {
          throw new Error("Please select a valid rating");
        }
        await axios.post("/movies/links/review", {
          movieId,
          linkId,
          userEmail: currentUser.email,
          rating,
        });

        return true;
      },
    }).then(async (result) => {
      if (result.isDenied) {
        await axios.delete(`/movies/links/review`, {
          data: { movieId, linkId, userEmail: currentUser.email },
        });

        Swal.fire("Deleted!", "Your review has been deleted", "success");

        setTimeout(() => fetchMovieLinks(movieId), 500);
      } else if (result.isConfirmed) {
        Swal.fire("Success!", "Review updated successfully", "success");
      }

      fetchMovieLinks(movieId);
    });
  } catch (error) {
    Swal.fire("Error", error.message || "Failed to submit review", "error");
  }
}

// Add page change handler
window.changeLinksPage = (newPage) => {
  currentLinksPage = newPage;
  fetchMovieLinks(movieId);
};

// Update addFavorite function to reset to first page
async function addFavoriteWithLink(movie) {
  const modal = new bootstrap.Modal(document.getElementById("linksModal"));

  // First add to favorites
  try {
    await axios.post("/favorites", {
      email: currentUser.email,
      movie: {
        imdbID: movie.imdbID,
        title: movie.Title,
        releaseDate: movie.Released,
        poster: movie.Poster,
        rating: movie.imdbRating,
      },
    });
  } catch (error) {
    Swal.fire("Error!", "Failed to add to favorites", "error");
    return;
  }

  // Then show link modal
  modal.show();

  document.getElementById("submitLinks").onclick = async () => {
    try {
      const linkName = document.getElementById("linkName").value.trim();
      const linkUrl = document.getElementById("linkUrl").value.trim();
      const isPublic = document.getElementById("linkVisibility").checked;

      if (!linkName || !linkUrl) {
        throw new Error("Please fill in both link name and URL");
      }

      // Add the link
      await axios.post("/movies/links", {
        movieId: movie.imdbID,
        link: linkUrl,
        name: linkName,
        isPublic,
        addedBy: currentUser.email,
      });

      // Refresh displays
      currentLinksPage = 1;
      await fetchMovieLinks(movie.imdbID);
      updateFavoriteButton(movie);

      Swal.fire("Success!", "Added to favorites and link created", "success");
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

  // First check favorite status
  axios
    .get(`/favorites?email=${encodeURIComponent(currentUser.email)}`)
    .then(({ data }) => {
      const isFavorite = data.favorites?.some((f) => f.imdbID === movie.imdbID);

      // Update button text
      favoriteButton.textContent = isFavorite
        ? "Remove from Favorites"
        : "Add to Favorites + Link";

      // Set click handler
      favoriteButton.onclick = () => {
        if (isFavorite) {
          removeFavorite(movie);
        } else {
          addFavoriteWithLink(movie);
        }
      };
    })
    .catch((error) => console.error("Error checking favorites:", error));
}

// Remove from favorites
async function removeFavorite(movie) {
  try {
    await axios.delete("/favorites", {
      data: { email: currentUser.email, imdbID: movie.imdbID },
    });

    Swal.fire("Removed!", "Removed from favorites", "success");
    updateFavoriteButton(movie);
  } catch (error) {
    Swal.fire(
      "Error!",
      error.response?.data?.message || error.message,
      "error"
    );
  }
}

// Add this delete link function
async function deleteLink(linkId) {
  try {
    const { isConfirmed } = await Swal.fire({
      title: "Delete Link?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });

    if (isConfirmed) {
      await axios.delete(`/movies/links/${linkId}`, {
        data: { userEmail: currentUser.email },
      });
      await fetchMovieLinks(movieId);
      Swal.fire("Deleted!", "Link has been deleted.", "success");
    }
  } catch (error) {
    Swal.fire(
      "Error",
      error.response?.data?.message || "Delete failed",
      "error"
    );
  }
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
