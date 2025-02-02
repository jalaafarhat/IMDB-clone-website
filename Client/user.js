document.addEventListener("DOMContentLoaded", function () {
  const greeting = document.getElementById("greeting");
  const logoutBtn = document.getElementById("logout-btn");

  // Check if user is logged in
  fetch("/check-session")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        greeting.textContent = `Welcome, ${data.user.name}`;
        logoutBtn.style.display = "inline-block";
      } else {
        greeting.textContent = "";
        logoutBtn.style.display = "none";
      }
    })
    .catch((error) => console.error("Error checking session:", error));

  // Logout function
  logoutBtn.addEventListener("click", function () {
    fetch("/logout", { method: "POST" })
      .then((response) => response.json())
      .then(() => {
        window.location.href = "./mainPage.html"; // Redirect to mainPage page after logout
      })
      .catch((error) => console.error("Error logging out:", error));
  });
});
