/* ==========================================================================
   KAVYAHUB - UNIFIED GLOBAL CORE ENGINE (MOBILE & PC OPTIMIZED)
   ========================================================================== */

// 1. IMMEDIATE THEME INITIALIZER (Prevents annoying white screen flashes on load)
(function initTheme() {
  const savedTheme = localStorage.getItem("kavyahub-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  
  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add("dark-mode");
  } else {
    document.documentElement.classList.remove("dark-mode");
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  console.log("KavyaHub Global Engine Initializing...");

  /* ==========================================
     A. DOM ELEMENTS SELECTION
     ========================================== */
  const menuIcon = document.getElementById("menuIcon");
  const navLinks = document.getElementById("navLinks");
  const popupOverlay = document.getElementById("popupOverlay");
  const popupClose = document.getElementById("popupClose");
  const continueBtn = document.getElementById("continueBtn");

  let currentResourceLink = ""; // Safe contextual register for lock screen routing

  /* ==========================================
     B. TOAST NOTIFICATION UTILITY (Cross-Platform Safe)
     ========================================== */
  function showToast(message) {
    // Remove existing toast if any to prevent cluttering mobile screen
    const oldToast = document.querySelector(".kavyahub-toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = "kavyahub-toast";
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
    document.body.appendChild(toast);

    // Dynamic clean removal cycle
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 2500);
  }

  /* ==========================================
     C. UNIFIED EVENT DELEGATION PIPELINE (RAM & Battery Safe)
     ========================================== */
  document.addEventListener("click", (e) => {
    
    // FEATURE 1: Resource Unlock Trigger (.unlock-btn)
    const unlockButton = e.target.closest(".unlock-btn");
    if (unlockButton) {
      currentResourceLink = unlockButton.getAttribute("data-link");
      if (!currentResourceLink || currentResourceLink === "#") {
        alert("Resource link not added yet.");
        return;
      }
      if (popupOverlay) popupOverlay.classList.add("active");
      return;
    }

    // FEATURE 2: Global Clamping Toggler (.read-more-btn)
    const readMoreBtn = e.target.closest(".read-more-btn");
    if (readMoreBtn) {
      e.preventDefault(); // Lock form/layout shifts
      const description = readMoreBtn.previousElementSibling;
      if (description && (description.classList.contains("resource-description") || description.tagName === "P")) {
        description.classList.toggle("expanded");
        readMoreBtn.textContent = description.classList.contains("expanded") ? "Read Less" : "Read More";
      }
      return;
    }

    // FEATURE 3: Smart Quick Link Copy Controller (.share-btn)
    const shareBtn = e.target.closest(".share-btn");
    if (shareBtn) {
      e.preventDefault();
      const rawLink = shareBtn.getAttribute("data-link");
      if (rawLink && rawLink !== "#") {
        navigator.clipboard.writeText(rawLink)
          .then(() => showToast("Link Copied to Clipboard! 📋"))
          .catch(() => alert("Failed to copy link. Please manually copy the URL."));
      } else {
        showToast("No active link available to share!");
      }
      return;
    }

    // FEATURE 4: Dark Mode Click Listener (.theme-toggle-btn / #themeToggleBtn)
    const themeBtn = e.target.closest(".theme-toggle-btn") || e.target.closest("#themeToggleBtn");
    if (themeBtn) {
      e.preventDefault();
      const isDark = document.documentElement.classList.toggle("dark-mode");
      localStorage.setItem("kavyahub-theme", isDark ? "dark" : "light");
      showToast(`${isDark ? "Dark Theme" : "Light Theme"} Activated!`);
      return;
    }
  });

  /* ==========================================
     D. MOBILE SIDEBAR NAVIGATION MANAGEMENT
     ========================================== */
  if (menuIcon && navLinks) {
    menuIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      navLinks.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (navLinks.classList.contains("active") && !navLinks.contains(e.target) && e.target !== menuIcon) {
        navLinks.classList.remove("active");
      }
    });
  }

  /* ==========================================
     E. OVERLAY POPUP SUBSCRIPTION ROUTING
     ========================================== */
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      if (popupOverlay) popupOverlay.classList.remove("active");
      if (currentResourceLink && currentResourceLink !== "#") {
        window.open(currentResourceLink, "_blank", "noopener,noreferrer");
      }
    });
  }

  if (popupClose) {
    popupClose.addEventListener("click", () => popupOverlay.classList.remove("active"));
  }

  if (popupOverlay) {
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) popupOverlay.classList.remove("active");
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popupOverlay && popupOverlay.classList.contains("active")) {
      popupOverlay.classList.remove("active");
    }
  });

  /* ==========================================
     F. INTELLIGENT NAVIGATION PATH LIGHTING
     ========================================== */
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split("/").pop();

  document.querySelectorAll(".nav-links a").forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPage || 
        (currentPath === "/" && (href === "index.html" || href === "/")) ||
        (href && currentPath.endsWith(href))) {
      link.classList.add("active");
    }
  });

  console.log("KavyaHub Master Blueprint Control Unit Online. 🚀");
});