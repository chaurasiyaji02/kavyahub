/* ==========================================================================
   KAVYAHUB - ADMINISTRATIVE SECURE AUTHENTICATION CONTROLLER
   ========================================================================== */

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const authAlert = document.getElementById("authAlert");

const ADMIN_EMAIL = "kavyachaurasiya02@gmail.com";

// Check if user is already logged in
(async function checkExistingSession() {
  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session && session.user?.email === ADMIN_EMAIL) {
      window.location.replace("admin.html");
    }
  } catch (err) {
    console.error("Session check error:", err);
  }
})();

function showAuthAlert(message, type = "error") {
  if (!authAlert) return;

  const isError = type === "error";
  authAlert.style.display = "flex";
  authAlert.style.background = isError ? "rgba(239, 68, 68, 0.12)" : "rgba(34, 197, 94, 0.12)";
  authAlert.style.border = `1px solid ${isError ? "#ef4444" : "#22c55e"}`;
  authAlert.style.color = isError ? "#ef4444" : "#22c55e";
  authAlert.innerHTML = `
    <i class="fa-solid ${isError ? 'fa-circle-exclamation' : 'fa-circle-check'}"></i>
    <span>${message}</span>
  `;
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (loginSubmitBtn) {
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...`;
    }

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        showAuthAlert(`Authentication Failed: ${error.message}`, "error");
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Sign In to Dashboard`;
        }
        return;
      }

      if (data?.user?.email !== ADMIN_EMAIL) {
        await supabaseClient.auth.signOut();
        showAuthAlert("Access Denied: You are not authorized to access this dashboard.", "error");
        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Sign In to Dashboard`;
        }
        return;
      }

      showAuthAlert("Verification Successful! Redirecting...", "success");
      setTimeout(() => {
        window.location.replace("admin.html");
      }, 500);

    } catch (err) {
      console.error("Login process critical exception:", err);
      showAuthAlert("An unexpected error occurred during verification. Please try again.", "error");
      if (loginSubmitBtn) {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Sign In to Dashboard`;
      }
    }
  });
}