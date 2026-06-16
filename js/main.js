document.addEventListener("DOMContentLoaded", () => {
  /* ==========================================
     1. MOBILE MENU SYSTEM
     ========================================== */
  const menuIcon = document.getElementById("menuIcon");
  const navLinks = document.getElementById("navLinks");

  if (menuIcon && navLinks) {
    // Toggle mobile menu
    menuIcon.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevents immediate closing from outside click handler
      navLinks.classList.toggle("active");
    });

    // Enhancement: Close mobile menu when clicking outside (Crucial for Mobile UX)
    document.addEventListener("click", (e) => {
      if (navLinks.classList.contains("active") && !navLinks.contains(e.target) && e.target !== menuIcon) {
        navLinks.classList.remove("active");
      }
    });
  }

  /* ==========================================
     2. POPUP SYSTEM (RESOURCES & VIDEOS)
     ========================================== */
  const popupOverlay = document.getElementById("popupOverlay");
  const popupClose = document.getElementById("popupClose");
  const continueBtn = document.getElementById("continueBtn");

  // Local state variable instead of window pollution
  let currentResourceLink = "";

  /* Any Resource Button Click (Event Delegation) */
  document.addEventListener("click", (e) => {
    const unlockButton = e.target.closest(".unlock-btn");
    if (!unlockButton) return;

    currentResourceLink = unlockButton.getAttribute("data-link");
    console.log("Resource Link:", currentResourceLink);

    if (!currentResourceLink || currentResourceLink === "#") {
      alert("Resource link not added yet.");
      return;
    }

    // Optimization: Using class instead of inline display for modern CSS animations
    if (popupOverlay) {
      popupOverlay.classList.add("active");
    }
  });

  /* Continue Button Actions */
  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      if (popupOverlay) {
        popupOverlay.classList.remove("active");
      }

      if (currentResourceLink && currentResourceLink !== "#") {
        window.open(currentResourceLink, "_blank", "noopener,noreferrer"); // Added security headers
      }
    });
  }

  /* Close Popup via Close Button */
  if (popupClose) {
    popupClose.addEventListener("click", () => {
      popupOverlay.classList.remove("active");
    });
  }

  /* Close Popup by Clicking Outside Overlay */
  if (popupOverlay) {
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) {
        popupOverlay.classList.remove("active");
      }
    });
  }

  /* Enhancement: Close Popup via ESC Key (PC Accessibility) */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popupOverlay && popupOverlay.classList.contains("active")) {
      popupOverlay.classList.remove("active");
    }
  });

  /* ==========================================
     3. ACTIVE NAV LINK HIGHLIGHTER
     ========================================== */
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split("/").pop();

  document.querySelectorAll(".nav-links a").forEach(link => {
    const href = link.getAttribute("href");

    // Fix: Handles edge cases like home path "/" or exact page match
    if (href === currentPage || 
        (currentPath === "/" && (href === "index.html" || href === "/")) ||
        (href && currentPath.endsWith(href))) {
      link.classList.add("active");
    }
  });

  console.log("KavyaHub Main JS Loaded & Optimized");
});