/* ==========================================================================
   KAVYAHUB - CALENDAR CONTROLLER (DATE-WISE FILTER SYSTEM)
   ========================================================================== */

// DOM Elements Selection
const calendarDate = document.getElementById("calendarDate");
const calendarContainer = document.getElementById("calendarContainer");
const calendarCount = document.getElementById("calendarCount");
const calendarEmptyState = document.getElementById("calendarEmptyState");
const selectedDateTitle = document.getElementById("selectedDateTitle");

let allResources = [];
let allVideos = [];

/* --------------------------------------------------------------------------
   1. DATE & UTILITY HELPERS
   -------------------------------------------------------------------------- */

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
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "assets/images/default-thumbnail.jpg";
}

/* --------------------------------------------------------------------------
   2. CARD TEMPLATES (HTML BUILDERS)
   -------------------------------------------------------------------------- */

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
      <img src="${thumbnail}" alt="${video.title}" class="video-thumbnail" loading="lazy">
      <span class="tag">Video / ${video.category || "General"}</span>
      <h3>${video.title}</h3>
      <p>${video.description || ""}</p>
      <small>${formatDate(video.upload_date)}</small>

      <div style="display:flex; gap:10px; margin-top:15px; flex-wrap:wrap;">
        <a href="${video.youtube_link}" target="_blank" rel="noopener noreferrer" class="small-btn">
          Watch Video
        </a>
        ${video.resource_link ? `
          <button class="unlock-btn" data-link="${video.resource_link}">
            Open Resource
          </button>
        ` : ""}
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   3. CALENDAR RENDER MODULE
   -------------------------------------------------------------------------- */

function renderCalendarItems(selectedDate) {
  if (!calendarContainer) return; // Guard Clause

  if (selectedDateTitle) {
    selectedDateTitle.textContent = formatDate(selectedDate);
  }

  // Filter items matching the chosen exact date
  const resources = allResources.filter(item => item.upload_date === selectedDate);
  const videos = allVideos.filter(item => item.upload_date === selectedDate);
  const total = resources.length + videos.length;

  if (calendarCount) {
    calendarCount.textContent = total;
  }

  if (total === 0) {
    calendarContainer.innerHTML = "";
    if (calendarEmptyState) calendarEmptyState.style.display = "block";
    return;
  }

  if (calendarEmptyState) calendarEmptyState.style.display = "none";

  // Optimization: Map lists to array strings, combine, and perform exactly 1 DOM injection
  const resourcesHTML = resources.map(resource => createResourceCard(resource)).join("");
  const videosHTML = videos.map(video => createVideoCard(video)).join("");

  calendarContainer.innerHTML = resourcesHTML + videosHTML;
}

/* --------------------------------------------------------------------------
   4. DATA INITIALIZER & NETWORK FETCHING
   -------------------------------------------------------------------------- */

async function loadCalendarData() {
  try {
    // Optimization: Parallelizes network queries instead of waiting sequentially
    const [resourcesResult, videosResult] = await Promise.all([
      supabaseClient.from("resources").select("*").order("upload_date", { ascending: false }),
      supabaseClient.from("videos").select("*").order("upload_date", { ascending: false })
    ]);

    if (resourcesResult.error) console.error(resourcesResult.error);
    if (videosResult.error) console.error(videosResult.error);

    allResources = resourcesResult.data || [];
    allVideos = videosResult.data || [];

    // Optimization/Fix: Get safe local YYYY-MM-DD instead of forced UTC ISO split
    const localDate = new Date();
    const yyyy = localDate.getFullYear();
    const mm = String(localDate.getMonth() + 1).padStart(2, '0');
    const dd = String(localDate.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;

    if (calendarDate) {
      calendarDate.value = today;
    }
    
    renderCalendarItems(today);
  } catch (err) {
    console.error("Calendar system data processing error:", err);
  }
}

/* --------------------------------------------------------------------------
   5. EVENT LISTENERS
   -------------------------------------------------------------------------- */

if (calendarDate) {
  calendarDate.addEventListener("change", () => {
    renderCalendarItems(calendarDate.value);
  });
}

// Trigger Execution
loadCalendarData();