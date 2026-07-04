// admin.js

const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");

const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const loginBtn = document.getElementById("login-btn");

const logoutBtn = document.getElementById("logout-btn");

const projectsList = document.getElementById("projects-list");
const projectCount = document.getElementById("project-count");
const addProjectBtn = document.getElementById("add-project-btn");

const statusBanner = document.getElementById("status-banner");

const editorOverlay = document.getElementById("editor-overlay");
const editorForm = document.getElementById("editor-form");
const editorTitle = document.getElementById("editor-title");
const editorCancel = document.getElementById("editor-cancel");

const confirmOverlay = document.getElementById("confirm-overlay");
const confirmText = document.getElementById("confirm-text");
const confirmCancel = document.getElementById("confirm-cancel");
const confirmDelete = document.getElementById("confirm-delete");

const editorError = document.getElementById("editor-error");

let projects = [];
let editingIndex = null; // null = adding a new project
let pendingDeleteIndex = null;

// =========================
// STATUS BANNER
// =========================

function showStatus(message, type = "success") {
    statusBanner.textContent = message;
    statusBanner.className = `admin-status-banner ${type}`;
    statusBanner.hidden = false;

    if (type === "success") {
        setTimeout(() => {
            statusBanner.hidden = true;
        }, 4000);
    }
}

// =========================
// AUTH
// =========================

async function checkSession() {
    try {
        const res = await fetch("/admin/api/session");
        if (res.ok) {
            showDashboard();
        } else {
            showLogin();
        }
    } catch (error) {
        showLogin();
    }
}

function showLogin() {
    loginView.hidden = false;
    dashboardView.hidden = true;
}

function showDashboard() {
    loginView.hidden = true;
    dashboardView.hidden = false;
    loadProjects();
}

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    loginError.hidden = true;
    loginBtn.disabled = true;

    const password = document.getElementById("password").value;

    try {
        const res = await fetch("/admin/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password })
        });

        const data = await res.json();

        if (res.ok) {
            document.getElementById("password").value = "";
            showDashboard();
        } else {
            loginError.textContent = data.error || "Login failed";
            loginError.hidden = false;
        }
    } catch (error) {
        loginError.textContent = "Could not reach the server";
        loginError.hidden = false;
    } finally {
        loginBtn.disabled = false;
    }
});

logoutBtn.addEventListener("click", async () => {
    await fetch("/admin/api/logout", { method: "POST" });
    showLogin();
});

// =========================
// LOAD + RENDER PROJECTS
// =========================

async function loadProjects() {
    projectsList.innerHTML = "";
    projectCount.textContent = "Loading projects…";

    try {
        const res = await fetch("/admin/api/projects");

        if (res.status === 401) {
            showLogin();
            return;
        }

        projects = await res.json();
        renderProjects();
    } catch (error) {
        showStatus("Failed to load projects from the server.", "error");
    }
}

