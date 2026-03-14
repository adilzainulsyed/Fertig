document.addEventListener("DOMContentLoaded", () => {
  // Route guard
  utils.protectRoute();

  const user = utils.getCurrentUser();
  if (!user) return;

  // ---- helpers / state ----
  const $ = id => document.getElementById(id);
  const name = user.name || "Student";
  const actualStudyYear = user.yearInCollege || 1;

  // Set the welcome name in the header
  const welcomeEl = $("welcome-name");
  if (welcomeEl) welcomeEl.textContent = `Hey, ${name} - Ready for PYQs?`;

  // Validate that user is in a valid academic year (1-4)
  if (actualStudyYear < 1 || actualStudyYear > 4) {
    document.querySelector(".section").innerHTML =
      '<div class="year-access-warning">🚫 User is outside of standard 4-year cycle.</div>';
    return;
  }

  const subjectsByYear = {
    1: ["APE","BMES","FE","ENG","CM - I","CM - II","ACE","FEE","EMSB","EVS","PPS"],
    2: ["DS","DC & CN","DS & CO","DMS","DA"],
    3: ["OS", "DBMS", "CN", "TOC", "AI"],
    4: ["ML", "Blockchain", "Cloud", "DL", "Project"]
  };
  const backBtn   = $("back-home-btn");
  const tabsWrap  = $("yearTabs");
  const metaChip  = $("meta-chip");
  const title     = $("subject-year-title");
  const grid      = $("subject-list");

  const labelOf = y => ["1st","2nd","3rd","4th"][y - 1];

  // ---- render helpers ----
  const setMeta = (yr, exploring=false) => {
    metaChip.textContent = `Engineering • ${labelOf(yr)} Year • CSE${exploring ? " (exploring)" : ""}`;
  };

  const YEAR1_SLUGS = {
  "ape": "ape",
  "bmes": "bmes",
  "fe": "fe",
  "eng": "eng",

  // Chemistry/Math split
  "cm - i": "cm1",
  "cm i": "cm1",
  "cmi": "cm1",
  "cm- i": "cm1",

  "cm - ii": "cm2",
  "cm ii": "cm2",
  "cmii": "cm2",
  "cm- ii": "cm2",

  "ace": "ace",
  "fee": "fee",
  "emsb": "emsb",
  "evs": "evs",
  "pps" : "pps"
};

const YEAR2_SLUGS = {
  "ds": "ds",
  "dms": "dms",
  "ds&co": "dcso",
  "ds & co": "dcso",
  "dc&cn": "dccn",
  "dc & cn": "dccn",
  "ds&cn": "dccn",
  "ds & cn": "dccn",
  "da": "da"
};

const subjectHref = (subject, yr) => {
  const key = (subject || "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (yr === 1) {
    const slug = YEAR1_SLUGS[key] || YEAR1_SLUGS[key.replace(/\s+/g, " ")];
    if (slug) {
      const folder = encodeURIComponent("1st year");
      return `subjects/${folder}/${slug}.html`;
    }
  }

  if (yr === 2) {
    const slug = YEAR2_SLUGS[key] || YEAR2_SLUGS[key.replace(/\s+/g, "")];
    if (slug) {
      const folder = encodeURIComponent("2nd year");
      return `subjects/${folder}/${slug}.html`;
    }
  }

  return "#";
};

  const renderCards = (yr) => {
    // Fade-out old cards, then build new ones
    grid.classList.remove("anim-enter");
    void grid.offsetWidth; // force reflow
    grid.innerHTML = "";
    (subjectsByYear[yr] || []).forEach((sub, i) => {
      const card = document.createElement("div");
      card.className = "card anim-card";
      card.style.animationDelay = `${i * 60}ms`;
      card.innerHTML = `<span class="name">${sub}</span><span class="pill">PYQs</span>`;
      const href = subjectHref(sub, yr);
      card.addEventListener("click", () => { if (href !== '#') window.location.href = href; });
      grid.appendChild(card);
    });
    grid.classList.add("anim-enter");
  };

  // Create the sliding pill indicator once
  let pill = tabsWrap.querySelector(".year-tabs-pill");
  if (!pill) {
    pill = document.createElement("span");
    pill.className = "year-tabs-pill";
    tabsWrap.appendChild(pill);
  }

  const movePill = () => {
    const active = tabsWrap.querySelector('[aria-selected="true"]');
    if (!active) return;
    const wrapRect = tabsWrap.getBoundingClientRect();
    const tabRect  = active.getBoundingClientRect();
    pill.style.width = `${tabRect.width}px`;
    pill.style.transform = `translateX(${tabRect.left - wrapRect.left - 4}px)`;
  };

  const renderYearTabs = (activeYear, exploring=false) => {
    // Only rebuild buttons if they don't exist yet
    const existingBtns = tabsWrap.querySelectorAll(".year-tab");
    if (existingBtns.length === 0) {
      for (let i = 1; i <= 4; i++) {
        const btn = document.createElement("button");
        btn.className = "year-tab";
        btn.type = "button";
        btn.setAttribute("role","tab");
        btn.setAttribute("aria-controls","subject-list");
        btn.textContent = `${labelOf(i)} Year`;
        btn.dataset.year = i;
        btn.addEventListener("click", () => renderYear(i, i !== actualStudyYear));
        tabsWrap.insertBefore(btn, pill);
      }
    }

    // Update aria-selected on all tabs
    tabsWrap.querySelectorAll(".year-tab").forEach(b => {
      b.setAttribute("aria-selected", String(Number(b.dataset.year) === activeYear));
    });

    // Slide the pill to the active tab
    requestAnimationFrame(movePill);

    // keyboard support on the tablist
    tabsWrap.onkeydown = (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const kids = Array.from(tabsWrap.querySelectorAll(".year-tab"));
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

  // ---- Dark mode toggle ----
  const themeToggle = document.getElementById("themeToggle");
  const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fertig-theme", theme);
    window.utils?.setThemeToggleIcon?.(themeToggle, theme);
  };
  // Init from storage, fallback to OS preference
  const savedTheme = localStorage.getItem("fertig-theme")
    || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(savedTheme);
  themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
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
