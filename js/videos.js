/* =====================================
   VIDEO DATA
   (Later Supabase se load hoga)
===================================== */

let videos = [

  {
    id: 1,
    title: "Google Cybersecurity Certificate",
    description: "Free Google cybersecurity certificate for beginners.",
    category: "certificate",
    youtubeLink: "https://youtube.com/",
    resourceLink: "https://example.com",
    thumbnail: "assets/thumbnails/cybersecurity.jpg",
    uploadDate: "2026-06-05",
    featured: true
  },

  {
    id: 2,
    title: "IBM Data Analytics Course",
    description: "Free data analytics course and certificate.",
    category: "course",
    youtubeLink: "https://youtube.com/",
    resourceLink: "https://example.com",
    thumbnail: "assets/thumbnails/data-analytics.jpg",
    uploadDate: "2026-06-04",
    featured: false
  },

  {
    id: 3,
    title: "AI Tools Every Student Should Know",
    description: "Useful AI tools for students and creators.",
    category: "ai",
    youtubeLink: "https://youtube.com/",
    resourceLink: "https://example.com",
    thumbnail: "assets/thumbnails/ai-tools.jpg",
    uploadDate: "2026-06-03",
    featured: false
  },

  {
    id: 4,
    title: "Cloud Engineer Roadmap 2026",
    description: "Step by step roadmap to become cloud engineer.",
    category: "roadmap",
    youtubeLink: "https://youtube.com/",
    resourceLink: "https://example.com",
    thumbnail: "assets/thumbnails/cloud-roadmap.jpg",
    uploadDate: "2026-06-02",
    featured: false
  }

];

/* =====================================
   ELEMENTS
===================================== */

const videosContainer =
  document.getElementById("videosContainer");

const videoSearch =
  document.getElementById("videoSearch");

const videoCount =
  document.getElementById("videoCount");

const videoEmptyState =
  document.getElementById("videoEmptyState");

const filterButtons =
  document.querySelectorAll(".video-filter-btn");

const featuredVideoTitle =
  document.getElementById("featuredVideoTitle");

const featuredVideoDescription =
  document.getElementById("featuredVideoDescription");

const featuredVideoButton =
  document.getElementById("featuredVideoButton");

const featuredVideoResourceButton =
  document.getElementById("featuredVideoResourceButton");

/* =====================================
   CURRENT FILTER
===================================== */

let currentCategory = "all";

/* =====================================
   FEATURED VIDEO
===================================== */

function loadFeaturedVideo() {

  const featuredVideo =
    videos.find(video => video.featured);

  if (!featuredVideo) return;

  featuredVideoTitle.textContent =
    featuredVideo.title;

  featuredVideoDescription.textContent =
    featuredVideo.description;

  featuredVideoButton.dataset.link =
    featuredVideo.youtubeLink;

  featuredVideoResourceButton.dataset.link =
    featuredVideo.resourceLink;

}

loadFeaturedVideo();

/* =====================================
   VIDEO CARD
===================================== */

function createVideoCard(video) {

  return `

    <div class="resource-card">

      <img
        src="${video.thumbnail}"
        alt="${video.title}"
        class="video-thumbnail"
      >

      <span class="tag">
        ${video.category}
      </span>

      <h3>
        ${video.title}
      </h3>

      <p>
        ${video.description}
      </p>

      <small>
        ${video.uploadDate}
      </small>

      <div
        style="
        display:flex;
        gap:10px;
        margin-top:15px;
        flex-wrap:wrap;
        "
      >

        <a
          href="${video.youtubeLink}"
          target="_blank"
          class="small-btn"
        >
          Watch Video
        </a>

        <button
          class="unlock-btn"
          data-link="${video.resourceLink}"
        >
          Open Resource
        </button>

      </div>

    </div>

  `;
}

/* =====================================
   RENDER VIDEOS
===================================== */

function renderVideos(data) {

  videosContainer.innerHTML = "";

  if (data.length === 0) {

    videoEmptyState.style.display =
      "block";

    videoCount.textContent = "0";

    return;
  }

  videoEmptyState.style.display =
    "none";

  data.forEach(video => {

    videosContainer.innerHTML +=
      createVideoCard(video);

  });

  videoCount.textContent =
    data.length;
}

/* =====================================
   FILTER FUNCTION
===================================== */

function applyFilters() {

  const searchTerm =
    videoSearch.value
    .toLowerCase()
    .trim();

  let filteredVideos =
    videos.filter(video => {

      const matchCategory =
        currentCategory === "all"
        ||
        video.category === currentCategory;

      const matchSearch =
        video.title
        .toLowerCase()
        .includes(searchTerm)
        ||
        video.description
        .toLowerCase()
        .includes(searchTerm);

      return (
        matchCategory &&
        matchSearch
      );

    });

  renderVideos(filteredVideos);

}

/* =====================================
   SEARCH
===================================== */

if (videoSearch) {

  videoSearch.addEventListener(
    "input",
    applyFilters
  );

}

/* =====================================
   FILTER BUTTONS
===================================== */

filterButtons.forEach(button => {

  button.addEventListener(
    "click",
    () => {

      filterButtons.forEach(btn =>
        btn.classList.remove("active")
      );

      button.classList.add("active");

      currentCategory =
        button.dataset.category;

      applyFilters();

    }
  );

});

/* =====================================
   FEATURED VIDEO BUTTON
===================================== */

featuredVideoButton?.addEventListener(
  "click",
  () => {

    const link =
      featuredVideoButton.dataset.link;

    if (
      link &&
      link !== "#"
    ) {
      window.open(
        link,
        "_blank"
      );
    }

  }
);

/* =====================================
   INITIAL LOAD
===================================== */

renderVideos(videos);

console.log(
  "Videos Loaded Successfully"
);

/* =====================================
   FUTURE SUPABASE CODE
===================================== */

// async function loadVideos() {
//
// const { data, error } =
// await supabase
// .from("videos")
// .select("*");
//
// videos = data;
//
// renderVideos(videos);
//
// }