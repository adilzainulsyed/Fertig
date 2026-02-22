window.utils = {
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
  redirectIfLoggedIn(){ if(this.isLoggedIn()){ window.location.href = "index.html"; } },
  logout(){ localStorage.removeItem("authToken"); localStorage.removeItem("isLoggedIn"); window.location.href = "login.html"; }
};
