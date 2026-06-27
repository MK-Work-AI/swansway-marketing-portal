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
  openActBrand: null  // currently expanded brand in activities
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
  var body    = document.getElementById('pl-acts-body');
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

  // Group by brand
  var byBrand = {};
  acts.forEach(function(a) {
    if (!byBrand[a.brand_id]) byBrand[a.brand_id] = [];
    byBrand[a.brand_id].push(a);
  });

  var html = '';
  Object.keys(byBrand).sort().forEach(function(bid) {
    var color  = BRAND_COLORS[bid] || '#666';
    var bname  = BRAND_NAMES[bid]  || bid;
    var bActs  = byBrand[bid];
    var isOpen = PL.openActBrand === bid;

    // RAG summary
    var ragCounts = {};
    bActs.forEach(function(a) { ragCounts[a.rag_status] = (ragCounts[a.rag_status] || 0) + 1; });

    // Category summary — worst RAG per category
    var byCategory = {};
    var ragOrder   = ['Not Started','At Risk','In Progress','TBC','On Track','Complete','Cancelled'];
    bActs.forEach(function(a) {
      if (!byCategory[a.title]) byCategory[a.title] = { acts:[], worstRag:'Complete' };
      byCategory[a.title].acts.push(a);
    });
    Object.keys(byCategory).forEach(function(cat) {
      var worst = 'Complete';
      byCategory[cat].acts.forEach(function(a) {
        if (ragOrder.indexOf(a.rag_status) < ragOrder.indexOf(worst)) worst = a.rag_status;
      });
      byCategory[cat].worstRag = worst;
    });

    // RAG pills for header
    var ragSummary = '';
    ['At Risk','Not Started','In Progress','On Track','Complete'].forEach(function(r) {
      if (ragCounts[r]) ragSummary += '<span class="rag rag-' + plRagClass(r) + '" style="margin-right:3px">' + r + ' ' + ragCounts[r] + '</span>';
    });

    html += '<div style="margin-bottom:8px;border:1px solid var(--border);border-radius:4px;overflow:hidden">'
      + '<div class="pl-act-brand-hdr" data-bid="' + plEsc(bid) + '" style="display:flex;align-items:center;justify-content:space-between;padding:11px 16px;background:' + color + ';cursor:pointer">'
      + '<div style="display:flex;align-items:center;gap:10px">'
      + '<span style="font-family:var(--font-d);font-size:14px;font-weight:700;color:#fff">' + plEsc(bname) + '</span>'
      + '<span style="font-size:11px;color:rgba(255,255,255,0.65)">' + bActs.length + ' activities · ' + Object.keys(byCategory).length + ' categories</span>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:6px">'
      + ragSummary
      + '<span style="font-size:11px;color:rgba(255,255,255,0.7);margin-left:4px">' + (isOpen ? '▲' : '▼') + '</span>'
      + '</div>'
      + '</div>';

    if (isOpen) {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1px;background:var(--border)">';
      Object.keys(byCategory).sort().forEach(function(catName) {
        var cat       = byCategory[catName];
        var siteCount = cat.acts.length;
        var rag       = cat.worstRag;
        var preview   = '';
        cat.acts.forEach(function(a) { if (!preview && a.description) preview = a.description; });

        html += '<div class="pl-act-cat pl-act-cat-clickable" data-bid="' + plEsc(bid) + '" data-cat="' + plEsc(catName) + '">'
          + '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">'
          + '<span class="pl-act-cat-name">' + plEsc(catName) + '</span>'
          + plRagPill(rag)
          + '</div>'
          + '<div class="pl-act-cat-budget">' + siteCount + ' site' + (siteCount !== 1 ? 's' : '')
          + (preview ? ' · ' + plEsc(preview.substring(0, 50)) + (preview.length > 50 ? '…' : '') : '')
          + '</div>'
          + '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
  });

  body.innerHTML = html;

  // Bind click events using data attributes — avoids all escaping issues
  body.querySelectorAll('.pl-act-brand-hdr').forEach(function(el) {
    el.addEventListener('click', function() {
      plToggleActBrand(this.getAttribute('data-bid'));
    });
  });
  body.querySelectorAll('.pl-act-cat-clickable').forEach(function(el) {
    el.addEventListener('click', function() {
      plOpenActCategoryModal(this.getAttribute('data-bid'), this.getAttribute('data-cat'));
    });
  });
}

/* ── Toggle activity brand ── */
function plToggleActBrand(bid) {
  PL.openActBrand = PL.openActBrand === bid ? null : bid;
  plRenderActivities();
}

/* ── Category modal — shows all sites for a brand+category ── */
function plOpenActCategoryModal(bid, catName) {
  var color = BRAND_COLORS[bid] || '#666';
  var bname = BRAND_NAMES[bid]  || bid;

  // Find the single brand-level activity for this brand + category
  var act = PL.activities.find(function(a) {
    return a.brand_id === bid && a.title === catName;
  });
  if (!act) return;

  var assigned = plGetTeamName(act.assigned_to);

  // Q3 months for this quarter
  var qMonths = plGetQuarterMonths(PL.quarter);
  var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Get sites for this brand
  var brandSites = PL.sites.filter(function(s) { return s.brand_id === bid; });

  // Build budget allocation table header
  var thStyle = 'padding:7px 10px;font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-faint);text-align:right;white-space:nowrap';
  var th1Style = 'padding:7px 10px;font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-faint);text-align:left;min-width:140px';

  var budgetTableHdr = '<tr style="background:var(--surface);border-bottom:1px solid var(--border)">'
    + '<th style="' + th1Style + '">Site</th>'
    + '<th style="' + th1Style + '">Channel</th>';
  qMonths.forEach(function(m) {
    budgetTableHdr += '<th style="' + thStyle + '">' + monthNames[m-1] + ' avail.</th>'
      + '<th style="' + thStyle + '">' + monthNames[m-1] + ' alloc.</th>';
  });
  budgetTableHdr += '<th style="' + thStyle + '">Total alloc.</th></tr>';

  // Build rows: site_budget_lines available + activity_budget_lines allocated
  // We load these async — show loading state first, populate after
  var budgetSectionHtml = '<div id="pl-budget-alloc-wrap" style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:12px">'
    + '<thead>' + budgetTableHdr + '</thead>'
    + '<tbody id="pl-budget-alloc-body">'
    + '<tr><td colspan="' + (2 + qMonths.length * 2 + 1) + '" style="padding:20px;text-align:center;color:var(--ink-faint)">Loading budget data…</td></tr>'
    + '</tbody></table></div>'
    + (PL.isAdmin ? '<div style="padding:12px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-primary" id="pl-save-alloc-btn">Save allocations</button></div>' : '');

  var teamOptions = PL.team.map(function(m) {
    return '<option value="' + m.id + '"' + (act.assigned_to === m.id ? ' selected' : '') + '>' + plEsc(m.name) + '</option>';
  }).join('');

  var ragOptions = ['Not Started','In Progress','At Risk','On Track','Complete','TBC','Cancelled'].map(function(r) {
    return '<option value="' + r + '"' + (act.rag_status === r ? ' selected' : '') + '>' + r + '</option>';
  }).join('');

  var stageOptions = ['Not Started','Planning','In Progress','Awaiting Input','Complete','Cancelled'].map(function(s) {
    return '<option value="' + s + '"' + (act.stage === s ? ' selected' : '') + '>' + s + '</option>';
  }).join('');

  var html = '<div class="pl-modal-overlay" onclick="if(event.target===this)plCloseModal()">'
    + '<div class="pl-modal" style="max-width:960px">'
    + '<div class="pl-modal-hdr" style="border-top:4px solid ' + color + '">'
    + '<div>'
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-faint);margin-bottom:4px">' + plEsc(bname) + ' · Q' + PL.quarter + ' ' + PL.year + '</div>'
    + '<div class="pl-modal-title">' + plEsc(catName) + '</div>'
    + (act.description ? '<div style="font-size:12px;color:var(--ink-soft);margin-top:4px">' + plEsc(act.description) + '</div>' : '')
    + '</div>'
    + '<button class="pl-modal-close" onclick="plCloseModal()">×</button>'
    + '</div>'
    + '<div class="pl-modal-body" style="padding:0">'

    // Activity status row
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1px;background:var(--border)">'
    + '<div style="background:var(--white);padding:12px 16px">'
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-faint);margin-bottom:5px">Status</div>'
    + (PL.isAdmin
        ? '<select id="act-rag-sel" style="width:100%;padding:5px 8px;border:1.5px solid var(--border-med);border-radius:3px;font-family:var(--font-b);font-size:12px">' + ragOptions + '</select>'
        : plRagPill(act.rag_status))
    + '</div>'
    + '<div style="background:var(--white);padding:12px 16px">'
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-faint);margin-bottom:5px">Stage</div>'
    + (PL.isAdmin
        ? '<select id="act-stage-sel" style="width:100%;padding:5px 8px;border:1.5px solid var(--border-med);border-radius:3px;font-family:var(--font-b);font-size:12px">' + stageOptions + '</select>'
        : '<span style="font-family:var(--font-b);font-size:12px">' + plEsc(act.stage || '—') + '</span>')
    + '</div>'
    + '<div style="background:var(--white);padding:12px 16px">'
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-faint);margin-bottom:5px">Assigned to</div>'
    + (PL.isAdmin
        ? '<select id="act-assigned-sel" style="width:100%;padding:5px 8px;border:1.5px solid var(--border-med);border-radius:3px;font-family:var(--font-b);font-size:12px"><option value="">—</option>' + teamOptions + '</select>'
        : '<span style="font-family:var(--font-b);font-size:12px">' + plEsc(assigned) + '</span>')
    + '</div>'
    + '</div>'

    // Notes
    + (act.notes ? '<div style="padding:10px 16px;background:var(--surface);border-top:1px solid var(--border);font-size:12px;color:var(--ink-soft);font-style:italic">' + plEsc(act.notes) + '</div>' : '')

    // Budget allocation section header
    + '<div style="padding:10px 16px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);background:var(--surface);display:flex;align-items:center;justify-content:space-between">'
    + '<span style="font-family:var(--font-m);font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink)">Budget Allocation — by site & channel</span>'
    + '<span style="font-size:11px;color:var(--ink-faint)">Available from Site Budgets · Allocate per month below</span>'
    + '</div>'
    + budgetSectionHtml

    + '</div>'
    + '<div class="pl-modal-footer" id="pl-act-modal-footer">'
    + (PL.isAdmin ? '<button class="btn btn-primary" id="pl-save-act-status-btn" data-id="' + act.id + '">Save status</button>' : '')
    + '<button class="btn" onclick="plCloseModal()">Close</button>'
    + '</div>'
    + '</div></div>';

  var root = document.getElementById('pl-modal-root');
  if (!root) return;
  root.innerHTML = html;

  // Bind save status button
  var saveStatusBtn = document.getElementById('pl-save-act-status-btn');
  if (saveStatusBtn) {
    saveStatusBtn.addEventListener('click', function() {
      plSaveActStatus(this.getAttribute('data-id'));
    });
  }

  // Bind save allocation button
  var saveAllocBtn = document.getElementById('pl-save-alloc-btn');
  if (saveAllocBtn) {
    saveAllocBtn.addEventListener('click', function() {
      plSaveAllocations(act.id, bid, qMonths);
    });
  }

  // Load budget data async
  plLoadBudgetAlloc(act.id, bid, brandSites, qMonths);
}

