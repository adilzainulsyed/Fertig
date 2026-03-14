document.addEventListener("DOMContentLoaded", () => {
  const user = window.utils?.getCurrentUser?.();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const setText = (id, label, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = `${label}: ${value || "-"}`;
  };

  setText("profile-name", "Name", user.name);
  setText("profile-email", "Email", user.email);
  setText("profile-reg", "Registration Number", user.registration_number);
  setText("profile-year", "Year", user.yearInCollege ? `${user.yearInCollege}` : "-");
});
