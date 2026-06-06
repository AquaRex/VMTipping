/* =============================================================================
 *  tournament.js  —  FIFA-accurate tournament maths shared by the live tipping
 *  form (schema-form.js) and the CSV importer (csv-import.js).
 *
 *  Exposes  window.WC  with:
 *    computeStandings(cfg, results) -> { standings, complete }
 *        results = { matchId: {h,a} }.  Applies the FIFA World Cup 26 tie-break
 *        rules (Regulations art. 13): head-to-head first, then overall.
 *    buildSeeds(cfg, standings, complete) -> { "1A":team, "2A":team, ...,
 *        "3. plass A/B/C/D/F": team, ... }   resolves every R32 slot.
 *    thirdPlaceSeeds(cfg, standings, complete) -> just the eight 3rd-place slots,
 *        using the official Annex C lookup table (falls back to constraint
 *        matching for non-standard group setups).
 *    cmp        the cross-group comparator (points, GD, GF, draw order).
 *    validate() dev self-check of the embedded Annex C table.
 *
 *  Why a lookup table?  The eight best third-placed teams are assigned to the
 *  round of 32 by a *fixed* table (FIFA Regulations Annexe C / Wikipedia
 *  "Combinations of matches in the round of 32"), keyed only by WHICH eight of
 *  the twelve groups produced a qualifying third-placed team — 12 choose 8 =
 *  495 combinations. The assignment is NOT derivable from a greedy match; it is
 *  this table.
 * ===========================================================================*/
