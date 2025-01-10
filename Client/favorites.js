// Get the current user from localStorage
const currentUser = JSON.parse(localStorage.getItem("currentUser"));

// Fetch favorites for the current user
document.addEventListener("DOMContentLoaded", () => {
  fetchFavorites();
});

// Function to fetch favorites from the server
function fetchFavorites(sortBy = "title") {
  fetch(`/favorites?email=${encodeURIComponent(currentUser.email)}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        renderFavorites(data.favorites, sortBy);
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.error("Error fetching favorites:", error);
      alert("An error occurred while loading favorites.");
    });
}

// Function to render favorites dynamically
function renderFavorites(favorites, sortBy) {
  const favoritesList = document.getElementById("favoritesList");
  favoritesList.innerHTML = ""; // Clear the container

  // Sort the favorites based on the selected criterion
  favorites.sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "release") {
      return new Date(b.releaseDate) - new Date(a.releaseDate);
    } else if (sortBy === "rating") {
      return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
    }
  });

  // Check if there are no favorites
  if (favorites.length === 0) {
    favoritesList.innerHTML = `<p class="text-center text-muted">No favorites added yet.</p>`;
    return;
  }

  // Dynamically create movie cards
  favorites.forEach((movie) => {
    const col = document.createElement("div");
    col.className = "col-md-4 movie-card";

    const card = document.createElement("div");
    card.className = "card shadow-sm";

    const img = document.createElement("img");
    img.className = "card-img-top";
    img.src =
      movie.poster !== "N/A" ? movie.poster : "https://via.placeholder.com/150";
    img.alt = movie.title;

    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const title = document.createElement("h5");
    title.className = "card-title";
    title.textContent = movie.title;

    const releaseDate = document.createElement("p");
    releaseDate.className = "card-text";
    releaseDate.textContent = `Release Date: ${movie.releaseDate || "N/A"}`;

    const rating = document.createElement("p");
    rating.className = "card-text";
    rating.textContent = `Rating: ${movie.rating || "N/A"}`;

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger w-100";
    deleteButton.textContent = "Remove from Favorites";
    deleteButton.addEventListener("click", () => confirmDelete(movie.imdbID));

    cardBody.appendChild(title);
    cardBody.appendChild(releaseDate);
    cardBody.appendChild(rating);
    cardBody.appendChild(deleteButton);

    card.appendChild(img);
    card.appendChild(cardBody);
    col.appendChild(card);
    favoritesList.appendChild(col);
  });
}

// Function to confirm deletion of a favorite movie
function confirmDelete(imdbID) {
  Swal.fire({
    title: "Are you sure?",
    text: "Do you want to remove this movie from your favorites?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      deleteFavorite(imdbID);
    }
  });
}

// Function to delete a favorite movie from the backend
function deleteFavorite(imdbID) {
  fetch("/favorites", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: currentUser.email, imdbID }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        fetchFavorites(); // Refresh the list after successful deletion
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.error("Error removing favorite:", error);
      alert("An error occurred. Please try again.");
    });
}

// Event listener for the sort dropdown
document.getElementById("sortOptions").addEventListener("change", (event) => {
  fetchFavorites(event.target.value); // Refetch and redisplay favorites with sorting
});
