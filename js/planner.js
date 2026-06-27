// planner.js v101 — Events & Activity Planner
// Swansway Marketing Portal

/* ── Constants ── */
var SUPA_PL = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';


/* ── State ── */
var PL = {
  brand:      'all',
  quarter:    3,
  year:       2026,
  events:     [],
  activities: [],
  eventTypes: [],
  team:       [],
  sites:      [],
  brands:     [],
  filters:    { type:'', rag:'', assigned:'', search:'' },
  sectionsOpen: { events: true, activities: true },
  isAdmin:    false,
  openActSite: null  // currently expanded activity site
};

/* ── Init ── */
async function plInit() {
  await swEnsureUser();
  // Check role
  try {
    var sess = await SB.auth.getSession();
    if (sess.data.session) {
      var uid = sess.data.session.user.id;
      var tr = await fetch(SUPA_PL + '/campaign_team?auth_user_id=eq.' + uid + '&select=portal_role', { headers: getAuthHeaders() });
      if (tr.ok) {
        var rows = await tr.json();
        if (rows && rows.length && ['admin','super_admin'].includes(rows[0].portal_role)) {
          PL.isAdmin = true;
          var addBtn = document.getElementById('pl-add-btn');
          if (addBtn) addBtn.style.display = 'inline-flex';
        }
      }
    }
  } catch(e) {}

  await Promise.all([plLoadMeta(), plLoadData()]);
  plBuildSidebar();
  plBuildFilterDropdowns();
  plRender();
}

