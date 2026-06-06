/* =============================================================================
 * config.js  —  DEFAULT (seed) configuration for the tipping site.
 *
 * This is the "factory default" for the 2026 World Cup. The LIVE configuration
 * actually lives in Supabase so the admin can edit it from the browser and have
 * the changes show up for everyone. This file is only used to:
 *    1. seed the database the very first time ("Last inn 2026-standard" in admin)
 *    2. act as a fallback if the database can't be reached.
 *
 * You normally do NOT need to edit this file by hand — use the Admin page.
 * But it is plain, readable data if you ever want to tweak the defaults.
 * ===========================================================================*/

window.DEFAULT_CONFIG = {
  season: "2026",
  title: "Verdensmesterskapet i fotball 2026",
  bonusTitle: "Bonusspørsmål",

  /* ---- Teams (Norwegian name + ISO code used for the flag image) ---------- */
  teams: [
    { name: "Mexico", code: "mx" },
    { name: "Sør-Afrika", code: "za" },
    { name: "Sør-Korea", code: "kr" },
    { name: "Tsjekkia", code: "cz" },
    { name: "Canada", code: "ca" },
    { name: "Bosnia-Hercegovina", code: "ba" },
    { name: "USA", code: "us" },
    { name: "Paraguay", code: "py" },
    { name: "Haiti", code: "ht" },
    { name: "Skottland", code: "gb-sct" },
    { name: "Australia", code: "au" },
    { name: "Tyrkia", code: "tr" },
    { name: "Brasil", code: "br" },
    { name: "Marokko", code: "ma" },
    { name: "Qatar", code: "qa" },
    { name: "Sveits", code: "ch" },
    { name: "Elfenbenskysten", code: "ci" },
    { name: "Ecuador", code: "ec" },
    { name: "Tyskland", code: "de" },
    { name: "Curaçao", code: "cw" },
    { name: "Nederland", code: "nl" },
    { name: "Japan", code: "jp" },
    { name: "Sverige", code: "se" },
    { name: "Tunisia", code: "tn" },
    { name: "Saudi-Arabia", code: "sa" },
    { name: "Uruguay", code: "uy" },
    { name: "Spania", code: "es" },
    { name: "Kapp Verde", code: "cv" },
    { name: "Iran", code: "ir" },
    { name: "New Zealand", code: "nz" },
    { name: "Belgia", code: "be" },
    { name: "Egypt", code: "eg" },
    { name: "Frankrike", code: "fr" },
    { name: "Senegal", code: "sn" },
    { name: "Irak", code: "iq" },
    { name: "Norge", code: "no" },
    { name: "Argentina", code: "ar" },
    { name: "Østerrike", code: "at" },
    { name: "Ghana", code: "gh" },
    { name: "Panama", code: "pa" },
    { name: "England", code: "gb-eng" },
    { name: "Kroatia", code: "hr" },
    { name: "Portugal", code: "pt" },
    { name: "DR Kongo", code: "cd" },
    { name: "Usbekistan", code: "uz" },
    { name: "Colombia", code: "co" },
    { name: "Algerie", code: "dz" },
    { name: "Jordan", code: "jo" }
  ],

  /* ---- Groups ------------------------------------------------------------- */
  groups: {
    A: ["Mexico", "Sør-Korea", "Tsjekkia", "Sør-Afrika"],
    B: ["Sveits", "Canada", "Qatar", "Bosnia-Hercegovina"],
    C: ["Brasil", "Marokko", "Skottland", "Haiti"],
    D: ["USA", "Tyrkia", "Australia", "Paraguay"],
    E: ["Tyskland", "Ecuador", "Elfenbenskysten", "Curaçao"],
    F: ["Nederland", "Japan", "Sverige", "Tunisia"],
    G: ["Belgia", "Iran", "Egypt", "New Zealand"],
    H: ["Spania", "Uruguay", "Saudi-Arabia", "Kapp Verde"],
    I: ["Frankrike", "Senegal", "Norge", "Irak"],
    J: ["Argentina", "Østerrike", "Algerie", "Jordan"],
    K: ["Portugal", "Colombia", "DR Kongo", "Usbekistan"],
    L: ["England", "Kroatia", "Panama", "Ghana"]
  },

  /* ---- Group-stage matches (chronological, as in the original sheet) ------ */
  matches: [
    { id: 1,  day: "Tor", date: "11. jun", time: "21:00", group: "A", home: "Mexico", away: "Sør-Afrika" },
    { id: 2,  day: "Fre", date: "12. jun", time: "04:00", group: "A", home: "Sør-Korea", away: "Tsjekkia" },
    { id: 3,  day: "Fre", date: "12. jun", time: "21:00", group: "B", home: "Canada", away: "Bosnia-Hercegovina" },
    { id: 4,  day: "Lør", date: "13. jun", time: "03:00", group: "D", home: "USA", away: "Paraguay" },
    { id: 5,  day: "Søn", date: "14. jun", time: "03:00", group: "C", home: "Haiti", away: "Skottland" },
    { id: 6,  day: "Søn", date: "14. jun", time: "06:00", group: "D", home: "Australia", away: "Tyrkia" },
    { id: 7,  day: "Søn", date: "14. jun", time: "00:00", group: "C", home: "Brasil", away: "Marokko" },
    { id: 8,  day: "Søn", date: "14. jun", time: "09:00", group: "B", home: "Qatar", away: "Sveits" },
    { id: 9,  day: "Man", date: "15. jun", time: "01:00", group: "E", home: "Elfenbenskysten", away: "Ecuador" },
    { id: 10, day: "Man", date: "15. jun", time: "07:00", group: "E", home: "Tyskland", away: "Curaçao" },
    { id: 11, day: "Søn", date: "14. jun", time: "22:00", group: "F", home: "Nederland", away: "Japan" },
    { id: 12, day: "Man", date: "15. jun", time: "04:00", group: "F", home: "Sverige", away: "Tunisia" },
    { id: 13, day: "Tir", date: "16. jun", time: "00:00", group: "H", home: "Saudi-Arabia", away: "Uruguay" },
    { id: 14, day: "Tir", date: "16. jun", time: "06:00", group: "H", home: "Spania", away: "Kapp Verde" },
    { id: 15, day: "Tir", date: "16. jun", time: "03:00", group: "G", home: "Iran", away: "New Zealand" },
    { id: 16, day: "Tir", date: "16. jun", time: "09:00", group: "G", home: "Belgia", away: "Egypt" },
    { id: 17, day: "Tir", date: "16. jun", time: "21:00", group: "I", home: "Frankrike", away: "Senegal" },
    { id: 18, day: "Ons", date: "17. jun", time: "00:00", group: "I", home: "Irak", away: "Norge" },
    { id: 19, day: "Ons", date: "17. jun", time: "03:00", group: "J", home: "Argentina", away: "Algerie" },
    { id: 20, day: "Ons", date: "17. jun", time: "06:00", group: "J", home: "Østerrike", away: "Jordan" },
    { id: 21, day: "Tor", date: "18. jun", time: "01:00", group: "L", home: "Ghana", away: "Panama" },
    { id: 22, day: "Ons", date: "17. jun", time: "22:00", group: "L", home: "England", away: "Kroatia" },
    { id: 23, day: "Tor", date: "18. jun", time: "07:00", group: "K", home: "Portugal", away: "DR Kongo" },
    { id: 24, day: "Tor", date: "18. jun", time: "04:00", group: "K", home: "Usbekistan", away: "Colombia" },
    { id: 25, day: "Fre", date: "19. jun", time: "06:00", group: "A", home: "Tsjekkia", away: "Sør-Afrika" },
    { id: 26, day: "Fre", date: "19. jun", time: "09:00", group: "B", home: "Sveits", away: "Bosnia-Hercegovina" },
    { id: 27, day: "Fre", date: "19. jun", time: "00:00", group: "B", home: "Canada", away: "Qatar" },
    { id: 28, day: "Fre", date: "19. jun", time: "03:00", group: "A", home: "Mexico", away: "Sør-Korea" },
    { id: 29, day: "Lør", date: "20. jun", time: "02:30", group: "C", home: "Brasil", away: "Haiti" },
    { id: 30, day: "Lør", date: "20. jun", time: "00:00", group: "C", home: "Skottland", away: "Marokko" },
    { id: 31, day: "Lør", date: "20. jun", time: "05:00", group: "D", home: "USA", away: "Australia" },
    { id: 32, day: "Lør", date: "20. jun", time: "09:00", group: "D", home: "Tyrkia", away: "Paraguay" },
    { id: 33, day: "Lør", date: "20. jun", time: "22:00", group: "E", home: "Tyskland", away: "Elfenbenskysten" },
    { id: 34, day: "Søn", date: "21. jun", time: "02:00", group: "E", home: "Ecuador", away: "Curaçao" },
    { id: 35, day: "Søn", date: "21. jun", time: "07:00", group: "F", home: "Nederland", away: "Sverige" },
    { id: 36, day: "Søn", date: "21. jun", time: "06:00", group: "F", home: "Tunisia", away: "Japan" },
    { id: 37, day: "Man", date: "22. jun", time: "00:00", group: "H", home: "Uruguay", away: "Kapp Verde" },
    { id: 38, day: "Man", date: "22. jun", time: "06:00", group: "H", home: "Spania", away: "Saudi-Arabia" },
    { id: 39, day: "Man", date: "22. jun", time: "09:00", group: "G", home: "Belgia", away: "Iran" },
    { id: 40, day: "Man", date: "22. jun", time: "03:00", group: "G", home: "New Zealand", away: "Egypt" },
    { id: 41, day: "Tir", date: "23. jun", time: "02:00", group: "I", home: "Norge", away: "Senegal" },
    { id: 42, day: "Man", date: "22. jun", time: "22:00", group: "I", home: "Frankrike", away: "Irak" },
    { id: 43, day: "Tir", date: "23. jun", time: "07:00", group: "J", home: "Argentina", away: "Østerrike" },
    { id: 44, day: "Tir", date: "23. jun", time: "05:00", group: "J", home: "Jordan", away: "Algerie" },
    { id: 45, day: "Tir", date: "23. jun", time: "22:00", group: "L", home: "England", away: "Ghana" },
    { id: 46, day: "Ons", date: "24. jun", time: "01:00", group: "L", home: "Panama", away: "Kroatia" },
    { id: 47, day: "Ons", date: "24. jun", time: "07:00", group: "K", home: "Portugal", away: "Usbekistan" },
    { id: 48, day: "Ons", date: "24. jun", time: "04:00", group: "K", home: "Colombia", away: "DR Kongo" },
    { id: 49, day: "Tor", date: "25. jun", time: "00:00", group: "C", home: "Skottland", away: "Brasil" },
    { id: 50, day: "Tor", date: "25. jun", time: "00:00", group: "C", home: "Marokko", away: "Haiti" },
    { id: 51, day: "Tor", date: "25. jun", time: "09:00", group: "B", home: "Sveits", away: "Canada" },
    { id: 52, day: "Tor", date: "25. jun", time: "09:00", group: "B", home: "Bosnia-Hercegovina", away: "Qatar" },
    { id: 53, day: "Tor", date: "25. jun", time: "03:00", group: "A", home: "Tsjekkia", away: "Mexico" },
    { id: 54, day: "Tor", date: "25. jun", time: "03:00", group: "A", home: "Sør-Afrika", away: "Sør-Korea" },
    { id: 55, day: "Tor", date: "25. jun", time: "22:00", group: "E", home: "Curaçao", away: "Elfenbenskysten" },
    { id: 56, day: "Tor", date: "25. jun", time: "22:00", group: "E", home: "Ecuador", away: "Tyskland" },
    { id: 57, day: "Fre", date: "26. jun", time: "01:00", group: "F", home: "Japan", away: "Sverige" },
    { id: 58, day: "Fre", date: "26. jun", time: "01:00", group: "F", home: "Tunisia", away: "Nederland" },
    { id: 59, day: "Fre", date: "26. jun", time: "04:00", group: "D", home: "Tyrkia", away: "USA" },
    { id: 60, day: "Fre", date: "26. jun", time: "04:00", group: "D", home: "Paraguay", away: "Australia" },
    { id: 61, day: "Fre", date: "26. jun", time: "21:00", group: "I", home: "Norge", away: "Frankrike" },
    { id: 62, day: "Fre", date: "26. jun", time: "21:00", group: "I", home: "Senegal", away: "Irak" },
    { id: 63, day: "Lør", date: "27. jun", time: "05:00", group: "G", home: "Egypt", away: "Iran" },
    { id: 64, day: "Lør", date: "27. jun", time: "05:00", group: "G", home: "New Zealand", away: "Belgia" },
    { id: 65, day: "Lør", date: "27. jun", time: "02:00", group: "H", home: "Kapp Verde", away: "Saudi-Arabia" },
    { id: 66, day: "Lør", date: "27. jun", time: "02:00", group: "H", home: "Uruguay", away: "Spania" },
    { id: 67, day: "Lør", date: "27. jun", time: "23:00", group: "L", home: "Panama", away: "England" },
    { id: 68, day: "Lør", date: "27. jun", time: "23:00", group: "L", home: "Kroatia", away: "Ghana" },
    { id: 69, day: "Søn", date: "28. jun", time: "04:00", group: "J", home: "Algerie", away: "Østerrike" },
    { id: 70, day: "Søn", date: "28. jun", time: "04:00", group: "J", home: "Jordan", away: "Argentina" },
    { id: 71, day: "Søn", date: "28. jun", time: "01:30", group: "K", home: "Colombia", away: "Portugal" },
    { id: 72, day: "Søn", date: "28. jun", time: "01:30", group: "K", home: "DR Kongo", away: "Usbekistan" }
  ],

  /* ---- Knockout rounds (progressive team picks) --------------------------
   * The user picks which teams reach each round. `count` is how many teams
   * advance to that round, `points` is awarded per correctly picked team.    */
  knockoutRounds: [
    { key: "r32",    name: "16-delsfinale",    count: 32, points: 3 },
    { key: "r16",    name: "Åttendedelsfinale", count: 16, points: 3 },
    { key: "qf",     name: "Kvartfinale",      count: 8,  points: 5 },
    { key: "sf",     name: "Semifinale",       count: 4,  points: 7 },
    { key: "final",  name: "Finale",           count: 2,  points: 10 },
    { key: "winner", name: "Verdensmester",    count: 1,  points: 15 }
  ],

  /* ---- Knockout bracket (visual tree like the Excel sheet) ----------------
   * Round of 32 slots are picked by the player (each has a "seed" hint like the
   * original sheet). Later rounds fill automatically from the winners you click.
   * `from` = winner of that match feeds this slot; `from`+`loser` = the loser
   * (used for the bronze final). `next`/`nextSlot` = where the winner goes.    */
  knockoutBracket: {
    rounds: [
      { key: "r32",    name: "16-delsfinale",    matchIds: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87] },
      { key: "r16",    name: "8-delsfinale",     matchIds: [89, 90, 93, 94, 91, 92, 95, 96] },
      { key: "qf",     name: "Kvartfinale",      matchIds: [97, 98, 99, 100] },
      { key: "sf",     name: "Semifinale",       matchIds: [101, 102] },
      { key: "final",  name: "Finale / Bronse",  matchIds: [104, 103] }
    ],
    matches: {
      // Round of 32
      74: { date: "29. jun", time: "22:30", top: { seed: "1E" }, bot: { seed: "3. plass A/B/C/D/F" }, next: 89, nextSlot: "top" },
      77: { date: "30. jun", time: "23:00", top: { seed: "1I" }, bot: { seed: "3. plass C/D/F/G/H" }, next: 89, nextSlot: "bot" },
      73: { date: "29. jun", time: "09:00", top: { seed: "2A" }, bot: { seed: "2B" }, next: 90, nextSlot: "top" },
      75: { date: "30. jun", time: "03:00", top: { seed: "1F" }, bot: { seed: "2C" }, next: 90, nextSlot: "bot" },
      83: { date: "3. jul",  time: "01:00", top: { seed: "2K" }, bot: { seed: "2L" }, next: 93, nextSlot: "top" },
      84: { date: "3. jul",  time: "09:00", top: { seed: "1H" }, bot: { seed: "2G" }, next: 93, nextSlot: "bot" },
      81: { date: "2. jul",  time: "02:00", top: { seed: "1D" }, bot: { seed: "3. plass B/E/F/I/J" }, next: 94, nextSlot: "top" },
      82: { date: "1. jul",  time: "22:00", top: { seed: "1G" }, bot: { seed: "3. plass A/E/H/I/J" }, next: 94, nextSlot: "bot" },
      76: { date: "30. jun", time: "07:00", top: { seed: "1C" }, bot: { seed: "2F" }, next: 91, nextSlot: "top" },
      78: { date: "1. jul",  time: "07:00", top: { seed: "2E" }, bot: { seed: "2I" }, next: 91, nextSlot: "bot" },
      79: { date: "1. jul",  time: "03:00", top: { seed: "1A" }, bot: { seed: "3. plass C/E/F/H/I" }, next: 92, nextSlot: "top" },
      80: { date: "2. jul",  time: "06:00", top: { seed: "1L" }, bot: { seed: "3. plass E/H/I/J/K" }, next: 92, nextSlot: "bot" },
      86: { date: "4. jul",  time: "00:00", top: { seed: "1J" }, bot: { seed: "2H" }, next: 95, nextSlot: "top" },
      88: { date: "3. jul",  time: "20:00", top: { seed: "2D" }, bot: { seed: "2G" }, next: 95, nextSlot: "bot" },
      85: { date: "3. jul",  time: "05:00", top: { seed: "1B" }, bot: { seed: "3. plass E/F/G/I/J" }, next: 96, nextSlot: "top" },
      87: { date: "4. jul",  time: "03:30", top: { seed: "1K" }, bot: { seed: "3. plass D/E/I/J/L" }, next: 96, nextSlot: "bot" },
      // Round of 16 (8-delsfinale)
      89: { date: "4. jul",  time: "23:00", top: { from: 74 }, bot: { from: 77 }, next: 97, nextSlot: "top" },
      90: { date: "5. jul",  time: "00:00", top: { from: 73 }, bot: { from: 75 }, next: 97, nextSlot: "bot" },
      93: { date: "6. jul",  time: "21:00", top: { from: 83 }, bot: { from: 84 }, next: 98, nextSlot: "top" },
      94: { date: "7. jul",  time: "02:00", top: { from: 81 }, bot: { from: 82 }, next: 98, nextSlot: "bot" },
      91: { date: "5. jul",  time: "22:00", top: { from: 76 }, bot: { from: 78 }, next: 99, nextSlot: "top" },
      92: { date: "6. jul",  time: "02:00", top: { from: 79 }, bot: { from: 80 }, next: 99, nextSlot: "bot" },
      95: { date: "8. jul",  time: "04:00", top: { from: 86 }, bot: { from: 88 }, next: 100, nextSlot: "top" },
      96: { date: "7. jul",  time: "22:00", top: { from: 85 }, bot: { from: 87 }, next: 100, nextSlot: "bot" },
      // Quarterfinals
      97:  { date: "9. jul",  time: "22:00", top: { from: 89 }, bot: { from: 90 }, next: 101, nextSlot: "top" },
      98:  { date: "11. jul", time: "09:00", top: { from: 93 }, bot: { from: 94 }, next: 101, nextSlot: "bot" },
      99:  { date: "11. jul", time: "23:00", top: { from: 91 }, bot: { from: 92 }, next: 102, nextSlot: "top" },
      100: { date: "12. jul", time: "03:00", top: { from: 95 }, bot: { from: 96 }, next: 102, nextSlot: "bot" },
      // Semifinals (loser goes to bronze final 103)
      101: { date: "14. jul", time: "21:00", top: { from: 97 }, bot: { from: 98 }, next: 104, nextSlot: "top", loserNext: 103, loserSlot: "top" },
      102: { date: "15. jul", time: "21:00", top: { from: 99 }, bot: { from: 100 }, next: 104, nextSlot: "bot", loserNext: 103, loserSlot: "bot" },
      // Final + Bronze
      104: { date: "19. jul", time: "21:00", title: "Finale", top: { from: 101 }, bot: { from: 102 } },
      103: { date: "18. jul", time: "23:00", title: "Bronsefinale", top: { from: 101, loser: true }, bot: { from: 102, loser: true } }
    }
  },

  /* ---- Group-stage match scoring ----------------------------------------- */
  scoring: {
    groupOutcome: 1, // correct H/U/B
    groupExact: 2    // correct exact score (in addition to outcome)
  },

  /* ---- Bonus questions ---------------------------------------------------
   * Each question:
   *   id      unique string
   *   section grouping label shown as a heading
   *   text    the question / duel label
   *   type    "duel" (pick one of options) | "yesno" | "text"
   *   options array of choices (only for "duel")
   *   points  points awarded for a correct answer                            */
  bonus: {
    deadline: "10. juni",
    sections: [
      "Flest mål", "Flest assist", "Flest innslupne mål", "Flest gule kort",
      "Individuelle priser", "Simen Berntsens Saftige Bonusspørsmål", "Norge"
    ],
    questions: [
      // ---- Flest mål (duell, 2p) ----
      { id: "fm1", section: "Flest mål", type: "duel", points: 2, text: "Flest mål", options: ["Erling Braut Haaland", "Kylian Mbappé"] },
      { id: "fm2", section: "Flest mål", type: "duel", points: 2, text: "Flest mål", options: ["Cristiano Ronaldo", "Lionel Messi"] },
      { id: "fm3", section: "Flest mål", type: "duel", points: 2, text: "Flest mål", options: ["Harry Kane", "Viktor Gyökeres"] },
      { id: "fm4", section: "Flest mål", type: "duel", points: 2, text: "Flest mål", options: ["Raphinha", "Lamine Yamal"] },
      { id: "fm5", section: "Flest mål", type: "duel", points: 2, text: "Flest mål", options: ["Breel Embolo", "Nicolas Jackson"] },
      { id: "fm6", section: "Flest mål", type: "duel", points: 2, text: "Flest mål", options: ["Omar Marmoush", "Romelu Lukaku"] },
      { id: "fm7", section: "Flest mål", type: "duel", points: 2, text: "Flest mål", options: ["Christian Pulisic", "Son Heung-Min"] },

      // ---- Flest assist (duell, 2p) ----
      { id: "fa1", section: "Flest assist", type: "duel", points: 2, text: "Flest assist", options: ["Jamal Musiala", "Jude Bellingham"] },
      { id: "fa2", section: "Flest assist", type: "duel", points: 2, text: "Flest assist", options: ["Bruno Fernandes", "Kevin De Bruyne"] },
      { id: "fa3", section: "Flest assist", type: "duel", points: 2, text: "Flest assist", options: ["Martin Ødegaard", "Vinicius Junior"] },
      { id: "fa4", section: "Flest assist", type: "duel", points: 2, text: "Flest assist", options: ["Cody Gakpo", "Pedri"] },
      { id: "fa5", section: "Flest assist", type: "duel", points: 2, text: "Flest assist", options: ["Federico Valverde", "Scott McTominay"] },

      // ---- Flest innslupne mål (duell, 2p) ----
      { id: "fi1", section: "Flest innslupne mål", type: "duel", points: 2, text: "Flest innslupne mål", options: ["Curaçao", "Kapp Verde"] },
      { id: "fi2", section: "Flest innslupne mål", type: "duel", points: 2, text: "Flest innslupne mål", options: ["Qatar", "Usbekistan"] },
      { id: "fi3", section: "Flest innslupne mål", type: "duel", points: 2, text: "Flest innslupne mål", options: ["Norge", "Sverige"] },

      // ---- Flest gule kort (duell, 2p) ----
      { id: "fg1", section: "Flest gule kort", type: "duel", points: 2, text: "Flest gule kort", options: ["Portugal", "Spania"] },
      { id: "fg2", section: "Flest gule kort", type: "duel", points: 2, text: "Flest gule kort", options: ["Colombia", "Brasil"] },
      { id: "fg3", section: "Flest gule kort", type: "duel", points: 2, text: "Flest gule kort", options: ["Skottland", "England"] },

      // ---- Individuelle priser (fritekst, 10p) ----
      { id: "pr1", section: "Individuelle priser", type: "text", points: 10, text: "Toppscorer" },
      { id: "pr2", section: "Individuelle priser", type: "text", points: 10, text: "Turneringens beste spiller" },
      { id: "pr3", section: "Individuelle priser", type: "text", points: 10, text: "Spiller med flest assist" },
      { id: "pr4", section: "Individuelle priser", type: "text", points: 10, text: "Land med flest røde kort" },
      { id: "pr5", section: "Individuelle priser", type: "text", points: 10, text: "Land med flest gule kort" },
      { id: "pr6", section: "Individuelle priser", type: "text", points: 10, text: "Land med flest mål" },
      { id: "pr7", section: "Individuelle priser", type: "text", points: 10, text: "Land med minst innslupne" },
      { id: "pr8", section: "Individuelle priser", type: "text", points: 10, text: "Gullhansken (beste keeper)" },

      // ---- Simen Berntsens Saftige Bonusspørsmål (5p) ----
      { id: "si1",  section: "Simen Berntsens Saftige Bonusspørsmål", type: "text",  points: 5, text: "Første land som får gult kort?" },
      { id: "si2",  section: "Simen Berntsens Saftige Bonusspørsmål", type: "text",  points: 5, text: "Første land som får rødt kort?" },
      { id: "si3",  section: "Simen Berntsens Saftige Bonusspørsmål", type: "text",  points: 5, text: "Hvilket land scorer det første målet?" },
      { id: "si4",  section: "Simen Berntsens Saftige Bonusspørsmål", type: "text",  points: 5, text: "Hvilket land scorer det siste målet?" },
      { id: "si5",  section: "Simen Berntsens Saftige Bonusspørsmål", type: "text",  points: 5, text: "Første VAR-avgjørelse?* (kamp)" },
      { id: "si6",  section: "Simen Berntsens Saftige Bonusspørsmål", type: "yesno", points: 5, text: "Blir VAR brukt i finalen?*" },
      { id: "si7",  section: "Simen Berntsens Saftige Bonusspørsmål", type: "yesno", points: 5, text: "8 eller flere mål i samme kamp?" },
      { id: "si8",  section: "Simen Berntsens Saftige Bonusspørsmål", type: "text",  points: 5, text: "Hvilket land får første straffe?" },
      { id: "si9",  section: "Simen Berntsens Saftige Bonusspørsmål", type: "yesno", points: 5, text: "Vil det bli straffekonk ila. mesterskapet?" },
      { id: "si10", section: "Simen Berntsens Saftige Bonusspørsmål", type: "text",  points: 5, text: "Hvilket land scorer færrest mål?" },
      { id: "si11", section: "Simen Berntsens Saftige Bonusspørsmål", type: "yesno", points: 5, text: "Banestorming / tilskuer på banen?" },

      // ---- Norge (5p) ----
      { id: "no1",  section: "Norge", type: "yesno", points: 5, text: "Blir Norges første mål i VM scoret med venstrefot?" },
      { id: "no2",  section: "Norge", type: "yesno", points: 5, text: "Scorer Haaland over 3,5 mål i gruppespillet?" },
      { id: "no3",  section: "Norge", type: "yesno", points: 5, text: "Scorer Norge mål direkte på frispark eller straffe i gruppespill?" },
      { id: "no4",  section: "Norge", type: "yesno", points: 5, text: "Går Norge videre til 16-delsfinalen?" },
      { id: "no5",  section: "Norge", type: "yesno", points: 5, text: "Scorer Norge i begge omgangene i åpningskampen?" },
      { id: "no6",  section: "Norge", type: "text",  points: 5, text: "Norges første målscorer?" },
      { id: "no7",  section: "Norge", type: "text",  points: 5, text: "Norges siste målscorer?" },
      { id: "no8",  section: "Norge", type: "text",  points: 5, text: "Hvor langt kommer Norge i VM?" },
      { id: "no9",  section: "Norge", type: "yesno", points: 5, text: "Får en spiller på Norge rødt kort under mesterskapet?" },
      { id: "no10", section: "Norge", type: "yesno", points: 5, text: "Blir det selvmål i en av Norges kamper under mesterskapet?" }
    ],
    footnote: "* Dommeren omgjør en situasjon ETTER å ha vært ute å kikket på skjermen."
  }
};
