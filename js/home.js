const homeLatestResources = document.getElementById("homeLatestResources");
const homeLatestVideos = document.getElementById("homeLatestVideos");

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

function createHomeResourceCard(resource) {
  return `
    <div class="resource-card">
      <span class="tag">${resource.category || "Resource"}</span>

      <h3>${resource.title}</h3>

      <p>${resource.description || ""}</p>

      <small>${resource.upload_date || ""}</small>

      <button class="unlock-btn" data-link="${resource.link}">
        Open Resource
      </button>
    </div>
  `;
}

function createHomeVideoCard(video) {
  const thumbnail = getYouTubeThumbnail(video.youtube_link);

  return `
    <div class="resource-card">
      <img src="${thumbnail}" alt="${video.title}" class="video-thumbnail">

      <span class="tag">${video.category || "Video"}</span>

      <h3>${video.title}</h3>

      <p>${video.description || ""}</p>

      <small>${video.upload_date || ""}</small>

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

async function loadHomeData() {
  const { data: resources, error: resourceError } = await supabaseClient
    .from("resources")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: videos, error: videoError } = await supabaseClient
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(3);

  if (resourceError) {
    console.error(resourceError);
  }

  if (videoError) {
    console.error(videoError);
  }

  homeLatestResources.innerHTML = "";

  if (resources && resources.length > 0) {
    resources.forEach(resource => {
      homeLatestResources.innerHTML += createHomeResourceCard(resource);
    });
  } else {
    homeLatestResources.innerHTML = `
      <div class="resource-card">
        <h3>No Resources Yet</h3>
        <p>Admin panel se resources add karo.</p>
      </div>
    `;
  }

  homeLatestVideos.innerHTML = "";

  if (videos && videos.length > 0) {
    videos.forEach(video => {
      homeLatestVideos.innerHTML += createHomeVideoCard(video);
    });
  } else {
    homeLatestVideos.innerHTML = `
      <div class="resource-card">
        <h3>No Videos Yet</h3>
        <p>Admin panel se videos add karo.</p>
      </div>
    `;
  }
}

loadHomeData();