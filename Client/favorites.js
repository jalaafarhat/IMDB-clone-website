let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

// Function to display the favorites list
function displayFavorites(sortBy = "title") {
  const favoritesList = document.getElementById("favoritesList");
  favoritesList.innerHTML = ""; // Clear the container

  // Sort the favorites based on the selected criterion
  favorites.sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    } else if (sortBy === "release") {
      return new Date(a.releaseDate) - new Date(b.releaseDate);
    } else if (sortBy === "rating") {
      return parseFloat(b.rating) - parseFloat(a.rating);
    }
  });

  // Dynamically create movie cards
  favorites.forEach((movie, index) => {
    const col = document.createElement("div");
    col.className = "col-md-4 movie-card";

    const card = document.createElement("div");
    card.className = "card";

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
    releaseDate.textContent = `Release Date: ${movie.releaseDate}`;

    const rating = document.createElement("p");
    rating.className = "card-text";
    rating.textContent = `Rating: ${movie.rating || "N/A"}`; // Handle missing ratings

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-danger";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => confirmDelete(index));

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

// Function to confirm deletion using SweetAlert
function confirmDelete(index) {
  Swal.fire({
    title: "Are you sure?",
    text: "Do you want to remove this movie from your favorites?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "Cancel",
  }).then((result) => {
    if (result.isConfirmed) {
      favorites.splice(index, 1); // Remove the movie from the array
      localStorage.setItem("favorites", JSON.stringify(favorites)); // Update localStorage
      displayFavorites(); // Refresh the list
      Swal.fire(
        "Deleted!",
        "The movie has been removed from your favorites.",
        "success"
      );
    }
  });
}

// Event listener for the sort dropdown
document.getElementById("sortOptions").addEventListener("change", (event) => {
  displayFavorites(event.target.value); // Redisplay favorites with the selected sorting
});

// Initial display of favorites
displayFavorites();
