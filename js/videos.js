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

      <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
        <a href="${video.youtube_link}" target="_blank" class="small-btn">
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
    featuredVideoDescription.textContent = "Admin panel se video add karo.";
    featuredVideoButton.dataset.link = "#";
    featuredVideoResourceButton.dataset.link = "#";
    return;
  }

  featuredVideoTitle.textContent = featured.title;
  featuredVideoDescription.textContent = featured.description || "";

  featuredVideoButton.dataset.link = featured.youtube_link || "#";
  featuredVideoResourceButton.dataset.link = featured.resource_link || "#";
}

function applyFilters() {
  const term = videoSearch.value.toLowerCase().trim();

  const filtered = videos.filter(video => {
    const matchCategory =
      currentCategory === "all" || video.category === currentCategory;

    const matchSearch =
      (video.title || "").toLowerCase().includes(term) ||
      (video.description || "").toLowerCase().includes(term);

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

featuredVideoButton?.addEventListener("click", () => {
  const link = featuredVideoButton.dataset.link;

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