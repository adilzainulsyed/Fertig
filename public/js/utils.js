window.utils = {
  getThemeIcon(theme){
    if (theme === "dark") {
      return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6.5 6.5 0 1 0 9 9 8 8 0 1 1-9-9z"></path></svg>';
    }
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2"></path><path d="M12 20v2"></path><path d="M4.93 4.93l1.41 1.41"></path><path d="M17.66 17.66l1.41 1.41"></path><path d="M2 12h2"></path><path d="M20 12h2"></path><path d="M4.93 19.07l1.41-1.41"></path><path d="M17.66 6.34l1.41-1.41"></path></svg>';
  },
  setThemeToggleIcon(button, theme){
    if (!button) return;
    button.innerHTML = this.getThemeIcon(theme);
  },
  isLoggedIn(){ return !!localStorage.getItem("authToken"); },
  getCurrentUser(){ 
    try { 
      const token = localStorage.getItem("authToken");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.id, name: payload.name, email: payload.email, registration_number: payload.registration_number, yearInCollege: payload.yearInCollege };
    } catch { return null; } 
  },
  protectRoute(){ if(!this.isLoggedIn()){ window.location.href = "login.html"; } },
  redirectIfLoggedIn(){ if(this.isLoggedIn()){ window.location.href = "home.html"; } },
  logout(){ localStorage.removeItem("authToken"); localStorage.removeItem("isLoggedIn"); window.location.href = "login.html"; }
};
