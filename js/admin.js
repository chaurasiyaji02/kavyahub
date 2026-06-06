const ADMIN_EMAIL = "kavyachaurasiya02@gmail.com";

const loginBox = document.getElementById("loginBox");
const adminContainer = document.querySelector(".admin-container");

async function checkAdminLogin() {
  const { data } = await supabaseClient.auth.getUser();

  if (!data.user || data.user.email !== ADMIN_EMAIL) {
    adminContainer.style.display = "none";
    loginBox.style.display = "flex";
    return;
  }

  loginBox.style.display = "none";
  adminContainer.style.display = "flex";
}

async function adminLogin(e) {
  e.preventDefault();

  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  if (data.user.email !== ADMIN_EMAIL) {
    await supabaseClient.auth.signOut();
    alert("You are not allowed to access admin panel.");
    return;
  }

  checkAdminLogin();
}

async function adminLogout() {
  await supabaseClient.auth.signOut();
  checkAdminLogin();
}

document.getElementById("loginForm")?.addEventListener("submit", adminLogin);
document.getElementById("logoutBtn")?.addEventListener("click", adminLogout);

checkAdminLogin();

/* Sidebar switching */
document.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
    document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active-section"));

    item.classList.add("active");
    document.getElementById(item.dataset.section).classList.add("active-section");
  });
});

/* Save Resource */
document.getElementById("resourceForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const resource = {
    title: document.getElementById("resourceTitle").value,
    description: document.getElementById("resourceDescription").value,
    category: document.getElementById("resourceCategory").value,
    link: document.getElementById("resourceLink").value,
    upload_date: document.getElementById("resourceDate").value,
    featured: document.getElementById("resourceFeatured").checked
  };

  const { error } = await supabaseClient.from("resources").insert([resource]);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  alert("Resource saved to Supabase ✅");
  e.target.reset();
});

/* Save Video */
document.getElementById("videoForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const video = {
    title: document.getElementById("videoTitle").value,
    description: document.getElementById("videoDescription").value,
    category: document.getElementById("videoCategory").value,
    youtube_link: document.getElementById("youtubeLink").value,
    resource_link: document.getElementById("videoResourceLink").value,
    featured: document.getElementById("videoFeatured").checked
  };

  const { error } = await supabaseClient.from("videos").insert([video]);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  alert("Video saved to Supabase ✅");
  e.target.reset();
});