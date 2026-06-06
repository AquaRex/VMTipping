/* =============================================================================
 *  draft.js  —  the player's in-progress answers, kept in localStorage so the
 *  schedule page and the bonus page share ONE submission, and nothing is lost
 *  on refresh. "Publiser" sends the whole draft to the database.
 * ===========================================================================*/
(function () {
  const KEY = "vmtipp_draft";

  const blank = () => ({
    name: "",
    predictions: { matches: {}, knockout: {}, bracket: { slots: {}, winners: {} }, bonus: {} }
  });

  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || blank(); }
  catch { data = blank(); }
  // ensure shape
  data.predictions = data.predictions || {};
  data.predictions.matches = data.predictions.matches || {};
  data.predictions.knockout = data.predictions.knockout || {};
  data.predictions.bracket = data.predictions.bracket || { slots: {}, winners: {} };
  data.predictions.bracket.slots = data.predictions.bracket.slots || {};
  data.predictions.bracket.winners = data.predictions.bracket.winners || {};
  data.predictions.bonus = data.predictions.bonus || {};

  const save = () => localStorage.setItem(KEY, JSON.stringify(data));

  const Draft = {
    get data() { return data; },
    get name() { return data.name || ""; },
    setName(n) { data.name = n; save(); },

    matches: data.predictions.matches,
    knockout: data.predictions.knockout,
    bracket: data.predictions.bracket,
    bonus: data.predictions.bonus,

    setSlot(matchId, side, team) {
      const k = matchId + side;
      if (!team) delete data.predictions.bracket.slots[k];
      else data.predictions.bracket.slots[k] = team;
      save();
    },
    setWinner(matchId, team) {
      if (!team) delete data.predictions.bracket.winners[matchId];
      else data.predictions.bracket.winners[matchId] = team;
      save();
    },

    setMatch(id, h, a) {
      if (h === "" && a === "") delete data.predictions.matches[id];
      else data.predictions.matches[id] = { h, a };
      save();
    },
    setKnockout(roundKey, teams) { data.predictions.knockout[roundKey] = teams; save(); },
    setBonus(qid, value) {
      if (value === "" || value == null) delete data.predictions.bonus[qid];
      else data.predictions.bonus[qid] = value;
      save();
    },
    save,
    reset() { data = blank(); save(); }
  };

  window.Draft = Draft;
})();
