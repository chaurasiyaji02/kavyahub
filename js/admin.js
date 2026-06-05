/* =========================
   SIDEBAR NAVIGATION
========================= */

const menuItems =
document.querySelectorAll(".menu-item");

const sections =
document.querySelectorAll(".admin-section");

menuItems.forEach(item => {

    item.addEventListener("click", () => {

        menuItems.forEach(menu =>
            menu.classList.remove("active")
        );

        item.classList.add("active");

        const target =
        item.dataset.section;

        sections.forEach(section => {

            section.classList.remove(
                "active-section"
            );

        });

        document
        .getElementById(target)
        .classList.add(
            "active-section"
        );

    });

});

/* =========================
   RESOURCE FORM
========================= */

const resourceForm =
document.getElementById(
    "resourceForm"
);

resourceForm?.addEventListener(
"submit",
(e) => {

    e.preventDefault();

    const resource = {

        title:
        document.getElementById(
        "resourceTitle"
        ).value,

        description:
        document.getElementById(
        "resourceDescription"
        ).value,

        category:
        document.getElementById(
        "resourceCategory"
        ).value,

        link:
        document.getElementById(
        "resourceLink"
        ).value,

        date:
        document.getElementById(
        "resourceDate"
        ).value,

        featured:
        document.getElementById(
        "resourceFeatured"
        ).checked

    };

    console.log(
        "Resource Saved:",
        resource
    );

    alert(
        "Resource Saved Successfully"
    );

    resourceForm.reset();

});

/* =========================
   VIDEO FORM
========================= */

const videoForm =
document.getElementById(
    "videoForm"
);

videoForm?.addEventListener(
"submit",
(e)=>{

    e.preventDefault();

    const video = {

        title:
        document.getElementById(
        "videoTitle"
        ).value,

        description:
        document.getElementById(
        "videoDescription"
        ).value,

        category:
        document.getElementById(
        "videoCategory"
        ).value,

        youtube:
        document.getElementById(
        "youtubeLink"
        ).value,

        resource:
        document.getElementById(
        "videoResourceLink"
        ).value,

        featured:
        document.getElementById(
        "videoFeatured"
        ).checked

    };

    console.log(
        "Video Saved:",
        video
    );

    alert(
        "Video Saved Successfully"
    );

    videoForm.reset();

});

/* =========================
   PROFILE FORM
========================= */

const profileForm =
document.getElementById(
"profileForm"
);

profileForm?.addEventListener(
"submit",
(e)=>{

    e.preventDefault();

    alert(
    "Profile Saved Successfully"
    );

});

/* =========================
   SETTINGS FORM
========================= */

const settingsForm =
document.getElementById(
"settingsForm"
);

settingsForm?.addEventListener(
"submit",
(e)=>{

    e.preventDefault();

    alert(
    "Settings Saved Successfully"
    );

});

/* =========================
   FUTURE SUPABASE
========================= */

// saveResource()
// saveVideo()
// updateProfile()
// updateSettings()
// loadDashboardData()

console.log(
"Admin Dashboard Loaded"
);