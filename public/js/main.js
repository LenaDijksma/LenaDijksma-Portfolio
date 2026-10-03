// Home page behaviour. Theme, toasts, copy, search, command palette and animations come from ldcss.
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var safeColor = function (c) { return /^#[0-9a-f]{3,8}$/i.test(c || "") ? c : ""; };

  if ($("#year")) $("#year").textContent = new Date().getFullYear();

  // ---- typing line in the hero terminal ----
  var typed = $("#typed");
  if (typed) {
    var lines = ["echo Building modern frontends.", "echo Engineering reliable backends.",
      "echo Crafting applications in C#.", "echo Shipping full-stack projects."];
    if (reduce) { typed.textContent = lines[0]; }
    else {
      var li = 0, ci = 0, del = false;
      (function tick() {
        var t = lines[li];
        typed.textContent = t.slice(0, del ? ci-- : ci++);
        var wait = del ? 35 : 70;
        if (!del && ci > t.length) { del = true; wait = 1500; }
        else if (del && ci < 0) { del = false; ci = 0; li = (li + 1) % lines.length; wait = 300; }
        setTimeout(tick, wait);
      })();
    }
  }

  // ---- projects ----
  function card(p) {
    var c = safeColor(p.color), isPub = p.isPublic === true, label = [p.title, p.type].filter(Boolean).join(" · ");
    var tags = (p.tech || []).map(function (t) { return '<span class="ld-tag">' + esc(t) + "</span>"; }).join("");
    var main = isPub
      ? '<a class="ld-btn" data-ld-variant="primary" data-ld-size="sm" href="' + esc(p.link) + '" target="_blank" rel="noopener noreferrer">Visit site ↗</a>'
      : '<a class="ld-btn" data-ld-size="sm" href="' + esc(p.link) + '">Details →</a>';
    var src = (!isPub && p.srcLink)
      ? '<a class="ld-btn" data-ld-variant="ghost" data-ld-size="sm" href="' + esc(p.srcLink) + '" target="_blank" rel="noopener noreferrer">Source ↗</a>' : "";
    var el = document.createElement("article");
    el.className = "ld-card project";
    el.setAttribute("data-ld-search-item", "");
    el.setAttribute("data-ld-animate", "fade-up");
    el.setAttribute("data-ld-search-text", (isPub ? "client work live " : "personal ") + (p.tech || []).join(" "));
    if (c) el.style.setProperty("--c", c);
    el.innerHTML =
      (p.img ? '<img class="ld-aspect-video ld-object-cover ld-w-full" src="' + esc(p.img) + '" alt="' + esc(p.name) + ' screenshot" loading="lazy">' : "") +
      '<div class="ld-card-eyebrow">' + esc(label) + "</div>" +
      '<h3 class="ld-card-title">' + esc(p.name) + "</h3>" +
      '<p class="ld-card-body">' + esc(p.desc) + "</p>" +
      '<div class="project-tags">' + tags + "</div>" +
      '<div class="ld-card-footer">' + main + src + "</div>";
    return el;
  }

  var grid = $("#project-grid");
  if (grid) fetch("/data/projects.json").then(function (r) { return r.json(); }).then(function (all) {
    var pub = all.filter(function (p) { return p.isPublic === true; });
    all.filter(function (p) { return p.isPublic === true; }).concat(all.filter(function (p) { return p.isPublic !== true; }))
      .forEach(function (p) { grid.appendChild(card(p)); });
    $("#stat-projects").textContent = all.length;
    $("#stat-live").textContent = pub.length;
    if (window.ldcss && ldcss.refresh) ldcss.refresh(grid);
  }).catch(function (e) {
    console.error("Failed to load projects:", e);
    grid.innerHTML = '<p class="ld-text-muted">Projects could not be loaded right now.</p>';
  });

  // ---- GitHub contribution calendar ----
  var git = $("#git");
  if (git) fetch("/api/github/contributions").then(function (r) {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }).then(function (d) {
    var days = d.days.slice().sort(function (a, b) { return new Date(a.date) - new Date(b.date); }).slice(-365);
    var cells = days.map(function (x) {
      return '<i class="l' + x.level + '" title="' + esc(x.date) + ": " + x.count + ' contribution' + (x.count === 1 ? "" : "s") + '"></i>';
    }).join("");
    git.innerHTML = '<p class="ld-mar-b-3"><strong>' + d.totalContributions.toLocaleString() + "</strong> contributions in the last year</p>" +
      '<div class="git-grid">' + cells + "</div>";
    $("#stat-commits").textContent = d.totalContributions.toLocaleString();
  }).catch(function (e) {
    console.error(e);
    git.innerHTML = '<span class="ld-text-muted">Unable to load GitHub contributions.</span>';
    $("#stat-commits").textContent = "–";
  });

  // ---- contact form (reCAPTCHA is loaded lazily, only when the form is near) ----
  var form = $("#contact-form"), rc = null;
  function loadRecaptcha() {
    if (rc) return rc;
    rc = new Promise(function (res) {
      var s = document.createElement("script");
      s.src = "https://www.google.com/recaptcha/api.js"; s.async = true; s.onload = res; s.onerror = res;
      document.head.appendChild(s);
    });
    return rc;
  }
  if (form) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        if (en.some(function (e) { return e.isIntersecting; })) { loadRecaptcha(); io.disconnect(); }
      }, { rootMargin: "600px" });
      io.observe(form);
    } else loadRecaptcha();

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var btn = form.querySelector(".contact-btn"), label = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";
      var done = function () { btn.disabled = false; btn.textContent = label; };
      var toast = function (m, v) { ldcss.toast({ message: m, variant: v, duration: 5000 }); };
      await loadRecaptcha();
      var fd = new FormData(form);
      var data = { name: fd.get("name"), email: fd.get("email"), subject: fd.get("subject"),
        message: fd.get("message"), company: fd.get("company"),
        captcha: window.grecaptcha ? grecaptcha.getResponse() : "" };
      if (!data.captcha) { toast("Please complete the captcha.", "danger"); return done(); }
      try {
        var r = await fetch("/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
        var j = await r.json();
        if (j.success) { toast("Message sent successfully!", "success"); form.reset(); }
        else toast("Failed to send message. Please try again.", "danger");
      } catch (err) {
        console.error(err);
        toast("Something went wrong. Please try again later.", "danger");
      } finally {
        if (window.grecaptcha) grecaptcha.reset();
        done();
      }
    });
  }
})();
