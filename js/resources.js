/* ==========================================================================
   KAVYAHUB - RESOURCES CONTROLLER (AUDITED & DEEP-LINK POWERED)
   ========================================================================== */

let resources = [];
let selectedTags = [];
let currentFilteredResources = [];

// DOM Elements Selection
const resourcesContainer = document.getElementById("resourcesContainer");
const searchInput = document.getElementById("resourceSearch");
const resourceCount = document.getElementById("resourceCount");
const emptyState = document.getElementById("emptyState");

const featuredTitle = document.getElementById("featuredTitle");
const featuredDescription = document.getElementById("featuredDescription");
const featuredButton = document.getElementById("featuredButton");

const filterToggleBtn = document.getElementById("filterToggleBtn");
const filterPanel = document.getElementById("filterPanel");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const tagFilters = document.querySelectorAll(".tag-filter");
const activeFilters = document.getElementById("activeFilters");

/* --------------------------------------------------------------------------
   1. TAG HELPERS
   -------------------------------------------------------------------------- */

function normalizeTag(tag) {
  return String(tag || "").trim().toLowerCase();
}

function getResourceTags(resource) {
  const tags = Array.isArray(resource.tags) ? resource.tags : [];
  const category = resource.category ? [resource.category] : [];
  return [...new Set([...category, ...tags].map(normalizeTag))];
}

