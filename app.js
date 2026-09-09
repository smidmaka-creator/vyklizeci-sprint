/* ============================================================
   app.js — UI a herní logika Vyklízecího sprintu
   Data řeší db.js (LocalDB / RemoteDB), tady jen render + akce.
   ============================================================ */
(() => {
  "use strict";
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DAY = 86400000;
  const $ = (s, r=document) => r.querySelector(s);
  const kcR = (a, b) => Math.round(a).toLocaleString("cs-CZ") + "–" + Math.round(b).toLocaleString("cs-CZ") + " Kč";
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const plural = (n, a) => a[n === 1 ? 0 : (n >= 2 && n <= 4 ? 1 : 2)];
  const nVeci = n => n + " " + plural(n, ["věc", "věci", "věcí"]);
  const { streakAlive } = window.VS_DB;

  /* ---------- ikony ---------- */
  const P = {
    shirt:'<path d="M8 3l1.6 2A3 3 0 0 0 15 5L16.5 3 21 6l-2.5 4L16 8.6V21H8V8.6L5.5 10 3 6z"/>',
    toy:'<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="8.5" y="13.5" width="7" height="7" rx="1"/>',
    plug:'<path d="M9 3v4M15 3v4M6 7h12v3a6 6 0 0 1-12 0zM12 16v5"/>',
    book:'<path d="M6 3h10a1 1 0 0 1 1 1v15H8a2 2 0 0 0-2 2V4a1 1 0 0 1 1-1zM6 19a2 2 0 0 0 2 2h9"/>',
    cup:'<path d="M4 8h13v4a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M7 3v2M11 3v2"/>',
    vase:'<path d="M8 3h8l-1.2 3.8A6 6 0 0 1 18 12c0 4.5-3 9-6 9s-6-4.5-6-9a6 6 0 0 1 3.2-5.2z"/>',
    chair:'<path d="M7 3v8M17 3v8M5 11h14M6 11l1.2 6M18 11l-1.2 6M8.5 21l.8-4M15.5 21l-.8-4"/>',
    ball:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.5 3 3.5 15 0 18M12 3c-3.5 3-3.5 15 0 18"/>',
    box:'<path d="M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8"/>',
    home:'<path d="M4 11l8-7 8 7M6 10v10h12V10"/>',
    tag:'<path d="M4 4h7l9 9-7 7-9-9zM8 8h.01"/>',
    gift:'<path d="M4 9h16v11H4zM4 9l2-5c1.6-.6 3.4 0 4 1.6L12 9M20 9l-2-5c-1.6-.6-3.4 0-4 1.6L12 9M12 9v11"/>',
    bin:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 3v2M12 19v2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M3 12h2M19 12h2M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4"/>',
    flame:'<path d="M12 3c1 3-2 4-2 7a3 3 0 0 0 6 .3C16 6 12 6 12 3zM8.5 11c-.6 1-1 2.2-1 3.5a4.5 4.5 0 0 0 9 0c0-1-.2-1.8-.5-2.5"/>',
    leaf:'<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14zM5 19l7-7"/>',
    check:'<path d="M4 12l5 5L20 6"/>',
    bolt:'<path d="M13 3L4 14h7l-1 7 9-11h-7z"/>',
    photo:'<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 16l-5-4-9 7"/>',
    skip:'<path d="M5 5l9 7-9 7zM19 5v14"/>',
    users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-5-6.3"/>',
    copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    wifi:'<path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01"/>',
    sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    pencil:'<path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17zM13 8l3 3"/>',
    refresh:'<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  };
  const ic = (n, cls="") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n]||""}</svg>`;

  /* ---------- doména ---------- */
  const CATS = [
    {id:"obleceni-damske", short:"Dámské obl.", icon:"shirt", base:190},
    {id:"obleceni-panske", short:"Pánské obl.", icon:"shirt", base:160},
    {id:"obleceni-detske", short:"Dětské obl.", icon:"shirt", base:80},
    {id:"hracka",          short:"Hračka",      icon:"toy",   base:150},
    {id:"elektronika",     short:"Elektro",     icon:"plug",  base:520},
    {id:"kniha",           short:"Kniha",       icon:"book",  base:55},
    {id:"nadobi",          short:"Nádobí",      icon:"cup",   base:110},
    {id:"dekorace",        short:"Dekorace",    icon:"vase",  base:95},
    {id:"nabytek",         short:"Nábytek",     icon:"chair", base:750},
    {id:"sport",           short:"Sport",       icon:"ball",  base:300},
    {id:"jine",            short:"Jiné",        icon:"box",   base:120},
  ];
  const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
  const CONDS = [
    {id:"jako-nove",  label:"Jako nové",  mult:1.3},
    {id:"dobre",      label:"Dobrý stav", mult:1.0},
    {id:"opotrebene", label:"Opotřebené", mult:0.5},
  ];
  const COND = Object.fromEntries(CONDS.map(c => [c.id, c]));
  const DEC = {
    keep:   {label:"Nechat",  verb:"Zůstává doma",              icon:"home",  cvar:"--keep"},
    sell:   {label:"Prodat",  verb:"Putuje na prodej",           icon:"tag",   cvar:"--sell"},
    donate: {label:"Darovat", verb:"Jde darovat",                icon:"gift",  cvar:"--donate"},
    trash:  {label:"Vyhodit", verb:"Míří do tříděného odpadu",    icon:"bin",   cvar:"--trash"},
    maybe:  {label:"Krabice na rok", verb:"Uloženo do krabice na rok", icon:"clock", cvar:"--maybe"},
  };
  const LEVELS = [
    {min:0,name:"Nováček"},{min:150,name:"Vyklízeč"},{min:400,name:"Uklizeno"},
    {min:850,name:"Minimalista"},{min:1500,name:"Mistr prostoru"},
  ];
  const ZONES = ["Skříň","Dětský pokoj","Kuchyň","Koupelna","Chodba","Sklep / komora","Celý byt"];
  const AV_COLORS = ["var(--green)","var(--salmon)","var(--keep)","var(--gold)","var(--maybe)","var(--trash)"];

  // midOverride: ručně zadaná cena → doporučení se spočítá k ní, ne k tabulce
  function estimate(catId, condId, midOverride){
    const c = CAT[catId] || CAT.jine;
    const k = (COND[condId] || COND.dobre).mult;
    const mid = midOverride != null ? midOverride : Math.round(c.base * k);
    const lo = Math.max(0, Math.round(mid * 0.6 / 10) * 10);
    const hi = Math.round(mid * 1.45 / 10) * 10;
    let advice, channel;
    const softCats = ["kniha","obleceni-detske","nadobi","dekorace","obleceni-panske","obleceni-damske","hracka"];
    if (condId === "opotrebene" && catId === "elektronika") { advice = "Ověř, že funguje. Nefunkční → sběrný dvůr."; channel = "trash"; }
    else if (condId === "opotrebene" && softCats.includes(catId)) { advice = "Na prodej se čas nevyplatí — darovat."; channel = "donate"; }
    else if (mid < 110) { advice = "Výtěžek nepokryje focení a balení — darovat."; channel = "donate"; }
    else if (mid <= 400) { advice = "Vyplatí se na Vinted nebo Bazoš."; channel = "sell"; }
    else { advice = "Vyšší hodnota — zkus Bazoš / Marketplace."; channel = "sell"; }
    return {lo, hi, mid, advice, channel};
  }
  // odhad pro konkrétní věc: přednost má AI odhad z fotky uložený na věci, jinak heuristika
  function estimateFor(it){
    if (it.price_lo != null && it.price_hi != null){
      const h = estimate(it.cat, it.cond);
      return { lo: it.price_lo, hi: it.price_hi, mid: (it.price_lo + it.price_hi) / 2,
               advice: it.advice || h.advice, channel: it.channel || h.channel, ai: true };
    }
    return estimate(it.cat, it.cond);
  }
  function levelOf(xp){
    let i = 0;
    LEVELS.forEach((l, idx) => { if (xp >= l.min) i = idx; });
    const next = LEVELS[i+1];
    return { idx:i, name:LEVELS[i].name, into:xp - LEVELS[i].min,
             span: next ? next.min - LEVELS[i].min : null, toNext: next ? next.min - xp : null };
  }

  /* ---------- stav ---------- */
  const DB = window.VS_DB.createDB();
  let ready = false;
  let meId = null;
  let animating = false;
  let curPileKey = null;
  let sprintTimer = null;
  const seenHint = () => localStorage.getItem("vs.seenHint") === "1";
  const playerKey = () => "vs.player." + (DB.household ? DB.household.id : "local");

  const players = () => DB.players();
  const items = () => DB.items();
  const pending = () => items().filter(i => !i.decision);
  const countBy = d => items().filter(i => i.decision === d).length;
  const me = () => players().find(p => p.id === meId) || null;
  const initials = n => (String(n).trim()[0] || "?").toUpperCase();
  const avColor = p => AV_COLORS[(p.color ?? Math.max(0, players().indexOf(p))) % AV_COLORS.length];
  const activeSprints = () => DB.sprints().filter(s => !s.ended_at && new Date(s.ends_at).getTime() > Date.now());
  const mySprint = () => activeSprints().find(s => s.player_id === meId) || null;
  const secondsLeft = s => Math.max(0, Math.round((new Date(s.ends_at).getTime() - Date.now()) / 1000));
  const fmtClock = s => Math.floor(s/60) + ":" + String(s%60).padStart(2,"0");

  /* ---------- render ---------- */
  function render(){
    if (!ready) return;
    if (!me()){ renderTopbar(); $("#scroll").innerHTML = ""; renderDock(); if (!$(".overlay")) sheetPickPlayer(true); return; }
    renderTopbar();
    renderScroll();
    renderDock();
    syncSprintTimer();
  }

  function renderTopbar(){
    const p = me();
    const lv = levelOf(p ? p.xp : 0);
    const fill = lv.span ? Math.min(100, Math.round(lv.into / lv.span * 100)) : 100;
    const alive = p ? streakAlive(p) : false;
    $("#topbar").innerHTML = `
      <div class="topbar__row">
        <div class="wordmark">${ic("leaf")} Vyklízecí <em>sprint</em></div>
        ${DB.mode === "remote" ? `<button class="iconbtn" data-act="household" aria-label="Domácnost" title="${esc(DB.household?.name || "")}">${ic("users")}</button>` : ""}
        <button class="iconbtn" data-act="add" aria-label="Přidat věc">${ic("plus")}</button>
        <button class="iconbtn" data-act="settings" aria-label="Nastavení">${ic("gear")}</button>
      </div>
      <div class="statrow">
        <button class="pchip" data-act="players">
          <span class="av" style="background:${p ? avColor(p) : "var(--maybe)"}">${esc(p ? initials(p.name) : "?")}</span>${esc(p ? p.name : "Kdo hraje?")} <span class="car">▾</span>
        </button>
        <span class="sticker ${alive?"":"dead"}" title="Série dní v řadě">${ic("flame")}${alive ? p.streak_count : 0}</span>
        <span class="xp">
          <span class="xp__meta"><b>${esc(lv.name)}</b><span>${lv.toNext!=null?("ještě "+lv.toNext+" XP"):"MAX"}</span></span>
          <span class="xp__bar"><span class="xp__fill" style="width:${fill}%"></span></span>
        </span>
      </div>`;
  }

  function cardMarkup(it, top){
    const c = CAT[it.cat] || CAT.jine;
    const e = estimateFor(it);
    const url = DB.photoUrl(it);
    const photo = url ? `<img src="${esc(url)}" alt="" loading="lazy">` : `<span class="bigic">${ic(c.icon)}</span>`;
    const stamps = top ? `
      <div class="stamp" data-dir="keep">Nechat</div>
      <div class="stamp" data-dir="sell">Prodat</div>
      <div class="stamp" data-dir="trash">Vyhodit</div>
      <div class="stamp" data-dir="donate">Darovat</div>` : "";
    const by = players().find(p => p.id === it.created_by);
    const byTag = by && by.id !== meId ? `<span class="tag">přidal/a ${esc(by.name)}</span>` : "";
    return `<article class="card ${top?"card--top":"card--behind"}" ${top?'tabindex="0" aria-label="Karta věci: '+esc(it.name)+'"':""}>
      <div class="card__photo">${photo}
        <span class="price"><span class="dot" style="background:var(${DEC[e.channel].cvar})"></span>${kcR(e.lo, e.hi)}${e.ai ? ic("sparkle") : ""}</span>
        ${stamps}
      </div>
      <div class="card__body">
        <div class="card__name">${esc(it.name)}</div>
        <div class="tags">
          <span class="tag">${ic(c.icon)}${esc(c.short)}</span>
          <span class="tag">${esc((COND[it.cond]||COND.dobre).label)}</span>
          ${byTag}
        </div>
        <div class="advice">${esc(e.advice)}</div>
      </div>
    </article>`;
  }

  function stageMarkup(){
    const pend = pending();
    if (!pend.length){
      return `<div class="emptystate">
        <div class="big">${ic("check")}</div>
        <h3>Stack je prázdný!</h3>
        <p>Každá věc má jasno. Přidej další, nebo si dej vyklízecí sprint.</p>
      </div>`;
    }
    const cards = [];
    if (pend[1]) cards.push(cardMarkup(pend[1], false));
    cards.push(cardMarkup(pend[0], true));
    const hint = !seenHint() ? `<div class="hint">Táhni kartu do stran, nebo ťukni na volbu níž</div>` : "";
    return `<div class="stage"><div class="blob"></div><div class="cardstack">${cards.join("")}${hint}</div></div>
      <div class="decisions">
        <button class="dbtn press" style="--h:var(--keep);--edge:var(--keep-dark)"     data-decide="keep">${ic("home")}Nechat<small>${nVeci(countBy("keep"))}</small></button>
        <button class="dbtn press" style="--h:var(--sell);--edge:var(--sell-dark)"     data-decide="sell">${ic("tag")}Prodat<small>${nVeci(countBy("sell"))}</small></button>
        <button class="dbtn press" style="--h:var(--donate);--edge:var(--donate-dark)" data-decide="donate">${ic("gift")}Darovat<small>${nVeci(countBy("donate"))}</small></button>
        <button class="dbtn press" style="--h:var(--trash);--edge:var(--trash-dark)"   data-decide="trash">${ic("bin")}Vyhodit<small>${nVeci(countBy("trash"))}</small></button>
      </div>
      <div class="subrow">
        <button class="linkbtn" data-decide="maybe">${ic("clock")}Do krabice na rok</button>
        <button class="linkbtn" data-act="edit">${ic("pencil")}Upravit</button>
        <button class="linkbtn" data-act="skip">${ic("skip")}Přeskočit</button>
      </div>`;
  }

  function pilesMarkup(){
    const rows = [["keep","Nechat"],["sell","Prodat"],["donate","Darovat"],["trash","Vyhodit"]]
      .map(([k,l]) => `<button class="pile" style="--h:var(${DEC[k].cvar})" data-pile="${k}"><b>${countBy(k)}</b><span>${l}</span></button>`).join("");
    const maybeItems = items().filter(i => i.decision === "maybe");
    let year = "";
    if (maybeItems.length){
      const overdue = maybeItems.filter(i => i.review_at && new Date(i.review_at).getTime() < Date.now()).length;
      year = `<button class="yearbox ${overdue?"warn":""}" data-pile="maybe">
        <span>
          <span class="t">Krabice na rok · ${nVeci(maybeItems.length)}</span>
          <span class="s">${overdue ? overdue+" čeká moc dlouho — čas rozhodnout" : "Připomene se, až uplyne půl roku"}</span>
        </span><span class="go">→</span></button>`;
    }
    return `<div class="sec"><h2>Rozhodnuto</h2><div class="pilerow">${rows}</div>${year}</div>`;
  }

  function boardMarkup(){
    const ranked = [...players()].sort((a,b) => b.xp - a.xp);
    const live = activeSprints();
    return `<div class="sec"><h2>Rodinný žebříček</h2><div class="board">${
      ranked.map((p,i) => {
        const sp = live.find(s => s.player_id === p.id);
        const liveTag = sp ? `<span class="live">${ic("bolt")}${esc(sp.zone)} · <b data-live="${sp.id}">${fmtClock(secondsLeft(sp))}</b></span>` : "";
        const fl = streakAlive(p) && p.streak_count > 0 ? `<span class="fl">${ic("flame")}${p.streak_count}</span>` : "";
        return `<div class="brow ${p.id===meId?"me":""}">
          <span class="av" style="background:${avColor(p)}">${i<3 ? ["🥇","🥈","🥉"][i] : esc(initials(p.name))}</span>
          <span class="nm">${esc(p.name)}${liveTag}</span>
          ${fl}
          <span class="xpv">${p.xp} XP</span></div>`;
      }).join("")
    }</div></div>`;
  }

  function renderScroll(){
    const banner = DB.isExample()
      ? `<div class="demobanner"><span>Hraješ na ukázkových datech.</span><button data-act="settings">Vymazat</button></div>`
      : "";
    $("#scroll").innerHTML = banner + stageMarkup() + pilesMarkup() + boardMarkup() + `<div style="height:12px"></div>`;
    wireCard();
  }

  function renderDock(){
    const dock = $("#dock");
    const sp = mySprint();
    if (sp){
      dock.innerHTML = `<div class="sprintbar">
        ${ic("bolt")}
        <span class="clock">${fmtClock(secondsLeft(sp))}</span>
        <span class="z">${esc(sp.zone)} · vyřešeno <b data-resolved>${sp.resolved}</b></span>
        <button data-act="endsprint">Konec</button>
      </div>`;
    } else if (pending().length){
      dock.innerHTML = `
        <button class="btn btn--accent press" data-act="sprint">${ic("bolt")}Spustit sprint</button>
        <button class="btn btn--ghost btn--round" data-act="add" aria-label="Přidat věc">${ic("plus")}</button>`;
    } else {
      dock.innerHTML = `
        <button class="btn btn--accent press" data-act="add">${ic("plus")}Přidat věc</button>
        <button class="btn btn--ghost" data-act="sprint">${ic("bolt")}Sprint</button>`;
    }
  }

  /* ---------- karta: drag & rozhodnutí ---------- */
  function wireCard(){
    const card = $(".card--top");
    if (!card) return;
    const stamps = card.querySelectorAll(".stamp");
    let sx=0, sy=0, dx=0, dy=0, dragging=false;
    const dirOf = () => Math.abs(dx) > Math.abs(dy) ? (dx>0?"sell":"trash") : (dy>0?"donate":"keep");
    const clearStamps = () => stamps.forEach(s => s.style.opacity = 0);
    card.addEventListener("pointerdown", e => { dragging = true; sx = e.clientX; sy = e.clientY; dx = dy = 0; card.setPointerCapture(e.pointerId); card.style.transition = "none"; });
    card.addEventListener("pointermove", e => {
      if (!dragging) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      card.style.transform = `translate(${dx}px,${dy}px) rotate(${dx*0.05}deg)`;
      const d = dirOf(), dist = Math.hypot(dx, dy);
      stamps.forEach(s => s.style.opacity = s.dataset.dir === d ? Math.min(1, (dist-20)/80) : 0);
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      const d = dirOf(), dist = Math.hypot(dx, dy);
      if (dist > 92) flyOut(card, d, dx, dy);
      else { card.style.transition = "transform .26s cubic-bezier(.2,.8,.2,1)"; card.style.transform = ""; clearStamps(); }
    };
    card.addEventListener("pointerup", end);
    card.addEventListener("pointercancel", () => { dragging = false; card.style.transition = "transform .2s"; card.style.transform = ""; clearStamps(); });
    card.addEventListener("keydown", e => {
      const map = {"1":"keep","2":"sell","3":"donate","4":"trash","5":"maybe", ArrowUp:"keep", ArrowRight:"sell", ArrowDown:"donate", ArrowLeft:"trash"};
      if (map[e.key]){ e.preventDefault(); e.stopPropagation(); pressDecide(map[e.key]); }
    });
  }
  function flyOut(card, decision, dx, dy){
    if (animating) return;
    animating = true;
    if (RM){ decide(decision); return; }
    const ux = dx || (decision==="sell"?1:decision==="trash"?-1:0);
    const uy = dy || (decision==="keep"?-1:decision==="donate"?1:0);
    const m = 760 / (Math.hypot(ux,uy) || 1);
    card.style.transition = "transform .34s ease-out, opacity .34s ease-out";
    card.style.transform = `translate(${ux*m}px,${uy*m}px) rotate(${(dx||ux*40)*0.08}deg)`;
    card.style.opacity = "0";
    let done = false;
    const go = () => { if (done) return; done = true; decide(decision); };
    card.addEventListener("transitionend", go, {once:true});
    setTimeout(go, 420);
  }
  function pressDecide(decision){
    if (animating) return;
    const card = $(".card--top");
    if (!card || RM){ decide(decision); return; }
    const v = {keep:[0,-1], sell:[1,0], donate:[0,1], trash:[-1,0], maybe:[0,1]}[decision] || [1,0];
    flyOut(card, decision, v[0]*120, v[1]*120);
  }

  async function decide(decision){
    const it = pending()[0], p = me();
    if (!it || !p){ animating = false; return; }
    const sp = mySprint();
    const gain = 10 + (sp ? 5 : 0);
    const beforeLv = levelOf(p.xp).idx;
    localStorage.setItem("vs.seenHint", "1");
    try {
      await DB.decideItem(it.id, decision, p.id);
      const after = await DB.awardXp(p.id, gain);
      await DB.touchStreak(p.id);
      if (sp) await DB.bumpSprint(sp.id, +1);
      animating = false;
      render();
      if (after && levelOf(after.xp).idx > beforeLv){ confetti(); toast(`Level up · ${levelOf(after.xp).name}!`); }
      else toast(`${DEC[decision].verb} · +${gain} XP`, "Zpět", () => undo(it.id, p.id, gain, sp ? sp.id : null));
    } catch(e){ animating = false; render(); toast("Nepovedlo se uložit: " + e.message); }
  }
  async function undo(itemId, playerId, gain, sprintId){
    try {
      await DB.returnItem(itemId);
      await DB.awardXp(playerId, -gain);
      if (sprintId) await DB.bumpSprint(sprintId, -1);
      render();
    } catch(e){ toast("Zpět se nepovedlo: " + e.message); }
  }

  /* ---------- sprint ---------- */
  function syncSprintTimer(){
    const any = activeSprints().length > 0;
    if (!any){ clearInterval(sprintTimer); sprintTimer = null; return; }
    if (sprintTimer) return;
    sprintTimer = setInterval(() => {
      const mine = mySprint();
      const clock = $("#dock .clock");
      if (mine && clock) clock.textContent = fmtClock(secondsLeft(mine));
      document.querySelectorAll("[data-live]").forEach(el => {
        const s = DB.sprints().find(x => x.id === el.dataset.live);
        if (s) el.textContent = fmtClock(secondsLeft(s));
      });
      // můj sprint vypršel → ukončit
      const expired = DB.sprints().find(s => s.player_id === meId && !s.ended_at && new Date(s.ends_at).getTime() <= Date.now());
      if (expired) finishSprint(expired);
      // cizí sprint vypršel → jen překreslit
      if (activeSprints().length === 0){ clearInterval(sprintTimer); sprintTimer = null; render(); }
    }, 1000);
  }
  async function finishSprint(sp){
    const p = me();
    const alreadyEnding = sp._ending; if (alreadyEnding) return; sp._ending = true;
    let bonus = 0;
    try {
      if (sp.resolved > 0){ bonus = 25; await DB.awardXp(p.id, bonus); }
      const gained = sp.resolved * 15 + bonus;
      await DB.endSprint(sp.id, gained);
      render();
      if (sp.resolved > 0) confetti();
      openSheet(`
        <div class="sheet__grip"></div>
        <h3>${sp.resolved > 0 ? "Sprint hotový 💪" : "Sprint ukončen"}</h3>
        <p class="sub">${esc(sp.zone)} · ${sp.minutes} min</p>
        <div class="list">
          <div class="li"><span class="li__ph">${ic("check")}</span><div class="li__t"><div class="li__n">Vyřešeno kusů</div><div class="li__s">během sprintu</div></div><b class="num">${sp.resolved}</b></div>
          <div class="li"><span class="li__ph">${ic("bolt")}</span><div class="li__t"><div class="li__n">Získáno XP</div><div class="li__s">${bonus?("+"+bonus+" bonus za dokončení"):"bez bonusu"}</div></div><b class="num">+${gained}</b></div>
          <div class="li"><span class="li__ph">${ic("flame")}</span><div class="li__t"><div class="li__n">Série</div><div class="li__s">dní v řadě</div></div><b class="num">${p && streakAlive(p) ? p.streak_count : 0}</b></div>
        </div>
        <div class="sheet__actions"><button class="btn btn--accent press" data-act="close">Paráda</button></div>
      `);
    } catch(e){ toast("Sprint se nepodařilo uložit: " + e.message); }
  }

  /* ---------- sheets ---------- */
  const modalRoot = $("#modal-root");
  let sheetLocked = false;
  function openSheet(html, opts={}){
    sheetLocked = !!opts.locked;
    modalRoot.innerHTML = `<div class="overlay"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
    const ov = $(".overlay", modalRoot);
    ov.addEventListener("pointerdown", e => { if (e.target === ov && !sheetLocked) closeSheet(); });
  }
  function closeSheet(){ if (sheetLocked) return; modalRoot.innerHTML = ""; }
  function forceCloseSheet(){ sheetLocked = false; modalRoot.innerHTML = ""; }
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

  function busy(btn, on){ if (!btn) return; btn.disabled = on; btn.style.opacity = on ? ".6" : ""; }

  // --- onboarding domácnosti (jen remote) ---
  function sheetHouseholdOnboarding(){
    let mode = "create";
    const form = () => mode === "create"
      ? `<div class="field"><label>Jak se jmenuje vaše domácnost</label><input class="input" id="hn" placeholder="např. Smídovi, Byt v Brně" autocomplete="off"></div>`
      : `<div class="field"><label>Kód domácnosti</label><input class="input input--code" id="hc" placeholder="ABC123" maxlength="6" autocomplete="off" autocapitalize="characters"></div>`;
    openSheet(`
      <div class="sheet__grip"></div>
      <h3>Vítej ve Vyklízecím sprintu</h3>
      <p class="sub">Založ domácnost, nebo se přidej k té, kterou už někdo z rodiny založil. Všichni pak vidí stejný stack, hromádky i žebříček.</p>
      <div class="segment" id="hmode">
        <button type="button" class="seg" data-m="create" aria-pressed="true">Založit novou</button>
        <button type="button" class="seg" data-m="join" aria-pressed="false">Přidat se kódem</button>
      </div>
      <div id="hform" style="margin-top:14px">${form()}</div>
      <div class="sheet__actions"><button class="btn btn--accent press" id="hgo">Pokračovat</button></div>
      <p class="sub" style="margin:12px 0 0;text-align:center">${ic("wifi")} Data se ukládají do vaší Supabase a synchronizují mezi telefony.</p>
    `, { locked: true });
    $("#hmode").addEventListener("click", e => {
      const b = e.target.closest("[data-m]"); if (!b) return;
      mode = b.dataset.m;
      $("#hmode").querySelectorAll(".seg").forEach(x => x.setAttribute("aria-pressed", x === b));
      $("#hform").innerHTML = form();
    });
    $("#hgo").addEventListener("click", async () => {
      const btn = $("#hgo"); busy(btn, true);
      try {
        if (mode === "create"){
          const n = ($("#hn").value || "").trim(); if (!n){ $("#hn").focus(); busy(btn, false); return; }
          await DB.createHousehold(n);
        } else {
          const c = ($("#hc").value || "").trim(); if (c.length < 6){ $("#hc").focus(); busy(btn, false); return; }
          await DB.joinHousehold(c);
        }
        forceCloseSheet();
        ready = true;
        sheetPickPlayer(true);
      } catch(e){ busy(btn, false); toast(e.message); }
    });
  }

  // --- kdo hraje na tomhle zařízení ---
  function sheetPickPlayer(required){
    const list = players();
    openSheet(`
      <div class="sheet__grip"></div>
      <h3>${required ? "Kdo hraje na tomhle telefonu?" : "Hráči"}</h3>
      <p class="sub">${DB.mode === "remote" ? `Domácnost <b>${esc(DB.household.name)}</b>. ` : ""}Každý hráč má vlastní XP a sérii.</p>
      <div class="list" id="plist">
        ${list.map(p => `<div class="li">
          <span class="li__ph" style="background:${avColor(p)};color:#fff;font-weight:800;border-radius:999px">${esc(initials(p.name))}</span>
          <div class="li__t"><div class="li__n">${esc(p.name)}${p.id===meId?" · to jsem já":""}</div><div class="li__s">${p.xp} XP · ${esc(levelOf(p.xp).name)}</div></div>
          ${p.id===meId ? "" : `<button class="li__b" data-pick="${p.id}">To jsem já</button>`}
          ${list.length>1 && !required ? `<button class="li__b" data-del="${p.id}" style="color:var(--trash)">✕</button>` : ""}
        </div>`).join("") || `<div class="empty-note">Zatím tu nikdo není — přidej prvního hráče.</div>`}
      </div>
      <div class="field" style="margin-top:12px"><label>${list.length ? "Přidat dalšího hráče" : "Tvoje jméno"}</label>
        <div style="display:flex;gap:8px">
          <input class="input" id="npn" placeholder="Jméno" autocomplete="off">
          <button class="btn btn--accent press" id="npadd" style="padding:10px 18px;font-size:14px">Přidat</button>
        </div>
      </div>
      ${required ? "" : `<div class="sheet__actions"><button class="btn btn--primary" data-act="close">Hotovo</button></div>`}
    `, { locked: !!required });
    $("#plist").addEventListener("click", async e => {
      const pick = e.target.closest("[data-pick]"), del = e.target.closest("[data-del]");
      if (pick){ setMe(pick.dataset.pick); forceCloseSheet(); render(); }
      if (del){
        if (!confirm("Smazat hráče včetně XP?")) return;
        try { await DB.deletePlayer(del.dataset.del); if (meId === del.dataset.del) setMe(null); sheetPickPlayer(!me()); }
        catch(err){ toast(err.message); }
      }
    });
    const add = async () => {
      const n = ($("#npn").value || "").trim(); if (!n) return;
      busy($("#npadd"), true);
      try { const p = await DB.addPlayer(n); if (!me()) setMe(p.id); if (required){ forceCloseSheet(); render(); } else sheetPickPlayer(false); }
      catch(err){ busy($("#npadd"), false); toast(err.message); }
    };
    $("#npadd").addEventListener("click", add);
    $("#npn").addEventListener("keydown", e => { if (e.key === "Enter") add(); });
    setTimeout(() => $("#npn")?.focus(), 50);
  }
  function setMe(id){ meId = id; if (id) localStorage.setItem(playerKey(), id); else localStorage.removeItem(playerKey()); }

  // Formulář věci: existing = null → přidat; jinak upravit. opts.fromPile = klíč hromádky, kam se po uložení vrátit.
  function sheetItemForm(existing, opts = {}){
    const isEdit = !!existing;
    const aiOn = DB.aiAvailable();
    const base = existing ? estimateFor(existing) : estimate("obleceni-detske", "dobre");
    const draft = {
      name: existing ? existing.name : "", cat: existing ? existing.cat : "obleceni-detske", cond: existing ? existing.cond : "dobre",
      lo: base.lo, hi: base.hi, advice: base.advice, channel: base.channel,
      // priceSet = cena pochází z AI nebo od člověka → uloží se; jinak zůstává živá heuristika
      priceSet: !!(existing && existing.price_lo != null), fromAi: !!(existing && existing.price_lo != null),
      photoBlob: null, photoDataUrl: null,
    };
    const existingUrl = existing ? DB.photoUrl(existing) : null;
    openSheet(`
      <div class="sheet__grip"></div>
      <h3>${isEdit ? "Upravit věc" : "Přidat věc"}</h3>
      <p class="sub">${isEdit ? "Cokoli tady změníš, uvidí celá rodina." : aiOn ? "Vyfoť ji — appka sama navrhne název, kategorii, stav i cenu. Všechno můžeš upravit." : "Vyfoť ji nebo jen napiš — odhad ceny se dopočítá."}</p>
      <div class="field">
        <label>Fotka ${aiOn ? "" : "(nepovinné)"}</label>
        <label class="photopick" id="pp">${existingUrl ? `<img src="${esc(existingUrl)}" alt="">` : `${ic(aiOn ? "sparkle" : "photo")}<span>${aiOn ? "Vyfotit a rozpoznat" : "Vyfotit / vybrat"}</span>`}
          <input type="file" accept="image/*" hidden id="pf"></label>
        <div id="ainote"></div>
      </div>
      <div class="field"><label>Co to je</label>
        <input class="input" id="pn" placeholder="např. Dětská bunda vel. 104" autocomplete="off" value="${esc(draft.name)}"></div>
      <div class="field"><label>Kategorie</label>
        <div class="chips" id="pc">${CATS.map(c => `<button type="button" class="chip" data-c="${c.id}" aria-pressed="${c.id===draft.cat}">${ic(c.icon)}${esc(c.short)}</button>`).join("")}</div></div>
      <div class="field"><label>Stav</label>
        <div class="segment" id="pcond">${CONDS.map(c => `<button type="button" class="seg" data-k="${c.id}" aria-pressed="${c.id===draft.cond}">${esc(c.label)}</button>`).join("")}</div></div>
      <div class="field"><label>Cena na bazaru</label>
        <div class="pricerow">
          <input class="input" id="plo" type="number" inputmode="numeric" min="0" step="10" value="${draft.lo}">
          <span class="sep">–</span>
          <input class="input" id="phi" type="number" inputmode="numeric" min="0" step="10" value="${draft.hi}">
          <span class="unit">Kč</span>
          <button type="button" class="reset" id="preset" title="Vrátit odhad appky">${ic("refresh")}</button>
        </div>
        <div class="advice" id="pest" style="margin-top:8px"></div>
      </div>
      <div class="sheet__actions">
        ${isEdit ? `<button class="btn btn--danger" id="pdel">Smazat</button>` : `<button class="btn btn--ghost" data-act="close">Zrušit</button>`}
        <button class="btn btn--accent press" id="padd">${isEdit ? "Uložit" : "Přidat do stacku"}</button>
      </div>
    `);
    const estBox = $("#pest");
    const refreshEst = () => {
      estBox.innerHTML = `<b style="color:var(${DEC[draft.channel].cvar})">${kcR(draft.lo, draft.hi)}</b> · ${esc(draft.advice)}${draft.fromAi ? ` <span class="ai-tag">${ic("sparkle")}z fotky</span>` : draft.priceSet ? ` <span class="ai-tag">${ic("pencil")}ručně</span>` : ""}`;
    };
    const setPriceInputs = () => { $("#plo").value = draft.lo; $("#phi").value = draft.hi; };
    const setCat = id => { draft.cat = id; $("#pc").querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", x.dataset.c === id)); };
    const setCond = id => { draft.cond = id; $("#pcond").querySelectorAll(".seg").forEach(x => x.setAttribute("aria-pressed", x.dataset.k === id)); };
    // heuristika: buď celá (cena i rada), nebo jen rada k ručně zadané ceně
    const recompute = () => {
      if (draft.priceSet){ const e = estimate(draft.cat, draft.cond, (draft.lo + draft.hi) / 2); draft.advice = e.advice; draft.channel = e.channel; }
      else { const e = estimate(draft.cat, draft.cond); Object.assign(draft, { lo: e.lo, hi: e.hi, advice: e.advice, channel: e.channel }); setPriceInputs(); }
      refreshEst();
    };
    refreshEst();
    $("#pn").addEventListener("input", e => draft.name = e.target.value);
    // změna kategorie/stavu: AI/ruční cena zůstane, ale rada se přepočítá; heuristická cena se přepočítá celá
    $("#pc").addEventListener("click", e => { const b = e.target.closest("[data-c]"); if (!b) return; setCat(b.dataset.c); if (draft.fromAi){ draft.fromAi = false; $("#ainote").innerHTML = ""; } recompute(); });
    $("#pcond").addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (!b) return; setCond(b.dataset.k); if (draft.fromAi){ draft.fromAi = false; $("#ainote").innerHTML = ""; } recompute(); });
    const onPrice = () => {
      const lo = Math.max(0, Math.round(+$("#plo").value || 0)), hi = Math.max(0, Math.round(+$("#phi").value || 0));
      draft.lo = Math.min(lo, hi); draft.hi = Math.max(lo, hi); draft.priceSet = true; draft.fromAi = false; $("#ainote").innerHTML = "";
      recompute();
    };
    $("#plo").addEventListener("change", onPrice);
    $("#phi").addEventListener("change", onPrice);
    $("#preset").addEventListener("click", () => { draft.priceSet = false; draft.fromAi = false; $("#ainote").innerHTML = ""; recompute(); });
    $("#pf").addEventListener("change", async e => {
      const f = e.target.files[0]; if (!f) return;
      let r;
      try { r = await downscale(f); draft.photoBlob = r.blob; draft.photoDataUrl = r.dataUrl; }
      catch(err){ toast("Fotku se nepodařilo zpracovat"); return; }
      const pp = $("#pp");
      pp.innerHTML = `<img src="${r.dataUrl}" alt="">` + (aiOn ? `<div class="ai-veil">${ic("sparkle","spin")}Rozpoznávám…</div>` : "");
      if (!aiOn) return;
      busy($("#padd"), true);
      try {
        const ai = await DB.analyzePhoto(r.blob);
        if (!$("#pp")) return;                       // sheet mezitím zavřený
        if (!draft.name.trim()){ draft.name = ai.name; $("#pn").value = ai.name; }
        if (CAT[ai.cat]) setCat(ai.cat);
        if (COND[ai.cond]) setCond(ai.cond);
        Object.assign(draft, { lo: ai.price_lo, hi: ai.price_hi, advice: ai.advice, channel: ai.channel, priceSet: true, fromAi: true });
        setPriceInputs(); refreshEst();
        const sure = ai.confidence >= 0.7 ? "" : ai.confidence >= 0.4 ? " · nejsem si úplně jistá" : " · tipuju, radši zkontroluj";
        $("#ainote").innerHTML = `<div class="ai-note">${ic("sparkle")}Rozpoznáno z fotky${sure}</div>`;
      } catch(err){
        toast("AI nepomohla: " + err.message);
      } finally {
        busy($("#padd"), false);
        const veil = $("#pp .ai-veil"); if (veil) veil.remove();
      }
    });
    const afterSave = (msg) => { forceCloseSheet(); render(); toast(msg); if (opts.fromPile) sheetPile(opts.fromPile); };
    $("#padd").addEventListener("click", async () => {
      const name = draft.name.trim();
      if (!name){ $("#pn").focus(); $("#pn").style.borderColor = "var(--trash)"; return; }
      busy($("#padd"), true);
      const ai = draft.priceSet ? { price_lo: draft.lo, price_hi: draft.hi, advice: draft.advice, channel: draft.channel } : null;
      try {
        if (isEdit) await DB.updateItem(existing.id, { name, cat: draft.cat, cond: draft.cond, ai, photoBlob: draft.photoBlob, photoDataUrl: draft.photoDataUrl });
        else await DB.addItem({ name, cat: draft.cat, cond: draft.cond, photoBlob: draft.photoBlob, photoDataUrl: draft.photoDataUrl, createdBy: meId, ai });
        afterSave(isEdit ? "Uloženo" : "Přidáno do stacku");
      } catch(err){ busy($("#padd"), false); toast(err.message === "quota" ? "Došlo místo v prohlížeči — zkus bez fotky." : err.message); }
    });
    $("#pdel")?.addEventListener("click", async () => {
      if (!confirm(`Smazat „${draft.name || existing.name}“? Tohle nejde vrátit.`)) return;
      busy($("#pdel"), true);
      try { await DB.deleteItem(existing.id); afterSave("Smazáno"); }
      catch(err){ busy($("#pdel"), false); toast(err.message); }
    });
    setTimeout(() => (isEdit ? $("#pn") : aiOn ? $("#pf") : $("#pn"))?.focus(), 50);
  }

  function sheetPile(key){
    curPileKey = key;
    const list = items().filter(i => i.decision === key);
    const isMaybe = key === "maybe";
    const title = isMaybe ? "Krabice na rok" : DEC[key].label;
    let head = "";
    if (key === "sell"){
      const tot = list.reduce((a,i) => { const e = estimateFor(i); return {lo:a.lo+e.lo, hi:a.hi+e.hi}; }, {lo:0,hi:0});
      head = list.length ? `<p class="sub">Odhadovaný výtěžek celkem <b style="color:var(--green-ink)">${kcR(tot.lo, tot.hi)}</b>.</p>` : "";
    } else if (key === "donate") head = `<p class="sub">Textil → kontejner Diakonie / charita. Hračky a knihy → místní sbírka nebo Knihobudka.</p>`;
    else if (key === "trash") head = `<p class="sub">Textil patří do kontejneru na textil, elektro do sběrného dvora — ne do směsného.</p>`;
    else if (isMaybe) head = `<p class="sub">Co se za půl roku ani nehne, to nejspíš nepotřebuješ.</p>`;
    const rows = list.map(i => {
      const c = CAT[i.cat] || CAT.jine;
      const e = estimateFor(i);
      const by = players().find(p => p.id === i.decided_by);
      let sub = (key === "sell" ? kcR(e.lo, e.hi) : c.short) + (by ? " · " + esc(by.name) : "");
      let action = `<button class="li__b" data-return="${i.id}">Zpět do stacku</button>`;
      if (isMaybe){
        const over = i.review_at && new Date(i.review_at).getTime() < Date.now();
        sub = over ? "leží tu už " + Math.round((Date.now() - (new Date(i.review_at).getTime() - 182*DAY)) / DAY) + " dní" : "připomene se " + new Date(i.review_at).toLocaleDateString("cs-CZ");
        action = `<button class="li__b" data-move="donate:${i.id}" style="background:var(--salmon-soft);color:var(--salmon)">Darovat</button>`;
      }
      const url = DB.photoUrl(i);
      return `<div class="li">
        <span class="li__ph">${url ? `<img src="${esc(url)}" alt="" loading="lazy">` : ic(c.icon)}</span>
        <div class="li__t li__t--edit" data-edit="${i.id}" title="Upravit"><div class="li__n">${esc(i.name)}</div><div class="li__s">${sub}</div></div>
        ${action}</div>`;
    }).join("");
    const copyBtn = (key === "sell" || key === "donate") && list.length ? `<button class="btn btn--ghost" id="copylist">Zkopírovat seznam</button>` : "";
    openSheet(`
      <div class="sheet__grip"></div>
      <h3>${esc(title)} · ${list.length}</h3>
      ${head}
      <div class="list">${rows || `<div class="empty-note">Zatím nic.</div>`}</div>
      <div class="sheet__actions">${copyBtn}<button class="btn btn--primary" data-act="close">Hotovo</button></div>
    `);
    $("#copylist")?.addEventListener("click", () => {
      const lines = list.map(i => { const e = estimateFor(i); return key === "sell" ? `• ${i.name} — ${kcR(e.lo, e.hi)}` : `• ${i.name}`; });
      const text = (key==="sell" ? "Na prodej:\n" : "K darování:\n") + lines.join("\n");
      navigator.clipboard?.writeText(text).then(() => toast("Zkopírováno")).catch(() => toast("Nepodařilo se zkopírovat"));
    });
  }

  function sheetSprint(){
    let zone = ZONES[0], mins = 15;
    openSheet(`
      <div class="sheet__grip"></div>
      <h3>Vyklízecí sprint</h3>
      <p class="sub">Nastav si čas na jednu zónu a projdi co nejvíc věcí. Během sprintu je +5 XP navíc za kus${DB.mode==="remote" ? " a ostatní v žebříčku vidí, že sprintuješ" : ""}.</p>
      <div class="field"><label>Zóna</label>
        <div class="chips" id="sz">${ZONES.map(z => `<button type="button" class="chip" data-z="${esc(z)}" aria-pressed="${z===zone}">${esc(z)}</button>`).join("")}</div></div>
      <div class="field"><label>Délka</label>
        <div class="segment" id="sm">${[10,15,25].map(m => `<button type="button" class="seg" data-m="${m}" aria-pressed="${m===mins}">${m} min</button>`).join("")}</div></div>
      <div class="sheet__actions">
        <button class="btn btn--ghost" data-act="close">Zrušit</button>
        <button class="btn btn--accent press" id="sgo">${ic("bolt")}Start</button>
      </div>
    `);
    $("#sz").addEventListener("click", e => { const b = e.target.closest("[data-z]"); if (!b) return; zone = b.dataset.z; $("#sz").querySelectorAll(".chip").forEach(x => x.setAttribute("aria-pressed", x===b)); });
    $("#sm").addEventListener("click", e => { const b = e.target.closest("[data-m]"); if (!b) return; mins = +b.dataset.m; $("#sm").querySelectorAll(".seg").forEach(x => x.setAttribute("aria-pressed", x===b)); });
    $("#sgo").addEventListener("click", async () => {
      busy($("#sgo"), true);
      try { await DB.startSprint({ playerId: meId, zone, minutes: mins }); forceCloseSheet(); render(); }
      catch(err){ busy($("#sgo"), false); toast(err.message); }
    });
  }

  function sheetHousehold(){
    const h = DB.household;
    openSheet(`
      <div class="sheet__grip"></div>
      <h3>${esc(h.name)}</h3>
      <p class="sub">Tenhle kód pošli rodině — zadají ho při prvním spuštění a uvidí stejná data.</p>
      <div class="codebox"><span class="code">${esc(h.code)}</span><button class="btn btn--ghost" id="copycode">${ic("copy")}Zkopírovat</button></div>
      <div class="list" style="margin-top:14px">
        ${players().map(p => `<div class="li"><span class="li__ph" style="background:${avColor(p)};color:#fff;font-weight:800;border-radius:999px">${esc(initials(p.name))}</span><div class="li__t"><div class="li__n">${esc(p.name)}</div><div class="li__s">${p.xp} XP</div></div></div>`).join("")}
      </div>
      <div class="sheet__actions" style="margin-top:14px">
        <button class="btn btn--ghost" id="leave">Odejít z domácnosti</button>
        <button class="btn btn--primary" data-act="close">Hotovo</button>
      </div>
    `);
    $("#copycode").addEventListener("click", () => navigator.clipboard?.writeText(h.code).then(() => toast("Kód zkopírován")).catch(() => {}));
    $("#leave").addEventListener("click", async () => {
      if (!confirm("Odpojit tenhle telefon od domácnosti? Data zůstanou ostatním.")) return;
      await DB.leaveHousehold(); setMe(null); forceCloseSheet(); ready = false;
      sheetHouseholdOnboarding();
    });
  }

  function sheetSettings(){
    const remote = DB.mode === "remote";
    openSheet(`
      <div class="sheet__grip"></div>
      <h3>Nastavení</h3>
      <div class="settings-row"><span>Režim</span><span class="mode ${remote?"on":""}">${ic("wifi")}${remote ? "Rodinný · sync" : "Lokální"}</span></div>
      <div class="settings-row"><span>Věcí v aplikaci</span><span class="num">${items().length}</span></div>
      <div class="settings-row"><span>Dokončených sprintů</span><span class="num">${DB.sprintsDone()}</span></div>
      ${remote ? "" : `<div class="settings-row"><span>Ukázková data</span><button ${DB.isExample()?"":"disabled"} id="wipedemo">Vymazat ukázky</button></div>`}
      <div class="settings-row"><span>${remote ? "Vyprázdnit domácnost" : "Začít úplně znovu"}</span><button class="danger" id="wipeall">Smazat vše</button></div>
      <p class="sub" style="margin-top:14px">${remote
        ? "Data leží ve vaší Supabase (tabulky items, players, sprints), fotky ve Storage. Nikdo jiný než členové domácnosti je nevidí."
        : "Data zůstávají jen v tomhle prohlížeči. Pro rodinný režim se syncem vyplň <code>config.js</code> (viz README)."}</p>
      <div class="sheet__actions"><button class="btn btn--primary" data-act="close">Zavřít</button></div>
    `);
    $("#wipedemo")?.addEventListener("click", async () => { await DB.wipeExample(); setMe(null); forceCloseSheet(); render(); toast("Ukázky vymazány"); });
    $("#wipeall").addEventListener("click", async () => {
      if (!confirm(remote ? "Smazat všechny věci a sprinty v domácnosti a vynulovat XP všem?" : "Smazat úplně všechno?")) return;
      await DB.wipeAll(); if (!remote) setMe(null); forceCloseSheet(); render(); toast("Začínáme načisto");
    });
  }

  /* ---------- pomocné ---------- */
  function downscale(file){
    return new Promise((resolve, reject) => {
      const rd = new FileReader();
      rd.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1000, sc = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement("canvas");
          cv.width = Math.round(img.width * sc); cv.height = Math.round(img.height * sc);
          cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
          const dataUrl = cv.toDataURL("image/jpeg", 0.72);
          cv.toBlob(blob => blob ? resolve({ blob, dataUrl }) : reject(new Error("blob")), "image/jpeg", 0.8);
        };
        img.onerror = reject;
        img.src = rd.result;
      };
      rd.onerror = reject;
      rd.readAsDataURL(file);
    });
  }

  let toastT = null;
  function toast(msg, actionLabel, actionFn){
    clearTimeout(toastT);
    $(".toast")?.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<span>${esc(msg)}</span>`;
    if (actionLabel){ const b = document.createElement("button"); b.textContent = actionLabel; b.onclick = () => { el.remove(); actionFn && actionFn(); }; el.appendChild(b); }
    document.body.appendChild(el);
    toastT = setTimeout(() => el.remove(), 4500);
  }

  function confetti(){
    if (RM) return;
    const cv = document.createElement("canvas"); cv.className = "confetti";
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    document.body.appendChild(cv);
    const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
    const cols = ["#1FA84F","#E8703F","#2B8BD6","#F2B233","#7ED9A0"];
    const parts = Array.from({length:120}, () => ({ x: innerWidth/2 + (Math.random()-.5)*80, y: innerHeight/3, vx: (Math.random()-.5)*9, vy: Math.random()*-11 - 3, r: Math.random()*5 + 3, c: cols[(Math.random()*cols.length)|0], rot: Math.random()*6.28, vr: (Math.random()-.5)*0.4 }));
    const t0 = performance.now();
    (function frame(now){
      ctx.clearRect(0,0,innerWidth,innerHeight);
      parts.forEach(p => { p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= 0.99; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r*0.6, p.r*2, p.r*1.2); ctx.restore(); });
      if (now - t0 < 1500) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  /* ---------- globální události ---------- */
  document.addEventListener("click", async e => {
    const ed = e.target.closest("[data-edit]");
    if (ed){ const it = items().find(x => x.id === ed.dataset.edit); if (it) sheetItemForm(it, { fromPile: curPileKey }); return; }
    const ret = e.target.closest("[data-return]");
    if (ret){ try { await DB.returnItem(ret.dataset.return); render(); if (curPileKey) sheetPile(curPileKey); } catch(err){ toast(err.message); } return; }
    const mv = e.target.closest("[data-move]");
    if (mv){ const [d, id] = mv.dataset.move.split(":"); try { await DB.decideItem(id, d, meId); render(); if (curPileKey) sheetPile(curPileKey); } catch(err){ toast(err.message); } return; }
    const dec = e.target.closest("[data-decide]");
    if (dec){ pressDecide(dec.dataset.decide); return; }
    const pile = e.target.closest("[data-pile]");
    if (pile){ sheetPile(pile.dataset.pile); return; }
    const act = e.target.closest("[data-act]");
    if (!act) return;
    const a = act.dataset.act;
    if (a === "add"){ curPileKey = null; sheetItemForm(null); }
    else if (a === "edit"){ const it = pending()[0]; if (it){ curPileKey = null; sheetItemForm(it); } }
    else if (a === "sprint") sheetSprint();
    else if (a === "endsprint"){ const sp = mySprint(); if (sp) finishSprint(sp); }
    else if (a === "players") sheetPickPlayer(false);
    else if (a === "household") sheetHousehold();
    else if (a === "settings") sheetSettings();
    else if (a === "close") closeSheet();
    else if (a === "skip"){ const it = pending()[0]; if (it && pending().length > 1){ try { await DB.skipItem(it.id); render(); } catch(err){ toast(err.message); } } }
  });
  document.addEventListener("keydown", e => {
    if (modalRoot.innerHTML || document.activeElement?.classList.contains("input")) return;
    const map = {"1":"keep","2":"sell","3":"donate","4":"trash","5":"maybe"};
    if (map[e.key] && pending().length){ e.preventDefault(); pressDecide(map[e.key]); }
  });

  /* ---------- start ---------- */
  async function boot(){
    $("#scroll").innerHTML = `<div class="loading">${ic("leaf")}<span>Načítám…</span></div>`;
    try {
      const r = await DB.init();
      DB.onChange(() => { if (ready) render(); });
      if (r.needsHousehold){ sheetHouseholdOnboarding(); return; }
      if (DB.mode === "local" && players().length === 0 && !localStorage.getItem("vs.local.touched")){
        const first = await DB.seedExample(); localStorage.setItem("vs.local.touched", "1"); if (first) setMe(first);
      }
      meId = localStorage.getItem(playerKey());
      ready = true;
      render();
    } catch(e){
      $("#scroll").innerHTML = `<div class="errorbox"><h3>Nejde se připojit</h3><p>${esc(e.message)}</p><p class="sub">Zkontroluj <code>config.js</code> a nastavení Supabase (schema.sql, Anonymous sign-ins).</p></div>`;
    }
  }
  // označit, že lokální data už někdo měnil (aby se ukázky nevracely po smazání)
  const origWipe = DB.wipeAll.bind(DB); DB.wipeAll = async () => { localStorage.setItem("vs.local.touched", "1"); return origWipe(); };
  boot();
})();
