// templates.js
// Renders a full HTML page for a private/personal project, using the same
// header/nav/theme-selector/footer markup as the hand-written project pages
// (e.g. autonote.html), with content filled in from projects.json.

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Escapes first (so no raw HTML can ever get through), then converts a small,
// safe set of markdown-style inline formatting into real tags:
//   **bold**      -> <strong>bold</strong>
//   *italic*      -> <em>italic</em>
//   _italic_      -> <em>italic</em>
function formatInline(str) {
    return escapeHtml(str)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?:\*(.+?)\*|_(.+?)_)/g, (match, a, b) => `<em>${a ?? b}</em>`);
}

function paragraphsToHtml(paragraphs) {
    return (paragraphs || [])
        .filter(p => p && p.trim())
        .map(p => `                <p>\n                    ${formatInline(p.trim())}\n                </p>`)
        .join('\n\n');
}

function techTagsToHtml(tech) {
    return (tech || [])
        .filter(Boolean)
        .map(t => `<span class="ld-tag">${escapeHtml(t)}</span>`)
        .join('\n                ');
}

// Shared page shell (head, nav, footer) so project pages, Autonote and the 404 all match the home page.
function renderShell({ title, description, url, body, noindex = true }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} | Lena Dijksma</title>
    <link rel="shortcut icon" href="/images/logo.png" type="image/png">
    <link rel="apple-touch-icon" href="/images/logo.png" sizes="180x180">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#080808">
    ${noindex ? '<meta name="robots" content="noindex, follow">' : ''}
    <link rel="stylesheet" href="/vendor/ldcss/ldcss.min.css">
    <link rel="stylesheet" href="/css/site.css">
    <meta property="og:title" content="Lena Dijksma | ${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="https://lenadijksma.is-a.dev/images/og-preview.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Lena Dijksma | ${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="https://lenadijksma.is-a.dev/images/og-preview.png" />
    <script>
        (function(){var t=null;try{t=localStorage.getItem("ld-theme")}catch(e){}
        if(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)t="dark";
        if(t)document.documentElement.setAttribute("data-ld-theme",t)})();
    </script>
</head>
<body>
    <a class="ld-skip-link" href="#main">Skip to content</a>
    <nav class="ld-nav ld-glass site-nav" aria-label="Main">
        <a href="/" class="ld-nav-brand" data-ld-mark="$">Lena Dijksma</a>
        <div class="ld-row">
            <a href="/#projects" class="ld-btn" data-ld-size="sm" data-ld-variant="ghost">← Portfolio</a>
            <button class="ld-btn" data-ld-size="sm" data-ld-toggle="theme" aria-label="Toggle light/dark theme">theme</button>
        </div>
    </nav>
    <main id="main">
${body}
    </main>
    <footer class="ld-footer"><p class="ld-mar-b-0 ld-text-muted ld-text-sm">© ${new Date().getFullYear()} Lena Dijksma · built with <a href="/ldcss">ldcss</a></p></footer>
    <script src="/vendor/ldcss/ldcss.min.js"></script>
</body>
</html>
`;
}

function renderProjectPage(project, slug) {
    const page = project.page || {};

    const title = escapeHtml(project.name);
    const tag = escapeHtml(page.tag || 'Private / Non-Commercial Project');
    const heroDesc = formatInline(page.heroDesc || project.desc || '');
    const aboutTitle = escapeHtml(page.aboutTitle || project.name);
    const aboutParagraphsHtml = paragraphsToHtml(
        page.aboutParagraphs && page.aboutParagraphs.length
            ? page.aboutParagraphs
            : [project.desc || '']
    );
    const techHtml = techTagsToHtml(project.tech);
    const showcaseImg = page.showcaseImg || project.img || '';
    const showcaseCaption = formatInline(page.showcaseCaption || '');
    const srcBtn = project.srcLink
        ? `<a href="${escapeHtml(project.srcLink)}" class="ld-btn" data-ld-variant="outline" data-ld-size="lg" target="_blank" rel="noopener noreferrer">Source code ↗</a>`
        : '';

    const body = `
        <header class="site-hero">
            <div class="ld-container ld-container-sm" data-ld-animate="fade-up">
                <p class="site-eyebrow">${tag}</p>
                <h1>${title}</h1>
                <p class="site-lead">${heroDesc}</p>
                <div class="ld-row ld-mar-t-5">
                    <a href="/#projects" class="ld-btn" data-ld-variant="primary" data-ld-size="lg">Back to portfolio</a>
                    ${srcBtn}
                </div>
            </div>
        </header>
        <div class="ld-container ld-container-sm">
            ${techHtml ? `<section class="ld-section" aria-label="Technologies">
                <p class="site-eyebrow">Development</p>
                <h2 class="ld-section-title">Technologies</h2>
                <div class="project-tags">${techHtml}</div>
            </section>` : ''}
            <section class="ld-section prose">
                <p class="site-eyebrow">About</p>
                <h2 class="ld-section-title">${aboutTitle}</h2>
${aboutParagraphsHtml}
            </section>
            ${showcaseImg ? `<section class="ld-section" aria-label="Showcase">
                <figure class="ld-mar-a-0">
                    <div class="ld-terminal project-shot">
                        <div class="ld-terminal-bar"><span class="ld-terminal-dot"></span><span class="ld-terminal-dot"></span><span class="ld-terminal-dot"></span><span class="ld-terminal-title">${escapeHtml(slug)}</span></div>
                        <img src="${escapeHtml(showcaseImg)}" alt="${title} showcase" loading="lazy">
                    </div>
                    ${showcaseCaption ? `<figcaption class="ld-text-muted ld-text-sm ld-mar-t-3">${showcaseCaption}</figcaption>` : ''}
                </figure>
            </section>` : ''}
        </div>`;

    return `<!-- ${escapeHtml(slug)}.html - auto-generated by the admin panel, do not hand-edit -->\n` +
        renderShell({
            title: project.name,
            description: project.desc || '',
            url: `https://lenadijksma.is-a.dev/${slug}`,
            body
        });
}

module.exports = { renderProjectPage, renderShell, escapeHtml, formatInline, paragraphsToHtml };
