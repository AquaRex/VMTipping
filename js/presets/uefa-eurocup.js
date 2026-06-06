/* =============================================================================
 * presets/uefa-eurocup.js — "UEFA European Championship" knockout preset
 * (24 teams, 6 groups A–F, best 4 third-placed teams advance to the Round of 16)
 *
 * Round of 16 schedule (UEFA):
 *   M1: Winner B   vs 3rd A/D/E/F
 *   M2: Winner A   vs Runner-up C
 *   M3: Winner F   vs 3rd A/B/C
 *   M4: Runner-up D vs Runner-up E
 *   M5: Winner E   vs 3rd A/B/C/D
 *   M6: Winner D   vs Runner-up F
 *   M7: Winner C   vs 3rd D/E/F
 *   M8: Runner-up A vs Runner-up B
 * No third-place play-off.
 *
 * Internal match ids 37–51 (group stage is 1–36). The bracket is laid out in
 * vertical (top-to-bottom) order; later rounds fill from the winners.
 *
 * thirdPlaceTable gives the OFFICIAL assignment of the four qualifying third
 * placed teams, keyed by the sorted set of their groups; the value lists the
 * third-place group facing each winner in column order B, C, E, F.
 * =========================================================================== */
(function () {
  window.BRACKET_PRESETS = window.BRACKET_PRESETS || {};

  const m = (top, bot, next, nextSlot, date, time) => {
    const o = {};
    o.top = top; o.bot = bot;
    if (next != null) { o.next = next; o.nextSlot = nextSlot; }
    if (date) o.date = date;
    if (time) o.time = time;
    return o;
  };
  const S = (seed) => ({ seed });
  const F = (from) => ({ from });

  window.BRACKET_PRESETS["uefa-eurocup"] = {
    name: "UEFA EM (24 lag, 6 grupper)",
    groupCount: 6,
    // Column order for the third-place table = winner groups that face a 3rd place
    thirdPlaceColumns: "BCEF",
    // key = sorted qualifying-third groups → assignment in column order B,C,E,F
    thirdPlaceTable: {
      "ABCD": "ADBC", "ABCE": "AEBC", "ABCF": "AFBC", "ABDE": "DEAB",
      "ABDF": "DFAB", "ABEF": "EFBA", "ACDE": "EDCA", "ACDF": "FDCA",
      "ACEF": "EFCA", "ADEF": "EFDA", "BCDE": "EDBC", "BCDF": "FDCB",
      "BCEF": "FECB", "BDEF": "FEDB", "CDEF": "FEDC"
    },
    knockoutRounds: [
      { key: "r16",   name: "Åttendedelsfinale", count: 16, points: 3 },
      { key: "qf",    name: "Kvartfinale",       count: 8,  points: 5 },
      { key: "sf",    name: "Semifinale",        count: 4,  points: 7 },
      { key: "final", name: "Finale",            count: 2,  points: 10 },
      { key: "winner",name: "Mester",            count: 1,  points: 15 }
    ],
    knockoutBracket: {
      rounds: [
        { key: "r16",   name: "Åttendedelsfinale", matchIds: [39, 37, 41, 42, 44, 43, 40, 38] },
        { key: "qf",    name: "Kvartfinale",       matchIds: [45, 46, 47, 48] },
        { key: "sf",    name: "Semifinale",        matchIds: [49, 50] },
        { key: "final", name: "Finale",            matchIds: [51] }
      ],
      matches: {
        // Round of 16 (vertical bracket order)
        39: m(S("1B"), S("3. plass A/D/E/F"), 45, "top"),
        37: m(S("1A"), S("2C"),               45, "bot"),
        41: m(S("1F"), S("3. plass A/B/C"),   46, "top"),
        42: m(S("2D"), S("2E"),               46, "bot"),
        44: m(S("1E"), S("3. plass A/B/C/D"), 47, "top"),
        43: m(S("1D"), S("2F"),               47, "bot"),
        40: m(S("1C"), S("3. plass D/E/F"),   48, "top"),
        38: m(S("2A"), S("2B"),               48, "bot"),
        // Quarter-finals
        45: m(F(39), F(37), 49, "top"),
        46: m(F(41), F(42), 49, "bot"),
        47: m(F(44), F(43), 50, "top"),
        48: m(F(40), F(38), 50, "bot"),
        // Semi-finals
        49: m(F(45), F(46), 51, "top"),
        50: m(F(47), F(48), 51, "bot"),
        // Final
        51: (() => { const x = m(F(49), F(50)); x.title = "Finale"; return x; })()
      }
    }
  };
})();
