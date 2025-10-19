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
    s = Math.max(0, s|0);
    const hh = String((s/3600|0)).padStart(2,'0');
    const mm = String(((s%3600)/60|0)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    return `${hh}:${mm}:${ss}`;
  };
  const escapeHTML = (t="") => t.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  const paragraphize = (t="") => escapeHTML(t).replace(/\n{2,}/g, "</p><p>").replace(/\n/g, "<br>");

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
  let answers = {};         // index -> string or option index for MCQ
  let startedAt = 0;
  let secsLeft = 0; let timerId = null;
  let tabSwitches = 0;
  let key = "";
  // track time spent per question
  let timeSpent = {};  
  let lastSwitchTime = Date.now();

  function recordTimeSpent() {
    const now = Date.now();
    const elapsed = Math.round((now - lastSwitchTime) / 1000);
    timeSpent[idx + 1] = (timeSpent[idx + 1] || 0) + elapsed;
    lastSwitchTime = now;
    console.log(`⏱️ Q${idx + 1} +${elapsed}s → total ${timeSpent[idx + 1]}s`);
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
        key, idx, flags:[...flags], answers, startedAt, secsLeft, tabSwitches, when: Date.now()
      }));
    } catch {}
  }, 15000);

  // proctor-lite
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) tabSwitches++;
    if (els.proctorNote) els.proctorNote.textContent = `Tab switches recorded: ${tabSwitches}`;
  });
  ["copy","cut","paste","contextmenu"].forEach(evt => document.addEventListener(evt, e => e.preventDefault()));

  // ---------- data loading
  function pathFromKey(k) {
    // "1styear:ape" -> "/tests/1st year/apetest.json"
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

  // MCQ helpers
  function looksLikeMCQ(it){
    const arr = it.options || it.choices;
    return Array.isArray(arr) && arr.length >= 2;
  }
  function toOptionStrings(arr){
    return arr.map(o => {
      if (typeof o === "string") return o;
      if (o && typeof o === "object") {
        if (typeof o.text === "string")  return o.text;
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

  function sumTimeMinutes(list) {
    const mins = list.map(q => +q.time || 0).reduce((a,b)=>a+b,0);
    return mins || 0;
  }

  // Build 10 MCQ + 5 descriptives (pref 4/3 marks)
  function buildMixedPaper(list){
    const mcq = list.filter(q => q.type === "mcq");
    const desc = list.filter(q => q.type !== "mcq");

    const mcqPref = [...mcq].sort((a,b)=>(a.marks||99)-(b.marks||99));
    const pickedMcq = mcqPref.slice(0,10);

    const d4 = desc.filter(q => q.marks === 4);
    const d3 = desc.filter(q => q.marks === 3);
    const dSub = desc.filter(q => q.subparts);
    const dPool = [...d4, ...d3, ...dSub, ...desc];
    const seen = new Set();
    const pickedDesc = [];
    for (const q of dPool){
      if (seen.has(q.i)) continue;
      pickedDesc.push(q); seen.add(q.i);
      if (pickedDesc.length >= 5) break;
    }
    while (pickedDesc.length < 5 && desc.length){
      const q = desc[pickedDesc.length % desc.length];
      if (!seen.has(q.i)){ pickedDesc.push(q); seen.add(q.i); }
    }
    return [...pickedMcq, ...pickedDesc];
  }

  // ---------- UI
  function renderNav() {
    els.qnav.innerHTML = "";
    Q.forEach((_, i) => {
      const btn = document.createElement("div");
      btn.className = "qn";
      if (i === idx) btn.classList.add("active");
      const ans = answers[i];
      if ((Q[i].type === "mcq" && Number.isInteger(ans)) || (Q[i].type !== "mcq" && ans?.trim())) btn.classList.add("answered");
      if (flags.has(i)) btn.classList.add("flagged");
      btn.textContent = `Q${i+1}`;
      btn.onclick = () => {
  recordTimeSpent();
  idx = i;
  renderQuestion();
  renderNav();
};

      els.qnav.appendChild(btn);
    });
  }

  function renderQuestion() {
    const q = Q[idx];
    els.qBadge.textContent = `Q${idx+1}`;
    els.qMarks.textContent = q.marks ? `${q.marks} marks` : "—";
    els.qChapter.textContent = q.chapter ? q.chapter : (q.meta.difficulty || "—");

    const hasCode = /#include|\b(int|void)\s+main\s*\(|\{|\}/.test(q.text);
    const htmlStem = hasCode ? `<pre><code>${escapeHTML(q.text)}</code></pre>` : `<p>${paragraphize(q.text)}</p>`;
    els.qText.innerHTML = htmlStem;

    els.attachments.innerHTML = "";
    (q.images || []).forEach(src => {
      const img = new Image();
      img.src = src; img.alt = "Attachment"; img.loading = "lazy";
      els.attachments.appendChild(img);
    });

    if (q.type === "mcq") {
      els.answer.classList.add("hidden");
      let html = `<div class="mcq" id="mcqBox">`;
      (q.options || []).forEach((opt, k) => {
        const checked = Number.isInteger(answers[idx]) && answers[idx] === k ? "checked" : "";
        html += `
          <label class="opt">
            <input type="radio" name="mcq_${idx}" value="${k}" ${checked} />
            <span>${paragraphize(String(opt||""))}</span>
          </label>`;
      });
      html += `</div>`;
      const container = document.createElement("div");
      container.innerHTML = html;
      const old = $("mcqBox"); if (old) old.remove();
      els.qText.parentElement.insertBefore(container, els.attachments);

      container.querySelectorAll('input[type="radio"]').forEach(r => {
        r.addEventListener("change", (e) => {
          answers[idx] = parseInt(e.target.value, 10);
          renderNav();
        });
      });
    } else {
      const old = $("mcqBox"); if (old) old.remove();
      els.answer.classList.remove("hidden");
      els.answer.value = answers[idx] || "";
    }
  }

  function startTimer(seconds) {
    secsLeft = seconds|0;
    clearInterval(timerId);
    timerId = setInterval(() => {
      secsLeft--; els.timer.textContent = fmtTime(secsLeft);
      if (secsLeft <= 0) { clearInterval(timerId); submit(); }
    }, 1000);
    els.timer.textContent = fmtTime(secsLeft);
  }

  function show(screen) {
    Object.values(screens).forEach(s => s.classList.add("hidden"));
    screens[screen].classList.remove("hidden");
  }

  // actions
  $("answer")?.addEventListener("input", async (e) => {
    answers[idx] = e.target.value;
    renderNav();

    // --- NEW CODE TO SEND ANSWER TO similarity.py ---
    const payload = {
      id: idx + 1,
      answer: e.target.value
    };
    try {
      await fetch("http://127.0.0.1:5000/similarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error("Failed to send similarity data:", err);
    }
  });

  $("prevBtn").onclick = () => { if (idx > 0) { idx--; renderQuestion(); renderNav(); } };
  $("nextBtn").onclick = () => { if (idx < Q.length-1) { idx++; renderQuestion(); renderNav(); } };
  $("answer")?.addEventListener("input", (e) => { answers[idx] = e.target.value; renderNav(); });
  $("prevBtn").onclick = () => {
  if (idx > 0) {
    recordTimeSpent();
    idx--;
    renderQuestion();
    renderNav();
  }
};

$("nextBtn").onclick = () => {
  if (idx < Q.length - 1) {
    recordTimeSpent();
    idx++;
    renderQuestion();
    renderNav();
  }
};

  $("flagBtn").onclick = () => { flags.has(idx) ? flags.delete(idx) : flags.add(idx); renderNav(); };
  $("submitBtn").onclick = () => submit();

  function submit() {
    clearInterval(timerId);// capture final question time
    recordTimeSpent();
    ensureAllQuestionsTracked(15);   // total number of questions = 15
    console.log("Final timeSpent:", timeSpent);


    const usedMins = Math.round((Date.now() - startedAt) / 60000);
    const answered = Q.reduce((n,q,i)=> n + (q.type==="mcq" ? Number.isInteger(answers[i]) : !!(answers[i]&&answers[i].trim())), 0);

    const payload = {
      key,
      meta: { totalQuestions: Q.length, startedAt, submittedAt: Date.now(), usedMinutes: usedMins, tabSwitches },
      timeSpent,  
      answers: Q.map((q, i) => ({
        index: i+1,
        type: q.type,
        question: q.text,
        marks: q.marks,
        chapter: q.chapter || q.meta.difficulty || null,
        images: q.images,
        answer: q.type === "mcq" ? answers[i] ?? null : (answers[i] || ""),
        flagged: flags.has(i)
      }))
    };
    try { localStorage.setItem(saveKey()+":final", JSON.stringify(payload)); } catch {}

    $("sumMeta").textContent = `${Q.length} questions attempted over ${usedMins} min.`;
    $("sumAnswered").textContent = answered;
    $("sumFlagged").textContent = flags.size;
    $("sumTime").textContent = usedMins;
    $("sumViol").textContent = tabSwitches;

    $("downloadBtn").onclick = () => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = (key.replace(/[:/]/g,"_") || "fertig_test") + "_answers.json";
      a.click();
      URL.revokeObjectURL(a.href);
    };
    // ---------- plotting section ----------
(async function generateCharts() {
  // 1️⃣ Bar chart - per question
  const questionLabels = Q.map((_, i) => `Q${i+1}`);
  const idealTimes = Q.map(q => (q.time || 0) * 60); // convert minutes → seconds
  const actualTimes = Q.map((_, i) => timeSpent[i+1] || 0);

  const ctx1 = document.getElementById("questionBar");
  new Chart(ctx1, {
    type: "bar",
    data: {
      labels: questionLabels,
      datasets: [
        {
          label: "Ideal Time (sec)",
          data: idealTimes,
          backgroundColor: "rgba(54, 162, 235, 0.5)"
        },
        {
          label: "Actual Time (sec)",
          data: actualTimes,
          backgroundColor: "rgba(255, 99, 132, 0.5)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Time Spent per Question"
        },
        legend: { position: "top" }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Seconds" }
        }
      }
    }
  });

  // 2️⃣ Radar chart - per chapter
  const chapterData = {};
  Q.forEach((q, i) => {
    const chapters = Array.isArray(q.chapter) ? q.chapter : [q.chapter];
    chapters.forEach(ch => {
      if (!ch) return;
      if (!chapterData[ch]) chapterData[ch] = { ideal: 0, actual: 0 };
      chapterData[ch].ideal += (q.time || 0) * 60;
      chapterData[ch].actual += timeSpent[i+1] || 0;
    });
  });

  const chapterLabels = Object.keys(chapterData);
  const idealChTimes = chapterLabels.map(ch => chapterData[ch].ideal);
  const actualChTimes = chapterLabels.map(ch => chapterData[ch].actual);

  const ctx2 = document.getElementById("chapterRadar");
  new Chart(ctx2, {
    type: "radar",
    data: {
      labels: chapterLabels,
      datasets: [
        {
          label: "Ideal Total (sec)",
          data: idealChTimes,
          backgroundColor: "rgba(54, 162, 235, 0.3)",
          borderColor: "rgba(54, 162, 235, 0.8)",
          pointBackgroundColor: "rgba(54, 162, 235, 1)"
        },
        {
          label: "Actual Total (sec)",
          data: actualChTimes,
          backgroundColor: "rgba(255, 99, 132, 0.3)",
          borderColor: "rgba(255, 99, 132, 0.8)",
          pointBackgroundColor: "rgba(255, 99, 132, 1)"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: "Actual vs Ideal Time per Chapter" }
      },
      scales: {
        r: {
          beginAtZero: true,
          pointLabels: { font: { size: 12 } }
        }
      }
    }
  });
})();

    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    show("summary");
  }

  // ---------- setup mode
  const setupForm = $("setupForm");
  if (setupForm) {
    setupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const inputKey = els.paperKey.value.trim() || new URLSearchParams(location.search).get("key");
      if (!inputKey) { $("err-paper").textContent = "Enter a paper key like 1styear:ape"; return; }
      $("err-paper").textContent = "";

      key = inputKey;
      const url = pathFromKey(key);
      try {
        let raw = await fetchJSON(url);
        Q = normalizeRecords(raw);
        if (els.shuffle?.checked) Q.sort(()=>Math.random()-0.5);

        const autoMins = sumTimeMinutes(Q);
        const mins = parseInt(els.duration.value, 10);
        const totalMins = Number.isFinite(mins) && mins > 0 ? mins : (autoMins || 60);

        startedAt = Date.now();
        const subject = Q[0]?.meta.subject || "Test";
        els.paperTitle.textContent = `${subject} TEST`;
        els.paperMeta.textContent  = `${Q.length} questions • ${totalMins} min`;
        setCrumbs(yearLabelFromKey(key), subject);

        renderNav(); renderQuestion();
        show("exam"); startTimer(totalMins * 60);
        document.documentElement.requestFullscreen?.().catch(()=>{});
      } catch (err) {
        $("err-paper").textContent = `Could not load ${url}`;
        console.error(err);
      }
    });
  }

  // preload for setup
  const params = new URLSearchParams(location.search);
  const k = params.get("key");
  if (k) els.paperKey.value = k;

  // ---------- Direct file mode (?paper=/tests/1st%20year/apetest.json&mix=std)
  async function loadPaperByUrl(url, fixedMinutes = 180) {
    const decoded = decodeURIComponent(url);
    const res = await fetch(encodeURI(decoded));
    if (!res.ok) throw new Error(`Failed to fetch: ${decoded}`);
    const raw = await res.json();

    let data = normalizeRecords(raw);
    if (params.get("mix") === "std") data = buildMixedPaper(data);

    Q = data;
    startedAt = Date.now();

    const subject = Q[0]?.meta.subject || "Test";
    els.paperTitle.textContent = `${subject} TEST`;
    els.paperMeta.textContent  = `${Q.length} questions • ${fixedMinutes} min`;
    setCrumbs(yearLabelFromKey(params.get("key") || ""), subject);

    renderNav(); renderQuestion(); show("exam"); startTimer(fixedMinutes * 60);
  }

  (async () => {
    const paper = params.get("paper");
    if (paper) {
      try {
        screens.setup?.classList.add("hidden");
        await loadPaperByUrl(paper, 180);   // fixed 3 hours
      } catch (err) {
        console.error(err);
        screens.setup?.classList.remove("hidden");
        const e = $("err-paper"); if (e) e.textContent = "Could not load paper file. Check the ?paper= path.";
      }
    } else {
      show("setup");
    }
  })();

})();
