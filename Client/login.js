document.querySelector(".btnSubmit").addEventListener("click", loginUser);

function loginUser() {
  const email = document
    .querySelector(".form-control[type='email']")
    .value.trim();
  const password = document
    .querySelector(".form-control[type='password']")
    .value.trim();
  const errorMessage = document.querySelector(".error-message");

  // Remove previous error message
  if (errorMessage) {
    errorMessage.remove();
  }

  // Validate inputs
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    displayError("Invalid email address.");
    return;
  }

  if (password.length === 0) {
    displayError("Password is required.");
    return;
  }

  // Send data to the backend for verification
  fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Redirect to the search page
        alert("Login successful!");
        window.location.href = "./search.html";
      } else {
        // Display error message returned by the server
        displayError(data.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      displayError("An error occurred. Please try again.");
    });
}

function displayError(message) {
  const formContent = document.querySelector(".form-content");
  const error = document.createElement("p");
  error.textContent = message;
  error.classList.add("error-message");
  error.style.color = "red";
  error.style.marginTop = "10px";
  formContent.appendChild(error);
}
