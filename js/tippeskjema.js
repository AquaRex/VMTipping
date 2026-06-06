/* =============================================================================
 *  tippeskjema.js  —  renders the schedule page:
 *    • group stage as a single chronological match list (like the Excel sheet),
 *      with smart score inputs (keyboard + auto-advance, arrows, wheel, swipe)
 *    • progressive knockout team picker
 * ===========================================================================*/
(async function () {
  const cfg = (await App.loadConfig()).config;
  App.renderNav("skjema");
  document.getElementById("page-title").textContent = cfg.title || "Tippeskjema";

  const content = document.getElementById("content");
  const nameInput = document.getElementById("player-name");
  nameInput.value = Draft.name;
  nameInput.addEventListener("input", () => Draft.setName(nameInput.value));

  const MAX_GOALS = 30;
  const clamp = (n) => Math.max(0, Math.min(MAX_GOALS, n));
  const scoreInputs = []; // flat list, in tab order, for auto-advance

  /* ---------------- Group stage (chronological list) ---------------- */
  const groupWrap = App.el("div", { class: "card" }, []);
  groupWrap.appendChild(App.el("h2", {}, ["Gruppespill"]));
  groupWrap.appendChild(App.el("p", { class: "sub" }, [
    `Tipp resultatet i hver kamp. ${cfg.scoring.groupOutcome}p for riktig utfall, +${cfg.scoring.groupExact}p for helt riktig resultat. ` +
    `Tast tall (hopper videre automatisk), bruk piltaster, rull med musehjulet, eller dra opp/ned på mobil.`
  ]));

  const list = App.el("div", { class: "match-list" }, []);
  cfg.matches.forEach((m) => list.appendChild(renderMatchRow(m)));
  groupWrap.appendChild(list);
  content.appendChild(groupWrap);

  function renderMatchRow(m) {
    const saved = Draft.matches[m.id] || {};
    const row = App.el("div", { class: "ml-row" }, []);

    row.appendChild(App.el("div", { class: "ml-when" }, [
      App.el("span", { class: "ml-no" }, [String(m.id)]),
      `${m.day} ${m.date} · ${m.time} · Gr. ${m.group}`
    ]));

    row.appendChild(App.el("div", { class: "ml-home" }, [
      App.el("span", { class: "nm" }, [m.home]), flagNode(m.home)
    ]));

    const hIn = makeScoreInput(saved.h);
    const aIn = makeScoreInput(saved.a);
    const commit = () => { Draft.setMatch(m.id, hIn.value, aIn.value); updateProgress(); };
    hIn._onCommit = commit; aIn._onCommit = commit;
    row.appendChild(App.el("div", { class: "ml-score" }, [
      hIn, App.el("span", { class: "dash" }, ["–"]), aIn
    ]));

    row.appendChild(App.el("div", { class: "ml-away" }, [
      flagNode(m.away), App.el("span", { class: "nm" }, [m.away])
    ]));
    return row;
  }

  function flagNode(team) {
    const span = App.el("span", { class: "flag-wrap" }, []);
    span.innerHTML = App.flagImg(team);
    return span;
  }

  /* ---- smart score input ---- */
  function makeScoreInput(initial) {
    const input = App.el("input", {
      type: "text", inputmode: "numeric", maxlength: "2",
      class: "sc", value: initial != null ? initial : ""
    }, []);
    scoreInputs.push(input);

    const getNum = () => parseInt(input.value, 10) || 0;
    const setNum = (n) => { input.value = String(clamp(n)); if (input._onCommit) input._onCommit(); };

    const advance = () => {
      const i = scoreInputs.indexOf(input);
      const next = scoreInputs[i + 1];
      if (next) { next.focus(); next.select(); }
      else input.blur();
    };

    input.addEventListener("focus", () => input.select());

    input.addEventListener("input", (e) => {
      let v = input.value.replace(/\D/g, "").slice(0, 2);
      input.value = v;
      if (input._onCommit) input._onCommit();
      if (v.length >= 1 && e.inputType === "insertText") advance();
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowUp") { e.preventDefault(); setNum(getNum() + 1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setNum(getNum() - 1); }
      else if (e.key === "Enter") { e.preventDefault(); advance(); }
    });

    // mouse wheel — only when this input is focused (so page scroll is safe)
    input.addEventListener("wheel", (e) => {
      if (document.activeElement !== input) return;
      e.preventDefault();
      setNum(getNum() + (e.deltaY < 0 ? 1 : -1));
    }, { passive: false });

    // touch swipe up/down to change the value
    let startY = null, startVal = 0, moved = false;
    input.addEventListener("touchstart", (e) => {
      startY = e.touches[0].clientY; startVal = getNum(); moved = false;
    }, { passive: true });
    input.addEventListener("touchmove", (e) => {
      if (startY == null) return;
      const dy = startY - e.touches[0].clientY;
      if (Math.abs(dy) > 6) {
        moved = true; e.preventDefault();
        setNum(startVal + Math.round(dy / 12));
      }
    }, { passive: false });
    input.addEventListener("touchend", () => { startY = null; });

    return input;
  }

  /* ---------------- Knockout bracket ---------------- */
  const B = cfg.knockoutBracket;
  const bracket = Draft.bracket; // { slots, winners }
  const koWrap = App.el("div", { class: "card bracket-card" }, []);
  koWrap.appendChild(App.el("h2", {}, ["Sluttspill"]));
  koWrap.appendChild(App.el("p", { class: "sub" }, [
    "Velg lag i 16-delsfinalen, og klikk ✓ ved laget du tror går videre i hver kamp – vinneren flyttes automatisk til neste runde. Tap i semifinalen går til bronsefinalen."
  ]));
  const bracketEl = App.el("div", { class: "bracket" }, []);
  koWrap.appendChild(bracketEl);
  content.appendChild(koWrap);

  // Resolve the team currently in a given slot (follows winners up the tree).
  function teamOf(mid, side) {
    const slot = B.matches[mid][side];
    if (slot.seed !== undefined) return bracket.slots[mid + side] || "";
    const w = winnerOf(slot.from);
    if (!w) return "";
    if (slot.loser) {
      const a = teamOf(slot.from, "top"), b = teamOf(slot.from, "bot");
      return w === a ? b : (w === b ? a : "");
    }
    return w;
  }
  function winnerOf(mid) {
    const w = bracket.winners[mid];
    const a = teamOf(mid, "top"), b = teamOf(mid, "bot");
    return (w && (w === a || w === b)) ? w : "";
  }

  function renderBracket() {
    bracketEl.innerHTML = "";
    const r32Ids = B.rounds[0].matchIds;
    const used = new Set();
    r32Ids.forEach((id) => ["top", "bot"].forEach((s) => { const t = bracket.slots[id + s]; if (t) used.add(t); }));

    B.rounds.forEach((round) => {
      const col = App.el("div", { class: "round" }, []);
      col.appendChild(App.el("div", { class: "round-title" }, [round.name]));
      const matches = App.el("div", { class: "matches" }, []);
      round.matchIds.forEach((mid) => matches.appendChild(renderBox(mid, used)));
      col.appendChild(matches);
      bracketEl.appendChild(col);
    });
    deriveRounds();
    updateProgress();
  }

  function renderBox(mid, used) {
    const m = B.matches[mid];
    const box = App.el("div", { class: "bmatch" }, []);
    box.appendChild(App.el("div", { class: "bmeta" }, [`${m.title ? m.title + " · " : ""}${m.date} · ${m.time}`]));
    const inner = App.el("div", { class: "bbox" + (m.title ? " final" : "") }, []);
    inner.appendChild(renderSlot(mid, "top", used));
    inner.appendChild(renderSlot(mid, "bot", used));
    box.appendChild(inner);
    return box;
  }

  function renderSlot(mid, side, used) {
    const slot = B.matches[mid][side];
    const team = teamOf(mid, side);
    const isWinner = team && winnerOf(mid) === team;
    const row = App.el("div", { class: "bslot" + (isWinner ? " win" : "") }, []);

    const flag = App.el("span", { class: "flag-wrap" }, []);
    flag.innerHTML = team ? App.flagImg(team, "w20") : "";
    row.appendChild(flag);

    if (slot.seed !== undefined) {
      const sel = App.el("select", { class: "bteam-sel" }, []);
      sel.appendChild(new Option(slot.seed, ""));
      App.allTeams().forEach((t) => {
        const opt = new Option(t, t);
        if (used.has(t) && t !== team) opt.disabled = true;
        sel.appendChild(opt);
      });
      sel.value = team || "";
      sel.addEventListener("change", () => {
        Draft.setSlot(mid, side, sel.value);
        const w = bracket.winners[mid];
        if (w && w !== teamOf(mid, "top") && w !== teamOf(mid, "bot")) Draft.setWinner(mid, "");
        renderBracket();
      });
      row.appendChild(sel);
    } else {
      row.appendChild(App.el("span", { class: "bteam" + (team ? "" : " empty") }, [team || "—"]));
    }

    const chk = App.el("button", { class: "winchk" + (isWinner ? " on" : ""), title: "Velg vinner" }, ["✓"]);
    if (!team) chk.disabled = true;
    chk.addEventListener("click", () => { Draft.setWinner(mid, isWinner ? "" : team); renderBracket(); });
    row.appendChild(chk);
    return row;
  }

  // Derive per-round team lists (used for scoring) from the bracket.
  function deriveRounds() {
    const ids = (key) => B.rounds.find((r) => r.key === key).matchIds;
    const r32 = [];
    ids("r32").forEach((id) => { const a = teamOf(id, "top"), b = teamOf(id, "bot"); if (a) r32.push(a); if (b) r32.push(b); });
    Draft.setKnockout("r32", r32);
    Draft.setKnockout("r16", ids("r32").map(winnerOf).filter(Boolean));
    Draft.setKnockout("qf", ids("r16").map(winnerOf).filter(Boolean));
    Draft.setKnockout("sf", ids("qf").map(winnerOf).filter(Boolean));
    Draft.setKnockout("final", ids("sf").map(winnerOf).filter(Boolean));
    Draft.setKnockout("winner", [winnerOf(104)].filter(Boolean));
  }

  renderBracket();

  /* ---------------- progress + publish ---------------- */
  function updateProgress() {
    const done = Object.keys(Draft.matches).filter((id) => {
      const m = Draft.matches[id]; return m && m.h !== "" && m.a !== "";
    }).length;
    document.getElementById("progress").textContent = `${done} / ${cfg.matches.length} kamper tippet`;
  }
  updateProgress();

  document.getElementById("publish-btn").addEventListener("click", window.publishDraft);
})();
