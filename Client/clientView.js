let currentUser = null;

document.addEventListener("DOMContentLoaded", () => {
  currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser?.email) {
    alert("You must be logged in to view this page");
    window.location.href = "./mainPage.html";
  }
  fetchUserLinks();
});

async function fetchUserLinks() {
  try {
    const { data } = await axios.get(`/users/${currentUser.email}/links`);
    const container = document.getElementById("linksContainer");
    container.innerHTML = "";

    if (data.links.length === 0) {
      container.innerHTML = `
                <div class="alert alert-info">
                    You haven't shared any links yet. Add some from movie pages!
                </div>
            `;
      return;
    }

    data.links.forEach((link) => {
      const linkCard = document.createElement("div");
      linkCard.className = "link-card";
      linkCard.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h5>${link.name}</h5>
                        <div class="text-muted small">
                            Added to: ${link.movieTitle} (${new Date(
        link.addedAt
      ).toLocaleDateString()})
                        </div>
                        <a href="${
                          link.link
                        }" target="_blank" class="text-info">Visit Link</a>
                    </div>
                    <div>
                        <span class="badge ${
                          link.isPublic ? "bg-success" : "bg-warning"
                        }">
                            ${link.isPublic ? "Public" : "Private"}
                        </span>
                        <button onclick="togglePrivacy('${
                          link._id
                        }', ${!link.isPublic})" 
                                class="btn btn-sm btn-secondary btn-action">
                            ${link.isPublic ? "Make Private" : "Make Public"}
                        </button>
                        <button onclick="deleteLink('${link._id}')" 
                                class="btn btn-sm btn-danger btn-action">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="mt-2">
                    ${
                      link.reviews?.length
                        ? `
                        <div class="text-muted small">
                            Average Rating: ${calculateAverageRating(
                              link.reviews
                            )}
                            (${link.reviews.length} reviews)
                        </div>
                    `
                        : ""
                    }
                </div>
            `;
      container.appendChild(linkCard);
    });
  } catch (error) {
    Swal.fire("Error", "Failed to load links", "error");
  }
}

function calculateAverageRating(reviews) {
  if (!reviews?.length) return "N/A";
  const avg = reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
  return `⭐${avg.toFixed(1)}`;
}

async function togglePrivacy(linkId, isPublic) {
  try {
    await axios.patch(`/movies/links/${linkId}`, {
      userEmail: currentUser.email,
      isPublic,
    });
    await fetchUserLinks();
    Swal.fire(
      "Success!",
      `Link is now ${isPublic ? "public" : "private"}`,
      "success"
    );
  } catch (error) {
    Swal.fire("Error", "Failed to update link privacy", "error");
  }
}

async function deleteLink(linkId) {
  try {
    await Swal.fire({
      title: "Delete Link?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Delete",
    });

    await axios.delete(`/movies/links/${linkId}`, {
      data: { userEmail: currentUser.email },
    });
    await fetchUserLinks();
    Swal.fire("Deleted!", "Link has been removed", "success");
  } catch (error) {
    Swal.fire("Error", "Failed to delete link", "error");
  }
}

function logoutUser() {
  localStorage.removeItem("currentUser");
  window.location.href = "./mainPage.html";
}
