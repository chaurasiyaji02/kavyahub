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
   2. CARD TEMPLATES (HTML BUILDERS UPGRADED FOR ENGINE PARITY)
   -------------------------------------------------------------------------- */

function createResourceCard(resource) {
  const descriptionText = resource.description || "";
  const isLongDescription = descriptionText.length > 120;
  
  // Checking safely if calendar element is logged as a Job Opportunity
  const isJob = String(resource.category).toLowerCase() === "job";

  let jobBadgesHTML = "";
  if (isJob) {
    const jobType = resource.job_type ? resource.job_type : "Remote";
    const isActive = resource.is_active !== false;
    
    jobBadgesHTML = `
      <div class="job-meta-row" style="display: flex; gap: 10px; margin: -5px 0 12px 0; font-size: 0.8rem; align-items: center;">
        <span class="job-type-badge" style="background: rgba(var(--primary-rgb), 0.1); color: var(--primary); padding: 3px 8px; border-radius: 4px; font-weight: 500; text-transform: capitalize;">
          <i class="fa-solid fa-briefcase" style="font-size: 0.75rem; margin-right: 2px;"></i> ${jobType}
        </span>
        <span class="job-status-indicator" style="display: inline-flex; align-items: center; gap: 5px; font-weight: 500; color: var(--text-main);">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isActive ? '#22c55e' : '#ef4444'}; display: inline-block;"></span>
          ${isActive ? 'Active' : 'Expired'}
        </span>
      </div>
    `;
  }

  return `
    <div class="resource-card">
      <div class="tag-row" style="margin-bottom: 12px; display: block;">
        <span class="tag" style="text-transform: capitalize;">${resource.category || "Resource"}</span>
      </div>
      
      <h3>${resource.title}</h3>

      ${jobBadgesHTML}

      <p class="resource-description">${descriptionText}</p>
      ${isLongDescription ? `<button type="button" class="read-more-btn">Read More</button>` : ""}
      
      <div style="margin-bottom: 12px; display: block;">
        <small><i class="fa-solid fa-calendar-days" style="font-size:0.75rem; margin-right:4px;"></i>${formatDate(resource.upload_date)}</small>
      </div>

      <div style="display: flex; gap: 8px; width: 100%; margin-top: auto;">
        <button type="button" class="unlock-btn" data-link="${resource.link}" style="flex: 1; margin: 0;">
          Open Resource
        </button>
        <button 
          type="button" 
          class="share-btn" 
          data-link="${resource.link}" 
          title="Copy Link to Share"
          style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; cursor: pointer; color: var(--text-main); transition: background 0.2s;">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
      </div>
    </div>
  `;
}

function createVideoCard(video) {
  const thumbnail = getYouTubeThumbnail(video.youtube_link);
  const descriptionText = video.description || "";
  const isLongDescription = descriptionText.length > 120;

  return `
    <div class="resource-card">
      <img src="${thumbnail}" alt="${video.title}" class="video-thumbnail" loading="lazy">
      
      <div class="tag-row" style="margin: 12px 0; display: block;">
        <span class="tag" style="text-transform: capitalize;">Video / ${video.category || "General"}</span>
      </div>

      <h3>${video.title}</h3>

      <p class="resource-description">${descriptionText}</p>
      ${isLongDescription ? `<button type="button" class="read-more-btn">Read More</button>` : ""}

      <div style="margin-bottom: 12px; display: block;">
        <small><i class="fa-solid fa-calendar-days" style="font-size:0.75rem; margin-right:4px;"></i>${formatDate(video.upload_date)}</small>
      </div>

      <div style="display:flex; gap:8px; width: 100%; margin-top:auto;">
        <a href="${video.youtube_link}" target="_blank" rel="noopener noreferrer" class="small-btn" style="flex: 1; text-align: center; display: flex; align-items: center; justify-content: center; margin: 0;">
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
          data-link="${video.youtube_link}" 
          title="Copy Video Link to Share"
          style="width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; cursor: pointer; color: var(--text-main); transition: background 0.2s;">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   3. CALENDAR RENDER MODULE
   -------------------------------------------------------------------------- */

function renderCalendarItems(selectedDate) {
  if (!calendarContainer) return; 

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