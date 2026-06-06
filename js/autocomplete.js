/* =============================================================================
 *  autocomplete.js  —  a small searchable dropdown (combobox).
 *
 *  window.makeAutocomplete({ value, options, placeholder, onChange })
 *    options : [{ label, sub }]   (sub is optional, shown muted on the right)
 *    onChange(value) : called as the user types and when a choice is picked.
 *
 *  Type to filter, ↑/↓ to move, Enter picks the highlighted (top) match, click
 *  to pick. Picking inserts the canonical label so two people who pick the same
 *  option store the identical string (no spelling mismatches when grading).
 * ===========================================================================*/
(function () {
  window.makeAutocomplete = function (opts) {
    const el = App.el;
    const wrap = el("div", { class: "ac-wrap" }, []);
    const input = el("input", { type: "text", class: "ac-input", value: opts.value || "", placeholder: opts.placeholder || "Søk …", autocomplete: "off" }, []);
    const menu = el("div", { class: "ac-menu hidden" }, []);
    wrap.appendChild(input); wrap.appendChild(menu);

    let items = [], hi = -1;

    const commit = (v) => { input.value = v; if (opts.onChange) opts.onChange(v); };
    const close = () => { menu.classList.add("hidden"); hi = -1; };
    const highlight = () => [...menu.children].forEach((c, i) => c.classList.toggle("hi", i === hi));

    function renderMenu(query) {
      const q = (query || "").trim().toLowerCase();
      menu.innerHTML = "";
      if (!q) { close(); return; }
      items = (opts.options || []).filter((o) =>
        o.label.toLowerCase().includes(q) || (o.sub && o.sub.toLowerCase().includes(q))
      ).slice(0, 12);
      if (!items.length) { close(); return; }
      items.forEach((o, i) => {
        const it = el("div", { class: "ac-item" + (i === hi ? " hi" : "") }, []);
        it.innerHTML = `<span class="ac-name">${App.escape(o.label)}</span>` + (o.sub ? `<span class="ac-sub">${App.escape(o.sub)}</span>` : "");
        it.addEventListener("mousedown", (e) => { e.preventDefault(); commit(o.label); close(); });
        menu.appendChild(it);
      });
      hi = 0; highlight();
      menu.classList.remove("hidden");
    }

    input.addEventListener("input", () => { if (opts.onChange) opts.onChange(input.value); renderMenu(input.value); });
    input.addEventListener("focus", () => { if (input.value) renderMenu(input.value); });
    input.addEventListener("blur", () => setTimeout(close, 120));
    input.addEventListener("keydown", (e) => {
      if (menu.classList.contains("hidden")) return;
      if (e.key === "ArrowDown") { e.preventDefault(); hi = Math.min(hi + 1, items.length - 1); highlight(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); hi = Math.max(hi - 1, 0); highlight(); }
      else if (e.key === "Enter") { if (items[hi]) { e.preventDefault(); commit(items[hi].label); close(); } }
      else if (e.key === "Escape") { close(); }
    });

    return wrap;
  };
})();
