/* Daily Walk: all data is stored on this device only (localStorage). */
(function () {
  "use strict";

  const STORE_KEY = "dailywalk:v1";
  const DAY = 86400000;
  const LOCK_AFTER_MS = 60000; // re-lock when the app has been in the background this long
  const FEELINGS = ["Hungry", "Angry", "Lonely", "Tired", "Bored", "Stressed", "Sad", "Anxious", "Rejected"];

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------------- Storage ---------------- */
  function freshState() {
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      startDate: null,
      profile: { name: "", partnerName: "", partnerPhone: "", message: "I'm struggling right now. Can you pray for me or give me a call?" },
      logs: [],     // urges: {id, at, intensity, feelings[], place, instead, outcome}
      resets: [],   // slips: {id, at, streakDays, trigger, lesson}
      pin: null,    // {salt, hash}
      bible: "kjv", // kjv | vdc | ntr
      verseText: { vdc: {}, ntr: {} } // Romanian text you paste in yourself, kept on this device
    };
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      const base = freshState();
      return normalize(s);
    } catch (e) { console.error("Load failed", e); return null; }
  }
  function normalize(s) {
    const base = freshState();
    const vt = s.verseText || {};
    return {
      ...base, ...s,
      profile: { ...base.profile, ...(s.profile || {}) },
      verseText: { vdc: { ...(vt.vdc || {}) }, ntr: { ...(vt.ntr || {}) } },
      bible: ["kjv", "vdc", "ntr"].includes(s.bible) ? s.bible : "kjv"
    };
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { toast("Couldn't save. Storage may be full."); console.error(e); }
  }
  let state = load();

  /* ---------------- Time helpers ---------------- */
  const toLocalInput = (d) => {
    const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 16);
  };
  const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
  const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: new Date(d).getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
  const fmtTime = (d) => new Date(d).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const fmtDay = (d) => new Date(d).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const daysBetween = (a, b) => Math.max(0, (new Date(b) - new Date(a)) / DAY);

  function streak() {
    if (!state.startDate) return { days: 0, exact: 0 };
    const exact = daysBetween(state.startDate, Date.now());
    return { days: Math.floor(exact), exact };
  }
  function longest() {
    return Math.max(streak().days, ...state.resets.map((r) => r.streakDays || 0), 0);
  }

  /* ---------------- Toast ---------------- */
  let toastTimer;
  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600);
  }

  /* ---------------- Scripture ---------------- */
  function verseInfo(id, tr = state.bible) {
    const v = window.VERSES[id];
    if (tr === "kjv") return { text: v.kjv, ref: v.ref, missing: false };
    const b = window.BIBLES[tr];
    const own = state.verseText[tr]?.[id];
    return {
      text: own || v.kjv,
      ref: `${v.refRo} ${b.short}`,
      missing: !own,
      link: `https://www.bible.com/bible/${b.youversion}/${id}.${b.short}`
    };
  }
  function scriptureHTML(id) {
    const v = verseInfo(id);
    const short = window.BIBLES[state.bible].short;
    return `<p>${esc(v.text)}</p><cite>${esc(v.ref)}</cite>` +
      (v.link ? `<a class="open-bible" href="${v.link}" target="_blank" rel="noopener">Open in ${short}</a>` : "") +
      (v.missing ? `<span class="verse-note">Showing KJV until you add the ${short} text in Settings.</span>` : "");
  }
  function allVerseIds() {
    // Rescue verses first, since those matter most
    return [...new Set([...window.TEMPTATION_VERSES, ...window.GRACE_VERSES, ...window.DAILY_VERSES, ...window.MILESTONES.map((m) => m.verse)])];
  }
  // Clean up text copied from a Bible app: quotes, reference lines, links
  function cleanPasted(t) {
    return t.replace(/https?:\/\/\S+/g, "")
      .split("\n").map((l) => l.trim())
      .filter((l) => l && !(l.length < 60 && /\d+:\d+(\s*[-–]\s*\d+)?\s*(NTR|VDC)?\s*$/i.test(l)))
      .join(" ")
      .replace(/^["„“”«»]+|["„“”«»]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ---------------- Today ---------------- */
  function greeting() {
    const h = new Date().getHours();
    const part = h < 5 ? "Still up" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    return state.profile.name ? `${part}, ${state.profile.name}` : part;
  }

  function mixHex(a, b, t) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [A, B] = [p(a), p(b)];
    return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }

  function renderToday() {
    $("greeting").textContent = greeting();
    $("lock-now").hidden = !state.pin;

    const { days, exact } = streak();
    const ms = window.MILESTONES.map((m) => m.days);
    const next = ms.find((m) => m > days) ?? days + 365;
    const prev = [...ms].reverse().find((m) => m <= days) ?? 0;
    const progress = Math.min(1, (exact - prev) / (next - prev));

    // The sun rises toward the next milestone
    const cy = 150 - progress * 100;
    $("sun").setAttribute("cy", cy);
    $("glow").setAttribute("cy", cy);
    $("skyTop").setAttribute("stop-color", mixHex("#1E2B40", "#7FA7C9", progress));
    $("skyLow").setAttribute("stop-color", mixHex("#5E5A78", "#F6D39A", progress));

    if (days === 0) {
      const hrs = Math.floor(exact * 24);
      $("count-num").textContent = hrs;
      $("count-unit").textContent = hrs === 1 ? "hour" : "hours";
      $("count-sub").textContent = "Day one. His mercies are new every morning.";
    } else {
      $("count-num").textContent = days;
      $("count-unit").textContent = days === 1 ? "day" : "days";
      const left = next - days;
      $("count-sub").textContent = `Since ${fmtDate(state.startDate)}. ${left} ${left === 1 ? "day" : "days"} until day ${next}.`;
    }

    const hit = window.MILESTONES.find((m) => m.days === days && days > 0);
    $("milestone").hidden = !hit;
    if (hit) {
      $("milestone-title").textContent = `${hit.days} ${hit.days === 1 ? "day" : "days"}. Well done.`;
      $("milestone-verse").innerHTML = scriptureHTML(hit.verse);
    }

    const start = new Date(new Date().getFullYear(), 0, 0);
    const dayOfYear = Math.floor((Date.now() - start) / DAY);
    $("daily-verse").innerHTML = scriptureHTML(window.DAILY_VERSES[dayOfYear % window.DAILY_VERSES.length]);
  }

  /* ---------------- Journal ---------------- */
  function renderJournal() {
    const resisted = state.logs.filter((l) => l.outcome === "resisted").length;
    $("stats").innerHTML = `
      <div class="stat"><b>${streak().days}</b><span>Current streak</span></div>
      <div class="stat"><b>${longest()}</b><span>Longest streak</span></div>
      <div class="stat"><b>${resisted}</b><span>Urges resisted</span></div>
      <div class="stat"><b>${state.resets.length}</b><span>Restarts</span></div>`;

    const items = [
      ...state.logs.map((l) => ({ ...l, kind: "log" })),
      ...state.resets.map((r) => ({ ...r, kind: "reset" }))
    ].sort((a, b) => new Date(b.at) - new Date(a.at));

    if (!items.length) {
      $("entries").innerHTML = `<div class="empty"><b>Nothing here yet</b>When an urge hits, log it, even if you resisted. After a week or two you'll start to see your patterns.</div>`;
      return;
    }

    let html = "", lastDay = "";
    for (const it of items) {
      const day = fmtDay(it.at);
      if (day !== lastDay) { html += `<h3 class="day-head">${esc(day)}</h3>`; lastDay = day; }
      if (it.kind === "log") {
        const slipped = it.outcome === "slipped";
        html += `<article class="entry ${slipped ? "is-slip" : ""}">
          <div class="entry-top"><span class="entry-kind">${slipped ? "Urge, slipped" : "Urge resisted"}</span><span class="entry-time">${fmtTime(it.at)}</span></div>
          <p>Intensity ${it.intensity}/10${it.feelings?.length ? `. Feeling ${esc(it.feelings.join(", ").toLowerCase())}` : ""}</p>
          ${it.place ? `<p><span class="muted">Where:</span> ${esc(it.place)}</p>` : ""}
          ${it.instead ? `<p><span class="muted">What I did:</span> ${esc(it.instead)}</p>` : ""}
          <button type="button" class="entry-del" data-del-log="${it.id}">Delete</button>
        </article>`;
      } else {
        html += `<article class="entry is-slip">
          <div class="entry-top"><span class="entry-kind">Started again</span><span class="entry-time">${fmtTime(it.at)}</span></div>
          <p class="muted">After ${it.streakDays} ${it.streakDays === 1 ? "day" : "days"}</p>
          ${it.trigger ? `<p><span class="muted">What led here:</span> ${esc(it.trigger)}</p>` : ""}
          ${it.lesson ? `<p><span class="muted">Next time:</span> ${esc(it.lesson)}</p>` : ""}
          <button type="button" class="entry-del" data-del-reset="${it.id}">Delete</button>
        </article>`;
      }
    }
    $("entries").innerHTML = html;
  }

  $("entries").addEventListener("click", (e) => {
    const logId = e.target.dataset.delLog, resetId = e.target.dataset.delReset;
    if (!logId && !resetId) return;
    if (!confirm("Delete this entry?")) return;
    if (logId) state.logs = state.logs.filter((l) => l.id !== logId);
    if (resetId) state.resets = state.resets.filter((r) => r.id !== resetId);
    save(); renderJournal(); toast("Entry deleted");
  });

  /* ---------------- Settings ---------------- */
  function renderSettings() {
    $("set-name").value = state.profile.name;
    $("set-start").value = state.startDate ? toLocalInput(state.startDate) : "";
    $("set-partner").value = state.profile.partnerName;
    $("set-phone").value = state.profile.partnerPhone;
    $("set-message").value = state.profile.message;
    $("pin-status").textContent = state.pin
      ? "PIN is on. The app locks when opened and after a minute in the background."
      : "No PIN set. Anyone who opens this app can see your entries.";
    $("set-pin").textContent = state.pin ? "Change PIN" : "Set a PIN";
    renderBibleSettings();
    $("remove-pin").hidden = !state.pin;
  }

  function renderBibleSettings() {
    const tr = state.bible;
    document.querySelectorAll("input[name='bible']").forEach((r) => (r.checked = r.value === tr));
    $("edit-verses").hidden = tr === "kjv";
    if (tr === "kjv") {
      $("bible-status").textContent = "King James Version, built in.";
      return;
    }
    const b = window.BIBLES[tr];
    const total = allVerseIds().length;
    const done = allVerseIds().filter((id) => state.verseText[tr][id]).length;
    $("bible-status").textContent = `${b.name}. ${b.short} is copyrighted, so you add the text yourself from your Bible app. It stays on this device. ${done} of ${total} verses added; the rest show in KJV for now.`;
    $("edit-verses").textContent = done ? `Edit ${b.short} verses (${done} of ${total})` : `Add ${b.short} verses`;
  }
  document.querySelectorAll("input[name='bible']").forEach((r) => r.addEventListener("change", () => {
    state.bible = r.value; save(); renderBibleSettings();
    toast(`Bible set to ${window.BIBLES[r.value].short}`);
  }));

  function openVerseEditor() {
    const tr = state.bible, b = window.BIBLES[tr];
    const rows = allVerseIds().map((id) => {
      const v = verseInfo(id, tr);
      return `<div class="verse-edit">
        <div class="verse-edit-top"><b>${esc(window.VERSES[id].refRo)}</b><a href="${v.link}" target="_blank" rel="noopener">Open in ${b.short}</a></div>
        <p class="kjv-hint">${esc(window.VERSES[id].ref)}: ${esc(window.VERSES[id].kjv.slice(0, 70))}…</p>
        <textarea rows="3" data-verse="${id}" placeholder="Paste the ${b.short} text here">${esc(state.verseText[tr][id] || "")}</textarea>
      </div>`;
    }).join("");
    openSheet(`
      <h2 id="sheet-title">${b.short} verses</h2>
      <p class="lead">Tap "Open in ${b.short}", copy the verse in the Bible app, and paste it here. Links and references are removed automatically. The first ones are used on the rescue screen, so start there.</p>
      ${rows}
      <div class="sheet-actions sheet-sticky">
        <button type="button" class="btn btn-dawn btn-block" id="ve-save">Save verses</button>
        <button type="button" class="btn btn-ghost btn-block" id="ve-cancel">Cancel</button>
      </div>`);
    $("ve-cancel").addEventListener("click", closeSheet);
    $("ve-save").addEventListener("click", () => {
      document.querySelectorAll("#sheet-body textarea[data-verse]").forEach((ta) => {
        const t = cleanPasted(ta.value);
        if (t) state.verseText[tr][ta.dataset.verse] = t;
        else delete state.verseText[tr][ta.dataset.verse];
      });
      save(); closeSheet(); renderBibleSettings(); toast("Verses saved");
    });
  }
  $("edit-verses").addEventListener("click", openVerseEditor);

  $("save-profile").addEventListener("click", () => {
    state.profile.name = $("set-name").value.trim();
    state.profile.partnerName = $("set-partner").value.trim();
    state.profile.partnerPhone = $("set-phone").value.trim();
    state.profile.message = $("set-message").value.trim() || freshState().profile.message;
    const start = fromLocalInput($("set-start").value);
    if (start && new Date(start) <= new Date()) state.startDate = start;
    save(); toast("Changes saved"); renderToday();
  });

  /* ---------------- Navigation ---------------- */
  let currentView = "today";
  function show(view) {
    currentView = view;
    for (const v of ["today", "journal", "settings"]) $("view-" + v).hidden = v !== view;
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.view === view));
    if (view === "today") renderToday();
    if (view === "journal") renderJournal();
    if (view === "settings") renderSettings();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => show(t.dataset.view)));

  /* ---------------- Bottom sheet ---------------- */
  function openSheet(html) {
    $("sheet-body").innerHTML = html;
    $("sheet").hidden = false; $("sheet-backdrop").hidden = false;
    $("sheet").scrollTop = 0;
    document.body.style.overflow = "hidden";
  }
  function closeSheet() {
    $("sheet").hidden = true; $("sheet-backdrop").hidden = true;
    document.body.style.overflow = "";
  }
  $("sheet-backdrop").addEventListener("click", closeSheet);

  /* ---------------- Log an urge ---------------- */
  function openLog(prefill = {}) {
    const outcome = prefill.outcome || "resisted";
    openSheet(`
      <h2 id="sheet-title">Log an urge</h2>
      <p class="lead">Be honest. This is only for you.</p>
      <label class="field"><span>When</span><input type="datetime-local" id="lg-at" value="${toLocalInput(new Date())}"></label>
      <div class="field"><span>How strong was it?</span>
        <div class="range-row"><input type="range" id="lg-int" min="1" max="10" value="${prefill.intensity || 5}"><b class="range-val" id="lg-int-val">${prefill.intensity || 5}</b></div>
      </div>
      <div class="field"><span>What were you feeling?</span>
        <div class="chips" id="lg-feel">${FEELINGS.map((f) => `<button type="button" class="chip" aria-pressed="false">${f}</button>`).join("")}</div>
      </div>
      <label class="field"><span>Where were you, what was happening?</span><input type="text" id="lg-place" placeholder="In bed on my phone, late at night" maxlength="200"></label>
      <label class="field"><span>What did you do instead?</span><input type="text" id="lg-instead" placeholder="Went for a walk, texted a friend" maxlength="200"></label>
      <fieldset class="field"><legend>Outcome</legend>
        <div class="seg">
          <label><input type="radio" name="lg-out" value="resisted" ${outcome === "resisted" ? "checked" : ""}><span>I resisted</span></label>
          <label><input type="radio" name="lg-out" value="slipped" ${outcome === "slipped" ? "checked" : ""}><span>I slipped</span></label>
        </div>
      </fieldset>
      <div class="sheet-actions">
        <button type="button" class="btn btn-dawn btn-block" id="lg-save">Save entry</button>
        <button type="button" class="btn btn-ghost btn-block" id="lg-cancel">Cancel</button>
      </div>`);

    $("lg-int").addEventListener("input", (e) => ($("lg-int-val").textContent = e.target.value));
    $("lg-feel").addEventListener("click", (e) => {
      if (!e.target.classList.contains("chip")) return;
      e.target.setAttribute("aria-pressed", e.target.getAttribute("aria-pressed") === "true" ? "false" : "true");
    });
    $("lg-cancel").addEventListener("click", closeSheet);
    $("lg-save").addEventListener("click", () => {
      const entry = {
        id: uid(),
        at: fromLocalInput($("lg-at").value) || new Date().toISOString(),
        intensity: Number($("lg-int").value),
        feelings: [...document.querySelectorAll("#lg-feel .chip[aria-pressed='true']")].map((c) => c.textContent),
        place: $("lg-place").value.trim(),
        instead: $("lg-instead").value.trim(),
        outcome: document.querySelector("input[name='lg-out']:checked").value
      };
      state.logs.push(entry); save();
      if (entry.outcome === "slipped") { openSlip(entry.at); }
      else { closeSheet(); toast("Saved. That's a win."); refresh(); }
    });
  }

  /* ---------------- I slipped ---------------- */
  function openSlip(at) {
    openSheet(`
      <h2 id="sheet-title">Get back up</h2>
      <p class="lead">A fall is not the end of the walk. Confess it, learn from it, and start again today.</p>
      <blockquote class="scripture">${scriptureHTML(pick(window.GRACE_VERSES))}</blockquote>
      <label class="field"><span>When did it happen?</span><input type="datetime-local" id="sl-at" value="${toLocalInput(at || new Date())}"></label>
      <label class="field"><span>What led here?</span><textarea id="sl-trigger" rows="3" placeholder="Tired, alone, scrolling late at night" maxlength="600"></textarea></label>
      <label class="field"><span>What will you do differently next time?</span><textarea id="sl-lesson" rows="3" placeholder="Phone stays out of the bedroom" maxlength="600"></textarea></label>
      <div class="sheet-actions">
        <button type="button" class="btn btn-dawn btn-block" id="sl-save">Start again</button>
        <button type="button" class="btn btn-ghost btn-block" id="sl-cancel">Cancel</button>
      </div>`);
    $("sl-cancel").addEventListener("click", () => { closeSheet(); refresh(); });
    $("sl-save").addEventListener("click", () => {
      let when = fromLocalInput($("sl-at").value) || new Date().toISOString();
      if (new Date(when) > new Date()) when = new Date().toISOString();
      const streakDays = state.startDate ? Math.floor(daysBetween(state.startDate, when)) : 0;
      state.resets.push({ id: uid(), at: when, streakDays, trigger: $("sl-trigger").value.trim(), lesson: $("sl-lesson").value.trim() });
      state.startDate = when;
      save(); closeSheet(); show("today");
      toast("Day one. You got back up.");
    });
  }

  /* ---------------- Rescue screen ---------------- */
  let rescueTimer = null, breathTimer = null, rescueEnds = 0;

  function openRescue() {
    $("rescue-verse").innerHTML = scriptureHTML(pick(window.TEMPTATION_VERSES));
    $("rescue-prayer").textContent = pick(window.PRAYERS);
    $("escape-list").innerHTML = window.ESCAPE_ACTIONS.map((a) => `<li>${esc(a)}</li>`).join("");

    const p = state.profile;
    if (p.partnerPhone) {
      const num = p.partnerPhone.replace(/[^\d+]/g, "");
      const who = p.partnerName || "your partner";
      // iOS uses "&body=", most others accept "?body="
      const sep = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) ? "&" : "?";
      $("reach").innerHTML = `
        <a class="btn btn-quiet btn-block" href="sms:${num}${sep}body=${encodeURIComponent(p.message)}">Text ${esc(who)}</a>
        <a class="btn btn-quiet btn-block" href="tel:${num}">Call ${esc(who)}</a>`;
    } else {
      $("reach").innerHTML = `<p>Tip: add an accountability partner in Settings so you can text them from here in one tap.</p>`;
    }

    $("rescue").hidden = false; $("rescue").scrollTop = 0;
    document.body.style.overflow = "hidden";
    startRescueTimer(); startBreathing();
  }

  function closeRescue() {
    clearInterval(rescueTimer); clearTimeout(breathTimer);
    $("rescue").hidden = true;
    document.body.style.overflow = "";
  }

  function startRescueTimer() {
    rescueEnds = Date.now() + 5 * 60000;
    $("timer-note").textContent = "Urges rise, peak, and fall. Stay with this for five minutes.";
    const tick = () => {
      const left = Math.max(0, rescueEnds - Date.now());
      const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
      $("rescue-timer").textContent = `${m}:${String(s).padStart(2, "0")}`;
      if (left === 0) {
        clearInterval(rescueTimer);
        $("timer-note").textContent = "Five minutes. You stayed. Keep going with one of the steps below.";
      }
    };
    clearInterval(rescueTimer); tick(); rescueTimer = setInterval(tick, 500);
  }

  function startBreathing() {
    const ring = $("breath-ring"), word = $("breath-word");
    const steps = [["in", "Breathe in", 4000], ["hold", "Hold", 4000], ["out", "Breathe out", 6000]];
    let i = 0;
    const next = () => {
      const [cls, label, ms] = steps[i % steps.length];
      ring.className = "breath-ring " + cls; word.textContent = label;
      i++; breathTimer = setTimeout(next, ms);
    };
    clearTimeout(breathTimer); ring.className = "breath-ring"; requestAnimationFrame(() => next());
  }

  $("btn-struggle").addEventListener("click", openRescue);
  $("rescue-close").addEventListener("click", closeRescue);
  $("made-it").addEventListener("click", () => { closeRescue(); openLog({ outcome: "resisted", intensity: 7 }); });
  $("rescue-slip").addEventListener("click", () => { closeRescue(); openLog({ outcome: "slipped", intensity: 7 }); });
  $("btn-log").addEventListener("click", () => openLog());
  $("btn-slip").addEventListener("click", () => openSlip());

  /* ---------------- PIN ---------------- */
  async function hashPin(pin, salt) {
    const text = salt + ":" + pin;
    if (window.crypto?.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    // Fallback for non-HTTPS testing (e.g. local network). Less secure.
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return "fnv" + (h >>> 0).toString(16);
  }

  // One keypad handles unlocking and setting a new PIN
  let pinBuffer = "", pinMode = "unlock", firstPin = "";
  function lockMode(mode, hint) {
    pinMode = mode; pinBuffer = ""; firstPin = mode === "confirm" ? firstPin : "";
    $("lock-hint").textContent = hint;
    $("forgot-pin").textContent = mode === "unlock" ? "Forgot PIN" : "Cancel";
    drawDots();
    $("lock").hidden = false;
  }
  function drawDots() {
    [...$("pin-dots").children].forEach((d, i) => d.classList.toggle("on", i < pinBuffer.length));
  }
  function shake(msg) {
    const dots = $("pin-dots");
    dots.classList.remove("shake"); void dots.offsetWidth; dots.classList.add("shake");
    pinBuffer = ""; drawDots(); if (msg) $("lock-hint").textContent = msg;
  }
  async function pinComplete() {
    if (pinMode === "unlock") {
      const h = await hashPin(pinBuffer, state.pin.salt);
      if (h === state.pin.hash) { $("lock").hidden = true; pinBuffer = ""; drawDots(); refresh(); }
      else shake("Wrong PIN. Try again.");
    } else if (pinMode === "new") {
      firstPin = pinBuffer; lockMode("confirm", "Enter it again to confirm");
    } else if (pinMode === "confirm") {
      if (pinBuffer !== firstPin) { lockMode("new", "Those didn't match. Choose a 4-digit PIN."); shake(); return; }
      const salt = uid();
      state.pin = { salt, hash: await hashPin(pinBuffer, salt) };
      save(); $("lock").hidden = true; firstPin = ""; pinBuffer = ""; pinMode = "unlock";
      renderSettings(); toast("PIN set");
    }
  }
  function pressKey(k) {
    if (k === "del") { pinBuffer = pinBuffer.slice(0, -1); drawDots(); return; }
    if (pinBuffer.length >= 4) return;
    pinBuffer += k; drawDots();
    if (pinBuffer.length === 4) setTimeout(pinComplete, 120);
  }
  $("keypad").addEventListener("click", (e) => { const k = e.target.closest("button")?.dataset.k; if (k) pressKey(k); });
  document.addEventListener("keydown", (e) => {
    if ($("lock").hidden) return;
    if (/^\d$/.test(e.key)) pressKey(e.key);
    if (e.key === "Backspace") pressKey("del");
    if (e.key === "Escape" && pinMode !== "unlock") cancelPinSetup();
  });
  function cancelPinSetup() { $("lock").hidden = true; pinMode = "unlock"; pinBuffer = ""; firstPin = ""; }
  $("forgot-pin").addEventListener("click", () => {
    if (pinMode !== "unlock") { cancelPinSetup(); return; }
    if (confirm("There's no way to recover a PIN because nothing leaves this device. Erase all data and start fresh?")) eraseAll();
  });

  $("set-pin").addEventListener("click", () => lockMode("new", "Choose a 4-digit PIN"));
  $("remove-pin").addEventListener("click", () => {
    if (!confirm("Remove your PIN? Anyone who opens the app will see your entries.")) return;
    state.pin = null; save(); renderSettings(); toast("PIN removed");
  });
  $("lock-now").addEventListener("click", () => lockMode("unlock", "Enter your PIN"));

  let hiddenAt = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (state?.pin && hiddenAt && Date.now() - hiddenAt > LOCK_AFTER_MS) {
      lockMode("unlock", "Enter your PIN");
    }
    if (state?.startDate) refresh();
  });

  /* ---------------- Backup ---------------- */
  $("export").addEventListener("click", async () => {
    const name = `daily-walk-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const data = JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
    const file = new File([data], name, { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Daily Walk backup" });
        return;
      }
    } catch (e) { if (e.name === "AbortError") return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Backup exported");
  });
  $("import").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", async (e) => {
    const f = e.target.files[0]; e.target.value = "";
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || !Array.isArray(data.logs) || !Array.isArray(data.resets)) throw new Error("Not a Daily Walk backup");
      if (!confirm("Replace everything in this app with the backup?")) return;
      delete data.exportedAt;
      state = normalize(data);
      save(); refresh(); renderSettings(); toast("Backup imported");
    } catch (err) { toast("That file isn't a Daily Walk backup."); }
  });

  function eraseAll() {
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    location.reload();
  }
  $("erase").addEventListener("click", () => {
    if (confirm("Erase all entries, your streak and settings from this device? This can't be undone.")) eraseAll();
  });

  /* ---------------- Onboarding ---------------- */
  document.querySelectorAll("input[name='ob-start']").forEach((r) => r.addEventListener("change", () => {
    const pickDate = document.querySelector("input[name='ob-start']:checked").value === "pick";
    $("ob-date").hidden = !pickDate;
    if (pickDate && !$("ob-date").value) $("ob-date").value = toLocalInput(Date.now() - 7 * DAY);
  }));
  $("ob-begin").addEventListener("click", () => {
    state = freshState();
    state.profile.name = $("ob-name").value.trim();
    state.profile.partnerName = $("ob-partner").value.trim();
    state.profile.partnerPhone = $("ob-phone").value.trim();
    const pickDate = document.querySelector("input[name='ob-start']:checked").value === "pick";
    let start = pickDate ? fromLocalInput($("ob-date").value) : null;
    if (!start || new Date(start) > new Date()) start = new Date().toISOString();
    state.startDate = start;
    save();
    $("onboarding").hidden = true; $("app").hidden = false;
    show("today");
  });

  /* ---------------- Boot ---------------- */
  function refresh() { if (currentView === "today") renderToday(); if (currentView === "journal") renderJournal(); }

  if (!state || !state.startDate) {
    $("onboarding").hidden = false;
  } else {
    $("app").hidden = false;
    show("today");
    if (state.pin) lockMode("unlock", "Enter your PIN");
  }
  setInterval(() => { if (!document.hidden && currentView === "today") renderToday(); }, 60000);

  // Offline support (needs HTTPS or localhost, e.g. GitHub Pages)
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").catch((e) => console.warn("Service worker not registered", e));
  }
})();
