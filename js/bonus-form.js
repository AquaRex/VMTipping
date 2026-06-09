/* =============================================================================
 *  bonus-form.js  —  shared renderer for the bonus questions (duel / yes-no /
 *  free text), grouped by section. Used by the player bonus page and by the
 *  admin "Fasit" tab so the fasit is entered exactly like a normal answer.
 *
 *  opts: { cfg, get(qid)->value, set(qid,value), onChange, showPoints }
 * ===========================================================================*/
(function () {
  function render(container, opts) {
    const { cfg, get, set, onChange } = opts;
    const showPoints = opts.showPoints !== false;
    const readonly = !!opts.readonly;
    const grade = typeof opts.grade === "function" ? opts.grade : null;
    const el = App.el;
    const bonus = cfg.bonus || { questions: [] };
    container.innerHTML = "";

    const order = (bonus.sections && bonus.sections.length) ? bonus.sections.slice() : [];
    const bySection = {};
    bonus.questions.forEach((q) => {
      const s = q.section || "Annet";
      (bySection[s] = bySection[s] || []).push(q);
      if (!order.includes(s)) order.push(s);
    });

    order.forEach((section) => {
      const qs = bySection[section];
      if (!qs || !qs.length) return;
      const total = qs.reduce((sum, q) => sum + (q.points || 0), 0);
      const title = el("div", { class: "section-title" }, [el("h2", {}, [section])]);
      if (showPoints) title.appendChild(el("span", { class: "pts" }, [`(${total}p totalt)`]));
      container.appendChild(title);
      const card = el("div", { class: "card" }, []);
      qs.forEach((q) => card.appendChild(renderQ(q)));
      container.appendChild(card);
    });
    if (bonus.footnote) container.appendChild(el("p", { class: "muted", style: "font-size:.85rem" }, [bonus.footnote]));

    function renderQ(q) {
      const wrap = el("div", { class: "q" }, []);
      const label = el("div", { class: "qtext" }, [q.text]);
      if (showPoints && q.points != null) label.appendChild(el("span", { class: "qpts" }, [`${q.points}p`]));
      if (grade) {
        const gb = grade(q.id);
        if (gb) label.appendChild(el("span", { class: "grade-badges" }, [gb]));
      }
      wrap.appendChild(label);
      const current = get(q.id);

      if (q.type === "duel") {
        const row = el("div", { class: "duel" }, []);
        (q.options || []).forEach((opt) => {
          const b = el("div", { class: "opt" + (current === opt ? " sel" : "") + (readonly ? " readonly" : "") }, [opt]);
          if (!readonly) b.addEventListener("click", () => { set(q.id, current === opt ? "" : opt); rerender(); });
          row.appendChild(b);
        });
        wrap.appendChild(row);
      } else if (q.type === "yesno") {
        const row = el("div", { class: "yesno" }, []);
        [["Ja", "J"], ["Nei", "N"]].forEach(([lbl, val]) => {
          const b = el("div", { class: "opt" + (current === val ? " sel" : "") + (readonly ? " readonly" : "") }, [lbl]);
          if (!readonly) b.addEventListener("click", () => { set(q.id, current === val ? "" : val); rerender(); });
          row.appendChild(b);
        });
        wrap.appendChild(row);
      } else if (q.type === "custombuttons") {
        const row = el("div", { class: "duel" }, []);
        (q.options || []).forEach((opt) => {
          const b = el("div", { class: "opt" + (current === opt ? " sel" : "") + (readonly ? " readonly" : "") }, [opt]);
          if (!readonly) b.addEventListener("click", () => { set(q.id, current === opt ? "" : opt); rerender(); });
          row.appendChild(b);
        });
        wrap.appendChild(row);
      } else if (q.type === "match") {
        const countryList = (cfg.teams || []).map((t) => ({ label: t.name, sub: "" }));
        const parts = (current || "").split(" vs ");
        let v1 = parts[0] || "", v2 = parts[1] || "";
        const save = () => {
          const val = v1 && v2 ? v1 + " vs " + v2 : "";
          set(q.id, val);
          if (onChange) onChange();
        };
        const row = el("div", { class: "match-pick" }, []);
        let ac2El;
        const ac1 = window.makeAutocomplete({
          value: v1, options: countryList, placeholder: "Hjemmelag …", disabled: readonly,
          onChange: (v) => { v1 = v; },
          onCommit: (v, reason) => { save(); if (reason === "enter" && ac2El) ac2El.querySelector("input").focus(); }
        });
        const vs = el("span", { class: "match-vs" }, ["vs"]);
        const ac2 = window.makeAutocomplete({
          value: v2, options: countryList, placeholder: "Bortelag …", disabled: readonly,
          onChange: (v) => { v2 = v; save(); },
          onCommit: () => { save(); }
        });
        ac2El = ac2;
        row.appendChild(ac1); row.appendChild(vs); row.appendChild(ac2);
        wrap.appendChild(row);
      } else if (q.type === "player" || q.type === "country" || q.type === "custom" || q.type === "customselect") {
        const isSelect = q.type === "customselect";
        const list = q.type === "country"
          ? (cfg.teams || []).map((t) => ({ label: t.name, sub: "" }))
          : (q.type === "custom" || isSelect)
            ? (q.options || []).map((o) => ({ label: o.trim(), sub: "" })).filter(o => o.label)
            : (cfg.players || []).map((p) => ({ label: p.name, sub: p.team }));
        const placeholder = q.type === "country" ? "Søk etter land …" : isSelect ? "Velg alternativ …" : q.type === "custom" ? "Velg alternativ …" : "Søk etter spiller …";
        const maker = isSelect ? window.makeSelectDropdown : window.makeAutocomplete;
        const ac = maker({
          value: current || "",
          options: list,
          placeholder,
          onChange: readonly ? null : (v) => { set(q.id, (v || "").trim()); if (onChange) onChange(); },
          disabled: readonly
        });
        wrap.appendChild(ac);
      } else {
        const inp = el("input", { type: "text", value: current || "", placeholder: "Skriv svaret …",
          style: "width:100%", ...(readonly ? { disabled: "true" } : {}) }, []);
        if (!readonly) inp.addEventListener("input", () => { set(q.id, inp.value.trim()); if (onChange) onChange(); });
        wrap.appendChild(inp);
      }

      function rerender() { wrap.replaceWith(renderQ(q)); if (onChange) onChange(); }
      return wrap;
    }
  }

  window.BonusForm = { render };
})();
