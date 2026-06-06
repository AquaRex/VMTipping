/* =============================================================================
 *  tippeskjema.js  —  the player's schedule page. Thin wrapper that mounts the
 *  shared SchemaForm (group scores + standings + bracket) backed by the saved
 *  Draft, and wires the name field, progress, publish and reset.
 * ===========================================================================*/
(async function () {
  const cfg = (await App.loadConfig()).config;
  App.renderNav("skjema");
  document.getElementById("page-title").textContent = cfg.title || "Tippeskjema";

  const content = document.getElementById("content");
  const nameInput = document.getElementById("player-name");
  nameInput.value = Draft.name;
  nameInput.addEventListener("input", () => Draft.setName(nameInput.value));

  content.innerHTML = "";
  const layout = App.el("div", { class: "layout" }, []);
  const colLeft = App.el("div", { class: "col-left" }, []);
  const colMid = App.el("div", { class: "col-mid" }, []);
  const colRight = App.el("div", { class: "col-right" }, []);
  layout.appendChild(colLeft); layout.appendChild(colMid); layout.appendChild(colRight);
  content.appendChild(layout);

  const store = {
    getMatch: (id) => Draft.matches[id],
    setMatch: (id, h, a) => Draft.setMatch(id, h, a),
    getWinner: (mid) => Draft.bracket.winners[mid] || "",
    setWinner: (mid, team) => Draft.setWinner(mid, team),
    setRounds: (map) => Object.keys(map).forEach((k) => Draft.setKnockout(k, map[k]))
  };

  const form = SchemaForm.mount({ cfg, store, left: colLeft, mid: colMid, right: colRight, onChange: updateProgress });

  CsvImport.buildDropZone(
    document.getElementById("csv-import-zone"),
    cfg,
    (matchScores, bracketWinners) => {
      Object.entries(matchScores).forEach(([id, { h, a }]) => Draft.setMatch(+id, String(h), String(a)));
      Object.entries(bracketWinners).forEach(([mid, team]) => Draft.setWinner(+mid, team));
      form.reloadInputs();
      form.refresh();
      updateProgress();
    }
  );

  function updateProgress() {
    const done = Object.keys(Draft.matches).filter((id) => {
      const m = Draft.matches[id]; return m && m.h !== "" && m.a !== "";
    }).length;
    document.getElementById("progress").textContent = `${done} / ${cfg.matches.length} kamper tippet`;
  }
  updateProgress();

  document.getElementById("publish-btn").addEventListener("click", window.publishDraft);
  window.wireResetButton();
})();
