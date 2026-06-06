/* =====================================
   DUMMY RESOURCE DATA
   (Later Supabase se aayega)
===================================== */

let resources = [
  {
    id: 1,
    title: "Google Cybersecurity Foundation",
    description: "Beginner-friendly cybersecurity certificate by Google.",
    category: "certificate",
    date: "2026-06-05",
    link: "https://example.com",
    featured: true
  },

  {
    id: 2,
    title: "IBM Data Analytics",
    description: "Free data analytics learning program.",
    category: "course",
    date: "2026-06-04",
    link: "https://example.com",
    featured: false
  },

  {
    id: 3,
    title: "CSE Notes Collection",
    description: "Programming and semester notes.",
    category: "notes",
    date: "2026-06-03",
    link: "https://example.com",
    featured: false
  },

  {
    id: 4,
    title: "Virtual Internship Program",
    description: "Free internship opportunity for students.",
    category: "internship",
    date: "2026-06-02",
    link: "https://example.com",
    featured: false
  },

  {
    id: 5,
    title: "AI Tools Directory",
    description: "Useful AI tools for students and creators.",
    category: "ai-tool",
    date: "2026-06-01",
    link: "https://example.com",
    featured: false
  }
];

/* =====================================
   ELEMENTS
===================================== */

const resourcesContainer =
  document.getElementById("resourcesContainer");

const searchInput =
  document.getElementById("resourceSearch");

const filterButtons =
  document.querySelectorAll(".filter-btn");

const resourceCount =
  document.getElementById("resourceCount");

const emptyState =
  document.getElementById("emptyState");

const featuredTitle =
  document.getElementById("featuredTitle");

const featuredDescription =
  document.getElementById("featuredDescription");

const featuredButton =
  document.getElementById("featuredButton");

/* =====================================
   CURRENT FILTER
===================================== */

let currentCategory = "all";

/* =====================================
   LOAD FEATURED RESOURCE
===================================== */

function loadFeaturedResource() {

  const featured =
    resources.find(item => item.featured);

  if (!featured) return;

  featuredTitle.textContent =
    featured.title;

  featuredDescription.textContent =
    featured.description;

  featuredButton.dataset.link =
    featured.link;
}

loadFeaturedResource();

/* =====================================
   GENERATE RESOURCE CARD
===================================== */

function createResourceCard(resource) {

  return `
  
    <div class="resource-card"
         data-category="${resource.category}">

        <span class="tag">
          ${resource.category}
        </span>

        <h3>
          ${resource.title}
        </h3>

        <p>
          ${resource.description}
        </p>

        <small>
          ${resource.date}
        </small>

        <button
          class="unlock-btn"
          data-link="${resource.link}">
          
          Unlock Resource

        </button>

    </div>

  `;
}

/* =====================================
   RENDER RESOURCES
===================================== */

function renderResources(data) {

  resourcesContainer.innerHTML = "";

  if (data.length === 0) {

    emptyState.style.display = "block";

    resourceCount.textContent = "0";

    return;
  }

  emptyState.style.display = "none";

  data.forEach(resource => {

    resourcesContainer.innerHTML +=
      createResourceCard(resource);

  });

  resourceCount.textContent =
    data.length;

}

/* =====================================
   FILTER LOGIC
===================================== */

function applyFilters() {

  const searchTerm =
    searchInput.value
    .toLowerCase()
    .trim();

  let filtered = resources.filter(item => {

    const matchCategory =
      currentCategory === "all"
      ||
      item.category === currentCategory;

    const matchSearch =
      item.title
      .toLowerCase()
      .includes(searchTerm)
      ||
      item.description
      .toLowerCase()
      .includes(searchTerm);

    return matchCategory &&
           matchSearch;

  });

  renderResources(filtered);
}

/* =====================================
   SEARCH EVENT
===================================== */

if (searchInput) {

  searchInput.addEventListener(
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
   INITIAL LOAD
===================================== */

renderResources(resources);

/* =====================================
   FUTURE SUPABASE FUNCTION
===================================== */

// async function loadResources() {
//
// const { data, error } =
// await supabase
// .from("resources")
// .select("*");
//
// resources = data;
// renderResources(resources);
//
// }

console.log(
  "Resources Loaded Successfully"
);