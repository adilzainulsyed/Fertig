document.getElementById("signup-btn").addEventListener("click", () => {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const regno = document.getElementById("regno").value.trim();

  if (!name || !email || !password || !regno) {
    alert("Please fill in all fields.");
    return;
  }

  const yearPrefix = regno.substring(0, 2);
  const joinYear = parseInt("20" + yearPrefix);
  const currentYear = new Date().getFullYear();
  const studyYear = currentYear - joinYear + 1;

  const user = { name, email, password, regno, joinYear, studyYear };

  localStorage.setItem("user", JSON.stringify(user));

  // Optional: temp message flag for login
  localStorage.setItem("signupSuccess", "true");

  // Redirect to login
  window.location.href = "login.html";
});
