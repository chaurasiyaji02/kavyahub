/* ==========================================================================
   KAVYAHUB - RESOURCES CONTROLLER (GRANULAR FILTER ENGINE & MODAL PARSER)
   ========================================================================== */

let resources = [];
let selectedTags = [];
let selectedSectors = [];
let currentFilteredResources = [];
let searchDebounceTimer = null;

// DOM Elements Selection
const resourcesContainer = document.getElementById("resourcesContainer");
const searchInput = document.getElementById("resourceSearch");
const clearResourceSearch = document.getElementById("clearResourceSearch");
const resourceCount = document.getElementById("resourceCount");
const emptyState = document.getElementById("emptyState");
const resetFiltersEmptyBtn = document.getElementById("resetFiltersEmptyBtn");

const featuredResourceSection = document.getElementById("featuredResourceSection");
const featuredTitle = document.getElementById("featuredTitle");
const featuredDescription = document.getElementById("featuredDescription");
const featuredButton = document.getElementById("featuredButton");

const filterToggleBtn = document.getElementById("filterToggleBtn");
const filterPanel = document.getElementById("filterPanel");
const filterCountBadge = document.getElementById("filterCountBadge");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const tagFilters = document.querySelectorAll(".tag-filter");
const sectorFilters = document.querySelectorAll(".sector-filter");
const activeFiltersWrapper = document.getElementById("activeFiltersWrapper");
const activeFilters = document.getElementById("activeFilters");
const suggestionsBox = document.getElementById("searchSuggestions");

// Modal Elements Selection
const descModalOverlay = document.getElementById("descriptionModalOverlay");
const descModalClose = document.getElementById("descriptionModalClose");
const modalBadgeRow = document.getElementById("modalBadgeRow");
const modalTitle = document.getElementById("modalTitle");
const modalMetaInfo = document.getElementById("modalMetaInfo");
const modalDescriptionContent = document.getElementById("modalDescriptionContent");
const modalActionRow = document.getElementById("modalActionRow");

/* --------------------------------------------------------------------------
   1. UTILITY & FORMATTING HELPERS
   -------------------------------------------------------------------------- */

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeTag(tag) {
  return String(tag || "").trim().toLowerCase();
}

function formatTag(tag) {
  return String(tag || "")
    .replaceAll("-", " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function formatStructuredText(text) {
  if (!text) return "";
  const escaped = escapeHTML(text);
  
  return escaped
    .split("\n")
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
        return `<div class="formatted-bullet">• ${trimmed.substring(2)}</div>`;
      }
      return trimmed ? `<p class="formatted-paragraph">${trimmed}</p>` : `<div class="formatted-spacer"></div>`;
    })
    .join("");
}

