// Nastavení připojení k Supabase.
// Obojí najdeš v Supabase → Project Settings → API.
// "anon public" klíč je určený pro klienty — je v pořádku ho mít v kódu,
// data chrání Row Level Security (viz supabase/schema.sql).
//
// Když necháš obě hodnoty prázdné, appka běží v lokálním režimu
// (jen localStorage, bez rodiny a syncu) — stejně jako prototyp.

window.VS_CONFIG = {
  SUPABASE_URL: "https://mqqdgzihqesgpufoaqdi.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcWRnemlocWVzZ3B1Zm9hcWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjAyNzAsImV4cCI6MjEwNDQ5NjI3MH0.V0s0Wcyed9MdoaM5PxIYcLKtqpJYtXC2_POLZizcPe0",
};
