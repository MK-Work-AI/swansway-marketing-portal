/* ══════════════════════════════════════════════════════════
   events.js — Events & Product Placements
   Swansway Marketing Portal v2
   ══════════════════════════════════════════════════════════ */

/* ── State ── */
var EV_EVENTS       = [];
var EV_TYPES        = [];
var EV_POS_ITEMS    = [];
var EV_VEHICLES     = {};
var EV_EVENT_POS    = {};
var EV_VM           = {};

var EV_VIEW         = 'calendar';
var EV_MONTH        = new Date().getMonth();
var EV_YEAR         = new Date().getFullYear();
var EV_FILTER       = { brand: '', site: '', type: '', status: '' };
var EV_EDITING_ID   = null;
var EV_FORM_STEP    = 1;
var EV_FORM_DATA    = {};

var STATUS_COLORS = {
  draft:     '#6B7280',
  confirmed: '#2563EB',
  completed: '#059669',
  cancelled: '#DC2626'
};

var BRAND_DISPLAY = {
  audi:'Audi', vw:'Volkswagen', vwcv:'VW Commercial', seat:'SEAT',
  cupra:'CUPRA', landrover:'Land Rover', jaguar:'Jaguar', honda:'Honda',
  peugeot:'Peugeot', byd:'BYD', omoda:'OMODA / JAECOO', motormatch:'Motor Match'
};

var MONTH_NAMES = ['January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
var MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ══ INIT ══ */
async function evInit() {
  await swEnsureUser();
  await evLoadAll();
  evRenderFilters();
  evRender();
  evBindFilters();
  evInjectStyles();
}

async function evLoadAll() {
  await Promise.all([evLoadTypes(), evLoadPosItems(), evLoadVehicleModels(), evLoadEvents()]);
}

async function evLoadTypes() {
  try {
    var r = await fetch(SUPA + '/event_types?select=*&order=sort_order', { headers: getAuthHeaders() });
    if (r.ok) EV_TYPES = await r.json();
  } catch(e) { console.warn('evLoadTypes:', e); }
}

async function evLoadPosItems() {
  try {
    var r = await fetch(SUPA + '/pos_items?select=*&order=sort_order', { headers: getAuthHeaders() });
    if (r.ok) EV_POS_ITEMS = await r.json();
  } catch(e) { console.warn('evLoadPosItems:', e); }
}

async function evLoadVehicleModels() {
  try {
    var r = await fetch(SUPA + '/vehicle_models?select=*&order=sort_order', { headers: getAuthHeaders() });
    if (!r.ok) return;
    var rows = await r.json();
    EV_VM = {};
    rows.forEach(function(m) {
      if (!EV_VM[m.brand_id]) EV_VM[m.brand_id] = [];
      EV_VM[m.brand_id].push(m);
    });
  } catch(e) { console.warn('evLoadVehicleModels:', e); }
}

async function evLoadEvents() {
  try {
    var r = await fetch(SUPA + '/events?select=*&order=start_date', { headers: getAuthHeaders() });
    if (!r.ok) return;
    EV_EVENTS = await r.json();
    if (EV_EVENTS.length) {
      var ids = EV_EVENTS.map(function(e){ return e.id; });
      var [vr, pr] = await Promise.all([
        fetch(SUPA + '/event_vehicles?select=*&event_id=in.(' + ids.join(',') + ')', { headers: getAuthHeaders() }),
        fetch(SUPA + '/event_pos?select=*&event_id=in.(' + ids.join(',') + ')', { headers: getAuthHeaders() })
      ]);
      if (vr.ok) {
        var vehicles = await vr.json();
        EV_VEHICLES = {};
        vehicles.forEach(function(v) {
          if (!EV_VEHICLES[v.event_id]) EV_VEHICLES[v.event_id] = [];
          EV_VEHICLES[v.event_id].push(v);
        });
      }
      if (pr.ok) {
        var pos = await pr.json();
        EV_EVENT_POS = {};
        pos.forEach(function(p) {
          if (!EV_EVENT_POS[p.event_id]) EV_EVENT_POS[p.event_id] = [];
          EV_EVENT_POS[p.event_id].push(p);
        });
      }
    }
  } catch(e) { console.warn('evLoadEvents:', e); }
}

/* ══ FILTERS ══ */
function evGetFilteredEvents() {
  return EV_EVENTS.filter(function(ev) {
    if (EV_FILTER.brand  && ev.brand_id        !== EV_FILTER.brand)  return false;
    if (EV_FILTER.site   && ev.site_id         !== EV_FILTER.site)   return false;
    if (EV_FILTER.type   && ev.event_type_id   !== EV_FILTER.type)   return false;
    if (EV_FILTER.status && ev.status          !== EV_FILTER.status) return false;
    return true;
  });
}

function evRenderFilters() {
  var brandSel = document.getElementById('ev-filter-brand');
  if (brandSel) {
    brandSel.innerHTML = '<option value="">All brands</option>';
    Object.keys(BRAND_COLORS).forEach(function(b) {
      brandSel.innerHTML += '<option value="' + b + '">' + (BRAND_DISPLAY[b] || b) + '</option>';
    });
  }
  evPopulateSiteFilter('');
  var typeSel = document.getElementById('ev-filter-type');
  if (typeSel) {
    typeSel.innerHTML = '<option value="">All types</option>';
    EV_TYPES.forEach(function(t) {
      typeSel.innerHTML += '<option value="' + t.id + '">' + t.name + '</option>';
    });
  }
}

function evPopulateSiteFilter(brandId) {
  var siteSel = document.getElementById('ev-filter-site');
  if (!siteSel) return;
  siteSel.innerHTML = '<option value="">All sites</option>';
  var sites = brandId ? SB_SITES.filter(function(s){ return s.brand_id === brandId; }) : SB_SITES;
  sites.forEach(function(s) {
    siteSel.innerHTML += '<option value="' + s.site_id + '">' + s.site_name + '</option>';
  });
}

function evBindFilters() {
  var brandSel = document.getElementById('ev-filter-brand');
  if (brandSel) brandSel.addEventListener('change', function() {
    EV_FILTER.brand = this.value;
    EV_FILTER.site  = '';
    evPopulateSiteFilter(this.value);
    document.getElementById('ev-filter-site').value = '';
    evRender();
  });
  var siteSel = document.getElementById('ev-filter-site');
  if (siteSel) siteSel.addEventListener('change', function() { EV_FILTER.site = this.value; evRender(); });
  var typeSel = document.getElementById('ev-filter-type');
  if (typeSel) typeSel.addEventListener('change', function() { EV_FILTER.type = this.value; evRender(); });
  var statusSel = document.getElementById('ev-filter-status');
  if (statusSel) statusSel.addEventListener('change', function() { EV_FILTER.status = this.value; evRender(); });
}

/* ══ MAIN RENDER ══ */
function evRender() {
  var mh = document.getElementById('ev-month-heading');
  if (mh) mh.textContent = MONTH_NAMES[EV_MONTH] + ' ' + EV_YEAR;
  if (EV_VIEW === 'calendar') {
    document.getElementById('ev-calendar-view').style.display = '';
    document.getElementById('ev-list-view').style.display = 'none';
    evRenderCalendar();
  } else {
    document.getElementById('ev-calendar-view').style.display = 'none';
    document.getElementById('ev-list-view').style.display = '';
    evRenderList();
  }
}

function evSetView(v) {
  EV_VIEW = v;
  document.getElementById('ev-view-cal').classList.toggle('active', v === 'calendar');
  document.getElementById('ev-view-list').classList.toggle('active', v === 'list');
  evRender();
}

function evPrevMonth() {
  EV_MONTH--;
  if (EV_MONTH < 0) { EV_MONTH = 11; EV_YEAR--; }
  evRender();
}

function evNextMonth() {
  EV_MONTH++;
  if (EV_MONTH > 11) { EV_MONTH = 0; EV_YEAR++; }
  evRender();
}

/* ══ CALENDAR VIEW ══ */
function evRenderCalendar() {
  var grid = document.getElementById('ev-cal-grid');
  if (!grid) return;
  var today = new Date();
  var firstDay = new Date(EV_YEAR, EV_MONTH, 1);
  var lastDay  = new Date(EV_YEAR, EV_MONTH + 1, 0);
  var startDow = firstDay.getDay();
  var totalDays = lastDay.getDate();
  var filtered = evGetFilteredEvents().filter(function(ev) {
    var s = new Date(ev.start_date + 'T00:00:00');
    var e = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : s;
    return s <= new Date(EV_YEAR, EV_MONTH + 1, 0) && e >= new Date(EV_YEAR, EV_MONTH, 1);
  });
  var html = '';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(function(d) {
    html += '<div class="ev-cal-dow">' + d + '</div>';
  });
  var offset = (startDow === 0) ? 6 : startDow - 1;
  for (var i = 0; i < offset; i++) html += '<div class="ev-cal-cell ev-cal-cell--other"></div>';
  for (var day = 1; day <= totalDays; day++) {
    var isToday = (today.getDate() === day && today.getMonth() === EV_MONTH && today.getFullYear() === EV_YEAR);
    html += '<div class="ev-cal-cell' + (isToday ? ' ev-cal-cell--today' : '') + '">';
    html += '<div class="ev-cal-day-num">' + (isToday ? '<span class="ev-cal-today-badge">' + day + '</span>' : day) + '</div>';
    var dayDate = new Date(EV_YEAR, EV_MONTH, day);
    var dayEvents = filtered.filter(function(ev) {
      var s = new Date(ev.start_date + 'T00:00:00');
      var e = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : s;
      return s <= dayDate && e >= dayDate;
    });
    dayEvents.slice(0, 3).forEach(function(ev) {
      var type = EV_TYPES.find(function(t){ return t.id === ev.event_type_id; });
      var color = type ? type.color : '#6B7280';
      var siteName = (SB_SITES.find(function(s){ return s.site_id === ev.site_id; }) || {}).site_name || '';
      html += '<div class="ev-cal-bar" style="background:' + color + '" onclick="evOpenDetail(\'' + ev.id + '\')" title="' + evEsc(ev.title) + '">'
            + '<span class="ev-cal-bar-text">' + evEsc(ev.title) + (siteName ? ' · ' + siteName : '') + '</span>'
            + '</div>';
    });
    if (dayEvents.length > 3) html += '<div class="ev-cal-more">+' + (dayEvents.length - 3) + ' more</div>';
    html += '</div>';
  }
  var remainder = (offset + totalDays) % 7;
  if (remainder) for (var j = 0; j < (7 - remainder); j++) html += '<div class="ev-cal-cell ev-cal-cell--other"></div>';
  grid.innerHTML = html;
}

/* ══ LIST VIEW ══ */
function evRenderList() {
  var container = document.getElementById('ev-list-container');
  if (!container) return;
  var filtered = evGetFilteredEvents();
  if (!filtered.length) {
    container.innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--ink-soft);font-family:var(--font-b);font-size:14px">No events found matching your filters.</div>';
    return;
  }
  var bySite = {};
  filtered.forEach(function(ev) {
    if (!bySite[ev.site_id]) bySite[ev.site_id] = [];
    bySite[ev.site_id].push(ev);
  });
  var html = '';
  Object.keys(bySite).sort().forEach(function(siteId) {
    var site = SB_SITES.find(function(s){ return s.site_id === siteId; }) || { site_name: siteId, brand_id: '' };
    var brandColor = BRAND_COLORS[site.brand_id] || '#374151';
    var events = bySite[siteId].sort(function(a,b){ return a.start_date < b.start_date ? -1 : 1; });
    html += '<div class="ev-site-group">';
    html += '<div class="ev-site-header" style="border-left:4px solid ' + brandColor + '">'
          + '<span class="ev-site-name">' + evEsc(site.site_name) + '</span>'
          + '<span class="ev-site-count">' + events.length + ' event' + (events.length !== 1 ? 's' : '') + '</span>'
          + '</div>';
    events.forEach(function(ev) { html += evRenderCard(ev); });
    html += '</div>';
  });
  container.innerHTML = html;
}

