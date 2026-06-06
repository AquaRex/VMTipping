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

  window.publishDraft = function () {
    if (Draft.locked) return;
    // Show confirmation modal before locking forever
    const modal = document.createElement("div");
    modal.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999";
    modal.innerHTML = `
      <div style="background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:2rem;max-width:420px;width:90%;text-align:center">
        <h2 style="margin:0 0 .8rem">Publiser svarene dine?</h2>
        <p style="color:var(--muted);margin:0 0 1.5rem;line-height:1.5">
          Når du publiserer låses skjemaet for alltid.<br>
          Du kan ikke endre noe etterpå.
        </p>
        <div style="display:flex;gap:.8rem;justify-content:center">
          <button id="pub-cancel" class="btn btn-ghost">Avbryt</button>
          <button id="pub-confirm" class="btn btn-primary">Ja, publiser og lås</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById("pub-cancel").addEventListener("click", () => modal.remove());
    document.getElementById("pub-confirm").addEventListener("click", () => { modal.remove(); doPublish(); });
  };

  // Wire up a "Nullstill" button — disabled when locked.
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
