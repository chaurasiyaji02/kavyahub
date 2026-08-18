/* ==========================================================================
   KAVYAHUB - CALENDAR CONTROLLER (TIMELINE & EVENT TYPE PARSER)
   ========================================================================== */

// DOM Elements Selection
const calendarDate = document.getElementById("calendarDate");
const calendarContainer = document.getElementById("calendarContainer");
const calendarCount = document.getElementById("calendarCount");
const calendarEmptyState = document.getElementById("calendarEmptyState");
const selectedDateTitle = document.getElementById("selectedDateTitle");
const selectedDateSub = document.getElementById("selectedDateSub");
const typeFilterButtons = document.querySelectorAll("#calendarTypeFilters .video-filter-btn");

// Presets
const presetToday = document.getElementById("presetToday");
const presetYesterday = document.getElementById("presetYesterday");
const presetWeek = document.getElementById("presetWeek");
const presetAll = document.getElementById("presetAll");
const todayPresetBtn = document.getElementById("todayPresetBtn");
const resetToRecentBtn = document.getElementById("resetToRecentBtn");

// Modal Elements
const descModalOverlay = document.getElementById("descriptionModalOverlay");
const descModalClose = document.getElementById("descriptionModalClose");
const modalBadgeRow = document.getElementById("modalBadgeRow");
const modalTitle = document.getElementById("modalTitle");
const modalMetaInfo = document.getElementById("modalMetaInfo");
const modalDescriptionContent = document.getElementById("modalDescriptionContent");
const modalActionRow = document.getElementById("modalActionRow");

let allResources = [];
let allVideos = [];
let currentTypeFilter = "all"; // 'all' | 'resource' | 'video'
let activeTimelineMode = "date"; // 'date' | 'week' | 'latest'

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

function formatDate(dateString) {
  if (!dateString) return "Recent Date";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
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

function getYouTubeId(url) {
  if (!url) return null;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname.includes("youtu.be")) return parsedUrl.pathname.slice(1);
    if (parsedUrl.pathname.includes("/shorts/")) return parsedUrl.pathname.split("/shorts/")[1].split("/")[0];
    if (parsedUrl.searchParams.get("v")) return parsedUrl.searchParams.get("v");
    return null;
  } catch (e) {
    return null;
  }
}

function getYouTubeThumbnail(url) {
  const videoId = getYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "assets/images/default-thumbnail.jpg";
}

