document.addEventListener("DOMContentLoaded", () => {
  window.utils?.redirectIfLoggedIn();

  const $ = id => document.getElementById(id);
  const showErr = (id, msg="") => { const el=$(id); if(el) el.textContent = msg; };
  const themeToggle = $("themeToggle");

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fertig-theme", theme);
    window.utils?.setThemeToggleIcon?.(themeToggle, theme);
    if (themeToggle) {
      const nextTheme = theme === "dark" ? "light" : "dark";
      themeToggle.setAttribute("aria-label", `Switch to ${nextTheme} mode`);
      themeToggle.setAttribute("title", `Switch to ${nextTheme} mode`);
    }
  };

  const savedTheme = localStorage.getItem("fertig-theme")
    || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme") || "light";
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

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
