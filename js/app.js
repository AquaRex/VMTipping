/* =============================================================================
 *  app.js  —  shared helpers used by all pages.
 * ===========================================================================*/
(function () {
  const App = {};

  /* Load the live config from the DB, falling back to the bundled default. */
  App.loadConfig = async function () {
    let cfg = null, answerKey = {};
    try {
      const res = await DB.getConfig();
      cfg = res.config;
      answerKey = res.answerKey || {};
    } catch (e) {
      console.warn("Kunne ikke hente config fra databasen:", e.message);
    }
    if (!cfg) cfg = JSON.parse(JSON.stringify(window.DEFAULT_CONFIG));
    // backfill fields that may be missing in an older saved config
    if (!cfg.knockoutBracket) cfg.knockoutBracket = JSON.parse(JSON.stringify(window.DEFAULT_CONFIG.knockoutBracket));
    if (!cfg.knockoutRounds) cfg.knockoutRounds = JSON.parse(JSON.stringify(window.DEFAULT_CONFIG.knockoutRounds));
    if (!cfg.players || !cfg.players.length) cfg.players = JSON.parse(JSON.stringify(window.DEFAULT_PLAYERS || []));
    App._config = cfg;
    App._answerKey = answerKey;
    return { config: cfg, answerKey };
  };

  /* Flag image URL for a team name (uses flagcdn — works on every OS, unlike
     flag emoji which don't render on Windows). */
  App.flagUrl = function (teamName, size) {
    const t = (App._config.teams || []).find((x) => x.name === teamName);
    // Prefer the code stored on the team; otherwise look the name up in the
    // master flag map so any (current or future) country still gets a flag.
    let code = (t && t.code) || "";
    if (!code && window.flagCodeForName) code = window.flagCodeForName(teamName);
    if (!code) return "";
    return `https://flagcdn.com/${size || "w40"}/${code}.png`;
  };

  App.flagImg = function (teamName, size) {
    const url = App.flagUrl(teamName, size);
    if (!url) return "";
    return `<img class="flag" src="${url}" alt="" loading="lazy">`;
  };

  App.allTeams = function () {
    return (App._config.teams || []).map((t) => t.name);
  };

  /* Tiny DOM helper */
  App.el = function (tag, attrs, children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.startsWith("on") && typeof attrs[k] === "function")
        e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach((c) => {
      if (c == null) return;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  };

  App.escape = function (s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /* Small toast/notification */
  App.toast = function (msg, kind) {
    let host = document.getElementById("toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "toast-host";
      document.body.appendChild(host);
    }
    const t = document.createElement("div");
    t.className = "toast " + (kind || "");
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3200);
  };

  /* Build the shared header/nav */
  App.renderNav = function (active) {
    const nav = document.getElementById("nav");
    if (!nav) return;
    // player pages: only show "Admin" link (navigation between skjema/bonus is via footer)
    // admin page: show "← Tilbake" link instead
    const isAdmin = active === "admin";
    const rightLink = isAdmin
      ? `<a href="index.html">← Tilbake</a>`
      : `<a href="admin.html">Admin</a>`;
    nav.innerHTML =
      `<a class="brand" href="index.html">⚽ VM-tipping ${App.escape(App._config.season || "")}</a>` +
      `<div class="nav-links">${rightLink}</div>`;
  };

  window.App = App;
})();