function formatViews(views) {
  const num = Number(views || 0);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

function getLocalYYYYMMDD(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function renderSkeletons(container, count = 4) {
  if (!container) return;
  container.innerHTML = Array(count).fill(`
    <div class="resource-card skeleton-card">
      <div class="skeleton skeleton-tag"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `).join("");
}

/* --------------------------------------------------------------------------
   2. CARD BUILDERS
   -------------------------------------------------------------------------- */

function createResourceCard(resource) {
  const descriptionText = resource.description || "";
  const isLongDescription = descriptionText.length > 115;
  const currentCategory = String(resource.category || "").trim().toLowerCase();

  let orgBadgeHTML = "";
  if (resource.org_type && resource.org_type !== "none") {
    const isGov = resource.org_type === "government";
    orgBadgeHTML = `
      <span class="badge-pill ${isGov ? 'govt-pill' : 'private-pill'}">
        <i class="${isGov ? 'fa-solid fa-building-shield' : 'fa-solid fa-building'}"></i> ${isGov ? 'Govt' : 'Private'}
      </span>
    `;
  }

  const deepShareLink = `${window.location.origin}/resources.html?search=${encodeURIComponent(resource.title)}`;
  const resourceJSON = encodeURIComponent(JSON.stringify({ ...resource, itemType: "resource" }));

  return `
    <div class="resource-card" data-item="${resourceJSON}">
      <div class="tag-row">
        <span class="badge-pill neutral-pill"><i class="fa-solid fa-folder-open"></i> ${escapeHTML(resource.category || "Resource")}</span>
        ${orgBadgeHTML}
      </div>
      
      <h3 class="card-title">${escapeHTML(resource.title)}</h3>

      <div class="resource-description-clamp">
        ${escapeHTML(descriptionText)}
      </div>

      ${isLongDescription ? `<button type="button" class="read-more-btn cal-modal-trigger">Read More</button>` : ""}

      <div class="card-footer-meta">
        <small><i class="fa-regular fa-calendar"></i> ${formatDate(resource.upload_date)}</small>
        <small><i class="fa-regular fa-eye"></i> ${formatViews(resource.views)} views</small>
      </div>

      <div class="card-actions">
        <button type="button" class="unlock-btn open-resource-btn" data-link="${resource.link}">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Resource
        </button>
        <button type="button" class="share-btn" data-link="${deepShareLink}" title="Share Opportunity">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
      </div>
    </div>
  `;
}

function createVideoCard(video) {
  const thumbnail = getYouTubeThumbnail(video.youtube_link);
  const descriptionText = video.description || "";
  const isLongDescription = descriptionText.length > 115;

  let orgBadgeHTML = "";
  if (video.org_type && video.org_type !== "none") {
    const isGov = video.org_type === "government";
    orgBadgeHTML = `
      <span class="badge-pill ${isGov ? 'govt-pill' : 'private-pill'}">
        <i class="${isGov ? 'fa-solid fa-building-shield' : 'fa-solid fa-building'}"></i> ${isGov ? 'Govt' : 'Private'}
      </span>
    `;
  }

  const deepShareLink = `${window.location.origin}/videos.html?search=${encodeURIComponent(video.title)}`;
  const videoJSON = encodeURIComponent(JSON.stringify({ ...video, itemType: "video" }));

  return `
    <div class="resource-card video-card" data-item="${videoJSON}">
      <div class="video-thumbnail-wrapper">
        <img src="${thumbnail}" alt="${escapeHTML(video.title)}" class="video-thumbnail" loading="lazy">
        <div class="video-play-overlay"><i class="fa-solid fa-play"></i></div>
      </div>
      
      <div class="tag-row">
        <span class="badge-pill neutral-pill"><i class="fa-solid fa-video"></i> ${escapeHTML(video.category || "Video")}</span>
        ${orgBadgeHTML}
      </div>

      <h3 class="card-title">${escapeHTML(video.title)}</h3>

      <div class="resource-description-clamp">
        ${escapeHTML(descriptionText)}
      </div>

      ${isLongDescription ? `<button type="button" class="read-more-btn cal-modal-trigger">Read More</button>` : ""}
      
      <div class="card-footer-meta">
        <small><i class="fa-regular fa-calendar"></i> ${formatDate(video.upload_date)}</small>
        <small><i class="fa-regular fa-eye"></i> ${formatViews(video.views)} views</small>
      </div>

      <div class="card-actions">
        <a href="${video.youtube_link}" target="_blank" rel="noopener noreferrer" class="small-btn watch-btn">
          <i class="fa-brands fa-youtube"></i> Watch
        </a>
        ${video.resource_link ? `
          <button type="button" class="unlock-btn open-resource-btn" data-link="${video.resource_link}">
            Resource
          </button>
        ` : ""}
        <button type="button" class="share-btn" data-link="${deepShareLink}" title="Share Video">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   3. TIMELINE RENDER & FILTER MODULE
   -------------------------------------------------------------------------- */

function filterByType(items, type) {
  if (type === "resource") return items.filter(i => i.link && !i.youtube_link);
  if (type === "video") return items.filter(i => i.youtube_link);
  return items;
}

function renderTimeline() {
  if (!calendarContainer) return;

  let matchedResources = [];
  let matchedVideos = [];

  if (activeTimelineMode === "date") {
    const chosenDate = calendarDate?.value || getLocalYYYYMMDD(0);
    if (selectedDateTitle) selectedDateTitle.textContent = formatDate(chosenDate);
    if (selectedDateSub) selectedDateSub.textContent = `All uploads recorded on ${formatDate(chosenDate)}.`;

    matchedResources = allResources.filter(item => item.upload_date === chosenDate);
    matchedVideos = allVideos.filter(item => item.upload_date === chosenDate);
  } else if (activeTimelineMode === "week") {
    if (selectedDateTitle) selectedDateTitle.textContent = "Past 7 Days Timeline";
    if (selectedDateSub) selectedDateSub.textContent = "All opportunities and tutorials uploaded in the last 7 days.";

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    matchedResources = allResources.filter(item => new Date(item.upload_date) >= sevenDaysAgo);
    matchedVideos = allVideos.filter(item => new Date(item.upload_date) >= sevenDaysAgo);
  } else if (activeTimelineMode === "latest") {
    if (selectedDateTitle) selectedDateTitle.textContent = "Latest Uploads";
    if (selectedDateSub) selectedDateSub.textContent = "Most recently uploaded content across the platform.";

    matchedResources = allResources.slice(0, 12);
    matchedVideos = allVideos.slice(0, 12);
  }

  // Apply Event Type Switcher
  let displayList = [];
  if (currentTypeFilter === "resource") {
    displayList = matchedResources.map(r => createResourceCard(r));
  } else if (currentTypeFilter === "video") {
    displayList = matchedVideos.map(v => createVideoCard(v));
  } else {
    displayList = [
      ...matchedResources.map(r => createResourceCard(r)),
      ...matchedVideos.map(v => createVideoCard(v))
    ];
  }

  if (calendarCount) {
    calendarCount.textContent = displayList.length;
  }

  if (displayList.length === 0) {
    calendarContainer.innerHTML = "";
    if (calendarEmptyState) calendarEmptyState.style.display = "flex";
    return;
  }

  if (calendarEmptyState) calendarEmptyState.style.display = "none";
  calendarContainer.innerHTML = displayList.join("");
}

/* --------------------------------------------------------------------------
   4. MODAL HANDLER
   -------------------------------------------------------------------------- */

function openDetailsModal(item) {
  if (!descModalOverlay) return;

  const isVideo = item.itemType === "video" || !!item.youtube_link;
  const isGov = item.org_type === "government";
  const orgBadge = (item.org_type && item.org_type !== "none")
    ? `<span class="badge-pill ${isGov ? 'govt-pill' : 'private-pill'}">${isGov ? 'Govt' : 'Private'}</span>`
    : "";

  modalBadgeRow.innerHTML = `
    <span class="badge-pill neutral-pill">${escapeHTML(item.category || (isVideo ? "Video" : "Resource"))}</span>
    ${orgBadge}
  `;

  modalTitle.textContent = item.title || "Details";

  modalMetaInfo.innerHTML = `
    <span><i class="fa-regular fa-calendar"></i> Uploaded: ${formatDate(item.upload_date)}</span>
    <span><i class="fa-regular fa-eye"></i> ${formatViews(item.views)} views</span>
  `;

  modalDescriptionContent.innerHTML = formatStructuredText(item.description);

  if (isVideo) {
    modalActionRow.innerHTML = `
      <a href="${item.youtube_link}" target="_blank" rel="noopener noreferrer" class="btn primary-btn full-btn">
        <i class="fa-brands fa-youtube"></i> Watch Video
      </a>
      ${item.resource_link ? `
        <button type="button" class="unlock-btn" data-link="${item.resource_link}">
          <i class="fa-solid fa-file"></i> Attached Material
        </button>
      ` : ""}
    `;
  } else {
    modalActionRow.innerHTML = `
      <button type="button" class="unlock-btn full-btn" data-link="${item.link}">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Resource Link
      </button>
    `;
  }

  descModalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeDetailsModal() {
  if (descModalOverlay) {
    descModalOverlay.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

if (descModalClose) descModalClose.addEventListener("click", closeDetailsModal);
if (descModalOverlay) {
  descModalOverlay.addEventListener("click", (e) => {
    if (e.target === descModalOverlay) closeDetailsModal();
  });
}

// Global Delegated Listeners
document.addEventListener("click", (e) => {
  const trigger = e.target.closest(".cal-modal-trigger");
  if (trigger) {
    const card = trigger.closest(".resource-card");
    if (card && card.dataset.item) {
      const data = JSON.parse(decodeURIComponent(card.dataset.item));
      openDetailsModal(data);
    }
  }
});

/* --------------------------------------------------------------------------
   5. PRESET BUTTONS & EVENT LISTENERS
   -------------------------------------------------------------------------- */

typeFilterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    typeFilterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentTypeFilter = btn.dataset.filter || "all";
    renderTimeline();
  });
});

if (calendarDate) {
  calendarDate.addEventListener("change", () => {
    activeTimelineMode = "date";
    renderTimeline();
  });
}

if (todayPresetBtn) {
  todayPresetBtn.addEventListener("click", () => {
    if (calendarDate) calendarDate.value = getLocalYYYYMMDD(0);
    activeTimelineMode = "date";
    renderTimeline();
  });
}

if (presetToday) {
  presetToday.addEventListener("click", () => {
    if (calendarDate) calendarDate.value = getLocalYYYYMMDD(0);
    activeTimelineMode = "date";
    renderTimeline();
  });
}

if (presetYesterday) {
  presetYesterday.addEventListener("click", () => {
    if (calendarDate) calendarDate.value = getLocalYYYYMMDD(-1);
    activeTimelineMode = "date";
    renderTimeline();
  });
}

if (presetWeek) {
  presetWeek.addEventListener("click", () => {
    activeTimelineMode = "week";
    renderTimeline();
  });
}

if (presetAll || resetToRecentBtn) {
  const handler = () => {
    activeTimelineMode = "latest";
    renderTimeline();
  };
  if (presetAll) presetAll.addEventListener("click", handler);
  if (resetToRecentBtn) resetToRecentBtn.addEventListener("click", handler);
}

/* --------------------------------------------------------------------------
   6. DATA INITIALIZER
   -------------------------------------------------------------------------- */

async function loadCalendarData() {
  renderSkeletons(calendarContainer, 4);

  try {
    const [resourcesResult, videosResult] = await Promise.all([
      supabaseClient.from("resources").select("*").order("upload_date", { ascending: false }),
      supabaseClient.from("videos").select("*").order("upload_date", { ascending: false })
    ]);

    if (resourcesResult.error) console.error("Resources fetch error:", resourcesResult.error);
    if (videosResult.error) console.error("Videos fetch error:", videosResult.error);

    allResources = resourcesResult.data || [];
    allVideos = videosResult.data || [];

    const todayStr = getLocalYYYYMMDD(0);
    if (calendarDate) {
      calendarDate.value = todayStr;
    }

    activeTimelineMode = "date";
    renderTimeline();
  } catch (err) {
    console.error("Calendar load error:", err);
  }
}

loadCalendarData();