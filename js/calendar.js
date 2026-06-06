const calendarDate = document.getElementById("calendarDate");
const calendarContainer = document.getElementById("calendarContainer");
const calendarCount = document.getElementById("calendarCount");
const calendarEmptyState = document.getElementById("calendarEmptyState");
const selectedDateTitle = document.getElementById("selectedDateTitle");

let allResources = [];
let allVideos = [];

function formatDate(dateString) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
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

  if (!videoId) {
    return "assets/images/default-thumbnail.jpg";
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function createResourceCard(resource) {
  return `
    <div class="resource-card">
      <span class="tag">${resource.category || "Resource"}</span>

      <h3>${resource.title}</h3>

      <p>${resource.description || ""}</p>

      <small>${formatDate(resource.upload_date)}</small>

      <button class="unlock-btn" data-link="${resource.link}">
        Open Resource
      </button>
    </div>
  `;
}

function createVideoCard(video) {
  const thumbnail = getYouTubeThumbnail(video.youtube_link);

  return `
    <div class="resource-card">
      <img src="${thumbnail}" alt="${video.title}" class="video-thumbnail">

      <span class="tag">Video / ${video.category || "General"}</span>

      <h3>${video.title}</h3>

      <p>${video.description || ""}</p>

      <small>${formatDate(video.upload_date)}</small>

      <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
        <a href="${video.youtube_link}" target="_blank" class="small-btn">
          Watch Video
        </a>

        ${
          video.resource_link
            ? `<button class="unlock-btn" data-link="${video.resource_link}">
                Open Resource
              </button>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderCalendarItems(selectedDate) {
  calendarContainer.innerHTML = "";

  selectedDateTitle.textContent = formatDate(selectedDate);

  const resources = allResources.filter(item => item.upload_date === selectedDate);
  const videos = allVideos.filter(item => item.upload_date === selectedDate);

  const total = resources.length + videos.length;

  calendarCount.textContent = total;

  if (total === 0) {
    calendarEmptyState.style.display = "block";
    return;
  }

  calendarEmptyState.style.display = "none";

  resources.forEach(resource => {
    calendarContainer.innerHTML += createResourceCard(resource);
  });

  videos.forEach(video => {
    calendarContainer.innerHTML += createVideoCard(video);
  });
}

async function loadCalendarData() {
  const { data: resourcesData, error: resourceError } = await supabaseClient
    .from("resources")
    .select("*")
    .order("upload_date", { ascending: false });

  const { data: videosData, error: videoError } = await supabaseClient
    .from("videos")
    .select("*")
    .order("upload_date", { ascending: false });

  if (resourceError) {
    console.error(resourceError);
  }

  if (videoError) {
    console.error(videoError);
  }

  allResources = resourcesData || [];
  allVideos = videosData || [];

  const today = new Date().toISOString().split("T")[0];

  calendarDate.value = today;
  renderCalendarItems(today);
}

calendarDate?.addEventListener("change", () => {
  renderCalendarItems(calendarDate.value);
});

loadCalendarData();