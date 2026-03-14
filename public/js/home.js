document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const welcomeName = document.getElementById("welcome-name");
  const avatar = document.getElementById("avatarMenu");
  const avatarInit = document.getElementById("avatarInit");
  const logoutBtn = document.getElementById("logout");
  const user = window.utils?.getCurrentUser?.();

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fertig-theme", theme);
    window.utils?.setThemeToggleIcon?.(themeToggle, theme);
  };

  const savedTheme = localStorage.getItem("fertig-theme")
    || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  if (user) {
    if (welcomeName) {
      welcomeName.textContent = `Hey, ${user.name || "Student"}`;
    }
    if (avatarInit) {
      avatarInit.textContent = (user.name?.[0] || "U").toUpperCase();
    }
  } else if (welcomeName) {
    welcomeName.textContent = "Welcome to Fertig";
  }

  if (avatar && avatarInit && !user) {
    avatarInit.textContent = "U";
  }

  if (avatar) {
    avatar.addEventListener("click", () => {
      const open = avatar.classList.toggle("open");
      avatar.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", (event) => {
      if (!avatar.contains(event.target)) {
        avatar.classList.remove("open");
        avatar.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      if (window.utils?.isLoggedIn?.()) {
        window.utils.logout();
      } else {
        window.location.href = "login.html";
      }
    });
  }
});
