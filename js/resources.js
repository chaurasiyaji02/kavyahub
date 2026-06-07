let resources = [];

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

let selectedTags = [];

/* TAG HELPERS */

function normalizeTag(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase();
}

function getResourceTags(resource) {
  const tags = Array.isArray(resource.tags)
    ? resource.tags
    : [];

  const category = resource.category
    ? [resource.category]
    : [];

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

/* CARD */

function createCard(resource) {
  return `
    <div class="resource-card">

      <div class="tag-row">
        ${createTagHTML(resource)}
      </div>

      <h3>${resource.title}</h3>

      <p>${resource.description || ""}</p>

      <small>${resource.upload_date || ""}</small>

      <button
        class="unlock-btn"
        data-link="${resource.link}">
        Open Resource
      </button>

    </div>
  `;
}

/* RENDER */

function renderResources(data) {
  resourcesContainer.innerHTML = "";

  if (data.length === 0) {
    emptyState.style.display = "block";
    resourceCount.textContent = "0";
    return;
  }

  emptyState.style.display = "none";

  data.forEach(resource => {
    resourcesContainer.innerHTML += createCard(resource);
  });

  resourceCount.textContent = data.length;
}

/* FEATURED */

function loadFeatured() {
  const featured = resources.find(item => item.featured);

  if (!featured) {
    featuredTitle.textContent = "No Featured Resource";
    featuredDescription.textContent = "Admin panel se featured resource select karo.";
    featuredButton.dataset.link = "#";
    return;
  }

  featuredTitle.textContent = featured.title;
  featuredDescription.textContent = featured.description || "";
  featuredButton.dataset.link = featured.link || "#";
}

/* ACTIVE FILTER CHIPS */

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

/* SEARCH + MULTI FILTER */

function applyFilters() {
  const term = searchInput.value.toLowerCase().trim();

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

    const matchSearch =
      term === "" || searchableText.includes(term);

    const matchTags =
      selectedTags.length === 0 ||
      selectedTags.some(tag => tags.includes(tag));

    return matchSearch && matchTags;
  });

  renderResources(filtered);
  renderActiveFilters();
}

/* FILTER PANEL */

filterToggleBtn?.addEventListener("click", () => {
  if (!filterPanel) return;

  filterPanel.style.display =
    filterPanel.style.display === "none" ? "block" : "none";
});

tagFilters.forEach(input => {
  input.addEventListener("change", () => {
    selectedTags = Array.from(tagFilters)
      .filter(item => item.checked)
      .map(item => normalizeTag(item.value));

    applyFilters();
  });
});

clearFiltersBtn?.addEventListener("click", () => {
  selectedTags = [];

  tagFilters.forEach(input => {
    input.checked = false;
  });

  applyFilters();
});

searchInput?.addEventListener("input", applyFilters);

/* LOAD SUPABASE */

async function loadResources() {
  const { data, error } = await supabaseClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  resources = data || [];

  renderResources(resources);
  loadFeatured();
}

loadResources();