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
  PHONES:  "panel_phones_v1",    // { sector: { techName: phone } }
  CHANGES: "panel_shift_changes_v1", // [{...registro de cambios...}]
  INCIDENTS: "panel_incidents_v1",
  OTS: "panel_ots_v1",
  CUSTOM_TYPES: "panel_custom_types_v1",
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

function formatCurrentTime(){
  return new Date().toLocaleTimeString("es-ES", { hour12:false });
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
    phones: JSON.parse(localStorage.getItem(LS.PHONES) || "{}"),
    changes: JSON.parse(localStorage.getItem(LS.CHANGES) || "[]"),
    incidents: JSON.parse(localStorage.getItem(LS.INCIDENTS) || "[]"),
    ots: JSON.parse(localStorage.getItem(LS.OTS) || "[]"),
    customTypes: JSON.parse(localStorage.getItem(LS.CUSTOM_TYPES) || "[]"),
  };
}

function setRosters(rosters){
  localStorage.setItem(LS.ROSTERS, JSON.stringify(rosters));
}

function setTasks(tasks){
  localStorage.setItem(LS.TASKS, JSON.stringify(tasks));
}

function setPhones(phones){
  localStorage.setItem(LS.PHONES, JSON.stringify(phones));
}

function setChanges(changes){
  localStorage.setItem(LS.CHANGES, JSON.stringify(changes));
}

function setIncidents(incidents){
  localStorage.setItem(LS.INCIDENTS, JSON.stringify(incidents));
}

function setOTs(ots){
  localStorage.setItem(LS.OTS, JSON.stringify(ots));
}

function setCustomTypes(customTypes){
  localStorage.setItem(LS.CUSTOM_TYPES, JSON.stringify(customTypes));
}

const mediaState = {
  incidentPhotos: [],
  otPhotos: [],
};

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

