/***********************
 * Panel Central v1
 * 100% GitHub Pages
 * - Import CSV (Formato A)
 * - Turnos + Guardia semanal
 * - Bandeja + Drag&Drop por horas
 * - Guardado local (localStorage)
 ************************/

const LS = {
  ROSTERS: "panel_rosters_v1",   // { sector: { year, month, days, names, matrix } }
  TASKS:   "panel_tasks_v1",     // { dateKey: { sector: { tray:[], blocks:[] } } }
};

const SHIFT = {
  M: { label: "Mañana", hours: [8,9,10,11,12,13,14] },           // 7 slots
  T: { label: "Tarde",  hours: [15,16,17,18,19,20,21] },         // 7 slots
  N: { label: "Noche",  hoursA: [22,23], hoursB: [0,1,2,3,4,5,6,7] }, // 10 slots
  D: { label: "Descanso" }
};

const DEFAULT_FONT_CSV = `Nombre,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28
SERGIO IVÁN RAEZ MARTÍNEZ,D,M,M,M,M,D,T,T,N,D,D,M,M,D,D,T,N,D,D,D,D,D,M,M,M,M,D,T
SINUHE BAILÓN BAILÓN,T,N,D,D,M,M,D,D,T,N,D,D,D,D,D,D,M/T,M/N,M/D,M,M,D,D,T,N,D,D,M,M
CARLOS GARCÍA ESPINOSA,D,T,N,D,D,D,D,D/T,D/T,M/N,M/D,M/D,M,M,D,M,T,N,D,D,M,D,D,M,T,N,D
MIGUEL LÓPEZ DEL AGUILA,D,M,M,M,M,M,D,D,M,T,N,D,D,M,M,D,M,M,M,M,D,D,M,M,M,M,M,D
JONATHAN ORTEGA ROBLES,D,M,T,N,D,D,M,M,D,M,M,D,T,N,D,D,M,T,N,D,D,D,M,T,N,D,D
ANGELA M GONZALEZ GONZALEZ,M,D,EF1,EF1,EF1,M,D,D,M,M,T,N,D,D,D,D,M,M,M,D,T,D,D,M,M,M,D,T
ISICIO ZAFRA CANTOS,D,M,M,T,N,D,D,D,M,M,M,T,N,D,D,D,M,M,M,D,N,D,D,M,M,M,D,N
ANGEL ANT. SÁNCHEZ ROJAS,D,M,M,M,M,N,D,D,M,M,M,M,D,T,N,D,D,M,M,M,M/D,D,M,M,M,M,D,T
DAVID SEGURA JIMENEZ,D,M,M,M,D,T,N,N,D,D,M,M,M,M,D,M,M,M,M,M,D,D,M,M,M,M,D,N
OSCAR RODRIGUEZ TORRES,N,D,D,M,M,M,D,D,M,M,M,D,T,T,N,D,D,M,M,M,D,D,M,M,M,M,D,T
ANTONIO MEGIAS RUIZ,D,M,M,M,M,M,D,D,M,M,M,M,D,D,D,M,M,M,M,M,D,D,M,M,M,M,D,T
JUAN MANUEL ARGUELLES BAREA,D,M,M,M,M,M,D,D,M,M,M,M,D,D,D,M,M,M,M,M,D,D,M,M,M,M,D,T`;

// ---------- Helpers ----------
const $ = (id) => document.getElementById(id);

function todayISO(){
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(Date.now() - tz).toISOString().slice(0,10);
}

function tomorrowISO(){
  return addDays(todayISO(), 1);
}

function parseCSV(text){
  // CSV simple: separador coma, sin comillas complejas
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const rows = lines.map(l => l.split(",").map(x => x.trim()));
  return rows;
}

function getState(){
  return {
    rosters: JSON.parse(localStorage.getItem(LS.ROSTERS) || "{}"),
    tasks: JSON.parse(localStorage.getItem(LS.TASKS) || "{}"),
  };
}

function setRosters(rosters){
  localStorage.setItem(LS.ROSTERS, JSON.stringify(rosters));
}

function setTasks(tasks){
  localStorage.setItem(LS.TASKS, JSON.stringify(tasks));
}

function dateKey(dateISO){
  return dateISO;
}

