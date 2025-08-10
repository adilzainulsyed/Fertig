document.addEventListener("DOMContentLoaded", () => {
  // If already logged in → go straight to dashboard
  if (window.utils?.isLoggedIn()) {
    location.href = "index.html";
  }
});
