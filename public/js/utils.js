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
  initMainNavIndicator(){
    const navInner = document.querySelector(".main-nav .main-nav-inner");
    if (!navInner) return;

    const activeLink = navInner.querySelector(".nav-link.active");
    if (!activeLink) return;

    let indicator = navInner.querySelector(".main-nav-indicator");
    if (!indicator) {
      indicator = document.createElement("span");
      indicator.className = "main-nav-indicator";
      navInner.appendChild(indicator);
    }

    const storageKey = "fertig:main-nav-indicator";
    const getMetrics = (link) => {
      const width = Math.min(24, Math.max(16, Math.round(link.offsetWidth * 0.28)));
      const left = link.offsetLeft + Math.round((link.offsetWidth - width) / 2);
      return { left, width };
    };

    const applyMetrics = (metrics, animated) => {
      indicator.style.transition = animated
        ? "transform .32s cubic-bezier(.4,0,.2,1), width .32s cubic-bezier(.4,0,.2,1), opacity .2s ease"
        : "none";
      indicator.style.width = `${metrics.width}px`;
      indicator.style.transform = `translateX(${metrics.left}px)`;
      indicator.classList.add("is-visible");
    };

    const saveMetrics = () => {
      const metrics = getMetrics(activeLink);
      sessionStorage.setItem(storageKey, JSON.stringify(metrics));
    };

    const previousMetricsRaw = sessionStorage.getItem(storageKey);
    const currentMetrics = getMetrics(activeLink);

    if (previousMetricsRaw) {
      try {
        const previousMetrics = JSON.parse(previousMetricsRaw);
        applyMetrics(previousMetrics, false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            applyMetrics(currentMetrics, true);
            saveMetrics();
          });
        });
      } catch {
        applyMetrics(currentMetrics, false);
        saveMetrics();
      }
    } else {
      applyMetrics(currentMetrics, false);
      saveMetrics();
    }

    window.addEventListener("resize", () => {
      const resizedMetrics = getMetrics(activeLink);
      applyMetrics(resizedMetrics, false);
      saveMetrics();
    });

    navInner.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        sessionStorage.setItem(storageKey, JSON.stringify(getMetrics(activeLink)));
      });
    });
  },
  protectRoute(){ if(!this.isLoggedIn()){ window.location.href = "login.html"; } },
  redirectIfLoggedIn(){ if(this.isLoggedIn()){ window.location.href = "home.html"; } },
  logout(){ localStorage.removeItem("authToken"); localStorage.removeItem("isLoggedIn"); window.location.href = "login.html"; }
};

document.addEventListener("DOMContentLoaded", () => {
  window.utils?.initMainNavIndicator?.();
});
