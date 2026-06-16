/* ==========================================================================
   KAVYAHUB - HOMEPAGE CONTROLLER (TRENDING & LATEST FEEDS)
   ========================================================================== */

// DOM Elements Selection
const trendingResources = document.getElementById("trendingResources");
const trendingVideos = document.getElementById("trendingVideos");

const homeLatestResources = document.getElementById("homeLatestResources");
const homeLatestVideos = document.getElementById("homeLatestVideos");

const homeProfileImage = document.getElementById("homeProfileImage");
const homeProfileName = document.getElementById("homeProfileName");
const homeProfileBio = document.getElementById("homeProfileBio");

const socialSection = document.getElementById("socialSection");
const socialCardsContainer = document.getElementById("socialCardsContainer");

const otherAccountsSection = document.getElementById("otherAccountsSection");
const otherAccountsContainer = document.getElementById("otherAccountsContainer");

/* --------------------------------------------------------------------------
   1. UTILITY & URL HELPERS
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

function getPlatformIcon(platform) {
  const icons = {
    youtube: "fa-brands fa-youtube",
    instagram: "fa-brands fa-instagram",
    telegram: "fa-brands fa-telegram",
    linkedin: "fa-brands fa-linkedin",
    whatsapp: "fa-brands fa-whatsapp",
    website: "fa-solid fa-globe"
  };

  return icons[platform] || "fa-solid fa-link";
}

function formatViews(views) {
  return Number(views || 0);
}

/* --------------------------------------------------------------------------
   2. CARD TEMPLATES (HTML BUILDERS)
   -------------------------------------------------------------------------- */

function createSocialCard(platform, url, title, subtitle) {
  if (!url || url.trim() === "") return "";

  return `
    <a href="${url}" target="_blank" rel="noopener noreferrer" class="social-card ${platform}">
      <i class="${getPlatformIcon(platform)}"></i>
      <h3>${title}</h3>
      <p>${subtitle}</p>
    </a>
  `;
}

function createOtherAccountCard(account) {
  if (!account.url || !account.is_active) return "";

  return `
    <div class="account-card">
      <i class="${getPlatformIcon(account.platform)}"></i>
      <div>
        <h3>${account.account_name}</h3>
        <p>${account.description || account.platform || "Account"}</p>
      </div>
      <a href="${account.url}" target="_blank" rel="noopener noreferrer" class="small-btn">
        Open
      </a>
    </div>
  `;
}

