/* ==========================================================================
   KAVYAHUB - VIDEOS CONTROLLER (YOUTUBE HORIZONTAL ARCHITECTURE & DEEP-LINKED)
   ========================================================================== */

let videos = [];
let currentCategory = "all";
let selectedVideoSectors = [];
let currentFilteredVideos = [];
let searchDebounceTimer = null;

// DOM Elements Selection
const videosContainer = document.getElementById("videosContainer");
const videoSearch = document.getElementById("videoSearch");
const clearVideoSearch = document.getElementById("clearVideoSearch");
const videoCount = document.getElementById("videoCount");
const videoEmptyState = document.getElementById("videoEmptyState");
const resetVideoFiltersBtn = document.getElementById("resetVideoFiltersBtn");
const filterButtons = document.querySelectorAll(".video-filter-btn");
const videoSectorFilters = document.querySelectorAll(".video-sector-filter");

const featuredVideoSection = document.getElementById("featuredVideoSection");
const featuredVideoTitle = document.getElementById("featuredVideoTitle");
const featuredVideoDescription = document.getElementById("featuredVideoDescription");
const featuredVideoButton = document.getElementById("featuredVideoButton");
const featuredVideoResourceButton = document.getElementById("featuredVideoResourceButton");

// Modal Elements
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
    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.slice(1);
    }
    if (parsedUrl.pathname.includes("/shorts/")) {
      return parsedUrl.pathname.split("/shorts/")[1].split("/")[0];
    }
    if (parsedUrl.searchParams.get("v")) {
      return parsedUrl.searchParams.get("v");
    }
    return null;
  } catch (error) {
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

function renderSkeletons(container, count = 4) {
  if (!container) return;
  container.innerHTML = Array(count).fill(`
    <div class="youtube-video-card skeleton-card">
      <div class="skeleton yt-skeleton-thumb"></div>
      <div class="yt-skeleton-details">
        <div class="skeleton yt-skeleton-badge"></div>
        <div class="skeleton yt-skeleton-title"></div>
        <div class="skeleton yt-skeleton-text"></div>
        <div class="skeleton yt-skeleton-actions"></div>
      </div>
    </div>
  `).join("");
}

/* --------------------------------------------------------------------------
   2. VIEW COUNTER LOGIC
   -------------------------------------------------------------------------- */

async function increaseVideoView(id) {
  const video = videos.find(item => item.id == id);
  if (video) {
    video.views = (video.views || 0) + 1;
  }

  const { error } = await supabaseClient.rpc(
    "increment_video_views",
    { video_id: id }
  );

  if (error) {
    console.error("Video view error:", error);
    if (video) {
      video.views = Math.max((video.views || 1) - 1, 0);
    }
  }
}

/* --------------------------------------------------------------------------
   3. YOUTUBE HORIZONTAL CARD TEMPLATE
   -------------------------------------------------------------------------- */

function createVideoCard(video) {
  const thumbnail = getYouTubeThumbnail(video.youtube_link);
  const videoDate = video.created_at ? new Date(video.created_at).toLocaleDateString() : "";
  const descriptionText = video.description || "";
  const isLongDescription = descriptionText.length > 120;

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
  const videoJSON = encodeURIComponent(JSON.stringify(video));

  return `
    <div class="youtube-video-card" data-video="${videoJSON}">
      
      <!-- Left 16:9 Thumbnail Column -->
      <div class="youtube-thumb-wrapper">
        <img src="${thumbnail}" alt="${escapeHTML(video.title)}" class="youtube-card-thumbnail" loading="lazy">
        <div class="thumb-play-overlay"><i class="fa-solid fa-play"></i></div>
      </div>

      <!-- Right Metadata & Content Column -->
      <div class="youtube-content-wrapper">
        
        <div class="tag-row">
          <span class="badge-pill neutral-pill">${escapeHTML(video.category || "Video")}</span>
          ${orgBadgeHTML}
        </div>

        <h3 class="video-card-title">${escapeHTML(video.title)}</h3>
        
        <div class="resource-description-clamp">
          ${escapeHTML(descriptionText)}
        </div>

        ${isLongDescription ? `<button type="button" class="read-more-btn video-modal-trigger">Read More</button>` : ""}

        <div class="card-footer-meta">
          <small><i class="fa-regular fa-calendar"></i> ${escapeHTML(videoDate)}</small>
          <small><i class="fa-regular fa-eye"></i> ${formatViews(video.views)} views</small>
        </div>

        <div class="card-actions yt-actions">
          <a
            href="${video.youtube_link}"
            target="_blank"
            rel="noopener noreferrer"
            class="small-btn watch-btn video-view-btn"
            data-id="${video.id}">
            <i class="fa-brands fa-youtube"></i> Watch Video
          </a>

          ${video.resource_link ? `
            <button type="button" class="unlock-btn open-resource-btn" data-link="${video.resource_link}">
              <i class="fa-solid fa-file-lines"></i> Resource Link
            </button>
          ` : ""}

          <button 
            type="button" 
            class="share-btn" 
            data-link="${deepShareLink}" 
            title="Share Video">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>

      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   4. RENDER & FEATURED MODULE
   -------------------------------------------------------------------------- */

function renderVideos(data) {
  currentFilteredVideos = data;
  if (!videosContainer) return; 

  if (data.length === 0) {
    videosContainer.innerHTML = "";
    if (videoEmptyState) videoEmptyState.style.display = "flex";
    if (videoCount) videoCount.textContent = "0";
    return;
  }

  if (videoEmptyState) videoEmptyState.style.display = "none";
  videosContainer.innerHTML = data.map(video => createVideoCard(video)).join("");

  if (videoCount) {
    videoCount.textContent = data.length;
  }
}

function loadFeaturedVideo() {
  if (!featuredVideoTitle || !featuredVideoDescription || !featuredVideoButton) return;

  let featured = videos.find(video => video.featured);
  if (!featured && videos.length > 0) {
    featured = videos[0];
  }

  if (!featured) {
    if (featuredVideoSection) featuredVideoSection.style.display = "none";
    return;
  }

  if (featuredVideoSection) featuredVideoSection.style.display = "block";
  featuredVideoTitle.textContent = featured.title;
  featuredVideoDescription.textContent = featured.description || "";
  featuredVideoButton.dataset.link = featured.youtube_link || "#";
  featuredVideoButton.dataset.id = featured.id;

  if (featuredVideoResourceButton) {
    featuredVideoResourceButton.dataset.link = featured.resource_link || "#";
    if (!featured.resource_link || featured.resource_link === "#") {
      featuredVideoResourceButton.style.display = "none";
    } else {
      featuredVideoResourceButton.style.display = "inline-flex";
    }
  }
}

/* --------------------------------------------------------------------------
   5. FILTER, DEBOUNCED SEARCH & URL SYNC
   -------------------------------------------------------------------------- */

function applyFilters() {
  const term = videoSearch ? videoSearch.value.toLowerCase().trim() : "";

  if (clearVideoSearch) {
    clearVideoSearch.style.display = term ? "block" : "none";
  }

  const filtered = videos.filter(video => {
    const matchCategory = currentCategory === "all" || String(video.category || "").toLowerCase() === currentCategory.toLowerCase();

    const searchableText = [
      video.title,
      video.description,
      video.category,
      ...(video.tags || [])
    ].join(" ").toLowerCase();

    const matchSearch = term === "" || searchableText.includes(term);

    const videoOrg = String(video.org_type || "none").toLowerCase().trim();
    const matchSectors = selectedVideoSectors.length === 0 || selectedVideoSectors.includes(videoOrg);

    return matchCategory && matchSearch && matchSectors;
  });

  renderVideos(filtered);
}

function updateURLState() {
  const params = new URLSearchParams();
  if (currentCategory !== "all") params.set("category", currentCategory);
  if (videoSearch && videoSearch.value.trim()) params.set("search", videoSearch.value.trim());
  
  const newURL = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
  window.history.replaceState({}, "", newURL);
}

/* --------------------------------------------------------------------------
   6. MODAL & CLICK EVENT DELEGATION
   -------------------------------------------------------------------------- */

function openVideoDetailsModal(video) {
  if (!descModalOverlay) return;

  const isGov = video.org_type === "government";
  const orgBadge = (video.org_type && video.org_type !== "none")
    ? `<span class="badge-pill ${isGov ? 'govt-pill' : 'private-pill'}">${isGov ? 'Govt' : 'Private'}</span>`
    : "";

  modalBadgeRow.innerHTML = `
    <span class="badge-pill neutral-pill">${escapeHTML(video.category || "Video")}</span>
    ${orgBadge}
  `;

  modalTitle.textContent = video.title || "Video Details";

  const videoDate = video.created_at ? new Date(video.created_at).toLocaleDateString() : "";
  modalMetaInfo.innerHTML = `
    <span><i class="fa-regular fa-calendar"></i> Uploaded: ${escapeHTML(videoDate)}</span>
    <span><i class="fa-regular fa-eye"></i> ${formatViews(video.views)} views</span>
  `;

  modalDescriptionContent.innerHTML = formatStructuredText(video.description);

  modalActionRow.innerHTML = `
    <a href="${video.youtube_link}" target="_blank" rel="noopener noreferrer" class="btn primary-btn full-btn video-view-btn" data-id="${video.id}">
      <i class="fa-brands fa-youtube"></i> Watch on YouTube
    </a>
    ${video.resource_link ? `
      <button type="button" class="unlock-btn" data-link="${video.resource_link}">
        <i class="fa-solid fa-file-lines"></i> Open Resource
      </button>
    ` : ""}
  `;

  descModalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeVideoDetailsModal() {
  if (descModalOverlay) {
    descModalOverlay.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

if (descModalClose) {
  descModalClose.addEventListener("click", closeVideoDetailsModal);
}

if (descModalOverlay) {
  descModalOverlay.addEventListener("click", (e) => {
    if (e.target === descModalOverlay) closeVideoDetailsModal();
  });
}

// Global Event Delegation
document.addEventListener("click", async (e) => {
  // 1. Read More Modal Trigger
  const modalTrigger = e.target.closest(".video-modal-trigger");
  if (modalTrigger) {
    const card = modalTrigger.closest(".youtube-video-card");
    if (card && card.dataset.video) {
      const data = JSON.parse(decodeURIComponent(card.dataset.video));
      openVideoDetailsModal(data);
    }
    return;
  }

  // 2. Video View Counter Tracking
  const watchBtn = e.target.closest(".video-view-btn");
  if (watchBtn) {
    if (watchBtn.dataset.clicked === "true") return;
    watchBtn.dataset.clicked = "true";
    const id = watchBtn.dataset.id;
    if (id) {
      await increaseVideoView(id);
    }
    setTimeout(() => {
      watchBtn.dataset.clicked = "false";
    }, 1500);
    return;
  }

  // 3. Share Button
  const shareBtn = e.target.closest(".share-btn");
  if (shareBtn) {
    const shareUrl = shareBtn.getAttribute("data-link");
    if (navigator.share) {
      navigator.share({
        title: "Check out this video guide on KavyaHub",
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("Video link copied to clipboard!");
      });
    }
  }
});

/* --------------------------------------------------------------------------
   7. EVENT LISTENERS & FILTER TRIGGERS
   -------------------------------------------------------------------------- */

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    currentCategory = button.dataset.category || "all";
    applyFilters();
    updateURLState();
  });
});

videoSectorFilters.forEach(input => {
  input.addEventListener("change", () => {
    selectedVideoSectors = Array.from(videoSectorFilters)
      .filter(item => item.checked)
      .map(item => String(item.value || "").toLowerCase().trim());

    applyFilters();
  });
});

if (videoSearch) {
  videoSearch.addEventListener("input", () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      applyFilters();
      updateURLState();
    }, 200);
  });
}

if (clearVideoSearch) {
  clearVideoSearch.addEventListener("click", () => {
    videoSearch.value = "";
    applyFilters();
    updateURLState();
    videoSearch.focus();
  });
}

if (resetVideoFiltersBtn) {
  resetVideoFiltersBtn.addEventListener("click", () => {
    currentCategory = "all";
    filterButtons.forEach(btn => {
      btn.classList.toggle("active", btn.dataset.category === "all");
    });

    videoSectorFilters.forEach(cb => (cb.checked = false));
    selectedVideoSectors = [];

    if (videoSearch) videoSearch.value = "";
    if (clearVideoSearch) clearVideoSearch.style.display = "none";

    applyFilters();
    updateURLState();
  });
}

if (featuredVideoButton) {
  featuredVideoButton.addEventListener("click", async () => {
    const link = featuredVideoButton.dataset.link;
    const id = featuredVideoButton.dataset.id;

    if (id) {
      await increaseVideoView(id);
      renderVideos(currentFilteredVideos);
      loadFeaturedVideo();
    }

    if (link && link !== "#") {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  });
}

/* --------------------------------------------------------------------------
   8. DATA INITIALIZER FROM SUPABASE
   -------------------------------------------------------------------------- */

async function loadVideos() {
  renderSkeletons(videosContainer, 4);

  const { data, error } = await supabaseClient
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading videos:", error);
    if (videosContainer) videosContainer.innerHTML = `<div class="empty-state"><p>Error loading videos. Please refresh.</p></div>`;
    return;
  }

  videos = data || [];
  loadFeaturedVideo();

  // Inbound query / category check from URL
  const urlParams = new URLSearchParams(window.location.search);
  const inboundSearch = urlParams.get("search");
  const inboundCategory = urlParams.get("category");

  if (inboundCategory) {
    const targetBtn = Array.from(filterButtons).find(btn => btn.dataset.category === inboundCategory.toLowerCase());
    if (targetBtn) {
      filterButtons.forEach(btn => btn.classList.remove("active"));
      targetBtn.classList.add("active");
      currentCategory = inboundCategory.toLowerCase();
    }
  }

  if (inboundSearch && videoSearch) {
    videoSearch.value = inboundSearch;
  }

  applyFilters();
}

loadVideos();