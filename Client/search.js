const apiKey = "50ad6c97";
let currentPage = 1;
let allMovies = [];
let moviesPerPage = parseInt(localStorage.getItem("moviesPerPage")) || 5;

// Update movies per page when the user selects a new value
document
  .getElementById("moviesPerPageSelect")
  .addEventListener("change", function () {
    moviesPerPage = parseInt(this.value);
    localStorage.setItem("moviesPerPage", moviesPerPage);
    currentPage = 1; // Reset to the first page
    displayMovies();
  });

const currentUser = JSON.parse(localStorage.getItem("currentUser"));
if (!currentUser || !currentUser.email) {
  alert("You must be logged in to access this page.");
  window.location.href = "./mainPage.html"; // Redirect to login if no user is logged in
}
// Retrieve and apply the saved movies per page setting
window.addEventListener("DOMContentLoaded", () => {
  const savedMoviesPerPage = localStorage.getItem("moviesPerPage");
  if (savedMoviesPerPage) {
    moviesPerPage = parseInt(savedMoviesPerPage);
    document.getElementById("moviesPerPageSelect").value = moviesPerPage;
  }

  const savedSearch = localStorage.getItem("searchInput");
  if (savedSearch) {
    const searchInput = document.getElementById("movieSearch");
    searchInput.value = savedSearch;
    fetchMovies(savedSearch);
  }
});

document.getElementById("movieSearch").addEventListener("input", function () {
  const query = this.value.trim();
  localStorage.setItem("searchInput", query);

  if (query.length > 2) {
    fetchMovies(query);
  } else {
    document.getElementById("movieList").innerHTML = "";
    document.getElementById("pagination").innerHTML = "";
  }
});

function goToFavorites() {
  // Redirect to the favorites page
  window.location.href = "./favorites.html";
}

async function fetchMovies(query) {
  // Clear search-related data
  localStorage.removeItem("searchInput");
  localStorage.removeItem("moviesPerPage");
  try {
    allMovies = []; // Reset the movies array
    currentPage = 1; // Reset to the first page

    let page = 1;
    let hasMoreResults = true;

    while (hasMoreResults && allMovies.length < 50) {
      const response = await axios.get(
        `https://www.omdbapi.com/?apikey=${apiKey}&s=${query}&page=${page}`
      );

      if (response.data.Search) {
        allMovies = allMovies.concat(response.data.Search); // Add the results to the movies array
        page++;

        // Stop if there are fewer than 10 results on this page or we already have 50 movies
        hasMoreResults =
          response.data.Search.length === 10 && allMovies.length < 50;
      } else {
        hasMoreResults = false; // Stop if no more results
      }
    }

    // Limit the results to the top 50 movies
    allMovies = allMovies.slice(0, 50);

    if (allMovies.length > 0) {
      displayMovies();
    } else {
      document.getElementById("movieList").innerHTML =
        '<p class="text-center">No movies found.</p>';
      document.getElementById("pagination").innerHTML = "";
    }
  } catch (error) {
    console.error("Error fetching movies:", error);
    document.getElementById("movieList").innerHTML =
      '<p class="text-center text-danger">An error occurred while fetching movies.</p>';
    document.getElementById("pagination").innerHTML = "";
  }
}

function displayMovies() {
  const movieList = document.getElementById("movieList");
  const pagination = document.getElementById("pagination");

  const totalPages = Math.ceil(allMovies.length / moviesPerPage);
  const startIndex = (currentPage - 1) * moviesPerPage;
  const endIndex = Math.min(startIndex + moviesPerPage, allMovies.length);

  // Clear existing content
  movieList.innerHTML = "";
  pagination.innerHTML = "";

  // Display movies for the current page
  allMovies.slice(startIndex, endIndex).forEach((movie) => {
    const col = document.createElement("div");
    col.className = "col-md-4";

    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card-img-top";
    img.src =
      movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/150";
    img.alt = movie.Title;

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const title = document.createElement("h5");
    title.className = "card-title";
    title.textContent = movie.Title;

    const releaseDate = document.createElement("p");
    releaseDate.className = "card-text";
    releaseDate.textContent = `Release Year: ${movie.Year}`;

    const detailsButton = document.createElement("a");
    detailsButton.className = "btn btn-primary";
    detailsButton.href = `info.html?movieId=${movie.imdbID}`;
    detailsButton.textContent = "View Details";

    cardBody.appendChild(title);
    cardBody.appendChild(releaseDate);
    cardBody.appendChild(detailsButton);

    card.appendChild(img);
    card.appendChild(cardBody);
    col.appendChild(card);
    movieList.appendChild(col);
  });

  // Generate pagination buttons
  for (let i = 1; i <= totalPages; i++) {
    const pageItem = document.createElement("li");
    pageItem.className = `page-item ${i === currentPage ? "active" : ""}`;

    const pageLink = document.createElement("a");
    pageLink.className = "page-link";
    pageLink.textContent = i;
    pageLink.addEventListener("click", () => {
      currentPage = i;
      displayMovies();
    });

    pageItem.appendChild(pageLink);
    pagination.appendChild(pageItem);
  }
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
