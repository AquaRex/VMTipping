/* =============================================================================
 *  publish.js  —  shared "Publiser" action for the bonus page.
 *  After publishing, the draft is locked — no further edits are possible.
 * ===========================================================================*/
(function () {
  async function doPublish() {
    const name = (Draft.name || "").trim();
    if (!name) {
      App.toast("Skriv inn navnet ditt øverst først.", "error");
      const inp = document.getElementById("player-name");
      if (inp) { inp.focus(); inp.scrollIntoView({ behavior: "smooth", block: "center" }); }
      return;
    }
    const predictions = Draft.data.predictions;
    try {
      let saved;
      if (Draft.data.publishedId) {
        // already published before — just update in place, no dedup needed
        saved = await DB.updateEntry(Draft.data.publishedId, { name, predictions });
      }
      if (!saved) {
        // first publish — check for name collisions and suffix if needed
        const existing = await DB.listEntries();
        const takenNames = new Set(existing.map(e => (e.name || "").toLowerCase()));
        let finalName = name;
        if (takenNames.has(name.toLowerCase())) {
          let n = 2;
          while (takenNames.has((name + " " + n).toLowerCase())) n++;
          finalName = name + " " + n;
        }
        // update the draft name so the locked view shows the actual stored name
        Draft.setName(finalName);
        saved = await DB.createEntry({ name: finalName, predictions });
        Draft.data.publishedId = saved.id;
        Draft.save();
      }
      Draft.lock();
      App.toast("Publisert og låst! Svarene dine er lagret. ✅", "success");
      location.reload();
    } catch (e) {
      console.error(e);
      App.toast("Klarte ikke å publisere: " + e.message, "error");
    }
  }

  /* Count how many knockout matches still lack a picked winner. */
  function bracketStatus() {
    const B = (App._config && App._config.knockoutBracket) || null;
    const winners = (Draft.bracket && Draft.bracket.winners) || {};
    if (!B || !B.rounds) return { total: 0, missing: 0 };
    let total = 0, filled = 0;
    B.rounds.forEach((r) => (r.matchIds || []).forEach((mid) => {
      total++;
      if (winners[mid]) filled++;
    }));
    return { total, missing: total - filled };
  }

  window.publishDraft = function () {
    if (Draft.locked) return;
    const ko = bracketStatus();
    const warnHtml = ko.missing > 0
      ? `<div style="background:rgba(245,197,24,.14);border:1px solid rgba(245,197,24,.4);color:var(--gold);border-radius:9px;padding:.7rem .9rem;margin:0 0 1.2rem;font-size:.9rem;line-height:1.4;text-align:left">
           ⚠ Du har ikke fylt ut hele sluttspillet (${ko.missing} av ${ko.total} kamper mangler vinner).
           Du kan fortsatt publisere, men de uutfylte sluttspillkampene gir 0 poeng.
         </div>`
      : "";
    // Show confirmation modal before locking forever
    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999";
    modal.innerHTML = `
      <div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:2rem;max-width:420px;width:90%;text-align:center">
        <h2 style="margin:0 0 .8rem">Publiser svarene dine?</h2>
        ${warnHtml}
        <p style="color:var(--muted);margin:0 0 1.5rem;line-height:1.5">
          Når du publiserer låses skjemaet for alltid.<br>
          Du kan ikke endre noe etterpå.
        </p>
        <div style="display:flex;gap:.8rem;justify-content:center">
          <button id="pub-cancel" class="btn btn-ghost">Avbryt</button>
          <button id="pub-confirm" class="btn btn-primary">${ko.missing > 0 ? "Publiser likevel" : "Ja, publiser og lås"}</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById("pub-cancel").addEventListener("click", () => modal.remove());
    document.getElementById("pub-confirm").addEventListener("click", () => { modal.remove(); doPublish(); });
  };

  function injectUnlockButton() {
    if (!Draft.locked) return;
    const nav = document.getElementById("nav");
    if (!nav) return;
    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-danger";
    btn.style.cssText = "margin-left:.6rem;align-self:center";
    btn.textContent = "🔓 Lås opp";
    btn.addEventListener("click", () => {
      Draft.unlock();
      location.reload();
    });
    const links = nav.querySelector(".nav-links");
    if (links) links.appendChild(btn);
  }

  // Wire up a "Nullstill" button — disabled when locked.
  // On page load, verify the published entry still exists in the DB.
  // If admin removed it, silently unlock so the user can re-submit.
  window.verifyLock = async function () {
    if (!Draft.locked) return;
    injectUnlockButton();
    const id = Draft.data.publishedId;
    if (!id) { Draft.unlock(); return; }
    try {
      const all = await DB.listEntries();
      const still = all.some(e => e.id === id);
      if (!still) {
        delete Draft.data.publishedId;
        Draft.unlock();
        App.toast("Skjemaet ditt er fjernet av admin — du kan sende inn på nytt.", "info");
        location.reload();
      }
    } catch { /* network error — stay locked to be safe */ }
  };

  window.wireResetButton = function () {
    const btn = document.getElementById("reset-btn");
    if (!btn) return;
    if (Draft.locked) { btn.disabled = true; btn.title = "Låst etter publisering"; return; }
    btn.addEventListener("click", () => {
      if (confirm("Nullstille hele skjemaet ditt (alle resultater, sluttspill og bonussvar)? Dette kan ikke angres.")) {
        Draft.reset();
        location.reload();
      }
    });
  };
})();
