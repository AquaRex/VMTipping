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
    // Apply any custom alias overrides stored in cfg on top of the built-in map
    if (cfg.teamAliases && window.TEAM_ALIASES) Object.assign(window.TEAM_ALIASES, cfg.teamAliases);
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

    const grupper = [...new Set(entries.map(e => e.gruppe || "").filter(Boolean))].sort();
    let activeGruppe = "";

    const btnRow = el("div", { class: "btn-row", style: "margin-bottom:1rem" }, []);
    const recalc = el("button", { class: "btn btn-primary" }, ["↻ Rett alle automatisk mot fasit"]);
    recalc.addEventListener("click", recalcAll);
    btnRow.appendChild(recalc);
    const refresh = el("button", { class: "btn" }, ["⟳ Hent på nytt"]);
    refresh.addEventListener("click", reloadEntries);
    btnRow.appendChild(refresh);
    if (grupper.length) {
      const spacer = el("span", { style: "flex:1" }, []);
      btnRow.appendChild(spacer);
      btnRow.appendChild(el("label", { for: "gruppe-filter", style: "color:var(--muted);font-size:.85rem" }, ["Gruppe:"]));
      const sel = el("select", { id: "gruppe-filter", class: "btn-select" }, []);
      sel.appendChild(new Option("Alle grupper", ""));
      grupper.forEach(g => sel.appendChild(new Option(g, g)));
      sel.addEventListener("change", () => { activeGruppe = sel.value; renderTable(); });
      btnRow.appendChild(sel);
    }
    card.appendChild(btnRow);

    if (!entries.length) {
      card.appendChild(el("p", { class: "muted" }, ["Ingen skjema er publisert ennå."]));
      pane.appendChild(card);
      return;
    }

    const tblWrap = el("div", {}, []);
    card.appendChild(tblWrap);

    function renderTable() {
      tblWrap.innerHTML = "";
      const filtered = entries
        .filter(e => !activeGruppe || (e.gruppe || "") === activeGruppe)
        .slice().sort((a, b) => (b.total || 0) - (a.total || 0));
      const showGruppe = !activeGruppe && grupper.length > 0;
      const tbl = el("table", { class: "tbl" }, []);
      tbl.innerHTML = `<thead><tr><th>#</th><th>Navn</th>${showGruppe ? "<th>Gruppe</th>" : ""}<th>Poeng</th><th></th></tr></thead>`;
      const tb = el("tbody", {}, []);
      filtered.forEach((en, i) => {
        const tr = el("tr", {}, []);
        tr.innerHTML = `<td class="rank">${i + 1}</td><td>${App.escape(en.name)}</td>${showGruppe ? `<td class="muted">${App.escape(en.gruppe || "—")}</td>` : ""}<td><b>${en.total || 0}</b></td>`;
        const td = el("td", {}, []);
        const b = el("button", { class: "btn btn-sm" }, ["Åpne / rett"]);
        b.addEventListener("click", () => openEntry(en.id));
        td.appendChild(b); tr.appendChild(td);
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      tblWrap.appendChild(tbl);
    }
    renderTable();
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
    card.appendChild(el("p", { class: "sub" }, ["Rediger gruppe direkte i tabellen og trykk Enter eller klikk bort for å lagre. Klikk «Rett» for å se og rette svarene."]));
    if (!entries.length) {
      card.appendChild(el("p", { class: "muted" }, ["Ingen skjema er publisert ennå."]));
    } else {
      const tbl = el("table", { class: "tbl" }, []);
      tbl.innerHTML = "<thead><tr><th>Navn</th><th>Gruppe</th><th>Poeng</th><th>Publisert</th><th></th></tr></thead>";
      const tb = el("tbody", {}, []);
      entries.forEach((en) => {
        const tr = el("tr", {}, []);
        const when = en.created_at ? new Date(en.created_at).toLocaleString("no-NO") : "";

        // name cell
        const nameTd = el("td", {}, []);
        nameTd.textContent = en.name;
        tr.appendChild(nameTd);

        // gruppe editable cell
        const grpTd = el("td", {}, []);
        const grpIn = el("input", {
          type: "text", value: en.gruppe || "",
          placeholder: "Ingen gruppe",
          style: "width:100%;background:transparent;border:1px solid transparent;border-radius:4px;padding:.2rem .3rem;color:inherit"
        }, []);
        grpIn.addEventListener("focus", () => grpIn.style.borderColor = "var(--accent)");
        const saveGruppe = async () => {
          grpIn.style.borderColor = "transparent";
          const val = grpIn.value.trim();
          if (val === (en.gruppe || "")) return;
          en.gruppe = val;
          await DB.updateEntry(en.id, { gruppe: val });
          renderBoard(); // refresh board filter chips
          App.toast(`Gruppe for ${en.name} oppdatert.`, "success");
        };
        grpIn.addEventListener("blur", saveGruppe);
        grpIn.addEventListener("keydown", (e) => { if (e.key === "Enter") grpIn.blur(); });
        grpTd.appendChild(grpIn);
        tr.appendChild(grpTd);

        const ptsTd = el("td", {}, [el("b", {}, [String(en.total || 0)])]);
        tr.appendChild(ptsTd);
        const whenTd = el("td", { class: "muted" }, [when]);
        tr.appendChild(whenTd);

        const td = el("td", {}, []);
        const view = el("button", { class: "btn btn-sm" }, ["Vis skjema"]);
        view.addEventListener("click", () => viewEntry(en.id));
        const open = el("button", { class: "btn btn-sm", style: "margin-left:.4rem" }, ["Rett"]);
        open.addEventListener("click", () => openEntry(en.id));
        const del = el("button", { class: "btn btn-sm btn-danger", style: "margin-left:.4rem" }, ["Slett"]);
        del.addEventListener("click", async () => {
          if (confirm(`Slette skjemaet til ${en.name}?`)) {
            await DB.deleteEntry(en.id); App.toast("Slettet.", "success"); reloadEntries();
          }
        });
        td.appendChild(view); td.appendChild(open); td.appendChild(del); tr.appendChild(td);
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
  /* ====================================================================
   *  TAB: Fasit — sub-tabs: Tippeskjema | Bonusspørsmål
   * ==================================================================*/
  function renderFasit() {
    const pane = document.getElementById("tab-fasit");
    pane.innerHTML = "";

    // ---- header + save buttons ----
    const intro = el("div", { class: "card" }, []);
    intro.appendChild(el("h2", {}, ["Fasit"]));
    intro.appendChild(el("p", { class: "sub" }, ["Fyll inn offisielle resultater. Trykk «Lagre fasit» og deretter «Rett alle» for å oppdatere poengsummer."]));
    const saveRow = el("div", { class: "btn-row" }, []);
    const saveBtn = el("button", { class: "btn btn-primary" }, ["💾 Lagre fasit"]);
    saveBtn.addEventListener("click", async () => { await saveAnswerKey(); App.toast("Fasit lagret.", "success"); });
    saveRow.appendChild(saveBtn);
    const recBtn = el("button", { class: "btn" }, ["↻ Lagre + rett alle"]);
    recBtn.addEventListener("click", async () => { await saveAnswerKey(); await recalcAll(); });
    saveRow.appendChild(recBtn);
    const resetBtn = el("button", { class: "btn btn-ghost" }, ["Nullstill fasit"]);
    resetBtn.addEventListener("click", () => {
      if (!confirm("Nullstille hele fasiten? Dette kan ikke angres.")) return;
      answerKey.matches = {}; answerKey.bracketWinners = {}; answerKey.knockout = {}; answerKey.bonus = {};
      renderFasit();
      App.toast("Fasit nullstilt.", "success");
    });
    saveRow.appendChild(resetBtn);
    intro.appendChild(saveRow);
    pane.appendChild(intro);

    // ---- inner sub-tabs ----
    const subNav = el("div", { class: "nav-links", style: "margin-bottom:1rem" }, []);
    const tabSchema  = el("a", { href: "#", class: "active" }, ["📋 Tippeskjema"]);
    const tabBonus   = el("a", { href: "#" }, ["🎯 Bonusspørsmål"]);
    subNav.appendChild(tabSchema);
    subNav.appendChild(tabBonus);
    pane.appendChild(subNav);

    const panSchema = el("div", {}, []);
    const panBonus  = el("div", { class: "hidden" }, []);
    pane.appendChild(panSchema);
    pane.appendChild(panBonus);

    function switchSub(which) {
      tabSchema.classList.toggle("active", which === "schema");
      tabBonus.classList.toggle("active",  which === "bonus");
      panSchema.classList.toggle("hidden", which !== "schema");
      panBonus.classList.toggle("hidden",  which !== "bonus");
    }
    tabSchema.addEventListener("click", (e) => { e.preventDefault(); switchSub("schema"); });
    tabBonus.addEventListener("click",  (e) => { e.preventDefault(); switchSub("bonus"); });

    // ---- Tippeskjema panel ----
    const csvZone = el("div", {}, []);
    panSchema.appendChild(csvZone);

    const layout = el("div", { class: "layout" }, []);
    const L = el("div", { class: "col-left" }, []);
    const M = el("div", { class: "col-mid" }, []);
    const R = el("div", { class: "col-right" }, []);
    layout.appendChild(L); layout.appendChild(M); layout.appendChild(R);
    panSchema.appendChild(layout);

    const store = {
      getMatch: (id) => answerKey.matches[id],
      setMatch: (id, h, a) => { if (h === "" && a === "") delete answerKey.matches[id]; else answerKey.matches[id] = { h: +h, a: +a }; },
      getWinner: (mid) => answerKey.bracketWinners[mid] || "",
      setWinner: (mid, team) => { if (!team) delete answerKey.bracketWinners[mid]; else answerKey.bracketWinners[mid] = team; },
      setRounds: (map) => { answerKey.knockout = map; }
    };
    const form = SchemaForm.mount({ cfg, store, left: L, mid: M, right: R });

    CsvImport.buildDropZone(csvZone, cfg, (matchScores, bracketWinners) => {
      Object.entries(matchScores).forEach(([id, { h, a }]) => store.setMatch(+id, String(h), String(a)));
      Object.entries(bracketWinners).forEach(([mid, team]) => store.setWinner(+mid, team));
      form.reloadInputs();
      form.refresh();
    });

    // ---- Bonusspørsmål panel (constrained width like bonus.html) ----
    const bonusWrap = el("div", { class: "wrap", style: "padding-top:0" }, []);
    panBonus.appendChild(bonusWrap);
    BonusForm.render(bonusWrap, {
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
    const row = el("div", { class: "cfg-q" }, []);
    row.dataset.idx = idx;
    const handle = el("span", { class: "handle", title: "Dra for å flytte", draggable: "true" }, ["⠿"]);
    row.appendChild(handle);

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
    } else if (q.type === "custom" || q.type === "customselect" || q.type === "custombuttons") {
      const optIn = el("input", { type: "text", value: (q.options || []).join(", "), placeholder: "Alternativer delt med komma, f.eks. valgA, valgB, …" }, []);
      optIn.style.marginTop = ".3rem";
      optIn.addEventListener("input", () => { q.options = optIn.value.split(",").map((s) => s.trim()).filter(Boolean); });
      mid.appendChild(optIn);
    }
    row.appendChild(mid);

    const typeSel = el("select", {}, []);
    [["text", "Fritekst"], ["duel", "Duell"], ["yesno", "Ja/Nei"], ["player", "Spiller (søk)"], ["country", "Land (søk)"], ["match", "Kamp"], ["custom", "Egendefinert (søk)"], ["customselect", "Egendefinert"], ["custombuttons", "Egendefinert (knapper)"]].forEach(([v, l]) => typeSel.appendChild(new Option(l, v)));
    typeSel.value = q.type;
    typeSel.addEventListener("change", () => { q.type = typeSel.value; if (q.type === "duel" && !q.options) q.options = ["A", "B"]; if (["custom", "customselect", "custombuttons"].includes(q.type) && !q.options) q.options = []; renderBonusCfg(); });
    row.appendChild(typeSel);

    const pts = el("input", { type: "number", min: "0", class: "pts-in", value: q.points }, []);
    pts.addEventListener("input", () => { q.points = +pts.value || 0; });
    row.appendChild(pts);

    const del = el("button", { class: "btn btn-sm btn-danger" }, ["✕"]);
    del.addEventListener("click", () => { cfg.bonus.questions.splice(idx, 1); renderBonusCfg(); });
    row.appendChild(del);

    // drag initiated only from handle; row is just a drop target
    handle.addEventListener("dragstart", () => { dragIdx = idx; row.classList.add("dragging"); });
    handle.addEventListener("dragend", () => { dragIdx = null; row.classList.remove("dragging"); document.querySelectorAll(".cfg-q").forEach((r) => r.classList.remove("dragover")); });
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
   * buildBracket(firstRoundIds, opts)
   *
   * Generates a knockoutBracket + knockoutRounds from an ordered list of
   * first-round match IDs. Subsequent-round match IDs are generated by
   * continuing from max(firstRoundIds)+1.
   *
   * firstRoundIds  — array of match IDs for the first knockout round,
   *                  ordered left-to-right as they should appear in the bracket.
   *                  Must be a power-of-two length (4, 8, 16 …).
   * opts.roundNames — optional {4:"Kvartfinale",2:"Semifinale",1:"Finale"}
   * opts.roundPoints— optional {16:3,8:5,4:7,2:10,1:15}
   * ================================================================== */
  function buildBracket(firstRoundIds, opts) {
    opts = opts || {};
    // Key = number of matches in the round
    const defaultNames = {
      16: "16-delsfinale", 8: "Åttendedelsfinale", 4: "Kvartfinale",
      2: "Semifinale", 1: "Finale"
    };
    // Key = number of teams in the round (roundSize * 2)
    const defaultPts = { 32: 3, 16: 3, 8: 5, 4: 7, 2: 10 };

    let nextId = Math.max(...firstRoundIds) + 1;
    const rounds = [];
    const matches = {};
    const newKnockoutRounds = [];

    let currentIds = firstRoundIds.slice();

    while (currentIds.length >= 1) {
      const roundSize = currentIds.length;
      const name = (opts.roundNames && opts.roundNames[roundSize]) || defaultNames[roundSize] || `Runde ${roundSize}`;
      rounds.push({ key: `r${roundSize * 2}`, name, matchIds: currentIds.slice() });
      newKnockoutRounds.push({
        key: `r${roundSize * 2}`,
        name,
        count: roundSize * 2,
        points: (opts.roundPoints && opts.roundPoints[roundSize]) || defaultPts[roundSize * 2] || 3
      });

      if (currentIds.length === 1) break; // final — stop

      const isFirstRound = rounds.length === 1;
      // opts.seeds[matchId] = { top: "1E", bot: "3. plass A/B/C/D/F" }
      const seedFor = (mid, side) => {
        const s = opts.seeds && opts.seeds[mid] && opts.seeds[mid][side];
        return { seed: s || "" };
      };
      // Build next round IDs
      const nextIds = [];
      for (let i = 0; i < currentIds.length; i += 2) {
        const nid = nextId++;
        nextIds.push(nid);
        // First-round matches use seeds (group stage slots); later rounds use `from` (already set)
        if (isFirstRound) {
          matches[currentIds[i]] = { top: seedFor(currentIds[i], "top"), bot: seedFor(currentIds[i], "bot"), next: nid, nextSlot: "top" };
          matches[currentIds[i + 1]] = { top: seedFor(currentIds[i + 1], "top"), bot: seedFor(currentIds[i + 1], "bot"), next: nid, nextSlot: "bot" };
        } else {
          matches[currentIds[i]].next = nid;
          matches[currentIds[i]].nextSlot = "top";
          matches[currentIds[i + 1]].next = nid;
          matches[currentIds[i + 1]].nextSlot = "bot";
        }
        // Next-round match slots fed by winners
        matches[nid] = { top: { from: currentIds[i] }, bot: { from: currentIds[i + 1] } };
      }
      currentIds = nextIds;
    }

    // The final match has no `next`
    const finalId = currentIds[0];
    if (matches[finalId]) {
      matches[finalId].title = "Finale";
      delete matches[finalId].next;
      delete matches[finalId].nextSlot;
    }

    // Add winner round for scoring (1 team = the champion)
    newKnockoutRounds.push({ key: "winner", name: "Mester", count: 1, points: 15 });

    return {
      knockoutBracket: { rounds, matches },
      knockoutRounds: newKnockoutRounds
    };
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

    // --- knockout bracket seed editor -------------------------------------
    // The CSV import auto-detects the bracket SIZE (rounds) and dates; the exact
    // matchups (who plays whom in the first round) are tournament-design data that
    // are entered/verified here. The seeding engine + third-place solver then fill
    // in the actual teams from the group standings.
    const bc = el("div", { class: "card" }, []);
    bc.appendChild(el("h2", {}, ["Sluttspill — oppsett av kamper"]));

    // --- preset chooser ---
    const presets = window.BRACKET_PRESETS || {};
    if (Object.keys(presets).length) {
      const prow = el("div", { class: "btn-row", style: "margin-bottom:.8rem;align-items:center;gap:.5rem" }, []);
      prow.appendChild(el("span", { class: "muted" }, ["Forhåndsoppsett:"]));
      const sel = el("select", { style: "flex:1;min-width:0" }, [el("option", { value: "" }, ["— velg —"])]);
      Object.keys(presets).forEach((k) => sel.appendChild(el("option", { value: k }, [presets[k].name || k])));
      const applyP = el("button", { class: "btn" }, ["Bruk"]);
      applyP.addEventListener("click", () => {
        const k = sel.value; if (!k) { App.toast("Velg et forhåndsoppsett først.", "info"); return; }
        const p = presets[k];
        const gc = Object.keys(cfg.groups || {}).length;
        const warn = (p.groupCount && gc && p.groupCount !== gc)
          ? `\n\nMerk: dette oppsettet er for ${p.groupCount} grupper, men du har ${gc}. Last opp riktig kampoppsett (CSV) først.`
          : "";
        if (!confirm(`Erstatte sluttspill-bracket og poengrunder med «${p.name || k}»?${warn}`)) return;
        cfg.knockoutBracket = JSON.parse(JSON.stringify(p.knockoutBracket));
        cfg.knockoutRounds = JSON.parse(JSON.stringify(p.knockoutRounds));
        if (p.thirdPlaceColumns) cfg.thirdPlaceColumns = p.thirdPlaceColumns; else delete cfg.thirdPlaceColumns;
        if (p.thirdPlaceTable) cfg.thirdPlaceTable = JSON.parse(JSON.stringify(p.thirdPlaceTable)); else delete cfg.thirdPlaceTable;
        App.toast(`«${p.name || k}» lastet. Husk å lagre.`, "success");
        renderSetup();
      });
      prow.appendChild(sel);
      prow.appendChild(applyP);
      bc.appendChild(prow);
    }

    const gLetters = Object.keys(cfg.groups || {}).sort();
    bc.appendChild(el("p", { class: "sub" }, [
      "Velg et forhåndsoppsett over, eller finjuster hvem som møtes i første sluttspillrunde. Syntaks per plass: " +
      "«1B» = vinner gruppe B · «2C» = toer gruppe C · «3A» = treer gruppe A · " +
      "«3. plass A/D/E/F» = beste treer fra én av disse gruppene (plasseres automatisk av løseren). " +
      "La feltet stå tomt for å fylles fra forrige runde."
    ]));

    const bracketCfg = cfg.knockoutBracket;
    if (bracketCfg && bracketCfg.rounds && bracketCfg.rounds[0]) {
      // datalist of common seed options
      const dlId = "seed-options";
      const dl = el("datalist", { id: dlId }, []);
      gLetters.forEach((g) => {
        ["1" + g, "2" + g, "3" + g].forEach((s) => dl.appendChild(el("option", { value: s }, [])));
      });
      bc.appendChild(dl);

      const seedInput = (mid, side) => {
        const m = bracketCfg.matches[mid];
        const slot = m[side] || (m[side] = {});
        const inp = el("input", {
          type: "text", list: dlId,
          value: slot.seed != null ? slot.seed : "",
          placeholder: slot.from != null ? "← vinner kamp " + slot.from : "tom",
          style: "flex:1;min-width:0"
        }, []);
        if (slot.from != null) { inp.disabled = true; }
        inp.addEventListener("input", () => {
          const v = inp.value.trim();
          if (v) { delete m[side].from; delete m[side].fromLoser; m[side].seed = v; }
          else { delete m[side].seed; }
        });
        return inp;
      };

      const firstIds = bracketCfg.rounds[0].matchIds;
      firstIds.forEach((mid, i) => {
        const m = bracketCfg.matches[mid] || {};
        const row = el("div", { class: "btn-row", style: "margin-bottom:.45rem;align-items:center;gap:.4rem" }, []);
        const when = (m.date || "") + (m.time ? " " + m.time : "");
        row.appendChild(el("span", { class: "muted", style: "flex:0 0 5.5rem;font-size:.85rem" }, [`Kamp ${i + 1}${when ? " · " + when : ""}`]));
        row.appendChild(seedInput(mid, "top"));
        row.appendChild(el("span", { class: "muted" }, ["mot"]));
        row.appendChild(seedInput(mid, "bot"));
        bc.appendChild(row);
      });

      const hint = el("p", { class: "sub", style: "margin-top:.6rem" }, [
        "Senere runder fylles automatisk fra vinnerne. Husk å lagre nederst på siden."
      ]);
      bc.appendChild(hint);
    } else {
      bc.appendChild(el("p", { class: "muted" }, ["Ingen sluttspill-bracket er satt opp ennå. Last opp et kampoppsett (CSV) først."]));
    }
    pane.appendChild(bc);

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

    // --- team alias map ---
    const aliasCard = el("div", { class: "card" }, []);
    aliasCard.appendChild(el("h2", {}, ["Lagnavn-oversettelse (CSV-import)"]));
    aliasCard.appendChild(el("p", { class: "sub" }, [
      "Når du importerer en CSV fra excely.com, brukes denne tabellen til å oversette engelske lagnavn til norsk. " +
      "Én regel per linje: «Engelsk = Norsk». Tomme linjer og linjer uten «=» ignoreres."
    ]));
    // Build textarea value from TEAM_ALIASES + any custom overrides in cfg
    const builtinAliases = window.TEAM_ALIASES || {};
    const customAliases = cfg.teamAliases || {};
    const merged = Object.assign({}, builtinAliases, customAliases);
    const sortedKeys = Object.keys(merged).sort((a, b) => a.localeCompare(b));
    // Show only entries that differ from built-in (custom overrides) + all built-in
    const aliasArea = el("textarea", { rows: "12", style: "width:100%;font-family:monospace;font-size:.85rem" }, []);
    aliasArea.value = sortedKeys.map(k => `${k} = ${merged[k]}`).join("\n");
    aliasCard.appendChild(aliasArea);
    const aliasBtnRow = el("div", { class: "btn-row", style: "margin-top:.5rem" }, []);
    const aliasUpdateBtn = el("button", { class: "btn" }, ["Oppdater oversettelsesliste"]);
    const aliasResetBtn = el("button", { class: "btn btn-ghost" }, ["Tilbakestill til standard"]);
    aliasUpdateBtn.addEventListener("click", () => {
      const custom = {};
      aliasArea.value.split("\n").forEach(line => {
        const sep = line.indexOf("=");
        if (sep < 0) return;
        const k = line.slice(0, sep).trim().toLowerCase();
        const v = line.slice(sep + 1).trim();
        if (k && v && builtinAliases[k] !== v) custom[k] = v; // only save deviations from built-in
      });
      // Also capture any keys present in textarea but not in built-in
      aliasArea.value.split("\n").forEach(line => {
        const sep = line.indexOf("=");
        if (sep < 0) return;
        const k = line.slice(0, sep).trim().toLowerCase();
        const v = line.slice(sep + 1).trim();
        if (k && v && !builtinAliases.hasOwnProperty(k)) custom[k] = v;
      });
      cfg.teamAliases = custom;
      // Merge into window.TEAM_ALIASES so import uses it immediately
      Object.assign(window.TEAM_ALIASES, custom);
      App.toast(`Oversettelsesliste oppdatert (${Object.keys(custom).length} egendefinerte oppføringer). Husk å lagre.`, "success");
    });
    aliasResetBtn.addEventListener("click", () => {
      cfg.teamAliases = {};
      aliasArea.value = Object.keys(builtinAliases).sort((a, b) => a.localeCompare(b))
        .map(k => `${k} = ${builtinAliases[k]}`).join("\n");
      Object.assign(window.TEAM_ALIASES, builtinAliases);
      App.toast("Oversettelsesliste tilbakestilt til standard. Husk å lagre.", "info");
    });
    aliasBtnRow.appendChild(aliasUpdateBtn);
    aliasBtnRow.appendChild(aliasResetBtn);
    aliasCard.appendChild(aliasBtnRow);
    pane.appendChild(aliasCard);

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
    const resetBracket = el("button", { class: "btn" }, ["⟲ Tilbakestill sluttspill"]);
    resetBracket.addEventListener("click", async () => {
      if (confirm("Tilbakestiller sluttspill-brackett og poengrunder til 2026-standard (gruppespill-data beholdes). Fortsette?")) {
        const def = window.DEFAULT_CONFIG;
        cfg.knockoutBracket = JSON.parse(JSON.stringify(def.knockoutBracket));
        cfg.knockoutRounds  = JSON.parse(JSON.stringify(def.knockoutRounds));
        await saveConfig(); renderAll();
        App.toast("Sluttspill tilbakestilt til 2026-standard.", "success");
      }
    });
    row.appendChild(resetBracket);
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
    // RFC 4180 parser: newlines inside quoted fields are part of the cell value
    const rows = []; let row = [], cur = "", q = false;
    text = text.replace(/^﻿/, "");
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else if (c !== "\r") cur += c; // keep \n inside quotes as part of value (skip \r)
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
        const hasOurFormat = ["dag", "dato", "tid", "gruppe", "hjemme", "borte"].every((n) => idx(n) >= 0);

        let matches;
        if (hasOurFormat) {
          // Our own template format
          matches = [];
          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            const homeRaw = (r[idx("hjemme")] || "").trim();
            const awayRaw = (r[idx("borte")] || "").trim();
            if (!homeRaw || !awayRaw) continue;
            const home = window.resolveTeamName ? window.resolveTeamName(homeRaw, cfg.teams) : homeRaw;
            const away = window.resolveTeamName ? window.resolveTeamName(awayRaw, cfg.teams) : awayRaw;
            matches.push({
              id: idx("nr") >= 0 && r[idx("nr")] ? +r[idx("nr")] : matches.length + 1,
              day: (r[idx("dag")] || "").trim(),
              date: (r[idx("dato")] || "").trim(),
              time: (r[idx("tid")] || "").trim(),
              group: (r[idx("gruppe")] || "").trim().toUpperCase(),
              home, away
            });
          }
        } else {
          // excely.com tournament schedule format:
          // col[0]=nr, col[1]=day, col[2]=date, col[3]=time, col[4]=home, col[7]=away
          // Standings tables sit to the right: header "Gruppe X" at col[8],
          // then team rows below with team name at col[8].
          matches = [];

          // First pass: build team→group map from standings tables.
          // Scan cols 8–14 on every row for a "Group X" / "Gruppe X" header.
          // The team names appear in the same column on the rows that follow.
          const teamGroup = {};
          const grpRe = /^(?:gruppe|group)\s+([A-Z0-9]+)$/i;
          const skipRe = /^(pl|s|v|t|u|mål|p|pnt|draw|w|l|gf|ga|\d+\s*-\s*\d+)/i;

          // Detect which column the standings table uses (the one with "Group X" / "Gruppe X")
          let standingsCol = -1;
          for (const row of rows) {
            for (let c = 8; c <= 16; c++) {
              if (grpRe.test((row[c] || "").trim())) { standingsCol = c; break; }
            }
            if (standingsCol >= 0) break;
          }
          if (standingsCol < 0) standingsCol = 8; // fallback

          let lastGroup = "";
          for (const row of rows) {
            const cell = (row[standingsCol] || "").trim();
            const grpMatch = grpRe.exec(cell);
            // A standings-table HEADER row has a stats column ("S" or "PL") right
            // after the label. A real group header ("Group A") matches grpRe; any
            // OTHER header (e.g. "3rd places") is a non-group section — stop assigning
            // teams to a group, otherwise those teams pollute the last real group (L).
            const nextCell = (row[standingsCol + 1] || "").trim();
            const isHeaderRow = /^(s|pl|mp|played)$/i.test(nextCell);
            if (grpMatch) {
              lastGroup = grpMatch[1].toUpperCase();
            } else if (isHeaderRow) {
              lastGroup = ""; // non-group section (e.g. "3rd places") — stop here
            } else if (lastGroup && cell && isNaN(+cell) && !skipRe.test(cell) && !/^\d+\s*-\s*\d+$/.test(cell)) {
              // Strip leading rank/symbol characters (①, ?, ⁹ etc.)
              const clean = cell.replace(/^[^a-zA-ZÀ-ÖØ-öø-ÿ]+/, "").trim();
              if (clean) {
                const resolved = window.resolveTeamName ? window.resolveTeamName(clean, cfg.teams) : clean;
                teamGroup[clean.toLowerCase()] = lastGroup;
                // Also index by the resolved (Norwegian) name so lookups work either way
                if (resolved !== clean) teamGroup[resolved.toLowerCase()] = lastGroup;
              }
            }
          }

          // Second pass: parse match rows — col[0] is a plain integer (match number)
          const formatDate = (raw) => {
            // "Jun 14, 2026" → "14. jun"
            raw = raw.replace(/^"(.*)"$/, "$1").trim();
            const mo = raw.match(/^(\w+)\s+(\d+),?\s*\d{4}$/);
            if (!mo) return raw;
            const months = { jan:"jan",feb:"feb",mar:"mar",apr:"apr",may:"mai",jun:"jun",
                             jul:"jul",aug:"aug",sep:"sep",oct:"okt",nov:"nov",dec:"des" };
            const m = months[(mo[1] || "").toLowerCase().slice(0, 3)] || mo[1].toLowerCase();
            return `${parseInt(mo[2], 10)}. ${m}`;
          };

          // Parse group-stage match rows from col[0]. EVERY row whose col[0] is a
          // match number with a home (col[4]) + away (col[7]) team IS a match — we
          // never drop it just because we couldn't tag its group from the standings.
          const rawMatches = [];
          for (const row of rows) {
            const id = parseInt(row[0], 10);
            if (!id || String(id) !== (row[0] || "").trim()) continue;
            const homeRaw = (row[4] || "").trim();
            const awayRaw = (row[7] || "").trim();
            if (!homeRaw || !awayRaw) continue;
            const home = window.resolveTeamName ? window.resolveTeamName(homeRaw, cfg.teams) : homeRaw;
            const away = window.resolveTeamName ? window.resolveTeamName(awayRaw, cfg.teams) : awayRaw;
            const group = (teamGroup[homeRaw.toLowerCase()] || teamGroup[awayRaw.toLowerCase()] ||
                           teamGroup[home.toLowerCase()] || teamGroup[away.toLowerCase()] || "").toUpperCase();
            rawMatches.push({ id, day: (row[1]||"").trim(), date: formatDate(row[2]||""), time: (row[3]||"").trim(), group, home, away });
          }

          // Fill in any missing groups: a team plays all its group-stage matches in
          // ONE group, so infer each match's group from any other match where one of
          // its teams already has a known group.
          const teamToGroup = {};
          rawMatches.forEach((m) => {
            if (m.group) { teamToGroup[m.home] = m.group; teamToGroup[m.away] = m.group; }
          });
          rawMatches.forEach((m) => {
            if (!m.group) m.group = teamToGroup[m.home] || teamToGroup[m.away] || "";
          });

          matches = rawMatches;
          if (!matches.length) {
            App.toast("Fant ingen kamper i filen. Sjekk format.", "error"); return;
          }
        }

        // Keep all parsed group-stage matches. (Bracket matches are handled via the
        // preset, not the CSV.) Group may be blank if it truly couldn't be inferred.
        matches = matches.filter(m => m.home && m.away);

        // rebuild groups from the gruppe column (skip matches with no group)
        const groups = {};
        matches.forEach((m) => {
          if (!m.group) return;
          groups[m.group] = groups[m.group] || [];
          [m.home, m.away].forEach((t) => { if (!groups[m.group].includes(t)) groups[m.group].push(t); });
        });
        const ungrouped = matches.filter((m) => !m.group).length;
        cfg.matches = matches;
        cfg.groups = groups;
        // add any unknown teams (no flag code yet) so they still show up
        const known = new Set(cfg.teams.map((t) => t.name));
        matches.forEach((m) => [m.home, m.away].forEach((t) => {
          if (!known.has(t)) { cfg.teams.push({ name: t, code: "" }); known.add(t); }
        }));
        const ungroupedMsg = ungrouped ? ` (${ungrouped} uten gruppe — sjekk lagnavn)` : "";
        App.toast(`Lastet ${matches.length} gruppespill-kamper${ungroupedMsg}. Sluttspill-bracket er uendret — velg forhåndsoppsett under. Husk å lagre.`, "success");
        renderSetup();
      } catch (err) {
        App.toast("Klarte ikke å lese CSV: " + err.message, "error");
      }
    };
    reader.readAsText(file, "windows-1252");
  }

  /* ---- modal ---- */
  function showModal(title, bodyNode, footButtons, opts) {
    const host = document.getElementById("modal-host");
    host.innerHTML = "";
    const backdropClass = "modal-backdrop" + (opts && opts.full ? " modal-backdrop-full" : "");
    const backdrop = el("div", { class: backdropClass }, []);
    if (!(opts && opts.full)) backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
    const modalClass = "modal" + (opts && opts.wide ? " modal-wide" : "");
    const modal = el("div", { class: modalClass }, []);
    const head = el("div", { class: "modal-head" }, [el("h3", {}, [title])]);
    const x = el("button", { class: "btn btn-sm btn-ghost" }, ["✕"]);
    x.addEventListener("click", closeModal);
    head.appendChild(x);
    const bodyClass = "modal-body" + (opts && opts.scroll ? " modal-body-scroll" : "");
    const bodyWrap = el("div", { class: bodyClass }, [bodyNode]);
    const foot = el("div", { class: "modal-foot" }, footButtons || []);
    modal.appendChild(head); modal.appendChild(bodyWrap); modal.appendChild(foot);
    backdrop.appendChild(modal); host.appendChild(backdrop);
  }
  function closeModal() { document.getElementById("modal-host").innerHTML = ""; }

  function viewEntry(id) {
    const en = entries.find((e) => e.id === id);
    if (!en) return;
    const p = en.predictions || {};
    const pMatches  = p.matches  || {};
    const pWinners  = (p.bracket && p.bracket.winners) || {};
    const pBonus    = p.bonus    || {};

    const store = {
      getMatch:  (mid) => pMatches[mid] || {},
      setMatch:  () => {},
      getWinner: (mid) => pWinners[mid] || "",
      setWinner: () => {},
      setRounds: () => {}
    };

    const body = el("div", {}, []);

    // tabs
    const tabBar = el("div", { class: "nav-links", style: "margin-bottom:1.2rem" }, []);
    const tabSkjema = el("a", { href: "#", class: "active" }, ["Tippeskjema"]);
    const tabBonus  = el("a", { href: "#" }, ["Bonusspørsmål"]);
    tabBar.appendChild(tabSkjema);
    if (cfg.bonus && cfg.bonus.questions && cfg.bonus.questions.length) tabBar.appendChild(tabBonus);
    body.appendChild(tabBar);

    // tippeskjema panel
    const panSkjema = el("div", {}, []);
    const layout = el("div", { class: "layout" }, []);
    const colLeft  = el("div", { class: "col-left" }, []);
    const colMid   = el("div", { class: "col-mid" }, []);
    const colRight = el("div", { class: "col-right" }, []);
    layout.appendChild(colLeft); layout.appendChild(colMid); layout.appendChild(colRight);
    panSkjema.appendChild(layout);
    body.appendChild(panSkjema);

    SchemaForm.mount({ cfg, store, left: colLeft, mid: colMid, right: colRight, readonly: true });

    // bonus panel
    const panBonus = el("div", { class: "hidden" }, []);
    if (cfg.bonus && cfg.bonus.questions && cfg.bonus.questions.length) {
      const bonusWrap = el("div", { class: "wrap", style: "padding-top:0;padding-bottom:0" }, []);
      BonusForm.render(bonusWrap, {
        cfg,
        get:  (qid) => pBonus[qid] || "",
        set:  () => {},
        readonly: true,
        showPoints: true
      });
      panBonus.appendChild(bonusWrap);
      body.appendChild(panBonus);
    }

    function switchTab(t) {
      tabSkjema.classList.toggle("active", t === "skjema");
      tabBonus.classList.toggle("active",  t === "bonus");
      panSkjema.classList.toggle("hidden", t !== "skjema");
      panBonus.classList.toggle("hidden",  t !== "bonus");
    }
    tabSkjema.addEventListener("click", (e) => { e.preventDefault(); switchTab("skjema"); });
    tabBonus.addEventListener("click",  (e) => { e.preventDefault(); switchTab("bonus"); });

    const closeBtn = el("button", { class: "btn" }, ["Lukk"]);
    closeBtn.addEventListener("click", closeModal);
    showModal(en.name, body, [closeBtn], { full: true });
  }
})();
