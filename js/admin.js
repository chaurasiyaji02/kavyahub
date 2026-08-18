/* ==========================================================================
   KAVYAHUB - ADMIN DASHBOARD CONTROLLER (OPTIMIZED, FORMATTED & SECURE)
   ========================================================================== */

const ADMIN_EMAIL = "kavyachaurasiya02@gmail.com";

const loginBox = document.getElementById("loginBox");
const adminContainer = document.querySelector(".admin-container");

let editingResourceId = null;
let editingVideoId = null;

// SECURE GATEKEEPER CHECK: Redirects unauthorized visitors instantly before rendering components
(async function checkAdminSession() {
  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    
    if (error || !session) {
      console.log("No active session found, redirecting to login page...");
      window.location.replace("login.html");
      return;
    }

    if (session.user?.email !== ADMIN_EMAIL) {
      await supabaseClient.auth.signOut();
      window.location.replace("login.html");
      return;
    }

    checkAdminLogin();
  } catch (err) {
    console.error("Auth gatekeeper runtime exception:", err);
    window.location.replace("login.html");
  }
})();

/* --------------------------------------------------------------------------
   1. STRING & TAG UTILITIES
   -------------------------------------------------------------------------- */

function parseTags(value) {
  if (!value) return [];
  return value
    .split(",")
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag !== "");
}

function tagsToText(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

function getCheckedTags(className) {
  return Array.from(document.querySelectorAll(`.${className}:checked`))
    .map(input => input.value.trim().toLowerCase());
}

function setCheckedTags(className, tags) {
  const selectedTags = Array.isArray(tags) ? tags.map(t => String(t).toLowerCase()) : [];
  document.querySelectorAll(`.${className}`).forEach(input => {
    input.checked = selectedTags.includes(input.value.toLowerCase());
  });
}

function clearCheckedTags(className) {
  document.querySelectorAll(`.${className}`).forEach(input => {
    input.checked = false;
  });
}

function sanitizeTextarea(value) {
  if (!value) return "";
  return value.trim();
}

/* --------------------------------------------------------------------------
   1B. DYNAMIC METADATA ROW VISIBILITY MANAGER
   -------------------------------------------------------------------------- */

function toggleMetaRows() {
  const category = document.getElementById("resourceCategory")?.value;
  const videoCategory = document.getElementById("videoCategory")?.value;
  
  const jobRow = document.getElementById("jobMetaRow");
  const hackathonRow = document.getElementById("hackathonMetaRow");
  const orgRow = document.getElementById("orgMetaRow");
  const videoOrgRow = document.getElementById("videoOrgMetaRow");

  // Job & Internship
  if (jobRow) {
    jobRow.style.display = (category === "job" || category === "internship") ? "grid" : "none";
  }
  
  // Hackathon
  if (hackathonRow) {
    hackathonRow.style.display = (category === "hackathon") ? "grid" : "none";
  }
  
  // Organization Sector (Govt vs Private)
  if (orgRow) {
    orgRow.style.display = (category === "job" || category === "internship" || category === "hackathon" || category === "scholarship" || category === "certificate" || category === "course") ? "grid" : "none";
  }
  
  // Video Org Sector
  if (videoOrgRow) {
    videoOrgRow.style.display = (videoCategory === "job" || videoCategory === "career" || videoCategory === "course" || videoCategory === "certificate" || videoCategory === "scholarship") ? "grid" : "none";
  }
}

document.getElementById("resourceCategory")?.addEventListener("change", toggleMetaRows);
document.getElementById("videoCategory")?.addEventListener("change", toggleMetaRows);

/* --------------------------------------------------------------------------
   2. UI NAVIGATION MANAGEMENT
   -------------------------------------------------------------------------- */

function setActiveSection(sectionId) {
  document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
  document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active-section"));

  document.querySelector(`[data-section="${sectionId}"]`)?.classList.add("active");
  document.getElementById(sectionId)?.classList.add("active-section");
}

document.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", () => {
    setActiveSection(item.dataset.section);
  });
});

