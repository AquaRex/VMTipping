/* =============================================================================
 *  publish.js  —  shared "Publiser" action for both the schedule and bonus
 *  pages. Sends the whole draft (name + all predictions) to the database.
 * ===========================================================================*/
(function () {
  async function publish() {
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
        saved = await DB.updateEntry(Draft.data.publishedId, { name, predictions });
      }
      if (!saved) {
        saved = await DB.createEntry({ name, predictions });
        Draft.data.publishedId = saved.id;
        Draft.save();
      }
      App.toast("Publisert! Svarene dine er lagret. ✅", "success");
    } catch (e) {
      console.error(e);
      App.toast("Klarte ikke å publisere: " + e.message, "error");
    }
  }

  window.publishDraft = publish;

  // Wire up a "Nullstill" button if present — clears the saved draft.
  window.wireResetButton = function () {
    const btn = document.getElementById("reset-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (confirm("Nullstille hele skjemaet ditt (alle resultater, sluttspill og bonussvar)? Dette kan ikke angres.")) {
        Draft.reset();
        location.reload();
      }
    });
  };
})();
