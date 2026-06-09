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
    const readonly = !!opts.readonly;
    const grade = typeof opts.grade === "function" ? opts.grade : null;
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
      const whenDiv = el("div", { class: "ml-when" }, [`${m.day} ${m.date} · ${m.time} · Gr. ${m.group}`]);
      if (grade) {
        const go = grade(`m${m.id}o`);   // outcome
        const ge = grade(`m${m.id}e`);   // exact
        if (go || ge) {
          const badges = el("span", { class: "grade-badges" }, []);
          if (go) { go.title = "Riktig utfall"; badges.appendChild(go); }
          if (ge) { ge.title = "Eksakt resultat"; badges.appendChild(ge); }
          whenDiv.appendChild(badges);
        }
      }
      row.appendChild(whenDiv);
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
        class: "sc", value: initial != null ? initial : "",
        ...(readonly ? { disabled: "true", tabindex: "-1" } : {})
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

    // map from matchId → its .bbox DOM element, populated during renderBox
    const bboxEls = {};

    function renderBracket() {
      bracketEl.innerHTML = "";
      B.rounds.forEach((round) => {
        const col = el("div", { class: "round" }, []);
        col.appendChild(el("div", { class: "round-title" }, [round.name]));
        const matches = el("div", { class: "matches" }, []);
        const ids = round.matchIds;
        if (ids.length > 1) {
          for (let i = 0; i < ids.length; i += 2) {
            const pair = el("div", { class: "bpair" }, []);
            pair.appendChild(renderBox(ids[i]));
            if (ids[i + 1] != null) pair.appendChild(renderBox(ids[i + 1]));
            matches.appendChild(pair);
          }
        } else {
          ids.forEach((mid_) => matches.appendChild(renderBox(mid_)));
        }
        col.appendChild(matches);
        bracketEl.appendChild(col);
      });
      deriveRounds();
      requestAnimationFrame(drawAndScale);
    }

    function drawAndScale() {
      // 1. Reset any existing transform so getBoundingClientRect() returns natural coords
      bracketEl.style.transform = "";
      bracketEl.style.transformOrigin = "";
      koWrap.style.height = "";

      // 2. Draw connectors at natural (unscaled) coordinates
      drawConnectors();

      // 3. Scale to fit width; card height shrinks to exactly contain the scaled bracket.
      const style = getComputedStyle(koWrap);
      const padH = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const availW = koWrap.clientWidth - padH;
      const naturalW = bracketEl.scrollWidth;
      const naturalH = bracketEl.offsetHeight;  // offsetHeight not scrollHeight — no phantom scroll space
      if (naturalW > availW) {
        const scale = availW / naturalW;
        bracketEl.style.transformOrigin = "top left";
        bracketEl.style.transform = `scale(${scale})`;
        const topOffset = bracketEl.offsetTop;
        const padBottom = parseFloat(style.paddingBottom);
        koWrap.style.height = (topOffset + naturalH * scale + padBottom) + "px";
      } else {
        koWrap.style.height = "";
      }
    }

    function drawConnectors() {
      // remove old SVG if any
      const old = bracketEl.querySelector(".bracket-svg");
      if (old) old.remove();

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "bracket-svg");
      svg.setAttribute("width", bracketEl.scrollWidth);
      svg.setAttribute("height", bracketEl.scrollHeight);

      const bracketRect = bracketEl.getBoundingClientRect();
      const color = getComputedStyle(bracketEl).getPropertyValue("--line").trim() || "#2a3a4a";

      function midY(el) {
        const r = el.getBoundingClientRect();
        return r.top - bracketRect.top + bracketEl.scrollTop + r.height / 2;
      }
      function rightX(el) {
        const r = el.getBoundingClientRect();
        return r.right - bracketRect.left + bracketEl.scrollLeft;
      }
      function leftX(el) {
        const r = el.getBoundingClientRect();
        return r.left - bracketRect.left + bracketEl.scrollLeft;
      }

      function line(x1, y1, x2, y2) {
        const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
        l.setAttribute("x1", x1); l.setAttribute("y1", y1);
        l.setAttribute("x2", x2); l.setAttribute("y2", y2);
        l.setAttribute("stroke", color);
        l.setAttribute("stroke-width", "1");
        svg.appendChild(l);
      }

      // For each match that feeds into a next match, draw:
      //   horizontal from right edge of source bbox → midpoint X
      //   vertical spine joining the two sources at midpoint X
      //   horizontal from midpoint X → left edge of target bbox
      // Group sources by their shared next match
      const groups = {};
      Object.keys(B.matches).forEach((idStr) => {
        const m = B.matches[idStr];
        if (!m.next || !bboxEls[idStr] || !bboxEls[m.next]) return;
        if (!groups[m.next]) groups[m.next] = [];
        groups[m.next].push(+idStr);
      });

      Object.keys(groups).forEach((nextId) => {
        const sources = groups[nextId];
        const targetEl = bboxEls[nextId];
        if (!targetEl) return;

        const targetLeft = leftX(targetEl);
        const targetMidY = midY(targetEl);
        const midX = targetLeft - 18; // vertical spine, with visible stub into target

        if (sources.length === 1) {
          const srcEl = bboxEls[sources[0]];
          if (!srcEl) return;
          const sy = midY(srcEl);
          const rx = rightX(srcEl);
          // horizontal stub out, vertical elbow if needed, horizontal into target
          line(rx, sy, midX, sy);
          if (Math.round(sy) !== Math.round(targetMidY)) line(midX, sy, midX, targetMidY);
          line(midX, targetMidY, targetLeft, targetMidY);
        } else {
          // two sources: horizontal stubs → vertical spine → horizontal into target
          const srcEls = sources.map((id) => bboxEls[id]).filter(Boolean);
          if (srcEls.length < 2) return;
          const ys = srcEls.map(midY);
          const spineY1 = Math.min(...ys);
          const spineY2 = Math.max(...ys);
          const spineMid = (spineY1 + spineY2) / 2;

          // horizontal stubs from each source right edge → spine X
          srcEls.forEach((srcEl) => {
            line(rightX(srcEl), midY(srcEl), midX, midY(srcEl));
          });
          // vertical spine
          line(midX, spineY1, midX, spineY2);
          // horizontal from spine midpoint → target left edge (always at same Y)
          if (Math.round(spineMid) !== Math.round(targetMidY)) line(midX, spineMid, midX, targetMidY);
          line(midX, targetMidY, targetLeft, targetMidY);
        }
      });

      bracketEl.appendChild(svg);
    }
    function renderBox(mid_) {
      const m = B.matches[mid_];
      const box = el("div", { class: "bmatch" }, []);
      const meta = el("div", { class: "bmeta" }, [`M${mid_}${m.title ? " · " + m.title : ""} · ${m.date} · ${m.time}`]);
      if (grade) {
        const gb = grade(`kw:${mid_}`);
        if (gb) { const badges = el("span", { class: "grade-badges" }, [gb]); meta.appendChild(badges); }
      }
      box.appendChild(meta);
      const inner = el("div", { class: "bbox" + (m.title ? " final" : "") }, []);
      inner.appendChild(renderSlot(mid_, "top"));
      inner.appendChild(renderSlot(mid_, "bot"));
      box.appendChild(inner);
      bboxEls[mid_] = inner;  // register for connector drawing
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
      if (!team || readonly) chk.disabled = true;
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

    /* ---------------- standings tables (middle column) ---------------- */
    function renderStandings(standings) {
      mid.innerHTML = "";
      const card = el("div", { class: "card stand-card" }, []);
      card.appendChild(el("h2", {}, ["Tabeller"]));
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
      const roundMap = {};
      B.rounds.forEach((round, i) => {
        if (i === 0) {
          // First round: both teams of each match enter
          const teams = [];
          round.matchIds.forEach((id) => {
            const a = teamOf(id, "top"), b = teamOf(id, "bot");
            if (a) teams.push(a); if (b) teams.push(b);
          });
          roundMap[round.key] = teams;
        } else {
          // Subsequent rounds: winners of the previous round
          const prev = B.rounds[i - 1];
          roundMap[round.key] = prev.matchIds.map(winnerOf).filter(Boolean);
        }
      });
      // winner = winner of the final match
      const finalRound = B.rounds[B.rounds.length - 1];
      const finalId = finalRound && finalRound.matchIds[0];
      roundMap.winner = finalId ? [winnerOf(finalId)].filter(Boolean) : [];
      store.setRounds(roundMap);
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

    const resizeObs = new ResizeObserver(() => drawAndScale());
    resizeObs.observe(koWrap);

    return { refresh: updateDerived, reloadInputs };
  }

  window.SchemaForm = { mount };
})();