function codeHasShift(code, shift){
  return String(code || "").toUpperCase().includes(shift);
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

function findAssignedMobileGuard(daySector){
  const mobileGuards = daySector.blocks.filter((b) => b.type === "Guardia móvil");
  if(mobileGuards.length === 0) return null;
  return mobileGuards[mobileGuards.length - 1].name || null;
}

function findMobileGuardByShift(roster, dateISO, shift){
  if(!rosterHasDate(roster, dateISO)) return null;
  const { d } = isoToYMD(dateISO);
  for(const name of roster.names){
    const code = getTurnCode(roster, name, d);
    if(codeHasShift(code, shift)) return name;
  }
  return null;
}

function findAutoMobileGuard(roster, dateISO, hour = new Date().getHours()){
  const shift = currentShiftByHour(hour);
  return { shift, name: findMobileGuardByShift(roster, dateISO, shift) };
}

function buildWeekSequenceBadges(roster, name, dateISO){
  if(!roster || !rosterHasDate(roster, dateISO)) return "";
  const mon = mondayOfWeek(dateISO);
  const labels = ["L","M","X","J","V","S","D"];
  return Array.from({length: 7}).map((_, i) => {
    const dayIso = addDays(mon, i);
    if(!rosterHasDate(roster, dayIso)) return `<span class="seqTag D">${labels[i]}:-</span>`;
    const { d } = isoToYMD(dayIso);
    const code = getTurnCode(roster, name, d) || "D";
    return `<span class="seqTag ${primaryShift(code)}">${labels[i]}:${escapeHtml(code)}</span>`;
  }).join("");
}

function weekShiftSequence(roster, name, dateISO){
  if(!roster || !rosterHasDate(roster, dateISO)) return "";
  const mon = mondayOfWeek(dateISO);
  const labels = ["L","M","X","J","V","S","D"];
  const seq = Array.from({length: 7}).map((_, i) => {
    const dayIso = addDays(mon, i);
    if(!rosterHasDate(roster, dayIso)) return `${labels[i]}:-`;
    const { d } = isoToYMD(dayIso);
    return `${labels[i]}:${getTurnCode(roster, name, d) || "D"}`;
  });
  return seq.join(" · ");
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
  tasks[dk][sector] ||= { tray: [], blocks: [], overflow: [] };
  tasks[dk][sector].overflow ||= [];
  return tasks[dk][sector];
}

function computeLoadForTech(daySector, name){
  const blocks = daySector.blocks.filter(b => b.name === name);
  const overflow = (daySector.overflow || []).filter((b) => b.name === name);
  const hours = blocks.reduce((acc,b)=>acc + Number(b.dur||0),0) + overflow.reduce((acc,b)=>acc + Number(b.dur||0),0);
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
    const assignedMobileGuard = findAssignedMobileGuard(daySector);

    // Guardia
    let guardLabel = "—";
    if(assignedMobileGuard){
      guardLabel = assignedMobileGuard;
    } else if(rosterHasDate(roster, dateISO)){
      const autoGuard = findAutoMobileGuard(roster, dateISO);
      if(autoGuard.name) guardLabel = `${autoGuard.name} (${autoGuard.shift})`;
      else {
        const g = computeGuardForWeek(roster, dateISO);
        if(g?.guard) guardLabel = g.guard;
        else if(g?.status==="multi") guardLabel = "⚠️ múltiple";
        else guardLabel = "—";
      }
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

function renderWeeklyCalendars(state, dateISO, selectedSector){
  const { rosters } = state;
  const monday = mondayOfWeek(dateISO);
  const days = Array.from({length:7}).map((_,i)=> addDays(monday, i));
  const today = todayISO();

  const dayHeader = days.map((day) => {
    const dt = new Date(day+"T00:00:00");
    const name = dt.toLocaleDateString("es-ES", { weekday:"short" });
    const n = String(dt.getDate()).padStart(2, "0");
    const todayClass = day === today ? "todayCol" : "";
    return `<div class="calHeadCell ${todayClass}">${escapeHtml(name)} ${n}</div>`;
  }).join("");

  const sectors = [selectedSector || "Fontanería"];
  const sectorHtml = sectors.map((sector) => {
    const roster = rosters[sector];
    if(!roster){
      return `<div class="weekSector"><div class="weekSectorTitle">${sector}</div><div class="muted">Sin cuadrante cargado.</div></div>`;
    }

    const guardRow = days.map((day) => {
      const todayClass = day === today ? "todayCol" : "";
      if(!rosterHasDate(roster, day)) return `<div class="calCell out ${todayClass}">—</div>`;
      const autoM = findMobileGuardByShift(roster, day, "M") || "—";
      const autoT = findMobileGuardByShift(roster, day, "T") || "—";
      const autoN = findMobileGuardByShift(roster, day, "N") || "—";
      const activeShift = day === today ? currentShiftByHour() : "M";
      return `<div class="calCell mobileCell ${todayClass}">
        <div class="mShift ${activeShift === "M" ? "active" : ""}">M: ${escapeHtml(shortTitle(autoM))}</div>
        <div class="mShift ${activeShift === "T" ? "active" : ""}">T: ${escapeHtml(shortTitle(autoT))}</div>
        <div class="mShift ${activeShift === "N" ? "active" : ""}">N: ${escapeHtml(shortTitle(autoN))}</div>
      </div>`;
    }).join("");

    const rows = roster.names.map((name) => {
      const cells = days.map((day) => {
        const todayClass = day === today ? "todayCol" : "";
        if(!rosterHasDate(roster, day)){
          return `<div class="calCell out ${todayClass}">—</div>`;
        }
        const {d} = isoToYMD(day);
        const code = getTurnCode(roster, name, d) || "D";
        const shift = primaryShift(code);
        return `<button class="calCell shift-${shift} ${todayClass}" title="${escapeHtml(day)}" data-sector="${escapeHtmlAttr(sector)}" data-name="${escapeHtmlAttr(name)}" data-date="${escapeHtmlAttr(day)}" data-day="${d}" data-code="${escapeHtmlAttr(code)}">${escapeHtml(code)}</button>`;
      }).join("");
      return `<div class="calRow"><div class="calTech">${escapeHtml(name)}</div>${cells}</div>`;
    }).join("");

    return `
      <div class="weekSector">
        <div class="weekSectorTitle">${sector}</div>
        <div class="calTable">
          <div class="calHeader"><div class="calTechHead">Técnico</div>${dayHeader}</div>
          <div class="calRow mobileRow"><div class="calTech">📱 Guardia móvil (automática por hora)</div>${guardRow}</div>
          <div class="calBody">${rows}</div>
        </div>
      </div>
    `;
  }).join("");

  $("weeklyCalendars").innerHTML = sectorHtml;

  for(const cell of document.querySelectorAll(".calCell[data-day]")){
    cell.addEventListener("click", onWeeklyCellEdit);
  }
}

function onWeeklyCellEdit(e){
  const cell = e.currentTarget;
  const currentCode = (cell.dataset.code || "D").toUpperCase();
  const message = `Turno actual: ${currentCode}.\nEscribe nuevo turno (M/T/N/D):`;
  const next = prompt(message, currentCode);
  if(next === null) return;

  const nextCode = next.trim().toUpperCase();
  if(!["M","T","N","D"].includes(nextCode)){
    alert("Solo se permite M, T, N o D.");
    return;
  }
  if(nextCode === currentCode) return;

  if(!confirm(`¿Cambiar turno de ${cell.dataset.name} en ${cell.dataset.date} de ${currentCode} a ${nextCode}?`)) return;

  updateRosterShift(cell.dataset.sector, cell.dataset.name, Number(cell.dataset.day), nextCode);
}

function updateRosterShift(sector, techName, day, nextCode){
  const state = getState();
  const roster = state.rosters[sector];
  if(!roster) return;
  const techIndex = roster.names.indexOf(techName);
  if(techIndex < 0) return;
  if(day < 1 || day > roster.days) return;

  roster.matrix[techIndex][day - 1] = nextCode;
  state.rosters[sector] = roster;
  setRosters(state.rosters);
  rerenderAll();
  generateAutoReport();
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
        <div class="durControl">
          <input class="durInput" type="number" min="1" step="1" value="${Number(t.dur||1)}" data-traydurid="${t.id}" aria-label="Duración en horas" />
          <span class="pillDur">h</span>
        </div>
      </div>
    `;
  };

  $("trayCorrectivos").innerHTML = corr.map(makeCard).join("") || `<div class="muted">Sin correctivos</div>`;
  $("trayPreventivos").innerHTML = prev.map(makeCard).join("") || `<div class="muted">Sin preventivos</div>`;
  $("trayGuardia").innerHTML = guard.map(makeCard).join("") || `<div class="muted">Sin guardia móvil</div>`;

  for(const el of document.querySelectorAll(".cardTask")){
    el.addEventListener("dragstart", onDragStartTray);
  }
  for(const input of document.querySelectorAll(".durInput")){
    input.addEventListener("click", (e) => e.stopPropagation());
    input.addEventListener("dragstart", (e) => e.preventDefault());
    input.addEventListener("change", onTrayDurationChange);
  }
}

function renderTechGrid(state, dateISO, sector){
  const { rosters, tasks, phones } = state;
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
  const assignedMobileGuard = findAssignedMobileGuard(daySector);
  const guardName = assignedMobileGuard || guardInfo?.guard || null;
  const shiftPriority = ["M","T","N","D"];
  $("shiftFocus").textContent = "Orden visual por turnos: Mañana → Tarde → Noche → Descanso. Dentro de cada turno se ordena por la primera hora con tarea.";

  const blocksByTech = new Map();
  for(const b of daySector.blocks){
    blocksByTech.set(b.name, (blocksByTech.get(b.name)||[]).concat([b]));
  }

  const orderedNames = [...roster.names].sort((a,b) => {
    const aGuard = guardName && a === guardName;
    const bGuard = guardName && b === guardName;
    if(aGuard && !bGuard) return -1;
    if(!aGuard && bGuard) return 1;

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
    const phone = phones?.[sector]?.[name] || "";
    const shiftSeq = buildWeekSequenceBadges(roster, name, dateISO);

    const load = computeLoadForTech(daySector, name);
    const pct = loadPercent(turno, load);

    let barColor = "rgba(29,215,95,.85)";
    if(pct >= 85) barColor = "rgba(255,77,77,.75)";
    else if(pct >= 70) barColor = "rgba(255,211,77,.75)";

    const barHtml = `<div class="bar"><div style="width:${pct}%;background:${barColor}"></div></div>`;

    const badges = `
      ${isGuard ? `<span class="badge guard">📱 GUARDIA MÓVIL</span>`:``}
      ${phone ? `<a class="badge phone callLink" href="tel:${escapeHtmlAttr(phone)}" title="Llamar a ${escapeHtmlAttr(name)}">📞 ${escapeHtml(phone)}</a>` : `<span class="badge phone mutedPhone">☎ Sin teléfono</span>`}
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
            <div class="weekSeq">${shiftSeq}</div>
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
        <button class="btn btn-small btn-outline addExtraTask" data-tech="${escapeHtmlAttr(name)}">+ Añadir tarea extra</button>
        <div class="overflowWrap">${renderOverflowTasks(daySector, name)}</div>
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
  for(const addBtn of document.querySelectorAll(".addExtraTask")){
    addBtn.addEventListener("click", () => createOverflowTask(addBtn.dataset.tech));
  }
  for(const removeBtn of document.querySelectorAll(".overflowRemove")){
    removeBtn.addEventListener("click", () => removeOverflowTask(dateISO, sector, removeBtn.dataset.overflowid));
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

function renderOverflowTasks(daySector, name){
  const extra = (daySector.overflow || []).filter((item) => item.name === name);
  if(extra.length === 0) return `<div class="muted">Sin tareas extra</div>`;
  return extra.map((item) => `
    <div class="overflowItem">
      <div><b>${escapeHtml(item.title)}</b> <small>${item.type} · ${item.dur}h</small></div>
      <button class="overflowRemove" data-overflowid="${item.id}" title="Quitar">×</button>
    </div>
  `).join("");
}

function createOverflowTask(techName){
  const type = prompt("Tipo de tarea extra (Correctivo / Preventivo / Guardia móvil):", "Preventivo");
  if(type === null) return;
  const title = prompt("Título de la tarea extra:", "Tarea adicional");
  if(title === null) return;
  const dur = Math.max(1, Number(prompt("Duración en horas:", "1") || 1));

  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;
  const state = getState();
  const daySector = ensureDaySector(state.tasks, dateISO, sector);

  daySector.overflow.push({
    id: uid(),
    name: techName,
    type: String(type).trim() || "Preventivo",
    title: String(title).trim() || "Tarea adicional",
    dur
  });

  setTasks(state.tasks);
  rerenderAll();
}

function removeOverflowTask(dateISO, sector, overflowId){
  const state = getState();
  const daySector = ensureDaySector(state.tasks, dateISO, sector);
  daySector.overflow = (daySector.overflow || []).filter((item) => item.id !== overflowId);
  setTasks(state.tasks);
  rerenderAll();
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


function setAutoReportOutput(text){
  const el = $("autoReportOutput");
  if(el) el.textContent = text;
}

function formatListLine(label, value){
  return `- ${label}: ${value}`;
}

function buildDailyAutoReport(){
  const state = getState();
  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;
  const daySector = ensureDaySector(state.tasks, dateISO, sector);

  const incidents = state.incidents.filter((i) => i.dateISO === dateISO && i.sector === sector);
  const ots = state.ots.filter((o) => o.dateISO === dateISO && o.sector === sector);

  const doneBlocks = daySector.blocks.length;
  const pendingTray = daySector.tray.length;
  const extraTasks = (daySector.overflow || []).length;

  const byType = daySector.blocks.reduce((acc, b) => {
    acc[b.type] = (acc[b.type] || 0) + 1;
    return acc;
  }, {});

  const incidentOpen = incidents.filter((x) => x.status !== "Cerrada").length;
  const otFinal = ots.filter((x) => x.step >= 2).length;

  const lines = [
    `INFORME AUTOMÁTICO · ${dateISO} · ${sector}`,
    "",
    "Resumen operativo",
    formatListLine("Tareas asignadas en timeline", doneBlocks),
    formatListLine("Tareas pendientes en bandeja", pendingTray),
    formatListLine("Tareas extra", extraTasks),
    formatListLine("Bloques Correctivo", byType["Correctivo"] || 0),
    formatListLine("Bloques Preventivo", byType["Preventivo"] || 0),
    formatListLine("Bloques Guardia móvil", byType["Guardia móvil"] || 0),
    "",
    "Calidad de datos (móvil/QR)",
    formatListLine("Incidencias totales", incidents.length),
    formatListLine("Incidencias abiertas", incidentOpen),
    formatListLine("OT totales", ots.lengthh),
    formatListLine("OT finalizadas", otFinal),
    "",
    "Pendientes de completar desde móvil",
    ...incidents.filter((i) => !(i.location || "") || !(i.photos || []).length).slice(0,6).map((i) => `- INC: ${i.title}`),
    ...ots.filter((o) => !(o.area || "") || !(o.photos || []).length).slice(0,6).map((o) => `- OT: ${o.title}`),
  ];

  const hasPending = lines[lines.length - 1]?.startsWith("- ");
  if(!hasPending) lines.push("- Ninguno");

  return lines.join("\n");
}

function generateAutoReport(){
  setAutoReportOutput(buildDailyAutoReport());
}

function setupTouchDragAndDrop(){
  const trayLists = ["trayCorrectivos", "trayPreventivos", "trayGuardia"];
  const cards = trayLists.flatMap((id) => [...$(id).querySelectorAll('.cardTask')]);
  for(const card of cards){
    card.addEventListener("touchstart", onTouchStartCard, { passive: false });
    card.addEventListener("touchmove", onTouchMoveCard, { passive: false });
    card.addEventListener("touchend", onTouchEndCard, { passive: false });
  }
}

let touchDragState = null;

function onTouchStartCard(e){
  const card = e.currentTarget;
  const trayId = card.dataset.trayid;
  if(!trayId) return;
  const touch = e.touches[0];
  touchDragState = { trayId, card, startX: touch.clientX, startY: touch.clientY };
  card.classList.add("touchDragging");
}

function onTouchMoveCard(e){
  if(!touchDragState) return;
  e.preventDefault();
  const t = e.touches[0];
  touchDragState.card.style.transform = `translate(${t.clientX - touchDragState.startX}px, ${t.clientY - touchDragState.startY}px)`;

  const el = document.elementFromPoint(t.clientX, t.clientY);
  for(const slot of document.querySelectorAll('.slot.touchOver')) slot.classList.remove('touchOver');
  const slot = el?.closest?.('.slot');
  if(slot && !slot.classList.contains('off')) slot.classList.add('touchOver');
}

function onTouchEndCard(e){
  if(!touchDragState) return;
  const changed = e.changedTouches[0];
  const el = document.elementFromPoint(changed.clientX, changed.clientY);
  const slot = el?.closest?.('.slot');

  touchDragState.card.classList.remove('touchDragging');
  touchDragState.card.style.transform = '';
  for(const over of document.querySelectorAll('.slot.touchOver')) over.classList.remove('touchOver');

  if(slot && !slot.classList.contains('off')){
    const payload = { kind: "tray", trayId: touchDragState.trayId };
    placePayloadInSlot(payload, slot);
  }

  touchDragState = null;
}

function placePayloadInSlot(payload, slot){
  const tech = slot.dataset.tech;
  const turno = slot.dataset.turn;
  const hour = Number(slot.dataset.hour);
  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;
  const state = getState();
  const daySector = ensureDaySector(state.tasks, dateISO, sector);

  if(payload.kind !== "tray") return;
  const t = daySector.tray.find(x => x.id === payload.trayId);
  if(!t) return;
  const dur = Number(t.dur || 1);

  if(!canPlace(daySector, tech, turno, hour, dur)) return;

  daySector.blocks.push({
    id: uid(), trayId: t.id, type: t.type, title: t.title, dur, name: tech, startHour: hour
  });
  daySector.tray = daySector.tray.filter(x => x.id !== t.id);
  setTasks(state.tasks);
  rerenderAll();
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
      if(confirm("No hay hueco en la línea horaria. ¿Quieres asignarla como tarea extra para este técnico?")){
        daySector.overflow.push({
          id: uid(),
          name: tech,
          type: t.type,
          title: t.title,
          dur
        });
        daySector.tray = daySector.tray.filter(x => x.id !== t.id);
        setTasks(state.tasks);
        rerenderAll();
      }
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

function onTrayDurationChange(e){
  const trayId = e.currentTarget.dataset.traydurid;
  const nextDur = Math.max(1, Number(e.currentTarget.value || 1));
  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;

  const state = getState();
  const daySector = ensureDaySector(state.tasks, dateISO, sector);
  const task = daySector.tray.find((x) => x.id === trayId);
  if(!task) return;

  task.dur = nextDur;
  setTasks(state.tasks);
  rerenderAll();
}

let activePage = "planner";

function setActivePage(page){
  activePage = page;
  const pages = {
    planner: "pagePlanner",
    incidents: "pageIncidents",
    ot: "pageOT",
  };
  for(const [name, id] of Object.entries(pages)){
    $(id).classList.toggle("hidden", name !== page);
  }
  $("btnPagePlanner").classList.toggle("btn-primary", page === "planner");
  $("btnPageIncidents").classList.toggle("btn-primary", page === "incidents");
  $("btnPageOT").classList.toggle("btn-primary", page === "ot");
}

function createIncident(){
  const title = $("incTitle").value.trim();
  if(!title){ alert("Indica título de incidencia"); return; }
  const state = getState();
  const incident = {
    id: uid(),
    createdAt: new Date().toISOString(),
    sector: $("sectorSelect").value,
    dateISO: $("datePicker").value,
    title,
    location: $("incLocation").value.trim(),
    priority: $("incPriority").value,
    owner: $("incOwner").value.trim(),
    notes: $("incNotes").value.trim(),
    photos: [...mediaState.incidentPhotos],
    status: "Pendiente",
  };
  const linkedOT = buildOTFromIncident(incident);
  incident.linkedOtId = linkedOT.id;

  state.incidents.unshift(incident);
  state.ots.unshift(linkedOT);
  setIncidents(state.incidents);
  setOTs(state.ots);
  $("incTitle").value = "";
  $("incLocation").value = "";
  $("incOwner").value = "";
  $("incNotes").value = "";
  mediaState.incidentPhotos = [];
  renderPhotoPreview("incident");
  $("incQrStatus").textContent = "";
  renderIncidents();
  renderOTs();
}

function buildOTFromIncident(incident){
  const now = new Date().toISOString();
  return {
    id: uid(),
    createdAt: now,
    sector: incident.sector,
    dateISO: incident.dateISO,
    title: incident.title,
    area: incident.location,
    reportedBy: incident.owner,
    data: incident.notes,
    photos: [...(incident.photos || [])],
    step: 0,
    reports: [
      { step: "Inicial", date: now, note: `OT creada automáticamente desde incidencia ${incident.title}` }
    ],
  };
}

function cycleIncidentStatus(id){
  const states = ["Pendiente", "Revisando", "Cerrada"];
  const state = getState();
  const item = state.incidents.find((x) => x.id === id);
  if(!item) return;
  const idx = states.indexOf(item.status);
  item.status = states[(idx + 1) % states.length];
  setIncidents(state.incidents);
  renderIncidents();
}

function renderIncidents(){
  const state = getState();
  const statusClass = {
    "Pendiente": "pending",
    "Revisando": "review",
    "Cerrada": "closed",
  };
  const html = state.incidents.map((item) => {
    const hasPhoto = (item.photos || []).length > 0;
    const hasQR = Boolean(item.location || "");
    const pendingMedia = !hasPhoto || !hasQR;
    return `
    <div class="stackItem">
      <div class="cardTitleRow"><b>${escapeHtml(item.title)}</b> <span class="metaPill">${escapeHtml(item.priority)}</span> <span class="statusPill ${statusClass[item.status] || "pending"}">${escapeHtml(item.status)}</span></div>
      <div class="muted">${escapeHtml(item.dateISO)} · ${escapeHtml(item.sector)} · ${escapeHtml(item.location || "Sin ubicación")}</div>
      <div class="cardMetaRow">
        <span class="metaPill">📷 ${hasPhoto ? `${(item.photos || []).length} adjunta(s)` : "Pendiente"}</span>
        <span class="metaPill">📍 ${hasQR ? "QR/ubicación OK" : "Escaneo pendiente"}</span>
        ${item.linkedOtId ? `<span class="metaPill">🛠️ OT auto-creada</span>` : ""}
        ${pendingMedia ? `<span class="statusPill missing">Completar luego en móvil</span>` : ""}
      </div>
      <div>${escapeHtml(item.notes || "Sin detalle")}</div>
      <div class="miniPhotos">${(item.photos || []).slice(0,4).map((src) => `<img src="${escapeHtmlAttr(src)}" alt="Foto incidencia" />`).join("")}</div>
      <div class="stackActions">
        <button class="btn btn-small incidentStatus" data-id="${item.id}">Cambiar estado</button>
      </div>
    </div>
  `;
  }).join("") || `<div class="muted">Sin incidencias.</div>`;
  $("incidentList").innerHTML = html;
  for(const btn of document.querySelectorAll(".incidentStatus")){
    btn.addEventListener("click", () => cycleIncidentStatus(btn.dataset.id));
  }
}

function createOT(){
  const title = $("otTitle").value.trim();
  if(!title){ alert("Indica el defecto para crear OT."); return; }
  const state = getState();
  const textPhotos = $("otPhotos").value.trim();
  const mergedPhotos = [
    ...mediaState.otPhotos,
    ...textPhotos.split(",").map((x) => x.trim()).filter(Boolean),
  ];
  state.ots.unshift({
    id: uid(),
    createdAt: new Date().toISOString(),
    sector: $("sectorSelect").value,
    dateISO: $("datePicker").value,
    title,
    area: $("otArea").value.trim(),
    reportedBy: $("otReportedBy").value.trim(),
    data: $("otData").value.trim(),
    photos: mergedPhotos,
    step: 0,
    reports: [
      { step: "Inicial", date: new Date().toISOString(), note: "OT creada" }
    ],
  });
  setOTs(state.ots);
  $("otTitle").value = "";
  $("otArea").value = "";
  $("otReportedBy").value = "";
  $("otData").value = "";
  $("otPhotos").value = "";
  mediaState.otPhotos = [];
  renderPhotoPreview("ot");
  $("otQrStatus").textContent = "";
  renderOTs();
}

function advanceOT(id){
  const labels = ["Inicial", "Procesado", "Finalizado"];
  const state = getState();
  const item = state.ots.find((x) => x.id === id);
  if(!item) return;
  if(item.step < 2) item.step += 1;
  item.reports.push({
    step: labels[item.step],
    date: new Date().toISOString(),
    note: `Informe automático de etapa ${labels[item.step]}`
  });
  setOTs(state.ots);
  renderOTs();
}

function renderOTs(){
  const labels = ["Inicial", "Procesado", "Finalizado"];
  const labelClass = ["initial", "processing", "finalized"];
  const state = getState();
  const html = state.ots.map((item) => {
    const reports = item.reports.map((r) => `<li><b>${escapeHtml(r.step)}</b> · ${escapeHtml(r.date.slice(0,10))} · ${escapeHtml(r.note)}</li>`).join("");
    const hasPhoto = (item.photos || []).length > 0;
    const hasQR = Boolean(item.area || "");
    const pendingMedia = !hasPhoto || !hasQR;
    return `
      <div class="stackItem">
        <div class="cardTitleRow"><b>OT:</b> ${escapeHtml(item.title)} <span class="statusPill ${labelClass[item.step] || "initial"}">${labels[item.step]}</span></div>
        <div class="muted">${escapeHtml(item.area || "Sin área")} · ${escapeHtml(item.reportedBy || "Sin reporte")} · ${escapeHtml(item.dateISO)}</div>
        <div class="cardMetaRow">
          <span class="metaPill">📷 ${hasPhoto ? `${(item.photos || []).length} adjunta(s)` : "Pendiente"}</span>
          <span class="metaPill">📍 ${hasQR ? "QR/ubicación OK" : "Escaneo pendiente"}</span>
          ${pendingMedia ? `<span class="statusPill missing">Completar luego en móvil</span>` : ""}
        </div>
        <div>${escapeHtml(item.data || "Sin datos técnicos")}</div>
        <div class="miniPhotos">${(item.photos || []).slice(0,4).map((src) => `<img src="${escapeHtmlAttr(src)}" alt="Foto OT" />`).join("")}</div>
        <ul>${reports}</ul>
        <div class="stackActions">
          <button class="btn btn-small otAdvance" data-id="${item.id}" ${item.step >= 2 ? "disabled" : ""}>Avanzar etapa</button>
        </div>
      </div>
    `;
  }).join("") || `<div class="muted">Sin OT registradas.</div>`;

  $("otList").innerHTML = html;
  for(const btn of document.querySelectorAll(".otAdvance")){
    btn.addEventListener("click", () => advanceOT(btn.dataset.id));
  }
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
  const q = GLOBAL_SEARCH_Q;
  const state = getState();
  const dateISO = $("datePicker").value;
  const sector = $("sectorSelect").value;

  setActiveSectorCard(sector);
  renderSectorSummaries(state, dateISO);
  renderWeeklyCalendars(state, dateISO, sector);
  renderTray(state, dateISO, sector);
  setupTouchDragAndDrop();
  renderTechGrid(state, dateISO, sector);
  renderShiftChangeLog();
  renderIncidents();
  renderOTs();
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
  localStorage.removeItem(LS.CHANGES);
  localStorage.removeItem(LS.INCIDENTS);
  localStorage.removeItem(LS.OTS);
  $("csvInput").value = "";
  rerenderAll();
}

function openShiftRequest(){
  const state = getState();
  const sector = $("sectorSelect").value;
  const roster = state.rosters[sector];
  const dateISO = $("datePicker").value;
  const options = (roster?.names || []).map((name) => `<option value="${escapeHtmlAttr(name)}">${escapeHtml(name)}</option>`).join("");

  $("shiftReqDate").value = dateISO;
  $("shiftReqFrom").innerHTML = `<option value="">Selecciona técnico</option>${options}`;
  $("shiftReqTo").innerHTML = `<option value="">Selecciona cobertura</option>${options}`;
  $("shiftReqBy").value = "";
  $("shiftReqApproved").value = "";
  $("shiftReqNotes").value = "";
  openModal($("modalShiftRequest"));
}

function applyShiftRequest(){
  const state = getState();
  const sector = $("sectorSelect").value;
  const roster = state.rosters[sector];
  const dateISO = $("shiftReqDate").value;
  if(!roster || !rosterHasDate(roster, dateISO)){
    alert("No hay cuadrante para ese día/sector.");
    return;
  }

  const fromTech = $("shiftReqFrom").value;
  const toTech = $("shiftReqTo").value;
  const requestedBy = $("shiftReqBy").value.trim();
  const approvedBy = $("shiftReqApproved").value.trim();
  const notes = $("shiftReqNotes").value.trim();

  if(!fromTech || !toTech || fromTech === toTech){
    alert("Selecciona dos técnicos distintos.");
    return;
  }
  if(!requestedBy || !approvedBy){
    alert("Debes indicar solicitante y quien aprueba.");
    return;
  }

  const { d } = isoToYMD(dateISO);
  const fromIdx = roster.names.indexOf(fromTech);
  const toIdx = roster.names.indexOf(toTech);
  if(fromIdx < 0 || toIdx < 0) return;

  const fromCode = roster.matrix[fromIdx][d - 1] || "D";
  const toCode = roster.matrix[toIdx][d - 1] || "D";

  roster.matrix[fromIdx][d - 1] = toCode;
  roster.matrix[toIdx][d - 1] = fromCode;
  state.rosters[sector] = roster;

  state.changes.unshift({
    id: uid(),
    createdAt: new Date().toISOString(),
    sector,
    dateISO,
    fromTech,
    toTech,
    fromCode,
    toCode,
    requestedBy,
    approvedBy,
    notes,
  });

  setRosters(state.rosters);
  setChanges(state.changes);
  closeModal($("modalShiftRequest"));
  rerenderAll();
}

function renderShiftChangeLog(){
  const state = getState();
  const sector = $("sectorSelect").value;
  const rows = state.changes
    .filter((item) => item.sector === sector)
    .slice(0, 12)
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.dateISO)}</td>
        <td>${escapeHtml(item.fromTech)} (${escapeHtml(item.fromCode)})</td>
        <td>${escapeHtml(item.toTech)} (${escapeHtml(item.toCode)})</td>
        <td>${escapeHtml(item.requestedBy)}</td>
        <td>${escapeHtml(item.approvedBy)}</td>
        <td>${escapeHtml(item.notes || "—")}</td>
      </tr>
    `).join("");

  $("shiftChangeLog").innerHTML = rows || `<tr><td colspan="6" class="muted">Sin solicitudes registradas.</td></tr>`;
}

// ---------- Quick modal ----------
function openQuick(){
  $("quickTitle").value = "";
  $("quickDur").value = "1";
  $("quickType").value = "Preventivo";
  ensureQuickTypeOptions();
  openModal($("modalQuick"));
}

function ensureQuickTypeOptions(){
  const state = getState();
  const select = $("quickType");
  for(const oldOpt of [...select.querySelectorAll("option[data-custom='1']")]) oldOpt.remove();
  const newOpt = select.querySelector("option[value='__new']");
  for(const type of state.customTypes){
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    opt.dataset.custom = "1";
    select.insertBefore(opt, newOpt);
  }
}

function onQuickTypeChange(){
  if($("quickType").value !== "__new") return;
  const nextType = prompt("Escribe el nuevo tipo (ej: Permiso de horas, Médico)", "Permiso de horas");
  if(!nextType){ $("quickType").value = "Preventivo"; return; }
  const clean = nextType.trim();
  if(!clean){ $("quickType").value = "Preventivo"; return; }
  const state = getState();
  if(!state.customTypes.includes(clean)){
    state.customTypes.push(clean);
    setCustomTypes(state.customTypes);
  }
  ensureQuickTypeOptions();
  $("quickType").value = clean;
}
function createQuickCard(){
  const type = $("quickType").value;
  const title = $("quickTitle").value.trim() || (type==="Correctivo" ? "INC-____ | Ubicación" : (type==="Guardia móvil" ? "Guardia móvil — incidencia" : `${type} — tarea`));
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

async function filesToDataUrls(fileList){
  const files = [...(fileList || [])];
  const reads = files.map((file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  }));
  return (await Promise.all(reads)).filter(Boolean);
}


// ===================== GLOBAL SEARCH + SHARE =====================
// (no se guarda en localStorage; es solo filtro visual en pantalla)
let GLOBAL_SEARCH_Q = "";

function setGlobalSearch(q){
  GLOBAL_SEARCH_Q = (q || "").trim().toLowerCase();
  rerenderAll();
}

function textIncludes(hay, q){
  if(!q) return true;
  return String(hay || "").toLowerCase().includes(q);
}

function objectMatchesQuery(obj, q, fields){
  if(!q) return true;
  for(const f of fields){
    if(textIncludes(obj?.[f], q)) return true;
  }
  return false;
}

function buildShareLinks(text, subject="Informe diario"){
  const t = String(text || "");
  const wa = "https://wa.me/?text=" + encodeURIComponent(t);
  const mail = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(t);
  return { wa, mail };
}

function copyToClipboard(text){
  try{
    navigator.clipboard.writeText(String(text||""));
    toast?.("Copiado");
  }catch{
    // fallback
    const ta = document.createElement("textarea");
    ta.value = String(text||"");
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toast?.("Copiado");
  }
}

// Lightbox (fotos)
function openImageModal(src){
  const m = document.getElementById("modalImage");
  const img = document.getElementById("modalImageImg");
  if(!m || !img) return;
  img.src = src;
  openModal(m);
}
function closeImageModal(){
  const m = document.getElementById("modalImage");
  if(m) closeModal(m);
}
// ================================================================

// ===================== UBICACIONES QR (diccionario) =====================
const LOC_KEY = "panel_locations_v1";
function loadLocations(){
  try { return JSON.parse(localStorage.getItem(LOC_KEY) || "{}"); } catch { return {}; }
}
function saveLocations(map){
  localStorage.setItem(LOC_KEY, JSON.stringify(map || {}));
}
function getLocationName(code){
  const map = loadLocations();
  const k = String(code||"").trim().toUpperCase();
  return map?.[k]?.name || "";
}
function upsertLocation(code, name, notes=""){
  const map = loadLocations();
  const k = String(code||"").trim().toUpperCase();
  if(!k) return;
  map[k] = { name: String(name||"").trim(), notes: String(notes||"").trim(), updatedAt: new Date().toISOString() };
  saveLocations(map);
}
function deleteLocation(code){
  const map = loadLocations();
  const k = String(code||"").trim().toUpperCase();
  delete map[k];
  saveLocations(map);
}
function locationsToArray(){
  const map = loadLocations();
  return Object.keys(map).sort().map(k => ({ code:k, ...map[k] }));
}
// =======================================================================

// ===================== KANBAN (Incidencias / OT) =====================
const STATUS_COLS = ["Pendiente", "En curso", "Cerrada"];

function statusNext(s){
  const i = STATUS_COLS.indexOf(s);
  return STATUS_COLS[Math.min(i+1, STATUS_COLS.length-1)];
}
function statusPrev(s){
  const i = STATUS_COLS.indexOf(s);
  return STATUS_COLS[Math.max(i-1, 0)];
}

function renderKanbanBoard(container, items, kind){
  if(!container) return;
  const groups = { "Pendiente":[], "En curso":[], "Cerrada":[] };
  items.forEach(it => {
    const st = it.status || "Pendiente";
    (groups[st] || groups["Pendiente"]).push(it);
  });

  function priClass(p){
    const v = String(p||"").toLowerCase();
    if(v.includes("alta")) return "high";
    if(v.includes("baja")) return "low";
    return "med";
  }

  container.innerHTML = STATUS_COLS.map(st => `
    <div class="kanCol" data-col="${st}">
      <div class="kanHead">
        <div>${st}</div>
        <div class="kanCount">${(groups[st]||[]).length}</div>
      </div>
      <div class="kanList" id="${kind}_col_${st.replace(/\s+/g,'_')}"></div>
    </div>
  `).join("");

  STATUS_COLS.forEach(st => {
    const listEl = document.getElementById(`${kind}_col_${st.replace(/\s+/g,'_')}`);
    const arr = groups[st] || [];
    if(!listEl) return;
    listEl.innerHTML = arr.map(it => {
      const title = escapeHtml(it.title || "(sin título)");
      const where = escapeHtml((kind==="inc") ? (it.location||"") : (it.area||""));
      const who = escapeHtml((kind==="inc") ? (it.owner||"") : (it.reportedBy||""));
      const pri = (kind==="inc") ? (it.priority||"Media") : (it.priority||"Media");
      const priCls = priClass(pri);
      const id = it.id;
      const photosCount = (it.photos||[]).length;
      const qr = escapeHtml(it.qrCode||"");
      return `
        <div class="kanCard" data-id="${id}">
          <div class="kanTitle">${title}</div>
          <div class="kanMeta">
            ${where ? `<span class="badgePill">${where}</span>` : ""}
            ${pri ? `<span class="badgePill ${priCls}">${escapeHtml(pri)}</span>` : ""}
            ${who ? `<span class="badgePill">${who}</span>` : ""}
            ${qr ? `<span class="badgePill">QR: ${qr}</span>` : ""}
            <span class="badgePill">📷 ${photosCount}</span>
          </div>
          <div class="kanActions">
            <button class="btnTiny" data-prev="${id}" ${st==="Pendiente" ? "disabled" : ""}>⬅</button>
            <button class="btnTiny primary" data-next="${id}" ${st==="Cerrada" ? "disabled" : ""}>➡</button>
            <button class="btnTiny" data-sharewa="${id}">🟢 WA</button>
            <button class="btnTiny" data-sharemail="${id}">✉️</button>
            <button class="btnTiny" data-copy="${id}">📋</button>
            <button class="btnTiny danger" data-del="${id}">🗑</button>
          </div>
        </div>
      `;
    }).join("");

    // actions
    listEl.querySelectorAll("[data-next]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const id = b.getAttribute("data-next");
        if(kind==="inc"){
          const item = state.incidents.find(x=>x.id===id);
          if(!item) return;
          item.status = statusNext(item.status||"Pendiente");
          saveState();
          rerenderAll();
        }else{
          const item = state.ots.find(x=>x.id===id);
          if(!item) return;
          item.status = statusNext(item.status||"Pendiente");
          saveState();
          rerenderAll();
        }
      });
    });
    listEl.querySelectorAll("[data-prev]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const id = b.getAttribute("data-prev");
        if(kind==="inc"){
          const item = state.incidents.find(x=>x.id===id);
          if(!item) return;
          item.status = statusPrev(item.status||"Pendiente");
          saveState();
          rerenderAll();
        }else{
          const item = state.ots.find(x=>x.id===id);
          if(!item) return;
          item.status = statusPrev(item.status||"Pendiente");
          saveState();
          rerenderAll();
        }
      });
    });

    function buildItemText(kind, item){
      const date = $("datePicker")?.value || "";
      const sector = $("sectorSelect")?.value || "";
      const lines = [];
      if(kind==="inc"){
        lines.push(`🚨 INCIDENCIA (${sector})`);
        lines.push(`• ${item.title||""}`);
        if(item.location) lines.push(`📍 ${item.location}`);
        if(item.priority) lines.push(`⚠️ Prioridad: ${item.priority}`);
        if(item.owner) lines.push(`👤 Responsable: ${item.owner}`);
        lines.push(`📌 Estado: ${item.status||"Pendiente"}`);
        if(item.qrCode) lines.push(`🔳 QR: ${item.qrCode}`);
        if(item.notes) lines.push(`📝 ${item.notes}`);
      }else{
        lines.push(`🛠️ OT (${sector})`);
        lines.push(`• ${item.title||""}`);
        if(item.area) lines.push(`📍 ${item.area}`);
        if(item.reportedBy) lines.push(`👤 Reporta: ${item.reportedBy}`);
        lines.push(`📌 Estado: ${item.status||"Pendiente"}`);
        if(item.qrCode) lines.push(`🔳 QR: ${item.qrCode}`);
        if(item.data) lines.push(`🧾 ${item.data}`);
      }
      lines.push(`📅 ${date}`);
      return lines.filter(Boolean).join("\n");
    }

    listEl.querySelectorAll("[data-copy]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const id=b.getAttribute("data-copy");
        const item = (kind==="inc") ? state.incidents.find(x=>x.id===id) : state.ots.find(x=>x.id===id);
        if(!item) return;
        copyToClipboard(buildItemText(kind,item));
      });
    });
    listEl.querySelectorAll("[data-sharewa]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const id=b.getAttribute("data-sharewa");
        const item = (kind==="inc") ? state.incidents.find(x=>x.id===id) : state.ots.find(x=>x.id===id);
        if(!item) return;
        const text = buildItemText(kind,item);
        const {wa} = buildShareLinks(text, kind==="inc" ? "Incidencia" : "OT");
        window.open(wa, "_blank");
      });
    });
    listEl.querySelectorAll("[data-sharemail]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const id=b.getAttribute("data-sharemail");
        const item = (kind==="inc") ? state.incidents.find(x=>x.id===id) : state.ots.find(x=>x.id===id);
        if(!item) return;
        const text = buildItemText(kind,item);
        const {mail} = buildShareLinks(text, kind==="inc" ? "Incidencia" : "OT");
        window.location.href = mail;
      });
    });
    listEl.querySelectorAll("[data-del]").forEach(b=>{
      b.addEventListener("click", ()=>{
        const id=b.getAttribute("data-del");
        if(!confirm("¿Borrar elemento?")) return;
        if(kind==="inc"){
          state.incidents = state.incidents.filter(x=>x.id!==id);
        }else{
          state.ots = state.ots.filter(x=>x.id!==id);
        }
        saveState();
        rerenderAll();
      });
    });
  });
}
// ==================================================================


function renderPhotoPreview(kind){
  const photos = kind === "incident" ? mediaState.incidentPhotos : mediaState.otPhotos;
  const previewEl = kind === "incident" ? $("incPhotoPreview") : $("otPhotoPreview");
  const countEl = kind === "incident" ? $("incPhotoCount") : $("otPhotoCount");
  countEl.textContent = photos.length ? `${photos.length} foto(s) adjuntas` : "Sin fotos adjuntas";
  previewEl.innerHTML = photos.slice(0, 6).map((src) => `<img src="${escapeHtmlAttr(src)}" alt="preview" />`).join("");
}

async function scanQRCodeToInput(targetInputId, statusId){
  const target = $(targetInputId);
  const status = $(statusId);
  if(!navigator.mediaDevices?.getUserMedia){
    const manual = prompt("No se pudo abrir la cámara. Introduce el código QR manualmente:", "");
    if(manual) target.value = manual.trim();
    return;
  }

  status.textContent = "Abriendo cámara para escanear QR...";

  try{
    if(window.QrScanner){
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();
      const result = await window.QrScanner.scanImage(video, { returnDetailedScanResult: true }).catch(() => null);
      stream.getTracks().forEach((t) => t.stop());
      if(result?.data){
        target.value = result.data;
        status.textContent = `QR detectado: ${result.data}`;
        return;
      }
    }
  }catch{}

  if("BarcodeDetector" in window){
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    const video = document.createElement("video");
    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    await video.play();
    const detector = new BarcodeDetector({ formats: ["qr_code"] });
    const endAt = Date.now() + 12000;
    let found = "";
    while(Date.now() < endAt && !found){
      const results = await detector.detect(video);
      if(results[0]?.rawValue) found = results[0].rawValue;
      await new Promise((r) => setTimeout(r, 200));
    }
    stream.getTracks().forEach((t) => t.stop());
    if(found){
      target.value = found;
      status.textContent = `QR detectado: ${found}`;
      return;
    }
  }

  const manual = prompt("No se detectó QR a tiempo. Introduce código manual:", target.value || "");
  if(manual) target.value = manual.trim();
  status.textContent = manual ? "Código QR cargado manualmente." : "No se detectó QR.";
}

// ---------- Phones ----------
function renderGuardPhonesModal(){
  const state = getState();
  const sectors = ["Electricidad", "Fontanería"];
  const html = sectors.map((sector) => {
    const roster = state.rosters[sector];
    const names = roster?.names || [];
    const rows = names.map((name) => {
      const val = state.phones?.[sector]?.[name] || "";
      const callDisabled = val ? "" : " disabled";
      const callHref = val ? `tel:${escapeHtmlAttr(val)}` : "#";
      return `
        <div class="phoneRow">
          <div class="phoneName">${escapeHtml(name)}</div>
          <input class="input phoneInput" data-sector="${escapeHtmlAttr(sector)}" data-name="${escapeHtmlAttr(name)}" value="${escapeHtmlAttr(val)}" placeholder="Ej: 600123123" />
          <a class="btn btn-small phoneCallBtn${callDisabled}" href="${callHref}" ${callDisabled ? "tabindex=\"-1\" aria-disabled=\"true\"" : ""}>📞 Llamar</a>
        </div>
      `;
    }).join("") || `<div class="muted">Sin cuadrante cargado para ${sector}.</div>`;

    return `
      <div class="phoneSector">
        <h4>${sector}</h4>
        <div class="phoneRows">${rows}</div>
      </div>
    `;
  }).join("");

  $("guardPhonesContent").innerHTML = html;

  for(const input of document.querySelectorAll(".phoneInput")){
    input.addEventListener("input", (e) => {
      const value = e.currentTarget.value.trim();
      const row = e.currentTarget.closest(".phoneRow");
      const callBtn = row?.querySelector(".phoneCallBtn");
      if(!callBtn) return;
      if(value){
        callBtn.classList.remove("disabled");
        callBtn.removeAttribute("aria-disabled");
        callBtn.removeAttribute("tabindex");
        callBtn.setAttribute("href", `tel:${value}`);
      }else{
        callBtn.classList.add("disabled");
        callBtn.setAttribute("aria-disabled", "true");
        callBtn.setAttribute("tabindex", "-1");
        callBtn.setAttribute("href", "#");
      }
    });
  }
}

function savePhones(){
  const state = getState();
  state.phones ||= {};
  for(const input of document.querySelectorAll(".phoneInput")){
    const sector = input.dataset.sector;
    const name = input.dataset.name;
    state.phones[sector] ||= {};
    state.phones[sector][name] = input.value.trim();
  }
  setPhones(state.phones);
  closeModal($("modalGuardPhones"));
  rerenderAll();
}

// ---------- Week bulk edition ----------
function fillWeekTemplate(){
  const state = getState();
  const sector = $("sectorSelect").value;
  const roster = state.rosters[sector];
  const monday = mondayOfWeek($("datePicker").value);
  if(!roster){
    $("weekBulkInput").value = "";
    return;
  }

  const lines = roster.names.map((name) => {
    const codes = Array.from({length:7}).map((_,i) => {
      const dayIso = addDays(monday, i);
      if(!rosterHasDate(roster, dayIso)) return "D";
      const {d} = isoToYMD(dayIso);
      return getTurnCode(roster, name, d) || "D";
    });
    return `${name},${codes.join(",")}`;
  });

  $("weekBulkInput").value = lines.join("\n");
}

function applyWeekBulk(){
  const raw = $("weekBulkInput").value.trim();
  if(!raw){
    alert("No hay datos para aplicar.");
    return;
  }

  const state = getState();
  const sector = $("sectorSelect").value;
  const roster = state.rosters[sector];
  if(!roster){
    alert("No hay cuadrante para este sector.");
    return;
  }

  const monday = mondayOfWeek($("datePicker").value);
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const validCode = (c) => /^(M|T|N|D|M\/T|M\/N|M\/D|D\/T|D\/N|EF1|OT)$/i.test(c);

  for(const line of lines){
    const cols = line.split(",").map((x) => x.trim());
    if(cols.length < 8) continue;
    const name = cols[0];
    const idx = roster.names.indexOf(name);
    if(idx < 0) continue;

    for(let i=0; i<7; i++){
      const code = (cols[i+1] || "D").toUpperCase();
      if(!validCode(code)) continue;
      const dayIso = addDays(monday, i);
      if(!rosterHasDate(roster, dayIso)) continue;
      const {d} = isoToYMD(dayIso);
      roster.matrix[idx][d - 1] = code;
    }
  }

  state.rosters[sector] = roster;
  setRosters(state.rosters);
  closeModal($("modalWeekEdit"));
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

  const gs = document.getElementById("globalSearch");
  const gsc = document.getElementById("btnClearSearch");
  if(gs){
    gs.addEventListener("input", ()=> setGlobalSearch(gs.value));
    gs.addEventListener("keydown", (e)=>{ if(e.key==="Escape"){ gs.value=""; setGlobalSearch(""); } });
  }
  if(gsc){ gsc.addEventListener("click", ()=>{ if(gs){ gs.value=""; } setGlobalSearch(); }); }
  document.addEventListener("keydown",(e)=>{ if(e.key==="/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||"")) { e.preventDefault(); gs?.focus(); } });

  $("btnNewCorrectivo").addEventListener("click", () => addTrayCard("Correctivo"));
  $("btnNewPreventivo").addEventListener("click", () => addTrayCard("Preventivo"));
  $("btnNewGuardia").addEventListener("click", () => addTrayCard("Guardia móvil"));

  $("btnQuick").addEventListener("click", openQuick);
  $("btnCloseQuick").addEventListener("click", () => closeModal($("modalQuick")));
  $("btnCreateCard").addEventListener("click", createQuickCard);
  $("quickType").addEventListener("change", onQuickTypeChange);

  $("btnGuardPhones").addEventListener("click", () => {
    renderGuardPhonesModal();
    openModal($("modalGuardPhones"));
  });
  $("btnCloseGuardPhones").addEventListener("click", () => closeModal($("modalGuardPhones")));
  $("btnSavePhones").addEventListener("click", savePhones);

  $("btnWeekEdit").addEventListener("click", () => {
    fillWeekTemplate();
    openModal($("modalWeekEdit"));
  });
  $("btnCloseWeekEdit").addEventListener("click", () => closeModal($("modalWeekEdit")));
  const btnCloseImg = document.getElementById("btnCloseImage");
  if(btnCloseImg) btnCloseImg.addEventListener("click", closeImageModal);
  $("btnFillWeekTemplate").addEventListener("click", fillWeekTemplate);
  $("btnApplyWeekBulk").addEventListener("click", applyWeekBulk);

  $("btnShiftRequest").addEventListener("click", openShiftRequest);
  $("btnCloseShiftRequest").addEventListener("click", () => closeModal($("modalShiftRequest")));
  $("btnApplyShiftRequest").addEventListener("click", applyShiftRequest);

  $("btnPagePlanner").addEventListener("click", () => setActivePage("planner"));
  $("btnPageIncidents").addEventListener("click", () => setActivePage("incidents"));
  $("btnPageOT").addEventListener("click", () => setActivePage("ot"));

  $("btnCreateIncident").addEventListener("click", createIncident);
  $("btnCreateOT").addEventListener("click", createOT);
  $("btnIncPhoto").addEventListener("click", () => $("incPhotoInput").click());
  $("btnOtPhoto").addEventListener("click", () => $("otPhotoInput").click());
  $("incPhotoInput").addEventListener("change", async (e) => {
    mediaState.incidentPhotos.push(...await filesToDataUrls(e.currentTarget.files));
    e.currentTarget.value = "";
    renderPhotoPreview("incident");
  });
  $("otPhotoInput").addEventListener("change", async (e) => {
    mediaState.otPhotos.push(...await filesToDataUrls(e.currentTarget.files));
    e.currentTarget.value = "";
    renderPhotoPreview("ot");
  });
  $("btnIncScanQR").addEventListener("click", () => scanQRCodeToInput("incLocation", "incQrStatus"));
  $("btnOtScanQR").addEventListener("click", () => scanQRCodeToInput("otArea", "otQrStatus"));

  $("btnAuto").addEventListener("click", autoAssignPreventivos);
  $("btnGenerateReport").addEventListener("click", generateAutoReport);

  const btnWa = document.getElementById("btnShareReportWA");
  const btnMail = document.getElementById("btnShareReportMail");
  const btnCopy = document.getElementById("btnCopyReport");
  if(btnWa) btnWa.addEventListener("click", ()=>{
    const text = document.getElementById("autoReportOutput")?.textContent || buildDailyAutoReport();
    const {wa} = buildShareLinks(text, `Informe ${$("datePicker").value} · ${$("sectorSelect").value}`);
    window.open(wa, "_blank");
  });
  if(btnMail) btnMail.addEventListener("click", ()=>{
    const text = document.getElementById("autoReportOutput")?.textContent || buildDailyAutoReport();
    const {mail} = buildShareLinks(text, `Informe ${$("datePicker").value} · ${$("sectorSelect").value}`);
    window.location.href = mail;
  });
  if(btnCopy) btnCopy.addEventListener("click", ()=>{
    const text = document.getElementById("autoReportOutput")?.textContent || buildDailyAutoReport();
    copyToClipboard(text);
  });
  $("btnCloseDay").addEventListener("click", closeDay);

  // Click en tarjetas de sector arriba para seleccionar
  $("cardElec").addEventListener("click", () => { $("sectorSelect").value="Electricidad"; rerenderAll(); });
  $("cardFont").addEventListener("click", () => { $("sectorSelect").value="Fontanería"; rerenderAll(); });

  // Reloj en cabecera
  const updateClock = () => {
    const el = $("currentTime");
    if(el) el.textContent = formatCurrentTime();
  };
  updateClock();
  setInterval(updateClock, 1000);

  // Render inicial
  setActivePage("planner");
  ensureQuickTypeOptions();
  renderPhotoPreview("incident");
  renderPhotoPreview("ot");
  rerenderAll();
  generateAutoReport();
}

bootstrap();
