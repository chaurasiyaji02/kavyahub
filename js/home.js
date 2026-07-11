/* ==========================================================================
   KAVYAHUB - HOMEPAGE CONTROLLER (AUDITED & DEEP-LINK POWERED)
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
   2. CARD TEMPLATES (UPGRADED FOR DEEP-LINK RETENTION)
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
  const descriptionText = resource.description || "";
  const isLongDescription = descriptionText.length > 120;
  
  // UPGRADE: Full normalization tags scanner array parity tracking systems
  const currentCategory = String(resource.category || "").trim().toLowerCase();
  const isJob = currentCategory === "job" || currentCategory === "internship";
  const isHackathon = currentCategory === "hackathon";
  const isScholarship = currentCategory === "scholarship";

  // A. JOB / INTERNSHIP METADATA CARD PILLS BUILDER
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

  // UPGRADE: B. HACKATHON METADATA CARD PILLS BUILDER
  let hackathonBadgesHTML = "";
  if (isHackathon) {
    const hackathonMode = resource.job_type ? resource.job_type : "Online";
    const isActive = resource.is_active !== false;

    hackathonBadgesHTML = `
      <div class="hackathon-meta-row" style="display: flex; gap: 10px; margin: -5px 0 12px 0; font-size: 0.8rem; align-items: center;">
        <span class="hackathon-mode-badge" style="background: rgba(168, 85, 247, 0.1); color: #a855f7; padding: 3px 8px; border-radius: 4px; font-weight: 500; text-transform: capitalize;">
          <i class="fa-solid fa-laptop-code" style="font-size: 0.75rem; margin-right: 2px;"></i> ${hackathonMode}
        </span>
        <span class="hackathon-status-indicator" style="display: inline-flex; align-items: center; gap: 5px; font-weight: 500; color: var(--text-main);">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${isActive ? '#22c55e' : '#ef4444'}; display: inline-block;"></span>
          ${isActive ? 'Active' : 'Closed'}
        </span>
      </div>
    `;
  }

  // UPGRADE: C. SCHOLARSHIP METADATA GOLD BADGE BUILDER
  let scholarshipBadgesHTML = "";
  if (isScholarship) {
    scholarshipBadgesHTML = `
      <div class="scholarship-meta-row" style="display: flex; gap: 10px; margin: -5px 0 12px 0; font-size: 0.8rem; align-items: center;">
        <span class="scholarship-vip-badge" style="background: linear-gradient(135deg, #f59e0b, #e08e0b); color: #fff; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.22);">
          <i class="fa-solid fa-graduation-cap"></i> Verified Scholarship
        </span>
      </div>
    `;
  }

  // UPGRADE: D. RESOURCE PROVIDER SECTOR BADGE (Govt vs Private marker tags setup)
  let orgBadgeHTML = "";
  if (resource.org_type && resource.org_type !== "none") {
    const isGov = resource.org_type === "government";
    orgBadgeHTML = `
      <span class="tag org-indicator-chip" style="background: ${isGov ? 'rgba(59, 130, 246, 0.12)' : 'rgba(100, 116, 139, 0.1)'}; color: ${isGov ? '#3b82f6' : 'var(--text-main)'}; border: 1px solid ${isGov ? 'rgba(59, 130, 246, 0.25)' : 'var(--border-color)'}; font-weight: 600; font-size: 0.75rem; text-transform: capitalize;">
        <i class="${isGov ? 'fa-solid fa-building-shield' : 'fa-solid fa-building'}"></i> ${isGov ? 'Govt' : 'Private'}
      </span>
    `;
  }

  // FIXED: Routes homepage resource shares back through resources directory loops
  const deepShareLink = `${window.location.origin}/resources.html?search=${encodeURIComponent(resource.title)}`;

  return `
    <div class="resource-card">
      <div class="tag-row" style="margin-bottom: 12px; display: flex; gap: 6px; flex-wrap: wrap;">
        <span class="tag" style="text-transform: capitalize; margin: 0;">${resource.category || "Resource"}</span>
        ${orgBadgeHTML}
      </div>
      
      <h3>${resource.title}</h3>

      ${jobBadgesHTML}
      ${hackathonBadgesHTML}
      ${scholarshipBadgesHTML}

      <p class="resource-description">${descriptionText}</p>
      ${isLongDescription ? `<button type="button" class="read-more-btn">Read More</button>` : ""}

      <div style="margin-bottom: 12px; display: block;">
        <small style="display:inline-block; margin-right:10px;">${resource.upload_date || ""}</small>
        <small style="display:inline-block;">👁 ${formatViews(resource.views)} views</small>
      </div>

      <div style="display: flex; gap: 8px; width: 100%; margin-top: auto;">
        <button type="button" class="unlock-btn" data-link="${resource.link}" style="flex: 1; margin: 0;">
          Open Resource
        </button>
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

function createHomeVideoCard(video) {
  const thumbnail = getYouTubeThumbnail(video.youtube_link);
  const descriptionText = video.description || "";
  const isLongDescription = descriptionText.length > 120;

  // UPGRADE: VIDEO OPPORTUNITY PROVIDER SECTOR BADGE SETUP
  let orgBadgeHTML = "";
  if (video.org_type && video.org_type !== "none") {
    const isGov = video.org_type === "government";
    orgBadgeHTML = `
      <span class="tag org-indicator-chip" style="background: ${isGov ? 'rgba(59, 130, 246, 0.12)' : 'rgba(100, 116, 139, 0.1)'}; color: ${isGov ? '#3b82f6' : 'var(--text-main)'}; border: 1px solid ${isGov ? 'rgba(59, 130, 246, 0.25)' : 'var(--border-color)'}; font-weight: 600; font-size: 0.75rem; text-transform: capitalize; display: inline-flex; align-items: center; gap: 4px;">
        <i class="${isGov ? 'fa-solid fa-building-shield' : 'fa-solid fa-building'}"></i> ${isGov ? 'Govt' : 'Private'}
      </span>
    `;
  }

  // FIXED: Routes homepage video shares back through videos sub-directories channels
  const deepShareLink = `${window.location.origin}/videos.html?search=${encodeURIComponent(video.title)}`;

  return `
    <div class="resource-card">
      <img src="${thumbnail}" alt="${video.title}" class="video-thumbnail" loading="lazy">
      
      <div class="tag-row" style="margin: 12px 0; display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
        <span class="tag" style="text-transform: capitalize; margin: 0;">${video.category || "Video"}</span>
        ${orgBadgeHTML}
      </div>

      <h3>${video.title}</h3>

      <p class="resource-description">${descriptionText}</p>
      ${isLongDescription ? `<button type="button" class="read-more-btn">Read More</button>` : ""}
      
      <div style="margin-bottom: 12px; display: block;">
        <small style="display:inline-block; margin-right:10px;">${video.upload_date || ""}</small>
        <small style="display:inline-block;">👁 ${formatViews(video.views)} views</small>
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
   3. DATA INITIALIZERS
   -------------------------------------------------------------------------- */

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

async function loadHomeData() {
  try {
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