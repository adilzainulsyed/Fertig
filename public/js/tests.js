// public/js/tests.js
(function () {
  const $ = (id) => document.getElementById(id);

  const screens = { setup: $("setup"), exam: $("exam"), summary: $("summary") };
  const els = {
    paperKey: $("paperKey"), duration: $("duration"), shuffle: $("shuffle"),
    paperTitle: $("paperTitle"), paperMeta: $("paperMeta"),
    timer: $("timer"), qnav: $("qnav"),
    qBadge: $("qBadge"), qMarks: $("qMarks"), qChapter: $("qChapter"),
    qText: $("qText"), attachments: $("attachments"),
    answer: $("answer"), proctorNote: $("proctorNote")
  };

  // ---------- helpers
  const fmtTime = (s) => {
    s = Math.max(0, s | 0);
    const hh = String((s / 3600 | 0)).padStart(2, '0');
    const mm = String(((s % 3600) / 60 | 0)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const escapeHTML = (t = "") => t.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
  const paragraphize = (t = "") => escapeHTML(t).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");

  // breadcrumb helpers
  const yearLabelFromKey = (k) => {
    const y = (k || "").split(":")[0] || "";
    if (y.startsWith("1st")) return "1styear";
    if (y.startsWith("2nd")) return "2ndyear";
    if (y.startsWith("3rd")) return "3rdyear";
    if (y.startsWith("4th")) return "4thyear";
    return y || "—";
  };
  const setCrumbs = (year, subject) => {
    const y = $("crumb-year"); const s = $("crumb-subject");
    if (y) y.textContent = year || "—";
    if (s) s.textContent = subject || "—";
  };

  $("logoutTop")?.addEventListener("click", () => {
    window.utils?.logout ? window.utils.logout() : (location.href = "login.html");
  });

  // ---------- state
  let Q = [];
  let idx = 0;
  let flags = new Set();
  let answers = {};         
  let startedAt = 0;
  let secsLeft = 0; let timerId = null;
  let tabSwitches = 0;
  let key = "";
  let timeSpent = {};  
  let lastSwitchTime = Date.now();

  function recordTimeSpent() {
    const now = Date.now();
    const elapsed = Math.round((now - lastSwitchTime) / 1000);
    timeSpent[idx + 1] = (timeSpent[idx + 1] || 0) + elapsed;
    lastSwitchTime = now;
    console.log(`⏱ Q${idx + 1} +${elapsed}s → total ${timeSpent[idx + 1]}s`);
  }

  function ensureAllQuestionsTracked(totalQuestions) {
    for (let i = 1; i <= totalQuestions; i++) {
      if (!(i in timeSpent)) {
        timeSpent[i] = 0;
      }
    }
  }

  // autosave
  const saveKey = () => `fertig:test:${key || "adhoc"}`;
  setInterval(() => {
    try {
      localStorage.setItem(saveKey(), JSON.stringify({
        key, idx, flags: [...flags], answers, startedAt, secsLeft, tabSwitches, when: Date.now()
      }));
    } catch { }
  }, 15000);

  // proctor-lite
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) tabSwitches++;
    if (els.proctorNote) els.proctorNote.textContent = `Tab switches recorded: ${tabSwitches}`;
  });

  ["copy", "cut", "paste", "contextmenu"].forEach(evt => document.addEventListener(evt, e => e.preventDefault()));

  // ---------- data loading
  function pathFromKey(k) {
    const [yearSlug, subjSlugRaw] = (k || "").split(":");
    if (!yearSlug || !subjSlugRaw) return null;

    const yearFolder =
      yearSlug.startsWith("1st") ? "1st year" :
      yearSlug.startsWith("2nd") ? "2nd year" :
      yearSlug.startsWith("3rd") ? "3rd year" :
      yearSlug.startsWith("4th") ? "4th year" : yearSlug;

    const subj = subjSlugRaw.toLowerCase();
    const EXCEPTIONS = { fee: "feeTest.json", dcso: "dscotest.json" };
    const file = EXCEPTIONS[subj] || `${subj}test.json`;
    return `/tests/${yearFolder}/${file}`;
  }

  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Failed: ${url}`);
    return r.json();
  }

  function looksLikeMCQ(it) {
    const arr = it.options || it.choices;
    return Array.isArray(arr) && arr.length >= 2;
  }

  function toOptionStrings(arr) {
    return arr.map(o => {
      if (typeof o === "string") return o;
      if (o && typeof o === "object") {
        if (typeof o.text === "string") return o.text;
        if (typeof o.label === "string") return o.label;
        if (typeof o.value === "string") return o.value;
      }
      try { return JSON.stringify(o); } catch { return String(o); }
    });
  }

  function normalizeRecords(raw) {
    return raw.map((it, i) => {
      const text = it.text || it.question_text || "";
      const rawOpts = looksLikeMCQ(it) ? (it.options || it.choices) : null;
      const options = rawOpts ? toOptionStrings(rawOpts) : null;

      let answerKey = it.answer ?? it.correct ?? null;
      if (options) {
        if (typeof answerKey === "string") {
          const m = answerKey.trim().match(/^[A-D]$/i);
          if (m) answerKey = m[0].toUpperCase().charCodeAt(0) - 65;
          else {
            const idx = options.findIndex(o => o.trim() === answerKey.trim());
            if (idx >= 0) answerKey = idx;
          }
        }
        if (Number.isFinite(answerKey)) {
          if (answerKey >= 1 && answerKey <= options.length) answerKey = answerKey - 1;
        } else {
          answerKey = null;
        }
      }

      const imgs = Array.isArray(it.images)
        ? it.images.map(src => src.startsWith("data/") ? `/question_images/${src.split("/").pop()}` : src)
        : [];

      return {
        i,
        type: options ? "mcq" : "text",
        text,
        options,
        answerKey,
        marks: it.marks ?? null,
        time: it.timeinmin ?? null,
        chapter: Array.isArray(it.chapter) ? it.chapter.join(", ") : (it.chapter || ""),
        subparts: /(^|\s)[a-h]\)|\(\s*[ivx]+\s*\)/i.test(text),
        meta: {
          subject: it.subject || "",
          source_year: it.source_year || it.sourceYear || "",
          difficulty: (it.difficulty || "").toLowerCase() || null
        },
        images: imgs
      };
    });
  }

  // --- remainder of your code (rendering, event handling, submit, charts, etc.) ---
  // same as before, but make sure every `${...}` is wrapped inside backticks.

})();
