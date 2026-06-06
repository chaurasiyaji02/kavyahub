/* MOBILE MENU */
const menuIcon = document.getElementById("menuIcon");
const navLinks = document.getElementById("navLinks");

if (menuIcon && navLinks) {
  menuIcon.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

/* POPUP SYSTEM */
const popupOverlay = document.getElementById("popupOverlay");
const popupClose = document.getElementById("popupClose");
const continueBtn = document.getElementById("continueBtn");

window.currentLink = "";

/* Any Resource Button Click */
document.addEventListener("click", (e) => {
  const unlockButton = e.target.closest(".unlock-btn");

  if (!unlockButton) return;

  window.currentLink = unlockButton.getAttribute("data-link");

  console.log("Resource Link:", window.currentLink);

  if (!window.currentLink || window.currentLink === "#") {
    alert("Resource link not added yet.");
    return;
  }

  if (popupOverlay) {
    popupOverlay.style.display = "flex";
  }
});

/* Continue Button */
if (continueBtn) {
  continueBtn.addEventListener("click", () => {
    if (popupOverlay) {
      popupOverlay.style.display = "none";
    }

    if (window.currentLink && window.currentLink !== "#") {
      window.open(window.currentLink, "_blank");
    }
  });
}

/* Close Popup */
if (popupClose) {
  popupClose.addEventListener("click", () => {
    popupOverlay.style.display = "none";
  });
}

/* Close Popup Outside */
if (popupOverlay) {
  popupOverlay.addEventListener("click", (e) => {
    if (e.target === popupOverlay) {
      popupOverlay.style.display = "none";
    }
  });
}

/* ACTIVE NAV */
const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll(".nav-links a").forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.classList.add("active");
  }
});

console.log("Main JS Loaded");