function formatViews(views) {
  const num = Number(views || 0);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

function getResourceTags(resource) {
  const tags = Array.isArray(resource.tags) ? resource.tags : [];
  const category = resource.category ? [resource.category] : [];
  return [...new Set([...category, ...tags].map(normalizeTag))];
}

function renderSkeletons(container, count = 6) {
  if (!container) return;
  container.innerHTML = Array(count).fill(`
    <div class="resource-card skeleton-card">
      <div class="skeleton skeleton-tag"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 75%;"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `).join("");
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
   3. CARD HTML TEMPLATE (DEEP-LINKED & INTERACTIVE)
   -------------------------------------------------------------------------- */

function createCard(resource) {
  const descriptionText = resource.description || "";
  const isLongDescription = descriptionText.length > 115;
  
  const currentCategory = normalizeTag(resource.category);
  const isJob = currentCategory === "job" || currentCategory === "internship" || getResourceTags(resource).includes("job");
  const isHackathon = currentCategory === "hackathon" || getResourceTags(resource).includes("hackathon");
  const isScholarship = currentCategory === "scholarship" || getResourceTags(resource).includes("scholarship");

  // Badges
  let jobBadgesHTML = "";
  if (isJob) {
    const jobType = resource.job_type ? formatTag(resource.job_type) : "Remote";
    const isActive = resource.is_active !== false;
    jobBadgesHTML = `
      <div class="meta-row">
        <span class="badge-pill primary-pill"><i class="fa-solid fa-briefcase"></i> ${escapeHTML(jobType)}</span>
        <span class="status-indicator"><span class="status-dot ${isActive ? 'active' : 'inactive'}"></span> ${isActive ? 'Active' : 'Expired'}</span>
      </div>
    `;
  }

  let hackathonBadgesHTML = "";
  if (isHackathon) {
    const mode = resource.job_type ? formatTag(resource.job_type) : "Online";
    const isActive = resource.is_active !== false;
    hackathonBadgesHTML = `
      <div class="meta-row">
        <span class="badge-pill purple-pill"><i class="fa-solid fa-laptop-code"></i> ${escapeHTML(mode)}</span>
        <span class="status-indicator"><span class="status-dot ${isActive ? 'active' : 'inactive'}"></span> ${isActive ? 'Active' : 'Closed'}</span>
      </div>
    `;
  }

  let scholarshipBadgesHTML = "";
  if (isScholarship) {
    scholarshipBadgesHTML = `
      <div class="meta-row">
        <span class="badge-pill gold-pill"><i class="fa-solid fa-award"></i> Verified Scholarship</span>
      </div>
    `;
  }

  let orgBadgeHTML = "";
  if (resource.org_type && resource.org_type !== "none") {
    const isGov = resource.org_type === "government";
    orgBadgeHTML = `
      <span class="badge-pill ${isGov ? 'govt-pill' : 'private-pill'}">
        <i class="${isGov ? 'fa-solid fa-building-shield' : 'fa-solid fa-building'}"></i> ${isGov ? 'Govt' : 'Private'}
      </span>
    `;
  }

  const primaryCategory = formatTag(resource.category || "Resource");
  const deepShareLink = `${window.location.origin}/resources.html?search=${encodeURIComponent(resource.title)}`;
  const resourceJSON = encodeURIComponent(JSON.stringify(resource));

  return `
    <div class="resource-card" data-resource="${resourceJSON}">
      <div class="tag-row">
        <span class="badge-pill neutral-pill">${escapeHTML(primaryCategory)}</span>
        ${orgBadgeHTML}
      </div>

      <h3 class="card-title">${escapeHTML(resource.title)}</h3>

      ${jobBadgesHTML}
      ${hackathonBadgesHTML}
      ${scholarshipBadgesHTML}

      <div class="resource-description-clamp">
        ${escapeHTML(descriptionText)}
      </div>

      ${isLongDescription ? `<button type="button" class="read-more-btn res-modal-trigger">Read More</button>` : ""}

      <div class="card-footer-meta">
        <small><i class="fa-regular fa-calendar"></i> ${escapeHTML(resource.upload_date || "")}</small>
        <small><i class="fa-regular fa-eye"></i> ${formatViews(resource.views)} views</small>
      </div>

      <div class="card-actions">
        <button
          type="button"
          class="unlock-btn resource-view-btn open-resource-btn"
          data-id="${resource.id}"
          data-link="${resource.link}">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Resource
        </button>
        <button 
          type="button" 
          class="share-btn" 
          data-link="${deepShareLink}" 
          title="Share Resource">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   4. RENDER & FEATURED MODULE (WITH CLAMPING & READ MORE TRIGGER)
   -------------------------------------------------------------------------- */

function renderResources(data) {
  currentFilteredResources = data;
  if (!resourcesContainer) return; 

  if (data.length === 0) {
    resourcesContainer.innerHTML = "";
    if (emptyState) emptyState.style.display = "flex";
    if (resourceCount) resourceCount.textContent = "0";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  resourcesContainer.innerHTML = data.map(resource => createCard(resource)).join("");

  if (resourceCount) {
    resourceCount.textContent = data.length;
  }
}

function loadFeatured() {
  if (!featuredTitle || !featuredDescription || !featuredButton) return;

  let featured = resources.find(item => item.featured);
  if (!featured && resources.length > 0) {
    featured = resources[0];
  }

  if (!featured) {
    if (featuredResourceSection) featuredResourceSection.style.display = "none";
    return;
  }

  if (featuredResourceSection) {
    featuredResourceSection.style.display = "block";
    const resourceJSON = encodeURIComponent(JSON.stringify(featured));
    featuredResourceSection.setAttribute("data-resource", resourceJSON);
  }

  featuredTitle.textContent = featured.title;
  
  const descText = featured.description || "";
  const isLongDescription = descText.length > 130;

  featuredDescription.innerHTML = `
    <div class="featured-description-clamp">
      ${escapeHTML(descText)}
    </div>
    ${isLongDescription ? `<button type="button" class="read-more-btn res-modal-trigger featured-read-more">Read More</button>` : ""}
  `;

  featuredButton.dataset.link = featured.link || "#";
  featuredButton.dataset.id = featured.id;
}

/* --------------------------------------------------------------------------
   5. ACTIVE FILTER CHIPS & BADGE COUNTER
   -------------------------------------------------------------------------- */

function renderActiveFilters() {
  const totalCount = selectedTags.length + selectedSectors.length;

  if (filterCountBadge) {
    if (totalCount > 0) {
      filterCountBadge.textContent = totalCount;
      filterCountBadge.style.display = "inline-flex";
    } else {
      filterCountBadge.style.display = "none";
    }
  }

  if (!activeFilters || !activeFiltersWrapper) return;

  if (totalCount === 0) {
    activeFilters.innerHTML = "";
    activeFiltersWrapper.style.display = "none";
    return;
  }

  activeFiltersWrapper.style.display = "block";

  const tagsChips = selectedTags.map(tag => `
    <span class="active-filter-chip">
      ${formatTag(tag)}
      <button type="button" class="remove-chip-btn" data-type="tag" data-val="${tag}" aria-label="Remove filter">&times;</button>
    </span>
  `);

  const sectorChips = selectedSectors.map(sec => `
    <span class="active-filter-chip sector-chip">
      <i class="${sec === 'government' ? 'fa-solid fa-building-shield' : 'fa-solid fa-building'}"></i> ${formatTag(sec)}
      <button type="button" class="remove-chip-btn" data-type="sector" data-val="${sec}" aria-label="Remove filter">&times;</button>
    </span>
  `);

  activeFilters.innerHTML = [...tagsChips, ...sectorChips].join("");
}

/* --------------------------------------------------------------------------
   6. FILTER, DEBOUNCED SEARCH & URL SYNC
   -------------------------------------------------------------------------- */

function applyFilters() {
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";

  if (clearResourceSearch) {
    clearResourceSearch.style.display = term ? "block" : "none";
  }

  const filtered = resources.filter(resource => {
    const tags = getResourceTags(resource);

    const searchableText = [
      resource.title,
      resource.description,
      resource.category,
      ...(resource.tags || [])
    ].join(" ").toLowerCase();

    const matchSearch = term === "" || searchableText.includes(term);
    const matchTags = selectedTags.length === 0 || selectedTags.some(tag => tags.includes(tag));
    
    const resourceOrg = normalizeTag(resource.org_type || "none");
    const matchSectors = selectedSectors.length === 0 || selectedSectors.includes(resourceOrg);

    return matchSearch && matchTags && matchSectors;
  });

  renderResources(filtered);
  renderActiveFilters();
}

function updateURLState() {
  const params = new URLSearchParams();
  if (selectedTags.length > 0) params.set("type", selectedTags.join(","));
  if (selectedSectors.length > 0) params.set("sector", selectedSectors.join(","));
  if (searchInput && searchInput.value.trim()) params.set("search", searchInput.value.trim());

  const newURL = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
  window.history.replaceState({}, "", newURL);
}

/* --------------------------------------------------------------------------
   7. AUTOCOMPLETE SUGGESTIONS ENGINE
   -------------------------------------------------------------------------- */

function processAutocompleteSuggestions() {
  if (!suggestionsBox || !searchInput) return;
  const rawQuery = searchInput.value.toLowerCase().trim();

  if (rawQuery.length < 2) {
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "none";
    return;
  }

  const matches = resources.filter(resource => {
    return resource.title.toLowerCase().includes(rawQuery) || 
           (resource.tags && resource.tags.some(t => t.toLowerCase().includes(rawQuery)));
  }).slice(0, 5);

  if (matches.length === 0) {
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "none";
    return;
  }

  suggestionsBox.innerHTML = matches.map(item => `
    <div class="autocomplete-suggestion-row" data-search-target="${escapeHTML(item.title)}">
      <i class="fa-solid fa-magnifying-glass"></i>
      <span>${escapeHTML(item.title)}</span>
    </div>
  `).join("");

  suggestionsBox.style.display = "block";
}

/* --------------------------------------------------------------------------
   8. MODAL CONTROLLER & CLICK DELEGATIONS
   -------------------------------------------------------------------------- */

function openResourceDetailsModal(resource) {
  if (!descModalOverlay) return;

  const isGov = resource.org_type === "government";
  const orgBadge = (resource.org_type && resource.org_type !== "none")
    ? `<span class="badge-pill ${isGov ? 'govt-pill' : 'private-pill'}">${isGov ? 'Govt' : 'Private'}</span>`
    : "";

  modalBadgeRow.innerHTML = `
    <span class="badge-pill neutral-pill">${formatTag(resource.category || "Resource")}</span>
    ${orgBadge}
  `;

  modalTitle.textContent = resource.title || "Resource Details";

  modalMetaInfo.innerHTML = `
    <span><i class="fa-regular fa-calendar"></i> Uploaded: ${escapeHTML(resource.upload_date || "Recent")}</span>
    <span><i class="fa-regular fa-eye"></i> ${formatViews(resource.views)} views</span>
  `;

  modalDescriptionContent.innerHTML = formatStructuredText(resource.description);

  modalActionRow.innerHTML = `
    <button type="button" class="unlock-btn full-btn resource-view-btn" data-id="${resource.id}" data-link="${resource.link}">
      <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Resource
    </button>
  `;

  descModalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeResourceDetailsModal() {
  if (descModalOverlay) {
    descModalOverlay.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

if (descModalClose) {
  descModalClose.addEventListener("click", closeResourceDetailsModal);
}

if (descModalOverlay) {
  descModalOverlay.addEventListener("click", (e) => {
    if (e.target === descModalOverlay) closeResourceDetailsModal();
  });
}

// Global Delegated Click Events
document.addEventListener("click", async (e) => {
  // 1. Read More Modal (Resource Card + Featured Card)
  const modalTrigger = e.target.closest(".res-modal-trigger");
  if (modalTrigger) {
    const card = modalTrigger.closest(".resource-card") || modalTrigger.closest("#featuredResourceSection") || modalTrigger.closest(".featured-resource");
    if (card && card.dataset.resource) {
      const data = JSON.parse(decodeURIComponent(card.dataset.resource));
      openResourceDetailsModal(data);
    }
    return;
  }

  // 2. View Counter on Click
  const viewBtn = e.target.closest(".resource-view-btn");
  if (viewBtn) {
    if (viewBtn.dataset.clicked === "true") return;
    viewBtn.dataset.clicked = "true";
    const id = viewBtn.dataset.id;
    if (id) {
      await increaseResourceView(id);
    }
    setTimeout(() => {
      viewBtn.dataset.clicked = "false";
    }, 1500);
  }

  // 3. Autocomplete Suggestion Pick
  const suggestionRow = e.target.closest(".autocomplete-suggestion-row");
  if (suggestionRow) {
    const selectedKeyword = suggestionRow.getAttribute("data-search-target");
    if (searchInput) {
      searchInput.value = selectedKeyword;
      applyFilters();
      updateURLState();
    }
    if (suggestionsBox) {
      suggestionsBox.style.display = "none";
      suggestionsBox.innerHTML = "";
    }
    return;
  }

  // 4. Trending Chip Click
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
      updateURLState();
    }
    return;
  }

  // 5. Remove Chip Button
  const removeChipBtn = e.target.closest(".remove-chip-btn");
  if (removeChipBtn) {
    const type = removeChipBtn.dataset.type;
    const val = removeChipBtn.dataset.val;

    if (type === "tag") {
      selectedTags = selectedTags.filter(t => t !== val);
      tagFilters.forEach(cb => {
        if (normalizeTag(cb.value) === val) cb.checked = false;
      });
    } else if (type === "sector") {
      selectedSectors = selectedSectors.filter(s => s !== val);
      sectorFilters.forEach(cb => {
        if (normalizeTag(cb.value) === val) cb.checked = false;
      });
    }

    applyFilters();
    updateURLState();
    return;
  }

  // 6. Share Button
  const shareBtn = e.target.closest(".share-btn");
  if (shareBtn) {
    const shareUrl = shareBtn.getAttribute("data-link");
    if (navigator.share) {
      navigator.share({
        title: "Check this opportunity on KavyaHub",
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("Link copied to clipboard!");
      });
    }
    return;
  }

  // Autocomplete backdrop close
  if (suggestionsBox && suggestionsBox.style.display === "block" && !e.target.closest(".search-section")) {
    suggestionsBox.style.display = "none";
  }
});

/* --------------------------------------------------------------------------
   9. EVENT LISTENERS & FILTER HOOKS
   -------------------------------------------------------------------------- */

if (filterToggleBtn && filterPanel) {
  filterToggleBtn.addEventListener("click", () => {
    const isHidden = filterPanel.style.display === "none";
    filterPanel.style.display = isHidden ? "block" : "none";
    filterToggleBtn.classList.toggle("active", isHidden);
  });
}

tagFilters.forEach(input => {
  input.addEventListener("change", () => {
    selectedTags = Array.from(tagFilters)
      .filter(item => item.checked)
      .map(item => normalizeTag(item.value));

    applyFilters();
    updateURLState();
  });
});

sectorFilters.forEach(input => {
  input.addEventListener("change", () => {
    selectedSectors = Array.from(sectorFilters)
      .filter(item => item.checked)
      .map(item => normalizeTag(item.value));

    applyFilters();
    updateURLState();
  });
});

function resetAllFilters() {
  selectedTags = [];
  selectedSectors = [];
  tagFilters.forEach(input => (input.checked = false));
  sectorFilters.forEach(input => (input.checked = false));
  if (searchInput) searchInput.value = "";
  if (clearResourceSearch) clearResourceSearch.style.display = "none";
  if (suggestionsBox) suggestionsBox.style.display = "none";

  applyFilters();
  updateURLState();
}

if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", resetAllFilters);
if (resetFiltersEmptyBtn) resetFiltersEmptyBtn.addEventListener("click", resetAllFilters);

if (searchInput) {
  searchInput.addEventListener("input", () => {
    processAutocompleteSuggestions();
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      applyFilters();
      updateURLState();
    }, 200);
  });
}

if (clearResourceSearch) {
  clearResourceSearch.addEventListener("click", () => {
    searchInput.value = "";
    applyFilters();
    updateURLState();
    searchInput.focus();
  });
}

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

/* --------------------------------------------------------------------------
   10. DATA INITIALIZER FROM SUPABASE
   -------------------------------------------------------------------------- */

async function loadResources() {
  renderSkeletons(resourcesContainer, 6);

  const { data, error } = await supabaseClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading resources:", error);
    if (resourcesContainer) resourcesContainer.innerHTML = `<div class="empty-state"><p>Error loading resources. Please refresh.</p></div>`;
    return;
  }

  resources = data || [];
  loadFeatured();

  // Inbound URL parameters auto-sync
  const urlParams = new URLSearchParams(window.location.search);
  const inboundSearch = urlParams.get("search");
  const inboundType = urlParams.get("type");
  const inboundSector = urlParams.get("sector");

  if (inboundType) {
    const types = inboundType.split(",").map(normalizeTag);
    tagFilters.forEach(cb => {
      if (types.includes(normalizeTag(cb.value))) {
        cb.checked = true;
      }
    });
    selectedTags = Array.from(tagFilters).filter(cb => cb.checked).map(cb => normalizeTag(cb.value));
    if (filterPanel && selectedTags.length > 0) filterPanel.style.display = "block";
  }

  if (inboundSector) {
    const sectors = inboundSector.split(",").map(normalizeTag);
    sectorFilters.forEach(cb => {
      if (sectors.includes(normalizeTag(cb.value))) {
        cb.checked = true;
      }
    });
    selectedSectors = Array.from(sectorFilters).filter(cb => cb.checked).map(cb => normalizeTag(cb.value));
    if (filterPanel && selectedSectors.length > 0) filterPanel.style.display = "block";
  }

  if (inboundSearch && searchInput) {
    searchInput.value = inboundSearch;
  }

  applyFilters();
}

loadResources();