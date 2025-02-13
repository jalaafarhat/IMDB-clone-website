document.addEventListener("DOMContentLoaded", () => {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || !currentUser.email) {
    alert("You must be logged in to access this page.");
    window.location.href = "./mainPage.html";
  }

  fetchUserLinks();
});

async function fetchUserLinks() {
  try {
    const { data } = await axios.get(`/users/${currentUser.email}/links`);
    const userLinks = data.links || [];
    const userLinksDiv = document.getElementById("userLinks");

    userLinksDiv.innerHTML = userLinks
      .map(
        (link, index) => `
          <div class="card my-3">
            <div class="card-body">
              <h5 class="card-title">Link ${index + 1}</h5>
              <p class="card-text"><a href="${link.link}" target="_blank">${
          link.link
        }</a></p>
              <p class="card-text">Added by: ${link.addedBy}</p>
              <p class="card-text">Public: ${link.isPublic ? "Yes" : "No"}</p>
            </div>
          </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error fetching user links:", error);
    alert("Failed to load user links. Please try again later.");
  }
}

async function loadUserLinks() {
  try {
    const { data } = await axios.get(`/users/${currentUser.email}/links`);
    const userLinksList = document.getElementById("userLinks");

    data.links.forEach((link) => {
      const listItem = document.createElement("li");
      listItem.className = "list-group-item";
      listItem.innerHTML = `
        <a href="${link.link}" target="_blank">${link.name}</a>
        <span class="badge bg-${link.isPublic ? "success" : "secondary"}">
          ${link.isPublic ? "Public" : "Private"}
        </span>
        <span class="text-muted">(${link.movieId})</span>
      `;
      userLinksList.appendChild(listItem);
    });
  } catch (error) {
    console.error("Error loading user links:", error);
  }
}
