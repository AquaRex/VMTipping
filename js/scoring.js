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
    const akK = ak.knockout || {};
    const akB = ak.bonus || {};
    const pred = (entry && entry.predictions) || {};
    const pM = pred.matches || {};
    const pK = pred.knockout || {};
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
      const label = `${m.home} ${ph}–${pa} ${m.away}`;
      // outcome
      matchItems.push({
        key: `m${m.id}o`, label: label + "  (utfall)", points: cfg.scoring.groupOutcome,
        auto: haveKey ? (sign(ph - pa) === sign(+a.h - +a.a)) : null,
        keyInfo: haveKey ? `fasit ${a.h}–${a.a}` : "ingen fasit"
      });
      // exact
      matchItems.push({
        key: `m${m.id}e`, label: label + "  (eksakt)", points: cfg.scoring.groupExact,
        auto: haveKey ? (ph === +a.h && pa === +a.a) : null,
        keyInfo: haveKey ? `fasit ${a.h}–${a.a}` : "ingen fasit"
      });
    });
    if (matchItems.length) groups.push({ title: "Gruppespill", items: matchItems });

    /* ---- Knockout team picks ---- */
    (cfg.knockoutRounds || []).forEach((r) => {
      const picks = pK[r.key] || [];
      if (!picks.length) return;
      const actual = akK[r.key] || [];
      const haveKey = actual.length > 0;
      const items = picks.map((team) => ({
        key: `k:${r.key}:${team}`, label: team, points: r.points,
        auto: haveKey ? actual.includes(team) : null,
        keyInfo: haveKey ? "fasit satt" : "ingen fasit"
      }));
      groups.push({ title: r.name, items });
    });

    /* ---- Bonus ---- */
    const bonusItems = [];
    (cfg.bonus && cfg.bonus.questions || []).forEach((q) => {
      const ans = pB[q.id];
      if (ans == null || ans === "") return;
      const key = akB[q.id];
      const haveKey = key != null && key !== "";
      const shown = q.type === "yesno" ? (ans === "J" ? "Ja" : "Nei") : ans;
      bonusItems.push({
        key: `b${q.id}`, label: `${q.text}: ${shown}`, points: q.points,
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
