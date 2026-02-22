document.addEventListener("DOMContentLoaded", () => {
  window.utils?.redirectIfLoggedIn();

  const $ = id => document.getElementById(id);
  const err = (id, msg="") => { const el=$(id); if(el) el.textContent = msg; };

  $("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("name").value.trim();
    const email = $("email").value.trim();
    const password = $("password").value;
    const confirmPassword = $("confirmPassword").value;
    const registration_number = $("regno").value.trim();

    ["err-name","err-email","err-password","err-confirmPassword","err-regno"].forEach(i=>err(i,""));

    let ok = true;
    if (!name) err("err-name","Please enter your name"), ok=false;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) err("err-email","Enter a valid email"), ok=false;
    if (!password || password.length < 6) err("err-password","Use at least 6 characters"), ok=false;
    if (password !== confirmPassword) err("err-confirmPassword","Passwords do not match"), ok=false;
    if (!registration_number || !/^\d{4,}$/.test(registration_number)) err("err-regno","Registration number must be at least 4 digits"), ok=false;
    if (!ok) return;

    try {
      const response = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword, registration_number })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error.includes("email")) err("err-email", data.error);
        else if (data.error.includes("registration")) err("err-regno", data.error);
        else if (data.error.includes("password")) err("err-password", data.error);
        else err("err-email", data.error || "Signup failed");
        return;
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("signupSuccess", "true");
      location.href = "login.html";
    } catch (error) {
      err("err-email", "An error occurred. Please try again.");
    }
  });
});
