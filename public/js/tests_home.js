document.addEventListener("DOMContentLoaded", () => {
  if (!utils.isLoggedIn()) location.href = "login.html";
  const $ = (id) => document.getElementById(id);

  /* ── Dark mode toggle ── */
  const toggle = $("themeToggle");
  function applyTheme(t){
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("fertig-theme", t);
    window.utils?.setThemeToggleIcon?.(toggle, t);
  }
  const saved = localStorage.getItem("fertig-theme") ||
    (window.matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");
  applyTheme(saved);
  if(toggle) toggle.addEventListener("click", () =>
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"));

  const subjectsByYear = {
    1: ["APE","BMES","FE","ENG","CM - I","CM - II","ACE","FEE","EMSB","EVS","PPS"],
    2: ["DS","DMS","DS & CO","DC & CN","DA"],
    3: ["OS","DBMS","CN","TOC","AI"],
    4: ["ML","Blockchain","Cloud","DL","Project"]
  };

  // EXACT filenames from your screenshot
  const TEST_FILES = {
    1: {
      "APE":"apetest.json",
      "BMES":"bmetest.json",
      "CM - I":"cm1test.json",
      "ENG":"engtest.json",
      "EVS":"evstest.json",
      "FE":"fetest.json",
      "FEE":"feeTest.json",   // note the capital T
      // add when ready:
      "CM - II": null, "ACE": null, "EMSB": null, "PPS": null
    },
    2: {
      "DS":"dstest.json",
      "DS & CO":"dscotest.json",
      // add when ready:
      "DMS": null, "DC & CN": null, "DA": null
    },
    3: {}, 4: {}
  };

  const labelOf = (y) => ["1st year","2nd year","3rd year","4th year"][y-1];

  function subjectHref(subject, yr){
    const file = TEST_FILES[yr]?.[subject] || null;
    if (!file) return "#"; // inactive until file exists
    const url = `/tests/${labelOf(yr)}/${file}`;
    // go straight to tests.html with the file path
    return `tests.html?paper=${encodeURIComponent(url)}`;
  }

  const title = $("subject-year-title");
  const grid  = $("subject-list");
  const tabs  = $("yearTabs");
  const welcomeName = $("welcome-name");
  const avatar = $("avatarMenu");
  const avatarInit = $("avatarInit");
  const logoutBtn = $("logout");
  const currentUser = utils.getCurrentUser();

  if (welcomeName) {
    const n = currentUser?.name || "Student";
    welcomeName.textContent = `Hey, ${n} - Ready to test yourself?`;
  }

  if (avatarInit) {
    avatarInit.textContent = (currentUser?.name?.[0] || "U").toUpperCase();
  }

  if (avatar) {
    avatar.addEventListener("click", () => {
      const open = avatar.classList.toggle("open");
      avatar.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("click", (e) => {
      if (!avatar.contains(e.target)) {
        avatar.classList.remove("open");
        avatar.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      utils.logout();
    });
  }

  // Create the sliding pill indicator once
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
    const tabRect  = active.getBoundingClientRect();
    pill.style.width = `${tabRect.width}px`;
    pill.style.transform = `translateX(${tabRect.left - wrapRect.left - 4}px)`;
  };

  function renderYearTabs(active){
    // Only build buttons once
    const existingBtns = tabs.querySelectorAll(".year-tab");
    if (existingBtns.length === 0) {
      for (let i = 1; i <= 4; i++){
        const b = document.createElement("button");
        b.className = "year-tab";
        b.type = "button";
        b.setAttribute("role","tab");
        b.setAttribute("aria-controls","subject-list");
        b.textContent = ["1st","2nd","3rd","4th"][i-1] + " Year";
        b.dataset.year = i;
        b.onclick = () => renderYear(i);
        tabs.insertBefore(b, pill);
      }
    }

    // Update aria-selected on all tabs
    tabs.querySelectorAll(".year-tab").forEach(b => {
      b.setAttribute("aria-selected", String(Number(b.dataset.year) === active));
    });

    // Slide the pill to the active tab
    requestAnimationFrame(movePill);

    // Keyboard arrow support
    tabs.onkeydown = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const kids = Array.from(tabs.querySelectorAll(".year-tab"));
      const idx = kids.findIndex(k => k.getAttribute("aria-selected")==="true");
      let next = idx + (e.key==="ArrowRight" ? 1 : -1);
      if (next < 0) next = kids.length - 1;
      if (next >= kids.length) next = 0;
      kids[next].click();
      kids[next].focus();
    };
  }

  function renderYear(yr){
    title.textContent = `Subjects in ${["1st","2nd","3rd","4th"][yr-1]} Year`;
    renderYearTabs(yr);

    // Fade-slide + staggered card entrance (matches index page)
    grid.classList.remove("anim-enter");
    void grid.offsetWidth; // force reflow
    grid.innerHTML = "";
    (subjectsByYear[yr]||[]).forEach((sub, i) => {
      const card = document.createElement("div");
      card.className = "card anim-card";
      card.style.animationDelay = `${i * 60}ms`;
      card.innerHTML = `<span class="name">${sub}</span><span class="pill">Test</span>`;
      const href = subjectHref(sub, yr);
      card.onclick = () => { if (href !== "#") location.href = href; };
      grid.appendChild(card);
    });
    grid.classList.add("anim-enter");
  }

  const u = utils.getCurrentUser();
  const startYear = (u?.studyYear >=1 && u.studyYear <=4) ? u.studyYear : 1;
  renderYear(startYear);
});