/* --------------------------------------------------------------------------
   3. AUTHENTICATION SYSTEM (LOGIN / LOGOUT)
   -------------------------------------------------------------------------- */

async function checkAdminLogin() {
  const { data } = await supabaseClient.auth.getUser();

  if (!data.user || data.user.email !== ADMIN_EMAIL) {
    if (adminContainer) adminContainer.style.display = "none";
    window.location.replace("login.html");
    return;
  }

  if (loginBox) loginBox.style.display = "none";
  if (adminContainer) adminContainer.style.display = "flex";

  toggleMetaRows();

  loadDashboardData();
  loadProfile();
  loadResourcesList();
  loadVideosList();
  loadAccountsList();
}

async function adminLogout() {
  await supabaseClient.auth.signOut();
  window.location.replace("login.html");
}

document.getElementById("logoutBtn")?.addEventListener("click", adminLogout);

/* --------------------------------------------------------------------------
   4. STORAGE MANAGEMENT (PROFILE IMAGE)
   -------------------------------------------------------------------------- */

async function uploadProfileImage(file) {
  const fileExt = file.name.split('.').pop();
  const fileName = `profile-${Date.now()}.${fileExt}`;

  const { error } = await supabaseClient.storage
    .from("profile-images")
    .upload(fileName, file, { upsert: true });

  if (error) {
    alert("Image Upload Error: " + error.message);
    return null;
  }

  const { data } = supabaseClient.storage
    .from("profile-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

/* --------------------------------------------------------------------------
   5. DASHBOARD STATS CALCULATION
   -------------------------------------------------------------------------- */

async function loadDashboardData() {
  try {
    const [
      resCountResult,
      vidCountResult,
      featuredResult,
      latestResult,
      topResResult,
      topVidResult
    ] = await Promise.all([
      supabaseClient.from("resources").select("*", { count: "exact", head: true }),
      supabaseClient.from("videos").select("*", { count: "exact", head: true }),
      supabaseClient.from("resources").select("title").eq("featured", true).limit(1).maybeSingle(),
      supabaseClient.from("resources").select("title").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabaseClient.from("resources").select("title, views").order("views", { ascending: false }).limit(1).maybeSingle(),
      supabaseClient.from("videos").select("title, views").order("views", { ascending: false }).limit(1).maybeSingle()
    ]);

    const resEl = document.getElementById("totalResources");
    const vidEl = document.getElementById("totalVideos");
    const featEl = document.getElementById("featuredResource");
    const latestEl = document.getElementById("latestUpload");
    const topResEl = document.getElementById("mostViewedResource");
    const topVidEl = document.getElementById("mostViewedVideo");

    if (resEl) resEl.textContent = resCountResult.count || 0;
    if (vidEl) vidEl.textContent = vidCountResult.count || 0;
    if (featEl) featEl.textContent = featuredResult.data?.title || "None";
    if (latestEl) latestEl.textContent = latestResult.data?.title || "None";

    if (topResEl) {
      topResEl.textContent = topResResult.data
        ? `${topResResult.data.title} (${topResResult.data.views || 0})`
        : "None";
    }

    if (topVidEl) {
      topVidEl.textContent = topVidResult.data
        ? `${topVidResult.data.title} (${topVidResult.data.views || 0})`
        : "None";
    }
  } catch (err) {
    console.error("Dashboard calculation error:", err);
  }
}

/* --------------------------------------------------------------------------
   6. RESOURCES OPERATIONS (CRUD)
   -------------------------------------------------------------------------- */

document.getElementById("resourceForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = editingResourceId ? "Updating..." : "Saving...";
  }

  const categoryValue = document.getElementById("resourceCategory").value;
  let finalJobType = "remote";
  let finalIsActive = true;

  if (categoryValue === "job" || categoryValue === "internship") {
    finalJobType = document.getElementById("resourceJobType")?.value || "remote";
    finalIsActive = document.getElementById("resourceJobStatus")?.value === "active";
  } else if (categoryValue === "hackathon") {
    finalJobType = document.getElementById("resourceHackathonMode")?.value || "online";
    finalIsActive = document.getElementById("resourceHackathonStatus")?.value === "active";
  } else if (categoryValue === "scholarship") {
    finalJobType = "scholarship";
    finalIsActive = true; 
  }

  const resource = {
    title: document.getElementById("resourceTitle").value.trim(),
    description: sanitizeTextarea(document.getElementById("resourceDescription").value),
    category: categoryValue,
    job_type: finalJobType,
    is_active: finalIsActive,
    org_type: document.getElementById("resourceOrgType")?.value || "none",
    tags: getCheckedTags("resource-tag-check"),
    link: document.getElementById("resourceLink").value.trim(),
    upload_date: document.getElementById("resourceDate").value,
    featured: document.getElementById("resourceFeatured").checked
  };

  let error;

  if (editingResourceId) {
    const result = await supabaseClient
      .from("resources")
      .update(resource)
      .eq("id", editingResourceId);
    error = result.error;
  } else {
    const result = await supabaseClient
      .from("resources")
      .insert([resource]);
    error = result.error;
  }

  if (error) {
    alert("Error saving resource: " + error.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = editingResourceId ? "Update Resource" : "Save Resource";
    }
    return;
  }

  alert(editingResourceId ? "Resource updated successfully! ✅" : "Resource saved successfully! ✅");

  editingResourceId = null;
  e.target.reset();
  clearCheckedTags("resource-tag-check");
  const orgEl = document.getElementById("resourceOrgType");
  if (orgEl) orgEl.value = "none"; 
  toggleMetaRows(); 
  updateResourceButtonText();

  loadResourcesList();
  loadDashboardData();
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Resource";
  }
});

