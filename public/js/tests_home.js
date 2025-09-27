document.addEventListener("DOMContentLoaded", () => {
  if (!utils.isLoggedIn()) location.href = "login.html";
  const $ = (id) => document.getElementById(id);

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

  function renderYearTabs(active){
    tabs.innerHTML = "";
    for (let i=1;i<=4;i++){
      const b = document.createElement("button");
      b.className = "year-tab";
      b.type = "button";
      b.setAttribute("aria-selected", String(i===active));
      b.textContent = ["1st","2nd","3rd","4th"][i-1] + " Year";
      b.onclick = () => renderYear(i);
      tabs.appendChild(b);
    }
  }

  function renderYear(yr){
    title.textContent = `Subjects in ${["1st","2nd","3rd","4th"][yr-1]} Year`;
    renderYearTabs(yr);
    grid.innerHTML = "";
    (subjectsByYear[yr]||[]).forEach(sub => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `<span class="name">${sub}</span><span class="pill">Test</span>`;
      const href = subjectHref(sub, yr);
      card.onclick = () => { if (href !== "#") location.href = href; };
      grid.appendChild(card);
    });
  }

  const u = utils.getCurrentUser();
  const startYear = (u?.studyYear >=1 && u.studyYear <=4) ? u.studyYear : 1;
  renderYear(startYear);
});
