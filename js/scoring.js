/* =============================================================================
 *  scoring.js  —  turns an entry's predictions + the official answer key (fasit)
 *  into a flat list of "scorables": one line per thing that can earn points.
 *  Each scorable has a suggested auto-result; the admin can override it.
 * ===========================================================================*/
(function () {
  const sign = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);
  const norm = (s) => String(s == null ? "" : s).trim().toLowerCase();

  /* Build scorables for one entry given config + answer key. */
  function buildScorables(cfg, answerKey, entry) {
    const ak = answerKey || {};
    const akM = ak.matches || {};
    const akKW = ak.bracketWinners || {};   // fasit: winner per knockout match
    const akB = ak.bonus || {};
    const pred = (entry && entry.predictions) || {};
    const pM = pred.matches || {};
    const pKW = (pred.bracket && pred.bracket.winners) || {}; // entry: winner per match
    const pB = pred.bonus || {};

    const groups = []; // { title, items: [...] }

    /* ---- Group-stage matches ---- */
    const matchItems = [];
    (cfg.matches || []).forEach((m) => {
      const p = pM[m.id];
      if (!p || p.h === "" || p.a === "" || p.h == null || p.a == null) return; // not predicted
      const a = akM[m.id];
      const haveKey = a && a.h !== "" && a.a !== "" && a.h != null && a.a != null;
      const ph = +p.h, pa = +p.a;
      const q = `${m.home} – ${m.away}`;
      const pick = `${ph}–${pa}`;
      // outcome
      matchItems.push({
        key: `m${m.id}o`, label: q + " (utfall)", pick, points: cfg.scoring.groupOutcome,
        auto: haveKey ? (sign(ph - pa) === sign(+a.h - +a.a)) : null,
        keyInfo: haveKey ? `fasit ${a.h}–${a.a}` : "ingen fasit"
      });
      // exact
      matchItems.push({
        key: `m${m.id}e`, label: q + " (eksakt)", pick, points: cfg.scoring.groupExact,
        auto: haveKey ? (ph === +a.h && pa === +a.a) : null,
        keyInfo: haveKey ? `fasit ${a.h}–${a.a}` : "ingen fasit"
      });
    });
    if (matchItems.length) groups.push({ title: "Gruppespill", items: matchItems });

    /* ---- Knockout: one scorable per MATCH, by predicted vs actual winner ----
     * Each knockout match awards its round's points if the predicted winner of
     * that match equals the actual (fasit) winner. No double-counting: one match
     * = one award (the team that advances). Round points come from cfg.knockoutRounds. */
    const bracket = cfg.knockoutBracket;
    if (bracket && bracket.rounds) {
      const pointsForRound = {};
      (cfg.knockoutRounds || []).forEach((r) => { pointsForRound[r.key] = r.points; });
      bracket.rounds.forEach((round) => {
        const pts = pointsForRound[round.key] != null ? pointsForRound[round.key] : 0;
        const items = [];
        (round.matchIds || []).forEach((mid) => {
          const predWin = pKW[mid];
          if (!predWin) return; // user didn't pick this match
          const actualWin = akKW[mid];
          const haveKey = actualWin != null && actualWin !== "";
          items.push({
            key: `kw:${mid}`, label: "Kamp " + mid, pick: predWin, points: pts,
            auto: haveKey ? (norm(predWin) === norm(actualWin)) : null,
            keyInfo: haveKey ? `fasit: ${actualWin}` : "ingen fasit"
          });
        });
        if (items.length) groups.push({ title: round.name, items });
      });

      // Champion bonus: the winner of the FINAL match. Scored separately with the
      // "winner" round's points (e.g. 15p) on top of the final-match points.
      const winnerRound = (cfg.knockoutRounds || []).find((r) => r.key === "winner");
      const finalRound = bracket.rounds[bracket.rounds.length - 1];
      const finalId = finalRound && finalRound.matchIds && finalRound.matchIds[0];
      if (winnerRound && finalId != null) {
        const predWin = pKW[finalId];
        if (predWin) {
          const actualWin = akKW[finalId];
          const haveKey = actualWin != null && actualWin !== "";
          groups.push({ title: winnerRound.name, items: [{
            key: `kw:winner`, label: "Mester", pick: predWin, points: winnerRound.points,
            auto: haveKey ? (norm(predWin) === norm(actualWin)) : null,
            keyInfo: haveKey ? `fasit: ${actualWin}` : "ingen fasit"
          }]});
        }
      }
    }

    /* ---- Bonus ---- */
    const bonusItems = [];
    (cfg.bonus && cfg.bonus.questions || []).forEach((q) => {
      const ans = pB[q.id];
      if (ans == null || ans === "") return;
      const key = akB[q.id];
      const haveKey = key != null && key !== "";
      const shown = q.type === "yesno" ? (ans === "J" ? "Ja" : "Nei") : ans;
      bonusItems.push({
        key: `b${q.id}`, label: q.text, pick: shown, points: q.points,
        auto: haveKey ? (norm(ans) === norm(key)) : null,
        keyInfo: haveKey ? `fasit: ${q.type === "yesno" ? (norm(key) === "j" ? "Ja" : "Nei") : key}` : "ingen fasit"
      });
    });
    if (bonusItems.length) groups.push({ title: "Bonusspørsmål", items: bonusItems });

    return groups;
  }

  /* Decide final correctness for a key: manual override wins, else auto. */
  function resolved(scores, key, auto) {
    if (scores && Object.prototype.hasOwnProperty.call(scores, key)) return scores[key];
    return auto === true; // null/false -> not awarded by default
  }

  /* Total points for an entry given its stored scores (or auto). */
  function totalFor(cfg, answerKey, entry) {
    const groups = buildScorables(cfg, answerKey, entry);
    let total = 0;
    groups.forEach((g) => g.items.forEach((it) => {
      if (resolved(entry.scores, it.key, it.auto)) total += it.points;
    }));
    return total;
  }

  window.Scoring = { buildScorables, resolved, totalFor };
})();