function updateResourceButtonText() {
  const btn = document.querySelector("#resourceForm button[type='submit']");
  if (btn) {
    btn.textContent = editingResourceId ? "Update Resource" : "Save Resource";
  }
}

async function editResource(id) {
  const { data, error } = await supabaseClient
    .from("resources")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Error fetching resource: " + error.message);
    return;
  }

  editingResourceId = id;

  document.getElementById("resourceTitle").value = data.title || "";
  document.getElementById("resourceDescription").value = data.description || "";
  document.getElementById("resourceCategory").value = data.category || "certificate";
  document.getElementById("resourceOrgType").value = data.org_type || "none";

  if (data.category === "job" || data.category === "internship") {
    const jt = document.getElementById("resourceJobType");
    const js = document.getElementById("resourceJobStatus");
    if (jt) jt.value = data.job_type || "remote";
    if (js) js.value = data.is_active ? "active" : "expired";
  } else if (data.category === "hackathon") {
    const hm = document.getElementById("resourceHackathonMode");
    const hs = document.getElementById("resourceHackathonStatus");
    if (hm) hm.value = data.job_type || "online";
    if (hs) hs.value = data.is_active ? "active" : "closed";
  }

  toggleMetaRows(); 
  setCheckedTags("resource-tag-check", data.tags);
  document.getElementById("resourceLink").value = data.link || "";
  document.getElementById("resourceDate").value = data.upload_date || "";
  document.getElementById("resourceFeatured").checked = data.featured || false;

  updateResourceButtonText();
  setActiveSection("resources");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelResourceEdit() {
  editingResourceId = null;
  document.getElementById("resourceForm")?.reset();
  clearCheckedTags("resource-tag-check");
  const orgEl = document.getElementById("resourceOrgType");
  if (orgEl) orgEl.value = "none";
  toggleMetaRows();
  updateResourceButtonText();
}

async function deleteResource(id) {
  if (!confirm("Are you sure you want to permanently delete this resource?")) return;

  const { error } = await supabaseClient
    .from("resources")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error deleting resource: " + error.message);
    return;
  }

  if (editingResourceId == id) {
    cancelResourceEdit();
  }

  loadResourcesList();
  loadDashboardData();
}

