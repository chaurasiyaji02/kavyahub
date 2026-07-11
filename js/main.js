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

  // UPGRADE: Dynamic Premium Description Modal Selectors
  const descriptionModalOverlay = document.getElementById("descriptionModalOverlay");
  const descriptionModalClose = document.getElementById("descriptionModalClose");

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

    // FEATURE 2: Global Clamping Toggler (.read-more-btn) -> UPGRADED TO MODAL
    const readMoreBtn = e.target.closest(".read-more-btn");
    if (readMoreBtn) {
      e.preventDefault(); // Lock form/layout shifts
      
      const modalOverlay = document.getElementById("descriptionModalOverlay");
      const card = readMoreBtn.closest(".category-card") || 
                   readMoreBtn.closest(".latest-card") || 
                   readMoreBtn.closest(".resource-card") || 
                   readMoreBtn.closest(".video-card") || 
                   readMoreBtn.closest("div[class*='card']");

      if (modalOverlay && card) {
        // Dynamic Node Extraction Engine
        const titleEl = card.querySelector("h3") || card.querySelector(".card-title");
        const descEl = card.querySelector(".resource-description") || card.querySelector("p");
        
        // 1. Parse Title
        document.getElementById("modalTitle").textContent = titleEl ? titleEl.textContent : "Resource Details";
        
        // 2. Parse Description Content with formatting preservation
        const modalDesc = document.getElementById("modalDescriptionContent");
        if (modalDesc && descEl) {
          // Extracts pristine raw text node layout strings
          modalDesc.textContent = descEl.innerText || descEl.textContent;
        }
        
        // 3. Sync Dynamic Badges & Categories Chips Row
        const badgeRow = document.getElementById("modalBadgeRow");
        if (badgeRow) {
          badgeRow.innerHTML = "";
          // Extract specific UI tag groups safely
          const originalBadges = card.querySelectorAll(".card-badges span, .category-chip, .tag, .resource-tag");
          originalBadges.forEach(badge => {
            const clone = badge.cloneNode(true);
            badgeRow.appendChild(clone);
          });
        }
        
        // 4. Sync Meta Indicators Row (Date, Real-time Views)
        const metaRow = document.getElementById("modalMetaInfo");
        if (metaRow) {
          metaRow.innerHTML = "";
          const originalMeta = card.querySelectorAll(".meta-info, .meta-text, .date, .views, span[style*='background']");
          originalMeta.forEach(meta => {
            // Skips duplicating interactive operational buttons elements
            if (!meta.closest(".unlock-btn") && !meta.closest(".share-btn") && !meta.closest(".read-more-btn")) {
              const clone = meta.cloneNode(true);
              metaRow.appendChild(clone);
            }
          });
          
          // Layout adjustment for inline meta wrapper spacing
          metaRow.style.display = "flex";
          metaRow.style.flexWrap = "wrap";
          metaRow.style.gap = "12px";
          metaRow.style.fontSize = "0.85rem";
          metaRow.style.color = "var(--text-muted, #666)";
        }
        
        // 5. Sync Action Trigger Footprint Links Elements
        const actionRow = document.getElementById("modalActionRow");
        if (actionRow) {
          actionRow.innerHTML = "";
          const actionBtn = card.querySelector(".unlock-btn") || card.querySelector(".open-btn") || card.querySelector("a.btn");
          const shareBtnEl = card.querySelector(".share-btn");
          
          if (actionBtn) {
            const cloneBtn = actionBtn.cloneNode(true);
            cloneBtn.style.flex = "1";
            cloneBtn.style.textAlign = "center";
            cloneBtn.style.display = "block";
            actionRow.appendChild(cloneBtn);
          }
          
          if (shareBtnEl) {
            const cloneShare = shareBtnEl.cloneNode(true);
            cloneShare.style.padding = "10px 15px";
            actionRow.appendChild(cloneShare);
          }
        }
        
        // Open the upgraded dynamic modal popup screen loop
        modalOverlay.style.display = "flex";
      } else {
        // Full backward compatible fallback logic stream if HTML node shell is missing
        const description = readMoreBtn.previousElementSibling;
        if (description && (description.classList.contains("resource-description") || description.tagName === "P")) {
          description.classList.toggle("expanded");
          readMoreBtn.textContent = description.classList.contains("expanded") ? "Read Less" : "Read More";
        }
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

  // UPGRADE: Dynamic Premium Description Modal Lifecycle Control Wireframe
  if (descriptionModalClose) {
    descriptionModalClose.addEventListener("click", () => {
      if (descriptionModalOverlay) descriptionModalOverlay.style.display = "none";
    });
  }

  if (descriptionModalOverlay) {
    descriptionModalOverlay.addEventListener("click", (e) => {
      if (e.target === descriptionModalOverlay) {
        descriptionModalOverlay.style.display = "none";
      }
    });
  }

  // Global escape wire binding registry
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (popupOverlay && popupOverlay.classList.contains("active")) {
        popupOverlay.classList.remove("active");
      }
      if (descriptionModalOverlay) {
        descriptionModalOverlay.style.display = "none";
      }
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