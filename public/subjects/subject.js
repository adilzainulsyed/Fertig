document.addEventListener("DOMContentLoaded", async () => {
  // route guard
  window.utils?.protectRoute();
  const $ = id => document.getElementById(id);

  // ---------- parse key like ?key=2ndyear:ds ----------
  const params = new URLSearchParams(location.search);
  const key = params.get("key");
  if (!key) { document.body.innerHTML = "<p style='padding:24px'>Invalid subject (missing key).</p>"; return; }

  const normalizedKey = key.replace(/\s+/g, "").replace(/-/g, ""); // "2ndyear:ds"
  const [yearFolderRaw, slug] = normalizedKey.split(":");
  if (!yearFolderRaw || !slug) { document.body.innerHTML = "<p style='padding:24px'>Invalid subject key.</p>"; return; }

  const yearFolder =
    yearFolderRaw.includes("1st") ? "1st year" :
      yearFolderRaw.includes("2nd") ? "2nd year" :
        yearFolderRaw.includes("3rd") ? "3rd year" :
          yearFolderRaw.includes("4th") ? "4th year" : yearFolderRaw;

  // display names (acronyms)
  const NAMES = {
    ds: "DS", dms: "DMS", dsco: "DS & CO", dccn: "DC & CN", da: "DA",
    ape: "APE", bmes: "BMES", fe: "FE", eng: "ENG",
    cm1: "CM - I", cm2: "CM - II", ace: "ACE", fee: "FEE", emsb: "EMSB", evs: "EVS"
  };
  const toTitle = s => s.replace(/[-_]/g, " ").replace(/\b\w/g, m => m.toUpperCase());
  const subjectTitle = NAMES[slug] || toTitle(slug);

  // ---------- header / crumbs ----------
  const yearNum = yearFolder[0];                       // "1".."4"
  const yearHref = `../../index.html?year=${yearNum}`; // open that year explicitly
  const yearLink = $("crumb-year");
  if (yearLink) { yearLink.setAttribute("href", yearHref); yearLink.textContent = yearFolder; }
  $("crumb-subject").textContent = subjectTitle;
  document.title = `${subjectTitle} | Fertig`;
  $("title").textContent = subjectTitle;
  $("subtitle").textContent = "Chapter-wise PYQs with difficulty & search.";
  $("logoutBtn")?.addEventListener("click", () => utils.logout());

  // optional per-subject css: subjects/<year>/<slug>.css
  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = `${yearFolder}/${slug}.css`;
  document.head.appendChild(css);

  // ---------- load JSON (works from any path) ----------
  async function fetchJSON(path) {
    const res = await fetch(encodeURI(path));
    if (!res.ok) throw new Error(`fetch failed: ${path}`);
    return res.json();
  }
  const currentPath = decodeURIComponent(location.pathname);
  const inYearFolder = currentPath.includes(`/${yearFolder}/`);
  const candidates = inYearFolder
    ? [`./${slug}.json`, `../${yearFolder}/${slug}.json`, `${yearFolder}/${slug}.json`]
    : [`${yearFolder}/${slug}.json`, `./${yearFolder}/${slug}.json`];

  let raw = [];
  for (const p of candidates) { try { raw = await fetchJSON(p); break; } catch { } }
  if (!raw.length) { $("list").innerHTML = `<p class="muted">Could not load data for ${slug}.</p>`; return; }

  // ---------- normalize ----------
  const rows = raw.map((q, i) => ({
    id: q.id || `q${i + 1}`,
    year: q.source_year ?? q.year ?? "",
    difficulty: (q.difficulty || "").toLowerCase(),     // easy|medium|hard
    question: q.question || q.question_text || "",
    solution: q.solution || "",
    images: Array.isArray(q.images)
      ? q.images.map(src => src && src.startsWith("data/") ? `../../${src}` : src)
      : []
  }));

  // ---------- filters: year + difficulty ----------
  const years = [...new Set(rows.map(r => r.year).filter(Boolean))].sort((a, b) => b - a);
  const yearFilter = $("yearFilter");
  years.forEach(y => { const o = document.createElement("option"); o.value = y; o.textContent = y; yearFilter.appendChild(o); });

  // ---------- formatting helpers (code + subparts) ----------
  const list = $("list");

  const escapeHTML = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const normalizeAscii = s => s
    .replace(/\u2013|\u2212/g, "-")   // dashes
    .replace(/\u201c|\u201d/g, '"')   // quotes
    .replace(/\u2018|\u2019/g, "'");  // apostrophes

  // break lines before a) b) ... and (i) (ii) ...
  function breakSubparts(txt) {
    if (!txt) return txt;
    let t = normalizeAscii(txt);
    t = t.replace(/(\s|^)([a-h]\))\s/gi, '\n$2 ');      // a) b) …
    t = t.replace(/(\s|^)\(([ivx]+)\)\s/gi, '\n($2) '); // (i) (ii) …
    return t;
  }
  // Join accidental line breaks inside logic/math expressions
  function fixBrokenMath(block) {
    let t = block;

    // operators split over a newline → join with spaces
    t = t.replace(/(∧|∨|=|≤|≥|→|↔)\s*\n\s*/g, ' $1 ');

    // breaks just after/before parentheses or brackets
    t = t.replace(/\(\s*\n\s*/g, '(');
    t = t.replace(/\s*\n\s*\)/g, ')');
    t = t.replace(/\[\s*\n\s*/g, '[');
    t = t.replace(/\s*\n\s*\]/g, ']');

    // comma then newline
    t = t.replace(/,\s*\n\s*/g, ', ');

    // variable/letter/number split by a single newline → join
    t = t.replace(/([A-Za-z0-9])\s*\n\s*([A-Za-z0-9(])/g, '$1 $2');

    return t;
  }


  const looksLikeCodeLine = ln => /#include|^\s*(int|void)\s+main\s*\(|printf\s*\(|scanf\s*\(|struct\s+|for\s*\(|while\s*\(|if\s*\(|\{|\};?/.test(ln);

  const formatCompactC = s => {
    let t = normalizeAscii(s);
    t = t.replace(/\s*;\s*/g, ';\n');
    t = t.replace(/\{\s*/g, '{\n');
    t = t.replace(/\s*\}\s*/g, '\n}\n');
    return t;
  };

  function renderTextWithCode(rawText) {
    if (!rawText) return "";
    const text = normalizeAscii(rawText);
    const lines = text.split(/\r?\n/);

    // single-line but code-ish → split nicely
    if (lines.length === 1 && /;|#include|\b(main|printf|scanf)\b|\{|\}/.test(text)) {
      const code = formatCompactC(text);
      return `<pre><code>${escapeHTML(code)}</code></pre>`;
    }

    const firstCode = lines.findIndex(looksLikeCodeLine);

    if (firstCode === -1) {
      // keep real paragraphs, but fix math within each paragraph block
      const blocks = breakSubparts(text).split(/\n{2,}/).map(b => fixBrokenMath(b.trim()));
      const html = blocks.map(b =>
        `<p class="qpara">${escapeHTML(b).replace(/\n/g, "<br>")}</p>`
      ).join("");
      return html || "";
    }


    const preface = lines.slice(0, firstCode).join("\n").trim();
    const codeBlock = lines.slice(firstCode).join("\n");

    let html = "";
    if (preface) {
      const t = fixBrokenMath(breakSubparts(preface));
      html += `<p class="qpara">${escapeHTML(t).replace(/\n/g, "<br>")}</p>`;
    }

    const pretty = /;\s|#include|\{|\}/.test(codeBlock) ? formatCompactC(codeBlock) : codeBlock;
    html += `<pre><code>${escapeHTML(pretty)}</code></pre>`;
    return html;
  }

  const pillClass = d => d === "easy" ? "success" : d === "medium" ? "info" : "warn";
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

  function render() {
    const y = yearFilter.value;
    const d = $("difficultyFilter").value.toLowerCase();

    const filtered = rows.filter(r =>
      (!y || String(r.year) === String(y)) &&
      (!d || r.difficulty === d)
    );

    list.innerHTML = "";
    if (!filtered.length) { list.innerHTML = `<p class="muted">No questions match the filters.</p>`; return; }

    filtered.forEach(r => {
      const card = document.createElement("article");
      card.className = "qa";

      const meta = document.createElement("div");
      meta.className = "meta";
      if (r.difficulty) { const b1 = document.createElement("span"); b1.className = `badge ${pillClass(r.difficulty)}`; b1.textContent = cap(r.difficulty); meta.appendChild(b1); }
      if (r.year) { const b2 = document.createElement("span"); b2.className = "badge"; b2.textContent = r.year; meta.appendChild(b2); }
      card.appendChild(meta);

      const qwrap = document.createElement("div");
      qwrap.className = "body qtext";
      qwrap.innerHTML = renderTextWithCode(r.question);
      card.appendChild(qwrap);

      if (r.images && r.images.length) {
        const at = document.createElement("div");
        at.className = "attachments";
        r.images.forEach(src => {
          const img = document.createElement("img");
          img.src = src.startsWith("data/") ? `../../${src}` : src;
          img.alt = "Attachment";
          img.loading = "lazy";
          at.appendChild(img);
        });
        card.appendChild(at);
      }

      const btn = document.createElement("button");
      btn.className = "btn-outlined";
      btn.textContent = "Show Solution";
      card.appendChild(btn);

      const sol = document.createElement("div");
      sol.className = "sol hidden qtext";
      sol.innerHTML = r.solution ? renderTextWithCode(r.solution) : "Solution not available yet.";
      card.appendChild(sol);

      btn.addEventListener("click", () => {
        const hidden = sol.classList.toggle("hidden");
        btn.textContent = hidden ? "Show Solution" : "Hide Solution";
      });

      list.appendChild(card);
    });
  }

  yearFilter.addEventListener("change", render);
  $("difficultyFilter").addEventListener("change", render);
  $("clearFilters").addEventListener("click", () => {
    yearFilter.value = "";
    $("difficultyFilter").value = "";
    render();
  });

  render();
});