function isoToYMD(dateISO){
  const [y,m,d] = dateISO.split("-").map(Number);
  return {y,m,d};
}

function dayOfWeek(dateISO){
  const d = new Date(dateISO+"T00:00:00");
  return d.getDay(); // 0 dom..6 sáb
}

function weekKey(dateISO){
  // ISO week
  const d = new Date(dateISO+"T00:00:00");
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(weekNo).padStart(2,"0")}`;
}

function mondayOfWeek(dateISO){
  const d = new Date(dateISO+"T00:00:00");
  const day = d.getDay(); // 0 domingo
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  return mon.toISOString().slice(0,10);
}

function addDays(dateISO, delta){
  const d = new Date(dateISO+"T00:00:00");
  d.setDate(d.getDate()+delta);
  return d.toISOString().slice(0,10);
}

function normalizeSector(s){ return s; }

function codeHasMorning(code){
  // M, M/T, M/N, etc. cuenta como mañana para guardia
  return (code || "").includes("M");
}

function primaryShift(code){
  // para mostrar timeline por turno: priorizamos M > T > N > D, y si es combinado elige el primero
  const c = (code||"").toUpperCase();
  if(c.includes("M")) return "M";
  if(c.includes("T")) return "T";
  if(c.includes("N")) return "N";
  if(c.includes("D")) return "D";
  // especiales: EF1, OT, etc -> consideramos D visual (sin timeline), pero lo mostramos en badge
  return "D";
}

function currentShiftByHour(hour = new Date().getHours()){
  if(hour >= 8 && hour <= 14) return "M";
  if(hour >= 15 && hour <= 21) return "T";
  return "N";
}

function shiftPriorityForDate(dateISO){
  const now = todayISO();
  const active = (dateISO === now) ? currentShiftByHour() : "M";
  const orderMap = {
    M: ["M","T","N","D"],
    T: ["T","N","M","D"],
    N: ["N","M","T","D"],
  };
  return { active, order: orderMap[active] || ["M","T","N","D"] };
}

function uid(){
  return crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
}

// ---------- Roster import ----------
function importRosterFromCSV(sector, year, month, csvText){
  const rows = parseCSV(csvText);
  const header = rows[0]; // Nombre,1,2,...,28
  const dayNums = header.slice(1).map(x => Number(x));
  const days = dayNums.length;

  const names = [];
  const matrix = []; // matrix[i][day-1] = code

  for(let r=1; r<rows.length; r++){
    const name = rows[r][0];
    if(!name) continue;
    names.push(name);
    const codes = rows[r].slice(1, 1+days);
    matrix.push(codes);
  }

  return {
    sector: normalizeSector(sector),
    year, month, days,
    names, matrix
  };
}

function getTurnCode(roster, name, day){
  const i = roster.names.indexOf(name);
  if(i < 0) return "D";
  return roster.matrix[i][day-1] || "D";
}

function rosterHasDate(roster, dateISO){
  const {y,m,d} = isoToYMD(dateISO);
  return roster && roster.year === y && roster.month === m && d >= 1 && d <= roster.days;
}

// ---------- Guardia semanal ----------
function computeGuardForWeek(roster, dateISO){
  if(!rosterHasDate(roster, dateISO)) return null;
  const wk = weekKey(dateISO);
  const mon = mondayOfWeek(dateISO);

  const weekdays = [0,1,2,3,4].map(i => addDays(mon, i)); // L-V
  // Solo si esos días están dentro del mes del roster
  const days = weekdays
    .map(ds => isoToYMD(ds))
    .filter(x => x.y===roster.year && x.m===roster.month)
    .map(x => x.d);

  const candidates = [];
  for(const name of roster.names){
    let ok = true;
    for(const day of days){
      const code = getTurnCode(roster, name, day);
      if(!codeHasMorning(code)){ ok=false; break; }
    }
    if(ok && days.length===5) candidates.push(name);
  }

  if(candidates.length === 1) return { week: wk, guard: candidates[0], status: "ok" };
  if(candidates.length === 0) return { week: wk, guard: null, status: "none" };
  return { week: wk, guard: candidates[0], status: "multi", candidates };
}

// ---------- Tasks model ----------
/*
tasks[date][sector] = {
  tray: [{id,type,title,dur}],
  blocks: [{id, trayId, type, title, dur, name, startHour}]
}
*/
function ensureDaySector(tasks, dateISO, sector){
  const dk = dateKey(dateISO);
  tasks[dk] ||= {};
  tasks[dk][sector] ||= { tray: [], blocks: [] };
  return tasks[dk][sector];
}

function computeLoadForTech(daySector, name){
  const blocks = daySector.blocks.filter(b => b.name === name);
  const hours = blocks.reduce((acc,b)=>acc + Number(b.dur||0),0);
  return hours;
}

function loadPercent(turno, loadHours){
  // M/T: 7h disponibles; N: 10h
  const cap = (turno==="N") ? 10 : (turno==="D" ? 0 : 7);
  if(cap === 0) return 0;
  return Math.min(100, Math.round((loadHours / cap) * 100));
}

// ---------- Render ----------
function setActiveSectorCard(sector){
  $("cardElec").classList.toggle("active", sector==="Electricidad");
  $("cardFont").classList.toggle("active", sector==="Fontanería");
}

function renderSectorSummaries(state, dateISO){
  const { rosters, tasks } = state;

  for(const sector of ["Electricidad","Fontanería"]){
    const roster = rosters[sector];
    const daySector = ensureDaySector(tasks, dateISO, sector);
    const incCount = daySector.tray.filter(t=>t.type==="Correctivo").length;

    // Guardia
    let guardLabel = "—";
    if(rosterHasDate(roster, dateISO)){
      const g = computeGuardForWeek(roster, dateISO);
      if(g?.guard) guardLabel = g.guard;
      else if(g?.status==="multi") guardLabel = "⚠️ múltiple";
      else guardLabel = "—";
    }

    // Disponibles: en turno (no D) y carga < cap
    let free = 0;
    let avgLoad = 0;
    let count = 0;

    if(rosterHasDate(roster, dateISO)){
      const {d} = isoToYMD(dateISO);
      for(const name of roster.names){
        const code = getTurnCode(roster, name, d);
        const turno = primaryShift(code);
        if(turno === "D") continue;
        const load = computeLoadForTech(daySector, name);
        const cap = (turno==="N") ? 10 : 7;
        if(load < cap) free++;
        avgLoad += loadPercent(turno, load);
        count++;
      }
    }
    const avg = count ? Math.round(avgLoad/count) : 0;

    const guardHtml = `<b class="guardLabel">${escapeHtml(guardLabel)}</b>`;
    const freeHtml = `<b class="freeLabel">${free}</b>`;
    const incHtml = `<b class="incLabel">${incCount}</b>`;
    const loadHtml = `<b class="loadLabel">${avg}%</b>`;

    if(sector==="Electricidad"){
      $("elecGuard").innerHTML = guardHtml;
      $("elecFree").innerHTML = freeHtml;
      $("elecInc").innerHTML = incHtml;
      $("elecLoad").innerHTML = loadHtml;
    }else{
      $("fontGuard").innerHTML = guardHtml;
      $("fontFree").innerHTML = freeHtml;
      $("fontInc").innerHTML = incHtml;
      $("fontLoad").innerHTML = loadHtml;
    }
  }

  setTasks(tasks); // persist
}

function renderMonthHeatmap(state, dateISO){
  const { rosters } = state;
  const { y, m } = isoToYMD(dateISO);

  const sectorHtml = ["Electricidad","Fontanería"].map((sector) => {
    const roster = rosters[sector];
    if(!roster || roster.year !== y || roster.month !== m){
      return `<div class="monthSector"><div class="monthSectorTitle">${sector}</div><div class="mday none">Sin cuadrante del mes</div></div>`;
    }

    const days = Array.from({length: roster.days}).map((_, i) => {
      const day = i + 1;
      const counts = { M:0, T:0, N:0, D:0 };
      for(const name of roster.names){
        const shift = primaryShift(getTurnCode(roster, name, day));
        counts[shift] = (counts[shift] || 0) + 1;
      }
      const mainShift = ["M","T","N","D"].sort((a,b) => counts[b]-counts[a])[0] || "D";
      return `<div class="mday ${mainShift}" title="M:${counts.M} T:${counts.T} N:${counts.N} D:${counts.D}"><b>${day}</b><small>${mainShift}</small></div>`;
    }).join("");

    return `<div class="monthSector"><div class="monthSectorTitle">${sector}</div><div class="monthGrid">${days}</div></div>`;
  }).join("");

  $("monthHeatmap").innerHTML = sectorHtml;
}

function renderTray(state, dateISO, sector){
  const { tasks } = state;
  const daySector = ensureDaySector(tasks, dateISO, sector);

  const corr = daySector.tray.filter(t=>t.type==="Correctivo");
  const prev = daySector.tray.filter(t=>t.type==="Preventivo");
  const guard = daySector.tray.filter(t=>t.type==="Guardia móvil");

  const makeCard = (t) => {
    const cls = t.type==="Correctivo" ? "red" : (t.type==="Guardia móvil" ? "blue" : "yellow");
    return `
      <div class="cardTask ${cls}" draggable="true" data-trayid="${t.id}">
        <div>
          <div class="t">${escapeHtml(t.title)}</div>
          <div class="d">${t.type}</div>
        </div>
        <div class="pillDur">${t.dur}h</div>
      </div>
    `;
  };

  $("trayCorrectivos").innerHTML = corr.map(makeCard).join("") || `<div class="muted">Sin correctivos</div>`;
  $("trayPreventivos").innerHTML = prev.map(makeCard).join("") || `<div class="muted">Sin preventivos</div>`;
  $("trayGuardia").innerHTML = guard.map(makeCard).join("") || `<div class="muted">Sin guardia móvil</div>`;

  for(const el of document.querySelectorAll(".cardTask")){
    el.addEventListener("dragstart", onDragStartTray);
  }
}

function renderTechGrid(state, dateISO, sector){
  const { rosters, tasks } = state;
  const roster = rosters[sector];
  const daySector = ensureDaySector(tasks, dateISO, sector);

  if(!roster || !rosterHasDate(roster, dateISO)){
    $("techGrid").innerHTML = `
      <div class="muted">
        No hay cuadrante cargado para <b>${sector}</b> en esta fecha.
        Pulsa <b>Importar cuadrante</b> y pega el CSV.
      </div>
    `;
    return;
  }

  const {d} = isoToYMD(dateISO);
  const guardInfo = computeGuardForWeek(roster, dateISO);
  const guardName = guardInfo?.guard || null;
  const shiftPriority = ["M","T","N","D"];
  $("shiftFocus").textContent = "Orden visual por turnos: Mañana → Tarde → Noche → Descanso. Dentro de cada turno se ordena por la primera hora con tarea.";

  const blocksByTech = new Map();
  for(const b of daySector.blocks){
    blocksByTech.set(b.name, (blocksByTech.get(b.name)||[]).concat([b]));
  }

  const orderedNames = [...roster.names].sort((a,b) => {
    const aShift = primaryShift(getTurnCode(roster, a, d));
    const bShift = primaryShift(getTurnCode(roster, b, d));
    const aRank = shiftPriority.indexOf(aShift);
    const bRank = shiftPriority.indexOf(bShift);
    if(aRank !== bRank) return aRank - bRank;

    const aFirstHour = firstAssignedHour(daySector, a, aShift);
    const bFirstHour = firstAssignedHour(daySector, b, bShift);
    if(aFirstHour !== bFirstHour) return aFirstHour - bFirstHour;

    return a.localeCompare(b, "es");
  });

  const techCards = orderedNames.map(name => {
    const code = getTurnCode(roster, name, d);
    const turno = primaryShift(code);
    const isOff = (turno==="D");
    const isGuard = guardName && name === guardName;

    const load = computeLoadForTech(daySector, name);
    const pct = loadPercent(turno, load);

    let barColor = "rgba(29,215,95,.85)";
    if(pct >= 85) barColor = "rgba(255,77,77,.75)";
    else if(pct >= 70) barColor = "rgba(255,211,77,.75)";

    const barHtml = `<div class="bar"><div style="width:${pct}%;background:${barColor}"></div></div>`;

    const badges = `
      ${isGuard ? `<span class="badge guard">📱 GUARDIA MÓVIL</span>`:``}
      <span class="badge ${isOff ? "off":""}">${turno} · ${SHIFT[turno]?.label || turno}</span>
      ${code && !["M","T","N","D"].includes(code) ? `<span class="badge">${escapeHtml(code)}</span>` : ``}
    `;

    // timeline slots
    const slotHtml = buildTimelineSlots(daySector, name, turno);

    return `
      <div class="techCard shift-${turno} ${isGuard ? "guard phone-owner":""}">
        <div class="techHead">
          <div>
            <div class="techName">${escapeHtml(name)}</div>
            <div class="techSub">${sector}</div>
          </div>
          <div class="badges">${badges}</div>
        </div>

        <div class="loadRow">
          <div>Carga: <b>${load}h</b></div>
          <div>${pct}%</div>
        </div>
        ${barHtml}

        <div class="timeline">
          ${slotHtml}
        </div>
      </div>
    `;
  });

  $("techGrid").innerHTML = techCards.join("");

  // bind events for slots/blocks
  for(const slot of document.querySelectorAll(".slot")){
    slot.addEventListener("dragover", onDragOverSlot);
    slot.addEventListener("dragleave", onDragLeaveSlot);
    slot.addEventListener("drop", onDropSlot);
  }
  for(const block of document.querySelectorAll(".block")){
    block.addEventListener("dragstart", onDragStartBlock);
    block.addEventListener("dblclick", () => markBlockDone(state, dateISO, sector, block.dataset.blockid));
  }
  for(const removeBtn of document.querySelectorAll(".blockRemove")){
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeBlockFromTech(state, dateISO, sector, removeBtn.dataset.blockid);
    });
  }

  // Persist tasks
  setTasks(tasks);
}

function buildTimelineSlots(daySector, name, turno){
  if(turno === "D"){
    return `<div class="timeRow">${Array.from({length:7}).map(()=>`<div class="slot off">—</div>`).join("")}</div>`;
  }

  // get blocks for tech
  const blocks = daySector.blocks.filter(b => b.name===name);

  const makeSlot = (h) => {
    // is this hour occupied by a block?
    const block = blocks.find(b => occupiesHour(b, h, turno));
    if(block && block.startHour === h){
      const cls = block.type==="Correctivo" ? "corr" : "prev";
      return `<div class="block ${cls}" draggable="true" data-blockid="${block.id}" title="${escapeHtml(block.title)}">${shortTitle(block.title)}<button class="blockRemove" data-blockid="${block.id}" title="Quitar tarea">×</button></div>`;
    }
    if(block){
      // hour inside a block but not start => render as filled placeholder
      const cls = block.type==="Correctivo" ? "corr" : "prev";
      return `<div class="block ${cls}" draggable="true" data-blockid="${block.id}"><span class="mini">…</span></div>`;
    }
    return `<div class="slot" data-tech="${escapeHtmlAttr(name)}" data-turn="${turno}" data-hour="${h}">${String(h).padStart(2,"0")}</div>`;
  };

  if(turno === "M" || turno === "T"){
    const hours = SHIFT[turno].hours;
    return `<div class="timeRow">${hours.map(makeSlot).join("")}</div>`;
  }

  // N: two rows
  const rowA = SHIFT.N.hoursA.map(makeSlot).join("");
  const rowB = SHIFT.N.hoursB.map(makeSlot).join("");
  return `
    <div class="timeRow nightA">${rowA}</div>
    <div class="timeRow nightB">${rowB}</div>
  `;
}

function firstAssignedHour(daySector, techName, turno){
  const hours = timelineHours(turno);
  const starts = daySector.blocks
    .filter(b => b.name===techName)
    .map(b => hours.indexOf(b.startHour))
    .filter(x => x >= 0)
    .sort((a,b)=>a-b);
  return starts.length ? starts[0] : Number.POSITIVE_INFINITY;
}

function occupiesHour(block, hour, turno){
  // duration in hours. Occupies [startHour, startHour+dur)
  // For night wrap: works because we use hour values 22..23 then 0..7
  const dur = Number(block.dur||1);
  const hours = timelineHours(turno);
  const startIdx = hours.indexOf(block.startHour);
  const idx = hours.indexOf(hour);
  if(startIdx < 0 || idx < 0) return false;
  return idx >= startIdx && idx < startIdx + dur;
}

function timelineHours(turno){
  if(turno==="M"||turno==="T") return SHIFT[turno].hours;
  if(turno==="N") return SHIFT.N.hoursA.concat(SHIFT.N.hoursB);
  return [];
}

function shortTitle(t){
  const s = String(t||"");
  if(s.length <= 12) return s;
  return s.slice(0,12) + "…";
}

function escapeHtml(s){
  return String(s||"")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function escapeHtmlAttr(s){
  return String(s||"").replaceAll('"',"&quot;");
}

// ---------- Drag & Drop ----------
let dragPayload = null;
// payload: {kind:'tray', trayId} OR {kind:'block', blockId}

function onDragStartTray(e){
  const trayId = e.currentTarget.dataset.trayid;
  dragPayload = { kind:"tray", trayId };
  e.dataTransfer.setData("text/plain", JSON.stringify(dragPayload));
}

function onDragStartBlock(e){
  const blockId = e.currentTarget.dataset.blockid;
  dragPayload = { kind:"block", blockId };
  e.dataTransfer.setData("text/plain", JSON.stringify(dragPayload));
}

function onDragOverSlot(e){
  e.preventDefault();
  e.currentTarget.classList.add("over");
}

function onDragLeaveSlot(e){
  e.currentTarget.classList.remove("over");
}

function onDropSlot(e){
  e.preventDefault();
  e.currentTarget.classList.remove("over");

  const raw = e.dataTransfer.getData("text/plain");
  if(!raw) return;
  let payload;
  try{ payload = JSON.parse(raw); }catch{ return; }

  const tech = e.currentTarget.dataset.tech;
  const turno = e.currentTarget.dataset.turn;
  const hour = Number(e.currentTarget.dataset.hour);

  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;

  const state = getState();
  const daySector = ensureDaySector(state.tasks, dateISO, sector);

  // cannot place if overlaps
  const hours = timelineHours(turno);

  if(payload.kind === "tray"){
    const t = daySector.tray.find(x => x.id===payload.trayId);
    if(!t) return;

    const dur = Number(t.dur||1);
    if(!canPlace(daySector, tech, turno, hour, dur)) {
      alert("Hueco ocupado o fuera de rango.");
      return;
    }

    // create block
    const block = {
      id: uid(),
      trayId: t.id,
      type: t.type,
      title: t.title,
      dur: dur,
      name: tech,
      startHour: hour
    };
    daySector.blocks.push(block);

    // remove from tray
    daySector.tray = daySector.tray.filter(x => x.id !== t.id);

    setTasks(state.tasks);
    rerenderAll();
    return;
  }

  if(payload.kind === "block"){
    const b = daySector.blocks.find(x => x.id===payload.blockId);
    if(!b) return;

    const dur = Number(b.dur||1);
    if(!canPlace(daySector, tech, turno, hour, dur, b.id)) {
      alert("Hueco ocupado o fuera de rango.");
      return;
    }

    b.name = tech;
    b.startHour = hour;

    setTasks(state.tasks);
    rerenderAll();
  }
}

function canPlace(daySector, tech, turno, hour, dur, ignoreBlockId=null){
  const hours = timelineHours(turno);
  const startIdx = hours.indexOf(hour);
  if(startIdx < 0) return false;
  if(startIdx + dur > hours.length) return false;

  // check overlap with existing blocks for that tech (in this sector+day)
  const blocks = daySector.blocks.filter(b => b.name===tech && b.id !== ignoreBlockId);

  for(let i=0;i<dur;i++){
    const h = hours[startIdx+i];
    for(const b of blocks){
      if(occupiesHour(b, h, turno)) return false;
    }
  }
  return true;
}

function markBlockDone(state, dateISO, sector, blockId){
  const daySector = ensureDaySector(state.tasks, dateISO, sector);
  const b = daySector.blocks.find(x => x.id===blockId);
  if(!b) return;
  // v1: doble click => devuelve a bandeja como “hecho” (o lo elimina)
  // Para no perder info, lo movemos a bandeja como Preventivo/Correctivo terminado (etiqueta)
  daySector.blocks = daySector.blocks.filter(x => x.id !== blockId);
  daySector.tray.push({
    id: uid(),
    type: b.type,
    title: `${b.type === "Guardia móvil" ? "📱" : "✅"} ` + b.title,
    dur: b.dur
  });
  setTasks(state.tasks);
  rerenderAll();
}

function removeBlockFromTech(state, dateISO, sector, blockId){
  const daySector = ensureDaySector(state.tasks, dateISO, sector);
  const b = daySector.blocks.find(x => x.id===blockId);
  if(!b) return;

  daySector.blocks = daySector.blocks.filter(x => x.id !== blockId);
  daySector.tray.push({
    id: uid(),
    type: b.type,
    title: b.title,
    dur: b.dur
  });
  setTasks(state.tasks);
  rerenderAll();
}

// ---------- Buttons ----------
function openModal(el){ el.classList.remove("hidden"); }
function closeModal(el){ el.classList.add("hidden"); }

function addTrayCard(type){
  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;
  const state = getState();
  const daySector = ensureDaySector(state.tasks, dateISO, sector);

  daySector.tray.push({
    id: uid(),
    type,
    title: type==="Correctivo"
      ? "INC-____ | Ubicación | 1h"
      : (type==="Guardia móvil" ? "Guardia móvil — incidencia" : "PM — Preventivo"),
    dur: 1
  });

  setTasks(state.tasks);
  rerenderAll();
}

function autoAssignPreventivos(){
  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;

  const state = getState();
  const roster = state.rosters[sector];
  if(!rosterHasDate(roster, dateISO)){
    alert("No hay cuadrante para este sector en esta fecha.");
    return;
  }

  const daySector = ensureDaySector(state.tasks, dateISO, sector);
  const {d} = isoToYMD(dateISO);

  const guard = computeGuardForWeek(roster, dateISO)?.guard || null;

  // toma solo preventivos de bandeja
  const prevs = daySector.tray.filter(t=>t.type==="Preventivo");
  if(prevs.length === 0){ alert("No hay preventivos en bandeja."); return; }

  // lista técnicos en turno M (si es mañana) o turno actual según horario actual
  // v1 simple: asigna a los que NO están D, priorizando menos carga y evitando guardia
  const techs = roster.names.map(name=>{
    const code = getTurnCode(roster, name, d);
    const turno = primaryShift(code);
    const load = computeLoadForTech(daySector, name);
    return {name, turno, load, isOff: turno==="D", isGuard: guard && name===guard};
  }).filter(x=>!x.isOff);

  techs.sort((a,b)=>{
    // guardia al final
    if(a.isGuard && !b.isGuard) return 1;
    if(!a.isGuard && b.isGuard) return -1;
    return a.load - b.load;
  });

  // asigna preventivos en el primer hueco disponible de su turno
  let remaining = [...prevs];
  for(const t of techs){
    if(remaining.length === 0) break;

    // v1: si es guardia, solo asigna si no hay otros (evitarlo)
    if(t.isGuard && techs.some(x=>!x.isGuard)) continue;

    const hours = timelineHours(t.turno);
    for(let i=0;i<hours.length;i++){
      if(remaining.length === 0) break;
      const task = remaining[0];
      const dur = Number(task.dur||1);
      const h = hours[i];
      if(canPlace(daySector, t.name, t.turno, h, dur)){
        daySector.blocks.push({
          id: uid(),
          trayId: task.id,
          type: task.type,
          title: task.title,
          dur: dur,
          name: t.name,
          startHour: h
        });
        daySector.tray = daySector.tray.filter(x => x.id !== task.id);
        remaining.shift();
      }
    }
  }

  setTasks(state.tasks);
  rerenderAll();
}

function closeDay(){
  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;
  const state = getState();
  const daySector = ensureDaySector(state.tasks, dateISO, sector);

  // v1: limpia bandeja y convierte bloques en “hechos” (para no saturar)
  const doneCount = daySector.blocks.length;
  daySector.blocks = [];
  daySector.tray = [];

  setTasks(state.tasks);
  rerenderAll();
  alert(`Día cerrado (${sector}). Tareas limpiadas: ${doneCount}`);
}

// ---------- Rerender ----------
function rerenderAll(){
  const state = getState();
  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;

  setActiveSectorCard(sector);
  renderSectorSummaries(state, dateISO);
  renderMonthHeatmap(state, dateISO);
  renderTray(state, dateISO, sector);
  renderTechGrid(state, dateISO, sector);
}

// ---------- Import modal actions ----------
function processCsv(){
  const sector = $("sectorSelect").value;
  const csvText = $("csvInput").value.trim();
  if(!csvText){
    alert("Pega un CSV primero.");
    return;
  }

  // En este caso: febrero 2026 (28 días). Si luego importas otros meses, lo ajustamos.
  // v1: detecta días por cabecera, y te pedirá año/mes fijo si no coincide.
  const year = 2026;
  const month = 2;

  const roster = importRosterFromCSV(sector, year, month, csvText);

  const state = getState();
  state.rosters[sector] = roster;
  setRosters(state.rosters);

  alert(`Cuadrante guardado para ${sector} — ${year}-${String(month).padStart(2,"0")}`);
  closeModal($("modalImport"));
  rerenderAll();
}

function resetAll(){
  if(!confirm("¿Reset TOTAL? Borrará cuadrantes y tareas guardadas en este navegador.")) return;
  localStorage.removeItem(LS.ROSTERS);
  localStorage.removeItem(LS.TASKS);
  $("csvInput").value = "";
  rerenderAll();
}

// ---------- Quick modal ----------
function openQuick(){
  $("quickTitle").value = "";
  $("quickDur").value = "1";
  $("quickType").value = "Preventivo";
  openModal($("modalQuick"));
}
function createQuickCard(){
  const type = $("quickType").value;
  const title = $("quickTitle").value.trim() || (type==="Correctivo" ? "INC-____ | Ubicación" : (type==="Guardia móvil" ? "Guardia móvil — incidencia" : "PM — Preventivo"));
  const dur = Math.max(1, Number($("quickDur").value || 1));

  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;
  const state = getState();
  const daySector = ensureDaySector(state.tasks, dateISO, sector);

  daySector.tray.push({ id: uid(), type, title, dur });
  setTasks(state.tasks);

  closeModal($("modalQuick"));
  rerenderAll();
}

// ---------- Bootstrap ----------
function bootstrap(){
  $("datePicker").value = tomorrowISO();

  // Activar por defecto Fontanería y cargar roster default si no hay
  const state = getState();
  if(!state.rosters["Fontanería"]){
    state.rosters["Fontanería"] = importRosterFromCSV("Fontanería", 2026, 2, DEFAULT_FONT_CSV);
    setRosters(state.rosters);
  }

  // Handlers
  $("sectorSelect").addEventListener("change", () => {
    rerenderAll();
  });
  $("datePicker").addEventListener("change", () => rerenderAll());

  $("btnImport").addEventListener("click", () => {
    openModal($("modalImport"));
    $("csvInput").value = "";
  });
  $("btnCloseImport").addEventListener("click", () => closeModal($("modalImport")));
  $("btnLoadDefault").addEventListener("click", () => { $("csvInput").value = DEFAULT_FONT_CSV; });
  $("btnProcessCsv").addEventListener("click", processCsv);
  $("btnResetAll").addEventListener("click", resetAll);

  $("btnNewCorrectivo").addEventListener("click", () => addTrayCard("Correctivo"));
  $("btnNewPreventivo").addEventListener("click", () => addTrayCard("Preventivo"));
  $("btnNewGuardia").addEventListener("click", () => addTrayCard("Guardia móvil"));

  $("btnQuick").addEventListener("click", openQuick);
  $("btnCloseQuick").addEventListener("click", () => closeModal($("modalQuick")));
  $("btnCreateCard").addEventListener("click", createQuickCard);

  $("btnAuto").addEventListener("click", autoAssignPreventivos);
  $("btnCloseDay").addEventListener("click", closeDay);

  // Click en tarjetas de sector arriba para seleccionar
  $("cardElec").addEventListener("click", () => { $("sectorSelect").value="Electricidad"; rerenderAll(); });
  $("cardFont").addEventListener("click", () => { $("sectorSelect").value="Fontanería"; rerenderAll(); });

  // Render inicial
  rerenderAll();
}

bootstrap();
