const homeLatestResources = document.getElementById("homeLatestResources");
const homeLatestVideos = document.getElementById("homeLatestVideos");

const homeProfileImage = document.getElementById("homeProfileImage");
const homeProfileName = document.getElementById("homeProfileName");
const homeProfileBio = document.getElementById("homeProfileBio");

const socialSection = document.getElementById("socialSection");
const socialCardsContainer = document.getElementById("socialCardsContainer");

const otherAccountsSection = document.getElementById("otherAccountsSection");
const otherAccountsContainer = document.getElementById("otherAccountsContainer");

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

function createSocialCard(platform, url, title, subtitle) {
  if (!url || url.trim() === "") return "";

  return `
    <a href="${url}" target="_blank" class="social-card ${platform}">
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

      <a href="${account.url}" target="_blank" class="small-btn">
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

async function loadProfileAndSocials() {
  const { data, error } = await supabaseClient
    .from("profile")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);
    return;
  }

  if (!data) return;

  if (data.name) {
    homeProfileName.textContent = data.name;
    document.title = `${data.name} | Resource Hub`;
  }

  if (data.bio) {
    homeProfileBio.textContent = data.bio;
  }

  if (data.profile_image) {
    homeProfileImage.src = data.profile_image;
  }

  const socialCards = [
    createSocialCard("youtube", data.youtube, "YouTube", "Main Channel"),
    createSocialCard("instagram", data.instagram, "Instagram", "Daily Updates"),
    createSocialCard("telegram", data.telegram, "Telegram", "Free Resources"),
    createSocialCard("linkedin", data.linkedin, "LinkedIn", "Professional Updates"),
    createSocialCard("whatsapp", data.whatsapp, "WhatsApp", "Direct Updates")
  ].join("");

  if (socialCards.trim() !== "") {
    socialCardsContainer.innerHTML = socialCards;
    socialSection.style.display = "block";
  } else {
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
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    otherAccountsSection.style.display = "none";
    return;
  }

  const accountsHTML = data
    .map(account => createOtherAccountCard(account))
    .join("");

  if (accountsHTML.trim() === "") {
    otherAccountsSection.style.display = "none";
    return;
  }

  otherAccountsContainer.innerHTML = accountsHTML;
  otherAccountsSection.style.display = "block";
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

loadProfileAndSocials();
loadOtherAccounts();
loadHomeData();