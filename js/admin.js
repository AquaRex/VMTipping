/* =============================================================================
 *  admin.js  —  password-gated admin panel:
 *    • Resultattavle   — leaderboard
 *    • Deltakere       — view & score each published entry (toggle correct/wrong)
 *    • Fasit           — official answer key (auto-grades everyone)
 *    • Bonusspørsmål   — add / remove / reorder questions, set points
 *    • Oppsett         — season, scoring points, teams, CSV upload, reset
 * ===========================================================================*/
(function () {
  const el = (t, a, c) => App.el(t, a, c);
  let cfg = null, answerKey = null, entries = [];

  /* ----------------------------- login ----------------------------- */
  App.loadConfig().then(() => App.renderNav("admin"));

  const gate = document.getElementById("gate");
  const adminEl = document.getElementById("admin");
  const passInput = document.getElementById("admin-pass");

  function tryLogin() {
    if (passInput.value === (window.ADMIN_PASSWORD || "4054")) {
      sessionStorage.setItem("vmtipp_admin", "1");
      start();
    } else {
      App.toast("Feil passord.", "error");
    }
  }
  document.getElementById("login-btn").addEventListener("click", tryLogin);
  passInput.addEventListener("keydown", (e) => { if (e.key === "Enter") tryLogin(); });
  if (sessionStorage.getItem("vmtipp_admin") === "1") start();

  async function start() {
    gate.classList.add("hidden");
    adminEl.classList.remove("hidden");
    const res = await App.loadConfig();
    cfg = res.config; answerKey = res.answerKey || {};
    answerKey.matches = answerKey.matches || {};
    answerKey.knockout = answerKey.knockout || {};
    answerKey.bracketWinners = answerKey.bracketWinners || {};
    answerKey.bonus = answerKey.bonus || {};
    App.renderNav("admin");
    document.getElementById("db-status").textContent = DB.usingSupabase
      ? "Tilkoblet Supabase ✓"
      : "⚠ Supabase ikke konfigurert — bruker kun denne nettleseren (localStorage). Se README.";
    try { entries = await DB.listEntries(); } catch (e) { entries = []; }
    setupTabs();
    renderAll();
  }

  /* ----------------------------- tabs ----------------------------- */
  function setupTabs() {
    document.querySelectorAll("#tabs a").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        document.querySelectorAll("#tabs a").forEach((x) => x.classList.remove("active"));
        a.classList.add("active");
        document.querySelectorAll(".tabpane").forEach((p) => p.classList.add("hidden"));
        document.getElementById("tab-" + a.dataset.tab).classList.remove("hidden");
      });
    });
  }

  function renderAll() {
    renderBoard();
    renderEntries();
    renderFasit();
    renderFasitBonus();
    renderBonusCfg();
    renderSetup();
  }

  async function reloadEntries() {
    try { entries = await DB.listEntries(); } catch { entries = []; }
    renderBoard(); renderEntries();
  }

  async function saveConfig() {
    await DB.saveConfig(cfg);
    App.toast("Konfigurasjon lagret.", "success");
  }
  async function saveAnswerKey() {
    await DB.saveAnswerKey(answerKey);
  }

  /* ====================================================================
   *  TAB: Resultattavle
   * ==================================================================*/
  function renderBoard() {
    const pane = document.getElementById("tab-board");
    pane.innerHTML = "";
    const card = el("div", { class: "card" }, []);
    card.appendChild(el("h2", {}, ["Resultattavle"]));
    card.appendChild(el("p", { class: "sub" }, [`${entries.length} publiserte skjema. Poengsum oppdateres når du retter (eller setter fasit og trykker «Rett alle»).`]));

    const btnRow = el("div", { class: "btn-row", style: "margin-bottom:1rem" }, []);
    const recalc = el("button", { class: "btn btn-primary" }, ["↻ Rett alle automatisk mot fasit"]);
    recalc.addEventListener("click", recalcAll);
    btnRow.appendChild(recalc);
    const refresh = el("button", { class: "btn" }, ["⟳ Hent på nytt"]);
    refresh.addEventListener("click", reloadEntries);
    btnRow.appendChild(refresh);
    card.appendChild(btnRow);

    if (!entries.length) {
      card.appendChild(el("p", { class: "muted" }, ["Ingen skjema er publisert ennå."]));
    } else {
      const tbl = el("table", { class: "tbl" }, []);
      tbl.innerHTML = "<thead><tr><th>#</th><th>Navn</th><th>Poeng</th><th></th></tr></thead>";
      const tb = el("tbody", {}, []);
      entries.slice().sort((a, b) => (b.total || 0) - (a.total || 0)).forEach((en, i) => {
        const tr = el("tr", {}, []);
        tr.innerHTML = `<td class="rank">${i + 1}</td><td>${App.escape(en.name)}</td><td><b>${en.total || 0}</b></td>`;
        const td = el("td", {}, []);
        const b = el("button", { class: "btn btn-sm" }, ["Åpne / rett"]);
        b.addEventListener("click", () => openEntry(en.id));
        td.appendChild(b); tr.appendChild(td);
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      card.appendChild(tbl);
    }
    pane.appendChild(card);
  }

  async function recalcAll() {
    for (const en of entries) {
      const total = Scoring.totalFor(cfg, answerKey, en);
      en.total = total;
      await DB.updateEntry(en.id, { total });
    }
    App.toast("Alle skjema rettet mot fasit.", "success");
    reloadEntries();
  }

  /* ====================================================================
   *  TAB: Deltakere & retting
   * ==================================================================*/
  function renderEntries() {
    const pane = document.getElementById("tab-entries");
    pane.innerHTML = "";
    const card = el("div", { class: "card" }, []);
    card.appendChild(el("h2", {}, ["Deltakere"]));
    card.appendChild(el("p", { class: "sub" }, ["Klikk et navn for å se alle svar og rette manuelt (toggle riktig/feil)."]));
    if (!entries.length) {
      card.appendChild(el("p", { class: "muted" }, ["Ingen skjema er publisert ennå."]));
    } else {
      const tbl = el("table", { class: "tbl" }, []);
      tbl.innerHTML = "<thead><tr><th>Navn</th><th>Poeng</th><th>Publisert</th><th></th></tr></thead>";
      const tb = el("tbody", {}, []);
      entries.forEach((en) => {
        const tr = el("tr", {}, []);
        const when = en.created_at ? new Date(en.created_at).toLocaleString("no-NO") : "";
        tr.innerHTML = `<td>${App.escape(en.name)}</td><td><b>${en.total || 0}</b></td><td class="muted">${when}</td>`;
        const td = el("td", {}, []);
        const open = el("button", { class: "btn btn-sm" }, ["Rett"]);
        open.addEventListener("click", () => openEntry(en.id));
        const del = el("button", { class: "btn btn-sm btn-danger", style: "margin-left:.4rem" }, ["Slett"]);
        del.addEventListener("click", async () => {
          if (confirm(`Slette skjemaet til ${en.name}?`)) {
            await DB.deleteEntry(en.id); App.toast("Slettet.", "success"); reloadEntries();
          }
        });
        td.appendChild(open); td.appendChild(del); tr.appendChild(td);
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      card.appendChild(tbl);
    }
    pane.appendChild(card);
  }

  function openEntry(id) {
    const en = entries.find((e) => e.id === id);
    if (!en) return;
    en.scores = en.scores || {};
    const groups = Scoring.buildScorables(cfg, answerKey, en);

    const body = el("div", {}, []);
    // editable name
    const nameRow = el("div", { class: "btn-row", style: "margin-bottom:1rem" }, []);
    nameRow.appendChild(el("label", { style: "align-self:center;font-weight:700" }, ["Navn:"]));
    const nameIn = el("input", { type: "text", value: en.name, style: "flex:1" }, []);
    nameRow.appendChild(nameIn);
    body.appendChild(nameRow);

    const totalBadge = el("div", { class: "banner info" }, []);
    body.appendChild(totalBadge);

    function recomputeTotal() {
      let t = 0;
      groups.forEach((g) => g.items.forEach((it) => {
        if (Scoring.resolved(en.scores, it.key, it.auto)) t += it.points;
      }));
      totalBadge.textContent = `Sum poeng: ${t}`;
      return t;
    }

    groups.forEach((g) => {
      body.appendChild(el("div", { class: "section-title" }, [el("h3", {}, [g.title])]));
      g.items.forEach((it) => {
        const correct = Scoring.resolved(en.scores, it.key, it.auto);
        const row = el("div", { class: "score-row" }, []);
        const pickDiv = el("div", { class: "pick" }, []);
        if (it.label) pickDiv.appendChild(el("span", { class: "q" }, [it.label]));
        if (it.pick) pickDiv.appendChild(el("span", { class: "a" }, [it.pick]));
        pickDiv.appendChild(el("span", { class: "keyinfo" }, [it.keyInfo || ""]));
        row.appendChild(pickDiv);
        row.appendChild(el("div", { class: "muted" }, [`${it.points}p`]));
        const mark = el("div", { class: "mark" }, []);
        const ok = el("button", { class: "ok" + (correct ? " on" : "") }, ["✓"]);
        const no = el("button", { class: "no" + (!correct ? " on" : "") }, ["✗"]);
        ok.addEventListener("click", () => { en.scores[it.key] = true; ok.classList.add("on"); no.classList.remove("on"); recomputeTotal(); });
        no.addEventListener("click", () => { en.scores[it.key] = false; no.classList.add("on"); ok.classList.remove("on"); recomputeTotal(); });
        mark.appendChild(ok); mark.appendChild(no);
        row.appendChild(mark);
        body.appendChild(row);
      });
    });
    if (!groups.length) body.appendChild(el("p", { class: "muted" }, ["Dette skjemaet har ingen svar å rette."]));
    recomputeTotal();

    const autoBtn = el("button", { class: "btn" }, ["↻ Foreslå mot fasit"]);
    autoBtn.addEventListener("click", () => { en.scores = {}; closeModal(); openEntry(id); });

    const saveBtn = el("button", { class: "btn btn-primary" }, ["Lagre retting"]);
    saveBtn.addEventListener("click", async () => {
      const total = recomputeTotal();
      en.name = nameIn.value.trim() || en.name;
      await DB.updateEntry(en.id, { name: en.name, scores: en.scores, total });
      App.toast("Retting lagret.", "success");
      closeModal(); reloadEntries();
    });

    showModal("Retter: " + en.name, body, [autoBtn, saveBtn]);
  }

  /* ====================================================================
   *  TAB: Fasit (answer key)
   * ==================================================================*/
  function renderFasit() {
    const pane = document.getElementById("tab-fasit");
    pane.innerHTML = "";
    const intro = el("div", { class: "card" }, []);
    intro.appendChild(el("h2", {}, ["Fasit (offisielle resultater)"]));
    intro.appendChild(el("p", { class: "sub" }, ["Fyll inn fasiten på nøyaktig samme måte som deltakerne tipper: skriv resultater i gruppespillet (tabellen og sluttspillet fylles ut automatisk), klikk vinnere i sluttspillet, og svar på bonusspørsmålene. Trykk «Lagre fasit», og deretter «Rett alle» for å oppdatere alle poeng."]));
    const saveRow = el("div", { class: "btn-row" }, []);
    const saveBtn = el("button", { class: "btn btn-primary" }, ["💾 Lagre fasit"]);
    saveBtn.addEventListener("click", async () => { await saveAnswerKey(); App.toast("Fasit lagret.", "success"); });
    saveRow.appendChild(saveBtn);
    const recBtn = el("button", { class: "btn" }, ["↻ Lagre + rett alle"]);
    recBtn.addEventListener("click", async () => { await saveAnswerKey(); await recalcAll(); });
    saveRow.appendChild(recBtn);
    intro.appendChild(saveRow);
    pane.appendChild(intro);

    // ---- Schema fasit (same UI as the player page) ----
    const layout = el("div", { class: "layout" }, []);
    const L = el("div", { class: "col-left" }, []);
    const M = el("div", { class: "col-mid" }, []);
    const R = el("div", { class: "col-right" }, []);
    layout.appendChild(L); layout.appendChild(M); layout.appendChild(R);
    pane.appendChild(layout);

    const store = {
      getMatch: (id) => answerKey.matches[id],
      setMatch: (id, h, a) => { if (h === "" && a === "") delete answerKey.matches[id]; else answerKey.matches[id] = { h, a }; },
      getWinner: (mid) => answerKey.bracketWinners[mid] || "",
      setWinner: (mid, team) => { if (!team) delete answerKey.bracketWinners[mid]; else answerKey.bracketWinners[mid] = team; },
      setRounds: (map) => { answerKey.knockout = map; }
    };
    SchemaForm.mount({ cfg, store, left: L, mid: M, right: R });
  }

  /* ====================================================================
   *  TAB: Fasit – Bonusspørsmål  (separate tab, same UI as bonus.html)
   * ==================================================================*/
  function renderFasitBonus() {
    const pane = document.getElementById("tab-fasitbonus");
    pane.innerHTML = "";

    const intro = el("div", { class: "card" }, []);
    intro.appendChild(el("h2", {}, ["Fasit – Bonusspørsmål"]));
    intro.appendChild(el("p", { class: "sub" }, [
      "Fyll inn fasiten for bonusspørsmålene. Bruker samme visning som deltakernes side. " +
      "Trykk «Lagre fasit» og deretter «Rett alle» for å oppdatere alles poeng."
    ]));
    const saveRow = el("div", { class: "btn-row" }, []);
    const saveBtn = el("button", { class: "btn btn-primary" }, ["💾 Lagre fasit"]);
    saveBtn.addEventListener("click", async () => { await saveAnswerKey(); App.toast("Fasit lagret.", "success"); });
    saveRow.appendChild(saveBtn);
    const recBtn = el("button", { class: "btn" }, ["↻ Lagre + rett alle"]);
    recBtn.addEventListener("click", async () => { await saveAnswerKey(); await recalcAll(); });
    saveRow.appendChild(recBtn);
    intro.appendChild(saveRow);
    pane.appendChild(intro);

    const content = el("div", {}, []);
    pane.appendChild(content);
    BonusForm.render(content, {
      cfg,
      get: (id) => answerKey.bonus[id],
      set: (id, v) => { if (v) answerKey.bonus[id] = v; else delete answerKey.bonus[id]; },
      showPoints: false
    });
  }

  /* ====================================================================
   *  TAB: Bonusspørsmål (config editor with drag-reorder)
   * ==================================================================*/
  let dragIdx = null;
  function renderBonusCfg() {
    const pane = document.getElementById("tab-bonuscfg");
    pane.innerHTML = "";
    const card = el("div", { class: "card" }, []);
    card.appendChild(el("h2", {}, ["Rediger bonusspørsmål"]));
    card.appendChild(el("p", { class: "sub" }, ["Dra i ⠿ for å endre rekkefølge. Endre tekst, type, poeng. Husk å lagre."]));

    const list = el("div", { id: "qlist" }, []);
    cfg.bonus.questions.forEach((q, idx) => list.appendChild(renderQRow(q, idx)));
    card.appendChild(list);

    const addRow = el("div", { class: "btn-row", style: "margin-top:1rem" }, []);
    const add = el("button", { class: "btn" }, ["+ Nytt spørsmål"]);
    add.addEventListener("click", () => {
      cfg.bonus.questions.push({
        id: "q" + Date.now().toString(36), section: (cfg.bonus.sections && cfg.bonus.sections[0]) || "Annet",
        type: "text", points: 5, text: "Nytt spørsmål", options: ["A", "B"]
      });
      renderBonusCfg();
    });
    addRow.appendChild(add);
    const save = el("button", { class: "btn btn-primary" }, ["💾 Lagre bonusspørsmål"]);
    save.addEventListener("click", saveConfig);
    addRow.appendChild(save);
    card.appendChild(addRow);
    pane.appendChild(card);
  }

  function renderQRow(q, idx) {
    const row = el("div", { class: "cfg-q", draggable: "true" }, []);
    row.dataset.idx = idx;
    row.appendChild(el("span", { class: "handle", title: "Dra for å flytte" }, ["⠿"]));

    const mid = el("div", {}, []);
    const secIn = el("input", { type: "text", value: q.section || "", placeholder: "Seksjon" }, []);
    secIn.style.marginBottom = ".3rem";
    secIn.addEventListener("input", () => { q.section = secIn.value; });
    const txtIn = el("input", { type: "text", value: q.text || "", placeholder: "Spørsmål" }, []);
    txtIn.addEventListener("input", () => { q.text = txtIn.value; });
    mid.appendChild(secIn); mid.appendChild(txtIn);
    if (q.type === "duel") {
      const optIn = el("input", { type: "text", value: (q.options || []).join(" | "), placeholder: "Valg delt med |" }, []);
      optIn.style.marginTop = ".3rem";
      optIn.addEventListener("input", () => { q.options = optIn.value.split("|").map((s) => s.trim()).filter(Boolean); });
      mid.appendChild(optIn);
    }
    row.appendChild(mid);

    const typeSel = el("select", {}, []);
    [["text", "Fritekst"], ["duel", "Duell"], ["yesno", "Ja/Nei"], ["player", "Spiller (søk)"], ["country", "Land (søk)"]].forEach(([v, l]) => typeSel.appendChild(new Option(l, v)));
    typeSel.value = q.type;
    typeSel.addEventListener("change", () => { q.type = typeSel.value; if (q.type === "duel" && !q.options) q.options = ["A", "B"]; renderBonusCfg(); });
    row.appendChild(typeSel);

    const pts = el("input", { type: "number", min: "0", class: "pts-in", value: q.points }, []);
    pts.addEventListener("input", () => { q.points = +pts.value || 0; });
    row.appendChild(pts);

    const del = el("button", { class: "btn btn-sm btn-danger" }, ["✕"]);
    del.addEventListener("click", () => { cfg.bonus.questions.splice(idx, 1); renderBonusCfg(); });
    row.appendChild(del);

    // drag handlers
    row.addEventListener("dragstart", () => { dragIdx = idx; row.classList.add("dragging"); });
    row.addEventListener("dragend", () => { dragIdx = null; row.classList.remove("dragging"); document.querySelectorAll(".cfg-q").forEach((r) => r.classList.remove("dragover")); });
    row.addEventListener("dragover", (e) => { e.preventDefault(); row.classList.add("dragover"); });
    row.addEventListener("dragleave", () => row.classList.remove("dragover"));
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      if (dragIdx == null || dragIdx === idx) return;
      const arr = cfg.bonus.questions;
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(idx, 0, moved);
      renderBonusCfg();
    });
    return row;
  }

  /* ====================================================================
   *  TAB: Oppsett (season, scoring, teams, CSV)
   * ==================================================================*/
  function renderSetup() {
    const pane = document.getElementById("tab-setup");
    pane.innerHTML = "";

    // --- general ---
    const gen = el("div", { class: "card" }, []);
    gen.appendChild(el("h2", {}, ["Generelt"]));
    const seasonIn = field(gen, "Sesong / år", cfg.season, (v) => cfg.season = v);
    field(gen, "Tittel (tippeskjema)", cfg.title, (v) => cfg.title = v);
    field(gen, "Bonus-frist", cfg.bonus.deadline || "", (v) => cfg.bonus.deadline = v);
    pane.appendChild(gen);

    // --- scoring ---
    const sc = el("div", { class: "card" }, []);
    sc.appendChild(el("h2", {}, ["Poeng"]));
    numField(sc, "Riktig utfall (H/U/B) i gruppespill", cfg.scoring.groupOutcome, (v) => cfg.scoring.groupOutcome = v);
    numField(sc, "Helt riktig resultat (eksakt)", cfg.scoring.groupExact, (v) => cfg.scoring.groupExact = v);
    sc.appendChild(el("h3", { style: "margin-top:1rem" }, ["Sluttspill-runder"]));
    (cfg.knockoutRounds || []).forEach((r) => {
      const row = el("div", { class: "btn-row", style: "margin-bottom:.4rem;align-items:center" }, []);
      const nm = el("input", { type: "text", value: r.name, style: "flex:1" }, []);
      nm.addEventListener("input", () => r.name = nm.value);
      const cnt = el("input", { type: "number", min: "1", class: "pts-in", value: r.count, title: "Antall lag" }, []);
      cnt.addEventListener("input", () => r.count = +cnt.value || 1);
      const pt = el("input", { type: "number", min: "0", class: "pts-in", value: r.points, title: "Poeng pr lag" }, []);
      pt.addEventListener("input", () => r.points = +pt.value || 0);
      row.appendChild(nm);
      row.appendChild(el("span", { class: "muted" }, ["lag:"])); row.appendChild(cnt);
      row.appendChild(el("span", { class: "muted" }, ["poeng:"])); row.appendChild(pt);
      sc.appendChild(row);
    });
    pane.appendChild(sc);

    // --- teams ---
    const tc = el("div", { class: "card" }, []);
    tc.appendChild(el("h2", {}, ["Lag og flagg"]));
    tc.appendChild(el("p", { class: "sub" }, ["Flaggkode er en ISO-landkode (no, se, br, gb-eng …). Se flagcdn.com."]));
    const tarea = el("textarea", { rows: "8", style: "width:100%;font-family:monospace", id: "teams-area" }, []);
    tarea.value = cfg.teams.map((t) => `${t.name},${t.code}`).join("\n");
    tc.appendChild(tarea);
    const tbtn = el("button", { class: "btn", style: "margin-top:.5rem" }, ["Oppdater lagliste fra tekst over"]);
    tbtn.addEventListener("click", () => {
      cfg.teams = tarea.value.split("\n").map((l) => l.split(",")).filter((p) => p[0])
        .map((p) => ({ name: (p[0] || "").trim(), code: (p[1] || "").trim().toLowerCase() }));
      App.toast("Lagliste oppdatert (husk lagre).", "success");
    });
    tc.appendChild(tbtn);
    pane.appendChild(tc);

    // --- players (for searchable "spiller" questions) ---
    const pc = el("div", { class: "card" }, []);
    pc.appendChild(el("h2", {}, ["Spillere (søkeliste)"]));
    pc.appendChild(el("p", { class: "sub" }, [`Brukes i søkefeltet for spiller-spørsmål (toppscorer osv.). Én spiller per linje: «Navn, Land» (land er valgfritt). Nå: ${(cfg.players || []).length} spillere.`]));
    const parea = el("textarea", { rows: "10", style: "width:100%;font-family:monospace", id: "players-area" }, []);
    parea.value = (cfg.players || []).map((p) => (p.team ? `${p.name}, ${p.team}` : p.name)).join("\n");
    pc.appendChild(parea);
    const pbtn = el("button", { class: "btn", style: "margin-top:.5rem" }, ["Oppdater spillerliste fra tekst over"]);
    pbtn.addEventListener("click", () => {
      cfg.players = parea.value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
        const i = l.indexOf(",");
        return i < 0 ? { name: l, team: "" } : { name: l.slice(0, i).trim(), team: l.slice(i + 1).trim() };
      });
      App.toast(`Spillerliste oppdatert: ${cfg.players.length} spillere (husk lagre).`, "success");
    });
    pc.appendChild(pbtn);

    // --- auto-fetch from API-Football (admin only, throttled, saved to DB) ---
    if (window.API_FOOTBALL_KEY && window.ApiFootball) {
      const apiBox = el("div", { style: "margin-top:1.2rem;padding-top:1rem;border-top:1px solid var(--line,#ddd)" }, []);
      apiBox.appendChild(el("p", { class: "sub", style: "margin-bottom:.4rem" }, [
        "Hent alle spillertropper for lagene i konfigurasjonen automatisk fra API-Football. " +
        "Listen lagres i databasen og overskriver den manuelt redigerte listen over."
      ]));
      apiBox.appendChild(el("p", { style: "color:#b45309;font-weight:700;margin:.2rem 0 .6rem;font-size:.92rem" }, [
        "⚠ Gratis-API-et tillater bare 100 kall/dag (10/min). Henting tar ~5 minutter. " +
        "Ikke trykk mer enn nødvendig — hold fanen åpen til det er ferdig."
      ]));
      const apiStatus = el("p", { class: "muted", style: "margin:.4rem 0;min-height:1.2em" }, []);
      const apiBtn = el("button", { class: "btn" }, ["⚽ Hent spillere fra API-Football"]);
      apiBtn.addEventListener("click", async () => {
        if (!confirm(
          "Henter tropper for alle " + (cfg.teams || []).length + " lag fra API-Football.\n" +
          "Dette bruker ~" + (cfg.teams || []).length + " av dagens 100 API-kall og tar noen minutter.\n\n" +
          "Ikke gjør dette flere ganger samme dag. Fortsette?"
        )) return;
        apiBtn.disabled = true;
        const origLabel = apiBtn.textContent;
        apiBtn.textContent = "Henter … (ikke lukk siden)";
        const setStatus = (t) => { apiStatus.textContent = t; };
        try {
          const { players, teamCount, skipped } = await window.ApiFootball.fetchAllPlayers(cfg.teams || [], setStatus);
          cfg.players = players;
          setStatus("Lagrer " + players.length + " spillere i databasen …");
          await DB.saveConfig(cfg);
          const skipMsg = skipped ? ` (${skipped} lag uten treff)` : "";
          App.toast("Hentet " + players.length + " spillere fra " + teamCount + " lag og lagret." + skipMsg, "success");
          renderSetup();
        } catch (err) {
          setStatus("");
          App.toast("Feil ved henting: " + (err && err.message ? err.message : err), "error");
          apiBtn.disabled = false;
          apiBtn.textContent = origLabel;
        }
      });
      apiBox.appendChild(apiBtn);
      apiBox.appendChild(apiStatus);
      pc.appendChild(apiBox);
    }

    pane.appendChild(pc);

    // --- CSV schedule ---
    const csv = el("div", { class: "card" }, []);
    csv.appendChild(el("h2", {}, ["Kampoppsett (CSV)"]));
    csv.appendChild(el("p", { class: "sub" }, ["Last opp kampprogrammet for et nytt år. Kolonner: nr,dag,dato,tid,gruppe,hjemme,borte (med overskriftsrad). Grupper bygges automatisk fra kolonnen «gruppe»."]));
    const dl = el("button", { class: "btn" }, ["⬇ Last ned dagens oppsett som mal (CSV)"]);
    dl.addEventListener("click", downloadMatchesCsv);
    csv.appendChild(dl);
    const fileWrap = el("div", { style: "margin-top:.8rem" }, []);
    const file = el("input", { type: "file", accept: ".csv,text/csv" }, []);
    file.addEventListener("change", (e) => handleCsvUpload(e.target.files[0]));
    fileWrap.appendChild(file);
    csv.appendChild(fileWrap);
    pane.appendChild(csv);

    // --- save / reset ---
    const act = el("div", { class: "card" }, []);
    act.appendChild(el("h2", {}, ["Lagre / tilbakestill"]));
    const row = el("div", { class: "btn-row" }, []);
    const save = el("button", { class: "btn btn-primary" }, ["💾 Lagre all konfigurasjon"]);
    save.addEventListener("click", async () => { await saveConfig(); renderAll(); });
    row.appendChild(save);
    const reset = el("button", { class: "btn btn-danger" }, ["⟲ Tilbakestill til 2026-standard"]);
    reset.addEventListener("click", async () => {
      if (confirm("Dette erstatter all konfigurasjon med standardoppsettet for 2026. Fortsette?")) {
        cfg = JSON.parse(JSON.stringify(window.DEFAULT_CONFIG));
        await saveConfig(); renderAll();
        App.toast("Tilbakestilt til 2026-standard.", "success");
      }
    });
    row.appendChild(reset);
    act.appendChild(row);
    pane.appendChild(act);
  }

  /* ---- small field helpers ---- */
  function field(parent, label, value, onInput) {
    const w = el("div", { style: "margin-bottom:.7rem" }, []);
    w.appendChild(el("label", { style: "display:block;font-weight:700;margin-bottom:.2rem" }, [label]));
    const inp = el("input", { type: "text", value: value || "", style: "width:100%" }, []);
    inp.addEventListener("input", () => onInput(inp.value));
    w.appendChild(inp); parent.appendChild(w); return inp;
  }
  function numField(parent, label, value, onInput) {
    const w = el("div", { class: "btn-row", style: "margin-bottom:.5rem;align-items:center" }, []);
    w.appendChild(el("label", { style: "flex:1;font-weight:600" }, [label]));
    const inp = el("input", { type: "number", min: "0", class: "pts-in", value: value }, []);
    inp.addEventListener("input", () => onInput(+inp.value || 0));
    w.appendChild(inp); parent.appendChild(w); return inp;
  }

  /* ---- CSV helpers ---- */
  function downloadMatchesCsv() {
    const lines = ["nr,dag,dato,tid,gruppe,hjemme,borte"];
    cfg.matches.forEach((m) => lines.push([m.id, m.day, m.date, m.time, m.group, m.home, m.away]
      .map(csvCell).join(",")));
    const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kampoppsett-${cfg.season || ""}.csv`;
    a.click();
  }
  function csvCell(v) {
    v = String(v == null ? "" : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function parseCsv(text) {
    // simple RFC-ish parser handling quotes
    const rows = []; let row = [], cur = "", q = false;
    text = text.replace(/^﻿/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += c;
      } else {
        if (c === '"') q = true;
        else if (c === ",") { row.push(cur); cur = ""; }
        else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
        else if (c === "\r") { /* skip */ }
        else cur += c;
      }
    }
    if (cur !== "" || row.length) { row.push(cur); rows.push(row); }
    return rows.filter((r) => r.some((c) => c.trim() !== ""));
  }
  function handleCsvUpload(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(reader.result);
        const header = rows[0].map((h) => h.trim().toLowerCase());
        const idx = (n) => header.indexOf(n);
        const need = ["dag", "dato", "tid", "gruppe", "hjemme", "borte"];
        if (need.some((n) => idx(n) < 0)) {
          App.toast("CSV mangler kolonner. Bruk malen (last ned over).", "error"); return;
        }
        const matches = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          const home = (r[idx("hjemme")] || "").trim();
          const away = (r[idx("borte")] || "").trim();
          if (!home || !away) continue;
          matches.push({
            id: idx("nr") >= 0 && r[idx("nr")] ? +r[idx("nr")] : matches.length + 1,
            day: (r[idx("dag")] || "").trim(),
            date: (r[idx("dato")] || "").trim(),
            time: (r[idx("tid")] || "").trim(),
            group: (r[idx("gruppe")] || "").trim().toUpperCase(),
            home, away
          });
        }
        // rebuild groups from the gruppe column
        const groups = {};
        matches.forEach((m) => {
          groups[m.group] = groups[m.group] || [];
          [m.home, m.away].forEach((t) => { if (!groups[m.group].includes(t)) groups[m.group].push(t); });
        });
        cfg.matches = matches;
        cfg.groups = groups;
        // add any unknown teams (no flag code yet) so they still show up
        const known = new Set(cfg.teams.map((t) => t.name));
        matches.forEach((m) => [m.home, m.away].forEach((t) => {
          if (!known.has(t)) { cfg.teams.push({ name: t, code: "" }); known.add(t); }
        }));
        App.toast(`Lastet ${matches.length} kamper. Sjekk flaggkoder under «Lag og flagg», så lagre.`, "success");
        renderSetup();
      } catch (err) {
        App.toast("Klarte ikke å lese CSV: " + err.message, "error");
      }
    };
    reader.readAsText(file, "utf-8");
  }

  /* ---- modal ---- */
  function showModal(title, bodyNode, footButtons) {
    const host = document.getElementById("modal-host");
    host.innerHTML = "";
    const backdrop = el("div", { class: "modal-backdrop" }, []);
    backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
    const modal = el("div", { class: "modal" }, []);
    const head = el("div", { class: "modal-head" }, [el("h3", {}, [title])]);
    const x = el("button", { class: "btn btn-sm btn-ghost" }, ["✕"]);
    x.addEventListener("click", closeModal);
    head.appendChild(x);
    const bodyWrap = el("div", { class: "modal-body" }, [bodyNode]);
    const foot = el("div", { class: "modal-foot" }, footButtons || []);
    modal.appendChild(head); modal.appendChild(bodyWrap); modal.appendChild(foot);
    backdrop.appendChild(modal); host.appendChild(backdrop);
  }
  function closeModal() { document.getElementById("modal-host").innerHTML = ""; }
})();