/* ── Load metadata ── */
async function plLoadMeta() {
  try {
    var [typesRes, teamRes, sitesRes] = await Promise.all([
      fetch(SUPA_PL + '/event_types?select=*&order=sort_order', { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/campaign_team?select=id,name&active=eq.true&order=name', { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/hub_sites?select=site_id,site_name,brand_id&order=sort_order', { headers: getAuthHeaders() }),
    ]);
    if (typesRes.ok) PL.eventTypes = await typesRes.json();
    if (teamRes.ok)  PL.team       = await teamRes.json();
    if (sitesRes.ok) PL.sites      = await sitesRes.json();
  } catch(e) { console.warn('plLoadMeta:', e); }
}

/* ── Load events + activities ── */
async function plLoadData() {
  var q = PL.quarter, y = PL.year;
  var qtag = 'Q' + q + '-' + y;

  try {
    // Events: filter by quarter_tags contains current quarter
    var evUrl = SUPA_PL + '/events?select=*&is_archived=eq.false&order=start_date';
    if (PL.brand !== 'all') evUrl += '&brand_id=eq.' + PL.brand;

    // Activities for this quarter
    var actUrl = SUPA_PL + '/activities?select=*&quarter=eq.' + q + '&year=eq.' + y + '&is_archived=eq.false&order=site_id,category_id';
    if (PL.brand !== 'all') actUrl += '&brand_id=eq.' + PL.brand;

    var [evRes, actRes] = await Promise.all([
      fetch(evUrl, { headers: getAuthHeaders() }),
      fetch(actUrl, { headers: getAuthHeaders() }),
    ]);

    if (evRes.ok) {
      var allEvents = await evRes.json();
      // Filter to events that include this quarter tag
      PL.events = allEvents.filter(function(e) {
        if (!e.quarter_tags || !e.quarter_tags.length) return false;
        return e.quarter_tags.indexOf(qtag) !== -1;
      });
    }
    if (actRes.ok) PL.activities = await actRes.json();
  } catch(e) { console.warn('plLoadData:', e); }
}

/* ── Build sidebar ── */
function plBuildSidebar() {
  var container = document.getElementById('pl-brand-list');
  if (!container) return;

  // Count events per brand
  var brandCounts = {};
  PL.events.forEach(function(e) {
    brandCounts[e.brand_id] = (brandCounts[e.brand_id] || 0) + 1;
  });

  var total = PL.events.length;
  var totalEl = document.getElementById('cnt-all');
  if (totalEl) totalEl.textContent = total || '';

  var html = '';
  Object.keys(BRAND_NAMES).forEach(function(bid) {
    var color  = BRAND_COLORS[bid] || '#666';
    var name   = BRAND_NAMES[bid];
    var count  = brandCounts[bid] || '';
    var active = PL.brand === bid ? ' active' : '';
    html += '<button class="pl-brand-btn' + active + '" data-brand="' + bid + '" onclick="plSetBrand(\'' + bid + '\',this)">'
      + '<span class="pl-brand-dot" style="background:' + color + '"></span>'
      + plEsc(name)
      + '<span class="pl-brand-count">' + (count || '') + '</span>'
      + '</button>';
  });
  container.innerHTML = html;

  // Restore active state on All brands button
  var allBtn = document.querySelector('.pl-brand-btn[data-brand="all"]');
  if (allBtn) {
    if (PL.brand === 'all') allBtn.classList.add('active');
    else allBtn.classList.remove('active');
  }
}

/* ── Build filter dropdowns ── */
function plBuildFilterDropdowns() {
  // Event types
  var typeEl = document.getElementById('pl-f-type');
  if (typeEl && PL.eventTypes.length) {
    PL.eventTypes.forEach(function(t) {
      var opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = t.name;
      typeEl.appendChild(opt);
    });
  }

  // Assigned to
  var assignEl = document.getElementById('pl-f-assigned');
  if (assignEl && PL.team.length) {
    PL.team.forEach(function(m) {
      var opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = m.name;
      assignEl.appendChild(opt);
    });
  }
}

/* ── Render everything ── */
function plRender() {
  plUpdateSubtitle();
  plUpdateKPIs();
  plRenderEvents();
  plRenderActivities();
}

function plUpdateSubtitle() {
  var el = document.getElementById('pl-subtitle');
  if (!el) return;
  var brandLabel = PL.brand === 'all' ? 'All brands' : (BRAND_NAMES[PL.brand] || PL.brand);
  el.textContent = brandLabel + ' · Q' + PL.quarter + ' ' + PL.year;
}

/* ── KPIs ── */
function plUpdateKPIs() {
  var filtered = plFilteredEvents();
  var total = filtered.length;
  var completed = filtered.filter(function(e) { return e.rag_status === 'Complete'; }).length;
  var spend = filtered.reduce(function(s, e) { return s + (parseFloat(e.planned_budget) || 0); }, 0);

  var actFiltered = plFilteredActivities();
  var inProg = actFiltered.filter(function(a) { return a.rag_status === 'In Progress'; }).length;
  var atRisk = actFiltered.filter(function(a) { return a.rag_status === 'At Risk' || a.rag_status === 'Not Started'; }).length;

  var setKpi = function(id, val, sub) {
    var el = document.getElementById(id); if (el) el.textContent = val;
    var subEl = document.getElementById(id + '-sub'); if (subEl && sub) subEl.textContent = sub;
  };
  setKpi('kpi-events', total, completed + ' complete');
  setKpi('kpi-spend', spend ? '£' + Math.round(spend).toLocaleString('en-GB') : '£0', 'planned budget');
  setKpi('kpi-acts', inProg, 'of ' + actFiltered.length + ' activities');
  setKpi('kpi-risk', atRisk, 'across ' + actFiltered.length + ' activities');
}

/* ── Filter helpers ── */
function plFilteredEvents() {
  var f = PL.filters;
  return PL.events.filter(function(e) {
    if (PL.brand !== 'all' && e.brand_id !== PL.brand) return false;
    if (f.type && e.event_type_name !== f.type) return false;
    if (f.rag  && e.rag_status !== f.rag) return false;
    if (f.assigned && e.assigned_to !== f.assigned) return false;
    if (f.search) {
      var s = f.search.toLowerCase();
      if ((e.title || '').toLowerCase().indexOf(s) === -1 &&
          (e.notes || '').toLowerCase().indexOf(s) === -1) return false;
    }
    return true;
  });
}

function plFilteredActivities() {
  var f = PL.filters;
  return PL.activities.filter(function(a) {
    if (PL.brand !== 'all' && a.brand_id !== PL.brand) return false;
    if (f.rag && a.rag_status !== f.rag) return false;
    if (f.assigned && a.assigned_to !== f.assigned) return false;
    if (f.search) {
      var s = f.search.toLowerCase();
      if ((a.title || '').toLowerCase().indexOf(s) === -1 &&
          (a.notes || '').toLowerCase().indexOf(s) === -1 &&
          (a.description || '').toLowerCase().indexOf(s) === -1) return false;
    }
    return true;
  });
}

/* ── Render events ── */
function plRenderEvents() {
  var body = document.getElementById('pl-events-body');
  var countEl = document.getElementById('pl-events-count');
  if (!body) return;

  if (!PL.sectionsOpen.events) { body.style.display = 'none'; return; }
  body.style.display = '';

  var events = plFilteredEvents();
  if (countEl) countEl.textContent = events.length ? '(' + events.length + ')' : '';

  if (!events.length) {
    body.innerHTML = '<div class="pl-empty"><div class="pl-empty-icon">📅</div><div class="pl-empty-title">No events found</div><div class="pl-empty-sub">Try adjusting the filters or add a new event.</div></div>';
    return;
  }

  // Group by brand
  var byBrand = {};
  events.forEach(function(e) {
    if (!byBrand[e.brand_id]) byBrand[e.brand_id] = [];
    byBrand[e.brand_id].push(e);
  });

  var html = '<div class="pl-events-grid">';
  events.forEach(function(e) {
    html += plEventCard(e);
  });
  html += '</div>';

  body.innerHTML = html;
}

function plEventCard(e) {
  var color = BRAND_COLORS[e.brand_id] || '#666';
  var rag = plRagPill(e.rag_status);
  var dates = plFormatDates(e.start_date, e.end_date);
  var budget = e.planned_budget ? '£' + Number(e.planned_budget).toLocaleString('en-GB') : '';
  var typeName = plGetTypeName(e.event_type_id);
  var siteName = plGetSiteName(e.site_id);
  var brandName = BRAND_NAMES[e.brand_id] || e.brand_id;

  return '<div class="pl-event-card" style="border-left-color:' + color + '" onclick="plOpenEventDetail(\'' + e.id + '\')">'
    + '<div class="pl-event-card-top">'
    + '<div>'
    + (typeName ? '<span class="ev-type-badge" style="background:' + (plGetTypeColor(e.event_type_id)||color) + ';margin-bottom:6px;display:inline-flex">' + plEsc(typeName) + '</span>' : '')
    + '<div class="pl-event-card-title">' + plEsc(e.title || '') + '</div>'
    + '</div>'
    + rag
    + '</div>'
    + '<div class="pl-event-card-meta">'
    + (dates ? '<span class="pl-event-card-meta-item">📅 ' + dates + '</span>' : '')
    + (siteName ? '<span class="pl-event-card-meta-item">📍 ' + plEsc(siteName) + '</span>' : '')
    + (budget ? '<span class="pl-event-card-meta-item">💷 ' + budget + '</span>' : '')
    + (e.assigned_to ? '<span class="pl-event-card-meta-item">👤 ' + plEsc(plGetTeamName(e.assigned_to)) + '</span>' : '')
    + '</div>'
    + (e.notes ? '<div style="font-size:11px;color:var(--ink-soft);margin-top:8px;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">' + plEsc(e.notes) + '</div>' : '')
    + '</div>';
}

/* ── Render activities ── */
function plRenderActivities() {
  var body = document.getElementById('pl-acts-body');
  var countEl = document.getElementById('pl-acts-count');
  if (!body) return;

  if (!PL.sectionsOpen.activities) { body.style.display = 'none'; return; }
  body.style.display = '';

  var acts = plFilteredActivities();
  if (countEl) countEl.textContent = acts.length ? '(' + acts.length + ')' : '';

  if (!acts.length) {
    body.innerHTML = '<div class="pl-empty"><div class="pl-empty-icon">📋</div><div class="pl-empty-title">No activities found</div><div class="pl-empty-sub">Activities for Q' + PL.quarter + ' ' + PL.year + ' will appear here.</div></div>';
    return;
  }

  // Group by brand → site
  var byBrandSite = {};
  acts.forEach(function(a) {
    var key = a.brand_id;
    if (!byBrandSite[key]) byBrandSite[key] = {};
    if (!byBrandSite[key][a.site_id]) byBrandSite[key][a.site_id] = [];
    byBrandSite[key][a.site_id].push(a);
  });

  var html = '';
  Object.keys(byBrandSite).sort().forEach(function(bid) {
    var color = BRAND_COLORS[bid] || '#666';
    var bname = BRAND_NAMES[bid] || bid;
    var siteMap = byBrandSite[bid];
    var totalActs = 0;
    Object.keys(siteMap).forEach(function(sid) { totalActs += siteMap[sid].length; });

    html += '<div class="pl-act-brand-block">'
      + '<div class="pl-act-brand-hdr" style="background:' + color + '">'
      + '<span class="pl-act-brand-name">' + plEsc(bname) + '</span>'
      + '<span class="pl-act-brand-site">' + Object.keys(siteMap).length + ' sites · ' + totalActs + ' activities</span>'
      + '</div>';

    Object.keys(siteMap).sort().forEach(function(sid) {
      var siteName = plGetSiteName(sid) || sid;
      var siteActs = siteMap[sid];
      var siteKey  = bid + '___' + sid;
      var isOpen   = PL.openActSite === siteKey;

      // Count RAG
      var ragCounts = {};
      siteActs.forEach(function(a) { ragCounts[a.rag_status] = (ragCounts[a.rag_status]||0)+1; });
      var ragSummary = Object.keys(ragCounts).map(function(r) {
        return '<span class="rag rag-' + plRagClass(r) + '" style="margin-right:3px">' + r + ' ' + ragCounts[r] + '</span>';
      }).join('');

      html += '<div class="pl-act-site-block">'
        + '<div class="pl-act-site-hdr" onclick="plToggleActSite(\'' + siteKey + '\')">'
        + '<span class="pl-act-site-name">📍 ' + plEsc(siteName) + '</span>'
        + '<span style="display:flex;align-items:center;gap:6px">' + ragSummary + '<span class="pl-act-site-toggle">' + (isOpen ? '▲' : '▼') + '</span></span>'
        + '</div>';

      if (isOpen) {
        html += '<div class="pl-act-cats">';
        siteActs.forEach(function(a) {
          html += '<div class="pl-act-cat" onclick="plOpenActDetail(\'' + a.id + '\')">'
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">'
            + '<span class="pl-act-cat-name">' + plEsc(a.title || '') + '</span>'
            + plRagPill(a.rag_status)
            + '</div>'
            + '<div class="pl-act-cat-budget">'
            + (a.total_budget ? '£' + Number(a.total_budget).toLocaleString('en-GB') + ' budgeted' : 'Budget TBC')
            + (a.assigned_to ? ' · ' + plEsc(plGetTeamName(a.assigned_to)) : '')
            + '</div>'
            + '</div>';
        });
        html += '</div>';
      }

      html += '</div>'; // /.pl-act-site-block
    });

    html += '</div>'; // /.pl-act-brand-block
  });

  body.innerHTML = html;
}

/* ── Toggle activity site ── */
function plToggleActSite(key) {
  PL.openActSite = PL.openActSite === key ? null : key;
  plRenderActivities();
}

/* ── Section toggle ── */
function plToggleSection(section) {
  PL.sectionsOpen[section] = !PL.sectionsOpen[section];
  if (section === 'events') plRenderEvents();
  else plRenderActivities();
}

/* ── Filters ── */
function plApplyFilters() {
  PL.filters.type     = (document.getElementById('pl-f-type')     || {}).value || '';
  PL.filters.rag      = (document.getElementById('pl-f-rag')      || {}).value || '';
  PL.filters.assigned = (document.getElementById('pl-f-assigned') || {}).value || '';
  PL.filters.search   = (document.getElementById('pl-f-search')   || {}).value || '';
  plUpdateKPIs();
  plRenderEvents();
  plRenderActivities();
}

function plClearFilters() {
  ['pl-f-type','pl-f-rag','pl-f-assigned','pl-f-search'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = '';
  });
  PL.filters = { type:'', rag:'', assigned:'', search:'' };
  plUpdateKPIs();
  plRenderEvents();
  plRenderActivities();
}