function evRenderCard(ev) {
  var type = EV_TYPES.find(function(t){ return t.id === ev.event_type_id; });
  var typeColor  = type ? type.color : '#6B7280';
  var typeName   = type ? type.name  : 'Event';
  var statusColor = STATUS_COLORS[ev.status] || '#6B7280';
  var vehicles = EV_VEHICLES[ev.id] || [];
  var dateStr = evFormatDateRange(ev.start_date, ev.end_date);
  var budget  = ev.planned_budget ? '\xA3' + Number(ev.planned_budget).toLocaleString('en-GB') + ' planned' : '';
  if (ev.actual_spend) budget += ' / \xA3' + Number(ev.actual_spend).toLocaleString('en-GB') + ' actual';
  return '<div class="ev-card" onclick="evOpenDetail(\'' + ev.id + '\')">'
    + '<div class="ev-card-header">'
    + '<span class="ev-badge" style="background:' + typeColor + '">' + evEsc(typeName) + '</span>'
    + '<span class="ev-badge ev-badge--outline" style="border-color:' + statusColor + ';color:' + statusColor + '">' + ev.status.charAt(0).toUpperCase() + ev.status.slice(1) + '</span>'
    + (ev.coop_funded ? '<span class="ev-badge" style="background:#0891B2">Co-op</span>' : '')
    + '</div>'
    + '<div class="ev-card-title">' + evEsc(ev.title) + '</div>'
    + '<div class="ev-card-meta">'
    + (dateStr ? '<span class="ev-card-meta-item">\uD83D\uDCC5 ' + dateStr + '</span>' : '')
    + (ev.location ? '<span class="ev-card-meta-item">\uD83D\uDCCD ' + evEsc(ev.location) + '</span>' : '')
    + (budget ? '<span class="ev-card-meta-item">\uD83D\uDCB7 ' + budget + '</span>' : '')
    + (ev.expected_footfall ? '<span class="ev-card-meta-item">\uD83D\uDC65 ' + Number(ev.expected_footfall).toLocaleString() + ' expected</span>' : '')
    + (vehicles.length ? '<span class="ev-card-meta-item">\uD83D\uDE97 ' + vehicles.reduce(function(s,v){ return s + v.quantity; }, 0) + ' vehicles</span>' : '')
    + '</div>'
    + '</div>';
}

