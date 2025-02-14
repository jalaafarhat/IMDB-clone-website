let currentUser = null;
let allLinks = [];

document.addEventListener("DOMContentLoaded", () => {
  currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser?.email) {
    alert("You must be logged in to view this page");
    window.location.href = "mainPage.html";
  }
  fetchUserLinks();
});

async function fetchUserLinks() {
  try {
    const { data } = await axios.get(`/users/${currentUser.email}/links`);
    allLinks = data.links;
    sortLinks("rating"); // Default sort by rating
  } catch (error) {
    console.error("Error fetching links:", error);
    Swal.fire("Error", "Failed to load links", "error");
  }
}

function sortLinks(criteria) {
  const sortedLinks = [...allLinks].sort((a, b) => {
    switch (criteria) {
      case "rating":
        return b.avgRating - a.avgRating;
      case "date":
        return new Date(b.addedAt) - new Date(a.addedAt);
      case "name":
        return a.linkName.localeCompare(b.linkName);
      default:
        return 0;
    }
  });
  displayLinks(sortedLinks);
}

function displayLinks(links) {
  const container = document.getElementById("linksContainer");
  const noLinksMessage = document.getElementById("noLinksMessage");

  container.innerHTML = "";

  if (links.length === 0) {
    noLinksMessage.style.display = "block";
    return;
  }

  noLinksMessage.style.display = "none";

  links.forEach((link) => {
    const linkCard = document.createElement("div");
    linkCard.className = "link-card p-3";
    linkCard.innerHTML = `
            <div class="row align-items-center">
                <div class="col-md-2">
                    <img src="${link.moviePoster}" 
                         class="movie-poster" 
                         alt="${link.movieTitle} poster"
                         onerror="this.src='https://via.placeholder.com/100x150'">
                </div>
                <div class="col-md-6">
                    <h5>${link.linkName}</h5>
                    <div class="text-muted">
                        <div>Movie: ${link.movieTitle}</div>
                        <div>Added: ${new Date(
                          link.addedAt
                        ).toLocaleDateString()}</div>
                        <div>Visibility: ${
                          link.isPublic ? "Public" : "Private"
                        }</div>
                    </div>
                </div>
                <div class="col-md-2 text-center">
                    <span class="badge bg-primary rating-badge">
                        ⭐ ${link.avgRating.toFixed(1)}
                    </span>
                    <div class="small mt-1">${link.reviewCount} reviews</div>
                </div>
                <div class="col-md-2">
                    <a href="info.html?movieId=${link.movieId}" 
                       class="btn btn-outline-primary w-100">
                        View Movie
                    </a>
                </div>
            </div>
        `;
    container.appendChild(linkCard);
  });
}

function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "mainPage.html";
}
