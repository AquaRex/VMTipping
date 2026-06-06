/* =============================================================================
 * presets/fifa-worldcup.js — "FIFA World Cup" knockout preset (48 teams, 12 groups)
 *
 * The bracket structure + scoring rounds are taken straight from DEFAULT_CONFIG
 * (config.js) so this preset never drifts from the canonical 2026 setup.
 *
 * Third-place assignment for the 12-group / 8-thirds format is handled by the
 * built-in FIFA Annexe C table inside tournament.js (engaged automatically when
 * there are 12 groups), so this preset carries no thirdPlaceTable of its own.
 *
 * Requires config.js to be loaded first.
 * =========================================================================== */
(function () {
  window.BRACKET_PRESETS = window.BRACKET_PRESETS || {};
  const def = window.DEFAULT_CONFIG || {};
  window.BRACKET_PRESETS["fifa-worldcup"] = {
    name: "FIFA World Cup (48 lag, 12 grupper)",
    groupCount: 12,
    // deep-copied at apply time by the admin panel
    knockoutBracket: def.knockoutBracket,
    knockoutRounds: def.knockoutRounds
    // thirdPlaceColumns / thirdPlaceTable: none — engine uses built-in Annexe C
  };
})();
