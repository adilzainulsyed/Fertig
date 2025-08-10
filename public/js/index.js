document.addEventListener("DOMContentLoaded", () => {
  // Route guard
  utils.protectRoute();

  const user = utils.getCurrentUser();
  if (!user) return;

  // ---- helpers / state ----
  const $ = id => document.getElementById(id);
  const name = user.name || "Student";
  const joinYear = user.joinYear;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const validYears = [2022, 2023, 2024, 2025];
  const labelOf = y => ["1st","2nd","3rd","4th"][y - 1];

  if (!validYears.includes(joinYear)) {
    document.querySelector(".section").innerHTML =
      '<div class="year-access-warning">🚫 Invalid registration number or student not in current academic cycle.</div>';
    return;
  }

  const actualStudyYear = (currentMonth < 6)
    ? (currentYear - joinYear)
    : (currentYear - joinYear + 1);

  if (actualStudyYear < 1 || actualStudyYear > 4) {
    document.querySelector(".section").innerHTML =
      '<div class="year-access-warning">🚫 User is outside of standard 4-year cycle.</div>';
    return;
  }

  user.studyYear = actualStudyYear;
  localStorage.setItem("user", JSON.stringify(user));

  const subjectsByYear = {
    1: ["APE","BMES","FE","ENG","CM - I","CM - II","ACE","FEE","EMSB","EVS"],
    2: ["DS","DC & CN","DS & CO","DMS","DA"],
    3: ["OS", "DBMS", "CN", "TOC", "AI"],
    4: ["ML", "Blockchain", "Cloud", "DL", "Project"]
  };

  // ---- DOM refs ----
  $("welcome-name").textContent = `Hey, ${name}`;
  const metaChip  = $("meta-chip");
  const title     = $("subject-year-title");
  const grid      = $("subject-list");
  const backBtn   = $("back-home-btn");
  const tabsWrap  = $("yearTabs");

  // ---- render helpers ----
  const setMeta = (yr, exploring=false) => {
    metaChip.textContent = `Engineering • ${labelOf(yr)} Year • CSE${exploring ? " (exploring)" : ""}`;
  };

  // ---- subject routing (2nd year) ----
  const YEAR2_SLUGS = {
    "ds": "ds",
    "dms": "dms",
    "ds&co": "dsco",
    "ds & co": "dsco",
    "dc&cn": "dccn",
    "dc & cn": "dccn",
    "ds&cn": "dccn",        // tolerate earlier typo
    "ds & cn": "dccn",
    "da": "da"
  };

  const subjectHref = (subject, yr) => {
    const key = (subject || "")
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (yr === 2) {
      const slug = YEAR2_SLUGS[key] || YEAR2_SLUGS[key.replace(/\s+/g, "")];
      if (slug) {
        const folder = encodeURIComponent("2nd year"); // -> 2nd%20year
        return `subjects/${folder}/${slug}.html`;
      }
    }

    // TODO: add maps for other years as you build them
    return "#";
  };

  const renderCards = (yr) => {
    grid.innerHTML = "";
    (subjectsByYear[yr] || []).forEach(sub => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<span class="name">${sub}</span><span class="pill">PYQs</span>`;
      const href = subjectHref(sub, yr);
      card.addEventListener("click", () => { if (href !== '#') window.location.href = href; });
      grid.appendChild(card);
    });
  };

  const renderYearTabs = (activeYear, exploring=false) => {
    tabsWrap.innerHTML = "";
    for (let i = 1; i <= 4; i++) {
      const btn = document.createElement("button");
      btn.className = "year-tab";
      btn.type = "button";
      btn.setAttribute("role","tab");
      btn.setAttribute("aria-selected", String(i === activeYear));
      btn.setAttribute("aria-controls","subject-list");
      btn.textContent = `${labelOf(i)} Year`;
      btn.addEventListener("click", () => renderYear(i, i !== actualStudyYear));
      tabsWrap.appendChild(btn);
    }

    // keyboard support on the tablist
    tabsWrap.onkeydown = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const kids = Array.from(tabsWrap.children);
      const idx = kids.findIndex(k => k.getAttribute("aria-selected")==="true");
      let next = idx + (e.key==="ArrowRight" ? 1 : -1);
      if (next < 0) next = kids.length - 1;
      if (next >= kids.length) next = 0;
      kids[next].click();
      kids[next].focus();
    };

    backBtn.classList.toggle("hidden", !exploring && activeYear === actualStudyYear);
  };

  const renderYear = (yr, exploring=false) => {
    title.textContent = `Subjects in ${labelOf(yr)} Year`;
    setMeta(yr, exploring);
    renderCards(yr);
    renderYearTabs(yr, exploring);
  };

  // ---------- initial (allow ?year=1..4 to override user's study year) ----------
  const params = new URLSearchParams(location.search);
  const qpYear = parseInt(params.get("year"), 10);
  const launchYear = (qpYear >= 1 && qpYear <= 4) ? qpYear : actualStudyYear;
  renderYear(launchYear, launchYear !== actualStudyYear);

  // back action
  backBtn.addEventListener("click", () => renderYear(actualStudyYear, false));

  // Sidebar toggle (mobile)
  const sidenav = $("sidenav");
  const page = $("page");
  const toggle = $("sidebarToggle");

  toggle.addEventListener("click", () => {
    const hidden = sidenav.classList.toggle("hidden");
    page.classList.toggle("full", hidden);
  });

  // Avatar menu + logout
  const avatar = document.getElementById("avatarMenu");
  avatar.addEventListener("click", () => {
    const open = avatar.classList.toggle("open");
    avatar.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", (e) => {
    if (!avatar.contains(e.target)) { avatar.classList.remove("open"); avatar.setAttribute("aria-expanded","false"); }
  });

  $("avatarInit").textContent = (name[0] || "U").toUpperCase();
  $("logout").addEventListener("click", () => utils.logout());
});
