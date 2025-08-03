window.utils = {
  isLoggedIn: function () {
    return localStorage.getItem("isLoggedIn") === "true";
  },

  getCurrentUser: function () {
    return JSON.parse(localStorage.getItem("user"));
  },

  protectRoute: function () {
    if (!this.isLoggedIn()) {
      window.location.href = "login.html";
    }
  },

  logout: function () {
    localStorage.removeItem("isLoggedIn");
    window.location.href = "login.html";
  }
};
