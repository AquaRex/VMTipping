/* =============================================================================
 *  apifootball.js  —  Henter spillerlister fra API-Football (admin-knapp).
 * -----------------------------------------------------------------------------
 *  Brukes KUN av admin. Resultatet skrives til cfg.players og lagres i
 *  databasen — vanlige besøkende henter aldri fra API-et selv.
 *
 *  Grensene for gratis-planen: 10 kall/minutt, 100 kall/dag.
 *  Denne koden holder seg til ~8 kall/min (7 s mellom kall).
 * ===========================================================================*/
(function () {
  const BASE    = "https://v3.football.api-sports.io";
  const GAP_MS  = 7000;    // 7 s mellom kall → ~8/min, godt under 10/min-grensen
  const WAIT_MS = 65000;   // vent ~65 s hvis vi likevel treffer rate-limit

  /* ------------------------------------------------------------------
   * Kjente nasjons-team-IDer i API-Football.
   * Nøkkel = ISO 3166-1 alpha-2 landkode (samme som cfg.teams[].code).
   * ------------------------------------------------------------------ */
  const TEAM_IDS = {
    /* --- VM 2022 --- */
    ar: 26, au: 20, be: 1,   br: 6,   cm: 1530, ca: 5529,
    cr: 29, hr: 3,  dk: 21,  ec: 2382,"gb-eng": 10, fr: 2,
    de: 25, gh: 1504,ir: 22, jp: 12,  mx: 16,  ma: 31,
    nl: 1118,pl: 24, pt: 27, qa: 1569,sa: 23,  sn: 13,
    rs: 14, kr: 17, es: 9,   ch: 15,  tn: 28,  uy: 7,
    us: 2384,"gb-wls": 767,
    /* --- VM 2026 (ny vs 2022) --- */
    no: 1090,"gb-sct": 1108, tr: 777, se: 5,   at: 775,
    ba: 1113, cz: 770,  za: 1531, ht: 2386, py: 2380,
    pa: 11,  ci: 1501, cw: 5530, cv: 1533, nz: 4673,
    eg: 32,  iq: 1567, jo: 1548, uz: 1568, cd: 1508,
    co: 8,
    /* --- andre kjente nasjonale lag --- */
    cl: 4,   pe: 18,  bo: 19,  ve: 35,  ec2: 2382,
    ke: 1523,ng: 1530 /* Nigeria — dobbelsjekk ved behov */,
  };

  /* Norsk → engelsk for lag som ikke søkes med norsk navn */
  const CODE_TO_ENGLISH = {
    "no":"Norway","gb-sct":"Scotland","se":"Sweden","dk":"Denmark",
    "nl":"Netherlands","de":"Germany","fr":"France","es":"Spain",
    "pt":"Portugal","be":"Belgium","hr":"Croatia","rs":"Serbia",
    "pl":"Poland","cz":"Czech Republic","at":"Austria","ch":"Switzerland",
    "tr":"Turkey","ba":"Bosnia & Herzegovina","gb-eng":"England",
    "gb-wls":"Wales","br":"Brazil","ar":"Argentina","co":"Colombia",
    "uy":"Uruguay","py":"Paraguay","pe":"Peru","bo":"Bolivia",
    "cl":"Chile","ve":"Venezuela","ec":"Ecuador","ca":"Canada",
    "us":"USA","mx":"Mexico","pa":"Panama","ht":"Haiti","cr":"Costa Rica",
    "ma":"Morocco","sn":"Senegal","gh":"Ghana","ci":"Ivory Coast",
    "eg":"Egypt","tn":"Tunisia","cm":"Cameroon","ng":"Nigeria",
    "za":"South Africa","dz":"Algeria","cd":"Congo DR","ke":"Kenya",
    "qa":"Qatar","sa":"Saudi Arabia","ir":"Iran","jp":"Japan",
    "kr":"South Korea","au":"Australia","nz":"New Zealand",
    "uz":"Uzbekistan","iq":"Iraq","jo":"Jordan","cv":"Cape Verde",
    "cw":"Curacao",
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function apiGet(path) {
    const res = await fetch(BASE + path, {
      headers: { "x-apisports-key": window.API_FOOTBALL_KEY },
    });
    if (res.status === 429) return { _rateLimited: true };
    const json = await res.json().catch(() => ({}));
    const errs = json.errors;
    const hasErr = errs && (Array.isArray(errs) ? errs.length : Object.keys(errs).length);
    if (hasErr) {
      const txt = JSON.stringify(errs).toLowerCase();
      if (txt.includes("rate") || txt.includes("limit") || txt.includes("request"))
        return { _rateLimited: true };
      return { _error: JSON.stringify(errs) };
    }
    return json;
  }

  async function apiSafe(path, onStatus, retries = 2) {
    let r = await apiGet(path);
    while (r._rateLimited && retries-- > 0) {
      if (onStatus) onStatus("⏳ API-grense nådd — venter ~1 minutt …");
      await sleep(WAIT_MS);
      r = await apiGet(path);
    }
    return r;
  }

  /* Finn team-ID for ett lag: sjekk hardkodet map, fall tilbake til søk */
  async function resolveTeamId(team, onStatus) {
    const code = (team.code || "").toLowerCase().replace(/^gb-/, "gb-");
    if (TEAM_IDS[code]) return TEAM_IDS[code];

    /* Ukjent kode → søk med engelsk lagnavnl (ett ekstra API-kall) */
    const engName = CODE_TO_ENGLISH[code] || team.name;
    if (onStatus) onStatus(`Søker etter ${engName} …`);
    const r = await apiSafe(`/teams?search=${encodeURIComponent(engName)}`, onStatus);
    if (!r._error && !r._rateLimited) {
      const exact = (r.response || []).find(
        (x) => x.team.name.toLowerCase() === engName.toLowerCase()
      );
      if (exact) {
        TEAM_IDS[code] = exact.team.id;  // cache for neste gang
        return exact.team.id;
      }
      /* Ta første treff hvis ikke eksakt match */
      if (r.response && r.response.length) {
        TEAM_IDS[code] = r.response[0].team.id;
        return r.response[0].team.id;
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------
   * Hovdedfunksjon: hent spillere for alle lag i cfg.teams.
   * Returnerer { players:[{name,team}], teamCount, skipped }
   * ------------------------------------------------------------------ */
  async function fetchAllPlayers(cfgTeams, onStatus) {
    if (!window.API_FOOTBALL_KEY)
      throw new Error("Mangler API_FOOTBALL_KEY i supabase-config.js.");

    if (!cfgTeams || !cfgTeams.length)
      throw new Error("Ingen lag i konfigurasjon — sett opp lag-listen først.");

    const byName = new Map();  // lowercase navn → {name, team} (dedup)
    let skipped = 0;

    for (let i = 0; i < cfgTeams.length; i++) {
      const t = cfgTeams[i];
      if (onStatus)
        onStatus(`Lag ${i + 1}/${cfgTeams.length}: ${t.name} … (${byName.size} spillere)`);

      const teamId = await resolveTeamId(t, onStatus);
      if (!teamId) { skipped++; continue; }

      const r = await apiSafe(`/players/squads?team=${teamId}`, onStatus);
      if (r._error) { skipped++; continue; }

      const squad = (r.response && r.response[0] && r.response[0].players) || [];
      squad.forEach((p) => {
        const nm = (p.name || "").trim();
        if (!nm) return;
        const k = nm.toLowerCase();
        if (!byName.has(k)) byName.set(k, { name: nm, team: t.name });
      });

      if (i < cfgTeams.length - 1) await sleep(GAP_MS);
    }

    const players = Array.from(byName.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "nb")
    );
    return { players, teamCount: cfgTeams.length - skipped, skipped };
  }

  window.ApiFootball = { fetchAllPlayers };
})();
