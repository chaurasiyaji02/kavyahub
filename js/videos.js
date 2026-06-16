/* ==========================================================================
   KAVYAHUB - VIDEOS CONTROLLER (SEARCH, CATEGORY FILTERS & VIEWS)
   ========================================================================== */

let videos = [];
let currentCategory = "all";
let currentFilteredVideos = [];

// DOM Elements Selection
const videosContainer = document.getElementById("videosContainer");
const videoSearch = document.getElementById("videoSearch");
const videoCount = document.getElementById("videoCount");
const videoEmptyState = document.getElementById("videoEmptyState");
const filterButtons = document.querySelectorAll(".video-filter-btn");

const featuredVideoTitle = document.getElementById("featuredVideoTitle");
const featuredVideoDescription = document.getElementById("featuredVideoDescription");
const featuredVideoButton = document.getElementById("featuredVideoButton");
const featuredVideoResourceButton = document.getElementById("featuredVideoResourceButton");

/* --------------------------------------------------------------------------
   1. YOUTUBE HELPERS
   -------------------------------------------------------------------------- */

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

/* --------------------------------------------------------------------------
   2. VIEW COUNTER LOGIC
   -------------------------------------------------------------------------- */

async function increaseVideoView(id) {
  // Loose equality (==) allows compatibility with both numeric and string UUIDs
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
    // Rollback if DB tracking fails
    if (video) {
      video.views = Math.max((video.views || 1) - 1, 0);
    }
  }
}

/* --------------------------------------------------------------------------
   3. CARD HTML TEMPLATE
   -------------------------------------------------------------------------- */

function createVideoCard(video) {
  const thumbnail = getYouTubeThumbnail(video.youtube_link);
  const videoDate = video.created_at ? new Date(video.created_at).toLocaleDateString() : "";

  return `
    <div class="resource-card">
      <img src="${thumbnail}" alt="${video.title}" class="video-thumbnail" loading="lazy">
      <span class="tag">${video.category || "Video"}</span>

      <h3>${video.title}</h3>
      <p>${video.description || ""}</p>

      <small>${videoDate}</small>
      <small>👁 ${video.views || 0} views</small>

      <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
        <a
          href="${video.youtube_link}"
          target="_blank"
          rel="noopener noreferrer"
          class="small-btn video-view-btn"
          data-id="${video.id}">
          Watch Video
        </a>

        ${video.resource_link ? `
          <button type="button" class="unlock-btn" data-link="${video.resource_link}">
            Open Resource
          </button>
        ` : ""}
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   4. RENDER MODULE
   -------------------------------------------------------------------------- */

function renderVideos(data) {
  currentFilteredVideos = data;

  if (!videosContainer) return; // Guard clause

  if (data.length === 0) {
    videosContainer.innerHTML = "";
    if (videoEmptyState) videoEmptyState.style.display = "block";
    if (videoCount) videoCount.textContent = "0";
    return;
  }

  if (videoEmptyState) videoEmptyState.style.display = "none";

  // Optimization: Render all elements in one single DOM operation
  videosContainer.innerHTML = data.map(video => createVideoCard(video)).join("");

  if (videoCount) {
    videoCount.textContent = data.length;
  }
}

/* --------------------------------------------------------------------------
   5. FEATURED CONTAINER
   -------------------------------------------------------------------------- */

function loadFeaturedVideo() {
  if (!featuredVideoTitle || !featuredVideoDescription || !featuredVideoButton) return;

  let featured = videos.find(video => video.featured);

  // Fallback to first video if no explicit featured choice exists
  if (!featured && videos.length > 0) {
    featured = videos[0];
  }

  if (!featured) {
    featuredVideoTitle.textContent = "No Video Added Yet";
    featuredVideoDescription.textContent = "Add a video from the admin panel.";
    featuredVideoButton.dataset.link = "#";
    featuredVideoButton.dataset.id = "";
    if (featuredVideoResourceButton) featuredVideoResourceButton.dataset.link = "#";
    return;
  }

  featuredVideoTitle.textContent = featured.title;
  featuredVideoDescription.textContent = featured.description || "";

  featuredVideoButton.dataset.link = featured.youtube_link || "#";
  featuredVideoButton.dataset.id = featured.id;

  if (featuredVideoResourceButton) {
    featuredVideoResourceButton.dataset.link = featured.resource_link || "#";
    
    // Enhancement/Fix: Ensuring it integrates perfectly with main.js event delegation
    featuredVideoResourceButton.classList.add("unlock-btn"); 
    
    // UI Feedback if resource is missing
    if (!featured.resource_link || featured.resource_link === "#") {
      featuredVideoResourceButton.style.display = "none";
    } else {
      featuredVideoResourceButton.style.display = "inline-block";
    }
  }
}

/* --------------------------------------------------------------------------
   6. FILTER & SEARCH LOGIC
   -------------------------------------------------------------------------- */

function applyFilters() {
  const term = videoSearch ? videoSearch.value.toLowerCase().trim() : "";

  const filtered = videos.filter(video => {
    const matchCategory = currentCategory === "all" || video.category === currentCategory;

    const searchableText = [
      video.title,
      video.description,
      video.category,
      ...(video.tags || [])
    ]
      .join(" ")
      .toLowerCase();

    const matchSearch = term === "" || searchableText.includes(term);

    return matchCategory && matchSearch;
  });

  renderVideos(filtered);
}

/* --------------------------------------------------------------------------
   7. EVENT LISTENERS & INITIALIZATION
   -------------------------------------------------------------------------- */

// Category Filter Tabs Click Actions
filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    currentCategory = button.dataset.category || "all";
    applyFilters();
  });
});

// Search typing action
if (videoSearch) {
  videoSearch.addEventListener("input", applyFilters);
}

// Featured Video Play Button Action
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

// Global Delegated Clicks for Video Cards (PC & Mobile Safe)
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".video-view-btn");
  if (!btn) return;

  if (btn.dataset.clicked === "true") return;
  btn.dataset.clicked = "true";

  const id = btn.dataset.id;

  if (id) {
    await increaseVideoView(id);
    renderVideos(currentFilteredVideos);
    loadFeaturedVideo();
  }

  setTimeout(() => {
    btn.dataset.clicked = "false";
  }, 1500);
});

// Main data initializer from Supabase
async function loadVideos() {
  const { data, error } = await supabaseClient
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading videos:", error);
    return;
  }

  videos = data || [];

  renderVideos(videos);
  loadFeaturedVideo();
}

// Run initializer
loadVideos();