function renderProjects() {
    projectCount.textContent = `${projects.length} project${projects.length === 1 ? "" : "s"}`;

    if (projects.length === 0) {
        projectsList.innerHTML = `<div class="admin-empty-state">No projects yet. Add your first one.</div>`;
        return;
    }

    projectsList.innerHTML = projects.map((project, index) => `
        <div class="admin-project-row">
            <div class="admin-project-swatch" style="background:${escapeAttr(project.color || "#7f4bfb")}"></div>
            <div class="admin-project-info">
                <h3>
                    ${escapeHtml(project.name || "Untitled")}
                    <span class="admin-visibility-tag ${project.public ? "public" : "private"}">
                        ${project.public ? "Public" : "Private"}
                    </span>
                </h3>
                <p>${escapeHtml(project.title || "")} · ${escapeHtml(project.link || "")}</p>
            </div>
            <div class="admin-project-actions">
                <button type="button" class="admin-secondary-btn" data-edit="${index}" title="Edit">
                    <i class="ri-pencil-line"></i>
                </button>
                <button type="button" class="admin-danger-btn" data-delete="${index}" title="Delete">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        </div>
    `).join("");

    projectsList.querySelectorAll("[data-edit]").forEach(btn => {
        btn.addEventListener("click", () => openEditor(Number(btn.dataset.edit)));
    });

    projectsList.querySelectorAll("[data-delete]").forEach(btn => {
        btn.addEventListener("click", () => openDeleteConfirm(Number(btn.dataset.delete)));
    });
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return String(str).replace(/"/g, "&quot;");
}

// =========================
// EDITOR MODAL (ADD / EDIT)
// =========================

const fTitle = document.getElementById("f-title");
const fName = document.getElementById("f-name");
const fDesc = document.getElementById("f-desc");
const fLink = document.getElementById("f-link");
const fType = document.getElementById("f-type");
const fColor = document.getElementById("f-color");
const fColorPicker = document.getElementById("f-color-picker");
const fImg = document.getElementById("f-img");
const fTech = document.getElementById("f-tech");
const fPublic = document.getElementById("f-public");

const fGeneratePage = document.getElementById("f-generate-page");
const generatePageRow = document.getElementById("f-generate-page-row");
const pageFields = document.getElementById("page-fields");
const fPageTag = document.getElementById("f-page-tag");
const fPageAboutTitle = document.getElementById("f-page-about-title");
const fPageHeroDesc = document.getElementById("f-page-hero-desc");
const fPageAbout = document.getElementById("f-page-about");
const fPageShowcaseImg = document.getElementById("f-page-showcase-img");
const fPageShowcaseCaption = document.getElementById("f-page-showcase-caption");

function syncPageFieldsVisibility() {
    // A generated page only makes sense for private projects
    generatePageRow.style.display = fPublic.checked ? "none" : "flex";
    if (fPublic.checked) fGeneratePage.checked = false;
    pageFields.hidden = !fGeneratePage.checked || fPublic.checked;
}

fPublic.addEventListener("change", syncPageFieldsVisibility);
fGeneratePage.addEventListener("change", syncPageFieldsVisibility);

// =========================
// IMAGE UPLOAD
// =========================

function wireImageUpload(textInputId, fileInputId, buttonId, statusId) {
    const textInput = document.getElementById(textInputId);
    const fileInput = document.getElementById(fileInputId);
    const button = document.getElementById(buttonId);
    const status = document.getElementById(statusId);

    button.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
        const file = fileInput.files[0];
        if (!file) return;

        status.textContent = "Uploading…";
        status.className = "admin-hint";

        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error("Could not read the file"));
                reader.readAsDataURL(file);
            });

            const res = await fetch("/admin/api/upload-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, data: dataUrl })
            });

            if (res.status === 401) {
                showLogin();
                return;
            }

            const data = await res.json();

            if (!res.ok) {
                status.textContent = data.error || "Upload failed";
                status.className = "admin-hint error";
                return;
            }

            textInput.value = data.path;

            if (data.committed) {
                status.textContent = "Uploaded and committed to GitHub.";
                status.className = "admin-hint success";
            } else {
                status.textContent = data.warning || "Uploaded, but the GitHub commit failed.";
                status.className = "admin-hint error";
            }
        } catch (error) {
            status.textContent = "Could not reach the server to upload the image.";
            status.className = "admin-hint error";
        } finally {
            fileInput.value = "";
        }
    });
}

wireImageUpload("f-img", "f-img-file", "f-img-upload-btn", "f-img-status");
wireImageUpload("f-page-showcase-img", "f-page-showcase-img-file", "f-page-showcase-img-upload-btn", "f-page-showcase-img-status");

addProjectBtn.addEventListener("click", () => openEditor(null));

