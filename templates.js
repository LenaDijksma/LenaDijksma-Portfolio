// templates.js
// Renders a full HTML page for a private/personal project, using the same
// header/nav/theme-toggle/footer markup as the home page, with content filled
// in from projects.json.

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

// A paragraph with line breaks in it is a list: one item per line.
function paragraphsToHtml(paragraphs) {
    return (paragraphs || [])
        .filter(p => p && p.trim())
        .map(p => {
            const lines = p.trim().split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length > 1) {
                return `<ul>\n${lines.map(l => `<li>${formatInline(l)}</li>`).join('\n')}\n</ul>`;
            }
            return `<p>${formatInline(lines[0])}</p>`;
        })
        .join('\n');
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
    <meta name="theme-color" content="#f6f6f3" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#161719" media="(prefers-color-scheme: dark)">
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
    <nav class="site-nav" aria-label="Main">
        <a class="site-brand" href="/">Lena Dijksma</a>
        <ul>
            <li><a href="/#work">Work</a></li>
            <li><a href="/#projects">Projects</a></li>
            <li><a href="/#about">About</a></li>
            <li><a href="/#contact">Contact</a></li>
        </ul>
        <button type="button" class="site-theme" data-ld-toggle="theme" aria-label="Toggle light/dark theme">Theme</button>
    </nav>
    <main id="main">
${body}
    </main>
    <footer class="site-footer">
        <p>&copy; ${new Date().getFullYear()} Lena Dijksma. Built with <a href="/ldcss">ldcss</a>.</p>
        <p><a href="https://github.com/LenaDijksma">GitHub</a></p>
    </footer>
    <script src="/vendor/ldcss/ldcss.min.js"></script>
</body>
</html>
`;
}

function renderProjectPage(project, slug, { noindex = true } = {}) {
    const page = project.page || {};

    const title = escapeHtml(project.name);
    const tag = escapeHtml(page.tag || 'Private / Non-Commercial Project');
    const heroDesc = formatInline(page.heroDesc || project.desc || '');
    const aboutTitle = escapeHtml(page.aboutTitle || project.name);
    const aboutHtml = paragraphsToHtml(
        page.aboutParagraphs && page.aboutParagraphs.length
            ? page.aboutParagraphs
            : [project.desc || '']
    );
    const techText = (project.tech || []).filter(Boolean).map(escapeHtml).join(', ');
    const showcaseImg = page.showcaseImg || project.img || '';
    const showcaseCaption = formatInline(page.showcaseCaption || '');
    const srcLink = project.srcLink
        ? `<a href="${escapeHtml(project.srcLink)}" target="_blank" rel="noopener noreferrer">Source code on GitHub</a>`
        : '';

    const body = `
        <div class="wrap">
            <header class="page-head">
                <p class="meta">${tag}</p>
                <h1>${title}</h1>
                <p class="lede">${heroDesc}</p>
                ${srcLink ? `<p class="links">${srcLink}</p>` : ''}
            </header>
            <section class="section" aria-labelledby="about-title">
                <h2 id="about-title">About</h2>
                <div class="prose" aria-label="${aboutTitle}">
${aboutHtml}
                </div>
            </section>
            ${techText ? `<section class="section" aria-labelledby="tech-title">
                <h2 id="tech-title">Built with</h2>
                <p>${techText}</p>
            </section>` : ''}
            ${showcaseImg ? `<figure class="shot">
                <img src="${escapeHtml(showcaseImg)}" alt="${title} screenshot" loading="lazy">
                ${showcaseCaption ? `<figcaption>${showcaseCaption}</figcaption>` : ''}
            </figure>` : ''}
        </div>`;

    return `<!-- ${escapeHtml(slug)}.html - auto-generated by the admin panel, do not hand-edit -->\n` +
        renderShell({
            title: project.name,
            description: project.desc || '',
            url: `https://lenadijksma.is-a.dev/${slug}`,
            body,
            noindex
        });
}

module.exports = { renderProjectPage, renderShell, escapeHtml, formatInline, paragraphsToHtml };
