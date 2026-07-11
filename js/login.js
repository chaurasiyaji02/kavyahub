/* ==========================================================================
   KAVYAHUB - ADMINISTRATIVE SECURE AUTHENTICATION CONTROLLER
   ========================================================================== */

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    try {
      // Supabase Auth call processing securely via database layer keys
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        alert(`Authentication Failed: ${error.message}`);
        return;
      }

      // Valid session generated successfully
      if (data?.session) {
        window.location.href = "admin.html";
      }
    } catch (err) {
      console.error("Login process critical exception:", err);
      alert("An unexpected error occurred during session verification.");
    }
  });
}