/* ── Brand selector ── */
function plSetBrand(brand, btn) {
  PL.brand = brand;
  PL.openActSite = null;
  document.querySelectorAll('.pl-brand-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  plRenderEvents();
  plRenderActivities();
  plUpdateSubtitle();
  plUpdateKPIs();
}

/* ── Quarter selector ── */
async function plSetQuarter(q, btn) {
  PL.quarter = q;
  PL.openActSite = null;
  document.querySelectorAll('.pl-q-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  // Show loading
  var eb = document.getElementById('pl-events-body');
  var ab = document.getElementById('pl-acts-body');
  if (eb) eb.innerHTML = '<div class="pl-loading"><div class="pl-spinner"></div></div>';
  if (ab) ab.innerHTML = '<div class="pl-loading"><div class="pl-spinner"></div></div>';
  await plLoadData();
  plRender();
}

/* ── Event detail modal ── */
function plOpenEventDetail(id) {
  var e = PL.events.find(function(ev) { return ev.id === id; });
  if (!e) return;

  var typeName  = plGetTypeName(e.event_type_id);
  var siteName  = plGetSiteName(e.site_id);
  var color     = BRAND_COLORS[e.brand_id] || '#666';
  var brandName = BRAND_NAMES[e.brand_id] || e.brand_id;

  var fields = [
    ['Brand', brandName],
    ['Site', siteName],
    ['Event type', typeName],
    ['Dates', plFormatDates(e.start_date, e.end_date)],
    ['Status', e.status],
    ['RAG', e.rag_status],
    ['Stage', e.stage],
    ['Planned budget', e.planned_budget ? '£' + Number(e.planned_budget).toLocaleString('en-GB') : '—'],
    ['Actual spend', e.actual_spend ? '£' + Number(e.actual_spend).toLocaleString('en-GB') : '—'],
    ['Brand support', e.coop_funded && e.coop_amount ? '£' + Number(e.coop_amount).toLocaleString('en-GB') : (e.coop_funded ? 'Yes' : '—')],
    ['Footfall', e.expected_footfall ? Number(e.expected_footfall).toLocaleString('en-GB') + ' expected' : '—'],
    ['Assigned to', plGetTeamName(e.assigned_to)],
    ['Secondary owner', plGetTeamName(e.secondary_owner)],
    ['Action plan needed', e.action_plan_needed ? '🔲 Yes — needs building' : 'No'],
    ['Quarter tags', (e.quarter_tags || []).join(', ') || '—'],
    ['Location', e.location || '—'],
    ['Notes', e.notes || '—'],
  ];

  var fieldsHtml = '<div class="pl-modal-grid2">';
  fields.forEach(function(f) {
    if (!f[1] || f[1] === '—') return;
    var isWide = f[0] === 'Notes' || f[0] === 'Quarter tags' || f[0] === 'Action plan needed';
    fieldsHtml += '<div class="pl-act-detail-row' + (isWide ? ' pl-modal-field--full' : '') + '" style="' + (isWide ? 'grid-column:1/-1' : '') + '">'
      + '<span class="pl-act-detail-label">' + plEsc(f[0]) + '</span>'
      + '<span class="pl-act-detail-val">' + plEsc(String(f[1])) + '</span>'
      + '</div>';
  });
  fieldsHtml += '</div>';

  var adminBtns = PL.isAdmin
    ? '<button class="btn btn-primary" onclick="plOpenEventModal(\'' + e.id + '\')">Edit event</button>'
    : '';

  var html = '<div class="pl-modal-overlay" onclick="if(event.target===this)plCloseModal()">'
    + '<div class="pl-modal">'
    + '<div class="pl-modal-hdr" style="border-top:4px solid ' + color + '">'
    + '<div>'
    + (typeName ? '<div style="margin-bottom:6px"><span class="ev-type-badge" style="background:' + (plGetTypeColor(e.event_type_id)||color) + '">' + plEsc(typeName) + '</span></div>' : '')
    + '<div class="pl-modal-title">' + plEsc(e.title || '') + '</div>'
    + '<div style="font-size:12px;color:var(--ink-soft);margin-top:4px">' + plEsc(brandName) + (siteName ? ' · ' + plEsc(siteName) : '') + '</div>'
    + '</div>'
    + '<div style="display:flex;align-items:flex-start;gap:8px">'
    + plRagPill(e.rag_status)
    + '<button class="pl-modal-close" onclick="plCloseModal()">×</button>'
    + '</div>'
    + '</div>'
    + '<div class="pl-modal-body">'
    + '<div class="pl-act-detail">' + fieldsHtml + '</div>'
    + '</div>'
    + '<div class="pl-modal-footer">'
    + adminBtns
    + '<button class="btn" onclick="plCloseModal()">Close</button>'
    + '</div>'
    + '</div></div>';

  var root = document.getElementById('pl-modal-root');
  if (root) root.innerHTML = html;
}

/* ── Activity detail modal ── */
function plOpenActDetail(id) {
  var a = PL.activities.find(function(act) { return act.id === id; });
  if (!a) return;

  var siteName  = plGetSiteName(a.site_id);
  var brandName = BRAND_NAMES[a.brand_id] || a.brand_id;
  var color     = BRAND_COLORS[a.brand_id] || '#666';

  var fields = [
    ['Brand', brandName],
    ['Site', siteName],
    ['Category', a.title],
    ['Quarter', 'Q' + a.quarter + ' ' + a.year],
    ['RAG status', a.rag_status],
    ['Stage', a.stage],
    ['Budget', a.total_budget ? '£' + Number(a.total_budget).toLocaleString('en-GB') : 'Not set'],
    ['Actual spend', a.total_actual ? '£' + Number(a.total_actual).toLocaleString('en-GB') : '—'],
    ['Assigned to', plGetTeamName(a.assigned_to)],
    ['Description', a.description || '—'],
    ['Notes', a.notes || '—'],
  ];

  var fieldsHtml = '';
  fields.forEach(function(f) {
    if (!f[1] || f[1] === '—') return;
    fieldsHtml += '<div class="pl-act-detail-row">'
      + '<span class="pl-act-detail-label">' + plEsc(f[0]) + '</span>'
      + '<span class="pl-act-detail-val">' + plEsc(String(f[1])) + '</span>'
      + '</div>';
  });

  var adminBtns = PL.isAdmin
    ? '<button class="btn btn-primary" onclick="plOpenActEditModal(\'' + a.id + '\')">Edit activity</button>'
    : '';

  var html = '<div class="pl-modal-overlay" onclick="if(event.target===this)plCloseModal()">'
    + '<div class="pl-modal">'
    + '<div class="pl-modal-hdr" style="border-top:4px solid ' + color + '">'
    + '<div>'
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:5px">QUARTERLY ACTIVITY</div>'
    + '<div class="pl-modal-title">' + plEsc(a.title || '') + '</div>'
    + '<div style="font-size:12px;color:var(--ink-soft);margin-top:4px">' + plEsc(brandName) + ' · ' + plEsc(siteName) + ' · Q' + a.quarter + ' ' + a.year + '</div>'
    + '</div>'
    + '<div style="display:flex;align-items:flex-start;gap:8px">'
    + plRagPill(a.rag_status)
    + '<button class="pl-modal-close" onclick="plCloseModal()">×</button>'
    + '</div>'
    + '</div>'
    + '<div class="pl-modal-body">'
    + '<div class="pl-act-detail">' + fieldsHtml + '</div>'
    + '</div>'
    + '<div class="pl-modal-footer">'
    + adminBtns
    + '<button class="btn" onclick="plCloseModal()">Close</button>'
    + '</div>'
    + '</div></div>';

  var root = document.getElementById('pl-modal-root');
  if (root) root.innerHTML = html;
}

/* ── Edit/Add event modal ── */
function plOpenEventModal(id) {
  var e = id ? PL.events.find(function(ev) { return ev.id === id; }) : null;
  var isNew = !e;

  var typeOptions = PL.eventTypes.map(function(t) {
    var sel = (e && e.event_type_id === t.id) ? ' selected' : '';
    return '<option value="' + t.id + '"' + sel + '>' + plEsc(t.name) + '</option>';
  }).join('');

  var brandOptions = Object.keys(BRAND_NAMES).map(function(bid) {
    var sel = (e && e.brand_id === bid) ? ' selected' : '';
    return '<option value="' + bid + '"' + sel + '>' + plEsc(BRAND_NAMES[bid]) + '</option>';
  }).join('');

  var siteOptions = PL.sites.map(function(s) {
    var sel = (e && e.site_id === s.site_id) ? ' selected' : '';
    return '<option value="' + s.site_id + '"' + sel + '>' + plEsc(s.site_name) + '</option>';
  }).join('');

  var teamOptions = PL.team.map(function(m) {
    var sel = (e && e.assigned_to === m.id) ? ' selected' : '';
    return '<option value="' + m.id + '"' + sel + '>' + plEsc(m.name) + '</option>';
  }).join('');

  var ragOptions = ['Not Started','In Progress','At Risk','On Track','Complete','TBC','Cancelled'].map(function(r) {
    var sel = (e && e.rag_status === r) ? ' selected' : (!e && r === 'Not Started') ? ' selected' : '';
    return '<option value="' + r + '"' + sel + '>' + r + '</option>';
  }).join('');

  var stageOptions = ['Not Started','Planning','Briefing','In Progress','Awaiting Input','Complete','Cancelled'].map(function(s) {
    var sel = (e && e.stage === s) ? ' selected' : (!e && s === 'Not Started') ? ' selected' : '';
    return '<option value="' + s + '"' + sel + '>' + s + '</option>';
  }).join('');

  var qtags = e && e.quarter_tags ? e.quarter_tags.join(', ') : 'Q' + PL.quarter + '-' + PL.year;

  var html = '<div class="pl-modal-overlay" onclick="if(event.target===this)plCloseModal()">'
    + '<div class="pl-modal">'
    + '<div class="pl-modal-hdr">'
    + '<div class="pl-modal-title">' + (isNew ? 'Add event' : 'Edit event') + '</div>'
    + '<button class="pl-modal-close" onclick="plCloseModal()">×</button>'
    + '</div>'
    + '<div class="pl-modal-body">'
    + '<div class="pl-modal-field"><label>Event title</label><input id="ef-title" type="text" value="' + plEsc(e ? e.title || '' : '') + '" placeholder="e.g. Audi VIP Event — Crewe"></div>'
    + '<div class="pl-modal-grid2">'
    + '<div class="pl-modal-field"><label>Brand</label><select id="ef-brand"><option value="">Select brand…</option>' + brandOptions + '</select></div>'
    + '<div class="pl-modal-field"><label>Site</label><select id="ef-site"><option value="">Select site…</option>' + siteOptions + '</select></div>'
    + '<div class="pl-modal-field"><label>Event type</label><select id="ef-type"><option value="">Select type…</option>' + typeOptions + '</select></div>'
    + '<div class="pl-modal-field"><label>Assigned to</label><select id="ef-assigned"><option value="">Unassigned</option>' + teamOptions + '</select></div>'
    + '<div class="pl-modal-field"><label>Start date</label><input id="ef-start" type="date" value="' + plEsc(e ? e.start_date || '' : '') + '"></div>'
    + '<div class="pl-modal-field"><label>End date</label><input id="ef-end" type="date" value="' + plEsc(e ? e.end_date || '' : '') + '"></div>'
    + '<div class="pl-modal-field"><label>RAG status</label><select id="ef-rag">' + ragOptions + '</select></div>'
    + '<div class="pl-modal-field"><label>Stage</label><select id="ef-stage">' + stageOptions + '</select></div>'
    + '<div class="pl-modal-field"><label>Planned budget (£)</label><input id="ef-budget" type="number" min="0" value="' + plEsc(e ? String(e.planned_budget || '') : '') + '" placeholder="0"></div>'
    + '<div class="pl-modal-field"><label>Actual spend (£)</label><input id="ef-actual" type="number" min="0" value="' + plEsc(e ? String(e.actual_spend || '') : '') + '" placeholder="0"></div>'
    + '<div class="pl-modal-field"><label>Brand support (£)</label><input id="ef-coop" type="number" min="0" value="' + plEsc(e ? String(e.coop_amount || '') : '') + '" placeholder="0"></div>'
    + '<div class="pl-modal-field"><label>Expected footfall</label><input id="ef-footfall" type="number" min="0" value="' + plEsc(e ? String(e.expected_footfall || '') : '') + '" placeholder="0"></div>'
    + '</div>'
    + '<div class="pl-modal-field"><label>Quarter tags (comma-separated, e.g. Q3-2026)</label><input id="ef-qtags" type="text" value="' + plEsc(qtags) + '"></div>'
    + '<div class="pl-modal-field"><label>Notes</label><textarea id="ef-notes">' + plEsc(e ? e.notes || '' : '') + '</textarea></div>'
    + '<div id="ef-err" style="display:none;background:#FEF2F2;border:1px solid #FECACA;border-radius:4px;padding:9px 12px;font-family:var(--font-b);font-size:12px;color:#DC2626;margin-top:8px"></div>'
    + '</div>'
    + '<div class="pl-modal-footer">'
    + '<button class="btn btn-primary" onclick="plSaveEvent(\'' + (id||'') + '\')" id="ef-save-btn">' + (isNew ? 'Add event' : 'Save changes') + '</button>'
    + (id && PL.isAdmin ? '<button class="btn" style="margin-left:auto;color:#DC2626;border-color:#FECACA" onclick="plDeleteEvent(\'' + id + '\')">Delete</button>' : '')
    + '<button class="btn" onclick="plCloseModal()">Cancel</button>'
    + '</div>'
    + '</div></div>';

  var root = document.getElementById('pl-modal-root');
  if (root) root.innerHTML = html;
}

/* ── Save event ── */
async function plSaveEvent(id) {
  var title    = (document.getElementById('ef-title')    || {}).value || '';
  var brand    = (document.getElementById('ef-brand')    || {}).value || '';
  var site     = (document.getElementById('ef-site')     || {}).value || '';
  var typeId   = (document.getElementById('ef-type')     || {}).value || null;
  var assigned = (document.getElementById('ef-assigned') || {}).value || null;
  var start    = (document.getElementById('ef-start')    || {}).value || null;
  var end      = (document.getElementById('ef-end')      || {}).value || null;
  var rag      = (document.getElementById('ef-rag')      || {}).value || 'Not Started';
  var stage    = (document.getElementById('ef-stage')    || {}).value || 'Not Started';
  var budget   = parseFloat((document.getElementById('ef-budget')   || {}).value) || null;
  var actual   = parseFloat((document.getElementById('ef-actual')   || {}).value) || null;
  var coop     = parseFloat((document.getElementById('ef-coop')     || {}).value) || null;
  var footfall = parseInt((document.getElementById('ef-footfall')   || {}).value)  || null;
  var qtagsRaw = (document.getElementById('ef-qtags')   || {}).value || '';
  var notes    = (document.getElementById('ef-notes')   || {}).value || null;
  var errEl    = document.getElementById('ef-err');
  var saveBtn  = document.getElementById('ef-save-btn');

  if (errEl) errEl.style.display = 'none';
  if (!title.trim()) { if (errEl) { errEl.textContent='Please enter an event title.'; errEl.style.display='block'; } return; }
  if (!brand)        { if (errEl) { errEl.textContent='Please select a brand.'; errEl.style.display='block'; } return; }
  if (!site)         { if (errEl) { errEl.textContent='Please select a site.'; errEl.style.display='block'; } return; }
  if (!start)        { if (errEl) { errEl.textContent='Please set a start date.'; errEl.style.display='block'; } return; }

  var qtags = qtagsRaw.split(',').map(function(t) { return t.trim(); }).filter(Boolean);

  var payload = {
    title:            title.trim(),
    brand_id:         brand,
    site_id:          site,
    event_type_id:    typeId || null,
    assigned_to:      assigned || null,
    start_date:       start,
    end_date:         end || null,
    rag_status:       rag,
    stage:            stage,
    planned_budget:   budget,
    actual_spend:     actual,
    coop_funded:      !!coop,
    coop_amount:      coop,
    expected_footfall:footfall,
    quarter_tags:     qtags,
    notes:            notes,
    updated_at:       new Date().toISOString()
  };

  if (saveBtn) { saveBtn.textContent = 'Saving…'; saveBtn.disabled = true; }

  try {
    var method = id ? 'PATCH' : 'POST';
    var url    = SUPA_PL + '/events' + (id ? '?id=eq.' + id : '');
    var r = await fetch(url, {
      method: method,
      headers: getAuthHeaders({ 'Content-Type':'application/json', 'Prefer':'return=minimal' }),
      body: JSON.stringify(id ? payload : [payload])
    });
    if (!r.ok) throw new Error(await r.text());
    plCloseModal();
    plShowToast((id ? 'Event updated' : 'Event added') + ' ✓', '#059669');
    await plLoadData();
    plBuildSidebar();  // preserves PL.brand active state
    plUpdateKPIs();
    plRenderEvents();
    plRenderActivities();
    plUpdateSubtitle();
  } catch(e) {
    if (errEl) { errEl.textContent = 'Save failed: ' + e.message; errEl.style.display = 'block'; }
    if (saveBtn) { saveBtn.textContent = 'Save changes'; saveBtn.disabled = false; }
  }
}

/* ── Delete event ── */
async function plDeleteEvent(id) {
  if (!confirm('Delete this event? This cannot be undone.')) return;
  try {
    var r = await fetch(SUPA_PL + '/events?id=eq.' + id, { method:'DELETE', headers: getAuthHeaders() });
    if (!r.ok) throw new Error(await r.text());
    plCloseModal();
    plShowToast('Event deleted', '#DC2626');
    await plLoadData();
    plBuildSidebar();  // preserves PL.brand active state
    plUpdateKPIs();
    plRenderEvents();
    plRenderActivities();
  } catch(e) { plShowToast('Delete failed: ' + e.message, '#DC2626'); }
}

/* ── Activity edit modal ── */
function plOpenActEditModal(id) {
  var a = PL.activities.find(function(act) { return act.id === id; });
  if (!a) return;

  var teamOptions = PL.team.map(function(m) {
    var sel = a.assigned_to === m.id ? ' selected' : '';
    return '<option value="' + m.id + '"' + sel + '>' + plEsc(m.name) + '</option>';
  }).join('');

  var ragOptions = ['Not Started','In Progress','At Risk','On Track','Complete','TBC','Cancelled'].map(function(r) {
    return '<option value="' + r + '"' + (a.rag_status === r ? ' selected' : '') + '>' + r + '</option>';
  }).join('');

  var stageOptions = ['Not Started','Planning','In Progress','Awaiting Input','Complete','Cancelled'].map(function(s) {
    return '<option value="' + s + '"' + (a.stage === s ? ' selected' : '') + '>' + s + '</option>';
  }).join('');

  var html = '<div class="pl-modal-overlay" onclick="if(event.target===this)plCloseModal()">'
    + '<div class="pl-modal">'
    + '<div class="pl-modal-hdr">'
    + '<div>'
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:4px">EDIT ACTIVITY</div>'
    + '<div class="pl-modal-title">' + plEsc(a.title || '') + '</div>'
    + '<div style="font-size:12px;color:var(--ink-soft);margin-top:3px">' + plEsc(plGetSiteName(a.site_id)) + ' · Q' + a.quarter + ' ' + a.year + '</div>'
    + '</div>'
    + '<button class="pl-modal-close" onclick="plCloseModal()">×</button>'
    + '</div>'
    + '<div class="pl-modal-body">'
    + '<div class="pl-modal-grid2">'
    + '<div class="pl-modal-field"><label>RAG status</label><select id="ae-rag">' + ragOptions + '</select></div>'
    + '<div class="pl-modal-field"><label>Stage</label><select id="ae-stage">' + stageOptions + '</select></div>'
    + '<div class="pl-modal-field"><label>Assigned to</label><select id="ae-assigned"><option value="">Unassigned</option>' + teamOptions + '</select></div>'
    + '<div class="pl-modal-field"><label>Total budget (£)</label><input id="ae-budget" type="number" min="0" value="' + plEsc(String(a.total_budget||'')) + '" placeholder="0"></div>'
    + '<div class="pl-modal-field"><label>Actual spend (£)</label><input id="ae-actual" type="number" min="0" value="' + plEsc(String(a.total_actual||'')) + '" placeholder="0"></div>'
    + '</div>'
    + '<div class="pl-modal-field"><label>Description</label><input id="ae-desc" type="text" value="' + plEsc(a.description||'') + '"></div>'
    + '<div class="pl-modal-field"><label>Notes</label><textarea id="ae-notes">' + plEsc(a.notes||'') + '</textarea></div>'
    + '<div id="ae-err" style="display:none;background:#FEF2F2;border:1px solid #FECACA;border-radius:4px;padding:9px 12px;font-family:var(--font-b);font-size:12px;color:#DC2626;margin-top:8px"></div>'
    + '</div>'
    + '<div class="pl-modal-footer">'
    + '<button class="btn btn-primary" onclick="plSaveActivity(\'' + a.id + '\')" id="ae-save-btn">Save changes</button>'
    + '<button class="btn" onclick="plCloseModal()">Cancel</button>'
    + '</div>'
    + '</div></div>';

  var root = document.getElementById('pl-modal-root');
  if (root) root.innerHTML = html;
}

/* ── Save activity ── */
async function plSaveActivity(id) {
  var rag      = (document.getElementById('ae-rag')      || {}).value || 'Not Started';
  var stage    = (document.getElementById('ae-stage')    || {}).value || 'Not Started';
  var assigned = (document.getElementById('ae-assigned') || {}).value || null;
  var budget   = parseFloat((document.getElementById('ae-budget') || {}).value) || null;
  var actual   = parseFloat((document.getElementById('ae-actual') || {}).value) || null;
  var desc     = (document.getElementById('ae-desc')    || {}).value || null;
  var notes    = (document.getElementById('ae-notes')   || {}).value || null;
  var errEl    = document.getElementById('ae-err');
  var saveBtn  = document.getElementById('ae-save-btn');

  var payload = {
    rag_status:   rag,
    stage:        stage,
    assigned_to:  assigned,
    total_budget: budget,
    total_actual: actual,
    description:  desc,
    notes:        notes,
    updated_at:   new Date().toISOString()
  };

  if (saveBtn) { saveBtn.textContent = 'Saving…'; saveBtn.disabled = true; }
  try {
    var r = await fetch(SUPA_PL + '/activities?id=eq.' + id, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type':'application/json', 'Prefer':'return=minimal' }),
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(await r.text());
    plCloseModal();
    plShowToast('Activity updated ✓', '#059669');
    await plLoadData();
    plRenderActivities();
    plUpdateKPIs();
  } catch(e) {
    if (errEl) { errEl.textContent = 'Save failed: ' + e.message; errEl.style.display = 'block'; }
    if (saveBtn) { saveBtn.textContent = 'Save changes'; saveBtn.disabled = false; }
  }
}

/* ── Close modal ── */
function plCloseModal() {
  var root = document.getElementById('pl-modal-root');
  if (root) root.innerHTML = '';
}

/* ── Helpers ── */
function plRagPill(rag) {
  var cls = plRagClass(rag);
  return '<span class="rag rag-' + cls + '">' + plEsc(rag || '—') + '</span>';
}

function plRagClass(rag) {
  var map = {
    'Complete':'complete', 'On Track':'on-track', 'In Progress':'in-progress',
    'At Risk':'at-risk', 'Not Started':'not-started', 'TBC':'tbc', 'Cancelled':'cancelled'
  };
  return map[rag] || 'not-started';
}

function plFormatDates(start, end) {
  if (!start) return '';
  var s = new Date(start);
  var opts = { day:'numeric', month:'short', year:'numeric' };
  var sStr = s.toLocaleDateString('en-GB', opts);
  if (!end || end === start) return sStr;
  var e = new Date(end);
  var eStr = e.toLocaleDateString('en-GB', opts);
  return sStr + ' – ' + eStr;
}

function plGetTypeName(typeId) {
  if (!typeId) return '';
  var t = PL.eventTypes.find(function(et) { return et.id === typeId; });
  return t ? t.name : '';
}

function plGetTypeColor(typeId) {
  if (!typeId) return '';
  var t = PL.eventTypes.find(function(et) { return et.id === typeId; });
  return t ? t.color : '';
}

function plGetSiteName(siteId) {
  if (!siteId) return '';
  var s = PL.sites.find(function(st) { return st.site_id === siteId; });
  return s ? s.site_name : siteId;
}

function plGetTeamName(id) {
  if (!id) return '';
  var m = PL.team.find(function(t) { return t.id === id; });
  return m ? m.name : id;
}

function plEsc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function plShowToast(msg, bg) {
  var t = document.getElementById('pl-toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = bg || '#059669';
  t.style.display = 'block';
  setTimeout(function() { t.style.display = 'none'; }, 3500);
}
