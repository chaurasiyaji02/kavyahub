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

  loadDashboardData();
  loadProfile();
  loadResourcesList();
  loadVideosList();
  loadAccountsList();
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

async function uploadProfileImage(file) {

  const fileName = `${Date.now()}-${file.name}`;

  const { error } = await supabaseClient.storage
    .from("profile-images")
    .upload(fileName, file);

  if (error) {
    alert("Image Upload Error: " + error.message);
    return null;
  }

  const { data } = supabaseClient.storage
    .from("profile-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/* SIDEBAR */
document.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
    document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active-section"));

    item.classList.add("active");
    document.getElementById(item.dataset.section).classList.add("active-section");
  });
});

/* DASHBOARD */
async function loadDashboardData() {
  const { count: resourcesCount } = await supabaseClient
    .from("resources")
    .select("*", { count: "exact", head: true });

  const { count: videosCount } = await supabaseClient
    .from("videos")
    .select("*", { count: "exact", head: true });

  const { data: featured } = await supabaseClient
    .from("resources")
    .select("title")
    .eq("featured", true)
    .limit(1)
    .maybeSingle();

  const { data: latestResource } = await supabaseClient
    .from("resources")
    .select("title, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  document.getElementById("totalResources").textContent = resourcesCount || 0;
  document.getElementById("totalVideos").textContent = videosCount || 0;
  document.getElementById("featuredResource").textContent = featured?.title || "None";
  document.getElementById("latestUpload").textContent = latestResource?.title || "None";
}

/* SAVE RESOURCE */
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

  alert("Resource saved ✅");
  e.target.reset();

  loadResourcesList();
  loadDashboardData();
});

/* SAVE VIDEO */
document.getElementById("videoForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const video = {
    title: document.getElementById("videoTitle").value,
    description: document.getElementById("videoDescription").value,
    category: document.getElementById("videoCategory").value,
    youtube_link: document.getElementById("youtubeLink").value,
    resource_link: document.getElementById("videoResourceLink").value,
    upload_date: document.getElementById("videoDate").value,
    featured: document.getElementById("videoFeatured").checked
  };

  const { error } = await supabaseClient.from("videos").insert([video]);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  alert("Video saved ✅");
  e.target.reset();

  loadVideosList();
  loadDashboardData();
});

/* PROFILE LOAD */
async function loadProfile() {
  const { data, error } = await supabaseClient
    .from("profile")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (!data) return;

  document.getElementById("profileName").value = data.name || "";
  document.getElementById("profileBio").value = data.bio || "";
  document.getElementById("profileImage").value = data.profile_image || "";
  document.getElementById("youtubeUrl").value = data.youtube || "";
  document.getElementById("instagramUrl").value = data.instagram || "";
  document.getElementById("telegramUrl").value = data.telegram || "";
  document.getElementById("linkedinUrl").value = data.linkedin || "";
  document.getElementById("whatsappUrl").value = data.whatsapp || "";
}

/* PROFILE SAVE */
document.getElementById("profileForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  let imageUrl = document.getElementById("profileImage").value;

  const imageFile = document.getElementById("profileImageFile").files[0];

  if (imageFile) {
    imageUrl = await uploadProfileImage(imageFile);

    if (!imageUrl) {
      return;
    }
  }

  const profile = {
    name: document.getElementById("profileName").value,
    bio: document.getElementById("profileBio").value,
    profile_image: imageUrl,
    youtube: document.getElementById("youtubeUrl").value,
    instagram: document.getElementById("instagramUrl").value,
    telegram: document.getElementById("telegramUrl").value,
    linkedin: document.getElementById("linkedinUrl").value,
    whatsapp: document.getElementById("whatsappUrl").value,
    updated_at: new Date().toISOString()
  };

  const { data: existing } = await supabaseClient
    .from("profile")
    .select("id")
    .limit(1)
    .maybeSingle();

  let error;

  if (existing) {
    const result = await supabaseClient
      .from("profile")
      .update(profile)
      .eq("id", existing.id);

    error = result.error;
  } else {
    const result = await supabaseClient
      .from("profile")
      .insert([profile]);

    error = result.error;
  }

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  alert("Profile saved ✅");

  document.getElementById("profileImageFile").value = "";
});

/* RESOURCES LIST */
async function loadResourcesList() {
  const list = document.getElementById("resourcesList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p class="admin-empty">No resources added yet.</p>`;
    return;
  }

  list.innerHTML = data.map(item => `
    <div class="admin-list-card">
      <div>
        <h3>${item.title}</h3>
        <p>${item.category || "Resource"} • ${item.upload_date || ""}</p>
      </div>

      <button class="delete-btn" onclick="deleteResource(${item.id})">
        Delete
      </button>
    </div>
  `).join("");
}

async function deleteResource(id) {
  if (!confirm("Delete this resource?")) return;

  const { error } = await supabaseClient
    .from("resources")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  loadResourcesList();
  loadDashboardData();
}

/* VIDEOS LIST */
async function loadVideosList() {
  const list = document.getElementById("videosList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p class="admin-empty">No videos added yet.</p>`;
    return;
  }

  list.innerHTML = data.map(item => `
    <div class="admin-list-card">
      <div>
        <h3>${item.title}</h3>
        <p>${item.category || "Video"} • ${item.upload_date || ""}</p>
      </div>

      <button class="delete-btn" onclick="deleteVideo(${item.id})">
        Delete
      </button>
    </div>
  `).join("");
}

async function deleteVideo(id) {
  if (!confirm("Delete this video?")) return;

  const { error } = await supabaseClient
    .from("videos")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  loadVideosList();
  loadDashboardData();
}

/* OTHER ACCOUNTS SAVE */
document.getElementById("accountForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const account = {
    account_name: document.getElementById("accountName").value,
    platform: document.getElementById("accountPlatform").value,
    description: document.getElementById("accountDescription").value,
    url: document.getElementById("accountUrl").value,
    is_active: document.getElementById("accountActive").checked
  };

  const { error } = await supabaseClient
    .from("other_accounts")
    .insert([account]);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  alert("Account saved ✅");
  e.target.reset();

  loadAccountsList();
});

/* OTHER ACCOUNTS LIST */
async function loadAccountsList() {
  const list = document.getElementById("accountsList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("other_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p class="admin-empty">No other accounts added yet.</p>`;
    return;
  }

  list.innerHTML = data.map(item => `
    <div class="admin-list-card">
      <div>
        <h3>${item.account_name}</h3>
        <p>${item.platform || "Account"} • ${item.is_active ? "Visible" : "Hidden"}</p>
      </div>

      <div class="admin-actions">
        <button class="toggle-btn" onclick="toggleAccount(${item.id}, ${item.is_active})">
          ${item.is_active ? "Hide" : "Show"}
        </button>

        <button class="delete-btn" onclick="deleteAccount(${item.id})">
          Delete
        </button>
      </div>
    </div>
  `).join("");
}

async function toggleAccount(id, currentStatus) {
  const { error } = await supabaseClient
    .from("other_accounts")
    .update({ is_active: !currentStatus })
    .eq("id", id);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  loadAccountsList();
}

async function deleteAccount(id) {
  if (!confirm("Delete this account?")) return;

  const { error } = await supabaseClient
    .from("other_accounts")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error: " + error.message);
    return;
  }

  loadAccountsList();
}

/* SETTINGS */
document.getElementById("settingsForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  alert("Settings system next phase me connect karenge ✅");
});