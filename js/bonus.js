/* =============================================================================
 *  bonus.js  —  renders the bonus questions page (duels, yes/no, free text),
 *  grouped by section, in the configured order.
 * ===========================================================================*/
(async function () {
  const cfg = (await App.loadConfig()).config;
  App.renderNav("bonus");

  const nameInput = document.getElementById("player-name");
  nameInput.value = Draft.name;
  nameInput.addEventListener("input", () => Draft.setName(nameInput.value));

  const bonus = cfg.bonus || { questions: [] };
  if (bonus.deadline) {
    document.getElementById("deadline").textContent = "Leveres innen " + bonus.deadline + ".";
  }

  const content = document.getElementById("content");
  content.innerHTML = "";

  // Group questions by section, preserving config order.
  const order = bonus.sections && bonus.sections.length
    ? bonus.sections.slice() : [];
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

    const titleRow = App.el("div", { class: "section-title" }, [
      App.el("h2", {}, [section]),
      App.el("span", { class: "pts" }, [`(${total}p totalt)`])
    ]);
    content.appendChild(titleRow);

    const card = App.el("div", { class: "card" }, []);
    qs.forEach((q) => card.appendChild(renderQuestion(q)));
    content.appendChild(card);
  });

  if (bonus.footnote) {
    content.appendChild(App.el("p", { class: "muted", style: "font-size:.85rem" }, [bonus.footnote]));
  }

  function renderQuestion(q) {
    const wrap = App.el("div", { class: "q" }, []);
    const label = App.el("div", { class: "qtext" }, [q.text]);
    label.appendChild(App.el("span", { class: "qpts" }, [`${q.points}p`]));
    wrap.appendChild(label);

    const current = Draft.bonus[q.id];

    if (q.type === "duel") {
      const row = App.el("div", { class: "duel" }, []);
      (q.options || []).forEach((opt) => {
        const b = App.el("div", { class: "opt" + (current === opt ? " sel" : "") }, [opt]);
        b.addEventListener("click", () => {
          Draft.setBonus(q.id, current === opt ? "" : opt);
          rerender();
        });
        row.appendChild(b);
      });
      wrap.appendChild(row);
    } else if (q.type === "yesno") {
      const row = App.el("div", { class: "yesno" }, []);
      [["Ja", "J"], ["Nei", "N"]].forEach(([lbl, val]) => {
        const b = App.el("div", { class: "opt" + (current === val ? " sel" : "") }, [lbl]);
        b.addEventListener("click", () => {
          Draft.setBonus(q.id, current === val ? "" : val);
          rerender();
        });
        row.appendChild(b);
      });
      wrap.appendChild(row);
    } else {
      const inp = App.el("input", { type: "text", value: current || "", placeholder: "Skriv svaret ditt …", style: "width:100%" }, []);
      inp.addEventListener("input", () => { Draft.setBonus(q.id, inp.value.trim()); updateProgress(); });
      wrap.appendChild(inp);
    }

    function rerender() {
      const fresh = renderQuestion(q);
      wrap.replaceWith(fresh);
      updateProgress();
    }
    return wrap;
  }

  function updateProgress() {
    const answered = bonus.questions.filter((q) => Draft.bonus[q.id] != null && Draft.bonus[q.id] !== "").length;
    document.getElementById("progress").textContent =
      `${answered} / ${bonus.questions.length} bonusspørsmål besvart`;
  }
  updateProgress();

  document.getElementById("publish-btn").addEventListener("click", window.publishDraft);
})();
