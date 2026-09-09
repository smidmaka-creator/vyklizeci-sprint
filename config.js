// Nastavení připojení k Supabase.
// Obojí najdeš v Supabase → Project Settings → API.
// "anon public" klíč je určený pro klienty — je v pořádku ho mít v kódu,
// data chrání Row Level Security (viz supabase/schema.sql).
//
// Když necháš obě hodnoty prázdné, appka běží v lokálním režimu
// (jen localStorage, bez rodiny a syncu) — stejně jako prototyp.

window.VS_CONFIG = {
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",
};
