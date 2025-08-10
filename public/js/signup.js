document.addEventListener("DOMContentLoaded", () => {
  window.utils?.redirectIfLoggedIn();

  const $ = id => document.getElementById(id);
  const err = (id, msg="") => { const el=$(id); if(el) el.textContent = msg; };

  $("signupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("name").value.trim();
    const email = $("email").value.trim();
    const password = $("password").value;
    const regno = $("regno").value.trim();

    ["err-name","err-email","err-password","err-regno"].forEach(i=>err(i,""));

    let ok = true;
    if (!name) err("err-name","Please enter your name"), ok=false;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) err("err-email","Enter a valid email"), ok=false;
    if (!password || password.length < 6) err("err-password","Use at least 6 characters"), ok=false;
    if (!/^\d{2}\d+$/.test(regno)) err("err-regno","Enter a valid registration number"), ok=false;
    if (!ok) return;

    const joinYear = parseInt("20" + regno.slice(0,2), 10);
    const now = new Date();
    const studyYear = (now.getMonth()+1 < 6)
      ? (now.getFullYear() - joinYear)
      : (now.getFullYear() - joinYear + 1);

    window.utils.saveCurrentUser({ name, email, password, regno, joinYear, studyYear });
    localStorage.setItem("signupSuccess","true");
    location.href = "login.html";
  });
});
