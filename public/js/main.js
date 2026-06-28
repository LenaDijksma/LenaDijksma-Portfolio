// =========================
// AOS
// =========================

AOS.init({
    duration: 900,
    once: true
});

// =========================
// THEME TOGGLE
// =========================

const toggleButton = document.getElementById("theme-toggle");
const body = document.body;

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    body.classList.add("dark");

    if (toggleButton) {
        toggleButton.innerHTML =
            '<i class="ri-sun-line"></i>';
    }
}

if (toggleButton) {

    toggleButton.addEventListener("click", () => {

        body.classList.toggle("dark");

        const isDark =
            body.classList.contains("dark");

        if (isDark) {

            localStorage.setItem("theme", "dark");

            toggleButton.innerHTML =
                '<i class="ri-sun-line"></i>';

        } else {

            localStorage.setItem("theme", "light");

            toggleButton.innerHTML =
                '<i class="ri-moon-line"></i>';
        }
    });
}

// =========================
// TYPING EFFECT
// =========================

const texts = [
    "Building modern frontends.",
    "Developing backend systems.",
    "Creating applications in C#.",
    "Building terminal-based tools and apps.",
    "Designing clean and accessible interfaces.",
    "Focused on minimal and functional design.",
    "Building polished software experiences.",
    "Creating modern full stack projects.",
];

const typedText =
    document.getElementById("typed-text");

const typingTitle =
    document.querySelector(".typing-title");

// ONLY RUN ON PAGES
// THAT HAVE TYPED TEXT

if (typedText && typingTitle) {

    // PRE-MEASURE: render each phrase
    // invisibly, record the tallest height,
    // then lock the container to that value
    // so the page never shifts during typing.

    const measurer = document.createElement("span");

    measurer.style.cssText = `
        position: absolute;
        visibility: hidden;
        pointer-events: none;
        white-space: normal;
        width: ${typingTitle.offsetWidth}px;
        font-size: ${getComputedStyle(typingTitle).fontSize};
        font-family: ${getComputedStyle(typingTitle).fontFamily};
        font-weight: ${getComputedStyle(typingTitle).fontWeight};
        line-height: ${getComputedStyle(typingTitle).lineHeight};
        max-width: 900px;
    `;

    document.body.appendChild(measurer);

    let maxHeight = 0;

    texts.forEach(text => {
        measurer.textContent = text;
        maxHeight = Math.max(maxHeight, measurer.offsetHeight);
    });

    document.body.removeChild(measurer);

    typingTitle.style.height = maxHeight + "px";

    // RE-MEASURE ON RESIZE (viewport changes
    // affect clamp font-size, so heights shift)

    let resizeTimer;

    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const m = document.createElement("span");
            m.style.cssText = `
                position: absolute;
                visibility: hidden;
                pointer-events: none;
                white-space: normal;
                width: ${typingTitle.offsetWidth}px;
                font-size: ${getComputedStyle(typingTitle).fontSize};
                font-family: ${getComputedStyle(typingTitle).fontFamily};
                font-weight: ${getComputedStyle(typingTitle).fontWeight};
                line-height: ${getComputedStyle(typingTitle).lineHeight};
                max-width: 900px;
            `;
            document.body.appendChild(m);
            let h = 0;
            texts.forEach(t => { m.textContent = t; h = Math.max(h, m.offsetHeight); });
            document.body.removeChild(m);
            typingTitle.style.height = h + "px";
        }, 150);
    });

    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeEffect() {

        const currentText =
            texts[textIndex];

        if (isDeleting) {

            typedText.textContent =
                currentText.substring(0, charIndex--);

        } else {

            typedText.textContent =
                currentText.substring(0, charIndex++);
        }

        let speed =
            isDeleting ? 50 : 100;

        if (
            !isDeleting &&
            charIndex === currentText.length + 1
        ) {

            speed = 1400;

            isDeleting = true;
        }

        if (
            isDeleting &&
            charIndex === 0
        ) {

            isDeleting = false;

            textIndex =
                (textIndex + 1) % texts.length;

            speed = 250;
        }

        setTimeout(typeEffect, speed);
    }

    typeEffect();
}

// =========================
// NAVBAR SCROLL EFFECT
// =========================

const header =
    document.querySelector(".header");