/* ══ DATE FORMATTING ══ */
function evFormatDate(d) {
  if (!d) return '';
  var dt = new Date(d + 'T00:00:00');
  return DAY_SHORT[dt.getDay()] + ' ' + dt.getDate() + ' ' + MONTH_SHORT[dt.getMonth()] + ' ' + dt.getFullYear();
}
function evFormatDateRange(start, end) {
  if (!start) return '';
  if (!end || end === start) return evFormatDate(start);
  return evFormatDate(start) + ' \u2014 ' + evFormatDate(end);
}
function evFmtGBP(n) {
  return '\xA3' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

/* ══ DETAIL MODAL ══ */
function evOpenDetail(id) {
  var ev = EV_EVENTS.find(function(e){ return e.id === id; });
  if (!ev) return;
  var type = EV_TYPES.find(function(t){ return t.id === ev.event_type_id; });
  var site = SB_SITES.find(function(s){ return s.site_id === ev.site_id; });
  var vehicles = EV_VEHICLES[ev.id] || [];
  var pos = EV_EVENT_POS[ev.id] || [];
  var isLeadership = CB_TEAM[CB_CURRENT_USER] && CB_TEAM[CB_CURRENT_USER].is_leadership;
  var typeColor   = type ? type.color : '#6B7280';
  var typeName    = type ? type.name  : 'Event';
  var statusColor = STATUS_COLORS[ev.status] || '#6B7280';
  var brandColor  = site ? (BRAND_COLORS[site.brand_id] || '#374151') : '#374151';
  var posTotalCost = pos.reduce(function(s,p){ return s + (p.total_cost || 0); }, 0);

  var html = '<div class="ev-modal-overlay" id="ev-modal-overlay" onclick="if(event.target===this)evCloseDetail()">'
    + '<div class="ev-modal">'
    + '<div class="ev-modal-header" style="border-top:4px solid ' + brandColor + '">'
    + '<div>'
    + '<div class="ev-modal-badges">'
    + '<span class="ev-badge" style="background:' + typeColor + '">' + evEsc(typeName) + '</span>'
    + '<span class="ev-badge ev-badge--outline" style="border-color:' + statusColor + ';color:' + statusColor + '">' + ev.status.charAt(0).toUpperCase() + ev.status.slice(1) + '</span>'
    + (ev.coop_funded ? '<span class="ev-badge" style="background:#0891B2">Co-op funded</span>' : '')
    + '</div>'
    + '<div class="ev-modal-title">' + evEsc(ev.title) + '</div>'
    + '<div class="ev-modal-site">' + (site ? evEsc(site.site_name) : ev.site_id || '') + '</div>'
    + '</div>'
    + '<button class="ev-modal-close" onclick="evCloseDetail()">\xD7</button>'
    + '</div>'
    + '<div class="ev-modal-body">'
    + evModalSection('\uD83D\uDCC5 Dates & Times', evModalGrid([
        { label: 'Start', val: evFormatDate(ev.start_date) + (ev.start_time ? ' at ' + ev.start_time : '') },
        { label: 'End',   val: ev.end_date ? evFormatDate(ev.end_date) + (ev.end_time ? ' at ' + ev.end_time : '') : '\u2014' }
      ]))
    + (ev.location || ev.location_address ? evModalSection('\uD83D\uDCCD Location', evModalGrid([
        ev.location         ? { label: 'Venue',   val: ev.location,         full: true } : null,
        ev.location_address ? { label: 'Address', val: ev.location_address, full: true } : null
      ].filter(Boolean))) : '')
    + (ev.contact_name || ev.contact_email || ev.contact_phone ? evModalSection('\uD83D\uDC64 Contact', evModalGrid([
        ev.contact_name  ? { label: 'Name',  val: ev.contact_name } : null,
        ev.contact_email ? { label: 'Email', val: '<a href="mailto:' + evEsc(ev.contact_email) + '">' + evEsc(ev.contact_email) + '</a>' } : null,
        ev.contact_phone ? { label: 'Phone', val: '<a href="tel:' + evEsc(ev.contact_phone) + '">' + evEsc(ev.contact_phone) + '</a>' } : null
      ].filter(Boolean))) : '')
    + evModalSection('\uD83D\uDCB7 Budget', evModalGrid([
        { label: 'Planned budget', val: ev.planned_budget ? evFmtGBP(ev.planned_budget) : '\u2014' },
        { label: 'Actual spend',   val: ev.actual_spend   ? evFmtGBP(ev.actual_spend)   : '\u2014' },
        ev.coop_funded ? { label: 'Co-op amount', val: ev.coop_amount ? evFmtGBP(ev.coop_amount) : 'Yes (TBC)' } : null
      ].filter(Boolean)))
    + (vehicles.length ? evModalSection('\uD83D\uDE97 Vehicles',
        '<div style="display:flex;flex-wrap:wrap;gap:8px">'
        + vehicles.map(function(v){ return '<span style="padding:4px 10px;background:var(--surface);border:1px solid var(--border);border-radius:4px;font-family:var(--font-b);font-size:12px">' + evEsc(v.model_name) + ' \xD7 ' + v.quantity + '</span>'; }).join('')
        + '</div>') : '')
    + (pos.length ? evModalSection('\uD83D\uDCE6 POS Items',
        '<table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="border-bottom:1px solid var(--border)">'
        + '<th style="text-align:left;padding:4px 8px;font-family:var(--font-m);font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft)">Item</th>'
        + '<th style="text-align:right;padding:4px 8px;font-family:var(--font-m);font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft)">Qty</th>'
        + '<th style="text-align:right;padding:4px 8px;font-family:var(--font-m);font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft)">Unit</th>'
        + '<th style="text-align:right;padding:4px 8px;font-family:var(--font-m);font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft)">Total</th>'
        + '</tr></thead><tbody>'
        + pos.map(function(p){ return '<tr style="border-bottom:1px solid var(--border)"><td style="padding:5px 8px">' + evEsc(p.pos_item_name) + '</td><td style="padding:5px 8px;text-align:right;font-family:var(--font-m)">' + p.quantity + '</td><td style="padding:5px 8px;text-align:right;font-family:var(--font-m)">' + (p.unit_cost ? evFmtGBP(p.unit_cost) : '\u2014') + '</td><td style="padding:5px 8px;text-align:right;font-family:var(--font-m)">' + (p.total_cost ? evFmtGBP(p.total_cost) : '\u2014') + '</td></tr>'; }).join('')
        + '<tr style="border-top:2px solid var(--border)"><td colspan="3" style="padding:6px 8px;font-family:var(--font-m);font-size:10px;text-transform:uppercase;color:var(--ink-soft)">Total POS cost</td><td style="padding:6px 8px;text-align:right;font-family:var(--font-m);color:var(--swansway)">' + evFmtGBP(posTotalCost) + '</td></tr>'
        + '</tbody></table>') : '')
    + (ev.expected_footfall || ev.actual_footfall || ev.staff_required ? evModalSection('\uD83D\uDC65 Attendance', evModalGrid([
        ev.expected_footfall ? { label: 'Expected footfall', val: Number(ev.expected_footfall).toLocaleString() } : null,
        ev.actual_footfall   ? { label: 'Actual footfall',   val: Number(ev.actual_footfall).toLocaleString()   } : null,
        ev.staff_required    ? { label: 'Staff required',    val: ev.staff_required } : null
      ].filter(Boolean))) : '')
    + (ev.notes ? evModalSection('\uD83D\uDCDD Notes', '<p style="font-family:var(--font-b);font-size:13px;color:var(--ink-soft);white-space:pre-wrap;margin:0">' + evEsc(ev.notes) + '</p>') : '')
    + (ev.status === 'completed' ? evModalSection('\uD83D\uDCCA Debrief', ev.debrief
        ? '<p style="font-family:var(--font-b);font-size:13px;color:var(--ink-soft);white-space:pre-wrap;margin:0">' + evEsc(ev.debrief) + '</p>'
        : '<p style="font-family:var(--font-b);font-size:13px;color:var(--ink-faint);margin:0">No debrief added yet.</p>') : '')
    + '</div>'
    + '<div class="ev-modal-footer">'
    + '<button class="btn" onclick="evOpenForm(\'' + ev.id + '\')">\u270F Edit</button>'
    + (isLeadership && ev.status === 'draft'     ? '<button class="btn btn-accent" onclick="evChangeStatus(\'' + ev.id + '\',\'confirmed\')">\u2713 Confirm</button>' : '')
    + (isLeadership && ev.status === 'confirmed' ? '<button class="btn" onclick="evChangeStatus(\'' + ev.id + '\',\'draft\')">\u21A9 Unconfirm</button>' : '')
    + (isLeadership && ev.status === 'confirmed' ? '<button class="btn btn-accent" onclick="evChangeStatus(\'' + ev.id + '\',\'completed\')">&#x2705; Mark Complete</button>' : '')
    + (isLeadership && ev.status !== 'cancelled' && ev.status !== 'completed' ? '<button class="btn" style="color:#DC2626;border-color:#DC2626" onclick="evChangeStatus(\'' + ev.id + '\',\'cancelled\')">\u2715 Cancel</button>' : '')
    + (isLeadership ? '<button class="btn" style="color:#DC2626;border-color:#DC2626;margin-left:auto" onclick="evDelete(\'' + ev.id + '\')">\uD83D\uDDD1 Delete</button>' : '')
    + '</div>'
    + '</div></div>';

  document.getElementById('ev-modal-root').innerHTML = html;
  // After step 3 renders, async-load budget data
  if (EV_FORM_STEP === 3) setTimeout(efLoadBudgetPanel, 0);
}

function evCloseDetail() {
  var root = document.getElementById('ev-modal-root');
  if (root) root.innerHTML = '';
}

function evModalSection(title, bodyHtml) {
  return '<div class="ev-modal-section"><div class="ev-modal-section-title">' + title + '</div>' + bodyHtml + '</div>';
}

function evModalGrid(items) {
  return '<div class="ev-modal-grid">'
    + items.map(function(item){
        return '<div class="ev-modal-field' + (item.full ? ' ev-modal-field--full' : '') + '">'
          + '<div class="ev-modal-field-label">' + item.label + '</div>'
          + '<div class="ev-modal-field-val">' + item.val + '</div>'
          + '</div>';
      }).join('')
    + '</div>';
}

/* ══ STATUS CHANGES ══ */
async function evChangeStatus(id, newStatus) {
  if (!confirm('Change status to "' + newStatus + '"?')) return;
  try {
    var r = await fetch(SUPA + '/events?id=eq.' + id, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
      body: JSON.stringify({ status: newStatus, updated_at: new Date().toISOString() })
    });
    if (!r.ok) throw new Error(await r.text());
    evCloseDetail();
    await evLoadEvents();
    evRender();
    showToast('Status updated \u2713', 'success');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

/* ══ DELETE ══ */
async function evDelete(id) {
  if (!confirm('Delete this event? This cannot be undone.')) return;
  try {
    var r = await fetch(SUPA + '/events?id=eq.' + id, { method: 'DELETE', headers: getAuthHeaders() });
    if (!r.ok) throw new Error(await r.text());
    evCloseDetail();
    await evLoadEvents();
    evRender();
    showToast('Event deleted', 'success');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

/* Budget integration: events are aggregated on the budget page directly from the events table — site_budgets is not mutated by events */

/* ══════════════════════════════════════════════════════════
   STEPPED MODAL FORM
   Step 1 — Brand + multi-site + event type + title
   Step 2 — Dates, location, contact
   Step 3 — Budget (with remaining) + footfall + vehicles
   Step 4 — POS items + notes
   ══════════════════════════════════════════════════════════ */

function evOpenForm(id) {
  EV_EDITING_ID = id || null;
  EV_FORM_STEP  = 1;
  var ev = id ? EV_EVENTS.find(function(e){ return e.id === id; }) : null;
  EV_FORM_DATA = ev ? {
    title:            ev.title || '',
    brand_id:         ev.brand_id || '',
    site_ids:         ev.site_id ? [ev.site_id] : [],
    event_type_id:    ev.event_type_id || '',
    start_date:       ev.start_date || '',
    end_date:         ev.end_date || '',
    start_time:       ev.start_time || '',
    end_time:         ev.end_time || '',
    location:         ev.location || '',
    location_address: ev.location_address || '',
    contact_name:     ev.contact_name || '',
    contact_email:    ev.contact_email || '',
    contact_phone:    ev.contact_phone || '',
    planned_budget:   ev.planned_budget || '',
    actual_spend:     ev.actual_spend || '',
    coop_funded:      ev.coop_funded || false,
    coop_amount:      ev.coop_amount || '',
    expected_footfall:ev.expected_footfall || '',
    actual_footfall:  ev.actual_footfall || '',
    staff_required:   ev.staff_required || '',
    vehicle_notes:    ev.vehicle_notes || '',
    notes:            ev.notes || '',
    _vehicles:        null,
    _pos:             null
  } : {
    title:'', brand_id:'', site_ids:[], event_type_id:'',
    start_date:'', end_date:'', start_time:'', end_time:'',
    location:'', location_address:'',
    contact_name:'', contact_email:'', contact_phone:'',
    planned_budget:'', actual_spend:'', coop_funded:false, coop_amount:'',
    expected_footfall:'', actual_footfall:'', staff_required:'',
    vehicle_notes:'', notes:'', _vehicles:null, _pos:null
  };
  evCloseDetail();
  evRenderFormModal();
}

function evCloseForm() {
  var root = document.getElementById('ev-modal-root');
  if (root) root.innerHTML = '';
  EV_EDITING_ID = null;
}

function evFormCollectStep(step) {
  if (step === 1) {
    EV_FORM_DATA.title         = (document.getElementById('ef-title')    || {}).value || '';
    EV_FORM_DATA.brand_id      = (document.getElementById('ef-brand')    || {}).value || '';
    EV_FORM_DATA.event_type_id = (document.getElementById('ef-type')     || {}).value || '';
    // site_ids tracked live via efToggleSite — already in EV_FORM_DATA.site_ids
  } else if (step === 2) {
    EV_FORM_DATA.start_date       = (document.getElementById('ef-start-date')    || {}).value || '';
    EV_FORM_DATA.end_date         = (document.getElementById('ef-end-date')      || {}).value || '';
    EV_FORM_DATA.start_time       = (document.getElementById('ef-start-time')    || {}).value || '';
    EV_FORM_DATA.end_time         = (document.getElementById('ef-end-time')      || {}).value || '';
    EV_FORM_DATA.location         = (document.getElementById('ef-location')      || {}).value || '';
    EV_FORM_DATA.location_address = (document.getElementById('ef-location-addr') || {}).value || '';
    EV_FORM_DATA.contact_name     = (document.getElementById('ef-contact-name')  || {}).value || '';
    EV_FORM_DATA.contact_email    = (document.getElementById('ef-contact-email') || {}).value || '';
    EV_FORM_DATA.contact_phone    = (document.getElementById('ef-contact-phone') || {}).value || '';
  } else if (step === 3) {
    EV_FORM_DATA.planned_budget    = (document.getElementById('ef-planned-budget')    || {}).value || '';
    EV_FORM_DATA.actual_spend      = (document.getElementById('ef-actual-spend')      || {}).value || '';
    EV_FORM_DATA.coop_funded       = !!(document.getElementById('ef-coop') || {}).checked;
    EV_FORM_DATA.coop_amount       = (document.getElementById('ef-coop-amount')       || {}).value || '';
    EV_FORM_DATA.expected_footfall = (document.getElementById('ef-expected-footfall') || {}).value || '';
    EV_FORM_DATA.actual_footfall   = (document.getElementById('ef-actual-footfall')   || {}).value || '';
    EV_FORM_DATA.staff_required    = (document.getElementById('ef-staff-required')    || {}).value || '';
    EV_FORM_DATA.vehicle_notes     = (document.getElementById('ef-vehicle-notes')     || {}).value || '';
    EV_FORM_DATA._vehicles = [];
    document.querySelectorAll('#ef-vehicles-list input[type=checkbox]:checked').forEach(function(cb) {
      var qtyInput = document.querySelector('[data-qty-for="' + cb.id + '"]');
      EV_FORM_DATA._vehicles.push({ model_name: cb.getAttribute('data-model'), brand_id: EV_FORM_DATA.brand_id, quantity: parseInt(qtyInput ? qtyInput.value : 1) || 1 });
    });
  } else if (step === 4) {
    EV_FORM_DATA.notes = (document.getElementById('ef-notes') || {}).value || '';
    EV_FORM_DATA._pos = [];
    document.querySelectorAll('#ef-pos-wrap input[type=checkbox]:checked').forEach(function(cb) {
      var posId   = cb.getAttribute('data-pos-id');
      var posName = cb.getAttribute('data-pos-name');
      var qtyInput  = document.querySelector('[data-qty-for="efp-' + posId + '"]');
      var costInput = document.querySelector('[data-cost-for="efp-' + posId + '"]');
      var qty  = parseInt(qtyInput   ? qtyInput.value   : 1) || 1;
      var cost = parseFloat(costInput ? costInput.value : 0) || 0;
      EV_FORM_DATA._pos.push({ pos_item_id: posId, pos_item_name: posName, quantity: qty, unit_cost: cost, total_cost: Math.round(qty * cost * 100) / 100 });
    });
  }
}

function evFormValidateStep(step) {
  if (step === 1) {
    if (!EV_FORM_DATA.title.trim())          { evFormError('Please enter an event title.'); return false; }
    if (!EV_FORM_DATA.brand_id)              { evFormError('Please select a brand.'); return false; }
    if (!EV_FORM_DATA.site_ids.length)       { evFormError('Please select at least one site.'); return false; }
    if (!EV_FORM_DATA.event_type_id)         { evFormError('Please select an event type.'); return false; }
  }
  if (step === 2) {
    if (!EV_FORM_DATA.start_date)            { evFormError('Please set a start date.'); return false; }
  }
  return true;
}

function evFormError(msg) {
  var el = document.getElementById('ef-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function evFormClearError() {
  var el = document.getElementById('ef-error');
  if (el) { el.textContent = ''; el.style.display = 'none'; }
}

function evFormNext() {
  evFormCollectStep(EV_FORM_STEP);
  if (!evFormValidateStep(EV_FORM_STEP)) return;
  evFormClearError();
  EV_FORM_STEP++;
  evRenderFormModal();
}

function evFormBack() {
  evFormCollectStep(EV_FORM_STEP);
  evFormClearError();
  EV_FORM_STEP--;
  evRenderFormModal();
}

function evRenderFormModal() {
  var isLeadership = CB_TEAM[CB_CURRENT_USER] && CB_TEAM[CB_CURRENT_USER].is_leadership;
  var brandColor = EV_FORM_DATA.brand_id ? (BRAND_COLORS[EV_FORM_DATA.brand_id] || '#1A2E4A') : '#1A2E4A';
  var brandName  = EV_FORM_DATA.brand_id ? (BRAND_DISPLAY[EV_FORM_DATA.brand_id] || EV_FORM_DATA.brand_id) : '';
  var siteCount  = EV_FORM_DATA.site_ids.length;

  var steps = ['Event', 'Dates & Location', 'Budget & Vehicles', 'POS & Notes'];

  var stepHtml = '<div class="efm-steps">';
  steps.forEach(function(s, i) {
    var n = i + 1;
    var cls = n < EV_FORM_STEP ? 'efm-step efm-step--done' : (n === EV_FORM_STEP ? 'efm-step efm-step--active' : 'efm-step');
    stepHtml += '<div class="' + cls + '">'
      + '<div class="efm-step-num">' + (n < EV_FORM_STEP ? '\u2713' : n) + '</div>'
      + '<div class="efm-step-label">' + s + '</div>'
      + '</div>';
    if (i < steps.length - 1) stepHtml += '<div class="efm-step-line' + (n < EV_FORM_STEP ? ' efm-step-line--done' : '') + '"></div>';
  });
  stepHtml += '</div>';

  var body = '';
  if (EV_FORM_STEP === 1) body = evFormStep1();
  if (EV_FORM_STEP === 2) body = evFormStep2();
  if (EV_FORM_STEP === 3) body = evFormStep3();
  if (EV_FORM_STEP === 4) body = evFormStep4();

  var footer = '<div class="efm-footer">';
  footer += '<button class="btn" onclick="evCloseForm()">Cancel</button>';
  footer += '<div style="display:flex;gap:8px;margin-left:auto;align-items:center">';
  if (EV_FORM_STEP > 1) footer += '<button class="btn" onclick="evFormBack()">\u2190 Back</button>';
  if (EV_FORM_STEP < 4) {
    footer += '<button class="btn btn-accent" onclick="evFormNext()">Continue \u2192</button>';
  } else {
    footer += '<button class="btn" onclick="evSave(false)">Save as Draft</button>';
    if (isLeadership) footer += '<button class="btn" style="background:var(--swansway);color:#fff;border-color:var(--swansway)" onclick="evSave(true)">Save &amp; Confirm</button>';
  }
  footer += '</div></div>';

  var headerSub = steps[EV_FORM_STEP - 1];
  if (EV_FORM_STEP === 1 && siteCount > 0) {
    headerSub += ' \u2014 ' + siteCount + ' site' + (siteCount !== 1 ? 's' : '') + ' selected';
  }

  var html = '<div class="ev-modal-overlay" id="ev-modal-overlay" onclick="if(event.target===this)evCloseForm()">'
    + '<div class="efm-modal">'
    + '<div class="efm-header" style="background:' + brandColor + '">'
    + '<div>'
    + '<div class="efm-header-title">' + (EV_EDITING_ID ? 'Edit Event' : 'New Event') + (brandName ? ' \u2014 ' + brandName : '') + '</div>'
    + '<div class="efm-header-sub">' + headerSub + '</div>'
    + '</div>'
    + '<button class="ev-modal-close" style="color:rgba(255,255,255,0.7)" onclick="evCloseForm()">\xD7</button>'
    + '</div>'
    + stepHtml
    + '<div class="efm-body" id="efm-body">'
    + '<div id="ef-error" style="display:none;background:#FEF2F2;border:1px solid #FECACA;border-radius:4px;padding:8px 12px;font-family:var(--font-b);font-size:12px;color:#DC2626;margin-bottom:14px"></div>'
    + body
    + '</div>'
    + footer
    + '</div></div>';

  document.getElementById('ev-modal-root').innerHTML = html;
}

/* ── STEP 1: Brand / Sites / Type / Title ── */
function evFormStep1() {
  var sites = EV_FORM_DATA.brand_id
    ? SB_SITES.filter(function(s){ return s.brand_id === EV_FORM_DATA.brand_id; })
    : [];

  var html = '';

  // Title
  html += '<div class="efm-field efm-field--title">'
    + '<label class="efm-label" for="ef-title">Event title</label>'
    + '<input class="efm-input efm-input--large" id="ef-title" type="text" placeholder="e.g. Land Rover Discovery Launch Weekend" autocomplete="off" value="' + evEscAttr(EV_FORM_DATA.title) + '">'
    + '</div>';

  // Brand grid
  html += '<div class="efm-field"><label class="efm-label">Brand</label><div class="efm-brand-grid" id="ef-brand-grid">';
  Object.keys(BRAND_COLORS).forEach(function(b) {
    var selected = (EV_FORM_DATA.brand_id === b);
    var color = BRAND_COLORS[b];
    html += '<button type="button" class="efm-brand-btn' + (selected ? ' efm-brand-btn--selected' : '') + '" '
      + 'style="' + (selected ? 'border-color:' + color + ';box-shadow:0 0 0 3px ' + color + '33' : '') + '" '
      + 'onclick="efSelectBrand(\'' + b + '\')" data-brand="' + b + '">'
      + '<span class="efm-brand-dot" style="background:' + color + '"></span>'
      + BRAND_DISPLAY[b]
      + '</button>';
  });
  html += '</div></div>';

  // Site multi-select — shown once brand picked
  html += '<div class="efm-field" id="ef-site-wrap" style="' + (EV_FORM_DATA.brand_id ? '' : 'display:none') + '">'
    + '<label class="efm-label">Sites <span style="font-weight:400;opacity:.6">— select all that apply</span></label>'
    + '<div class="efm-site-grid" id="ef-site-grid">';
  if (sites.length) {
    var brandColor = BRAND_COLORS[EV_FORM_DATA.brand_id] || '#374151';
    sites.forEach(function(s) {
      var sel = EV_FORM_DATA.site_ids.indexOf(s.site_id) !== -1;
      html += '<button type="button" class="efm-site-btn' + (sel ? ' efm-site-btn--selected' : '') + '" '
        + 'style="' + (sel ? 'border-color:' + brandColor + ';background:' + brandColor + '12' : '') + '" '
        + 'onclick="efToggleSite(\'' + s.site_id + '\')" data-site="' + s.site_id + '">'
        + s.site_name
        + (sel ? ' <span class="efm-site-check">\u2713</span>' : '')
        + '</button>';
    });
  }
  html += '</div>';
  // Selected count chip
  if (EV_FORM_DATA.site_ids.length) {
    html += '<div class="efm-site-summary" id="ef-site-summary">'
      + evBuildSiteChips(EV_FORM_DATA.site_ids)
      + '</div>';
  } else {
    html += '<div class="efm-site-summary" id="ef-site-summary" style="display:none"></div>';
  }
  html += '</div>';

  // Event type pills
  html += '<div class="efm-field"><label class="efm-label">Event type</label><div class="efm-type-row" id="ef-type-row">';
  EV_TYPES.forEach(function(t) {
    var sel = EV_FORM_DATA.event_type_id === t.id;
    html += '<button type="button" class="efm-type-btn' + (sel ? ' efm-type-btn--selected' : '') + '" '
      + 'style="' + (sel ? 'background:' + t.color + ';color:#fff;border-color:' + t.color : 'border-color:' + t.color + ';color:' + t.color) + '" '
      + 'onclick="efSelectType(\'' + t.id + '\')" data-type="' + t.id + '">'
      + t.name + '</button>';
  });
  html += '</div></div>';

  // Hidden carrier inputs
  html += '<input type="hidden" id="ef-brand" value="' + evEscAttr(EV_FORM_DATA.brand_id) + '">';
  html += '<input type="hidden" id="ef-type"  value="' + evEscAttr(EV_FORM_DATA.event_type_id) + '">';

  return html;
}

function evBuildSiteChips(siteIds) {
  if (!siteIds || !siteIds.length) return '';
  return '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">'
    + siteIds.map(function(sid) {
        var site = SB_SITES.find(function(s){ return s.site_id === sid; });
        var color = site ? (BRAND_COLORS[site.brand_id] || '#374151') : '#374151';
        return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px 3px 10px;background:' + color + '18;border:1px solid ' + color + '44;border-radius:100px;font-family:var(--font-b);font-size:12px;font-weight:600;color:var(--ink)">'
          + evEsc(site ? site.site_name : sid)
          + '<button type="button" onclick="efToggleSite(\'' + sid + '\')" style="background:none;border:none;cursor:pointer;padding:0;margin-left:2px;color:var(--ink-soft);font-size:14px;line-height:1">\xD7</button>'
          + '</span>';
      }).join('')
    + '</div>';
}

function efSelectBrand(brandId) {
  EV_FORM_DATA.brand_id = brandId;
  EV_FORM_DATA.site_ids = []; // reset sites on brand change
  document.querySelectorAll('.efm-brand-btn').forEach(function(btn) {
    var b = btn.getAttribute('data-brand');
    var color = BRAND_COLORS[b];
    if (b === brandId) {
      btn.classList.add('efm-brand-btn--selected');
      btn.style.borderColor = color;
      btn.style.boxShadow   = '0 0 0 3px ' + color + '33';
    } else {
      btn.classList.remove('efm-brand-btn--selected');
      btn.style.borderColor = '';
      btn.style.boxShadow   = '';
    }
  });
  document.getElementById('ef-brand').value = brandId;
  // Rebuild site grid for this brand
  var siteWrap = document.getElementById('ef-site-wrap');
  var siteGrid = document.getElementById('ef-site-grid');
  var summary  = document.getElementById('ef-site-summary');
  if (!siteWrap || !siteGrid) return;
  var sites = SB_SITES.filter(function(s){ return s.brand_id === brandId; });
  var color = BRAND_COLORS[brandId] || '#374151';
  siteGrid.innerHTML = sites.map(function(s) {
    return '<button type="button" class="efm-site-btn" onclick="efToggleSite(\'' + s.site_id + '\')" data-site="' + s.site_id + '">' + s.site_name + '</button>';
  }).join('');
  siteWrap.style.display = '';
  if (summary) { summary.innerHTML = ''; summary.style.display = 'none'; }
}

function efToggleSite(siteId) {
  var idx = EV_FORM_DATA.site_ids.indexOf(siteId);
  if (idx === -1) {
    EV_FORM_DATA.site_ids.push(siteId);
  } else {
    EV_FORM_DATA.site_ids.splice(idx, 1);
  }
  // Update button appearance
  var brandColor = EV_FORM_DATA.brand_id ? (BRAND_COLORS[EV_FORM_DATA.brand_id] || '#374151') : '#374151';
  document.querySelectorAll('.efm-site-btn').forEach(function(btn) {
    var sid = btn.getAttribute('data-site');
    var isSel = EV_FORM_DATA.site_ids.indexOf(sid) !== -1;
    if (isSel) {
      btn.classList.add('efm-site-btn--selected');
      btn.style.borderColor = brandColor;
      btn.style.background  = brandColor + '12';
      // Ensure check mark present
      if (btn.innerHTML.indexOf('\u2713') === -1) btn.innerHTML = btn.textContent.trim() + ' <span class="efm-site-check">\u2713</span>';
    } else {
      btn.classList.remove('efm-site-btn--selected');
      btn.style.borderColor = '';
      btn.style.background  = '';
      btn.innerHTML = btn.textContent.replace('\u2713','').trim();
    }
  });
  // Update summary chips
  var summary = document.getElementById('ef-site-summary');
  if (summary) {
    if (EV_FORM_DATA.site_ids.length) {
      summary.innerHTML = evBuildSiteChips(EV_FORM_DATA.site_ids);
      summary.style.display = '';
    } else {
      summary.innerHTML = '';
      summary.style.display = 'none';
    }
  }
  // Update header sub
  var headerSub = document.querySelector('.efm-header-sub');
  if (headerSub) {
    var count = EV_FORM_DATA.site_ids.length;
    headerSub.textContent = 'Event' + (count ? ' \u2014 ' + count + ' site' + (count !== 1 ? 's' : '') + ' selected' : '');
  }
}

function efSelectType(typeId) {
  EV_FORM_DATA.event_type_id = typeId;
  var type = EV_TYPES.find(function(t){ return t.id === typeId; });
  var color = type ? type.color : '#6B7280';
  document.querySelectorAll('.efm-type-btn').forEach(function(btn) {
    if (btn.getAttribute('data-type') === typeId) {
      btn.classList.add('efm-type-btn--selected');
      btn.style.background  = color;
      btn.style.color       = '#fff';
      btn.style.borderColor = color;
    } else {
      btn.classList.remove('efm-type-btn--selected');
      var t2 = EV_TYPES.find(function(t){ return t.id === btn.getAttribute('data-type'); });
      var c2 = t2 ? t2.color : '#6B7280';
      btn.style.background  = '';
      btn.style.color       = c2;
      btn.style.borderColor = c2;
    }
  });
  document.getElementById('ef-type').value = typeId;
}

/* ── STEP 2: Dates, Location, Contact ── */
function evFormStep2() {
  var html = '';
  html += '<div class="efm-section-label">Dates &amp; Times</div>';
  html += '<div class="efm-grid-2">';
  html += '<div class="efm-field"><label class="efm-label" for="ef-start-date">Start date</label><input class="efm-input" id="ef-start-date" type="date" value="' + evEscAttr(EV_FORM_DATA.start_date) + '"></div>';
  html += '<div class="efm-field"><label class="efm-label" for="ef-start-time">Start time <span style="font-weight:400;opacity:.6">(optional)</span></label><input class="efm-input" id="ef-start-time" type="time" value="' + evEscAttr(EV_FORM_DATA.start_time) + '"></div>';
  html += '<div class="efm-field"><label class="efm-label" for="ef-end-date">End date <span style="font-weight:400;opacity:.6">(optional)</span></label><input class="efm-input" id="ef-end-date" type="date" value="' + evEscAttr(EV_FORM_DATA.end_date) + '"></div>';
  html += '<div class="efm-field"><label class="efm-label" for="ef-end-time">End time <span style="font-weight:400;opacity:.6">(optional)</span></label><input class="efm-input" id="ef-end-time" type="time" value="' + evEscAttr(EV_FORM_DATA.end_time) + '"></div>';
  html += '</div>';
  html += '<hr class="efm-divider">';
  html += '<div class="efm-section-label">Location</div>';
  html += '<div class="efm-field"><label class="efm-label" for="ef-location">Venue name</label><input class="efm-input" id="ef-location" type="text" placeholder="e.g. NEC Birmingham, Showroom forecourt" value="' + evEscAttr(EV_FORM_DATA.location) + '"></div>';
  html += '<div class="efm-field"><label class="efm-label" for="ef-location-addr">Address <span style="font-weight:400;opacity:.6">(optional)</span></label><textarea class="efm-input efm-textarea" id="ef-location-addr" rows="2">' + evEsc(EV_FORM_DATA.location_address) + '</textarea></div>';
  html += '<hr class="efm-divider">';
  html += '<div class="efm-section-label">Contact <span style="font-weight:400;opacity:.6">(optional)</span></div>';
  html += '<div class="efm-grid-3">';
  html += '<div class="efm-field"><label class="efm-label" for="ef-contact-name">Name</label><input class="efm-input" id="ef-contact-name" type="text" value="' + evEscAttr(EV_FORM_DATA.contact_name) + '"></div>';
  html += '<div class="efm-field"><label class="efm-label" for="ef-contact-email">Email</label><input class="efm-input" id="ef-contact-email" type="email" value="' + evEscAttr(EV_FORM_DATA.contact_email) + '"></div>';
  html += '<div class="efm-field"><label class="efm-label" for="ef-contact-phone">Phone</label><input class="efm-input" id="ef-contact-phone" type="tel" value="' + evEscAttr(EV_FORM_DATA.contact_phone) + '"></div>';
  html += '</div>';
  return html;
}

/* ── STEP 3: Budget (with remaining) + Vehicles ── */
function evFormStep3() {
  var html = '';
  var brandId = EV_FORM_DATA.brand_id;
  var existingVehicles = EV_FORM_DATA._vehicles || (EV_EDITING_ID ? (EV_VEHICLES[EV_EDITING_ID] || []) : []);

  // Budget inputs
  html += '<div class="efm-section-label">Budget</div>';
  html += '<div class="efm-grid-2">';
  html += '<div class="efm-field"><label class="efm-label" for="ef-planned-budget">Planned budget <span style="font-weight:400;opacity:.6">(per site)</span></label>'
    + '<div class="efm-input-prefix"><span>\xA3</span><input class="efm-input" id="ef-planned-budget" type="number" min="0" placeholder="0" value="' + evEscAttr(String(EV_FORM_DATA.planned_budget)) + '" oninput="efUpdateBudgetPreview()"></div></div>';
  html += '<div class="efm-field"><label class="efm-label" for="ef-actual-spend">Actual spend <span style="font-weight:400;opacity:.6">(per site)</span></label>'
    + '<div class="efm-input-prefix"><span>\xA3</span><input class="efm-input" id="ef-actual-spend" type="number" min="0" placeholder="0" value="' + evEscAttr(String(EV_FORM_DATA.actual_spend)) + '"></div></div>';
  html += '</div>';

  // Co-op toggle
  html += '<div class="efm-field"><label class="efm-toggle-row" for="ef-coop">'
    + '<input type="checkbox" id="ef-coop"' + (EV_FORM_DATA.coop_funded ? ' checked' : '') + ' onchange="document.getElementById(\'ef-coop-row\').style.display=this.checked?\'\':\' none\'">'
    + '<span class="efm-toggle-label">Co-op funded by manufacturer</span></label></div>';
  html += '<div id="ef-coop-row" style="' + (EV_FORM_DATA.coop_funded ? '' : 'display:none') + '">'
    + '<div class="efm-field"><label class="efm-label" for="ef-coop-amount">Co-op amount</label>'
    + '<div class="efm-input-prefix"><span>\xA3</span><input class="efm-input" id="ef-coop-amount" type="number" min="0" placeholder="0" value="' + evEscAttr(String(EV_FORM_DATA.coop_amount)) + '"></div></div></div>';

  // Budget remaining panel — loaded async, placeholder shown first
  html += '<div id="ef-budget-panel" class="efm-budget-panel">';
  if (EV_FORM_DATA.site_ids.length && EV_FORM_DATA.start_date) {
    html += '<div style="font-family:var(--font-b);font-size:12px;color:var(--ink-faint);text-align:center;padding:12px">Loading budget data\u2026</div>';
  } else if (!EV_FORM_DATA.start_date) {
    html += '<div style="font-family:var(--font-b);font-size:12px;color:var(--ink-faint);padding:10px 14px">Set a start date on the previous step to see remaining budgets.</div>';
  } else {
    html += '<div style="font-family:var(--font-b);font-size:12px;color:var(--ink-faint);padding:10px 14px">Select sites on the previous step to see remaining budgets.</div>';
  }
  html += '</div>';

  html += '<hr class="efm-divider">';
  html += '<div class="efm-section-label">Attendance</div>';
  html += '<div class="efm-grid-3">';
  html += '<div class="efm-field"><label class="efm-label" for="ef-expected-footfall">Expected footfall</label><input class="efm-input" id="ef-expected-footfall" type="number" min="0" placeholder="e.g. 200" value="' + evEscAttr(String(EV_FORM_DATA.expected_footfall)) + '"></div>';
  html += '<div class="efm-field"><label class="efm-label" for="ef-actual-footfall">Actual footfall</label><input class="efm-input" id="ef-actual-footfall" type="number" min="0" placeholder="After event" value="' + evEscAttr(String(EV_FORM_DATA.actual_footfall)) + '"></div>';
  html += '<div class="efm-field"><label class="efm-label" for="ef-staff-required">Staff required</label><input class="efm-input" id="ef-staff-required" type="number" min="0" placeholder="e.g. 4" value="' + evEscAttr(String(EV_FORM_DATA.staff_required)) + '"></div>';
  html += '</div>';

  html += '<hr class="efm-divider">';
  html += '<div class="efm-section-label">Vehicles on display</div>';

  if (brandId === 'motormatch') {
    html += '<div class="efm-field"><label class="efm-label" for="ef-vehicle-notes">Vehicle notes <span style="font-weight:400;opacity:.6">(free text for Motor Match)</span></label>'
      + '<textarea class="efm-input efm-textarea" id="ef-vehicle-notes" rows="3" placeholder="List the vehicles being displayed...">' + evEsc(EV_FORM_DATA.vehicle_notes) + '</textarea></div>';
  } else {
    var models = EV_VM[brandId] || [];
    if (!models.length) {
      html += '<p style="font-family:var(--font-b);font-size:13px;color:var(--ink-faint)">No vehicle models found for this brand.</p>';
    } else {
      html += '<div class="efm-vehicles-grid" id="ef-vehicles-list">';
      models.forEach(function(m) {
        var found = existingVehicles.find(function(v){ return v.model_name === m.model_name; });
        var checked = !!found;
        html += '<label class="efm-vehicle-card' + (checked ? ' efm-vehicle-card--checked' : '') + '">'
          + '<input type="checkbox" id="efv-' + evEscAttr(m.id) + '" data-model="' + evEscAttr(m.model_name) + '" data-brand="' + evEscAttr(brandId) + '"' + (checked ? ' checked' : '') + ' onchange="efVehicleToggle(this)">'
          + '<div class="efm-vehicle-name">' + evEsc(m.model_name) + '</div>'
          + '<div class="efm-vehicle-qty"' + (checked ? '' : ' style="display:none"') + ' id="efv-qty-' + evEscAttr(m.id) + '">'
          + '<input type="number" min="1" value="' + (found ? found.quantity : 1) + '" style="width:56px;padding:3px 6px;border:1px solid var(--border);border-radius:3px;font-family:var(--font-m);font-size:12px;text-align:center" data-qty-for="efv-' + evEscAttr(m.id) + '">'
          + '</div>'
          + '</label>';
      });
      html += '</div>';
    }
  }

  return html;
}

// Async: load budget data after step 3 renders
async function efLoadBudgetPanel() {
  var panel = document.getElementById('ef-budget-panel');
  if (!panel) return;
  if (!EV_FORM_DATA.site_ids.length || !EV_FORM_DATA.start_date) return;

  var month = new Date(EV_FORM_DATA.start_date + 'T00:00:00').getMonth();
  var monthName = MONTH_NAMES[month];
  var mN = 'm' + month;
  var plannedInput = parseFloat((document.getElementById('ef-planned-budget') || {}).value) || parseFloat(EV_FORM_DATA.planned_budget) || 0;

  try {
    var siteList = EV_FORM_DATA.site_ids.map(encodeURIComponent).join(',');
    var r = await fetch(SUPA + '/site_budgets?site_id=in.(' + siteList + ')&select=*', { headers: getAuthHeaders() });
    if (!r.ok) { panel.innerHTML = ''; return; }
    var budgets = await r.json();

    // Build a lookup by site_id
    var budgetBySite = {};
    budgets.forEach(function(b){ budgetBySite[b.site_id] = b; });

    var rows = EV_FORM_DATA.site_ids.map(function(sid) {
      var site = SB_SITES.find(function(s){ return s.site_id === sid; });
      var siteName = site ? site.site_name : sid;
      var brow = budgetBySite[sid];
      var allocated = brow ? (brow[mN + '_planned'] || 0) : null;
      var spent     = brow ? (brow[mN + '_actual']  || 0) : null;
      var remaining = (allocated !== null) ? (allocated - spent - plannedInput) : null;
      var color = remaining !== null ? (remaining < 0 ? '#DC2626' : remaining < allocated * 0.1 ? '#D97706' : '#059669') : '#6B7280';
      return { siteName: siteName, allocated: allocated, spent: spent, remaining: remaining, color: color };
    });

    var html = '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-faint);margin-bottom:10px">'
      + monthName + ' budget remaining per site</div>';
    html += '<div class="efm-budget-rows">';
    rows.forEach(function(row) {
      if (row.allocated === null) {
        html += '<div class="efm-budget-row">'
          + '<span class="efm-budget-site">' + evEsc(row.siteName) + '</span>'
          + '<span style="font-family:var(--font-b);font-size:12px;color:var(--ink-faint)">No budget set</span>'
          + '</div>';
      } else {
        var pct = Math.max(0, Math.min(100, row.remaining !== null ? (row.remaining / row.allocated * 100) : 0));
        html += '<div class="efm-budget-row">'
          + '<span class="efm-budget-site">' + evEsc(row.siteName) + '</span>'
          + '<div class="efm-budget-bar-wrap">'
          + '<div class="efm-budget-bar" style="width:' + pct.toFixed(1) + '%;background:' + row.color + '"></div>'
          + '</div>'
          + '<span class="efm-budget-remaining" style="color:' + row.color + '">' + evFmtGBP(Math.max(0, row.remaining)) + ' left</span>'
          + '<span class="efm-budget-total">of ' + evFmtGBP(row.allocated) + '</span>'
          + '</div>';
        if (row.remaining !== null && row.remaining < 0) {
          html += '<div style="font-family:var(--font-b);font-size:11px;color:#DC2626;margin:-4px 0 6px 0">\u26A0 Over budget by ' + evFmtGBP(Math.abs(row.remaining)) + ' at this site</div>';
        }
      }
    });
    html += '</div>';
    panel.innerHTML = html;
  } catch(e) {
    panel.innerHTML = '<div style="font-family:var(--font-b);font-size:12px;color:var(--ink-faint);padding:10px">Could not load budget data.</div>';
    console.warn('efLoadBudgetPanel:', e);
  }
}

function efUpdateBudgetPreview() {
  // Re-run budget panel with current planned input value
  efLoadBudgetPanel();
}

function efVehicleToggle(cb) {
  var card = cb.closest('.efm-vehicle-card');
  var id = cb.id.replace('efv-', '');
  var qtyWrap = document.getElementById('efv-qty-' + id);
  if (cb.checked) {
    if (card) card.classList.add('efm-vehicle-card--checked');
    if (qtyWrap) qtyWrap.style.display = '';
  } else {
    if (card) card.classList.remove('efm-vehicle-card--checked');
    if (qtyWrap) qtyWrap.style.display = 'none';
  }
}

/* ── STEP 4: POS Items + Notes ── */
function evFormStep4() {
  var existing = EV_FORM_DATA._pos || (EV_EDITING_ID ? (EV_EVENT_POS[EV_EDITING_ID] || []) : []);
  var html = '';

  html += '<div class="efm-section-label">POS Items</div>';
  if (!EV_POS_ITEMS.length) {
    html += '<p style="font-family:var(--font-b);font-size:13px;color:var(--ink-faint)">No POS items configured. Add them in Admin \u2192 POS Items.</p>';
  } else {
    var byCategory = {};
    EV_POS_ITEMS.forEach(function(item) {
      var cat = item.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(item);
    });
    html += '<div id="ef-pos-wrap">';
    Object.keys(byCategory).sort().forEach(function(cat) {
      html += '<div class="efm-pos-category"><div class="efm-pos-cat-label">' + evEsc(cat) + '</div>';
      byCategory[cat].forEach(function(item) {
        var found = existing.find(function(p){ return p.pos_item_id === item.id; });
        html += '<div class="efm-pos-row">'
          + '<label class="efm-pos-check-label">'
          + '<input type="checkbox" id="efp-' + item.id + '" data-pos-id="' + item.id + '" data-pos-name="' + evEscAttr(item.name) + '"' + (found ? ' checked' : '') + ' onchange="efPosToggle(this)">'
          + '<span>' + evEsc(item.name) + '</span>'
          + '</label>'
          + '<div class="efm-pos-inputs" id="efp-inputs-' + item.id + '" style="' + (found ? '' : 'display:none') + '">'
          + '<input type="number" min="0" value="' + (found ? found.quantity : 1) + '" placeholder="Qty" class="efm-input efm-input--sm" data-qty-for="efp-' + item.id + '">'
          + '<div class="efm-input-prefix efm-input-prefix--sm"><span>\xA3</span><input type="number" min="0" step="0.01" value="' + (found ? found.unit_cost : (item.default_unit_cost || 0)) + '" placeholder="unit" class="efm-input efm-input--sm" data-cost-for="efp-' + item.id + '"></div>'
          + '</div>'
          + '</div>';
      });
      html += '</div>';
    });
    html += '</div>';
  }

  html += '<hr class="efm-divider">';
  html += '<div class="efm-field"><label class="efm-label" for="ef-notes">Notes <span style="font-weight:400;opacity:.6">(optional)</span></label>'
    + '<textarea class="efm-input efm-textarea" id="ef-notes" rows="4" placeholder="Any additional notes about this event...">' + evEsc(EV_FORM_DATA.notes) + '</textarea></div>';

  return html;
}

function efPosToggle(cb) {
  var wrap = document.getElementById('efp-inputs-' + cb.getAttribute('data-pos-id'));
  if (wrap) wrap.style.display = cb.checked ? '' : 'none';
}

/* ══ SAVE — creates one event row per site ══ */
async function evSave(saveAsConfirmed) {
  evFormCollectStep(EV_FORM_STEP);

  var d = EV_FORM_DATA;
  if (!d.title.trim())        { evFormError('Please enter an event title.'); return; }
  if (!d.brand_id)            { evFormError('Please select a brand.'); return; }
  if (!d.site_ids.length)     { evFormError('Please select at least one site.'); return; }
  if (!d.event_type_id)       { evFormError('Please select an event type.'); return; }
  if (!d.start_date)          { evFormError('Please set a start date.'); return; }

  var saveBtns = document.querySelectorAll('.efm-footer .btn');
  saveBtns.forEach(function(b){ b.disabled = true; b.style.opacity = '0.6'; });

  try {
    if (EV_EDITING_ID) {
      // Editing: update the single existing event (site can't be changed to multi in edit mode — leave as is)
      var oldEvent = EV_EVENTS.find(function(e){ return e.id === EV_EDITING_ID; });
      var payload = evBuildPayload(d, d.site_ids[0] || (oldEvent ? oldEvent.site_id : ''), saveAsConfirmed, false);
      Object.keys(payload).forEach(function(k){ if (payload[k] === undefined) delete payload[k]; });
      var r = await fetch(SUPA + '/events?id=eq.' + EV_EDITING_ID, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(await r.text());
      await evSaveVehicles(EV_EDITING_ID, d.brand_id);
      await evSavePOS(EV_EDITING_ID);
      if (oldEvent) {
        var oldP = oldEvent.planned_budget || 0, newP = parseFloat(d.planned_budget) || 0;
        var oldA = oldEvent.actual_spend   || 0, newA = parseFloat(d.actual_spend)   || 0;
        var siteId = d.site_ids[0] || oldEvent.site_id;
        // Budget changes reflected via events table directly — no site_budgets mutation needed
      }
    } else {
      // New: create one event per site
      for (var i = 0; i < d.site_ids.length; i++) {
        var siteId = d.site_ids[i];
        var payload = evBuildPayload(d, siteId, saveAsConfirmed, true);
        var r = await fetch(SUPA + '/events', {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
          body: JSON.stringify([payload])
        });
        if (!r.ok) throw new Error(await r.text());
        var newRows = await r.json();
        var eventId = newRows[0].id;
        await evSaveVehicles(eventId, d.brand_id);
        await evSavePOS(eventId);
        // Budget aggregated from events table on budget page — no site_budgets mutation
      }
    }

    evCloseForm();
    await evLoadEvents();
    evRender();
    var n = EV_EDITING_ID ? 1 : d.site_ids.length;
    showToast('Event' + (n > 1 ? 's' : '') + ' saved \u2713' + (n > 1 ? ' (' + n + ' sites)' : ''), 'success');
  } catch(e) {
    evFormError('Save failed: ' + e.message);
    saveBtns.forEach(function(b){ b.disabled = false; b.style.opacity = ''; });
  }
}

function evBuildPayload(d, siteId, saveAsConfirmed, isNew) {
  var payload = {
    title:            d.title.trim(),
    site_id:          siteId,
    brand_id:         d.brand_id,
    event_type_id:    d.event_type_id,
    start_date:       d.start_date,
    end_date:         d.end_date         || null,
    start_time:       d.start_time       || null,
    end_time:         d.end_time         || null,
    location:         d.location.trim()  || null,
    location_address: d.location_address.trim() || null,
    contact_name:     d.contact_name.trim()  || null,
    contact_email:    d.contact_email.trim() || null,
    contact_phone:    d.contact_phone.trim() || null,
    planned_budget:   parseFloat(d.planned_budget) || null,
    actual_spend:     parseFloat(d.actual_spend)   || null,
    coop_funded:      !!d.coop_funded,
    coop_amount:      d.coop_funded ? (parseFloat(d.coop_amount) || null) : null,
    expected_footfall:parseInt(d.expected_footfall) || null,
    actual_footfall:  parseInt(d.actual_footfall)   || null,
    staff_required:   parseInt(d.staff_required)    || null,
    vehicle_notes:    d.brand_id === 'motormatch' ? (d.vehicle_notes.trim() || null) : null,
    notes:            d.notes.trim() || null,
    updated_at:       new Date().toISOString()
  };
  if (saveAsConfirmed) {
    payload.status = 'confirmed';
  } else if (isNew) {
    payload.status = 'draft';
  }
  if (isNew) {
    payload.created_by = CB_CURRENT_USER;
    payload.created_at = new Date().toISOString();
  }
  return payload;
}

async function evSaveVehicles(eventId, brandId) {
  // Use pre-collected _vehicles if step 3 was not rendered in this save session
  var rows = [];
  if (brandId !== 'motormatch') {
    var vehicleCheckboxes = document.querySelectorAll('#ef-vehicles-list input[type=checkbox]:checked');
    if (vehicleCheckboxes.length > 0) {
      // Step 3 was rendered — read from DOM
      vehicleCheckboxes.forEach(function(cb) {
        var qtyInput = document.querySelector('[data-qty-for="' + cb.id + '"]');
        rows.push({ event_id: eventId, brand_id: brandId, model_name: cb.getAttribute('data-model'), quantity: parseInt(qtyInput ? qtyInput.value : 1) || 1 });
      });
    } else if (EV_FORM_DATA._vehicles && EV_FORM_DATA._vehicles.length) {
      // Step 3 was skipped — use pre-collected data
      rows = EV_FORM_DATA._vehicles.map(function(v){ return Object.assign({ event_id: eventId }, v); });
    } else if (EV_FORM_DATA._vehicles === null) {
      // _vehicles null means step 3 never visited — don't delete existing records
      return;
    }
  }
  await fetch(SUPA + '/event_vehicles?event_id=eq.' + eventId, { method: 'DELETE', headers: getAuthHeaders() });
  if (!rows.length) return;
  await fetch(SUPA + '/event_vehicles', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify(rows)
  });
}

async function evSavePOS(eventId) {
  // If _pos is null, step 4 was never visited — don't delete existing POS records
  if (EV_FORM_DATA._pos === null) return;
  await fetch(SUPA + '/event_pos?event_id=eq.' + eventId, { method: 'DELETE', headers: getAuthHeaders() });
  var rows = (EV_FORM_DATA._pos || []).map(function(r){ return Object.assign({ event_id: eventId }, r); });
  if (!rows.length) return;
  await fetch(SUPA + '/event_pos', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify(rows)
  });
}

/* ══ STYLES ══ */
function evInjectStyles() {
  if (document.getElementById('ev-form-styles')) return;
  var style = document.createElement('style');
  style.id = 'ev-form-styles';
  style.textContent = [
    '.efm-modal{background:var(--white);border-radius:12px;width:100%;max-width:660px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,0.28);overflow:hidden}',
    '.efm-header{padding:22px 28px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-shrink:0}',
    '.efm-header-title{font-family:var(--font-d);font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.02em}',
    '.efm-header-sub{font-family:var(--font-b);font-size:13px;color:rgba(255,255,255,0.75);margin-top:3px}',
    '.efm-steps{display:flex;align-items:center;padding:14px 28px;border-bottom:1px solid var(--border);flex-shrink:0;background:var(--white)}',
    '.efm-step{display:flex;align-items:center;gap:8px;flex-shrink:0}',
    '.efm-step-num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-m);font-size:11px;font-weight:700;background:var(--surface);color:var(--ink-faint);border:1.5px solid var(--border);transition:all .2s}',
    '.efm-step--active .efm-step-num{background:var(--swansway);color:#fff;border-color:var(--swansway)}',
    '.efm-step--done .efm-step-num{background:#059669;color:#fff;border-color:#059669}',
    '.efm-step-label{font-family:var(--font-b);font-size:12px;font-weight:600;color:var(--ink-faint);white-space:nowrap}',
    '.efm-step--active .efm-step-label{color:var(--ink)}',
    '.efm-step--done .efm-step-label{color:#059669}',
    '.efm-step-line{flex:1;height:1px;background:var(--border);margin:0 10px}',
    '.efm-step-line--done{background:#059669}',
    '.efm-body{flex:1;overflow-y:auto;padding:22px 28px}',
    '.efm-section-label{font-family:var(--font-m);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--ink-faint);margin-bottom:12px}',
    '.efm-divider{border:none;border-top:1px solid var(--border);margin:20px 0}',
    '.efm-field{margin-bottom:16px}',
    '.efm-label{display:block;font-family:var(--font-m);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-soft);margin-bottom:6px}',
    '.efm-input{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:6px;font-family:var(--font-b);font-size:14px;color:var(--ink);background:var(--white);outline:none;box-sizing:border-box;transition:border-color .15s}',
    '.efm-input:focus{border-color:var(--swansway)}',
    '.efm-input--large{font-size:16px;padding:11px 14px;font-weight:600}',
    '.efm-input--sm{width:72px;padding:5px 8px;font-size:12px}',
    '.efm-textarea{resize:vertical;min-height:72px}',
    '.efm-input-prefix{position:relative;display:flex;align-items:center}',
    '.efm-input-prefix span{position:absolute;left:12px;font-family:var(--font-m);font-size:13px;color:var(--ink-soft);pointer-events:none}',
    '.efm-input-prefix .efm-input{padding-left:24px}',
    '.efm-input-prefix--sm span{left:8px;font-size:12px}',
    '.efm-input-prefix--sm .efm-input{padding-left:20px}',
    '.efm-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}',
    '.efm-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}',
    '.efm-brand-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
    '.efm-brand-btn{display:flex;align-items:center;gap:8px;padding:10px 12px;border:1.5px solid var(--border);border-radius:6px;background:var(--white);font-family:var(--font-b);font-size:13px;font-weight:500;color:var(--ink);cursor:pointer;text-align:left;transition:all .15s;width:100%}',
    '.efm-brand-btn:hover{background:var(--surface)}',
    '.efm-brand-btn--selected{font-weight:700}',
    '.efm-brand-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}',
    '.efm-site-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-bottom:0}',
    '.efm-site-btn{padding:7px 12px;border:1.5px solid var(--border);border-radius:5px;background:var(--white);font-family:var(--font-b);font-size:12px;font-weight:500;color:var(--ink);cursor:pointer;text-align:left;transition:all .15s;width:100%;display:flex;justify-content:space-between;align-items:center}',
    '.efm-site-btn:hover{background:var(--surface)}',
    '.efm-site-btn--selected{font-weight:700}',
    '.efm-site-check{font-size:11px;font-weight:700}',
    '.efm-site-summary{margin-top:4px}',
    '.efm-type-row{display:flex;flex-wrap:wrap;gap:8px}',
    '.efm-type-btn{padding:7px 16px;border:1.5px solid;border-radius:100px;font-family:var(--font-b);font-size:13px;font-weight:600;cursor:pointer;background:transparent;transition:all .2s}',
    '.efm-toggle-row{display:flex;align-items:center;gap:10px;cursor:pointer}',
    '.efm-toggle-row input{width:16px;height:16px;cursor:pointer;accent-color:var(--swansway)}',
    '.efm-toggle-label{font-family:var(--font-b);font-size:13px;color:var(--ink)}',
    /* Budget panel */
    '.efm-budget-panel{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px 16px;margin-top:2px;margin-bottom:4px}',
    '.efm-budget-rows{display:flex;flex-direction:column;gap:8px}',
    '.efm-budget-row{display:grid;grid-template-columns:180px 1fr 80px 80px;align-items:center;gap:10px}',
    '.efm-budget-site{font-family:var(--font-b);font-size:12px;font-weight:600;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.efm-budget-bar-wrap{height:6px;background:var(--border);border-radius:3px;overflow:hidden}',
    '.efm-budget-bar{height:100%;border-radius:3px;transition:width .4s}',
    '.efm-budget-remaining{font-family:var(--font-m);font-size:12px;font-weight:700;text-align:right;white-space:nowrap}',
    '.efm-budget-total{font-family:var(--font-m);font-size:11px;color:var(--ink-faint);text-align:right;white-space:nowrap}',
    /* Vehicle grid */
    '.efm-vehicles-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}',
    '.efm-vehicle-card{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border:1.5px solid var(--border);border-radius:6px;background:var(--white);cursor:pointer;transition:all .15s}',
    '.efm-vehicle-card input[type=checkbox]{display:none}',
    '.efm-vehicle-card:hover{background:var(--surface)}',
    '.efm-vehicle-card--checked{border-color:var(--swansway);background:#EFF6FF}',
    '.efm-vehicle-name{font-family:var(--font-b);font-size:13px;font-weight:600;color:var(--ink)}',
    '.efm-vehicle-qty{margin-top:4px}',
    /* POS */
    '.efm-pos-category{margin-bottom:14px}',
    '.efm-pos-cat-label{font-family:var(--font-m);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-faint);margin-bottom:6px}',
    '.efm-pos-row{display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-radius:4px;transition:background .1s}',
    '.efm-pos-row:hover{background:var(--surface)}',
    '.efm-pos-check-label{display:flex;align-items:center;gap:8px;cursor:pointer;font-family:var(--font-b);font-size:13px;color:var(--ink);flex:1}',
    '.efm-pos-check-label input{accent-color:var(--swansway);width:15px;height:15px;cursor:pointer}',
    '.efm-pos-inputs{display:flex;align-items:center;gap:6px}',
    '.efm-footer{padding:16px 28px;border-top:1px solid var(--border);display:flex;align-items:center;gap:8px;background:var(--surface);flex-shrink:0}'
  ].join('');
  document.head.appendChild(style);
}

/* ══ UTILS ══ */
function evEsc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function evEscAttr(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function showToast(msg, type) {
  var t = document.getElementById('ev-toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = (type === 'success') ? '#059669' : '#DC2626';
  t.style.display = 'block';
  t.style.opacity = '1';
  setTimeout(function() {
    t.style.opacity = '0';
    setTimeout(function(){ t.style.display = 'none'; }, 400);
  }, 3000);
}