function createHomeResourceCard(resource) {
  return `
    <div class="resource-card">
      <span class="tag">${resource.category || "Resource"}</span>
      <h3>${resource.title}</h3>
      <p>${resource.description || ""}</p>
      <small>${resource.upload_date || ""}</small>
      <small>👁 ${formatViews(resource.views)} views</small>
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
      <img src="${thumbnail}" alt="${video.title}" class="video-thumbnail" loading="lazy">
      <span class="tag">${video.category || "Video"}</span>
      <h3>${video.title}</h3>
      <p>${video.description || ""}</p>
      <small>${video.upload_date || ""}</small>
      <small>👁 ${formatViews(video.views)} views</small>

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
   3. DATA INITIALIZERS
   -------------------------------------------------------------------------- */

// Profile & Social Media Loader
async function loadProfileAndSocials() {
  const { data, error } = await supabaseClient
    .from("profile")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Profile load error:", error);
    return;
  }

  if (!data) return;

  if (data.name && homeProfileName) {
    homeProfileName.textContent = data.name;
    document.title = `${data.name} | Resource Hub`;
  }

  if (data.bio && homeProfileBio) {
    homeProfileBio.textContent = data.bio;
  }

  if (data.profile_image && homeProfileImage) {
    homeProfileImage.src = data.profile_image;
  }

  const socialCards = [
    createSocialCard("youtube", data.youtube, "YouTube", "Main Channel"),
    createSocialCard("instagram", data.instagram, "Instagram", "Daily Updates"),
    createSocialCard("telegram", data.telegram, "Telegram", "Free Resources"),
    createSocialCard("linkedin", data.linkedin, "LinkedIn", "Professional Updates"),
    createSocialCard("whatsapp", data.whatsapp, "WhatsApp", "Direct Updates")
  ].join("");

  if (socialCards.trim() !== "" && socialCardsContainer && socialSection) {
    socialCardsContainer.innerHTML = socialCards;
    socialSection.style.display = "block";
  } else if (socialSection) {
    socialSection.style.display = "none";
  }
}

// Other Accounts Sub-channel Loader
async function loadOtherAccounts() {
  const { data, error } = await supabaseClient
    .from("other_accounts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Other accounts load error:", error);
    return;
  }

  if (!data || data.length === 0) {
    if (otherAccountsSection) otherAccountsSection.style.display = "none";
    return;
  }

  const accountsHTML = data.map(account => createOtherAccountCard(account)).join("");

  if (accountsHTML.trim() === "" && otherAccountsSection) {
    otherAccountsSection.style.display = "none";
    return;
  }

  if (otherAccountsContainer && otherAccountsSection) {
    otherAccountsContainer.innerHTML = accountsHTML;
    otherAccountsSection.style.display = "block";
  }
}

// Home Feeds Loader (Optimized Parallel Execution)
async function loadHomeData() {
  try {
    // Optimization: Run all 4 content fetches parallelly instead of a sequential waterfall
    const [
      latestResResult,
      latestVidResult,
      trendingResResult,
      trendingVidResult
    ] = await Promise.all([
      supabaseClient.from("resources").select("*").order("created_at", { ascending: false }).limit(3),
      supabaseClient.from("videos").select("*").order("created_at", { ascending: false }).limit(3),
      supabaseClient.from("resources").select("*").order("views", { ascending: false }).limit(3),
      supabaseClient.from("videos").select("*").order("views", { ascending: false }).limit(3)
    ]);

    if (latestResResult.error) console.error(latestResResult.error);
    if (latestVidResult.error) console.error(latestVidResult.error);
    if (trendingResResult.error) console.error(trendingResResult.error);
    if (trendingVidResult.error) console.error(trendingVidResult.error);

    // Render Trending Resources
    if (trendingResources) {
      const trendResourcesData = trendingResResult.data || [];
      if (trendResourcesData.length > 0) {
        trendingResources.innerHTML = trendResourcesData.map(r => createHomeResourceCard(r)).join("");
      } else {
        trendingResources.innerHTML = `
          <div class="resource-card">
            <h3>No Trending Resources Yet</h3>
            <p>Popular resources will appear here after users start opening them.</p>
          </div>
        `;
      }
    }

    // Render Trending Videos
    if (trendingVideos) {
      const trendVideosData = trendingVidResult.data || [];
      if (trendVideosData.length > 0) {
        trendingVideos.innerHTML = trendVideosData.map(v => createHomeVideoCard(v)).join("");
      } else {
        trendingVideos.innerHTML = `
          <div class="resource-card">
            <h3>No Trending Videos Yet</h3>
            <p>Popular videos will appear here after users start watching them.</p>
          </div>
        `;
      }
    }

    // Render Latest Resources
    if (homeLatestResources) {
      const resourcesData = latestResResult.data || [];
      if (resourcesData.length > 0) {
        homeLatestResources.innerHTML = resourcesData.map(r => createHomeResourceCard(r)).join("");
      } else {
        homeLatestResources.innerHTML = `
          <div class="resource-card">
            <h3>No Resources Yet</h3>
            <p>No resources available yet.</p>
          </div>
        `;
      }
    }

    // Render Latest Videos
    if (homeLatestVideos) {
      const videosData = latestVidResult.data || [];
      if (videosData.length > 0) {
        homeLatestVideos.innerHTML = videosData.map(v => createHomeVideoCard(v)).join("");
      } else {
        homeLatestVideos.innerHTML = `
          <div class="resource-card">
            <h3>No Videos Yet</h3>
            <p>No videos available yet.</p>
          </div>
        `;
      }
    }
  } catch (err) {
    console.error("Error processing home blocks:", err);
  }
}

/* --------------------------------------------------------------------------
   4. EXECUTION TRIGGERS
   -------------------------------------------------------------------------- */
loadProfileAndSocials();
loadOtherAccounts();
loadHomeData();