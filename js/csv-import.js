/* =============================================================================
 *  csv-import.js  —  Import results from an Excel-exported CSV file.
 *
 *  Parses two things from the CSV:
 *   1. Group-stage scores  (rows where col[0] is match ID 1–72)
 *   2. Bracket winners     (team names in cols ≥ 8; the winner is the one
 *                           that appears furthest to the right, since the
 *                           Excel bracket tree progresses left → right)
 *
 *  Usage:
 *    const { matchScores, bracketWinners } = CsvImport.parse(csvText, cfg);
 *    CsvImport.buildDropZone(containerEl, cfg, (matchScores, bracketWinners) => { ... });
 * ===========================================================================*/
(function () {

  /* ---- basic CSV parser (handles double-quoted fields) ------------------- */
  function parseCSV(text) {
    const rows = [];
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    // detect delimiter: count commas vs semicolons in the first non-empty line
    const firstLine = lines.find(l => l.trim()) || '';
    const sep = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';
    for (const line of lines) {
      if (!line.trim()) continue;
      const row = [];
      let inQ = false, field = '';
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQ && line[i + 1] === '"') { field += '"'; i++; }
          else inQ = !inQ;
        } else if (c === sep && !inQ) {
          row.push(field.trim()); field = '';
        } else {
          field += c;
        }
      }
      row.push(field.trim());
      rows.push(row);
    }
    return rows;
  }

  const norm = (s) => (s || '').toLowerCase().replace(/\s+/g, ' ').trim();

  /* ---- group stage: find rows where col[0] is 1–72 ---------------------- */
  function parseGroupStage(cells, cfg) {
    const validIds = new Set(cfg.matches.map(m => m.id));
    const scores = {};
    for (const row of cells) {
      const id = parseInt(row[0], 10);
      if (!id || !validIds.has(id)) continue;
      const h = parseInt(row[5], 10);
      const a = parseInt(row[6], 10);
      if (!isNaN(h) && !isNaN(a) && h >= 0 && a >= 0) {
        scores[id] = { h, a };
      }
    }
    return scores;
  }

  /* ---- bracket winner detection ----------------------------------------- */
  /*
   * The Excel bracket stores the actual knockout SCORES, laid out as:
   *     <matchId> , <team1> , <score1>      (one row)
   *                 <team2> , <score2>      (the row directly below)
   * e.g.  "74,Tyskland,1" then "Brasil,2"  =>  match 74 won by Brasil.
   * We locate each match by its id cell and read both score pairs, so the
   * winner is read straight from the sheet — no column-position guessing, and
   * immune to the third-place (Bronsefinale) match sharing the final column.
   */
  function parseBracket(cells, cfg) {
    const B = cfg.knockoutBracket;
    const validIds = new Set(Object.keys(B.matches).map(Number));

    const teamByNorm = {};
    (cfg.teams || []).forEach(t => { teamByNorm[norm(t.name)] = t.name; });
    const teamAt = (row, col) => (row && teamByNorm[norm(row[col])]) || '';

    // Layout: [id, team1, score1] on one row; [_, team2, score2] on the row below.
    // This is consistent across all rounds — no drift.
    const blocks = {};
    for (let r = 0; r < cells.length; r++) {
      const row = cells[r];
      for (let c = 16; c < row.length; c++) {
        const cell = (row[c] || '').trim();
        const id = parseInt(cell, 10);
        if (!id || String(id) !== cell || !validIds.has(id) || blocks[id]) continue;
        const below = cells[r + 1] || [];
        blocks[id] = {
          t1: teamAt(row,   c + 1), s1: parseInt(row[c + 2],   10),
          t2: teamAt(below, c + 1), s2: parseInt(below[c + 2], 10)
        };
      }
    }

    // Winner = higher score. If level (penalty shoot-out) or a score is blank,
    // fall back to whichever team also appears in the next match.
    const winners = {};
    Object.keys(blocks).forEach(idStr => {
      const id = +idStr, b = blocks[idStr];
      if (!b.t1 || !b.t2) return;                       // half-empty match
      let w = '';
      if (!isNaN(b.s1) && !isNaN(b.s2) && b.s1 !== b.s2) {
        w = b.s1 > b.s2 ? b.t1 : b.t2;
      } else {
        const nb = blocks[B.matches[id] && B.matches[id].next];
        if (nb) {
          if (nb.t1 === b.t1 || nb.t2 === b.t1) w = b.t1;
          else if (nb.t1 === b.t2 || nb.t2 === b.t2) w = b.t2;
        }
      }
      if (w) winners[id] = w;
    });

    return winners;
  }

  /* ---- public parse entry point ----------------------------------------- */
  function parse(csvText, cfg) {
    const cells = parseCSV(csvText);
    const matchScores = parseGroupStage(cells, cfg);
    const bracketWinners = parseBracket(cells, cfg);
    return { matchScores, bracketWinners };
  }

  /* ---- drag-drop UI ------------------------------------------------------ */
  function buildDropZone(container, cfg, onImport) {
    const el = App.el;

    const zone = el('div', { class: 'csv-drop-zone' }, []);
    zone.innerHTML = `
      <div class="csv-drop-inner">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span class="csv-drop-label">Slipp Excel-CSV her for å importere</span>
        <label class="btn btn-ghost btn-sm csv-file-label">
          Velg fil
          <input type="file" accept=".csv,.txt" class="csv-file-input" style="display:none">
        </label>
      </div>
    `;

    const preview = el('div', { class: 'csv-preview hidden' }, []);
    container.appendChild(zone);
    container.appendChild(preview);

    function handleFile(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const { matchScores, bracketWinners } = parse(e.target.result, cfg);
          showPreview(matchScores, bracketWinners);
        } catch (err) {
          showError('Kunne ikke lese filen: ' + err.message);
        }
      };
      reader.onerror = () => showError('Fil-lesing feilet.');
      reader.readAsText(file, 'windows-1252');
    }

    function showError(msg) {
      preview.className = 'csv-preview';
      preview.innerHTML =
        `<div class="card csv-result-card" style="border-color:var(--red)"><p class="muted">⚠️ ${App.escape(msg)}</p></div>`;
    }

    function showPreview(matchScores, bracketWinners) {
      const mCount = Object.keys(matchScores).length;
      const wCount = Object.keys(bracketWinners).length;

      preview.className = 'csv-preview';
      preview.innerHTML = '';

      const card = el('div', { class: 'card csv-result-card' }, []);

      const info = el('div', {}, []);
      info.innerHTML =
        `<p style="margin:0 0 .6rem"><strong>Forhåndsvisning</strong></p>` +
        `<p class="muted" style="margin:0 0 .9rem">` +
        `Fant <strong style="color:var(--text)">${mCount}</strong> kampresultat${mCount !== 1 ? 'er' : ''} ` +
        `og <strong style="color:var(--text)">${wCount}</strong> sluttspill-vinner${wCount !== 1 ? 'e' : ''}.` +
        (mCount === 0 && wCount === 0
          ? '<br><span style="color:var(--red)">Ingen data funnet — sjekk at filen er riktig CSV-format.</span>'
          : '') +
        `</p>`;
      card.appendChild(info);

      const btnRow = el('div', { class: 'btn-row' }, []);
      const cancelBtn = el('button', { class: 'btn btn-ghost' }, ['Avbryt']);
      const applyBtn = el('button', {
        class: 'btn btn-primary',
        disabled: (mCount === 0 && wCount === 0) ? 'true' : null
      }, ['Importer']);
      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(applyBtn);
      card.appendChild(btnRow);

      cancelBtn.addEventListener('click', () => {
        preview.innerHTML = '';
        preview.className = 'csv-preview hidden';
      });

      applyBtn.addEventListener('click', () => {
        onImport(matchScores, bracketWinners);
        preview.innerHTML =
          `<div class="card csv-result-card"><p>✅ Importert — ${mCount} kamper og ${wCount} vinnere ble fylt inn.</p></div>`;
        setTimeout(() => {
          preview.innerHTML = '';
          preview.className = 'csv-preview hidden';
        }, 4000);
      });

      preview.appendChild(card);
    }

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', e => { if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over'); });
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handleFile(e.dataTransfer.files[0]);
    });

    container.querySelector('.csv-file-input').addEventListener('change', function () {
      handleFile(this.files[0]);
      this.value = '';
    });
  }

  window.CsvImport = { parse, buildDropZone };
})();
