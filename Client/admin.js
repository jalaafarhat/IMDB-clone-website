document.addEventListener("DOMContentLoaded", () => {
  // Add SweetAlert CSS (if not already in HTML)
  const swalCSS = document.createElement("link");
  swalCSS.rel = "stylesheet";
  swalCSS.href =
    "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css";
  document.head.appendChild(swalCSS);

  // Check admin credentials
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.email !== "admin@gmail.com") {
    Swal.fire({
      icon: "error",
      title: "Access Denied",
      text: "Redirecting to main page...",
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      window.location.href = "./mainPage.html";
    });
    return;
  }

  loadAdminLinks();
});

async function loadAdminLinks() {
  try {
    const { data } = await axios.get("/admin/links");
    displayLinks(data.links);
  } catch (error) {
    console.error("Error loading links:", error);
    Swal.fire({
      icon: "error",
      title: "Load Failed",
      text: "Failed to load links. Please try again later.",
      timer: 3000,
    });
  }
}
//display the links
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
    linkCard.className = "col-md-6 mb-3";
    linkCard.setAttribute("data-link-id", link._id);
    linkCard.innerHTML = `
        <div class="link-card">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5>${link.name}</h5>
              <p class="mb-1">Movie: ${link.movieTitle}</p>
              <p class="mb-1">Added by: ${link.addedBy}</p>
              <p class="mb-0">Reviews: ${link.reviews.length}</p>
            </div>
            <button class="btn btn-danger delete-btn">
              Delete
            </button>
          </div>
        </div>
      `;
    container.appendChild(linkCard);
  });

  // Attach event listeners to new delete buttons
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const linkId = e.target.closest("[data-link-id]").dataset.linkId;
      deleteLink(linkId);
    });
  });
}
//delete link
async function deleteLink(linkId) {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This will permanently delete the link!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    const { data } = await axios.delete(`/admin/links/${linkId}`, {
      withCredentials: true,
    });

    if (data.success) {
      // Remove from DOM with animation
      const linkElement = document.querySelector(`[data-link-id="${linkId}"]`);
      if (linkElement) {
        linkElement.classList.add("deleting");
        setTimeout(() => {
          linkElement.remove();
          checkEmptyState();
        }, 300);
      }

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "Link has been removed",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  } catch (error) {
    console.error("Delete error:", error);
    Swal.fire({
      icon: "error",
      title: "Delete Failed",
      text: error.response?.data?.message || "Failed to delete link",
      timer: 3000,
    });
  }
}
//check empty state
function checkEmptyState() {
  const hasLinks = document.querySelectorAll("[data-link-id]").length > 0;
  document.getElementById("noLinksMessage").style.display = hasLinks
    ? "none"
    : "block";
}

function logoutUser() {
  Swal.fire({
    title: "Logout?",
    text: "Are you sure you want to logout?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, logout!",
  }).then((result) => {
    if (result.isConfirmed) {
      localStorage.removeItem("currentUser");
      window.location.href = "mainPage.html";
    }
  });
}
