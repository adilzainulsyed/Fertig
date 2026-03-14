document.addEventListener("DOMContentLoaded", () => {
  window.utils?.redirectIfLoggedIn();

  const $ = id => document.getElementById(id);
  const showErr = (id, msg="") => { const el=$(id); if(el) el.textContent = msg; };

  if (localStorage.getItem("signupSuccess") === "true") {
    const m = $("welcome-message"); if (m) m.textContent = "Account created successfully. Please log in.";
    localStorage.removeItem("signupSuccess");
  }

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("email").value.trim();
    const password = $("password").value;

    showErr("err-email",""); showErr("err-password","");
    if (!email) { showErr("err-email","Enter your email."); return; }
    if (!password) { showErr("err-password","Enter your password."); return; }

    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) {
        showErr("err-password", data.error || "Login failed");
        return;
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("isLoggedIn", "true");
      location.href = "home.html";
    } catch (error) {
      showErr("err-password", "An error occurred. Please try again.");
    }
  });
});
