document.querySelector(".btnSubmit").addEventListener("click", registerUser);

function registerUser() {
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  // Clear previous errors
  clearErrors();

  let hasError = false;

  // Validation
  if (name.length > 50) {
    displayError(nameInput, "Name must not exceed 50 characters.");
    hasError = true;
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    displayError(emailInput, "Invalid email address.");
    hasError = true;
  }

  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{6,15}$/.test(password)) {
    displayError(
      passwordInput,
      "Password must be 6-15 characters long and include at least one uppercase letter, one lowercase letter, and one special character or number."
    );
    hasError = true;
  }

  if (password !== confirmPassword) {
    displayError(confirmPasswordInput, "Passwords do not match.");
    hasError = true;
  }

  // Stop submission if there are errors
  if (hasError) return;

  // Send data to backend
  fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        alert("Registration successful!");
        window.location.href = "/login.html";
      } else {
        displayError(emailInput, data.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      displayError(nameInput, "An error occurred. Please try again later.");
    });
}
//display error message
function displayError(inputElement, message) {
  const error = document.createElement("p");
  error.textContent = message;
  error.classList.add("errorMessage");
  error.style.color = "red";
  error.style.fontSize = "14px";
  error.style.marginTop = "5px";

  inputElement.parentElement.appendChild(error);
}
//clear errors
function clearErrors() {
  const errors = document.querySelectorAll(".errorMessage");
  errors.forEach((error) => error.remove());
}
