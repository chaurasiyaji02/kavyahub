/* ==========================================================================
   KAVYAHUB - HOMEPAGE CONTROLLER (OPTIMIZED, FORMATTED & DEEP-LINK POWERED)
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

// Global Modal Elements
const descModalOverlay = document.getElementById("descriptionModalOverlay");
const descModalClose = document.getElementById("descriptionModalClose");
const modalBadgeRow = document.getElementById("modalBadgeRow");
const modalTitle = document.getElementById("modalTitle");
const modalMetaInfo = document.getElementById("modalMetaInfo");
const modalDescriptionContent = document.getElementById("modalDescriptionContent");
const modalActionRow = document.getElementById("modalActionRow");

/* --------------------------------------------------------------------------
   1. UTILITY & FORMATTING HELPERS
   -------------------------------------------------------------------------- */

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatStructuredText(text) {
  if (!text) return "";
  const escaped = escapeHTML(text);
  
  return escaped
    .split("\n")
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
        return `<div class="formatted-bullet">• ${trimmed.substring(2)}</div>`;
      }
      return trimmed ? `<p class="formatted-paragraph">${trimmed}</p>` : `<div class="formatted-spacer"></div>`;
    })
    .join("");
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
  const num = Number(views || 0);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

function renderResourceSkeletons(container, count = 3) {
  if (!container) return;
  container.innerHTML = Array(count).fill(`
    <div class="resource-card skeleton-card">
      <div class="skeleton skeleton-tag"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text" style="width: 70%;"></div>
      <div class="skeleton skeleton-btn"></div>
    </div>
  `).join("");
}

function renderVideoSkeletons(container, count = 2) {
  if (!container) return;
  container.innerHTML = Array(count).fill(`
    <div class="youtube-video-card skeleton-card">
      <div class="skeleton yt-skeleton-thumb"></div>
      <div class="yt-skeleton-details">
        <div class="skeleton yt-skeleton-badge"></div>
        <div class="skeleton yt-skeleton-title"></div>
        <div class="skeleton yt-skeleton-text"></div>
        <div class="skeleton yt-skeleton-actions"></div>
      </div>
    </div>
  `).join("");
}

/* --------------------------------------------------------------------------
   2. CARD TEMPLATES WITH STRUCTURED MODAL TRIGGERS
   -------------------------------------------------------------------------- */

function createSocialCard(platform, url, title, subtitle) {
  if (!url || url.trim() === "") return "";
  return `
    <a href="${url}" target="_blank" rel="noopener noreferrer" class="social-card ${platform}">
      <i class="${getPlatformIcon(platform)}"></i>
      <h3>${escapeHTML(title)}</h3>
      <p>${escapeHTML(subtitle)}</p>
    </a>
  `;
}

function createOtherAccountCard(account) {
  if (!account.url || !account.is_active) return "";
  return `
    <div class="account-card">
      <i class="${getPlatformIcon(account.platform)}"></i>
      <div>
        <h3>${escapeHTML(account.account_name)}</h3>
        <p>${escapeHTML(account.description || account.platform || "Account")}</p>
      </div>
      <a href="${account.url}" target="_blank" rel="noopener noreferrer" class="small-btn">
        Open
      </a>
    </div>
  `;
}

function createHomeResourceCard(resource) {
  const descriptionText = resource.description || "";
  const isLongDescription = descriptionText.length > 110;
  
  const currentCategory = String(resource.category || "").trim().toLowerCase();
  const isJob = currentCategory === "job" || currentCategory === "internship";
  const isHackathon = currentCategory === "hackathon";
  const isScholarship = currentCategory === "scholarship";

  let jobBadgesHTML = "";
  if (isJob) {
    const jobType = resource.job_type || "Remote";
    const isActive = resource.is_active !== false;
    jobBadgesHTML = `
      <div class="meta-row">
        <span class="badge-pill primary-pill"><i class="fa-solid fa-briefcase"></i> ${escapeHTML(jobType)}</span>
        <span class="status-indicator"><span class="status-dot ${isActive ? 'active' : 'inactive'}"></span> ${isActive ? 'Active' : 'Expired'}</span>
      </div>
    `;
  }

  let hackathonBadgesHTML = "";
  if (isHackathon) {
    const mode = resource.job_type || "Online";
    const isActive = resource.is_active !== false;
    hackathonBadgesHTML = `
      <div class="meta-row">
        <span class="badge-pill purple-pill"><i class="fa-solid fa-laptop-code"></i> ${escapeHTML(mode)}</span>
        <span class="status-indicator"><span class="status-dot ${isActive ? 'active' : 'inactive'}"></span> ${isActive ? 'Active' : 'Closed'}</span>
      </div>
    `;
  }

  let scholarshipBadgesHTML = "";
  if (isScholarship) {
    scholarshipBadgesHTML = `
      <div class="meta-row">
        <span class="badge-pill gold-pill"><i class="fa-solid fa-award"></i> Verified Scholarship</span>
      </div>
    `;
  }

  let orgBadgeHTML = "";
  if (resource.org_type && resource.org_type !== "none") {
    const isGov = resource.org_type === "government";
    orgBadgeHTML = `
      <span class="badge-pill ${isGov ? 'govt-pill' : 'private-pill'}">
        <i class="${isGov ? 'fa-solid fa-building-shield' : 'fa-solid fa-building'}"></i> ${isGov ? 'Govt' : 'Private'}
      </span>
    `;
  }

  const deepShareLink = `${window.location.origin}/resources.html?search=${encodeURIComponent(resource.title)}`;
  const resourceJSON = encodeURIComponent(JSON.stringify(resource));

  return `
    <div class="resource-card" data-resource="${resourceJSON}">
      <div class="tag-row">
        <span class="badge-pill neutral-pill">${escapeHTML(resource.category || "Resource")}</span>
        ${orgBadgeHTML}
      </div>
      
      <h3 class="card-title">${escapeHTML(resource.title)}</h3>

      ${jobBadgesHTML}
      ${hackathonBadgesHTML}
      ${scholarshipBadgesHTML}

      <div class="resource-description-clamp">
        ${escapeHTML(descriptionText)}
      </div>

      ${isLongDescription ? `<button type="button" class="read-more-btn modal-trigger">Read More</button>` : ""}

      <div class="card-footer-meta">
        <small><i class="fa-regular fa-calendar"></i> ${escapeHTML(resource.upload_date || "")}</small>
        <small><i class="fa-regular fa-eye"></i> ${formatViews(resource.views)} views</small>
      </div>

      <div class="card-actions">
        <button type="button" class="unlock-btn open-resource-btn" data-link="${resource.link}">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Resource
        </button>
        <button type="button" class="share-btn" data-link="${deepShareLink}" title="Share Opportunity">
          <i class="fa-solid fa-share-nodes"></i>
        </button>
      </div>
    </div>
  `;
}

