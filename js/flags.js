/* =============================================================================
 * flags.js — master country-name → ISO-3166 alpha-2 code map (for flagcdn.com).
 *
 * This is the fallback used by App.flagUrl(): if a team in cfg.teams has no
 * `code`, or a name shows up that isn't in cfg.teams at all, we still get a flag
 * by looking the NAME up here. Keys are lowercase and cover Norwegian names,
 * English names, and common variants — so any current or future nation already
 * has a flag without needing to be pre-added to the config.
 *
 * Codes follow flagcdn (ISO 3166-1 alpha-2, plus the GB sub-codes gb-eng,
 * gb-sct, gb-wls, gb-nir which flagcdn supports for the home nations).
 * =========================================================================== */
window.FLAG_CODES = {
  // ---- Norwegian names ----
  "afghanistan": "af", "albania": "al", "algerie": "dz", "andorra": "ad",
  "angola": "ao", "argentina": "ar", "armenia": "am", "aserbajdsjan": "az",
  "australia": "au", "bahrain": "bh", "bangladesh": "bd", "belgia": "be",
  "benin": "bj", "bolivia": "bo", "bosnia-hercegovina": "ba", "brasil": "br",
  "bulgaria": "bg", "burkina faso": "bf", "canada": "ca", "chile": "cl",
  "colombia": "co", "costa rica": "cr", "curaçao": "cw", "danmark": "dk",
  "dr kongo": "cd", "ecuador": "ec", "egypt": "eg", "elfenbenskysten": "ci",
  "ekvatorial-guinea": "gq", "england": "gb-eng", "estland": "ee", "etiopia": "et",
  "filippinene": "ph", "finland": "fi", "frankrike": "fr", "gabon": "ga",
  "gambia": "gm", "georgia": "ge", "ghana": "gh", "guatemala": "gt",
  "guinea": "gn", "haiti": "ht", "hellas": "gr", "honduras": "hn",
  "india": "in", "indonesia": "id", "irak": "iq", "iran": "ir",
  "irland": "ie", "island": "is", "israel": "il", "italia": "it",
  "jamaica": "jm", "japan": "jp", "jordan": "jo", "kamerun": "cm",
  "kapp verde": "cv", "kasakhstan": "kz", "kenya": "ke", "kina": "cn",
  "kroatia": "hr", "kuwait": "kw", "kypros": "cy", "latvia": "lv",
  "libanon": "lb", "libya": "ly", "liechtenstein": "li", "litauen": "lt",
  "luxembourg": "lu", "madagaskar": "mg", "malaysia": "my", "mali": "ml",
  "malta": "mt", "marokko": "ma", "mauritania": "mr", "mexico": "mx",
  "moldova": "md", "montenegro": "me", "mosambik": "mz", "namibia": "na",
  "nederland": "nl", "new zealand": "nz", "nigeria": "ng", "nord-irland": "gb-nir",
  "nord-makedonia": "mk", "norge": "no", "oman": "om", "panama": "pa",
  "paraguay": "py", "peru": "pe", "polen": "pl", "portugal": "pt",
  "qatar": "qa", "romania": "ro", "russland": "ru", "saudi-arabia": "sa",
  "senegal": "sn", "serbia": "rs", "skottland": "gb-sct", "slovakia": "sk",
  "slovenia": "si", "spania": "es", "sveits": "ch", "sverige": "se",
  "sør-afrika": "za", "sør-korea": "kr", "nord-korea": "kp", "thailand": "th",
  "togo": "tg", "tsjekkia": "cz", "tunisia": "tn", "tyrkia": "tr",
  "tyskland": "de", "uganda": "ug", "ukraina": "ua", "ungarn": "hu",
  "uruguay": "uy", "usa": "us", "usbekistan": "uz", "venezuela": "ve",
  "vietnam": "vn", "wales": "gb-wls", "zambia": "zm", "zimbabwe": "zw",
  "østerrike": "at", "de forente arabiske emirater": "ae", "emiratene": "ae",
  "hviterussland": "by", "bahamas": "bs", "barbados": "bb", "trinidad og tobago": "tt",

  // ---- English names & common variants ----
  "south africa": "za", "south korea": "kr", "korea republic": "kr",
  "north korea": "kp", "czech republic": "cz", "czechia": "cz",
  "bosnia and herzegovina": "ba", "bosnia & herzegovina": "ba",
  "united states": "us", "turkey": "tr", "türkiye": "tr", "brazil": "br",
  "ivory coast": "ci", "côte d'ivoire": "ci", "cote d'ivoire": "ci",
  "germany": "de", "netherlands": "nl", "saudi arabia": "sa", "cape verde": "cv",
  "france": "fr", "iraq": "iq", "austria": "at", "croatia": "hr",
  "dr congo": "cd", "democratic republic of congo": "cd", "uzbekistan": "uz",
  "algeria": "dz", "norway": "no", "scotland": "gb-sct", "morocco": "ma",
  "switzerland": "ch", "sweden": "se", "spain": "es", "belgium": "be",
  "hungary": "hu", "denmark": "dk", "ukraine": "ua", "slovakia": "sk",
  "romania": "ro", "poland": "pl", "albania": "al", "slovenia": "si",
  "georgia": "ge", "italy": "it", "serbia": "rs", "greece": "gr",
  "ireland": "ie", "iceland": "is", "wales": "gb-wls", "northern ireland": "gb-nir",
  "russia": "ru", "china": "cn", "japan ": "jp", "curacao": "cw",
  "north macedonia": "mk", "macedonia": "mk", "montenegro": "me",
  "united arab emirates": "ae", "uae": "ae", "costa rica": "cr",
  "new zealand": "nz", "cameroon": "cm", "nigeria": "ng", "egypt": "eg",
  "tunisia": "tn", "senegal": "sn", "ghana": "gh", "mali": "ml",
  "venezuela": "ve", "peru": "pe", "chile": "cl", "bolivia": "bo",
  "ecuador": "ec", "uruguay": "uy", "colombia": "co", "panama": "pa",
  "honduras": "hn", "jamaica": "jm", "qatar": "qa", "iran": "ir",
  "india": "in", "indonesia": "id", "thailand": "th", "vietnam": "vn",
  "malaysia": "my", "philippines": "ph", "jordan": "jo", "oman": "om",
  "bahrain": "bh", "kuwait": "kw", "lebanon": "lb", "syria": "sy",
  "kazakhstan": "kz", "azerbaijan": "az", "belarus": "by", "moldova": "md",
  "luxembourg": "lu", "malta": "mt", "cyprus": "cy", "estonia": "ee",
  "latvia": "lv", "lithuania": "lt", "finland": "fi", "bulgaria": "bg"
};

/**
 * Resolve an ISO flag code from a team NAME (Norwegian, English, or variant).
 * Accent-insensitive. Returns "" if unknown.
 */
window.flagCodeForName = function (name) {
  if (!name) return "";
  const norm = (s) => s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const key = name.toLowerCase().trim();
  if (window.FLAG_CODES[key]) return window.FLAG_CODES[key];
  // accent-insensitive fallback
  const nk = norm(name);
  for (const k in window.FLAG_CODES) {
    if (norm(k) === nk) return window.FLAG_CODES[k];
  }
  return "";
};
