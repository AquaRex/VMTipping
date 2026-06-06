/* =============================================================================
 *  schema-form.js  —  shared renderer for the tipping schema:
 *    group-stage score inputs  →  live standings  →  auto-filling knockout
 *    bracket (pick winners to advance).
 *
 *  Used both by the player page (backed by the saved Draft) and by the admin
 *  "Fasit" tab (backed by the official answer key) so the fasit is entered the
 *  exact same way results are. Data access is abstracted via `store`:
 *     getMatch(id) -> {h,a}    setMatch(id,h,a)
 *     getWinner(mid) -> team   setWinner(mid,team)
 *     setRounds({r32:[],...})  // derived per-round team lists, for scoring
 * ===========================================================================*/
(function () {
  function mount(opts) {
    const { cfg, store, left, mid, right, onChange } = opts;
    const el = App.el;
    const MAX_GOALS = 30;
    const clamp = (n) => Math.max(0, Math.min(MAX_GOALS, n));
    const scoreInputs = [];
    const matchInputMap = {};   // matchId → { h: inputEl, a: inputEl }
    const B = cfg.knockoutBracket;
    let seedResolved = {};

    /* ---------------- Group stage (chronological list) ---------------- */
    const groupWrap = el("div", { class: "card" }, []);
    groupWrap.appendChild(el("h2", {}, ["Gruppespill"]));
    const list = el("div", { class: "match-list" }, []);
    cfg.matches.forEach((m) => list.appendChild(renderMatchRow(m)));
    groupWrap.appendChild(list);
    left.appendChild(groupWrap);

    function renderMatchRow(m) {
      const saved = store.getMatch(m.id) || {};
      const row = el("div", { class: "ml-row" }, []);
      row.appendChild(el("div", { class: "ml-when" }, [`${m.day} ${m.date} · ${m.time} · Gr. ${m.group}`]));
      row.appendChild(el("span", { class: "ml-no" }, [String(m.id)]));
      const homeDiv = el("div", { class: "ml-home" }, [el("span", { class: "nm" }, [m.home]), flagNode(m.home)]);
      const awayDiv = el("div", { class: "ml-away" }, [flagNode(m.away), el("span", { class: "nm" }, [m.away])]);
      const hIn = makeScoreInput(saved.h);
      const aIn = makeScoreInput(saved.a);
      matchInputMap[m.id] = { h: hIn, a: aIn };
      const updateWin = () => {
        const h = parseInt(hIn.value, 10), a = parseInt(aIn.value, 10);
        const has = !isNaN(h) && !isNaN(a);
        homeDiv.classList.toggle("win",  has && h > a);
        homeDiv.classList.toggle("loss", has && h < a);
        homeDiv.classList.toggle("draw", has && h === a);
        awayDiv.classList.toggle("win",  has && a > h);
        awayDiv.classList.toggle("loss", has && a < h);
        awayDiv.classList.toggle("draw", has && h === a);
      };
      const commit = () => { store.setMatch(m.id, hIn.value, aIn.value); updateWin(); updateDerived(); if (onChange) onChange(); };
      hIn._onCommit = commit; aIn._onCommit = commit;
      hIn._updateWin = updateWin; aIn._updateWin = updateWin;
      updateWin();
      row.appendChild(homeDiv);
      row.appendChild(el("div", { class: "ml-score" }, [hIn, el("span", { class: "dash" }, ["–"]), aIn]));
      row.appendChild(awayDiv);
      return row;
    }

    function flagNode(team) {
      const s = el("span", { class: "flag-wrap" }, []);
      s.innerHTML = App.flagImg(team);
      return s;
    }

    /* ---- smart score input (keyboard + auto-advance, arrows, wheel, swipe) ---- */
    function makeScoreInput(initial) {
      const input = el("input", {
        type: "text", inputmode: "numeric", maxlength: "2",
        class: "sc", value: initial != null ? initial : ""
      }, []);
      scoreInputs.push(input);
      const getNum = () => parseInt(input.value, 10) || 0;
      const setNum = (n) => { input.value = String(clamp(n)); if (input._onCommit) input._onCommit(); };
      const advance = () => {
        const i = scoreInputs.indexOf(input);
        const next = scoreInputs[i + 1];
        if (next) { next.focus(); next.select(); } else input.blur();
      };
      input.addEventListener("focus", () => input.select());
      input.addEventListener("input", (e) => {
        let v = input.value.replace(/\D/g, "").slice(0, 2);
        input.value = v;
        if (input._onCommit) input._onCommit();
        if (v.length >= 1 && e.inputType === "insertText") advance();
      });
      const goBack = () => {
        const i = scoreInputs.indexOf(input);
        const prev = scoreInputs[i - 1];
        if (prev) { prev.value = ""; if (prev._onCommit) prev._onCommit(); prev.focus(); prev.select(); }
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "ArrowUp") { e.preventDefault(); setNum(getNum() + 1); }
        else if (e.key === "ArrowDown") { e.preventDefault(); setNum(getNum() - 1); }
        else if (e.key === "Enter") { e.preventDefault(); advance(); }
        else if (e.key === "Backspace") {
          e.preventDefault();
          if (input.value !== "") { input.value = ""; if (input._onCommit) input._onCommit(); }
          else goBack();
        }
      });
      input.addEventListener("wheel", (e) => {
        if (document.activeElement !== input) return;
        e.preventDefault();
        setNum(getNum() + (e.deltaY < 0 ? 1 : -1));
      }, { passive: false });
      let startY = null, startVal = 0;
      input.addEventListener("touchstart", (e) => { startY = e.touches[0].clientY; startVal = getNum(); }, { passive: true });
      input.addEventListener("touchmove", (e) => {
        if (startY == null) return;
        const dy = startY - e.touches[0].clientY;
        if (Math.abs(dy) > 6) { e.preventDefault(); setNum(startVal + Math.round(dy / 12)); }
      }, { passive: false });
      input.addEventListener("touchend", () => { startY = null; });
      return input;
    }

    /* ---------------- Knockout bracket ---------------- */
    const koWrap = el("div", { class: "card bracket-card" }, []);
    koWrap.appendChild(el("h2", {}, ["Sluttspill"]));
    const bracketEl = el("div", { class: "bracket" }, []);
    koWrap.appendChild(bracketEl);
    right.appendChild(koWrap);
    enableDragScroll(bracketEl);

    const cmp = WC.cmp;

    // Standings + seeding are computed by the shared, FIFA-accurate engine in
    // tournament.js (head-to-head tie-breaks + official Annexe C third-place
    // assignment). Here we only marshal the saved scores into a results map.
    function computeStandings() {
      const results = {};
      cfg.matches.forEach((m) => {
        const p = store.getMatch(m.id);
        if (p && p.h !== "" && p.a !== "" && p.h != null && p.a != null) results[m.id] = { h: +p.h, a: +p.a };
      });
      return WC.computeStandings(cfg, results);
    }

    function teamOf(mid_, side) {
      const slot = B.matches[mid_][side];
      if (slot.seed !== undefined) return seedResolved[slot.seed] || "";
      const w = winnerOf(slot.from);
      if (!w) return "";
      if (slot.loser) {
        const a = teamOf(slot.from, "top"), b = teamOf(slot.from, "bot");
        return w === a ? b : (w === b ? a : "");
      }
      return w;
    }
    function winnerOf(mid_) {
      const w = store.getWinner(mid_);
      const a = teamOf(mid_, "top"), b = teamOf(mid_, "bot");
      return (w && (w === a || w === b)) ? w : "";
    }

    function renderBracket() {
      bracketEl.innerHTML = "";
      B.rounds.forEach((round) => {
        const col = el("div", { class: "round" }, []);
        col.appendChild(el("div", { class: "round-title" }, [round.name]));
        const matches = el("div", { class: "matches" }, []);
        round.matchIds.forEach((mid_) => matches.appendChild(renderBox(mid_)));
        col.appendChild(matches);
        bracketEl.appendChild(col);
      });
      deriveRounds();
    }
    function renderBox(mid_) {
      const m = B.matches[mid_];
      const box = el("div", { class: "bmatch" }, []);
      box.appendChild(el("div", { class: "bmeta" }, [`M${mid_}${m.title ? " · " + m.title : ""} · ${m.date} · ${m.time}`]));
      const inner = el("div", { class: "bbox" + (m.title ? " final" : "") }, []);
      inner.appendChild(renderSlot(mid_, "top"));
      inner.appendChild(renderSlot(mid_, "bot"));
      box.appendChild(inner);
      return box;
    }
    function renderSlot(mid_, side) {
      const slot = B.matches[mid_][side];
      const team = teamOf(mid_, side);
      const isWinner = team && winnerOf(mid_) === team;
      const row = el("div", { class: "bslot" + (isWinner ? " win" : "") }, []);
      const flag = el("span", { class: "flag-wrap" }, []);
      flag.innerHTML = team ? App.flagImg(team, "w20") : "";
      row.appendChild(flag);
      const label = team || (slot.seed !== undefined ? slot.seed : "—");
      row.appendChild(el("span", { class: "bteam" + (team ? "" : " empty") }, [label]));
      const chk = el("button", { class: "winchk" + (isWinner ? " on" : ""), title: "Velg vinner" }, ["✓"]);
      if (!team) chk.disabled = true;
      chk.addEventListener("click", () => {
        const pick = isWinner ? "" : team;
        if (pick) {
          // Only clear this team from matches that are NOT predecessors of mid_.
          // (Predecessors are matches whose winner feeds – directly or transitively –
          // into mid_, so it is correct for the same team to be stored there.)
          const preds = new Set();
          const walkPreds = (id) => {
            ["top", "bot"].forEach((s) => {
              const sl = B.matches[id] && B.matches[id][s];
              if (sl && sl.from !== undefined) { preds.add(sl.from); walkPreds(sl.from); }
            });
          };
          walkPreds(mid_);
          B.rounds.forEach((r) => r.matchIds.forEach((id) => {
            if (id !== mid_ && !preds.has(id) && store.getWinner(id) === pick)
              store.setWinner(id, "");
          }));
        }
        store.setWinner(mid_, pick);
        renderBracket();
        if (onChange) onChange();
      });
      row.appendChild(chk);
      return row;
    }

    function enableDragScroll(elm) {
      let down = false, startX = 0, startLeft = 0;
      elm.addEventListener("mousedown", (e) => {
        if (e.target.closest("button, select, input")) return;
        down = true; startX = e.pageX; startLeft = elm.scrollLeft; elm.classList.add("dragging");
      });
      window.addEventListener("mousemove", (e) => {
        if (!down) return;
        e.preventDefault();
        elm.scrollLeft = startLeft - (e.pageX - startX);
      });
      window.addEventListener("mouseup", () => { down = false; elm.classList.remove("dragging"); });
    }

    /* ---------------- standings tables (middle column) ---------------- */
    function renderStandings(standings) {
      mid.innerHTML = "";
      const card = el("div", { class: "card stand-card" }, []);
      card.appendChild(el("h2", {}, ["Tabeller"]));
      card.appendChild(el("p", { class: "sub" }, ["Oppdateres automatisk. Topp 2 (blå) går videre, beste 3.-plasser kjemper om plass."]));
      Object.keys(cfg.groups).forEach((g) => card.appendChild(standTable("Gruppe " + g, standings[g], 2, false)));
      const thirds = Object.keys(cfg.groups).map((g) => standings[g][2]).filter(Boolean).sort(cmp);
      card.appendChild(standTable("3. plasser", thirds, 8, true));
      mid.appendChild(card);
    }
    function standTable(title, rows, advCount, showGroup) {
      const tbl = el("table", { class: "stbl" + (showGroup ? " third-tbl" : "") }, []);
      tbl.innerHTML =
        `<thead><tr><th class="gname">${App.escape(title)}</th>` +
        `<th title="Spilte">S</th><th title="Vinn">V</th><th title="Uavgjort">U</th><th title="Tap">T</th><th>Mål</th><th>P</th></tr></thead>`;
      const tb = el("tbody", {}, []);
      rows.forEach((r, i) => {
        const tr = el("tr", { class: i < advCount ? "adv" : "out" }, []);
        const nameCell = `${App.flagImg(r.team, "w20")}<span>${App.escape(r.team)}${showGroup ? ` <span class="muted">(${r.group})</span>` : ""}</span>`;
        tr.innerHTML =
          `<td class="tname">${nameCell}</td>` +
          `<td>${r.pl}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>` +
          `<td class="goals">${r.gf} - ${r.ga}</td><td class="pts">${r.pts}</td>`;
        tb.appendChild(tr);
      });
      tbl.appendChild(tb);
      return tbl;
    }

    function deriveRounds() {
      const ids = (key) => B.rounds.find((r) => r.key === key).matchIds;
      const r32 = [];
      ids("r32").forEach((id) => { const a = teamOf(id, "top"), b = teamOf(id, "bot"); if (a) r32.push(a); if (b) r32.push(b); });
      store.setRounds({
        r32,
        r16: ids("r32").map(winnerOf).filter(Boolean),
        qf: ids("r16").map(winnerOf).filter(Boolean),
        sf: ids("qf").map(winnerOf).filter(Boolean),
        final: ids("sf").map(winnerOf).filter(Boolean),
        winner: [winnerOf(104)].filter(Boolean)
      });
    }

    function updateDerived() {
      const { standings, complete } = computeStandings();
      seedResolved = WC.buildSeeds(cfg, standings, complete);
      renderStandings(standings);
      renderBracket();
    }

    function reloadInputs() {
      cfg.matches.forEach((m) => {
        const saved = store.getMatch(m.id) || {};
        const ins = matchInputMap[m.id];
        if (!ins) return;
        ins.h.value = saved.h != null ? String(saved.h) : "";
        ins.a.value = saved.a != null ? String(saved.a) : "";
        if (ins.h._updateWin) ins.h._updateWin();
      });
    }

    updateDerived();
    return { refresh: updateDerived, reloadInputs };
  }

  window.SchemaForm = { mount };
})();