/* ── Get months for a quarter ── */
function plGetQuarterMonths(q) {
  return { 1:[1,2,3], 2:[4,5,6], 3:[7,8,9], 4:[10,11,12] }[q] || [7,8,9];
}

/* ── Load budget allocation data ── */
async function plLoadBudgetAlloc(actId, bid, sites, months) {
  var tbody = document.getElementById('pl-budget-alloc-body');
  if (!tbody) return;

  try {
    var year = PL.year;
    var siteIds = sites.map(function(s) { return s.site_id; }).join(',');
    if (!siteIds) {
      tbody.innerHTML = '<tr><td colspan="20" style="padding:16px;text-align:center;color:var(--ink-faint)">No sites found for this brand.</td></tr>';
      return;
    }

    // Load site_budget_lines (available) and activity_budget_lines (allocated) in parallel
    var [sblRes, ablRes, channelsRes] = await Promise.all([
      fetch(SUPA_PL + '/site_budget_lines?site_id=in.(' + siteIds + ')&month=in.(' + months.join(',') + ')&year=eq.' + year + '&select=site_id,channel,month,planned,actual', { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/activity_budget_lines?activity_id=eq.' + actId + '&select=*', { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/activity_channels?active=eq.true&order=sort_order&select=id,name', { headers: getAuthHeaders() })
    ]);

    var sblData  = sblRes.ok  ? await sblRes.json()  : [];
    var ablData  = ablRes.ok  ? await ablRes.json()  : [];
    var channels = channelsRes.ok ? await channelsRes.json() : [];

    // Index site_budget_lines: sbl[site_id][channel][month] = planned
    var sbl = {};
    sblData.forEach(function(row) {
      if (!sbl[row.site_id]) sbl[row.site_id] = {};
      if (!sbl[row.site_id][row.channel]) sbl[row.site_id][row.channel] = {};
      sbl[row.site_id][row.channel][row.month] = { planned: row.planned || 0, actual: row.actual || 0 };
    });

    // Index activity_budget_lines: abl[site_id][channel_id][month] = { planned, actual, id }
    var abl = {};
    ablData.forEach(function(row) {
      if (!abl[row.site_id]) abl[row.site_id] = {};
      if (!abl[row.site_id][row.channel_id]) abl[row.site_id][row.channel_id] = {};
      abl[row.site_id][row.channel_id][row.month] = { planned: row.planned || 0, actual: row.actual || 0, id: row.id };
    });

    // Only show channels that have budget data for these sites, plus top channels
    var topChannelIds = ['paid-search','autotrader','paid-social','display','email','social-organic','mfr-coop','events-showroom','other-local','seo-content'];
    var relevantChannels = channels.filter(function(c) { return topChannelIds.indexOf(c.id) !== -1; });

    var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var tdNum = 'padding:6px 8px;font-family:var(--font-m);font-size:11px;text-align:right;color:var(--ink-soft)';
    var tdAvail = 'padding:6px 8px;font-family:var(--font-m);font-size:11px;text-align:right;color:var(--ink-faint)';
    var tdSite = 'padding:8px 10px;font-family:var(--font-b);font-size:11px;font-weight:600;color:var(--ink);white-space:nowrap';
    var tdChan = 'padding:8px 10px;font-family:var(--font-b);font-size:11px;color:var(--ink-soft);white-space:nowrap';

    var rows = '';
    sites.forEach(function(site) {
      var sid = site.site_id;
      var siteSbl = sbl[sid] || {};
      var siteAbl = abl[sid] || {};
      var siteRowCount = 0;

      relevantChannels.forEach(function(ch, ci) {
        var chanSbl = siteSbl[ch.name] || {};
        var chanAbl = siteAbl[ch.id]   || {};

        // Calculate totals
        var totalAvail = 0, totalAlloc = 0;
        months.forEach(function(m) {
          totalAvail += (chanSbl[m] ? chanSbl[m].planned : 0);
          totalAlloc += (chanAbl[m] ? chanAbl[m].planned : 0);
        });

        rows += '<tr style="border-bottom:1px solid var(--border)' + (ci === 0 ? ';border-top:2px solid var(--border-med)' : '') + '">'
          + (ci === 0 ? '<td rowspan="' + relevantChannels.length + '" style="' + tdSite + ';border-right:1px solid var(--border);vertical-align:top;padding-top:10px">' + plEsc(site.site_name) + '</td>' : '')
          + '<td style="' + tdChan + '">' + plEsc(ch.name) + '</td>';

        months.forEach(function(m) {
          var avail = chanSbl[m] ? chanSbl[m].planned : 0;
          var allocVal = chanAbl[m] ? chanAbl[m].planned : 0;
          var inputId = 'abl_' + sid + '_' + ch.id + '_' + m;

          rows += '<td style="' + tdAvail + '">' + (avail ? '£' + avail.toLocaleString('en-GB') : '—') + '</td>'
            + '<td style="padding:4px 6px;text-align:right">'
            + (PL.isAdmin
                ? '<input type="number" id="' + inputId + '" value="' + allocVal + '" min="0" style="width:72px;padding:3px 6px;border:1.5px solid var(--border-med);border-radius:3px;font-family:var(--font-m);font-size:11px;text-align:right" data-site="' + sid + '" data-channel="' + ch.id + '" data-month="' + m + '">'
                : '<span style="font-family:var(--font-m);font-size:11px">' + (allocVal ? '£' + allocVal.toLocaleString('en-GB') : '—') + '</span>')
            + '</td>';
        });

        rows += '<td style="' + tdNum + ';font-weight:700;color:' + (totalAlloc > totalAvail ? '#DC2626' : 'var(--ink)') + '">'
          + (totalAlloc ? '£' + totalAlloc.toLocaleString('en-GB') : '—') + '</td>'
          + '</tr>';
      });
    });

    tbody.innerHTML = rows || '<tr><td colspan="20" style="padding:16px;text-align:center;color:var(--ink-faint)">No budget data found. Set site budgets in Admin → Site Budgets first.</td></tr>';

  } catch(e) {
    var tbody2 = document.getElementById('pl-budget-alloc-body');
    if (tbody2) tbody2.innerHTML = '<tr><td colspan="20" style="padding:16px;text-align:center;color:#DC2626">Error loading budget data: ' + plEsc(e.message) + '</td></tr>';
  }
}

/* ── Save activity status (RAG/stage/assigned) ── */
async function plSaveActStatus(id) {
  var rag      = (document.getElementById('act-rag-sel')      || {}).value;
  var stage    = (document.getElementById('act-stage-sel')    || {}).value;
  var assigned = (document.getElementById('act-assigned-sel') || {}).value || null;
  var btn      = document.getElementById('pl-save-act-status-btn');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
  try {
    var r = await fetch(SUPA_PL + '/activities?id=eq.' + id, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type':'application/json', 'Prefer':'return=minimal' }),
      body: JSON.stringify({ rag_status: rag, stage: stage, assigned_to: assigned, updated_at: new Date().toISOString() })
    });
    if (!r.ok) throw new Error(await r.text());
    plShowToast('Status updated ✓', '#059669');
    await plLoadData();
    plRenderActivities();
    plUpdateKPIs();
  } catch(e) {
    plShowToast('Save failed: ' + e.message, '#DC2626');
  } finally {
    if (btn) { btn.textContent = 'Save status'; btn.disabled = false; }
  }
}

