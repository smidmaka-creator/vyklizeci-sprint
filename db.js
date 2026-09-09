/* ============================================================
   db.js — datová vrstva Vyklízecího sprintu
   Dvě implementace stejného rozhraní:
     RemoteDB  → Supabase (domácnost, realtime sync, fotky ve Storage)
     LocalDB   → localStorage (bez configu; chování prototypu)
   app.js pracuje jen s `DB` a nezajímá ho, která to je.
   ============================================================ */
(() => {
  "use strict";

  const DAY = 86400000;
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 12));
  const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); };
  const yesterdayStr = () => { const d = new Date(Date.now() - DAY); return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0"); };

  // streak: společná logika pro obě implementace → vrátí nové hodnoty, nebo null když se nic nemění
  function nextStreak(p){
    const t = todayStr();
    if (p.streak_last === t) return null;
    return { streak_count: p.streak_last === yesterdayStr() ? (p.streak_count || 0) + 1 : 1, streak_last: t };
  }
  const streakAlive = p => !!p.streak_last && (p.streak_last === todayStr() || p.streak_last === yesterdayStr());

  /* ------------------------------------------------------------
     LocalDB
     ------------------------------------------------------------ */
  const LKEY = "vyklizeci-sprint-v2";

  class LocalDB {
    constructor(){ this.mode = "local"; this.household = { id: "local", name: "Můj byt", code: null }; this.listeners = new Set(); this._load(); }
    _load(){
      try { const r = localStorage.getItem(LKEY); this.s = r ? JSON.parse(r) : null; } catch(e){ this.s = null; }
      if (!this.s) this.s = { players: [], items: [], sprints: [], example: false };
    }
    _save(){ try { localStorage.setItem(LKEY, JSON.stringify(this.s)); } catch(e){ this._quota = true; } }
    _emit(){ this.listeners.forEach(fn => fn()); }
    onChange(fn){ this.listeners.add(fn); return () => this.listeners.delete(fn); }

    async init(){ return { needsHousehold: false }; }
    async refresh(){ /* vše je v paměti */ }

    // --- čtení (synchronní snapshoty) ---
    players(){ return this.s.players; }
    items(){ return this.s.items; }
    sprints(){ return this.s.sprints; }
    photoUrl(it){ return it.photo_path || null; }   // v local režimu je photo_path dataURL

    // --- seed ukázkových dat ---
    async seedExample(){
      const p1 = uid(), p2 = uid(), p3 = uid();
      const mk = (name, cat, cond, decision, extra={}) => ({
        id: uid(), name, cat, cond, photo_path: null, decision: decision || null, review_at: null,
        created_by: p1, decided_by: decision ? p1 : null, created_at: new Date().toISOString(),
        decided_at: decision ? new Date().toISOString() : null, position: Date.now() - Math.random()*1000, example: true, ...extra,
      });
      this.s.players = [
        { id: p1, name: "Ty",   xp: 120, streak_count: 2, streak_last: yesterdayStr(), color: 0, example: true },
        { id: p2, name: "Míša", xp: 90,  streak_count: 0, streak_last: null, color: 1, example: true },
        { id: p3, name: "Péťa", xp: 45,  streak_count: 0, streak_last: null, color: 2, example: true },
      ];
      this.s.items = [
        mk("Dětská softshellová bunda, vel. 104", "obleceni-detske", "dobre", null, { position: Date.now() + 3 }),
        mk("Kávovar Krups Dolce Gusto", "elektronika", "dobre", null, { position: Date.now() + 2 }),
        mk("LEGO Technic 42100 (nekompletní)", "hracka", "opotrebene", null, { position: Date.now() + 1 }),
        mk("Dámské džíny Levi's 501, vel. 30", "obleceni-damske", "jako-nove", "sell"),
        mk("Plyšový medvěd", "hracka", "dobre", "donate"),
        mk("Sada 6 hrnků IKEA", "nadobi", "dobre", "donate"),
        mk("Stolní ventilátor (nefunkční)", "elektronika", "opotrebene", "trash"),
        mk("Štos detektivek (8 ks)", "kniha", "dobre", "maybe", { review_at: new Date(Date.now() - 40*DAY).toISOString() }),
      ];
      this.s.sprints = [];
      this.s.example = true;
      this._save(); this._emit();
      return p1;
    }
    isExample(){ return !!this.s.example; }
    async wipeExample(){
      this.s.items = this.s.items.filter(i => !i.example);
      this.s.players = this.s.players.filter(p => !p.example);
      this.s.example = false; this._save(); this._emit();
    }
    async wipeAll(){ this.s = { players: [], items: [], sprints: [], example: false }; this._save(); this._emit(); }

    // --- hráči ---
    async addPlayer(name){ const p = { id: uid(), name, xp: 0, streak_count: 0, streak_last: null, color: this.s.players.length }; this.s.players.push(p); this._save(); this._emit(); return p; }
    async deletePlayer(id){ this.s.players = this.s.players.filter(p => p.id !== id); this._save(); this._emit(); }
    async awardXp(id, delta){ const p = this.s.players.find(x => x.id === id); if (p){ p.xp = Math.max(0, p.xp + delta); this._save(); this._emit(); } return p; }
    async touchStreak(id){ const p = this.s.players.find(x => x.id === id); if (!p) return; const n = nextStreak(p); if (n){ Object.assign(p, n); this._save(); this._emit(); } }

    // --- věci ---
    aiAvailable(){ return false; }
    async analyzePhoto(){ return null; }
    async addItem({ name, cat, cond, photoBlob, photoDataUrl, createdBy, ai }){
      const it = { id: uid(), name, cat, cond, photo_path: photoDataUrl || null, decision: null, review_at: null,
        price_lo: ai ? ai.price_lo : null, price_hi: ai ? ai.price_hi : null, advice: ai ? ai.advice : null, channel: ai ? ai.channel : null,
        created_by: createdBy || null, decided_by: null, created_at: new Date().toISOString(), decided_at: null, position: Date.now() };
      this.s.items.unshift(it); this._save(); this._emit();
      if (this._quota){ this._quota = false; throw new Error("quota"); }
      return it;
    }
    async decideItem(id, decision, byPlayer){
      const it = this.s.items.find(x => x.id === id); if (!it) return;
      it.decision = decision; it.decided_by = byPlayer || null; it.decided_at = new Date().toISOString();
      if (decision === "maybe" && !it.review_at) it.review_at = new Date(Date.now() + 182*DAY).toISOString();
      this._save(); this._emit();
    }
    async returnItem(id){ const it = this.s.items.find(x => x.id === id); if (it){ it.decision = null; it.decided_by = null; it.decided_at = null; it.position = Date.now(); this._save(); this._emit(); } }
    async skipItem(id){ const it = this.s.items.find(x => x.id === id); if (it){ it.position = Math.min(...this.s.items.filter(i => !i.decision).map(i => i.position)) - 1; this._save(); this._emit(); } }
    async updateItem(id, { name, cat, cond, ai, photoDataUrl }){
      const it = this.s.items.find(x => x.id === id); if (!it) return;
      Object.assign(it, { name, cat, cond, price_lo: ai ? ai.price_lo : null, price_hi: ai ? ai.price_hi : null, advice: ai ? ai.advice : null, channel: ai ? ai.channel : null });
      if (photoDataUrl) it.photo_path = photoDataUrl;
      this._save(); this._emit();
    }
    async deleteItem(id){ this.s.items = this.s.items.filter(x => x.id !== id); this._save(); this._emit(); }

    // --- sprinty ---
    async startSprint({ playerId, zone, minutes }){
      const sp = { id: uid(), player_id: playerId, zone, minutes, started_at: new Date().toISOString(),
        ends_at: new Date(Date.now() + minutes*60000).toISOString(), ended_at: null, resolved: 0, xp_gained: 0 };
      this.s.sprints.push(sp); this._save(); this._emit(); return sp;
    }
    async bumpSprint(id, delta){ const sp = this.s.sprints.find(x => x.id === id); if (sp){ sp.resolved = Math.max(0, sp.resolved + delta); this._save(); this._emit(); } }
    async endSprint(id, xpGained){ const sp = this.s.sprints.find(x => x.id === id); if (sp){ sp.ended_at = new Date().toISOString(); sp.xp_gained = xpGained; this._save(); this._emit(); } return sp; }
    sprintsDone(){ return this.s.sprints.filter(s => s.ended_at && s.resolved > 0).length; }

    // --- domácnost (v local režimu nic) ---
    async createHousehold(){ throw new Error("local"); }
    async joinHousehold(){ throw new Error("local"); }
    async leaveHousehold(){ /* noop */ }
  }

  /* ------------------------------------------------------------
     RemoteDB (Supabase)
     ------------------------------------------------------------ */
  class RemoteDB {
    constructor(url, key){
      this.mode = "remote";
      this.sb = window.supabase.createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } });
      this.household = null;
      this.cache = { players: [], items: [], sprints: [] };
      this.listeners = new Set();
      this.channel = null;
      this._pending = {};
    }
    onChange(fn){ this.listeners.add(fn); return () => this.listeners.delete(fn); }
    _emit(){ this.listeners.forEach(fn => fn()); }

    async init(){
      let { data: { session } } = await this.sb.auth.getSession();
      if (!session){
        const { data, error } = await this.sb.auth.signInAnonymously();
        if (error) throw new Error("Anonymní přihlášení selhalo: " + error.message + " (je v Supabase zapnuté Anonymous sign-ins?)");
        session = data.session;
      }
      const { data: hhs, error } = await this.sb.rpc("my_households");
      if (error) throw new Error("Nepodařilo se načíst domácnosti: " + error.message);
      const wanted = localStorage.getItem("vs.household");
      const hh = (hhs || []).find(h => h.id === wanted) || (hhs || [])[0] || null;
      if (!hh) return { needsHousehold: true };
      await this._enter(hh);
      return { needsHousehold: false };
    }
    async _enter(hh){
      this.household = hh;
      localStorage.setItem("vs.household", hh.id);
      await this.refresh();
      this._subscribe();
    }
    _subscribe(){
      if (this.channel) this.sb.removeChannel(this.channel);
      const f = "household_id=eq." + this.household.id;
      this.channel = this.sb.channel("hh:" + this.household.id);
      for (const table of ["items", "players", "sprints"]){
        this.channel.on("postgres_changes", { event: "*", schema: "public", table, filter: f }, () => this._refreshLater(table));
      }
      this.channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "households", filter: "id=eq." + this.household.id },
        p => { if (p.new){ this.household = p.new; this._emit(); } });
      this.channel.subscribe();
    }
    _refreshLater(table){
      clearTimeout(this._pending[table]);
      this._pending[table] = setTimeout(() => this.refresh(table).then(() => this._emit()), 120);
    }
    async refresh(table){
      const id = this.household.id;
      const jobs = [];
      if (!table || table === "players") jobs.push(this.sb.from("players").select("*").eq("household_id", id).order("created_at").then(r => { if (!r.error) this.cache.players = r.data; }));
      if (!table || table === "items")   jobs.push(this.sb.from("items").select("*").eq("household_id", id).order("position", { ascending: false }).then(r => { if (!r.error) this.cache.items = r.data; }));
      if (!table || table === "sprints") jobs.push(this.sb.from("sprints").select("*").eq("household_id", id).order("started_at", { ascending: false }).limit(50).then(r => { if (!r.error) this.cache.sprints = r.data; }));
      await Promise.all(jobs);
    }
    async _after(table){ await this.refresh(table); this._emit(); }

    players(){ return this.cache.players; }
    items(){ return this.cache.items; }
    sprints(){ return this.cache.sprints; }
    photoUrl(it){ return it.photo_path ? this.sb.storage.from("photos").getPublicUrl(it.photo_path).data.publicUrl : null; }

    isExample(){ return false; }
    async seedExample(){ return null; }
    async wipeExample(){}
    async wipeAll(){
      const id = this.household.id;
      await this.sb.from("items").delete().eq("household_id", id);
      await this.sb.from("sprints").delete().eq("household_id", id);
      await this.sb.from("players").update({ xp: 0, streak_count: 0, streak_last: null }).eq("household_id", id);
      await this._after();
    }

    // --- domácnost ---
    async createHousehold(name){
      const { data, error } = await this.sb.rpc("create_household", { p_name: name });
      if (error) throw new Error(error.message);
      await this._enter(data); return data;
    }
    async joinHousehold(code){
      const { data, error } = await this.sb.rpc("join_household", { p_code: code });
      if (error) throw new Error(error.message.includes("Kód") ? "Tenhle kód neexistuje." : error.message);
      await this._enter(data); return data;
    }
    async leaveHousehold(){
      if (this.channel) this.sb.removeChannel(this.channel);
      this.channel = null; this.household = null;
      localStorage.removeItem("vs.household");
      this.cache = { players: [], items: [], sprints: [] };
    }

    // --- hráči ---
    async addPlayer(name){
      const { data, error } = await this.sb.from("players").insert({ household_id: this.household.id, name, color: this.cache.players.length }).select().single();
      if (error) throw new Error(error.message);
      await this._after("players"); return data;
    }
    async deletePlayer(id){ await this.sb.from("players").delete().eq("id", id); await this._after("players"); }
    async awardXp(id, delta){
      const { data, error } = await this.sb.rpc("award_xp", { p_player: id, p_delta: delta });
      if (error) throw new Error(error.message);
      await this._after("players"); return data;
    }
    async touchStreak(id){
      const p = this.cache.players.find(x => x.id === id); if (!p) return;
      const n = nextStreak(p); if (!n) return;
      await this.sb.from("players").update(n).eq("id", id);
      await this._after("players");
    }

    // --- AI odhad z fotky (Edge Function analyze-item) ---
    aiAvailable(){ return true; }
    async analyzePhoto(blob){
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(blob);
      });
      const { data, error } = await this.sb.functions.invoke("analyze-item", { body: { image: b64, media_type: blob.type || "image/jpeg" } });
      if (error){
        let msg = error.message || "AI se neozvala";
        try { const j = await error.context.json(); if (j && j.error) msg = j.error; } catch(e){}
        throw new Error(msg);
      }
      if (!data || data.error) throw new Error((data && data.error) || "Prázdná odpověď AI");
      return data;
    }

    // --- věci ---
    async addItem({ name, cat, cond, photoBlob, createdBy, ai }){
      let photo_path = null;
      if (photoBlob){
        photo_path = this.household.id + "/" + uid() + ".jpg";
        const { error } = await this.sb.storage.from("photos").upload(photo_path, photoBlob, { contentType: "image/jpeg", upsert: false });
        if (error) throw new Error("Fotku se nepodařilo nahrát: " + error.message);
      }
      const { data, error } = await this.sb.from("items").insert({
        household_id: this.household.id, name, cat, cond, photo_path, created_by: createdBy || null, position: Date.now(),
        price_lo: ai ? ai.price_lo : null, price_hi: ai ? ai.price_hi : null, advice: ai ? ai.advice : null, channel: ai ? ai.channel : null,
      }).select().single();
      if (error) throw new Error(error.message);
      await this._after("items"); return data;
    }
    async decideItem(id, decision, byPlayer){
      const patch = { decision, decided_by: byPlayer || null, decided_at: new Date().toISOString() };
      const it = this.cache.items.find(x => x.id === id);
      if (decision === "maybe" && !(it && it.review_at)) patch.review_at = new Date(Date.now() + 182*DAY).toISOString();
      await this.sb.from("items").update(patch).eq("id", id);
      await this._after("items");
    }
    async returnItem(id){ await this.sb.from("items").update({ decision: null, decided_by: null, decided_at: null, position: Date.now() }).eq("id", id); await this._after("items"); }
    async updateItem(id, { name, cat, cond, ai, photoBlob }){
      const row = { name, cat, cond, price_lo: ai ? ai.price_lo : null, price_hi: ai ? ai.price_hi : null, advice: ai ? ai.advice : null, channel: ai ? ai.channel : null };
      const old = this.cache.items.find(x => x.id === id);
      if (photoBlob){
        row.photo_path = this.household.id + "/" + uid() + ".jpg";
        const { error } = await this.sb.storage.from("photos").upload(row.photo_path, photoBlob, { contentType: "image/jpeg", upsert: false });
        if (error) throw new Error("Fotku se nepodařilo nahrát: " + error.message);
      }
      const { error } = await this.sb.from("items").update(row).eq("id", id);
      if (error) throw new Error(error.message);
      if (photoBlob && old && old.photo_path) this.sb.storage.from("photos").remove([old.photo_path]).catch(() => {});
      await this._after("items");
    }
    async deleteItem(id){
      const old = this.cache.items.find(x => x.id === id);
      const { error } = await this.sb.from("items").delete().eq("id", id);
      if (error) throw new Error(error.message);
      if (old && old.photo_path) this.sb.storage.from("photos").remove([old.photo_path]).catch(() => {});
      await this._after("items");
    }
    async skipItem(id){
      const pend = this.cache.items.filter(i => !i.decision);
      const min = Math.min(...pend.map(i => Number(i.position)));
      await this.sb.from("items").update({ position: min - 1 }).eq("id", id);
      await this._after("items");
    }

    // --- sprinty ---
    async startSprint({ playerId, zone, minutes }){
      const { data, error } = await this.sb.from("sprints").insert({
        household_id: this.household.id, player_id: playerId, zone, minutes, ends_at: new Date(Date.now() + minutes*60000).toISOString(),
      }).select().single();
      if (error) throw new Error(error.message);
      await this._after("sprints"); return data;
    }
    async bumpSprint(id, delta){
      const sp = this.cache.sprints.find(x => x.id === id); if (!sp) return;
      await this.sb.from("sprints").update({ resolved: Math.max(0, sp.resolved + delta) }).eq("id", id);
      await this._after("sprints");
    }
    async endSprint(id, xpGained){
      const { data } = await this.sb.from("sprints").update({ ended_at: new Date().toISOString(), xp_gained: xpGained }).eq("id", id).select().single();
      await this._after("sprints"); return data;
    }
    sprintsDone(){ return this.cache.sprints.filter(s => s.ended_at && s.resolved > 0).length; }
  }

  /* ------------------------------------------------------------
     výběr implementace
     ------------------------------------------------------------ */
  function createDB(){
    const cfg = window.VS_CONFIG || {};
    if (cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase){
      return new RemoteDB(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    }
    return new LocalDB();
  }

  window.VS_DB = { createDB, streakAlive, todayStr };
})();
