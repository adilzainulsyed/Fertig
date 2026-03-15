document.addEventListener("DOMContentLoaded", () => {
  utils.protectRoute();

  const $ = (id) => document.getElementById(id);
  const user = utils.getCurrentUser() || {};

  const tabs = $("yearTabs");
  const title = $("subject-year-title");
  const grid = $("subject-list");
  const backBtn = $("back-home-btn");
  const welcomeName = $("welcome-name");
  const avatar = $("avatarMenu");
  const avatarInit = $("avatarInit");
  const logoutBtn = $("logout");
  const themeToggle = $("themeToggle");

  const studyYear = Number(user.yearInCollege || user.studyYear || 1);
  const currentYear = studyYear >= 1 && studyYear <= 4 ? studyYear : 1;

  const materialByYear = {
    1: [
      { name: "Subject notes by year", status: "Planned" },
      { name: "Quick revision sheets", status: "Planned" },
      { name: "Previous year solutions", status: "Planned" }
    ],
    2: [
      { name: "Subject notes by year", status: "Planned" },
      { name: "Quick revision sheets", status: "Planned" },
      { name: "Previous year solutions", status: "Planned" }
    ],
    3: [
      { name: "Subject notes by year", status: "Planned" },
      { name: "Quick revision sheets", status: "Planned" },
      { name: "Previous year solutions", status: "Planned" }
    ],
    4: [
      { name: "Subject notes by year", status: "Planned" },
      { name: "Quick revision sheets", status: "Planned" },
      { name: "Previous year solutions", status: "Planned" }
    ]
  };

  const labelOf = (year) => ["1st", "2nd", "3rd", "4th"][year - 1];

  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fertig-theme", theme);
    window.utils?.setThemeToggleIcon?.(themeToggle, theme);
  };

  const savedTheme =
    localStorage.getItem("fertig-theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      applyTheme(current === "dark" ? "light" : "dark");
    });
  }

  if (welcomeName) {
    const name = user.name || "Student";
    welcomeName.textContent = `Hey, ${name} - Time to revise.`;
  }

  if (avatarInit) {
    avatarInit.textContent = (user.name?.[0] || "U").toUpperCase();
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
      utils.logout();
    });
  }

  let pill = tabs.querySelector(".year-tabs-pill");
  if (!pill) {
    pill = document.createElement("span");
    pill.className = "year-tabs-pill";
    tabs.appendChild(pill);
  }

  const movePill = () => {
    const active = tabs.querySelector('[aria-selected="true"]');
    if (!active) return;

    const wrapRect = tabs.getBoundingClientRect();
    const tabRect = active.getBoundingClientRect();
    pill.style.width = `${tabRect.width}px`;
    pill.style.transform = `translateX(${tabRect.left - wrapRect.left - 4}px)`;
  };

  const renderTabs = (activeYear, exploring) => {
    if (!tabs.querySelector(".year-tab")) {
      for (let i = 1; i <= 4; i += 1) {
        const btn = document.createElement("button");
        btn.className = "year-tab";
        btn.type = "button";
        btn.setAttribute("role", "tab");
        btn.setAttribute("aria-controls", "subject-list");
        btn.dataset.year = String(i);
        btn.textContent = `${labelOf(i)} Year`;
        btn.addEventListener("click", () => renderYear(i, i !== currentYear));
        tabs.insertBefore(btn, pill);
      }
    }

    tabs.querySelectorAll(".year-tab").forEach((btn) => {
      btn.setAttribute("aria-selected", String(Number(btn.dataset.year) === activeYear));
    });

    requestAnimationFrame(movePill);

    tabs.onkeydown = (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();

      const tabButtons = Array.from(tabs.querySelectorAll(".year-tab"));
      const activeIndex = tabButtons.findIndex((btn) => btn.getAttribute("aria-selected") === "true");
      let nextIndex = activeIndex + (event.key === "ArrowRight" ? 1 : -1);

      if (nextIndex < 0) nextIndex = tabButtons.length - 1;
      if (nextIndex >= tabButtons.length) nextIndex = 0;

      tabButtons[nextIndex].click();
      tabButtons[nextIndex].focus();
    };

    if (backBtn) {
      backBtn.classList.toggle("hidden", !exploring && activeYear === currentYear);
    }
  };

  const renderCards = (year) => {
    grid.classList.remove("anim-enter");
    void grid.offsetWidth;

    grid.innerHTML = "";
    (materialByYear[year] || []).forEach((item, index) => {
      const card = document.createElement("article");
      card.className = "card anim-card";
      card.style.animationDelay = `${index * 60}ms`;
      card.innerHTML = `<span class="name">${item.name}</span><span class="pill">${item.status}</span>`;
      grid.appendChild(card);
    });

    grid.classList.add("anim-enter");
  };

  const renderYear = (year, exploring = false) => {
    title.textContent = `Study material for ${labelOf(year)} Year`;
    renderTabs(year, exploring);
    renderCards(year);
  };

  if (backBtn) {
    backBtn.addEventListener("click", () => renderYear(currentYear, false));
  }

  renderYear(currentYear, false);
});
