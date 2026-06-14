let videos = [];

const videosContainer = document.getElementById("videosContainer");
const videoSearch = document.getElementById("videoSearch");
const videoCount = document.getElementById("videoCount");
const videoEmptyState = document.getElementById("videoEmptyState");
const filterButtons = document.querySelectorAll(".video-filter-btn");

const featuredVideoTitle = document.getElementById("featuredVideoTitle");
const featuredVideoDescription = document.getElementById("featuredVideoDescription");
const featuredVideoButton = document.getElementById("featuredVideoButton");
const featuredVideoResourceButton = document.getElementById("featuredVideoResourceButton");

let currentCategory = "all";
let currentFilteredVideos = [];

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

  if (!videoId) {
    return "assets/images/default-thumbnail.jpg";
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

async function increaseVideoView(id) {
  const video = videos.find(item => item.id === id);

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

function createVideoCard(video) {
  const thumbnail = getYouTubeThumbnail(video.youtube_link);

  return `
    <div class="resource-card">

      <img src="${thumbnail}" alt="${video.title}" class="video-thumbnail">

      <span class="tag">${video.category || "Video"}</span>

      <h3>${video.title}</h3>

      <p>${video.description || ""}</p>

      <small>
        ${video.created_at ? new Date(video.created_at).toLocaleDateString() : ""}
      </small>

      <small>👁 ${video.views || 0} views</small>

      <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
        <a
          href="${video.youtube_link}"
          target="_blank"
          class="small-btn video-view-btn"
          data-id="${video.id}">
          Watch Video
        </a>

        ${
          video.resource_link
            ? `<button type="button" class="unlock-btn" data-link="${video.resource_link}">
                Open Resource
              </button>`
            : ""
        }
      </div>

    </div>
  `;
}

function renderVideos(data) {
  currentFilteredVideos = data;
  videosContainer.innerHTML = "";

  if (data.length === 0) {
    videoEmptyState.style.display = "block";
    videoCount.textContent = "0";
    return;
  }

  videoEmptyState.style.display = "none";

  data.forEach(video => {
    videosContainer.innerHTML += createVideoCard(video);
  });

  videoCount.textContent = data.length;
}

function loadFeaturedVideo() {
  let featured = videos.find(video => video.featured);

  if (!featured && videos.length > 0) {
    featured = videos[0];
  }

  if (!featured) {
    featuredVideoTitle.textContent = "No Video Added Yet";
    featuredVideoDescription.textContent = "Add a video from the admin panel.";
    featuredVideoButton.dataset.link = "#";
    featuredVideoButton.dataset.id = "";
    featuredVideoResourceButton.dataset.link = "#";
    return;
  }

  featuredVideoTitle.textContent = featured.title;
  featuredVideoDescription.textContent = featured.description || "";

  featuredVideoButton.dataset.link = featured.youtube_link || "#";
  featuredVideoButton.dataset.id = featured.id;
  featuredVideoResourceButton.dataset.link = featured.resource_link || "#";
}

function applyFilters() {
  const term = videoSearch.value.toLowerCase().trim();

  const filtered = videos.filter(video => {
    const matchCategory =
      currentCategory === "all" || video.category === currentCategory;

    const searchableText = [
      video.title,
      video.description,
      video.category,
      ...(video.tags || [])
    ]
      .join(" ")
      .toLowerCase();

    const matchSearch =
      term === "" || searchableText.includes(term);

    return matchCategory && matchSearch;
  });

  renderVideos(filtered);
}

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    currentCategory = button.dataset.category;
    applyFilters();
  });
});

videoSearch?.addEventListener("input", applyFilters);

featuredVideoButton?.addEventListener("click", async () => {
  const link = featuredVideoButton.dataset.link;
  const id = Number(featuredVideoButton.dataset.id);

  if (id) {
    await increaseVideoView(id);
    renderVideos(currentFilteredVideos);
    loadFeaturedVideo();
  }

  if (link && link !== "#") {
    window.open(link, "_blank");
  }
});

featuredVideoResourceButton?.addEventListener("click", () => {
  const link = featuredVideoResourceButton.dataset.link;

  if (!link || link === "#") {
    alert("Resource link not added yet.");
    return;
  }

  const popupOverlay = document.getElementById("popupOverlay");

  window.currentLink = link;

  if (popupOverlay) {
    popupOverlay.style.display = "flex";
  }
});

async function loadVideos() {
  const { data, error } = await supabaseClient
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  videos = data || [];

  renderVideos(videos);
  loadFeaturedVideo();
}

loadVideos();

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".video-view-btn");

  if (!btn) return;

  if (btn.dataset.clicked === "true") return;
  btn.dataset.clicked = "true";

  const id = Number(btn.dataset.id);

  if (id) {
    await increaseVideoView(id);
    renderVideos(currentFilteredVideos);
    loadFeaturedVideo();
  }

  setTimeout(() => {
    btn.dataset.clicked = "false";
  }, 1500);
});