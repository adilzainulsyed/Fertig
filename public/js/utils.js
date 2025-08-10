window.utils = {
  isLoggedIn(){ return localStorage.getItem("isLoggedIn") === "true"; },
  getCurrentUser(){ try { return JSON.parse(localStorage.getItem("user")) || null; } catch { return null; } },
  saveCurrentUser(u){ localStorage.setItem("user", JSON.stringify(u)); },
  protectRoute(){ if(!this.isLoggedIn()){ window.location.href = "login.html"; } },
  redirectIfLoggedIn(){ if(this.isLoggedIn()){ window.location.href = "index.html"; } },
  logout(){ localStorage.removeItem("isLoggedIn"); window.location.href = "login.html"; }
};
