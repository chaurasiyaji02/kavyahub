/* ==========================================================================
   KAVYAHUB - RESOURCES CONTROLLER (SEARCH, FILTER & VIEWS)
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
  // Loose equality (==) allows matching both string UUIDs and numeric IDs seamlessly
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
    // Rollback if DB write fails
    if (resource) {
      resource.views = Math.max((resource.views || 1) - 1, 0);
    }
  }
}

/* --------------------------------------------------------------------------
   3. CARD HTML TEMPLATE
   -------------------------------------------------------------------------- */

function createCard(resource) {
  const descriptionText = resource.description || "";
  const isLongDescription = descriptionText.length > 120;

  return `
    <div class="resource-card">
      <div class="tag-row">
        ${createTagHTML(resource)}
      </div>

      <h3>${resource.title}</h3>

      <p class="resource-description">${descriptionText}</p>

      ${isLongDescription ? `<button class="read-more-btn">Read More</button>` : ""}

      <small>${resource.upload_date || ""}</small>
      <small>👁 ${resource.views || 0} views</small>

      <button
        class="unlock-btn resource-view-btn"
        data-id="${resource.id}"
        data-link="${resource.link}">
        Open Resource
      </button>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   4. RENDER MODULE
   -------------------------------------------------------------------------- */

function renderResources(data) {
  currentFilteredResources = data;
  
  if (!resourcesContainer) return; // Guard clause

  if (data.length === 0) {
    resourcesContainer.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    if (resourceCount) resourceCount.textContent = "0";
    return;
  }

  if (emptyState) emptyState.style.display = "none";

  // Optimization: Map string building and update DOM once. Massive performance gain!
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

// Toggle Filter Panel View
if (filterToggleBtn && filterPanel) {
  filterToggleBtn.addEventListener("click", () => {
    filterPanel.style.display = filterPanel.style.display === "none" ? "block" : "none";
  });
}

// Multi-tag filters change
tagFilters.forEach(input => {
  input.addEventListener("change", () => {
    selectedTags = Array.from(tagFilters)
      .filter(item => item.checked)
      .map(item => normalizeTag(item.value));

    applyFilters();
  });
});

// Clear filters button action
if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    selectedTags = [];
    tagFilters.forEach(input => {
      input.checked = false;
    });
    applyFilters();
  });
}

// Search input interaction
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
}

// Initialize on page run
loadResources();

/* --------------------------------------------------------------------------
   9. GLOBAL DELEGATED CLICK EVENTS (PC & Mobile Safe)
   -------------------------------------------------------------------------- */

document.addEventListener("click", async (e) => {
  // Handle Resource Views Click
  const btn = e.target.closest(".resource-view-btn");
  if (btn) {
    if (btn.dataset.clicked === "true") return;
    btn.dataset.clicked = "true";

    const id = btn.dataset.id; // Kept flexible for integer or string uuid

    if (id) {
      await increaseResourceView(id);
      renderResources(currentFilteredResources);
      loadFeatured();
    }

    setTimeout(() => {
      btn.dataset.clicked = "false";
    }, 1500);
    return; // Fast exit
  }

  // Handle Read More / Read Less Toggle
  const readMoreBtn = e.target.closest(".read-more-btn");
  if (readMoreBtn) {
    const description = readMoreBtn.previousElementSibling;
    if (description) {
      description.classList.toggle("expanded");
      readMoreBtn.textContent = description.classList.contains("expanded") ? "Read Less" : "Read More";
    }
    return;
  }
});

// Featured resource button listener
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