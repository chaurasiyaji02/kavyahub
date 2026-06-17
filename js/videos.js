/* ==========================================================================
   KAVYAHUB - VIDEOS CONTROLLER (AUDITED & DEEP-LINK POWERED)
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
   3. CARD HTML TEMPLATE (DEEP-LINK UPDATED)
   -------------------------------------------------------------------------- */

function createVideoCard(video) {
  const thumbnail = getYouTubeThumbnail(video.youtube_link);
  const videoDate = video.created_at ? new Date(video.created_at).toLocaleDateString() : "";
  const descriptionText = video.description || "";
  const isLongDescription = descriptionText.length > 120;

  // FIXED: Generates platform-locked inbound tracking loops
  const deepShareLink = `${window.location.origin}/videos.html?search=${encodeURIComponent(video.title)}`;

  return `
    <div class="resource-card">
      <img src="${thumbnail}" alt="${video.title}" class="video-thumbnail" loading="lazy">
      <span class="tag" style="text-transform: capitalize;">${video.category || "Video"}</span>

      <h3>${video.title}</h3>
      
      <p class="resource-description">${descriptionText}</p>
      ${isLongDescription ? `<button type="button" class="read-more-btn">Read More</button>` : ""}

      <div style="margin-bottom: 12px; display: block;">
        <small style="display:inline-block; margin-right:10px;">${videoDate}</small>
        <small style="display:inline-block;">👁 ${video.views || 0} views</small>
      </div>

      <div style="display:flex; gap:8px; margin-top:auto; flex-wrap:wrap; width: 100%;">
        <a
          href="${video.youtube_link}"
          target="_blank"
          rel="noopener noreferrer"
          class="small-btn video-view-btn"
          data-id="${video.id}"
          style="flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; margin: 0;">
          Watch Video
        </a>

        ${video.resource_link ? `
          <button type="button" class="unlock-btn" data-link="${video.resource_link}" style="margin: 0; padding: 0 15px;">
            Open Resource
          </button>
        ` : ""}

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

function renderVideos(data) {
  currentFilteredVideos = data;
  if (!videosContainer) return; 

  if (data.length === 0) {
    videosContainer.innerHTML = "";
    if (videoEmptyState) videoEmptyState.style.display = "block";
    if (videoCount) videoCount.textContent = "0";
    return;
  }

  if (videoEmptyState) videoEmptyState.style.display = "none";
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
    featuredVideoResourceButton.classList.add("unlock-btn"); 
    
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
    const matchCategory = currentCategory === "all" || String(video.category).toLowerCase() === currentCategory.toLowerCase();

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

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    currentCategory = button.dataset.category || "all";
    applyFilters();
  });
});

if (videoSearch) {
  videoSearch.addEventListener("input", applyFilters);
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

  // FEATURE: Inbound traffic deep-link router parser for video cards logs
  const urlParams = new URLSearchParams(window.location.search);
  const inboundVideoQuery = urlParams.get("search");
  if (inboundVideoQuery && videoSearch) {
    videoSearch.value = inboundVideoQuery;
    applyFilters();
    setTimeout(() => videoSearch.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  }
}

loadVideos();