// Home page behaviour. Theme toggle comes from ldcss; everything else is here.
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var ucfirst = function (s) {
    s = String(s || "");
    return (s.charAt(0).toUpperCase() + s.slice(1)).replace(/^Css\b/, "CSS");
  };
  var host = function (url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url; }
  };

  if ($("#year")) $("#year").textContent = new Date().getFullYear();

  // Client work: a large screenshot with the story beside it.
  function feature(p) {
    var el = document.createElement("article");
    el.className = "feature";
    el.innerHTML =
      '<a class="feature-img" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true">' +
        (p.img ? '<img src="' + esc(p.img) + '" alt="" loading="lazy">' : "") + "</a>" +
      "<div>" +
        '<p class="meta">' + esc(ucfirst(p.title)) + "</p>" +
        "<h3>" + esc(p.name) + "</h3>" +
        '<p class="desc">' + esc(p.desc) + "</p>" +
        '<p class="meta tech">' + esc((p.tech || []).join(", ")) + "</p>" +
        '<a class="visit" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer">Visit ' + esc(host(p.link)) + "</a>" +
      "</div>";
    return el;
  }

  // Personal projects: one quiet row each, opening a details page.
  function row(p) {
    var el = document.createElement("li");
    el.innerHTML =
      "<div>" +
        '<h3><a href="' + esc(p.link) + '">' + esc(p.name) + "</a></h3>" +
        '<p class="meta">' + esc(ucfirst(p.type)) + "</p>" +
      "</div>" +
      '<p class="desc">' + esc(ucfirst(p.desc)) + "</p>" +
      '<div class="side"><p>' + esc((p.tech || []).join(", ")) + "</p>" +
        (p.srcLink ? '<a href="' + esc(p.srcLink) + '" target="_blank" rel="noopener noreferrer">Source on GitHub</a>' : "") +
      "</div>";
    return el;
  }

  var work = $("#client-work"), index = $("#project-index");
  fetch("/data/projects.json").then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }).then(function (all) {
    all.filter(function (p) { return p.isPublic === true; })
      .forEach(function (p) { work.appendChild(feature(p)); });
    all.filter(function (p) { return p.isPublic !== true; })
      .forEach(function (p) { index.appendChild(row(p)); });
  }).catch(function (e) {
    console.error("Failed to load projects:", e);
    work.innerHTML = "<p>Projects could not be loaded right now.</p>";
  });

  // One quiet line in the footer instead of the full contribution calendar.
  fetch("/api/github/contributions").then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }).then(function (d) {
    if (d && typeof d.totalContributions === "number") {
      $("#git-count").textContent = ": " + d.totalContributions.toLocaleString() + " contributions in the last year";
    }
  }).catch(function (e) { console.error(e); });
})();
