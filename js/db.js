/* =============================================================================
 *  db.js  —  thin data layer over Supabase.
 *
 *  Exposes window.DB with async methods used by every page. If Supabase keys
 *  have not been filled in yet (supabase-config.js still has placeholders), it
 *  transparently falls back to the browser's localStorage so you can try the
 *  site locally before wiring up the database.
 * ===========================================================================*/
(function () {
  const urlSet =
    window.SUPABASE_URL &&
    !String(window.SUPABASE_URL).includes("PASTE_") &&
    window.SUPABASE_ANON_KEY &&
    !String(window.SUPABASE_ANON_KEY).includes("PASTE_");

  const USING_SUPABASE = !!(urlSet && window.supabase);
  let sb = null;
  if (USING_SUPABASE) {
    sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  }

  /* ---------- localStorage fallback helpers ---------- */
  const LS = {
    config: "vmtipp_config",
    answer: "vmtipp_answer_key",
    entries: "vmtipp_entries"
  };
  const lsGet = (k, def) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; }
  };
  const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const uuid = () =>
    (crypto.randomUUID && crypto.randomUUID()) ||
    "id-" + Date.now() + "-" + Math.random().toString(16).slice(2);

  const DB = {
    usingSupabase: USING_SUPABASE,

    /* ---------------- CONFIG ---------------- */
    async getConfig() {
      if (USING_SUPABASE) {
        const { data, error } = await sb
          .from("app_config").select("data, answer_key").eq("id", 1).single();
        if (error) throw error;
        const cfg = data && data.data && Object.keys(data.data).length ? data.data : null;
        return { config: cfg, answerKey: (data && data.answer_key) || {} };
      }
      return { config: lsGet(LS.config, null), answerKey: lsGet(LS.answer, {}) };
    },

    async saveConfig(config) {
      if (USING_SUPABASE) {
        const { error } = await sb
          .from("app_config")
          .upsert({ id: 1, data: config, updated_at: new Date().toISOString() });
        if (error) throw error;
      } else {
        lsSet(LS.config, config);
      }
    },

    async saveAnswerKey(answerKey) {
      if (USING_SUPABASE) {
        const { error } = await sb
          .from("app_config")
          .upsert({ id: 1, answer_key: answerKey, updated_at: new Date().toISOString() });
        if (error) throw error;
      } else {
        lsSet(LS.answer, answerKey);
      }
    },

    /* ---------------- ENTRIES ---------------- */
    async listEntries() {
      if (USING_SUPABASE) {
        const { data, error } = await sb
          .from("entries").select("*").order("total", { ascending: false });
        if (error) throw error;
        return data || [];
      }
      return lsGet(LS.entries, []).sort((a, b) => (b.total || 0) - (a.total || 0));
    },

    async createEntry(entry) {
      const row = {
        name: entry.name,
        gruppe: entry.gruppe || "",
        predictions: entry.predictions || {},
        scores: {},
        total: 0,
        published: true
      };
      if (USING_SUPABASE) {
        const { data, error } = await sb.from("entries").insert(row).select().single();
        if (error) throw error;
        return data;
      }
      row.id = uuid();
      row.created_at = new Date().toISOString();
      const all = lsGet(LS.entries, []);
      all.push(row);
      lsSet(LS.entries, all);
      return row;
    },

    async updateEntry(id, patch) {
      patch = { ...patch, updated_at: new Date().toISOString() };
      if (USING_SUPABASE) {
        const { data, error } = await sb
          .from("entries").update(patch).eq("id", id).select().single();
        if (error) throw error;
        return data;
      }
      const all = lsGet(LS.entries, []);
      const i = all.findIndex((e) => e.id === id);
      if (i >= 0) { all[i] = { ...all[i], ...patch }; lsSet(LS.entries, all); return all[i]; }
      return null;
    },

    async deleteEntry(id) {
      if (USING_SUPABASE) {
        const { error } = await sb.from("entries").delete().eq("id", id);
        if (error) throw error;
      } else {
        lsSet(LS.entries, lsGet(LS.entries, []).filter((e) => e.id !== id));
      }
    }
  };

  window.DB = DB;
})();
