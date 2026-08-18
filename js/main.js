/* ==========================================================================
   KAVYAHUB - UNIFIED GLOBAL CORE ENGINE (MOBILE & PC OPTIMIZED)
   ========================================================================== */

// 1. IMMEDIATE THEME INITIALIZER (Prevents white screen flash on load)
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

  const descriptionModalOverlay = document.getElementById("descriptionModalOverlay");
  const descriptionModalClose = document.getElementById("descriptionModalClose");

  let currentResourceLink = "";

  /* ==========================================
     B. HELPER FUNCTIONS
     ========================================== */
  function showToast(message, icon = "fa-circle-check") {
    const oldToast = document.querySelector(".kavyahub-toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = "kavyahub-toast";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 2800);
  }

  function escapeHTML(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatStructuredText(text) {
    if (!text) return "";
    const escaped = escapeHTML(text);
    return escaped
      .split("\n")
      .map(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          return `<div class="formatted-bullet">• ${trimmed.substring(2)}</div>`;
        }
        return trimmed ? `<p class="formatted-paragraph">${trimmed}</p>` : `<div class="formatted-spacer"></div>`;
      })
      .join("");
  }

  /* ==========================================
     C. UNIFIED EVENT DELEGATION PIPELINE
     ========================================== */
  document.addEventListener("click", (e) => {
    
    // 1. Resource Unlock Modal Trigger (.unlock-btn)
    const unlockButton = e.target.closest(".unlock-btn");
    if (unlockButton) {
      currentResourceLink = unlockButton.getAttribute("data-link");
      if (!currentResourceLink || currentResourceLink === "#") {
        showToast("Resource link not available yet.", "fa-circle-exclamation");
        return;
      }
      if (popupOverlay) {
        popupOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
      }
      return;
    }

    // 2. Global About / Card Clamping Modal Handler (.about-modal-trigger / fallback)
    const aboutModalBtn = e.target.closest(".about-modal-trigger");
    if (aboutModalBtn) {
      e.preventDefault();
      const card = aboutModalBtn.closest(".about-card");
      if (card && descriptionModalOverlay) {
        const title = card.getAttribute("data-title") || "About Section";
        const desc = card.getAttribute("data-desc") || "";
        const badge = card.getAttribute("data-badge") || "Info";

        const mTitle = document.getElementById("modalTitle");
        const mDesc = document.getElementById("modalDescriptionContent");
        const mBadge = document.getElementById("modalBadgeRow");
        const mMeta = document.getElementById("modalMetaInfo");
        const mAction = document.getElementById("modalActionRow");

        if (mTitle) mTitle.textContent = title;
        if (mDesc) mDesc.innerHTML = formatStructuredText(desc);
        if (mBadge) mBadge.innerHTML = `<span class="badge-pill primary-pill">${badge}</span>`;
        if (mMeta) mMeta.innerHTML = "";
        if (mAction) mAction.innerHTML = "";

        descriptionModalOverlay.style.display = "flex";
        document.body.style.overflow = "hidden";
      }
      return;
    }

    // 3. Smart Share Button Controller (.share-btn)
    const shareBtn = e.target.closest(".share-btn");
    if (shareBtn) {
      e.preventDefault();
      const rawLink = shareBtn.getAttribute("data-link") || window.location.href;
      
      if (navigator.share) {
        navigator.share({
          title: "Check this out on KavyaHub",
          url: rawLink
        }).catch(() => {});
      } else {
        if (rawLink && rawLink !== "#") {
          navigator.clipboard.writeText(rawLink)
            .then(() => showToast("Link Copied to Clipboard! 📋"))
            .catch(() => showToast("Failed to copy link.", "fa-circle-xmark"));
        } else {
          showToast("No shareable link found!", "fa-circle-exclamation");
        }
      }
      return;
    }

    // 4. Dark / Light Theme Toggle Listener
    const themeBtn = e.target.closest(".theme-toggle-btn") || e.target.closest("#themeToggleBtn");
    if (themeBtn) {
      e.preventDefault();
      const isDark = document.documentElement.classList.toggle("dark-mode");
      localStorage.setItem("kavyahub-theme", isDark ? "dark" : "light");
      showToast(`${isDark ? "Dark" : "Light"} Mode Enabled!`, isDark ? "fa-moon" : "fa-sun");
      return;
    }
  });

  /* ==========================================
     D. MOBILE SIDEBAR NAVIGATION
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
  function closeUnlockPopup() {
    if (popupOverlay) popupOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
  }

  if (continueBtn) {
    continueBtn.addEventListener("click", () => {
      closeUnlockPopup();
      if (currentResourceLink && currentResourceLink !== "#") {
        window.open(currentResourceLink, "_blank", "noopener,noreferrer");
      }
    });
  }

  if (popupClose) {
    popupClose.addEventListener("click", closeUnlockPopup);
  }

  if (popupOverlay) {
    popupOverlay.addEventListener("click", (e) => {
      if (e.target === popupOverlay) closeUnlockPopup();
    });
  }

  /* ==========================================
     F. DESCRIPTION MODAL LIFECYCLE
     ========================================== */
  function closeUniversalModal() {
    if (descriptionModalOverlay) descriptionModalOverlay.style.display = "none";
    document.body.style.overflow = "auto";
  }

  if (descriptionModalClose) {
    descriptionModalClose.addEventListener("click", closeUniversalModal);
  }

  if (descriptionModalOverlay) {
    descriptionModalOverlay.addEventListener("click", (e) => {
      if (e.target === descriptionModalOverlay) closeUniversalModal();
    });
  }

  // Escape key closer
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeUnlockPopup();
      closeUniversalModal();
    }
  });

  /* ==========================================
     G. INTELLIGENT NAVIGATION PATH LIGHTING
     ========================================== */
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split("/").pop() || "index.html";

  document.querySelectorAll(".nav-links a").forEach(link => {
    const href = link.getAttribute("href");
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });

  console.log("KavyaHub Master Blueprint Control Unit Online. 🚀");
});