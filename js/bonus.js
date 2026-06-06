/* =============================================================================
 *  bonus.js  —  the player's bonus questions page.
 * ===========================================================================*/
(async function () {
  const cfg = (await App.loadConfig()).config;
  App.renderNav("bonus");

  const nameInput = document.getElementById("player-name");
  nameInput.value = Draft.name;

  const locked = Draft.locked;

  if (locked) {
    nameInput.disabled = true;
  } else {
    nameInput.addEventListener("input", () => Draft.setName(nameInput.value));
  }

  const bonus = cfg.bonus || { questions: [] };
  if (bonus.deadline) document.getElementById("deadline").textContent = "Leveres innen " + bonus.deadline + ".";

  const content = document.getElementById("content");

  if (locked) {
    const banner = App.el("div", { class: "banner info", style: "margin-bottom:1rem;text-align:center" }, [
      "🔒 Du har publisert — skjemaet er låst og kan ikke endres."
    ]);
    content.parentElement.insertBefore(banner, content);
  }

  BonusForm.render(content, {
    cfg,
    get: (id) => Draft.bonus[id],
    set: (id, v) => { if (!locked) Draft.setBonus(id, v); },
    onChange: locked ? null : updateProgress,
    readonly: locked
  });

  function updateProgress() {
    const answered = bonus.questions.filter((q) => Draft.bonus[q.id] != null && Draft.bonus[q.id] !== "").length;
    document.getElementById("progress").textContent = `${answered} / ${bonus.questions.length} bonusspørsmål besvart`;
  }
  updateProgress();

  // Publish button: only shown here, hidden when locked
  const publishBtn = document.getElementById("publish-btn");
  if (locked) {
    publishBtn.style.display = "none";
  } else {
    publishBtn.addEventListener("click", window.publishDraft);
  }

  window.wireResetButton();
  window.verifyLock();
})();
