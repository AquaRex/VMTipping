/* =============================================================================
 *  supabase-config.js  —  PASTE YOUR SUPABASE KEYS HERE
 * -----------------------------------------------------------------------------
 *  1. Go to https://supabase.com  ->  your project
 *  2. Settings (gear)  ->  API
 *  3. Copy "Project URL"  and  the "anon public" key
 *  4. Paste them below, between the quotes, and save the file.
 *
 *  The anon key is SAFE to put in a public website — that is what it's for.
 *  See README.md for the full step-by-step guide.
 * ===========================================================================*/

window.SUPABASE_URL  = "https://gmxydynthqgsmvkszzba.supabase.co";      // e.g. https://abcd1234.supabase.co
window.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdteHlkeW50aHFnc212a3N6emJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3MzMzMDEsImV4cCI6MjA5NjMwOTMwMX0.hv5ORZSEa6iWH_IFLtALo7KDKqt-1M1kM3apTJI9_d0";

/* Admin password for the configuration / scoring page. Change if you like. */
window.ADMIN_PASSWORD = "4054";

/* -----------------------------------------------------------------------------
 *  API-Football key (https://www.api-football.com) — OPTIONAL.
 *  Used ONLY by the «Hent spillere fra API» button in admin, to fill the
 *  searchable player list automatically. The result is saved to the database,
 *  so vanlige besøkende henter aldri fra API-et selv.
 *  Free plan: maks 10 kall/minutt og 100 kall/dag — derfor: ikke spam knappen!
 *  La stå "" for å skjule knappen og bruke den manuelle listen i stedet.
 * ---------------------------------------------------------------------------*/
window.API_FOOTBALL_KEY = "aefd3025bf4ca70d32fc9306abfb0e0f";