async function loadResourcesList() {
  const list = document.getElementById("resourcesList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Resources fetch error:", error);
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p class="admin-empty">No resources found in database.</p>`;
    return;
  }

  list.innerHTML = data.map(item => {
    let specializedBadge = "";
    if (item.category === "job" || item.category === "internship") {
      specializedBadge = ` • <span style="color:#10b981; font-weight:600;">[${item.category.toUpperCase()}: ${(item.job_type || "REMOTE").toUpperCase()} - ${item.is_active ? 'ACTIVE' : 'EXPIRED'}]</span>`;
    } else if (item.category === "hackathon") {
      specializedBadge = ` • <span style="color:#a855f7; font-weight:600;">[HACKATHON: ${(item.job_type || "ONLINE").toUpperCase()} - ${item.is_active ? 'ACTIVE' : 'CLOSED'}]</span>`;
    } else if (item.category === "scholarship") {
      specializedBadge = ` • <span style="color:#f59e0b; font-weight:600;">[SCHOLARSHIP]</span>`;
    }

    if (item.org_type && item.org_type !== "none") {
      specializedBadge += ` • <span style="color:#3b82f6; font-weight:700; text-transform:uppercase;">[${item.org_type}]</span>`;
    }

    return `
      <div class="admin-list-card">
        <div style="flex: 1; min-width: 0;">
          <h3>${item.title}</h3>
          <p style="margin: 4px 0; font-weight: 600; text-transform: capitalize; color: var(--text-muted); font-size: 0.85rem;">
            ${item.category || "Resource"}${specializedBadge} • ${item.upload_date || "No Date"} • 👁 ${item.views || 0} views
          </p>
          <p class="resource-description" style="margin-bottom: 6px; white-space: pre-line;">${item.description || "No description available."}</p>
          <button type="button" class="read-more-btn" style="font-size: 0.8rem; padding: 2px 6px; margin-bottom: 8px;">Read More</button>
          <br>
          <small style="color: var(--text-muted);">Tags: ${tagsToText(item.tags) || "None"}</small>
        </div>
        <div class="admin-actions">
          <button type="button" class="toggle-btn" onclick="editResource(${item.id})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button type="button" class="delete-btn" onclick="deleteResource(${item.id})"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

/* --------------------------------------------------------------------------
   7. VIDEOS OPERATIONS (CRUD)
   -------------------------------------------------------------------------- */

document.getElementById("videoForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = editingVideoId ? "Updating..." : "Saving...";
  }

  const video = {
    title: document.getElementById("videoTitle").value.trim(),
    description: sanitizeTextarea(document.getElementById("videoDescription").value),
    category: document.getElementById("videoCategory").value,
    org_type: document.getElementById("videoOrgType")?.value || "none",
    tags: getCheckedTags("video-tag-check"),
    youtube_link: document.getElementById("youtubeLink").value.trim(),
    resource_link: document.getElementById("videoResourceLink").value.trim(),
    upload_date: document.getElementById("videoDate").value,
    featured: document.getElementById("videoFeatured").checked
  };

  let error;

  if (editingVideoId) {
    const result = await supabaseClient
      .from("videos")
      .update(video)
      .eq("id", editingVideoId);
    error = result.error;
  } else {
    const result = await supabaseClient
      .from("videos")
      .insert([video]);
    error = result.error;
  }

  if (error) {
    alert("Error saving video: " + error.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = editingVideoId ? "Update Video" : "Save Video";
    }
    return;
  }

  alert(editingVideoId ? "Video updated successfully! ✅" : "Video saved successfully! ✅");

  editingVideoId = null;
  e.target.reset();
  clearCheckedTags("video-tag-check");
  const videoOrgEl = document.getElementById("videoOrgType");
  if (videoOrgEl) videoOrgEl.value = "none"; 
  toggleMetaRows(); 
  updateVideoButtonText();

  loadVideosList();
  loadDashboardData();
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Video";
  }
});

