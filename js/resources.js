let resources = [];

const resourcesContainer =
document.getElementById(
"resourcesContainer"
);

const searchInput =
document.getElementById(
"resourceSearch"
);

const resourceCount =
document.getElementById(
"resourceCount"
);

const emptyState =
document.getElementById(
"emptyState"
);

const featuredTitle =
document.getElementById(
"featuredTitle"
);

const featuredDescription =
document.getElementById(
"featuredDescription"
);

const featuredButton =
document.getElementById(
"featuredButton"
);

const filterButtons =
document.querySelectorAll(
".filter-btn"
);

let currentCategory = "all";

/* =======================
   CARD TEMPLATE
======================= */

function createCard(resource){

return `

<div class="resource-card">

    <span class="tag">
        ${resource.category || "Resource"}
    </span>

    <h3>
        ${resource.title}
    </h3>

    <p>
        ${resource.description || ""}
    </p>

    <small>
        ${resource.upload_date || ""}
    </small>

    <button
    class="unlock-btn"
    data-link="${resource.link}">
    
    Open Resource

    </button>

</div>

`;

}

/* =======================
   RENDER
======================= */

function renderResources(data){

resourcesContainer.innerHTML = "";

if(data.length === 0){

emptyState.style.display =
"block";

resourceCount.textContent = 0;

return;

}

emptyState.style.display =
"none";

data.forEach(resource=>{

resourcesContainer.innerHTML +=
createCard(resource);

});

resourceCount.textContent =
data.length;

}

/* =======================
   FEATURED
======================= */

function loadFeatured(){

const featured =
resources.find(
item => item.featured
);

if(!featured) return;

featuredTitle.textContent =
featured.title;

featuredDescription.textContent =
featured.description;

featuredButton.dataset.link =
featured.link;

}

/* =======================
   SEARCH + FILTER
======================= */

function applyFilters(){

const term =
searchInput.value
.toLowerCase()
.trim();

const filtered =
resources.filter(resource=>{

const matchCategory =
currentCategory === "all"
||
resource.category ===
currentCategory;

const matchSearch =

(resource.title || "")
.toLowerCase()
.includes(term)

||

(resource.description || "")
.toLowerCase()
.includes(term);

return (
matchCategory &&
matchSearch
);

});

renderResources(filtered);

}

/* =======================
   FILTER BUTTONS
======================= */

filterButtons.forEach(button=>{

button.addEventListener(
"click",
()=>{

filterButtons.forEach(btn=>
btn.classList.remove(
"active"
)
);

button.classList.add(
"active"
);

currentCategory =
button.dataset.category;

applyFilters();

});

});

searchInput?.addEventListener(
"input",
applyFilters
);

/* =======================
   LOAD SUPABASE
======================= */

async function loadResources(){

const { data, error } =
await supabaseClient
.from("resources")
.select("*")
.order(
"created_at",
{ ascending:false }
);

if(error){

console.error(error);

return;

}

resources = data;

renderResources(resources);

loadFeatured();

}

loadResources();