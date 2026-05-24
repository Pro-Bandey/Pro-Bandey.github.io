/**
 * Dynamic Repositories Processing & Preview Engine
 */
document.addEventListener("DOMContentLoaded", () => {
    const DATABASE_ENDPOINT = "https://raw.githubusercontent.com/Pro-bandey/Pro-bandey/db/db.json";
    const CACHE_KEY = "workspace_repos_cache";

    const projectsGrid = document.getElementById("projects-grid");
    const langTooltip = document.getElementById("lang-tooltip");
    const tooltipPie = document.getElementById("tooltip-pie");
    const tooltipLegend = document.getElementById("tooltip-legend");

    const languageColorKeys = {
        JavaScript: "#f1e05a",
        HTML: "#e34c26",
        CSS: "#563d7c",
        Python: "#3572a5",
        TypeScript: "#3178c6",
        Shell: "#89e051",
        C: "#555555",
        "C++": "#f34b7d",
        Go: "#00add8",
        Rust: "#dea584",
        Java: "#b07219",
        Yml: "e32626"
    };

    function resolveLanguageColor(lang) {
        return languageColorKeys[lang] || "#8b5cf6";
    }

    function checkNewStatus(dateString) {
        if (!dateString) return false;
        const createdDate = new Date(dateString);
        const daysDifference = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
        return daysDifference <= 6;
    }

    // Performance Caching Layer
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    if (cachedData) {
        try {
            const database = JSON.parse(cachedData);
            renderProjects(database);
            checkUrlParams(database);
        } catch (e) {
            fetchDatabase();
        }
    } else {
        fetchDatabase();
    }

    function fetchDatabase() {
        fetch(DATABASE_ENDPOINT)
            .then(response => {
                if (!response.ok) throw new Error("Fault: database read failure");
                return response.json();
            })
            .then(database => {
                sessionStorage.setItem(CACHE_KEY, JSON.stringify(database));
                renderProjects(database);
                checkUrlParams(database);
            })
            .catch(err => {
                console.error(err);
                if (projectsGrid) {
                    projectsGrid.innerHTML = `
                        <div class="glass-panel text-center pad-4" style="grid-column: 1 / -1; padding: 3rem;">
                            <span class="font-mono text-primary uppercase">Workspace_Read_Fault</span>
                            <p class="text-muted" style="font-size:0.85rem; margin-top:0.5rem;">Could not initialize repositories interface from remote database.</p>
                        </div>
                    `;
                }
            });
    }

    function renderProjects(repos) {
        if (!projectsGrid) return;
        projectsGrid.innerHTML = "";

        const visibleRepos = repos.filter(r => r.Status === "Pub");

        if (visibleRepos.length === 0) {
            projectsGrid.innerHTML = `<p class="text-muted text-center" style="grid-column: 1 / -1;">No active registries deployed.</p>`;
            return;
        }

        visibleRepos.forEach(repo => {
            const isNew = checkNewStatus(repo.Date);
            const card = document.createElement("div");
            card.className = "glass-panel project-card";

            const socialBanner = repo.Banner || `https://socialify.git.ci/Pro-bandey/${repo.Repo}/image?theme=Dark`;

            let trackSegmentHTML = "";
            const sortedLangs = Object.entries(repo.Langs || {}).sort((a, b) => b[1] - a[1]);

            if (sortedLangs.length > 0) {
                sortedLangs.forEach(([lang, percent]) => {
                    const color = resolveLanguageColor(lang);
                    trackSegmentHTML += `<div class="lang-segment" style="width: ${percent}%; background: ${color};" data-lang="${lang}" data-percent="${percent}"></div>`;
                });
            } else {
                trackSegmentHTML = `<div class="lang-segment" style="width: 100%; background: #4b5563;" data-lang="Unknown" data-percent="100"></div>`;
            }

            card.innerHTML = `
                ${isNew ? `<span class="new-badge">NEW</span>` : ""}
                <div class="card-banner-wrapper" onclick="openReadmeDrawer('${repo.Repo}', ${repo.ReadMeIs})">
                    <img class="card-banner-img" src="${socialBanner}" alt="${repo.Repo} Interface Preview" loading="lazy">
                </div>
                <div class="card-main-content">
                    <h3 class="card-repo-title font-mono" onclick="openReadmeDrawer('${repo.Repo}', ${repo.ReadMeIs})">${repo.Repo}</h3>
                    <p class="card-repo-desc text-muted">${repo.Desc}</p>
                    
                    <div class="language-track-bar">
                        ${trackSegmentHTML}
                    </div>

                    <div class="flex gap-2">
                        ${repo.PreviewUrl ? `<button class="btn btn-prim font-mono" onclick="openIframePreview('${repo.Repo}', '${repo.PreviewUrl}')" style="flex-grow:1; padding:0.6rem 1.2rem; font-size:0.75rem;">PREVIEW</button>` : ""}
                        <a href="https://github.com/Pro-bandey/${repo.Repo}" target="_blank" class="btn btn-out btn-source font-mono" style="padding:0.6rem 1.2rem; font-size:0.75rem;">
                            SOURCE
                        </a>
                    </div>
                </div>
            `;

            projectsGrid.appendChild(card);
        });

        bindLanguageHoverEvents();
    }

    // Checks URL parameter ?pro=RepoName on load
    function checkUrlParams(database) {
        const urlParams = new URLSearchParams(window.location.search);
        const repoQuery = urlParams.get("pro");
        
        if (repoQuery) {
            // Find if repo exists in DB to check its ReadMe status
            const targetRepo = database.find(r => r.Repo.toLowerCase() === repoQuery.toLowerCase());
            if (targetRepo) {
                openReadmeDrawer(targetRepo.Repo, targetRepo.ReadMeIs);
            } else {
                openReadmeDrawer(repoQuery, true); // Fallback attempt
            }
        }
    }

    function bindLanguageHoverEvents() {
        const tracks = document.querySelectorAll(".language-track-bar");

        tracks.forEach(track => {
            track.addEventListener("mouseenter", (e) => {
                const segments = Array.from(track.querySelectorAll(".lang-segment"));
                let totalPercentage = 0;
                let conicGradString = "conic-gradient(";
                let legendHTML = "";

                segments.forEach((seg, index) => {
                    const lang = seg.getAttribute("data-lang");
                    const percent = parseFloat(seg.getAttribute("data-percent"));
                    const color = resolveLanguageColor(lang);

                    const startAngle = totalPercentage;
                    totalPercentage += percent;
                    const endAngle = totalPercentage;

                    conicGradString += `${color} ${startAngle}% ${endAngle}%${index < segments.length - 1 ? ", " : ""}`;

                    legendHTML += `
                        <div class="legend-item">
                            <span class="legend-color-dot" style="background:${color};"></span>
                            <span>${lang}: ${percent}%</span>
                        </div>
                    `;
                });

                conicGradString += ")";
                tooltipPie.style.background = conicGradString;
                tooltipLegend.innerHTML = legendHTML;

                langTooltip.classList.add("active");
            });

            track.addEventListener("mousemove", (e) => {
                const xOffset = 20;
                const yOffset = -50;
                langTooltip.style.left = `${e.clientX + xOffset}px`;
                langTooltip.style.top = `${e.clientY + yOffset}px`;
            });

            track.addEventListener("mouseleave", () => {
                langTooltip.classList.remove("active");
            });
        });
    }
});

