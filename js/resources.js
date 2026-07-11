/* ==========================================================================
   KAVYAHUB - RESOURCES CONTROLLER (AUDITED & DEEP-LINK POWERED)
   ========================================================================== */

let resources = [];
let selectedTags = [];
// UPGRADE: New dynamic register for tracking Organization Type sectors filter state
let selectedSectors = [];
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
// UPGRADE: Select explicit sector layout elements selectors
const sectorFilters = document.querySelectorAll(".sector-filter");
const activeFilters = document.getElementById("activeFilters");

// UPGRADE: Selection reference hook targeted for autocomplete suggestion panel dropdown
const suggestionsBox = document.getElementById("searchSuggestions");

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
   3. CARD HTML TEMPLATE (DEEP-LINK UPDATED WITH HACKATHON SUPPORT)
   -------------------------------------------------------------------------- */

function createCard(resource) {
  const descriptionText = resource.description || "";
  const isLongDescription = descriptionText.length > 120;
  
  const currentCategory = normalizeTag(resource.category);
  const isJob = currentCategory === "job" || getResourceTags(resource).includes("job");
  const isHackathon = currentCategory === "hackathon" || getResourceTags(resource).includes("hackathon");
  
  // UPGRADE: Evaluation variable string selector for tracking Scholarships tags models
  const isScholarship = currentCategory === "scholarship" || getResourceTags(resource).includes("scholarship");

  // A. JOB METADATA CARD GENERATOR
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

  // B. HACKATHON METADATA CARD GENERATOR (NEW VIP ENTRY)
  let hackathonBadgesHTML = "";
  if (isHackathon) {
    const hackathonMode = resource.job_type ? formatTag(resource.job_type) : "Online";
    const isActive = resource.is_active !== false;

    hackathonBadgesHTML = `
      <div class="hackathon-meta-row" style="display: flex; gap: 10px; margin: -5px 0 12px 0; font-size: 0.8rem; align-items: center;">
        <span class="hackathon-mode-badge" style="background: rgba(168, 85, 247, 0.1); color: #a855f7; padding: 3px 8px; border-radius: 4px; font-weight: 500;">
          <i class="fa-solid fa-laptop-code" style="font-size: 0.75rem; margin-right: 2px;"></i> ${hackathonMode}
        </span>
        <span class="hackathon-status-indicator" style="display: inline-flex; align-items: center; gap: 5px; font-weight: 500; color: var(--text-main);">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isActive ? '#22c55e' : '#ef4444'}; display: inline-block;"></span>
          ${isActive ? 'Active' : 'Closed'}
        </span>
      </div>
    `;
  }

  // UPGRADE: C. SCHOLARSHIP METADATA CARD VIP GENERATOR 
  let scholarshipBadgesHTML = "";
  if (isScholarship) {
    scholarshipBadgesHTML = `
      <div class="scholarship-meta-row" style="display: flex; gap: 10px; margin: -5px 0 12px 0; font-size: 0.8rem; align-items: center;">
        <span class="scholarship-vip-badge" style="background: linear-gradient(135deg, #f59e0b, #e08e0b); color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.22);">
          <i class="fa-solid fa-graduation-cap"></i> Verified Scholarship
        </span>
      </div>
    `;
  }

  // UPGRADE: D. DYNAMIC SECTOR IDENTITY COMPILER (Government vs Private badges inline builder)
  let orgBadgeHTML = "";
  if (resource.org_type && resource.org_type !== "none") {
    const isGov = resource.org_type === "government";
    orgBadgeHTML = `
      <span class="tag org-indicator-chip" style="background: ${isGov ? 'rgba(59, 130, 246, 0.12)' : 'rgba(100, 116, 139, 0.1)'}; color: ${isGov ? '#3b82f6' : 'var(--text-main)'}; border: 1px solid ${isGov ? 'rgba(59, 130, 246, 0.25)' : 'var(--border-color)'}; font-weight: 600; font-size: 0.75rem;">
        <i class="${isGov ? 'fa-solid fa-building-shield' : 'fa-solid fa-building'}"></i> ${isGov ? 'Govt' : 'Private'}
      </span>
    `;
  }

  // Generates KavyaHub traffic-retaining deep-link instead of direct bypass URLs
  const deepShareLink = `${window.location.origin}/resources.html?search=${encodeURIComponent(resource.title)}`;

  return `
    <div class="resource-card">
      <div class="tag-row" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
        ${createTagHTML(resource)}
        ${orgBadgeHTML}
      </div>

      <h3>${resource.title}</h3>

      ${jobBadgesHTML}
      ${hackathonBadgesHTML}
      ${scholarshipBadgesHTML}

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

  if (selectedTags.length === 0 && selectedSectors.length === 0) {
    activeFilters.innerHTML = "";
    return;
  }

  // Merge tag arrays text items formatting for chip preview display matrix
  const tagsChips = selectedTags.map(tag => `<span class="active-filter-chip">${formatTag(tag)}</span>`);
  const sectorChips = selectedSectors.map(sec => `<span class="active-filter-chip" style="background:rgba(59, 130, 246, 0.15); border-color:#3b82f6; color:#3b82f6;">${formatTag(sec)} Sector</span>`);

  activeFilters.innerHTML = [...tagsChips, ...sectorChips].join("");
}

/* --------------------------------------------------------------------------
   7. SEARCH + MULTI FILTER LOGIC (UPGRADED STAGE PARSER ENGINE)
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
    
    // UPGRADE: Multi-stage organization type filter parsing segment
    const resourceOrg = normalizeTag(resource.org_type || "none");
    const matchSectors = selectedSectors.length === 0 || selectedSectors.includes(resourceOrg);

    return matchSearch && matchTags && matchSectors;
  });

  renderResources(filtered);
  renderActiveFilters();
}

/* --------------------------------------------------------------------------
   7B. UPGRADE: PREDICTIVE SMART AUTOCOMPLETE SUGGESTIONS CONTROLLER ENGINE
   -------------------------------------------------------------------------- */

function processAutocompleteSuggestions() {
  if (!suggestionsBox || !searchInput) return;
  const rawQuery = searchInput.value.toLowerCase().trim();

  // Trigger dropdown display loop only if character length matches index boundary
  if (rawQuery.length < 2) {
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "none";
    return;
  }

  // Scan current records array lists for string fragments match outputs entries
  const matches = resources.filter(resource => {
    return resource.title.toLowerCase().includes(rawQuery) || 
           (resource.tags && resource.tags.some(t => t.toLowerCase().includes(rawQuery)));
  }).slice(0, 5); // Limit dropdown output size parameters to keep viewport space optimized

  if (matches.length === 0) {
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "none";
    return;
  }

  // Construct dynamic item containers hooks inside box elements
  suggestionsBox.innerHTML = matches.map(item => `
    <div class="autocomplete-suggestion-row" data-search-target="${item.title.replace(/"/g, '&quot;')}" style="padding: 11px 16px; cursor: pointer; border-bottom: 1px solid var(--border-color); color: var(--text-main); font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 10px; transition: background 0.15s ease;">
      <i class="fa-solid fa-magnifying-glass" style="color: var(--text-muted); font-size: 0.8rem;"></i>
      <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${item.title}</span>
    </div>
  `).join("");

  suggestionsBox.style.display = "block";
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

// UPGRADE: Dynamic change registration listeners hooks for Sector Filters checkboxes
sectorFilters.forEach(input => {
  input.addEventListener("change", () => {
    selectedSectors = Array.from(sectorFilters)
      .filter(item => item.checked)
      .map(item => normalizeTag(item.value));

    applyFilters();
  });
});

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    selectedTags = [];
    selectedSectors = []; // Clean sector array metrics registry
    tagFilters.forEach(input => { input.checked = false; });
    sectorFilters.forEach(input => { input.checked = false; }); // Dynamic checkbox states sweep reset
    applyFilters();
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    applyFilters();
    processAutocompleteSuggestions(); // Fire auto-suggest processor engine context row inputs
  });
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
  // UPGRADE: Autocomplete Click Delegate Listener router payload trigger injector
  const suggestionRow = e.target.closest(".autocomplete-suggestion-row");
  if (suggestionRow) {
    const selectedKeyword = suggestionRow.getAttribute("data-search-target");
    if (searchInput) {
      searchInput.value = selectedKeyword;
      applyFilters();
    }
    if (suggestionsBox) {
      suggestionsBox.style.display = "none";
      suggestionsBox.innerHTML = "";
    }
    return;
  }

  // UPGRADE: Absolute Backdrop outside listener loop box click framework closer rules selector trigger
  if (suggestionsBox && suggestionsBox.style.display === "block" && !e.target.closest(".search-section")) {
    suggestionsBox.style.display = "none";
  }

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
    
    // Check tags checkboxes array list path sequence context rows maps
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