function updateVideoButtonText() {
  const btn = document.querySelector("#videoForm button[type='submit']");
  if (btn) {
    btn.textContent = editingVideoId ? "Update Video" : "Save Video";
  }
}

async function editVideo(id) {
  const { data, error } = await supabaseClient
    .from("videos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Error fetching video: " + error.message);
    return;
  }

  editingVideoId = id;

  document.getElementById("videoTitle").value = data.title || "";
  document.getElementById("videoDescription").value = data.description || "";
  document.getElementById("videoCategory").value = data.category || "certificate";
  document.getElementById("videoOrgType").value = data.org_type || "none";
  
  toggleMetaRows(); 
  setCheckedTags("video-tag-check", data.tags);
  document.getElementById("youtubeLink").value = data.youtube_link || "";
  document.getElementById("videoResourceLink").value = data.resource_link || "";
  document.getElementById("videoDate").value = data.upload_date || "";
  document.getElementById("videoFeatured").checked = data.featured || false;

  updateVideoButtonText();
  setActiveSection("videos");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelVideoEdit() {
  editingVideoId = null;
  document.getElementById("videoForm")?.reset();
  clearCheckedTags("video-tag-check");
  const videoOrgEl = document.getElementById("videoOrgType");
  if (videoOrgEl) videoOrgEl.value = "none";
  toggleMetaRows(); 
  updateVideoButtonText();
}

async function deleteVideo(id) {
  if (!confirm("Are you sure you want to permanently delete this video?")) return;

  const { error } = await supabaseClient
    .from("videos")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error deleting video: " + error.message);
    return;
  }

  if (editingVideoId == id) {
    cancelVideoEdit();
  }

  loadVideosList();
  loadDashboardData();
}

async function loadVideosList() {
  const list = document.getElementById("videosList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Videos fetch error:", error);
    return;
  }

  if (!data || data.length === 0) {
    list.innerHTML = `<p class="admin-empty">No videos found in database.</p>`;
    return;
  }

  list.innerHTML = data.map(item => {
    let specializedBadge = "";
    if (item.org_type && item.org_type !== "none") {
      specializedBadge = ` • <span style="color:#3b82f6; font-weight:700; text-transform:uppercase;">[${item.org_type}]</span>`;
    }

    return `
      <div class="admin-list-card">
        <div style="flex: 1; min-width: 0;">
          <h3>${item.title}</h3>
          <p style="margin: 4px 0; font-weight: 600; text-transform: capitalize; color: var(--text-muted); font-size: 0.85rem;">
            ${item.category || "Video"}${specializedBadge} • ${item.upload_date || "No Date"} • 👁 ${item.views || 0} views
          </p>
          <p class="resource-description" style="margin-bottom: 6px; white-space: pre-line;">${item.description || "No description available."}</p>
          <button type="button" class="read-more-btn" style="font-size: 0.8rem; padding: 2px 6px; margin-bottom: 8px;">Read More</button>
          <br>
          <small style="color: var(--text-muted);">Tags: ${tagsToText(item.tags) || "None"}</small>
        </div>
        <div class="admin-actions">
          <button type="button" class="toggle-btn" onclick="editVideo(${item.id})"><i class="fa-solid fa-pen"></i> Edit</button>
          <button type="button" class="delete-btn" onclick="deleteVideo(${item.id})"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
      </div>
    `;
  }).join("");
}

/* --------------------------------------------------------------------------
   8. PROFILE OPERATIONS
   -------------------------------------------------------------------------- */

