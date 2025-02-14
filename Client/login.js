document.querySelector(".btnSubmit").addEventListener("click", loginUser);

function loginUser() {
  const email = document
    .querySelector(".form-control[type='email']")
    .value.trim();
  const password = document
    .querySelector(".form-control[type='password']")
    .value.trim();

  // Validate inputs
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    alert("Invalid email address.");
    return;
  }
  if (password.length === 0) {
    alert("Password is required.");
    return;
  }

  // Send login data to the backend
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Save the current user to localStorage
        localStorage.setItem("currentUser", JSON.stringify({ email: email }));
        alert("Login successful!");

        // Use the redirect URL from the server response
        if (data.redirect) {
          window.location.href = data.redirect; // This is the critical change
        } else {
          // Fallback for regular users
          window.location.href = "./search.html";
        }
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.error("Login error:", error);
      alert("An error occurred during login. Please try again.");
    });
}
//display error message
function displayError(message) {
  const formContent = document.querySelector(".form-content");
  const error = document.createElement("p");
  error.textContent = message;
  error.classList.add("error-message");
  error.style.color = "red";
  error.style.marginTop = "10px";
  formContent.appendChild(error);
}