(function (global) {
  "use strict";

  /* ---- comparator: points, goal difference, goals for, then draw order ---- */
  const cmp = (a, b) => (b.pts - a.pts) || (b.gd - a.gd) || (b.gf - a.gf) || (a.idx - b.idx);

  /* ---- head-to-head mini-table among a set of tied teams ------------------ */
  function miniTable(block, groupMatches, results) {
    const set = new Set(block.map((t) => t.team));
    const mini = {};
    block.forEach((t) => (mini[t.team] = { pts: 0, gd: 0, gf: 0 }));
    groupMatches.forEach((m) => {
      if (!set.has(m.home) || !set.has(m.away)) return;
      const r = results[m.id];
      if (!r) return;
      const H = mini[m.home], A = mini[m.away];
      H.gf += r.h; A.gf += r.a;
      H.gd += r.h - r.a; A.gd += r.a - r.h;
      if (r.h > r.a) H.pts += 3; else if (r.h < r.a) A.pts += 3; else { H.pts++; A.pts++; }
    });
    return mini;
  }

  /* ---- art. 13: resolve a block of teams level on overall points ----------
   * Step 1: head-to-head points, then GD, then goals among the tied teams.
   * If that splits some but not all, re-apply head-to-head to each still-tied
   * subset (recursion). A subset that head-to-head cannot separate at all falls
   * through to overall GD / goals / draw order.                               */
  function breakTie(block, groupMatches, results) {
    const mini = miniTable(block, groupMatches, results);
    const sorted = block.slice().sort((a, b) =>
      (mini[b.team].pts - mini[a.team].pts) ||
      (mini[b.team].gd - mini[a.team].gd) ||
      (mini[b.team].gf - mini[a.team].gf));
    const same = (x, y) =>
      mini[x.team].pts === mini[y.team].pts &&
      mini[x.team].gd === mini[y.team].gd &&
      mini[x.team].gf === mini[y.team].gf;
    const out = [];
    let i = 0;
    while (i < sorted.length) {
      let j = i;
      while (j + 1 < sorted.length && same(sorted[i], sorted[j + 1])) j++;
      const sub = sorted.slice(i, j + 1);
      if (sub.length === 1) out.push(sub[0]);
      else if (sub.length < block.length) breakTie(sub, groupMatches, results).forEach((t) => out.push(t));
      else sub.sort((a, b) => (b.gd - a.gd) || (b.gf - a.gf) || (a.idx - b.idx)).forEach((t) => out.push(t));
      i = j + 1;
    }
    return out;
  }

  function rankGroup(arr, groupMatches, results) {
    const byPts = arr.slice().sort((a, b) => b.pts - a.pts);
    const result = [];
    let i = 0;
    while (i < byPts.length) {
      let j = i;
      while (j + 1 < byPts.length && byPts[j + 1].pts === byPts[i].pts) j++;
      const block = byPts.slice(i, j + 1);
      if (block.length === 1) result.push(block[0]);
      else breakTie(block, groupMatches, results).forEach((t) => result.push(t));
      i = j + 1;
    }
    return result;
  }

  function computeStandings(cfg, results) {
    const standings = {}, complete = {};
    Object.keys(cfg.groups).forEach((g) => {
      const teams = cfg.groups[g];
      const st = {};
      teams.forEach((t, i) => (st[t] = { team: t, group: g, idx: i, pl: 0, w: 0, l: 0, d: 0, gf: 0, ga: 0, gd: 0, pts: 0 }));
      const groupMatches = cfg.matches.filter((m) => m.group === g);
      let allDone = true;
      groupMatches.forEach((m) => {
        const r = results[m.id];
        if (!r) { allDone = false; return; }
        const H = st[m.home], A = st[m.away];
        H.pl++; A.pl++; H.gf += r.h; H.ga += r.a; A.gf += r.a; A.ga += r.h;
        if (r.h > r.a) { H.w++; A.l++; H.pts += 3; }
        else if (r.h < r.a) { A.w++; H.l++; A.pts += 3; }
        else { H.d++; A.d++; H.pts++; A.pts++; }
      });
      teams.forEach((t) => (st[t].gd = st[t].gf - st[t].ga));
      standings[g] = rankGroup(teams.map((t) => st[t]), groupMatches, results);
      complete[g] = allDone;
    });
    return { standings, complete };
  }

  /* =========================================================================
   *  Annexe C — round of 32 third-place assignment table.
   *
   *  One entry per combination (495 = C(12,8)). Each entry is an 8-char string
   *  giving the third-place GROUP that plays each group winner, in the column
   *  order used by FIFA:  1A 1B 1D 1E 1G 1I 1K 1L.
   *  (Groups C, F, H, J winners face runners-up, never a third place, so they
   *  are absent from this table.)
   * =======================================================================*/
  const COL_ORDER = ["A", "B", "D", "E", "G", "I", "K", "L"];
  // R32 match whose lower slot is the third-place opponent of each group winner.
  const COL_MATCH = { A: 79, B: 85, D: 81, E: 74, G: 82, I: 77, K: 87, L: 80 };
  // Legal third-place groups per winner column (FIFA Regulations art. 12.6).
  const ALLOWED = {
    A: "CEFHI", B: "EFGIJ", D: "BEFIJ", E: "ABCDF",
    G: "AEHIJ", I: "CDFGH", K: "DEIJL", L: "EHIJK"
  };

  const ANNEXE_C = [
    "EJIFHGLK","HGIDJFLK","EJIDHGLK","EJIDHFLK","EGIDJFLK","EGJDHFLK","EGIDHFLK","EGJDHFLI","EGJDHFIK","HGICJFLK",
    "EJICHGLK","EJICHFLK","EGICJFLK","EGJCHFLK","EGICHFLK","EGJCHFLI","EGJCHFIK","HGICJDLK","CJIDHFLK","CGIDJFLK",
    "CGJDHFLK","CGIDHFLK","CGJDHFLI","CGJDHFIK","EJICHDLK","EGICJDLK","EGJCHDLK","EGICHDLK","EGJCHDLI","EGJCHDIK",
    "CJEDIFLK","CJEDHFLK","CEIDHFLK","CJEDHFLI","CJEDHFIK","CGEDJFLK","CGEDIFLK","CGEDJFLI","CGEDJFIK","CGEDHFLK",
    "CGJDHFLE","CGJDHFEK","CGEDHFLI","CGEDHFIK","CGJDHFEI","HJBFIGLK","EJIBHGLK","EJBFIHLK","EJBFIGLK","EJBFHGLK",
    "EGBFIHLK","EJBFHGLI","EJBFHGIK","HJBDIGLK","HJBDIFLK","IGBDJFLK","HGBDJFLK","HGBDIFLK","HGBDJFLI","HGBDJFIK",
    "EJBDIHLK","EJBDIGLK","EJBDHGLK","EGBDIHLK","EJBDHGLI","EJBDHGIK","EJBDIFLK","EJBDHFLK","EIBDHFLK","EJBDHFLI",
    "EJBDHFIK","EGBDJFLK","EGBDIFLK","EGBDJFLI","EGBDJFIK","EGBDHFLK","HGBDJFLE","HGBDJFEK","EGBDHFLI","EGBDHFIK",
    "HGBDJFEI","HJBCIGLK","HJBCIFLK","IGBCJFLK","HGBCJFLK","HGBCIFLK","HGBCJFLI","HGBCJFIK","EJBCIHLK","EJBCIGLK",
    "EJBCHGLK","EGBCIHLK","EJBCHGLI","EJBCHGIK","EJBCIFLK","EJBCHFLK","EIBCHFLK","EJBCHFLI","EJBCHFIK","EGBCJFLK",
    "EGBCIFLK","EGBCJFLI","EGBCJFIK","EGBCHFLK","HGBCJFLE","HGBCJFEK","EGBCHFLI","EGBCHFIK","HGBCJFEI","HJBCIDLK",
    "IGBCJDLK","HGBCJDLK","HGBCIDLK","HGBCJDLI","HGBCJDIK","CJBDIFLK","CJBDHFLK","CIBDHFLK","CJBDHFLI","CJBDHFIK",
    "CGBDJFLK","CGBDIFLK","CGBDJFLI","CGBDJFIK","CGBDHFLK","CGBDHFLJ","HGBCJFDK","CGBDHFLI","CGBDHFIK","HGBCJFDI",
    "EJBCIDLK","EJBCHDLK","EIBCHDLK","EJBCHDLI","EJBCHDIK","EGBCJDLK","EGBCIDLK","EGBCJDLI","EGBCJDIK","EGBCHDLK",
    "HGBCJDLE","HGBCJDEK","EGBCHDLI","EGBCHDIK","HGBCJDEI","CJBDEFLK","CEBDIFLK","CJBDEFLI","CJBDEFIK","CEBDHFLK",
    "CJBDHFLE","CJBDHFEK","CEBDHFLI","CEBDHFIK","CJBDHFEI","CGBDEFLK","CGBDJFLE","CGBDJFEK","CGBDEFLI","CGBDEFIK",
    "CGBDJFEI","CGBDHFLE","CGBDHFEK","HGBCJFDE","CGBDHFEI","HJIFAGLK","EJIAHGLK","EJIFAHLK","EJIFAGLK","EGJFAHLK",
    "EGIFAHLK","EGJFAHLI","EGJFAHIK","HJIDAGLK","HJIDAFLK","IGJDAFLK","HGJDAFLK","HGIDAFLK","HGJDAFLI","HGJDAFIK",
    "EJIDAHLK","EJIDAGLK","EGJDAHLK","EGIDAHLK","EGJDAHLI","EGJDAHIK","EJIDAFLK","HJEDAFLK","HEIDAFLK","HJEDAFLI",
    "HJEDAFIK","EGJDAFLK","EGIDAFLK","EGJDAFLI","EGJDAFIK","HGEDAFLK","HGJDAFLE","HGJDAFEK","HGEDAFLI","HGEDAFIK",
    "HGJDAFEI","HJICAGLK","HJICAFLK","IGJCAFLK","HGJCAFLK","HGICAFLK","HGJCAFLI","HGJCAFIK","EJICAHLK","EJICAGLK",
    "EGJCAHLK","EGICAHLK","EGJCAHLI","EGJCAHIK","EJICAFLK","HJECAFLK","HEICAFLK","HJECAFLI","HJECAFIK","EGJCAFLK",
    "EGICAFLK","EGJCAFLI","EGJCAFIK","HGECAFLK","HGJCAFLE","HGJCAFEK","HGECAFLI","HGECAFIK","HGJCAFEI","HJICADLK",
    "IGJCADLK","HGJCADLK","HGICADLK","HGJCADLI","HGJCADIK","CJIDAFLK","HJFCADLK","HFICADLK","HJFCADLI","HJFCADIK",
    "CGJDAFLK","CGIDAFLK","CGJDAFLI","CGJDAFIK","HGFCADLK","CGJDAFLH","HGJCAFDK","HGFCADLI","HGFCADIK","HGJCAFDI",
    "EJICADLK","HJECADLK","HEICADLK","HJECADLI","HJECADIK","EGJCADLK","EGICADLK","EGJCADLI","EGJCADIK","HGECADLK",
    "HGJCADLE","HGJCADEK","HGECADLI","HGECADIK","HGJCADEI","CJEDAFLK","CEIDAFLK","CJEDAFLI","CJEDAFIK","HEFCADLK",
    "HJFCADLE","HJECAFDK","HEFCADLI","HEFCADIK","HJECAFDI","CGEDAFLK","CGJDAFLE","CGJDAFEK","CGEDAFLI","CGEDAFIK",
    "CGJDAFEI","HGFCADLE","HGECAFDK","HGJCAFDE","HGECAFDI","HJBAIGLK","HJBAIFLK","IJBFAGLK","HJBFAGLK","HGBAIFLK",
    "HJBFAGLI","HJBFAGIK","EJBAIHLK","EJBAIGLK","EJBAHGLK","EGBAIHLK","EJBAHGLI","EJBAHGIK","EJBAIFLK","EJBFAHLK",
    "EIBFAHLK","EJBFAHLI","EJBFAHIK","EJBFAGLK","EGBAIFLK","EJBFAGLI","EJBFAGIK","EGBFAHLK","HJBFAGLE","HJBFAGEK",
    "EGBFAHLI","EGBFAHIK","HJBFAGEI","IJBDAHLK","IJBDAGLK","HJBDAGLK","IGBDAHLK","HJBDAGLI","HJBDAGIK","IJBDAFLK",
    "HJBDAFLK","HIBDAFLK","HJBDAFLI","HJBDAFIK","FJBDAGLK","IGBDAFLK","FJBDAGLI","FJBDAGIK","HGBDAFLK","HGBDAFLJ",
    "HGBDAFJK","HGBDAFLI","HGBDAFIK","HGBDAFIJ","EJBAIDLK","EJBDAHLK","EIBDAHLK","EJBDAHLI","EJBDAHIK","EJBDAGLK",
    "EGBAIDLK","EJBDAGLI","EJBDAGIK","EGBDAHLK","HJBDAGLE","HJBDAGEK","EGBDAHLI","EGBDAHIK","HJBDAGEI","EJBDAFLK",
    "EIBDAFLK","EJBDAFLI","EJBDAFIK","HEBDAFLK","HJBDAFLE","HJBDAFEK","HEBDAFLI","HEBDAFIK","HJBDAFEI","EGBDAFLK",
    "EGBDAFLJ","EGBDAFJK","EGBDAFLI","EGBDAFIK","EGBDAFIJ","HGBDAFLE","HGBDAFEK","HGBDAFEJ","HGBDAFEI","IJBCAHLK",
    "IJBCAGLK","HJBCAGLK","IGBCAHLK","HJBCAGLI","HJBCAGIK","IJBCAFLK","HJBCAFLK","HIBCAFLK","HJBCAFLI","HJBCAFIK",
    "CJBFAGLK","IGBCAFLK","CJBFAGLI","CJBFAGIK","HGBCAFLK","HGBCAFLJ","HGBCAFJK","HGBCAFLI","HGBCAFIK","HGBCAFIJ",
    "EJBAICLK","EJBCAHLK","EIBCAHLK","EJBCAHLI","EJBCAHIK","EJBCAGLK","EGBAICLK","EJBCAGLI","EJBCAGIK","EGBCAHLK",
    "HJBCAGLE","HJBCAGEK","EGBCAHLI","EGBCAHIK","HJBCAGEI","EJBCAFLK","EIBCAFLK","EJBCAFLI","EJBCAFIK","HEBCAFLK",
    "HJBCAFLE","HJBCAFEK","HEBCAFLI","HEBCAFIK","HJBCAFEI","EGBCAFLK","EGBCAFLJ","EGBCAFJK","EGBCAFLI","EGBCAFIK",
    "EGBCAFIJ","HGBCAFLE","HGBCAFEK","HGBCAFEJ","HGBCAFEI","IJBCADLK","HJBCADLK","HIBCADLK","HJBCADLI","HJBCADIK",
    "CJBDAGLK","IGBCADLK","CJBDAGLI","CJBDAGIK","HGBCADLK","HGBCADLJ","HGBCADJK","HGBCADLI","HGBCADIK","HGBCADIJ",
    "CJBDAFLK","CIBDAFLK","CJBDAFLI","CJBDAFIK","HFBCADLK","CJBDAFLH","HJBCAFDK","HFBCADLI","HFBCADIK","HJBCAFDI",
    "CGBDAFLK","CGBDAFLJ","CGBDAFJK","CGBDAFLI","CGBDAFIK","CGBDAFIJ","CGBDAFLH","HGBCAFDK","HGBCAFDJ","HGBCAFDI",
    "EJBCADLK","EIBCADLK","EJBCADLI","EJBCADIK","HEBCADLK","HJBCADLE","HJBCADEK","HEBCADLI","HEBCADIK","HJBCADEI",
    "EGBCADLK","EGBCADLJ","EGBCADJK","EGBCADLI","EGBCADIK","EGBCADIJ","HGBCADLE","HGBCADEK","HGBCADEJ","HGBCADEI",
    "CEBDAFLK","CJBDAFLE","CJBDAFEK","CEBDAFLI","CEBDAFIK","CJBDAFEI","HFBCADLE","HEBCAFDK","HJBCAFDE","HEBCAFDI",
    "CGBDAFLE","CGBDAFEK","CGBDAFEJ","CGBDAFEI","HGBCAFDE"
  ];

  // key = sorted set of the 8 qualifying third-place groups  ->  assignment string
  const LOOKUP = {};
  ANNEXE_C.forEach((row) => { LOOKUP[row.split("").sort().join("")] = row; });

  /* ---- Annexe C resolver (standard WC26 12-group / 8-thirds format) -------- */
  function annexeCSeeds(cfg, standings) {
    const out = {};
    const groups = Object.keys(cfg.groups);
    if (groups.length !== 12) return out;
    const thirds = groups.map((g) => standings[g] && standings[g][2]).filter(Boolean);
    if (thirds.length !== 12) return out;
    const best8 = thirds.slice().sort(cmp).slice(0, 8);
    const key = best8.map((t) => t.group).sort().join("");
    const row = LOOKUP[key];
    if (!row) return out;
    const B = cfg.knockoutBracket;
    COL_ORDER.forEach((winG, i) => {
      const thirdG = row[i];
      const m = B.matches[COL_MATCH[winG]];
      if (!m || !m.bot || m.bot.seed === undefined) return;
      const third = standings[thirdG] && standings[thirdG][2];
      if (third) out[m.bot.seed] = third.team;
    });
    return out;
  }

  /* ---- fallback for non-standard configs: constraint (bipartite) matching -- */
  function bipartiteSeeds(cfg, standings) {
    const B = cfg.knockoutBracket;
    const res = {};
    const qualifiers = Object.keys(cfg.groups).map((g) => standings[g][2]).filter(Boolean).sort(cmp).slice(0, 8);
    const qGroups = qualifiers.map((q) => q.group);
    const teamByGroup = {}; qualifiers.forEach((q) => (teamByGroup[q.group] = q.team));
    const slots = [];
    B.rounds[0].matchIds.forEach((mid) => ["top", "bot"].forEach((side) => {
      const s = B.matches[mid][side];
      if (s.seed !== undefined && /^3\. plass /.test(s.seed)) {
        slots.push({ seed: s.seed, allowed: s.seed.replace("3. plass ", "").split("/").map((x) => x.trim()) });
      }
    }));
    const groupToSlot = {};
    const trySlot = (si, visited) => {
      for (const g of qGroups) {
        if (!slots[si].allowed.includes(g) || visited.has(g)) continue;
        visited.add(g);
        if (groupToSlot[g] === undefined || trySlot(groupToSlot[g], visited)) { groupToSlot[g] = si; return true; }
      }
      return false;
    };
    for (let si = 0; si < slots.length; si++) trySlot(si, new Set());
    Object.keys(groupToSlot).forEach((g) => (res[slots[groupToSlot[g]].seed] = teamByGroup[g]));
    return res;
  }

  function thirdPlaceSeeds(cfg, standings, complete) {
    if (!Object.values(complete).every(Boolean)) return {};
    const viaTable = annexeCSeeds(cfg, standings);
    if (Object.keys(viaTable).length) return viaTable;
    return bipartiteSeeds(cfg, standings);
  }

  function buildSeeds(cfg, standings, complete) {
    const res = {};
    Object.keys(cfg.groups).forEach((g) => {
      if (complete[g]) { res["1" + g] = standings[g][0].team; res["2" + g] = standings[g][1].team; }
    });
    Object.assign(res, thirdPlaceSeeds(cfg, standings, complete));
    // Safety: never let the same team occupy two bracket slots.
    const seen = new Set();
    Object.keys(res).forEach((k) => { if (seen.has(res[k])) delete res[k]; else seen.add(res[k]); });
    return res;
  }

  /* ---- dev self-check of the embedded Annexe C table ----------------------- */
  function validate() {
    const errors = [];
    if (ANNEXE_C.length !== 495) errors.push("expected 495 rows, got " + ANNEXE_C.length);
    const keys = new Set();
    ANNEXE_C.forEach((row, idx) => {
      const n = idx + 1;
      if (row.length !== 8) { errors.push("option " + n + ": length " + row.length); return; }
      const chars = row.split("");
      if (new Set(chars).size !== 8) errors.push("option " + n + ": duplicate group (" + row + ")");
      chars.forEach((c, col) => {
        if (ALLOWED[COL_ORDER[col]].indexOf(c) === -1)
          errors.push("option " + n + ": 3" + c + " illegal in column 1" + COL_ORDER[col]);
      });
      const key = chars.slice().sort().join("");
      if (keys.has(key)) errors.push("option " + n + ": duplicate combination " + key);
      keys.add(key);
    });
    if (keys.size !== 495) errors.push("expected 495 distinct combinations, got " + keys.size);
    return { ok: errors.length === 0, errors };
  }

  const WC = { computeStandings, buildSeeds, thirdPlaceSeeds, cmp, validate, ANNEXE_C };
  global.WC = WC;
  if (typeof module !== "undefined" && module.exports) module.exports = WC;
})(typeof window !== "undefined" ? window : globalThis);
