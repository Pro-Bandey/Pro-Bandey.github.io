document.addEventListener("DOMContentLoaded", () => {
    const docContainer = document.getElementById("markdown-content");
    if (docContainer) {
        loadDocumentation();
        highlightActiveSidebarLink();
    }
});

function highlightActiveSidebarLink() {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 'overview';
    const links = document.querySelectorAll('.sidebar nav a');

    links.forEach(link => {
        if (link.getAttribute('href') === `?page=${page}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

async function loadDocumentation() {
    const docContainer = document.getElementById("markdown-content");
    const docTitle = document.getElementById("doc-title");

    const urlParams = new URLSearchParams(window.location.search);
    let page = urlParams.get('page') || 'overview';

    let filePath = `/docs/${page}.md`;
    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error("Document not found");

        let markdownText = await response.text();

        let title = "Documentation";
        const frontmatterRegex = /^\s*---\r?\n([\s\S]*?)\r?\n---/;
        const match = markdownText.match(frontmatterRegex);

        if (match) {
            const frontmatter = match[1];
            const titleMatch = frontmatter.match(/title:\s*([^\r\n]+)/i);
            if (titleMatch) {
                title = titleMatch[1].trim();
            }
            markdownText = markdownText.replace(frontmatterRegex, '').trim();
        }
        document.title = `${title} - Shield Authenticator`;
        if (docTitle) docTitle.textContent = title;
        const alertRegex = /\{%\s*include\s*warning\.html\s*class="([^"]+)"\s*message="([^"]+)"\s*%\}/g;
        markdownText = markdownText.replace(alertRegex, (match, className, message) => {
            return `<div class="alert ${className}">${message}</div>`;
        });
        markdownText = markdownText.replace(/\{:\s*\.table[^}]*\}/g, '');
        if (typeof marked !== 'undefined') {
            docContainer.innerHTML = marked.parse(markdownText);
        } else {
            docContainer.innerHTML = "<p>Error: marked.js library not loaded.</p>";
        }

    } catch (error) {
        if (docTitle) docTitle.textContent = "Doc Not Found"; docTitle.style.textAlign = "center";
        docContainer.innerHTML = `
            <div class="alert danger">
                <h4>404</h4>
                <p style="text-align: center;">Couldn't load the documentation at "${page}". It may have been moved or renamed.</p>
                <a href="./" style="color: inherit;margin-top: 10px;display: inline-block;text-align: center;">Return to Overview</a>
            </div>`;
    }
}