function openEditor(index) {
    editingIndex = index;
    editorError.hidden = true;
    document.getElementById("f-img-status").textContent = "";
    document.getElementById("f-page-showcase-img-status").textContent = "";

    if (index === null) {
        editorTitle.textContent = "Add project";
        editorForm.reset();
        fColor.value = "#7f4bfb";
        fColorPicker.value = "#7f4bfb";
        fGeneratePage.checked = false;
    } else {
        const project = projects[index];
        editorTitle.textContent = "Edit project";

        fTitle.value = project.title || "";
        fName.value = project.name || "";
        fDesc.value = project.desc || "";
        fLink.value = project.link || "";
        fType.value = project.type || "";
        fColor.value = project.color || "#7f4bfb";
        fColorPicker.value = /^#[0-9a-f]{6}$/i.test(project.color) ? project.color : "#7f4bfb";
        fImg.value = project.img || "";
        fTech.value = (project.tech || []).join(", ");
        fPublic.checked = !!project.public;

        const page = project.page || null;
        fGeneratePage.checked = !!page;
        fPageTag.value = page?.tag || "";
        fPageAboutTitle.value = page?.aboutTitle || "";
        fPageHeroDesc.value = page?.heroDesc || "";
        fPageAbout.value = (page?.aboutParagraphs || []).join("\n\n");
        fPageShowcaseImg.value = page?.showcaseImg || "";
        fPageShowcaseCaption.value = page?.showcaseCaption || "";
    }

    syncPageFieldsVisibility();
    editorOverlay.hidden = false;
}

fColorPicker.addEventListener("input", () => {
    fColor.value = fColorPicker.value;
});

editorCancel.addEventListener("click", () => {
    editorOverlay.hidden = true;
});

editorOverlay.addEventListener("click", (e) => {
    if (e.target === editorOverlay) editorOverlay.hidden = true;
});

editorForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    editorError.hidden = true;

    const projectData = {
        title: fTitle.value.trim(),
        name: fName.value.trim(),
        desc: fDesc.value.trim(),
        link: fLink.value.trim(),
        color: fColor.value.trim() || "#7f4bfb",
        public: fPublic.checked,
        tech: fTech.value.split(",").map(t => t.trim()).filter(Boolean),
        type: fType.value.trim(),
        img: fImg.value.trim()
    };

    if (fGeneratePage.checked && !fPublic.checked) {
        if (!/^\/[a-z0-9-]+$/i.test(projectData.link)) {
            editorError.textContent = 'For a generated page, "Link" needs to be a simple path like /netscan (letters, numbers, dashes only).';
            editorError.hidden = false;
            return;
        }

        projectData.page = {
            tag: fPageTag.value.trim(),
            heroDesc: fPageHeroDesc.value.trim(),
            aboutTitle: fPageAboutTitle.value.trim(),
            aboutParagraphs: fPageAbout.value
                .split(/\n\s*\n/)
                .map(p => p.trim())
                .filter(Boolean),
            showcaseImg: fPageShowcaseImg.value.trim(),
            showcaseCaption: fPageShowcaseCaption.value.trim()
        };
    }

    if (editingIndex === null) {
        projects.push(projectData);
    } else {
        projects[editingIndex] = projectData;
    }

    editorOverlay.hidden = true;
    await saveProjects();
});

// =========================
// DELETE CONFIRM
// =========================

function openDeleteConfirm(index) {
    pendingDeleteIndex = index;
    confirmText.textContent = `"${projects[index].name}" will be permanently removed.`;
    confirmOverlay.hidden = false;
}

confirmCancel.addEventListener("click", () => {
    confirmOverlay.hidden = true;
    pendingDeleteIndex = null;
});

confirmOverlay.addEventListener("click", (e) => {
    if (e.target === confirmOverlay) confirmOverlay.hidden = true;
});

confirmDelete.addEventListener("click", async () => {
    if (pendingDeleteIndex === null) return;
    projects.splice(pendingDeleteIndex, 1);
    pendingDeleteIndex = null;
    confirmOverlay.hidden = true;
    await saveProjects();
});

// =========================
// SAVE (PERSIST + COMMIT)
// =========================

async function saveProjects() {
    renderProjects();
    showStatus("Saving…", "warning");

    try {
        const res = await fetch("/admin/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(projects)
        });

        if (res.status === 401) {
            showLogin();
            return;
        }

        const data = await res.json();

        if (!res.ok) {
            showStatus(data.error || "Failed to save changes.", "error");
            return;
        }

        if (data.committed) {
            showStatus("Saved and committed to GitHub. Render will redeploy shortly.", "success");
        } else {
            showStatus(data.warning || "Saved on the server, but the GitHub commit failed.", "warning");
        }
    } catch (error) {
        showStatus("Could not reach the server to save changes.", "error");
    }
}

// =========================
// INIT
// =========================

checkSession();