// 4. README Viewer Engine Modal Controls
function openReadmeDrawer(repoName, hasReadme) {
    const drawer = document.getElementById("readme-drawer");
    const body = document.getElementById("readme-body");
    const title = document.getElementById("readme-title");

    if (!drawer || !body || !title) return;

    // Sync state to URL seamlessly
    const url = new URL(window.location);
    url.searchParams.set("pro", repoName);
    window.history.replaceState({}, "", url);

    title.textContent = `${repoName}_readme_`;
    body.innerHTML = `<p class="font-mono text-muted text-center">Reading workspace configuration files...</p>`;
    drawer.classList.add("active");

    if (!hasReadme) {
        body.innerHTML = `
            <div class="text-center" style="padding: 3rem 0;">
                <h3 class="font-mono uppercase text-primary">No README Available</h3>
                <p class="text-muted" style="font-size:0.85rem; margin-top:0.5rem;">This repository does not contain an active readme profile configuration document.</p>
            </div>
        `;
        return;
    }

    const TARGET_RAW_URL = `https://raw.githubusercontent.com/Pro-bandey/${repoName}/refs/heads/main/README.md`;
    const FALLBACK_RAW_URL = `https://raw.githubusercontent.com/Pro-bandey/${repoName}/refs/heads/master/README.md`;

    fetch(TARGET_RAW_URL)
        .then(res => {
            if (!res.ok) return fetch(FALLBACK_RAW_URL);
            return res;
        })
        .then(res => {
            if (!res.ok) throw new Error();
            return res.text();
        })
        .then(markdown => {
            body.innerHTML = marked.parse(markdown);
        })
        .catch(() => {
            body.innerHTML = `
                <div class="text-center" style="padding: 3rem 0;">
                    <h3 class="font-mono uppercase text-primary">Document Read Fault</h3>
                    <p class="text-muted" style="font-size:0.85rem; margin-top:0.5rem;">Could not resolve remote markdown structural links from main configuration branches.</p>
                </div>
            `;
        });
}

// 5. Dynamic Live Preview Embedded Framework (CLEANED)
function openIframePreview(repoName, targetUrl) {
    const drawer = document.getElementById("preview-drawer");
    const frame = document.getElementById("preview-frame");
    const extLink = document.getElementById("external-preview-link");
    const title = document.getElementById("preview-title");

    if (!drawer || !frame) return;

    title.textContent = `${repoName}_live_render_`;
    extLink.href = targetUrl;

    // Just show iframe without block checks
    frame.classList.remove("hidden");
    frame.src = targetUrl;
    drawer.classList.add("active");
}

// Global Modal Drawer Closing Event Receivers
document.addEventListener("DOMContentLoaded", () => {
    const closeReadme = document.getElementById("close-readme");
    const closePreview = document.getElementById("close-preview");
    const readmeDrawer = document.getElementById("readme-drawer");
    const previewDrawer = document.getElementById("preview-drawer");
    const previewFrame = document.getElementById("preview-frame");

    function deactivateDrawers() {
        if (readmeDrawer) readmeDrawer.classList.remove("active");
        if (previewDrawer) {
            previewDrawer.classList.remove("active");
            if (previewFrame) previewFrame.src = ""; // Unloads target frames completely
        }
        
        // Remove the ?pro= parameter from URL on close without refreshing the page
        const url = new URL(window.location);
        if (url.searchParams.has("pro")) {
            url.searchParams.delete("pro");
            window.history.replaceState({}, "", url);
        }
    }

    if (closeReadme) closeReadme.addEventListener("click", deactivateDrawers);
    if (closePreview) closePreview.addEventListener("click", deactivateDrawers);

    [readmeDrawer, previewDrawer].forEach(drw => {
        if (drw) {
            drw.addEventListener("click", (e) => {
                if (e.target === drw) deactivateDrawers();
            });
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") deactivateDrawers();
    });
});