// Upgraded Horizontal Card Template for Home
function createHomeVideoCard(video) {
  const thumbnail = getYouTubeThumbnail(video.youtube_link);
  const descriptionText = video.description || "";
  const isLongDescription = descriptionText.length > 110;

  let orgBadgeHTML = "";
  if (video.org_type && video.org_type !== "none") {
    const isGov = video.org_type === "government";
    orgBadgeHTML = `
      <span class="badge-pill ${isGov ? 'govt-pill' : 'private-pill'}">
        <i class="${isGov ? 'fa-solid fa-building-shield' : 'fa-solid fa-building'}"></i> ${isGov ? 'Govt' : 'Private'}
      </span>
    `;
  }

  const deepShareLink = `${window.location.origin}/videos.html?search=${encodeURIComponent(video.title)}`;
  const videoJSON = encodeURIComponent(JSON.stringify(video));

  return `
    <div class="youtube-video-card" data-video="${videoJSON}">
      <div class="youtube-thumb-wrapper">
        <img src="${thumbnail}" alt="${escapeHTML(video.title)}" class="youtube-card-thumbnail" loading="lazy">
        <div class="thumb-play-overlay"><i class="fa-solid fa-play"></i></div>
      </div>
      
      <div class="youtube-content-wrapper">
        <div class="tag-row">
          <span class="badge-pill neutral-pill"><i class="fa-solid fa-video"></i> ${escapeHTML(video.category || "Video")}</span>
          ${orgBadgeHTML}
        </div>

        <h3 class="video-card-title">${escapeHTML(video.title)}</h3>

        <div class="resource-description-clamp">
          ${escapeHTML(descriptionText)}
        </div>

        ${isLongDescription ? `<button type="button" class="read-more-btn modal-video-trigger">Read More</button>` : ""}
        
        <div class="card-footer-meta">
          <small><i class="fa-regular fa-calendar"></i> ${escapeHTML(video.upload_date || "")}</small>
          <small><i class="fa-regular fa-eye"></i> ${formatViews(video.views)} views</small>
        </div>

        <div class="card-actions yt-actions">
          <a href="${video.youtube_link}" target="_blank" rel="noopener noreferrer" class="small-btn watch-btn">
            <i class="fa-brands fa-youtube"></i> Watch
          </a>
          ${video.resource_link ? `
            <button type="button" class="unlock-btn open-resource-btn" data-link="${video.resource_link}">
              Resource
            </button>
          ` : ""}
          <button type="button" class="share-btn" data-link="${deepShareLink}" title="Share Video">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   3. MODAL LOGIC
   -------------------------------------------------------------------------- */

function openDetailsModal(item, type = "resource") {
  if (!descModalOverlay) return;

  const isGov = item.org_type === "government";
  const orgBadge = (item.org_type && item.org_type !== "none")
    ? `<span class="badge-pill ${isGov ? 'govt-pill' : 'private-pill'}">${isGov ? 'Govt' : 'Private'}</span>`
    : "";

  modalBadgeRow.innerHTML = `
    <span class="badge-pill neutral-pill">${escapeHTML(item.category || type)}</span>
    ${orgBadge}
  `;

  modalTitle.textContent = item.title || "Untitled";

  modalMetaInfo.innerHTML = `
    <span><i class="fa-regular fa-calendar"></i> Uploaded: ${escapeHTML(item.upload_date || "Recent")}</span>
    <span><i class="fa-regular fa-eye"></i> ${formatViews(item.views)} views</span>
  `;

  modalDescriptionContent.innerHTML = formatStructuredText(item.description);

  if (type === "resource") {
    modalActionRow.innerHTML = `
      <button type="button" class="unlock-btn full-btn" data-link="${item.link}">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> Open Resource Link
      </button>
    `;
  } else {
    modalActionRow.innerHTML = `
      <a href="${item.youtube_link}" target="_blank" rel="noopener noreferrer" class="btn primary-btn full-btn">
        <i class="fa-brands fa-youtube"></i> Watch on YouTube
      </a>
      ${item.resource_link ? `
        <button type="button" class="unlock-btn" data-link="${item.resource_link}">
          <i class="fa-solid fa-file"></i> Attached Material
        </button>
      ` : ""}
    `;
  }

  descModalOverlay.style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeDetailsModal() {
  if (descModalOverlay) {
    descModalOverlay.style.display = "none";
    document.body.style.overflow = "auto";
  }
}

if (descModalClose) {
  descModalClose.addEventListener("click", closeDetailsModal);
}

if (descModalOverlay) {
  descModalOverlay.addEventListener("click", (e) => {
    if (e.target === descModalOverlay) closeDetailsModal();
  });
}

// Global Card Click Event Delegation
document.addEventListener("click", (e) => {
  const resTrigger = e.target.closest(".modal-trigger");
  if (resTrigger) {
    const card = resTrigger.closest(".resource-card");
    if (card && card.dataset.resource) {
      const data = JSON.parse(decodeURIComponent(card.dataset.resource));
      openDetailsModal(data, "resource");
    }
    return;
  }

  const vidTrigger = e.target.closest(".modal-video-trigger");
  if (vidTrigger) {
    const card = vidTrigger.closest(".youtube-video-card") || vidTrigger.closest(".video-card");
    if (card && card.dataset.video) {
      const data = JSON.parse(decodeURIComponent(card.dataset.video));
      openDetailsModal(data, "video");
    }
    return;
  }

  const shareBtn = e.target.closest(".share-btn");
  if (shareBtn) {
    const shareUrl = shareBtn.getAttribute("data-link");
    if (navigator.share) {
      navigator.share({
        title: "Check this out on KavyaHub",
        url: shareUrl
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("Link copied to clipboard!");
      });
    }
  }
});

/* --------------------------------------------------------------------------
   4. DATA FETCH & POPULATION
   -------------------------------------------------------------------------- */

async function loadProfileAndSocials() {
  try {
    const { data, error } = await supabaseClient
      .from("profile")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error || !data) return;

    if (data.name && homeProfileName) {
      homeProfileName.textContent = data.name;
      document.title = `${data.name} | Free Resources & Career Hub`;
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
    }
  } catch (err) {
    console.error("Profile load error:", err);
  }
}

async function loadOtherAccounts() {
  try {
    const { data, error } = await supabaseClient
      .from("other_accounts")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return;

    const accountsHTML = data.map(account => createOtherAccountCard(account)).join("");
    if (accountsHTML.trim() !== "" && otherAccountsContainer && otherAccountsSection) {
      otherAccountsContainer.innerHTML = accountsHTML;
      otherAccountsSection.style.display = "block";
    }
  } catch (err) {
    console.error("Other accounts error:", err);
  }
}

async function loadHomeData() {
  renderResourceSkeletons(trendingResources, 3);
  renderVideoSkeletons(trendingVideos, 2);
  renderResourceSkeletons(homeLatestResources, 3);
  renderVideoSkeletons(homeLatestVideos, 2);

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

    if (trendingResources) {
      const items = trendingResResult.data || [];
      trendingResources.innerHTML = items.length > 0 
        ? items.map(r => createHomeResourceCard(r)).join("")
        : `<div class="empty-state-box"><p>No trending resources yet.</p></div>`;
    }

    if (trendingVideos) {
      const items = trendingVidResult.data || [];
      trendingVideos.innerHTML = items.length > 0
        ? items.map(v => createHomeVideoCard(v)).join("")
        : `<div class="empty-state-box"><p>No trending videos yet.</p></div>`;
    }

    if (homeLatestResources) {
      const items = latestResResult.data || [];
      homeLatestResources.innerHTML = items.length > 0
        ? items.map(r => createHomeResourceCard(r)).join("")
        : `<div class="empty-state-box"><p>No recent resources found.</p></div>`;
    }

    if (homeLatestVideos) {
      const items = latestVidResult.data || [];
      homeLatestVideos.innerHTML = items.length > 0
        ? items.map(v => createHomeVideoCard(v)).join("")
        : `<div class="empty-state-box"><p>No recent videos found.</p></div>`;
    }
  } catch (err) {
    console.error("Home data fetch error:", err);
  }
}

/* --------------------------------------------------------------------------
   5. INITIALIZE
   -------------------------------------------------------------------------- */
loadProfileAndSocials();
loadOtherAccounts();
loadHomeData();