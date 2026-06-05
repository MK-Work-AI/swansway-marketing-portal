/* ══════════════════════════════════════════════════════════
   events.js — Events & Product Placements
   Swansway Marketing Portal v2
   ══════════════════════════════════════════════════════════ */


/* ── State ── */
var EV_EVENTS       = [];
var EV_TYPES        = [];
var EV_POS_ITEMS    = [];
var EV_VEHICLES     = {}; // keyed by event_id: [{brand_id,model_name,quantity}]
var EV_EVENT_POS    = {}; // keyed by event_id: [{pos_item_id,pos_item_name,quantity,unit_cost,total_cost}]
var EV_VM           = {}; // vehicle_models keyed by brand_id → [{model_name,id}]

var EV_VIEW         = 'calendar'; // 'calendar' | 'list'
var EV_MONTH        = new Date().getMonth();  // 0-11
var EV_YEAR         = new Date().getFullYear();
var EV_FILTER       = { brand: '', site: '', type: '', status: '' };
var EV_EDITING_ID   = null; // null = new, string = editing existing


var STATUS_COLORS = {
  draft:     '#6B7280',
  confirmed: '#2563EB',
  completed: '#059669',
  cancelled: '#DC2626'
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

    // Load related vehicles and pos for all events
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
  // Brand dropdown
  var brandSel = document.getElementById('ev-filter-brand');
  if (brandSel) {
    brandSel.innerHTML = '<option value="">All brands</option>';
    Object.keys(BRAND_COLORS).forEach(function(b) {
      var label = b.charAt(0).toUpperCase() + b.slice(1);
      if (b === 'vw') label = 'Volkswagen';
      if (b === 'vwcv') label = 'VW Commercial';
      if (b === 'landrover') label = 'Land Rover';
      if (b === 'motormatch') label = 'Motor Match';
      if (b === 'omoda') label = 'OMODA / JAECOO';
      brandSel.innerHTML += '<option value="' + b + '">' + label + '</option>';
    });
  }

  // Site dropdown — populated after brand selected or show all
  evPopulateSiteFilter('');

  // Type dropdown
  var typeSel = document.getElementById('ev-filter-type');
  if (typeSel) {
    typeSel.innerHTML = '<option value="">All types</option>';
    EV_TYPES.forEach(function(t) {
      typeSel.innerHTML += '<option value="' + t.id + '">' + t.name + '</option>';
    });
  }

  // Status dropdown — static
  var statusSel = document.getElementById('ev-filter-status');
  if (statusSel) {
    statusSel.innerHTML = '<option value="">All statuses</option>'
      + '<option value="draft">Draft</option>'
      + '<option value="confirmed">Confirmed</option>'
      + '<option value="completed">Completed</option>'
      + '<option value="cancelled">Cancelled</option>';
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
  if (siteSel) siteSel.addEventListener('change', function() {
    EV_FILTER.site = this.value;
    evRender();
  });
  var typeSel = document.getElementById('ev-filter-type');
  if (typeSel) typeSel.addEventListener('change', function() {
    EV_FILTER.type = this.value;
    evRender();
  });
  var statusSel = document.getElementById('ev-filter-status');
  if (statusSel) statusSel.addEventListener('change', function() {
    EV_FILTER.status = this.value;
    evRender();
  });
}

/* ══ MAIN RENDER ══ */
function evRender() {
  // Update month heading
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
  var startDow = firstDay.getDay(); // 0=Sun
  var totalDays = lastDay.getDate();

  // Filter events that overlap this month
  var filtered = evGetFilteredEvents().filter(function(ev) {
    var s = new Date(ev.start_date + 'T00:00:00');
    var e = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : s;
    var mStart = new Date(EV_YEAR, EV_MONTH, 1);
    var mEnd   = new Date(EV_YEAR, EV_MONTH + 1, 0);
    return s <= mEnd && e >= mStart;
  });

  var html = '';

  // Day headers
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(function(d) {
    html += '<div class="ev-cal-dow">' + d + '</div>';
  });

  // Blank cells before month start (Mon=0 offset)
  var offset = (startDow === 0) ? 6 : startDow - 1;
  for (var i = 0; i < offset; i++) html += '<div class="ev-cal-cell ev-cal-cell--other"></div>';

  for (var day = 1; day <= totalDays; day++) {
    var isToday = (today.getDate() === day && today.getMonth() === EV_MONTH && today.getFullYear() === EV_YEAR);
    var cellClass = 'ev-cal-cell' + (isToday ? ' ev-cal-cell--today' : '');
    html += '<div class="' + cellClass + '">';
    html += '<div class="ev-cal-day-num">' + (isToday ? '<span class="ev-cal-today-badge">' + day + '</span>' : day) + '</div>';

    // Events on this day (start or spanning)
    var dayDate = new Date(EV_YEAR, EV_MONTH, day);
    var dayEvents = filtered.filter(function(ev) {
      var s = new Date(ev.start_date + 'T00:00:00');
      var e = ev.end_date ? new Date(ev.end_date + 'T00:00:00') : s;
      return s <= dayDate && e >= dayDate;
    });

    dayEvents.slice(0, 3).forEach(function(ev) {
      var type = EV_TYPES.find(function(t){ return t.id === ev.event_type_id; });
      var color = type ? type.color : '#6B7280';
      var siteName = (SB_SITES.find(function(s){ return s.site_id === ev.site_id; }) || {}).site_name || ev.site_id || '';
      html += '<div class="ev-cal-bar" style="background:' + color + '" onclick="evOpenDetail(\'' + ev.id + '\')" title="' + evEsc(ev.title) + '">'
            + '<span class="ev-cal-bar-text">' + evEsc(ev.title) + (siteName ? ' · ' + siteName : '') + '</span>'
            + '</div>';
    });
    if (dayEvents.length > 3) {
      html += '<div class="ev-cal-more">+' + (dayEvents.length - 3) + ' more</div>';
    }

    html += '</div>';
  }

  // Trailing blank cells to complete grid
  var totalCells = offset + totalDays;
  var remainder = totalCells % 7;
  if (remainder) {
    for (var j = 0; j < (7 - remainder); j++) html += '<div class="ev-cal-cell ev-cal-cell--other"></div>';
  }

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

  // Group by site
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

    events.forEach(function(ev) {
      html += evRenderCard(ev);
    });

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
  var pos      = EV_EVENT_POS[ev.id] || [];

  var dateStr = evFormatDateRange(ev.start_date, ev.end_date);
  var budget  = ev.planned_budget ? '£' + Number(ev.planned_budget).toLocaleString('en-GB') + ' planned' : '';
  if (ev.actual_spend) budget += ' / £' + Number(ev.actual_spend).toLocaleString('en-GB') + ' actual';

  return '<div class="ev-card" onclick="evOpenDetail(\'' + ev.id + '\')">'
    + '<div class="ev-card-header">'
    + '<span class="ev-badge" style="background:' + typeColor + '">' + evEsc(typeName) + '</span>'
    + '<span class="ev-badge ev-badge--outline" style="border-color:' + statusColor + ';color:' + statusColor + '">' + ev.status.charAt(0).toUpperCase() + ev.status.slice(1) + '</span>'
    + (ev.coop_funded ? '<span class="ev-badge" style="background:#0891B2">Co-op</span>' : '')
    + '</div>'
    + '<div class="ev-card-title">' + evEsc(ev.title) + '</div>'
    + '<div class="ev-card-meta">'
    + (dateStr ? '<span class="ev-card-meta-item">📅 ' + dateStr + '</span>' : '')
    + (ev.location ? '<span class="ev-card-meta-item">📍 ' + evEsc(ev.location) + '</span>' : '')
    + (budget ? '<span class="ev-card-meta-item">💷 ' + budget + '</span>' : '')
    + (ev.expected_footfall ? '<span class="ev-card-meta-item">👥 ' + Number(ev.expected_footfall).toLocaleString() + ' expected</span>' : '')
    + (vehicles.length ? '<span class="ev-card-meta-item">🚗 ' + vehicles.reduce(function(s,v){ return s + v.quantity; }, 0) + ' vehicle' + (vehicles.reduce(function(s,v){ return s + v.quantity; }, 0) !== 1 ? 's' : '') + '</span>' : '')
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
  return evFormatDate(start) + ' — ' + evFormatDate(end);
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
    + '<button class="ev-modal-close" onclick="evCloseDetail()">×</button>'
    + '</div>'

    + '<div class="ev-modal-body">'

    // Dates & Times
    + evModalSection('📅 Dates & Times',
        evModalGrid([
          { label: 'Start', val: evFormatDate(ev.start_date) + (ev.start_time ? ' at ' + ev.start_time : '') },
          { label: 'End',   val: ev.end_date ? evFormatDate(ev.end_date) + (ev.end_time ? ' at ' + ev.end_time : '') : '—' }
        ])
      )

    // Location
    + (ev.location || ev.location_address ? evModalSection('📍 Location',
        evModalGrid([
          ev.location         ? { label: 'Venue', val: ev.location, full: true } : null,
          ev.location_address ? { label: 'Address', val: ev.location_address, full: true } : null
        ].filter(Boolean))
      ) : '')

    // Contact
    + (ev.contact_name || ev.contact_email || ev.contact_phone ? evModalSection('👤 Contact',
        evModalGrid([
          ev.contact_name  ? { label: 'Name',  val: ev.contact_name  } : null,
          ev.contact_email ? { label: 'Email', val: '<a href="mailto:' + evEsc(ev.contact_email) + '">' + evEsc(ev.contact_email) + '</a>' } : null,
          ev.contact_phone ? { label: 'Phone', val: '<a href="tel:' + evEsc(ev.contact_phone) + '">' + evEsc(ev.contact_phone) + '</a>' } : null
        ].filter(Boolean))
      ) : '')

    // Budget
    + evModalSection('💷 Budget',
        evModalGrid([
          { label: 'Planned budget', val: ev.planned_budget ? '£' + Number(ev.planned_budget).toLocaleString('en-GB') : '—' },
          { label: 'Actual spend',   val: ev.actual_spend   ? '£' + Number(ev.actual_spend).toLocaleString('en-GB')   : '—' },
          ev.coop_funded ? { label: 'Co-op amount', val: ev.coop_amount ? '£' + Number(ev.coop_amount).toLocaleString('en-GB') : 'Yes (amount TBC)' } : null
        ].filter(Boolean))
      )

    // Vehicles
    + (vehicles.length ? evModalSection('🚗 Vehicles',
        '<div style="display:flex;flex-wrap:wrap;gap:8px">'
        + vehicles.map(function(v) {
            return '<span style="padding:4px 10px;background:var(--surface);border:1px solid var(--border);border-radius:4px;font-family:var(--font-b);font-size:12px">'
              + evEsc(v.model_name) + ' × ' + v.quantity + '</span>';
          }).join('')
        + '</div>'
      ) : '')

    // POS Items
    + (pos.length ? evModalSection('📦 POS Items',
        '<table style="width:100%;border-collapse:collapse;font-size:12px;font-family:var(--font-b)">'
        + '<thead><tr style="border-bottom:1px solid var(--border)">'
        + '<th style="text-align:left;padding:4px 8px;font-family:var(--font-m);font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft)">Item</th>'
        + '<th style="text-align:right;padding:4px 8px;font-family:var(--font-m);font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft)">Qty</th>'
        + '<th style="text-align:right;padding:4px 8px;font-family:var(--font-m);font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft)">Unit</th>'
        + '<th style="text-align:right;padding:4px 8px;font-family:var(--font-m);font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft)">Total</th>'
        + '</tr></thead><tbody>'
        + pos.map(function(p) {
            return '<tr style="border-bottom:1px solid var(--border)">'
              + '<td style="padding:5px 8px">' + evEsc(p.pos_item_name) + '</td>'
              + '<td style="padding:5px 8px;text-align:right;font-family:var(--font-m)">' + p.quantity + '</td>'
              + '<td style="padding:5px 8px;text-align:right;font-family:var(--font-m)">' + (p.unit_cost ? '£' + Number(p.unit_cost).toLocaleString('en-GB') : '—') + '</td>'
              + '<td style="padding:5px 8px;text-align:right;font-family:var(--font-m)">' + (p.total_cost ? '£' + Number(p.total_cost).toLocaleString('en-GB') : '—') + '</td>'
              + '</tr>';
          }).join('')
        + '<tr style="border-top:2px solid var(--border);font-weight:700">'
        + '<td colspan="3" style="padding:6px 8px;font-family:var(--font-m);font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft)">Total POS cost</td>'
        + '<td style="padding:6px 8px;text-align:right;font-family:var(--font-m);color:var(--swansway)">£' + Number(posTotalCost).toLocaleString('en-GB') + '</td>'
        + '</tr>'
        + '</tbody></table>'
      ) : '')

    // Attendance
    + (ev.expected_footfall || ev.actual_footfall || ev.staff_required ? evModalSection('👥 Attendance',
        evModalGrid([
          ev.expected_footfall ? { label: 'Expected footfall', val: Number(ev.expected_footfall).toLocaleString() } : null,
          ev.actual_footfall   ? { label: 'Actual footfall',   val: Number(ev.actual_footfall).toLocaleString()   } : null,
          ev.staff_required    ? { label: 'Staff required',    val: ev.staff_required                             } : null
        ].filter(Boolean))
      ) : '')

    // Notes
    + (ev.notes ? evModalSection('📝 Notes', '<p style="font-family:var(--font-b);font-size:13px;color:var(--ink-soft);white-space:pre-wrap;margin:0">' + evEsc(ev.notes) + '</p>') : '')

    // Debrief (only when completed)
    + (ev.status === 'completed' ? evModalSection('📊 Debrief', ev.debrief
        ? '<p style="font-family:var(--font-b);font-size:13px;color:var(--ink-soft);white-space:pre-wrap;margin:0">' + evEsc(ev.debrief) + '</p>'
        : '<p style="font-family:var(--font-b);font-size:13px;color:var(--ink-faint);margin:0">No debrief added yet.</p>'
      ) : '')

    + '</div>' // ev-modal-body

    // Actions
    + '<div class="ev-modal-footer">'
    + '<button class="btn" onclick="evOpenForm(\'' + ev.id + '\')">✏ Edit</button>'
    + (isLeadership && ev.status === 'draft'      ? '<button class="btn btn-accent" onclick="evChangeStatus(\'' + ev.id + '\',\'confirmed\')">✓ Confirm</button>' : '')
    + (isLeadership && ev.status === 'confirmed'  ? '<button class="btn" onclick="evChangeStatus(\'' + ev.id + '\',\'draft\')">↩ Unconfirm</button>' : '')
    + (isLeadership && ev.status === 'confirmed'  ? '<button class="btn btn-accent" onclick="evChangeStatus(\'' + ev.id + '\',\'completed\')">✅ Mark Complete</button>' : '')
    + (isLeadership && ev.status !== 'cancelled' && ev.status !== 'completed' ? '<button class="btn" style="color:#DC2626;border-color:#DC2626" onclick="evChangeStatus(\'' + ev.id + '\',\'cancelled\')">✕ Cancel</button>' : '')
    + (isLeadership ? '<button class="btn" style="color:#DC2626;border-color:#DC2626;margin-left:auto" onclick="evDelete(\'' + ev.id + '\')">🗑 Delete</button>' : '')
    + '</div>'

    + '</div></div>'; // ev-modal, ev-modal-overlay

  document.getElementById('ev-modal-root').innerHTML = html;
}

function evCloseDetail() {
  var root = document.getElementById('ev-modal-root');
  if (root) root.innerHTML = '';
}

function evModalSection(title, bodyHtml) {
  return '<div class="ev-modal-section">'
    + '<div class="ev-modal-section-title">' + title + '</div>'
    + bodyHtml
    + '</div>';
}

function evModalGrid(items) {
  return '<div class="ev-modal-grid">'
    + items.map(function(item) {
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
    showToast('Status updated ✓', 'success');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

/* ══ DELETE ══ */
async function evDelete(id) {
  if (!confirm('Delete this event? This cannot be undone.')) return;
  try {
    // Reverse budget contribution before deleting
    var ev = EV_EVENTS.find(function(e){ return e.id === id; });
    if (ev) {
      if (ev.planned_budget) await evUpdateBudget(ev, -ev.planned_budget, null);
      if (ev.actual_spend)   await evUpdateBudget(ev, null, -ev.actual_spend);
    }
    var r = await fetch(SUPA + '/events?id=eq.' + id, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!r.ok) throw new Error(await r.text());
    evCloseDetail();
    await evLoadEvents();
    evRender();
    showToast('Event deleted', 'success');
  } catch(e) { showToast('Error: ' + e.message, 'error'); }
}

/* ══ BUDGET INTEGRATION ══ */
async function evUpdateBudget(ev, plannedDelta, actualDelta) {
  if (!ev.site_id || !ev.start_date) return;
  var month = new Date(ev.start_date + 'T00:00:00').getMonth(); // 0-11
  var mN = 'm' + month;

  try {
    // Fetch current site_budgets row for this site
    var r = await fetch(SUPA + '/site_budgets?site_id=eq.' + encodeURIComponent(ev.site_id) + '&limit=1', {
      headers: getAuthHeaders()
    });
    if (!r.ok) return;
    var rows = await r.json();
    if (!rows || !rows.length) return;
    var row = rows[0];

    var patch = {};
    if (plannedDelta !== null && plannedDelta !== undefined) {
      patch[mN + '_planned'] = (row[mN + '_planned'] || 0) + plannedDelta;
    }
    if (actualDelta !== null && actualDelta !== undefined) {
      patch[mN + '_actual'] = (row[mN + '_actual'] || 0) + actualDelta;
    }

    if (!Object.keys(patch).length) return;

    await fetch(SUPA + '/site_budgets?site_id=eq.' + encodeURIComponent(ev.site_id), {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
      body: JSON.stringify(patch)
    });
  } catch(e) { console.warn('evUpdateBudget:', e); }
}

/* ══ ADD / EDIT FORM ══ */
function evOpenForm(id) {
  EV_EDITING_ID = id || null;
  var ev = id ? EV_EVENTS.find(function(e){ return e.id === id; }) : null;
  evCloseDetail();
  evBuildForm(ev);
  document.getElementById('ev-form-panel').classList.add('open');
}

function evCloseForm() {
  document.getElementById('ev-form-panel').classList.remove('open');
  EV_EDITING_ID = null;
}

function evBuildForm(ev) {
  var isLeadership = CB_TEAM[CB_CURRENT_USER] && CB_TEAM[CB_CURRENT_USER].is_leadership;
  var f = document.getElementById('ev-form-body');
  if (!f) return;

  // Form fields
  var brandId  = ev ? ev.brand_id : '';
  var sites    = brandId ? SB_SITES.filter(function(s){ return s.brand_id === brandId; }) : SB_SITES;
  var brandName = function(b) {
    var map = { vw:'Volkswagen', vwcv:'VW Commercial', landrover:'Land Rover', motormatch:'Motor Match', omoda:'OMODA / JAECOO' };
    return map[b] || (b.charAt(0).toUpperCase() + b.slice(1));
  };

  var html = '';

  // Title
  html += evField('Title', '<input class="admin-input" id="ef-title" type="text" placeholder="Event title" style="width:100%" value="' + (ev ? evEscAttr(ev.title) : '') + '">');

  // Brand + Site
  html += '<div class="form-grid-2">';
  html += '<div>' + evLabel('Brand')
    + '<select class="admin-input" id="ef-brand" onchange="evFormBrandChange()" style="width:100%">'
    + '<option value="">Select brand</option>'
    + Object.keys(BRAND_COLORS).map(function(b) {
        return '<option value="' + b + '"' + (brandId === b ? ' selected' : '') + '>' + brandName(b) + '</option>';
      }).join('')
    + '</select></div>';
  html += '<div>' + evLabel('Site')
    + '<select class="admin-input" id="ef-site" style="width:100%">'
    + '<option value="">Select site</option>'
    + sites.map(function(s) {
        return '<option value="' + s.site_id + '"' + (ev && ev.site_id === s.site_id ? ' selected' : '') + '>' + s.site_name + '</option>';
      }).join('')
    + '</select></div>';
  html += '</div>';

  // Event type
  html += evField('Event type',
    '<select class="admin-input" id="ef-type" style="width:100%">'
    + '<option value="">Select type</option>'
    + EV_TYPES.map(function(t) {
        return '<option value="' + t.id + '"' + (ev && ev.event_type_id === t.id ? ' selected' : '') + '>' + t.name + '</option>';
      }).join('')
    + '</select>'
  );

  // Dates
  html += '<div class="form-grid-2">';
  html += '<div>' + evLabel('Start date') + '<input class="admin-input" id="ef-start-date" type="date" style="width:100%" value="' + (ev ? (ev.start_date||'') : '') + '"></div>';
  html += '<div>' + evLabel('Start time') + '<input class="admin-input" id="ef-start-time" type="time" style="width:100%" value="' + (ev ? (ev.start_time||'') : '') + '"></div>';
  html += '</div>';
  html += '<div class="form-grid-2">';
  html += '<div>' + evLabel('End date') + '<input class="admin-input" id="ef-end-date" type="date" style="width:100%" value="' + (ev ? (ev.end_date||'') : '') + '"></div>';
  html += '<div>' + evLabel('End time') + '<input class="admin-input" id="ef-end-time" type="time" style="width:100%" value="' + (ev ? (ev.end_time||'') : '') + '"></div>';
  html += '</div>';

  // Location
  html += evField('Venue / Location name', '<input class="admin-input" id="ef-location" type="text" style="width:100%" value="' + (ev ? evEscAttr(ev.location||'') : '') + '">');
  html += evField('Location address', '<textarea class="admin-input" id="ef-location-addr" rows="2" style="width:100%;resize:vertical">' + (ev ? evEsc(ev.location_address||'') : '') + '</textarea>');

  // Contact
  html += '<div class="form-grid-3">';
  html += '<div>' + evLabel('Contact name')  + '<input class="admin-input" id="ef-contact-name"  type="text"  style="width:100%" value="' + (ev ? evEscAttr(ev.contact_name||'')  : '') + '"></div>';
  html += '<div>' + evLabel('Contact email') + '<input class="admin-input" id="ef-contact-email" type="email" style="width:100%" value="' + (ev ? evEscAttr(ev.contact_email||'') : '') + '"></div>';
  html += '<div>' + evLabel('Contact phone') + '<input class="admin-input" id="ef-contact-phone" type="tel"   style="width:100%" value="' + (ev ? evEscAttr(ev.contact_phone||'') : '') + '"></div>';
  html += '</div>';

  // Budget
  html += '<div class="form-grid-2">';
  html += '<div>' + evLabel('Planned budget (£)') + '<input class="admin-input" id="ef-planned-budget" type="number" min="0" style="width:100%" value="' + (ev && ev.planned_budget ? ev.planned_budget : '') + '"></div>';
  html += '<div>' + evLabel('Actual spend (£)') + '<input class="admin-input" id="ef-actual-spend" type="number" min="0" style="width:100%" value="' + (ev && ev.actual_spend ? ev.actual_spend : '') + '"></div>';
  html += '</div>';
  html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">'
    + '<input type="checkbox" id="ef-coop" style="width:16px;height:16px;cursor:pointer"' + (ev && ev.coop_funded ? ' checked' : '') + ' onchange="document.getElementById(\'ef-coop-amount-wrap\').style.display=this.checked?\'block\':\'none\'">'
    + '<label for="ef-coop" style="font-family:var(--font-b);font-size:13px;cursor:pointer">Co-op funded</label>'
    + '</div>';
  html += '<div id="ef-coop-amount-wrap" style="' + (ev && ev.coop_funded ? '' : 'display:none') + 'margin-bottom:14px">'
    + evLabel('Co-op amount (£)')
    + '<input class="admin-input" id="ef-coop-amount" type="number" min="0" style="width:100%" value="' + (ev && ev.coop_amount ? ev.coop_amount : '') + '">'
    + '</div>';

  // Attendance
  html += '<div class="form-grid-2">';
  html += '<div>' + evLabel('Expected footfall') + '<input class="admin-input" id="ef-expected-footfall" type="number" min="0" style="width:100%" value="' + (ev && ev.expected_footfall ? ev.expected_footfall : '') + '"></div>';
  html += '<div>' + evLabel('Staff required')    + '<input class="admin-input" id="ef-staff-required"    type="number" min="0" style="width:100%" value="' + (ev && ev.staff_required    ? ev.staff_required    : '') + '"></div>';
  html += '</div>';

  // Vehicles
  var isMotorMatch = (brandId === 'motormatch');
  html += '<div class="ev-form-section-title">🚗 Vehicles</div>';
  if (isMotorMatch) {
    html += evField('Vehicle notes (free text)', '<textarea class="admin-input" id="ef-vehicle-notes" rows="3" style="width:100%;resize:vertical">' + (ev ? evEsc(ev.vehicle_notes||'') : '') + '</textarea>');
  } else {
    html += '<div id="ef-vehicles-wrap">' + evBuildVehiclesWidget(brandId, ev) + '</div>';
  }

  // POS Items
  html += '<div class="ev-form-section-title">📦 POS Items</div>';
  html += '<div id="ef-pos-wrap">' + evBuildPosWidget(ev) + '</div>';

  // Notes
  html += evField('Notes', '<textarea class="admin-input" id="ef-notes" rows="4" style="width:100%;resize:vertical">' + (ev ? evEsc(ev.notes||'') : '') + '</textarea>');

  f.innerHTML = html;
}

function evBuildVehiclesWidget(brandId, ev) {
  if (!brandId) return '<p style="font-size:12px;color:var(--ink-faint);font-family:var(--font-b)">Select a brand first to choose vehicles.</p>';
  var models = EV_VM[brandId] || [];
  var existing = ev ? (EV_VEHICLES[ev.id] || []) : [];

  if (!models.length) return '<p style="font-size:12px;color:var(--ink-faint);font-family:var(--font-b)">No vehicle models found for this brand.</p>';

  return '<div id="ef-vehicles-list">'
    + models.map(function(m) {
        var found = existing.find(function(v){ return v.model_name === m.model_name; });
        return '<div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid var(--border)">'
          + '<input type="checkbox" id="efv-' + evEscAttr(m.id) + '" data-model="' + evEscAttr(m.model_name) + '" data-brand="' + evEscAttr(brandId) + '"'
          + (found ? ' checked' : '')
          + ' style="width:15px;height:15px;cursor:pointer">'
          + '<label for="efv-' + evEscAttr(m.id) + '" style="flex:1;font-family:var(--font-b);font-size:13px;cursor:pointer">' + evEsc(m.model_name) + '</label>'
          + '<input type="number" min="1" value="' + (found ? found.quantity : 1) + '" style="width:60px;padding:3px 6px;border:1px solid var(--border);border-radius:3px;font-family:var(--font-m);font-size:12px" data-qty-for="efv-' + evEscAttr(m.id) + '">'
          + '</div>';
      }).join('')
    + '</div>';
}

function evBuildPosWidget(ev) {
  var existing = ev ? (EV_EVENT_POS[ev.id] || []) : [];

  if (!EV_POS_ITEMS.length) return '<p style="font-size:12px;color:var(--ink-faint);font-family:var(--font-b)">No POS items found.</p>';

  // Group by category
  var byCategory = {};
  EV_POS_ITEMS.forEach(function(item) {
    var cat = item.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });

  var html = '';
  Object.keys(byCategory).sort().forEach(function(cat) {
    html += '<div style="margin-bottom:8px"><div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:4px">' + evEsc(cat) + '</div>';
    byCategory[cat].forEach(function(item) {
      var found = existing.find(function(p){ return p.pos_item_id === item.id; });
      html += '<div style="display:grid;grid-template-columns:24px 1fr 70px 80px;gap:8px;align-items:center;padding:4px 0;border-bottom:1px solid var(--border)">'
        + '<input type="checkbox" id="efp-' + item.id + '" data-pos-id="' + item.id + '" data-pos-name="' + evEscAttr(item.name) + '" data-default-cost="' + (item.default_unit_cost || 0) + '"'
        + (found ? ' checked' : '')
        + ' style="width:15px;height:15px;cursor:pointer">'
        + '<label for="efp-' + item.id + '" style="font-family:var(--font-b);font-size:12px;cursor:pointer">' + evEsc(item.name) + '</label>'
        + '<input type="number" min="0" value="' + (found ? found.quantity : 1) + '" placeholder="Qty" style="padding:3px 5px;border:1px solid var(--border);border-radius:3px;font-family:var(--font-m);font-size:12px" data-qty-for="efp-' + item.id + '">'
        + '<input type="number" min="0" step="0.01" value="' + (found ? found.unit_cost : (item.default_unit_cost || 0)) + '" placeholder="£/unit" style="padding:3px 5px;border:1px solid var(--border);border-radius:3px;font-family:var(--font-m);font-size:12px" data-cost-for="efp-' + item.id + '">'
        + '</div>';
    });
    html += '</div>';
  });

  return html;
}

function evFormBrandChange() {
  var brandId = document.getElementById('ef-brand').value;
  // Repopulate site dropdown
  var siteSel = document.getElementById('ef-site');
  if (siteSel) {
    var sites = brandId ? SB_SITES.filter(function(s){ return s.brand_id === brandId; }) : SB_SITES;
    siteSel.innerHTML = '<option value="">Select site</option>'
      + sites.map(function(s) { return '<option value="' + s.site_id + '">' + s.site_name + '</option>'; }).join('');
  }
  // Repopulate vehicles
  var vwrap = document.getElementById('ef-vehicles-wrap');
  if (vwrap) vwrap.innerHTML = evBuildVehiclesWidget(brandId, null);
  // Show/hide vehicle notes field for Motor Match
  var vehicleNotesRow = document.getElementById('ef-vehicle-notes');
  // Already handled by rebuild
}

/* ── Form helpers ── */
function evField(labelText, inputHtml) {
  return '<div style="margin-bottom:14px">' + evLabel(labelText) + inputHtml + '</div>';
}
function evLabel(text) {
  return '<div style="font-family:var(--font-m);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-soft);margin-bottom:4px">' + text + '</div>';
}

/* ══ SAVE EVENT ══ */
async function evSave(saveAsConfirmed) {
  var titleEl = document.getElementById('ef-title');
  if (!titleEl || !titleEl.value.trim()) { alert('Please enter an event title.'); return; }

  var siteId  = document.getElementById('ef-site').value;
  var brandId = document.getElementById('ef-brand').value;
  var typeId  = document.getElementById('ef-type').value;
  var startDate = document.getElementById('ef-start-date').value;

  if (!siteId)    { alert('Please select a site.');       return; }
  if (!brandId)   { alert('Please select a brand.');      return; }
  if (!typeId)    { alert('Please select an event type.'); return; }
  if (!startDate) { alert('Please set a start date.');    return; }

  var coopChecked = document.getElementById('ef-coop').checked;

  var payload = {
    title:           titleEl.value.trim(),
    site_id:         siteId,
    brand_id:        brandId,
    event_type_id:   typeId,
    status:          saveAsConfirmed ? 'confirmed' : (EV_EDITING_ID ? undefined : 'draft'),
    start_date:      startDate,
    end_date:        document.getElementById('ef-end-date').value   || null,
    start_time:      document.getElementById('ef-start-time').value || null,
    end_time:        document.getElementById('ef-end-time').value   || null,
    location:        document.getElementById('ef-location').value.trim()      || null,
    location_address:document.getElementById('ef-location-addr').value.trim() || null,
    contact_name:    document.getElementById('ef-contact-name').value.trim()  || null,
    contact_email:   document.getElementById('ef-contact-email').value.trim() || null,
    contact_phone:   document.getElementById('ef-contact-phone').value.trim() || null,
    planned_budget:  parseFloat(document.getElementById('ef-planned-budget').value) || null,
    actual_spend:    parseFloat(document.getElementById('ef-actual-spend').value)   || null,
    coop_funded:     coopChecked,
    coop_amount:     coopChecked ? (parseFloat(document.getElementById('ef-coop-amount').value) || null) : null,
    expected_footfall: parseInt(document.getElementById('ef-expected-footfall').value) || null,
    staff_required:    parseInt(document.getElementById('ef-staff-required').value)   || null,
    notes:           document.getElementById('ef-notes').value.trim() || null,
    updated_at:      new Date().toISOString()
  };

  // Vehicle notes (motor match)
  var vnEl = document.getElementById('ef-vehicle-notes');
  if (vnEl) payload.vehicle_notes = vnEl.value.trim() || null;

  // Remove undefined keys
  Object.keys(payload).forEach(function(k) { if (payload[k] === undefined) delete payload[k]; });

  var saveBtns = document.querySelectorAll('#ev-form-panel .btn');
  saveBtns.forEach(function(b){ b.disabled = true; });

  try {
    var eventId;
    var oldEvent = EV_EDITING_ID ? EV_EVENTS.find(function(e){ return e.id === EV_EDITING_ID; }) : null;

    if (EV_EDITING_ID) {
      // PATCH
      var r = await fetch(SUPA + '/events?id=eq.' + EV_EDITING_ID, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
        body: JSON.stringify(payload)
      });
      if (!r.ok) throw new Error(await r.text());
      eventId = EV_EDITING_ID;
    } else {
      // POST
      payload.created_by = CB_CURRENT_USER;
      payload.created_at = new Date().toISOString();
      var r = await fetch(SUPA + '/events', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
        body: JSON.stringify([payload])
      });
      if (!r.ok) throw new Error(await r.text());
      var newRows = await r.json();
      eventId = newRows[0].id;
    }

    // Save vehicles
    await evSaveVehicles(eventId, brandId);

    // Save POS
    await evSavePOS(eventId);

    // Budget integration
    if (EV_EDITING_ID && oldEvent) {
      // Delta planned
      var oldPlanned = oldEvent.planned_budget || 0;
      var newPlanned = payload.planned_budget  || 0;
      var oldActual  = oldEvent.actual_spend   || 0;
      var newActual  = payload.actual_spend    || 0;
      if (newPlanned !== oldPlanned) await evUpdateBudget({ site_id: siteId, start_date: startDate }, newPlanned - oldPlanned, null);
      if (newActual  !== oldActual)  await evUpdateBudget({ site_id: siteId, start_date: startDate }, null, newActual - oldActual);
    } else {
      // New event
      if (payload.planned_budget) await evUpdateBudget({ site_id: siteId, start_date: startDate }, payload.planned_budget, null);
      if (payload.actual_spend)   await evUpdateBudget({ site_id: siteId, start_date: startDate }, null, payload.actual_spend);
    }

    evCloseForm();
    await evLoadEvents();
    evRender();
    showToast('Event saved ✓', 'success');
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
    saveBtns.forEach(function(b){ b.disabled = false; });
  }
}

async function evSaveVehicles(eventId, brandId) {
  // Delete existing then re-insert
  await fetch(SUPA + '/event_vehicles?event_id=eq.' + eventId, { method: 'DELETE', headers: getAuthHeaders() });

  if (brandId === 'motormatch') return; // Free text — no rows

  var rows = [];
  var checkboxes = document.querySelectorAll('#ef-vehicles-list input[type=checkbox]:checked');
  checkboxes.forEach(function(cb) {
    var modelName = cb.getAttribute('data-model');
    var qtyInput  = document.querySelector('[data-qty-for="' + cb.id + '"]');
    var qty       = parseInt(qtyInput ? qtyInput.value : 1) || 1;
    rows.push({ event_id: eventId, brand_id: brandId, model_name: modelName, quantity: qty });
  });

  if (!rows.length) return;
  await fetch(SUPA + '/event_vehicles', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify(rows)
  });
}

async function evSavePOS(eventId) {
  // Delete existing then re-insert
  await fetch(SUPA + '/event_pos?event_id=eq.' + eventId, { method: 'DELETE', headers: getAuthHeaders() });

  var rows = [];
  var checkboxes = document.querySelectorAll('#ef-pos-wrap input[type=checkbox]:checked');
  checkboxes.forEach(function(cb) {
    var posId   = cb.getAttribute('data-pos-id');
    var posName = cb.getAttribute('data-pos-name');
    var qtyInput  = document.querySelector('[data-qty-for="efp-' + posId + '"]');
    var costInput = document.querySelector('[data-cost-for="efp-' + posId + '"]');
    var qty   = parseInt(qtyInput   ? qtyInput.value   : 1)   || 1;
    var cost  = parseFloat(costInput ? costInput.value : 0)    || 0;
    rows.push({
      event_id:      eventId,
      pos_item_id:   posId,
      pos_item_name: posName,
      quantity:      qty,
      unit_cost:     cost,
      total_cost:    Math.round(qty * cost * 100) / 100
    });
  });

  if (!rows.length) return;
  await fetch(SUPA + '/event_pos', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify(rows)
  });
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
