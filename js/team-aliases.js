/* =============================================================================
 * team-aliases.js — English → Norwegian (and variant) team name aliases.
 *
 * When importing a CSV, team names are looked up here first. If a match is
 * found the Norwegian canonical name is used. If not, the name is used as-is
 * and the admin can rename it in the teams list.
 *
 * Keys are lowercase. Add new aliases freely — order doesn't matter.
 * =========================================================================== */
window.TEAM_ALIASES = {
  // ---- World Cup 2026 nations (English → Norwegian) ----
  "south africa":           "Sør-Afrika",
  "korea republic":         "Sør-Korea",
  "republic of korea":      "Sør-Korea",
  "south korea":            "Sør-Korea",
  "bosnia and herzegovina": "Bosnia-Hercegovina",
  "bosnia & herzegovina":   "Bosnia-Hercegovina",
  "united states":          "USA",
  "usa":                    "USA",
  "turkey":                 "Tyrkia",
  "brazil":                 "Brasil",
  "ivory coast":            "Elfenbenskysten",
  "côte d'ivoire":          "Elfenbenskysten",
  "cote d'ivoire":          "Elfenbenskysten",
  "germany":                "Tyskland",
  "netherlands":            "Nederland",
  "saudi arabia":           "Saudi-Arabia",
  "saudi-arabia":           "Saudi-Arabia",
  "cape verde":             "Kapp Verde",
  "new zealand":            "New Zealand",
  "france":                 "Frankrike",
  "iraq":                   "Irak",
  "argentina":              "Argentina",
  "austria":                "Østerrike",
  "ghana":                  "Ghana",
  "panama":                 "Panama",
  "england":                "England",
  "croatia":                "Kroatia",
  "portugal":               "Portugal",
  "dr congo":               "DR Kongo",
  "dr. congo":              "DR Kongo",
  "democratic republic of congo": "DR Kongo",
  "uzbekistan":             "Usbekistan",
  "colombia":               "Colombia",
  "algeria":                "Algerie",
  "jordan":                 "Jordan",
  "norway":                 "Norge",
  "scotland":               "Skottland",
  "australia":              "Australia",
  "morocco":                "Marokko",
  "switzerland":            "Sveits",
  "ecuador":                "Ecuador",
  "sweden":                 "Sverige",
  "spain":                  "Spania",
  "belgium":                "Belgia",
  "senegal":                "Senegal",
  "mexico":                 "Mexico",
  "canada":                 "Canada",
  "paraguay":               "Paraguay",
  "haiti":                  "Haiti",
  "qatar":                  "Qatar",
  "iran":                   "Iran",
  "uruguay":                "Uruguay",
  "japan":                  "Japan",
  "tunisia":                "Tunisia",
  "egypt":                  "Egypt",
  "czech republic":         "Tsjekkia",
  "czechia":                "Tsjekkia",

  // ---- UEFA Euro 2024 nations ----
  "hungary":                "Ungarn",
  "denmark":                "Danmark",
  "serbia":                 "Serbia",
  "ukraine":                "Ukraina",
  "slovakia":               "Slovakia",
  "romania":                "Romania",
  "poland":                 "Polen",
  "albania":                "Albania",
  "slovenia":               "Slovenia",
  "georgia":                "Georgia",
  "italy":                  "Italia",
  "switzerland":            "Sveits",
  "france":                 "Frankrike",

  // ---- Common flag/confederation variants ----
  "curacao":                "Curaçao",
  "curaçao":                "Curaçao",
};

/**
 * Resolve a team name from a CSV to the canonical Norwegian name.
 * Falls back to the original name if no alias or existing team found.
 *
 * @param {string} raw - team name as it appears in the CSV
 * @param {Array}  teams - cfg.teams array [{name, code}]
 * @returns {string} canonical name to store
 */
window.resolveTeamName = function (raw, teams) {
  if (!raw) return raw;
  const key = raw.trim().toLowerCase();

  // 1. Already an exact match in cfg.teams
  const exact = teams.find(t => t.name.toLowerCase() === key);
  if (exact) return exact.name;

  // 2. Alias map lookup
  const aliased = window.TEAM_ALIASES[key];
  if (aliased) return aliased;

  // 3. Partial/accent-insensitive match against cfg.teams
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const normKey = norm(key);
  const fuzzy = teams.find(t => norm(t.name) === normKey);
  if (fuzzy) return fuzzy.name;

  // 4. Unknown — use as-is, admin can fix it
  return raw.trim();
};