/* ── Save budget allocations ── */
async function plSaveAllocations(actId, bid, months) {
  var btn = document.getElementById('pl-save-alloc-btn');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }

  try {
    // Collect all input values
    var inputs = document.querySelectorAll('#pl-budget-alloc-body input[type="number"]');
    var upserts = [];

    inputs.forEach(function(inp) {
      var site    = inp.getAttribute('data-site');
      var channel = inp.getAttribute('data-channel');
      var month   = parseInt(inp.getAttribute('data-month'));
      var val     = parseFloat(inp.value) || 0;

      upserts.push({
        activity_id: actId,
        site_id:     site,
        channel_id:  channel,
        month:       month,
        year:        PL.year,
        planned:     val,
        actual:      0
      });
    });

    if (!upserts.length) { plShowToast('Nothing to save', '#6B7280'); return; }

    // Upsert all in one call
    var r = await fetch(SUPA_PL + '/activity_budget_lines', {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      }),
      body: JSON.stringify(upserts)
    });

    if (!r.ok) throw new Error(await r.text());
    plShowToast('Budget allocations saved ✓', '#059669');
  } catch(e) {
    plShowToast('Save failed: ' + e.message, '#DC2626');
  } finally {
    if (btn) { btn.textContent = 'Save allocations'; btn.disabled = false; }
  }
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
  PL.openActBrand = null;
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
  PL.openActBrand = null;
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
  if (root) {
    root.innerHTML = html;
    // Bind edit buttons
    root.querySelectorAll('.pl-edit-act-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        plCloseModal();
        plOpenActEditModal(this.getAttribute('data-id'));
      });
    });
  }
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
