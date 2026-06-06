/* =============================================================================
 *  bonus.js  —  the player's bonus questions page. Thin wrapper around the
 *  shared BonusForm, backed by the saved Draft.
 * ===========================================================================*/
(async function () {
  const cfg = (await App.loadConfig()).config;
  App.renderNav("bonus");

  const nameInput = document.getElementById("player-name");
  nameInput.value = Draft.name;
  nameInput.addEventListener("input", () => Draft.setName(nameInput.value));

  const bonus = cfg.bonus || { questions: [] };
  if (bonus.deadline) document.getElementById("deadline").textContent = "Leveres innen " + bonus.deadline + ".";

  const content = document.getElementById("content");

  BonusForm.render(content, {
    cfg,
    get: (id) => Draft.bonus[id],
    set: (id, v) => Draft.setBonus(id, v),
    onChange: updateProgress
  });

  function updateProgress() {
    const answered = bonus.questions.filter((q) => Draft.bonus[q.id] != null && Draft.bonus[q.id] !== "").length;
    document.getElementById("progress").textContent = `${answered} / ${bonus.questions.length} bonusspørsmål besvart`;
  }
  updateProgress();

  document.getElementById("publish-btn").addEventListener("click", window.publishDraft);
  window.wireResetButton();
})();