function formatTag(tag) {
  return String(tag || "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function createTagHTML(resource) {
  const tags = getResourceTags(resource);

  if (tags.length === 0) {
    return `<span class="tag">Resource</span>`;
  }

  return tags
    .map(tag => `<span class="tag">${formatTag(tag)}</span>`)
    .join("");
}

/* --------------------------------------------------------------------------
   2. VIEW COUNTER LOGIC
   -------------------------------------------------------------------------- */

async function increaseResourceView(id) {
  const resource = resources.find(item => item.id == id);

  if (resource) {
    resource.views = (resource.views || 0) + 1;
  }

  const { error } = await supabaseClient.rpc(
    "increment_resource_views",
    { resource_id: id }
  );

  if (error) {
    console.error("Resource view error:", error);
    if (resource) {
      resource.views = Math.max((resource.views || 1) - 1, 0);
    }
  }
}

/* --------------------------------------------------------------------------
   3. CARD HTML TEMPLATE (DEEP-LINK UPDATED)
   -------------------------------------------------------------------------- */

function createCard(resource) {
  const descriptionText = resource.description || "";
  const isLongDescription = descriptionText.length > 120;
  const isJob = normalizeTag(resource.category) === "job" || getResourceTags(resource).includes("job");

  let jobBadgesHTML = "";
  if (isJob) {
    const jobType = resource.job_type ? formatTag(resource.job_type) : "Remote";
    const isActive = resource.is_active !== false;
    
    jobBadgesHTML = `
      <div class="job-meta-row" style="display: flex; gap: 10px; margin: -5px 0 12px 0; font-size: 0.8rem; align-items: center;">
        <span class="job-type-badge" style="background: rgba(var(--primary-rgb), 0.1); color: var(--primary); padding: 3px 8px; border-radius: 4px; font-weight: 500;">
          <i class="fa-solid fa-briefcase" style="font-size: 0.75rem; margin-right: 2px;"></i> ${jobType}
        </span>
        <span class="job-status-indicator" style="display: inline-flex; align-items: center; gap: 5px; font-weight: 500; color: var(--text-main);">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isActive ? '#22c55e' : '#ef4444'}; display: inline-block;"></span>
          ${isActive ? 'Active' : 'Expired'}
        </span>
      </div>
    `;
  }

  // FIXED: Generates KavyaHub traffic-retaining deep-link instead of direct bypass URLs
  const deepShareLink = `${window.location.origin}/resources.html?search=${encodeURIComponent(resource.title)}`;

  return `
    <div class="resource-card">
      <div class="tag-row">
        ${createTagHTML(resource)}
      </div>

      <h3>${resource.title}</h3>

      ${jobBadgesHTML}

      <p class="resource-description">${descriptionText}</p>

      ${isLongDescription ? `<button type="button" class="read-more-btn">Read More</button>` : ""}

      <div style="margin-bottom: 12px; display: block;">
        <small style="display:inline-block; margin-right:10px;">${resource.upload_date || ""}</small>
        <small style="display:inline-block;">👁 ${resource.views || 0} views</small>
      </div>

      <div style="display: flex; gap: 8px; margin-top: auto; width: 100%;">
        <button
          type="button"
          class="unlock-btn resource-view-btn"
          data-id="${resource.id}"
          data-link="${resource.link}"
          style="flex: 1; margin: 0;">
          Open Resource
        </button>
        <button 
          type="button" 
          class="share-btn" 
          data-link="${deepShareLink}" 
          title="Share via KavyaHub"
          style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; cursor: pointer; color: var(--text-main); transition: background 0.2s;">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   4. RENDER MODULE
   -------------------------------------------------------------------------- */

function renderResources(data) {
  currentFilteredResources = data;
  if (!resourcesContainer) return; 

  if (data.length === 0) {
    resourcesContainer.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (resourceCount) resourceCount.textContent = "0";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  resourcesContainer.innerHTML = data.map(resource => createCard(resource)).join("");

  if (resourceCount) {
    resourceCount.textContent = data.length;
  }
}

/* --------------------------------------------------------------------------
   5. FEATURED CONTAINER
   -------------------------------------------------------------------------- */

function loadFeatured() {
  if (!featuredTitle || !featuredDescription || !featuredButton) return;

  const featured = resources.find(item => item.featured);

  if (!featured) {
    featuredTitle.textContent = "No Featured Resource";
    featuredDescription.textContent = "Select a featured resource from the admin panel.";
    featuredButton.dataset.link = "#";
    featuredButton.dataset.id = "";
    return;
  }

  featuredTitle.textContent = featured.title;
  featuredDescription.textContent = featured.description || "";
  featuredButton.dataset.link = featured.link || "#";
  featuredButton.dataset.id = featured.id;
}

/* --------------------------------------------------------------------------
   6. ACTIVE FILTER CHIPS
   -------------------------------------------------------------------------- */

function renderActiveFilters() {
  if (!activeFilters) return;

  if (selectedTags.length === 0) {
    activeFilters.innerHTML = "";
    return;
  }

  activeFilters.innerHTML = selectedTags
    .map(tag => `<span class="active-filter-chip">${formatTag(tag)}</span>`)
    .join("");
}

/* --------------------------------------------------------------------------
   7. SEARCH + MULTI FILTER LOGIC
   -------------------------------------------------------------------------- */

function applyFilters() {
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";

  const filtered = resources.filter(resource => {
    const tags = getResourceTags(resource);

    const searchableText = [
      resource.title,
      resource.description,
      resource.category,
      ...(resource.tags || [])
    ]
      .join(" ")
      .toLowerCase();

    const matchSearch = term === "" || searchableText.includes(term);
    const matchTags = selectedTags.length === 0 || selectedTags.some(tag => tags.includes(tag));

    return matchSearch && matchTags;
  });

  renderResources(filtered);
  renderActiveFilters();
}

/* --------------------------------------------------------------------------
   8. EVENT LISTENERS & INITIALIZATION
   -------------------------------------------------------------------------- */

if (filterToggleBtn && filterPanel) {
  filterToggleBtn.addEventListener("click", () => {
    filterPanel.style.display = filterPanel.style.display === "none" ? "block" : "none";
  });
}

tagFilters.forEach(input => {
  input.addEventListener("change", () => {
    selectedTags = Array.from(tagFilters)
      .filter(item => item.checked)
      .map(item => normalizeTag(item.value));

    applyFilters();
  });
});

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    selectedTags = [];
    tagFilters.forEach(input => {
      input.checked = false;
    });
    applyFilters();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

// Main resource initializer from Supabase
async function loadResources() {
  const { data, error } = await supabaseClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading resources:", error);
    return;
  }

  resources = data || [];
  renderResources(resources);
  loadFeatured();

  // FEATURE: Inbound traffic router parser. Auto-scans URL parameters to deploy query state instantly
  const urlParams = new URLSearchParams(window.location.search);
  const inboundSearchQuery = urlParams.get("search");
  if (inboundSearchQuery && searchInput) {
    searchInput.value = inboundSearchQuery;
    applyFilters();
    // Smooth layout adjustment anchor
    setTimeout(() => searchInput.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  }
}

loadResources();

/* --------------------------------------------------------------------------
   9. GLOBAL DELEGATED CLICK EVENTS
   -------------------------------------------------------------------------- */

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".resource-view-btn");
  if (btn) {
    if (btn.dataset.clicked === "true") return;
    btn.dataset.clicked = "true";

    const id = btn.dataset.id;
    if (id) {
      await increaseResourceView(id);
      renderResources(currentFilteredResources);
      loadFeatured();
    }

    setTimeout(() => {
      btn.dataset.clicked = "false";
    }, 1500);
    return; 
  }

  const trendingChip = e.target.closest(".trending-chip");
  if (trendingChip) {
    e.preventDefault();
    const tagValue = normalizeTag(trendingChip.getAttribute("data-tag"));
    const targetCheckbox = Array.from(tagFilters).find(item => normalizeTag(item.value) === tagValue);
    
    if (targetCheckbox) {
      targetCheckbox.checked = !targetCheckbox.checked;
      selectedTags = Array.from(tagFilters)
        .filter(item => item.checked)
        .map(item => normalizeTag(item.value));
      applyFilters();
    }
    return;
  }
});

if (featuredButton) {
  featuredButton.addEventListener("click", async () => {
    const id = featuredButton.dataset.id;
    if (id) {
      await increaseResourceView(id);
      renderResources(currentFilteredResources);
      loadFeatured();
    }
  });
}