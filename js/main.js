/* =====================================
   MOBILE NAVIGATION
===================================== */

const menuIcon = document.getElementById("menuIcon");
const navLinks = document.getElementById("navLinks");

if (menuIcon && navLinks) {
  menuIcon.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

/* =====================================
   POPUP LINK UNLOCK SYSTEM
===================================== */

const popupOverlay = document.getElementById("popupOverlay");
const popupClose = document.getElementById("popupClose");
const continueBtn = document.getElementById("continueBtn");

let currentLink = "";

/* Resource Buttons */

const unlockButtons = document.querySelectorAll(".unlock-btn");

unlockButtons.forEach((button) => {
  button.addEventListener("click", () => {

    currentLink = button.dataset.link;

    if (popupOverlay) {
      popupOverlay.style.display = "flex";
    }

  });
});

/* Close Popup */

if (popupClose) {
  popupClose.addEventListener("click", () => {
    popupOverlay.style.display = "none";
  });
}

/* Click Outside Popup */

if (popupOverlay) {
  popupOverlay.addEventListener("click", (e) => {

    if (e.target === popupOverlay) {
      popupOverlay.style.display = "none";
    }

  });
}

/* Continue Button */

if (continueBtn) {

  continueBtn.addEventListener("click", () => {

    popupOverlay.style.display = "none";

    if (
      currentLink &&
      currentLink !== "#" &&
      currentLink !== ""
    ) {
      window.open(currentLink, "_blank");
    }

  });

}

/* =====================================
   SMOOTH SCROLLING
===================================== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

  anchor.addEventListener("click", function (e) {

    const target = document.querySelector(
      this.getAttribute("href")
    );

    if (target) {
      e.preventDefault();

      target.scrollIntoView({
        behavior: "smooth"
      });
    }

  });

});

/* =====================================
   ACTIVE NAVIGATION LINK
===================================== */

const currentPage =
  window.location.pathname.split("/").pop();

const navItems =
  document.querySelectorAll(".nav-links a");

navItems.forEach(link => {

  const href = link.getAttribute("href");

  if (href === currentPage) {
    link.classList.add("active");
  }

});

/* =====================================
   FUTURE FEATURES PLACEHOLDER
===================================== */

// Supabase Connection
// User Analytics
// Download Counter
// Resource Search
// Calendar Integration
// Admin Panel Controls

console.log("KavyaHub Loaded Successfully");