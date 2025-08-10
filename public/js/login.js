document.addEventListener("DOMContentLoaded", () => {
  window.utils?.redirectIfLoggedIn();

  const $ = id => document.getElementById(id);
  const showErr = (id, msg="") => { const el=$(id); if(el) el.textContent = msg; };

  if (localStorage.getItem("signupSuccess") === "true") {
    const m = $("welcome-message"); if (m) m.textContent = "Account created successfully. Please log in.";
    localStorage.removeItem("signupSuccess");
  }

  $("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("email").value.trim();
    const password = $("password").value;

    showErr("err-email",""); showErr("err-password","");
    if (!email) { showErr("err-email","Enter your email."); return; }
    if (!password) { showErr("err-password","Enter your password."); return; }

    const user = window.utils.getCurrentUser();
    if (!user || user.email !== email || user.password !== password) {
      showErr("err-password","Invalid email or password."); return;
    }
    localStorage.setItem("isLoggedIn","true");
    location.href = "index.html";
  });
});
