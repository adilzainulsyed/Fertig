// ✅ Show signup success message
window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("signupSuccess") === "true") {
    document.getElementById("welcome-message").textContent = "Account created successfully. Please log in.";
    localStorage.removeItem("signupSuccess");
  }
});

// ✅ Handle login
document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const storedUser = JSON.parse(localStorage.getItem("user"));

  if (!storedUser || storedUser.email !== email || storedUser.password !== password) {
    alert("Invalid email or password.");
    return;
  }

  localStorage.setItem("isLoggedIn", "true");
  window.location.href = "index.html";
});