async function loadProfile() {
  const { data, error } = await supabaseClient
    .from("profile")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Profile load error:", error);
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

document.getElementById("profileForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Updating Profile...";
  }

  let imageUrl = document.getElementById("profileImage").value;
  const imageFileInput = document.getElementById("profileImageFile");
  const imageFile = imageFileInput ? imageFileInput.files[0] : null;

  if (imageFile) {
    imageUrl = await uploadProfileImage(imageFile);
    if (!imageUrl) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save Profile";
      }
      return;
    }
  }

  const profile = {
    name: document.getElementById("profileName").value.trim(),
    bio: sanitizeTextarea(document.getElementById("profileBio").value),
    profile_image: imageUrl,
    youtube: document.getElementById("youtubeUrl").value.trim(),
    instagram: document.getElementById("instagramUrl").value.trim(),
    telegram: document.getElementById("telegramUrl").value.trim(),
    linkedin: document.getElementById("linkedinUrl").value.trim(),
    whatsapp: document.getElementById("whatsappUrl").value.trim(),
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
    alert("Error updating profile: " + error.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Save Profile";
    }
    return;
  }

  alert("Profile updated successfully! ✅");
  if (imageFileInput) imageFileInput.value = "";
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Save Profile";
  }
});

/* --------------------------------------------------------------------------
   9. OTHER ACCOUNTS MODULE
   -------------------------------------------------------------------------- */

document.getElementById("accountForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = e.target.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Saving Account...";
  }

  const account = {
    account_name: document.getElementById("accountName").value.trim(),
    platform: document.getElementById("accountPlatform").value,
    description: sanitizeTextarea(document.getElementById("accountDescription").value),
    url: document.getElementById("accountUrl").value.trim(),
    is_active: document.getElementById("accountActive").checked
  };

  const { error } = await supabaseClient
    .from("other_accounts")
    .insert([account]);

  if (error) {
    alert("Error adding account: " + error.message);
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Add Account";
    }
    return;
  }

  alert("Channel / Account added successfully! ✅");
  e.target.reset();

  loadAccountsList();
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Add Account";
  }
});

async function loadAccountsList() {
  const list = document.getElementById("accountsList");
  if (!list) return;

  const { data, error } = await supabaseClient
    .from("other_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Accounts fetch error:", error);
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
        <p style="color: var(--text-muted); font-size: 0.85rem;">${item.platform || "Account"} • Status: <strong>${item.is_active ? "Visible" : "Hidden"}</strong></p>
      </div>
      <div class="admin-actions">
        <button type="button" class="toggle-btn" onclick="toggleAccount(${item.id}, ${item.is_active})">
          ${item.is_active ? "Hide" : "Show"}
        </button>
        <button type="button" class="delete-btn" onclick="deleteAccount(${item.id})">
          <i class="fa-solid fa-trash"></i> Delete
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
    alert("Error updating account status: " + error.message);
    return;
  }

  loadAccountsList();
}

async function deleteAccount(id) {
  if (!confirm("Are you sure you want to delete this account link?")) return;

  const { error } = await supabaseClient
    .from("other_accounts")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Error deleting account: " + error.message);
    return;
  }

  loadAccountsList();
}

/* --------------------------------------------------------------------------
   10. GLOBAL ACTIONS & EXPOSURES
   -------------------------------------------------------------------------- */

document.addEventListener("click", (e) => {
  const readMoreBtn = e.target.closest(".read-more-btn");
  
  const themeBtn = e.target.closest(".theme-toggle-btn") || e.target.closest("#themeToggleBtn");
  if (themeBtn) {
    e.preventDefault();
    const isDark = document.documentElement.classList.toggle("dark-mode");
    localStorage.setItem("kavyahub-theme", isDark ? "dark" : "light");
    return;
  }

  if (!readMoreBtn) return;

  const description = readMoreBtn.previousElementSibling;
  if (description && description.classList.contains("resource-description")) {
    description.classList.toggle("expanded");
    readMoreBtn.textContent = description.classList.contains("expanded") ? "Read Less" : "Read More";
  }
});

// Explicit Global Window Bindings for Inline HTML Handlers
window.editResource = editResource;
window.cancelResourceEdit = cancelResourceEdit;
window.deleteResource = deleteResource;

window.editVideo = editVideo;
window.cancelVideoEdit = cancelVideoEdit;
window.deleteVideo = deleteVideo;

window.toggleAccount = toggleAccount;
window.deleteAccount = deleteAccount;