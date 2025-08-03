document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || !localStorage.getItem("isLoggedIn")) {
    window.location.href = "login.html";
    return;
  }

  const { name, regno, joinYear } = user;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const validYears = [2022, 2023, 2024, 2025];

  if (!validYears.includes(joinYear)) {
    document.getElementById("main-content").innerHTML = `
      <div class="year-access-warning">
        🚫 Invalid registration number or student not in current academic cycle.
      </div>
    `;
    return;
  }

  const actualStudyYear = (currentMonth < 6) ? currentYear - joinYear : currentYear - joinYear + 1;

  if (actualStudyYear < 1 || actualStudyYear > 4) {
    document.getElementById("main-content").innerHTML = `
      <div class="year-access-warning">
        🚫 User is outside of standard 4-year cycle.
      </div>
    `;
    return;
  }

  // ✅ Update localStorage with correct year if needed
  user.studyYear = actualStudyYear;
  localStorage.setItem("user", JSON.stringify(user));

  // ✅ Subject list by year
  const subjectsByYear = {
    1: ["Physics", "Calculus", "Engineering Mechanics"],
    2: ["DMS", "DS", "DS&CO", "DS&CN", "DA"],
    3: ["OS", "DBMS", "CN", "TOC", "AI"],
    4: ["ML", "Blockchain", "Cloud", "DL", "Project"]
  };

  // ✅ DOM elements
  const subjectContainer = document.getElementById("subject-list");
  const yearText = document.getElementById("year-indicator");
  const welcome = document.querySelector(".welcome-text");
  const otherYearsContainer = document.getElementById("other-year-buttons");

  // ✅ Welcome text
  welcome.textContent = `Welcome, ${name} 👋`;

  // ✅ Update subject header
  const yearLabel = ["1st", "2nd", "3rd", "4th"][actualStudyYear - 1];
  yearText.textContent = `Subjects in ${yearLabel} Year – MIT`;

  // ✅ Render subject cards
  const renderSubjects = (subjectArray) => {
    subjectContainer.innerHTML = "";
    subjectArray.forEach(subject => {
      const card = document.createElement("div");
      card.className = "subject-card";
      card.innerHTML = `<a href="${subject.toLowerCase().replace(/[^a-z]/g, '')}.html">${subject}</a>`;


      // Optional: Redirect on click
      card.addEventListener("click", () => {
        window.location.href = `subject.html?subject=${encodeURIComponent(subject)}`;
      });

      subjectContainer.appendChild(card);
    });
  };

  renderSubjects(subjectsByYear[actualStudyYear]);

  // ✅ Show other years (not current)
  for (let i = 1; i <= 4; i++) {
    if (i === actualStudyYear) continue;

    const button = document.createElement("button");
    button.className = "year-switch-btn";
    button.textContent = `${["1st", "2nd", "3rd", "4th"][i - 1]} Year`;
    button.addEventListener("click", () => {
      yearText.textContent = `Subjects in ${["1st", "2nd", "3rd", "4th"][i - 1]} Year – MIT`;
      renderSubjects(subjectsByYear[i]);
    });

    otherYearsContainer.appendChild(button);
  }

});