function updateNavbar() {

    if (!header) return;

    if (window.scrollY > 20) {

        header.classList.add("scrolled");

    } else {

        header.classList.remove("scrolled");
    }
}

window.addEventListener(
    "scroll",
    updateNavbar
);

updateNavbar();

// =========================
// PROJECTS FROM JSON
// =========================

const publicProjectsGrid =
    document.getElementById(
        "public-projects"
    );

const privateProjectsGrid =
    document.getElementById(
        "private-projects"
    );

function createProjectCard(project, index) {

    const techTags = project.tech
        ? project.tech.map(t => `<span class="tech-tag">${t}</span>`).join("")
        : "";

    const linkLabel = project.type === "website" ? "View Website"
    : project.type === "program" ? "View Program"
    : "View Project Page";

    return `
        <div
            class="project-card"
            data-aos="fade-up"
            data-aos-delay="${index * 100}"
        >
            <div class="project-top">
                <span class="project-tag" style="color: ${project.color}">
                    ${project.title}
                </span>
                <i class="ri-arrow-right-up-line" style="color: ${project.color}"></i>
            </div>

            <h3>${project.name}</h3>
            <p>${project.desc}</p>
            <img src="${project.img}" class="cover-img">

            <div class="card-divider"></div>

            ${techTags ? `<div class="tech-tags">${techTags}</div>` : ""}

            <a href="${project.link}" ${project.public ? 'target="_blank"' : ""} rel="noopener noreferrer">
                ${linkLabel}<i class="ri-arrow-right-up-line" style="margin-left: 5px"></i>
            </a>
        </div>
    `;
}

// LOAD PROJECTS

fetch("/data/projects.json")

    .then(response => response.json())

    .then(projects => {

        // =========================
        // PUBLIC PROJECTS
        // =========================

        if (publicProjectsGrid) {

            const publicProjects =
                projects.filter(
                    project => project.public
                );

            publicProjects.forEach(
                (project, index) => {

                    publicProjectsGrid.innerHTML +=
                        createProjectCard(
                            project,
                            index
                        );
                }
            );
        }

        // =========================
        // PRIVATE PROJECTS
        // =========================

        if (privateProjectsGrid) {

            const privateProjects =
                projects.filter(
                    project => !project.public
                );

            privateProjects.forEach(
                (project, index) => {

                    privateProjectsGrid.innerHTML +=
                        createProjectCard(
                            project,
                            index
                        );
                }
            );
        }

        // REFRESH AOS
        AOS.refresh();
    })

    .catch(error => {

        console.error(
            "Failed to load projects:",
            error
        );
    });

// =========================
// CONTACT FORM
// =========================

const contactForm =
    document.getElementById("contact-form");

const formFeedback =
    document.getElementById("form-feedback");

function showFeedback(message, type) {

    if (!formFeedback) return;

    formFeedback.textContent = message;
    formFeedback.className = `form-feedback ${type}`;
    formFeedback.style.display = "block";

    if (type === "success") {
        setTimeout(() => {
            formFeedback.style.display = "none";
        }, 5000);
    }
}

if (contactForm) {

    contactForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            const submitBtn = contactForm.querySelector(".contact-btn");
            submitBtn.disabled = true;
            submitBtn.classList.add("loading");
            submitBtn.innerHTML = `<i class="ri-loader-4-line"></i>`;

            const formData =
                new FormData(contactForm);

            const data = {

                name:
                    formData.get("name"),

                email:
                    formData.get("email"),

                subject:
                    formData.get("subject"),

                message:
                    formData.get("message"),

                company:
                    formData.get("company")
            };

            try {

                const response =
                    await fetch("/send-email", {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(data)
                    });

                const result =
                    await response.json();

                if (result.success) {

                    showFeedback(
                        "Message sent successfully!",
                        "success"
                    );

                    contactForm.reset();

                } else {

                    showFeedback(
                        "Failed to send message. Please try again.",
                        "error"
                    );
                }

            } catch (error) {

                console.error(error);

                showFeedback(
                    "Something went wrong. Please try again later.",
                    "error"
                );
            } finally {

                submitBtn.disabled = false;
                submitBtn.classList.remove("loading");
                submitBtn.innerHTML = "Send Message";
            }

        }
    );
}

// =========================
// FOOTER
// =========================

document.getElementById("year").textContent = new Date().getFullYear();