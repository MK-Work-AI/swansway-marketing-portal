// planner.js v200 — Complete rebuild
// Swansway Marketing Portal — Events & Activity Planner

/* ══ Constants ══ */
var SUPA_PL = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
var PL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var PL_Q_MONTHS = { 1:[1,2,3], 2:[4,5,6], 3:[7,8,9], 4:[10,11,12] };

/* ══ State ══ */
var PL = {
  brand:        'audi',
  quarter:      3,
  year:         2026,
  events:       [],
  activities:   [],
  actTypes:     [],
  team:         [],
  sites:        [],
  eventTypes:   [],
  isAdmin:      false,
  panel:        null,   // currently open side panel: { type:'activity'|'event', id }
  calView:      false,  // calendar vs list for events
};

/* ══ Init ══ */
async function plInit() {
  await swEnsureUser();
  try {
    var sess = await SB.auth.getSession();
    if (sess.data.session) {
      var uid = sess.data.session.user.id;
      var r = await fetch(SUPA_PL + '/campaign_team?auth_user_id=eq.' + uid + '&select=portal_role', { headers: getAuthHeaders() });
      if (r.ok) {
        var rows = await r.json();
        if (rows && rows.length && ['admin','super_admin'].includes(rows[0].portal_role)) PL.isAdmin = true;
      }
    }
  } catch(e) {}

  await plLoadMeta();
  plRenderBrandBar();
  plSetBrand('audi');
}

async function plLoadMeta() {
  try {
    var [typesR, teamR, sitesR, evTypesR] = await Promise.all([
      fetch(SUPA_PL + '/activity_types?select=*&active=eq.true&order=sort_order', { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/campaign_team?select=id,name&active=eq.true&order=name',  { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/hub_sites?select=site_id,site_name,brand_id&order=sort_order', { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/event_types?select=*&active=eq.true&order=sort_order',    { headers: getAuthHeaders() }),
    ]);
    if (typesR.ok)   PL.actTypes   = await typesR.json();
    if (teamR.ok)    PL.team       = await teamR.json();
    if (sitesR.ok)   PL.sites      = await sitesR.json();
    if (evTypesR.ok) PL.eventTypes = await evTypesR.json();
  } catch(e) { console.warn('plLoadMeta:', e); }
}

async function plLoadData() {
  var qtag = 'Q' + PL.quarter + '-' + PL.year;
  try {
    var evUrl  = SUPA_PL + '/events?brand_id=eq.' + PL.brand + '&is_archived=eq.false&order=start_date';
    var actUrl = SUPA_PL + '/activities?brand_id=eq.' + PL.brand + '&quarter=eq.' + PL.quarter + '&year=eq.' + PL.year + '&is_archived=eq.false&order=type_id,title';
    var delUrl = SUPA_PL + '/activity_deliverables?select=activity_id,completed';
    var [evR, actR, delR] = await Promise.all([
      fetch(evUrl,  { headers: getAuthHeaders() }),
      fetch(actUrl, { headers: getAuthHeaders() }),
      fetch(delUrl, { headers: getAuthHeaders() }),
    ]);
    if (evR.ok) {
      var all = await evR.json();
      PL.events = all.filter(function(e) {
        return e.quarter_tags && e.quarter_tags.indexOf(qtag) !== -1;
      });
    }
    if (actR.ok) {
      PL.activities = await actR.json();
      // Attach deliverable counts
      if (delR.ok) {
        var allDels = await delR.json();
        var delMap = {};
        allDels.forEach(function(d) {
          if (!delMap[d.activity_id]) delMap[d.activity_id] = { total:0, done:0 };
          delMap[d.activity_id].total++;
          if (d.completed) delMap[d.activity_id].done++;
        });
        PL.activities.forEach(function(a) {
          var m = delMap[a.id] || { total:0, done:0 };
          a._del_total = m.total;
          a._del_done  = m.done;
        });
      }
    }
  } catch(e) { console.warn('plLoadData:', e); }
}

/* ══ Brand bar ══ */
function plRenderBrandBar() {
  var bar = document.getElementById('pl-brand-bar');
  if (!bar) return;
  var brands = Object.keys(BRAND_NAMES);
  var html = '';
  brands.forEach(function(bid) {
    var color = BRAND_COLORS[bid] || '#666';
    html += '<button class="pl-brand-pill" data-bid="' + bid + '" style="--bc:' + color + '">'
      + '<span class="pl-brand-pill-dot" style="background:' + color + '"></span>'
      + plE(BRAND_NAMES[bid])
      + '</button>';
  });
  bar.innerHTML = html;
  bar.querySelectorAll('.pl-brand-pill').forEach(function(btn) {
    btn.addEventListener('click', function() { plSetBrand(this.getAttribute('data-bid')); });
  });
}

async function plSetBrand(bid) {
  PL.brand = bid;
  PL.panel = null;
  // Update active pill
  document.querySelectorAll('.pl-brand-pill').forEach(function(b) {
    b.classList.toggle('active', b.getAttribute('data-bid') === bid);
  });
  // Also sync dropdown if on mobile
  var sel = document.getElementById('pl-brand-sel');
  if (sel) sel.value = bid;
  // Show loading
  plSetLoading(true);
  await plLoadData();
  plSetLoading(false);
  plRenderAll();
}

/* ══ Quarter ══ */
async function plSetQuarter(q, btn) {
  PL.quarter = q;
  PL.panel = null;
  document.querySelectorAll('.pl-q-btn').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  plSetLoading(true);
  await plLoadData();
  plSetLoading(false);
  plRenderAll();
}

function plSetLoading(on) {
  var el = document.getElementById('pl-loading');
  if (el) el.style.display = on ? 'flex' : 'none';
  var main = document.getElementById('pl-content');
  if (main) main.style.opacity = on ? '0.4' : '1';
}

/* ══ Render all ══ */
function plRenderAll() {
  plRenderSubtitle();
  plRenderBudgetStrip();
  plRenderEvents();
  plRenderActivities();
  plClosePanel();
}

function plRenderSubtitle() {
  var el = document.getElementById('pl-subtitle');
  if (el) el.textContent = (BRAND_NAMES[PL.brand] || PL.brand) + ' · Q' + PL.quarter + ' ' + PL.year;
}

/* ══ Budget strip ══ */
async function plRenderBudgetStrip() {
  var el = document.getElementById('pl-budget-strip');
  if (!el) return;
  el.innerHTML = '<span style="color:var(--ink-faint);font-size:11px">Loading budget…</span>';

  try {
    var months = PL_Q_MONTHS[PL.quarter];
    var siteIds = PL.sites.filter(function(s) { return s.brand_id === PL.brand; }).map(function(s) { return s.site_id; });
    console.log('Budget strip: brand=' + PL.brand + ' sites=' + siteIds.length + ' months=' + months + ' total sites in PL=' + PL.sites.length);
    if (!siteIds.length) { el.innerHTML = '<span style="color:#DC2626;font-size:11px">No sites found for ' + PL.brand + '</span>'; return; }

    var [sblR, evR, actR] = await Promise.all([
      fetch(SUPA_PL + '/site_budget_lines?site_id=in.(' + siteIds.join(',') + ')&month=in.(' + months.join(',') + ')&year=eq.' + PL.year + '&select=planned,actual', { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/events?brand_id=eq.' + PL.brand + '&is_archived=eq.false&select=planned_budget,quarter_tags', { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/activities?brand_id=eq.' + PL.brand + '&quarter=eq.' + PL.quarter + '&year=eq.' + PL.year + '&select=total_budget', { headers: getAuthHeaders() }),
    ]);

    var sblData  = sblR.ok  ? await sblR.json()  : [];
    var evData   = evR.ok   ? await evR.json()   : [];
    var actData  = actR.ok  ? await actR.json()  : [];

    var siteBudget = sblData.reduce(function(s,r) { return s + (r.planned||0); }, 0);
    var siteActual = sblData.reduce(function(s,r) { return s + (r.actual||0);  }, 0);
    var qtag = 'Q' + PL.quarter + '-' + PL.year;
    var evCost = evData.filter(function(e) { return e.quarter_tags && e.quarter_tags.indexOf(qtag) !== -1; })
                       .reduce(function(s,e) { return s + (e.planned_budget||0); }, 0);
    var actCost = actData.reduce(function(s,a) { return s + (a.total_budget||0); }, 0);
    var remaining = siteBudget - evCost - actCost;
    var usedPct   = siteBudget > 0 ? Math.round((evCost + actCost) / siteBudget * 100) : 0;

    el.innerHTML = '<div class="pl-budget-items">'
      + plBudgetItem('Site budget', siteBudget, '#1A2E4A')
      + plBudgetItem('Events', evCost, '#BB0A21')
      + plBudgetItem('Activities', actCost, '#2563EB')
      + plBudgetItem('Actual spend', siteActual, '#059669')
      + '<div class="pl-budget-item">'
      + '<span class="pl-budget-label">Remaining</span>'
      + '<span class="pl-budget-val" style="color:' + (remaining < 0 ? '#DC2626' : '#059669') + '">'
      + (remaining < 0 ? '-' : '') + '£' + Math.abs(Math.round(remaining)).toLocaleString('en-GB') + '</span>'
      + '</div>'
      + '<div class="pl-budget-bar-wrap"><div class="pl-budget-bar" style="width:' + Math.min(usedPct,100) + '%;background:' + (usedPct > 90 ? '#DC2626' : usedPct > 70 ? '#F59E0B' : '#059669') + '"></div></div>'
      + '<span style="font-family:var(--font-m);font-size:10px;color:var(--ink-soft)">' + usedPct + '% committed</span>'
      + '</div>';
  } catch(e) { el.innerHTML = ''; }
}

function plBudgetItem(label, val, color) {
  return '<div class="pl-budget-item">'
    + '<span class="pl-budget-label">' + label + '</span>'
    + '<span class="pl-budget-val" style="color:' + color + '">£' + Math.round(val).toLocaleString('en-GB') + '</span>'
    + '</div>';
}

/* ══ Events section ══ */
function plRenderEvents() {
  var body   = document.getElementById('pl-events-body');
  var countEl = document.getElementById('pl-events-count');
  if (!body) return;
  if (countEl) countEl.textContent = PL.events.length ? '(' + PL.events.length + ')' : '';

  if (!PL.events.length) {
    body.innerHTML = '<div class="pl-empty"><div class="pl-empty-icon">📅</div>'
      + '<div class="pl-empty-title">No events this quarter</div>'
      + '<div class="pl-empty-sub">Add an event to get started.</div></div>';
    return;
  }

  var html = '<div class="pl-card-grid">';
  PL.events.forEach(function(e) {
    var color    = BRAND_COLORS[e.brand_id] || '#666';
    var typeName = plGetEvTypeName(e.event_type_id);
    var typeColor = plGetEvTypeColor(e.event_type_id) || color;
    var siteName = plGetSiteName(e.site_id);
    var dates    = plFmtDates(e.start_date, e.end_date);
    var budget   = e.planned_budget ? '£' + Number(e.planned_budget).toLocaleString('en-GB') : '';

    html += '<div class="pl-card pl-event-card" data-id="' + e.id + '" style="border-left-color:' + color + '">'
      + '<div class="pl-card-top">'
      + (typeName ? '<span class="pl-type-badge" style="background:' + typeColor + '">' + plE(typeName) + '</span>' : '')
      + plRagPill(e.rag_status)
      + '</div>'
      + '<div class="pl-card-title">' + plE(e.title||'') + '</div>'
      + '<div class="pl-card-meta">'
      + (dates    ? '<span class="pl-meta-item">📅 ' + dates + '</span>' : '')
      + (siteName ? '<span class="pl-meta-item">📍 ' + plE(siteName) + '</span>' : '')
      + (budget   ? '<span class="pl-meta-item">💷 ' + budget + '</span>' : '')
      + (e.assigned_to ? '<span class="pl-meta-item">👤 ' + plE(plGetTeamName(e.assigned_to)) + '</span>' : '')
      + '</div>'
      + '</div>';
  });
  html += '</div>';
  body.innerHTML = html;

  body.querySelectorAll('.pl-event-card').forEach(function(card) {
    card.addEventListener('click', function() { plOpenEventPanel(this.getAttribute('data-id')); });
  });
}

/* ══ Activities section ══ */
function plRenderActivities() {
  var body    = document.getElementById('pl-acts-body');
  var countEl = document.getElementById('pl-acts-count');
  if (!body) return;
  if (countEl) countEl.textContent = PL.activities.length ? '(' + PL.activities.length + ')' : '';

  if (!PL.activities.length) {
    body.innerHTML = '<div class="pl-empty"><div class="pl-empty-icon">📋</div>'
      + '<div class="pl-empty-title">No activities this quarter</div>'
      + '<div class="pl-empty-sub">Add an activity to start planning.</div></div>';
    return;
  }

  // Flat grid — type badge shown on each card, same layout as events
  var html = '<div class="pl-card-grid">';

  PL.activities.forEach(function(a) {
    var type     = PL.actTypes.find(function(t) { return t.id === a.type_id; });
    var tname    = type ? type.name : (a.type_id || '');
    var tcolor   = type ? type.colour_hex : '#6B7280';
    var progress = plGetProgress(a);
    var budget   = a.total_budget ? '£' + Number(a.total_budget).toLocaleString('en-GB') : 'Budget TBC';
    var assigned = plGetTeamName(a.assigned_to);

    html += '<div class="pl-card pl-act-card" data-id="' + a.id + '" style="border-left-color:' + tcolor + '">'
      + '<div class="pl-card-top">'
      + (tname ? '<span class="pl-type-badge" style="background:' + tcolor + '">' + plE(tname) + '</span>' : '')
      + plRagPill(a.rag_status)
      + '</div>'
      + '<div class="pl-card-title">' + plE(a.title||'') + '</div>'
      + '<div class="pl-card-meta">'
      + (assigned ? '<span class="pl-meta-item">👤 ' + plE(assigned) + '</span>' : '')
      + '<span class="pl-meta-item">📋 ' + progress.done + '/' + progress.total + ' deliverables</span>'
      + (budget !== 'Budget TBC' ? '<span class="pl-meta-item">💷 ' + plE(budget) + '</span>' : '')
      + '</div>'
      + (progress.total > 0 ? '<div class="pl-progress-bar"><div class="pl-progress-fill" style="width:' + progress.pct + '%;background:' + (progress.pct === 100 ? '#059669' : progress.pct > 50 ? '#F59E0B' : '#94A3B8') + '"></div></div>' : '')
      + '</div>';
  });

  html += '</div>';
  body.innerHTML = html;

  body.querySelectorAll('.pl-act-card').forEach(function(card) {
    card.addEventListener('click', function() { plOpenActPanel(this.getAttribute('data-id')); });
  });
}

function plGetProgress(a) {
  // Count deliverables from loaded data — we'll load them when panel opens
  // For card preview use total_budget as proxy; deliverables loaded on demand
  var done = a._del_done || 0;
  var total = a._del_total || 0;
  var pct = total > 0 ? Math.round(done/total*100) : 0;
  return { done:done, total:total, pct:pct };
}

/* ══ Event side panel ══ */
function plOpenEventPanel(id) {
  var e = PL.events.find(function(ev) { return ev.id === id; });
  if (!e) return;
  PL.panel = { type:'event', id:id };

  var color     = BRAND_COLORS[e.brand_id] || '#666';
  var typeName  = plGetEvTypeName(e.event_type_id);
  var typeColor = plGetEvTypeColor(e.event_type_id) || color;
  var siteName  = plGetSiteName(e.site_id);
  var brandName = BRAND_NAMES[e.brand_id] || e.brand_id;

  var ragOpts   = plSelectOpts(['Not Started','In Progress','At Risk','On Track','Complete','TBC','Cancelled'], e.rag_status);
  var stageOpts = plSelectOpts(['Not Started','Planning','Briefing','In Progress','Awaiting Input','Complete','Cancelled'], e.stage);
  var teamOpts  = '<option value="">Unassigned</option>' + PL.team.map(function(m) {
    return '<option value="' + m.id + '"' + (e.assigned_to===m.id?' selected':'') + '>' + plE(m.name) + '</option>';
  }).join('');

  var infoRows = [
    ['Type',     typeName],
    ['Site',     siteName],
    ['Dates',    plFmtDates(e.start_date, e.end_date)],
    ['Footfall', e.expected_footfall ? Number(e.expected_footfall).toLocaleString('en-GB') + ' expected' : null],
    ['Budget',   e.planned_budget ? '£' + Number(e.planned_budget).toLocaleString('en-GB') + ' planned' : null],
    ['Actual',   e.actual_spend   ? '£' + Number(e.actual_spend).toLocaleString('en-GB') + ' spent' : null],
    ['Brand support', e.coop_funded && e.coop_amount ? '£' + Number(e.coop_amount).toLocaleString('en-GB') : null],
    ['Quarter',  (e.quarter_tags||[]).join(', ')],
  ].filter(function(r) { return r[1]; });

  var content = '<div class="pl-panel-badge-row">'
    + (typeName ? '<span class="pl-type-badge" style="background:' + typeColor + '">' + plE(typeName) + '</span>' : '')
    + plRagPill(e.rag_status)
    + '</div>'
    + '<div class="pl-panel-title">' + plE(e.title||'') + '</div>'
    + '<div class="pl-panel-sub">' + plE(brandName) + (siteName ? ' · ' + plE(siteName) : '') + '</div>'

    + '<div class="pl-panel-section-hdr">Details</div>'
    + '<div class="pl-info-grid">'
    + infoRows.map(function(r) {
        return '<div class="pl-info-row"><span class="pl-info-label">' + r[0] + '</span><span class="pl-info-val">' + plE(String(r[1])) + '</span></div>';
      }).join('')
    + '</div>'

    + (e.notes ? '<div class="pl-panel-section-hdr">Notes</div><div class="pl-panel-notes">' + plE(e.notes) + '</div>' : '')

    + (PL.isAdmin ? '<div class="pl-panel-section-hdr">Edit</div>'
      + '<div class="pl-form-row2">'
      + '<div class="pl-form-field"><label>Status</label><select id="ep-rag">' + ragOpts + '</select></div>'
      + '<div class="pl-form-field"><label>Stage</label><select id="ep-stage">' + stageOpts + '</select></div>'
      + '</div>'
      + '<div class="pl-form-field"><label>Assigned to</label><select id="ep-assigned">' + teamOpts + '</select></div>'
      + '<div class="pl-form-row2">'
      + '<div class="pl-form-field"><label>Planned budget (£)</label><input type="number" id="ep-budget" value="' + (e.planned_budget||'') + '" min="0"></div>'
      + '<div class="pl-form-field"><label>Actual spend (£)</label><input type="number" id="ep-actual" value="' + (e.actual_spend||'') + '" min="0"></div>'
      + '</div>'
      + '<div class="pl-form-field"><label>Notes</label><textarea id="ep-notes" rows="3">' + plE(e.notes||'') + '</textarea></div>'
      + '<div class="pl-panel-err" id="ep-err"></div>'
      : '');

  var footer = PL.isAdmin
    ? '<button class="btn btn-primary" id="ep-save-btn" data-id="' + e.id + '">Save changes</button>'
      + '<button class="btn" style="color:#DC2626;border-color:#FECACA;margin-left:auto" id="ep-del-btn" data-id="' + e.id + '">Delete</button>'
    : '';

  // Add Edit in Events button to footer
  var editBtn = '<button class="btn" style="margin-right:auto" onclick="window.location=\'events.html?event=' + e.id + '\'">✏ Edit in Events</button>';
  footer = editBtn + footer;

  plShowPanel(plE(brandName) + ' Event', content, footer);

  // Bind
  var saveBtn = document.getElementById('ep-save-btn');
  if (saveBtn) saveBtn.addEventListener('click', function() { plSaveEvent(this.getAttribute('data-id')); });
  var delBtn = document.getElementById('ep-del-btn');
  if (delBtn) delBtn.addEventListener('click', function() { plDeleteEvent(this.getAttribute('data-id')); });
}

/* ══ Activity side panel ══ */
async function plOpenActPanel(id) {
  var a = PL.activities.find(function(ac) { return ac.id === id; });
  if (!a) return;
  PL.panel = { type:'activity', id:id };

  var type   = PL.actTypes.find(function(t) { return t.id === a.type_id; });
  var tname  = type ? type.name : '';
  var tcolor = type ? type.colour_hex : '#6B7280';
  var bname  = BRAND_NAMES[a.brand_id] || a.brand_id;

  var ragOpts   = plSelectOpts(['Not Started','In Progress','At Risk','On Track','Complete','TBC','Cancelled'], a.rag_status);
  var stageOpts = plSelectOpts(['Not Started','Planning','In Progress','Awaiting Input','Complete','Cancelled'], a.stage);
  var teamOpts  = '<option value="">Unassigned</option>' + PL.team.map(function(m) {
    return '<option value="' + m.id + '"' + (a.assigned_to===m.id?' selected':'') + '>' + plE(m.name) + '</option>';
  }).join('');

  // Show panel immediately with loading deliverables
  var content = '<div class="pl-panel-badge-row">'
    + (tname ? '<span class="pl-type-badge" style="background:' + tcolor + '">' + plE(tname) + '</span>' : '')
    + plRagPill(a.rag_status)
    + '</div>'
    + '<div class="pl-panel-title">' + plE(a.title||'') + '</div>'
    + '<div class="pl-panel-sub">' + plE(bname) + ' · Q' + a.quarter + ' ' + a.year + '</div>'

    + '<div class="pl-panel-section-hdr">Status</div>'
    + '<div class="pl-form-row2">'
    + '<div class="pl-form-field"><label>RAG</label><select id="ap-rag">' + ragOpts + '</select></div>'
    + '<div class="pl-form-field"><label>Stage</label><select id="ap-stage">' + stageOpts + '</select></div>'
    + '</div>'
    + '<div class="pl-form-row2">'
    + '<div class="pl-form-field"><label>Assigned to</label><select id="ap-assigned">' + teamOpts + '</select></div>'
    + '</div>'

    + '<div class="pl-panel-section-hdr">Description & Notes</div>'
    + '<div class="pl-form-field"><textarea id="ap-desc" rows="2" placeholder="Campaign description…">' + plE(a.description||'') + '</textarea></div>'
    + '<div class="pl-form-field"><textarea id="ap-notes" rows="2" placeholder="Notes, context, links…">' + plE(a.notes||'') + '</textarea></div>'

    + '<div class="pl-panel-section-hdr" style="display:flex;align-items:center;justify-content:space-between">'
    + '<span>Deliverables</span>'
    + (PL.isAdmin ? '<button class="btn" style="padding:2px 10px;font-size:11px" id="ap-add-del-btn">+ Add</button>' : '')
    + '</div>'
    + '<div id="ap-deliverables"><div class="pl-loading-sm">Loading…</div></div>'

    + '<div class="pl-panel-section-hdr">Budget Allocation</div>'
    + '<div style="margin-bottom:12px">'
    + '<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">'
    + '<div>'
    + '<div style="font-family:var(--font-m);font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-faint);margin-bottom:3px">Total allocated</div>'
    + '<div style="font-family:var(--font-d);font-size:20px;font-weight:800;color:var(--swansway)" id="ap-alloc-total">Loading…</div>'
    + '</div>'
    + '</div>'
    + '<button class="btn btn-primary" id="ap-budget-modal-btn" data-id="' + a.id + '" style="width:100%">💷 Allocate budget by site & channel</button>'
    + '</div>'

    + '<div class="pl-panel-section-hdr">Brief for Oceros</div>'
    + '<div style="margin-bottom:8px">'
    + '<button class="btn btn-primary" id="ap-brief-btn" data-id="' + a.id + '">📋 Copy brief to clipboard</button>'
    + '<div style="font-size:11px;color:var(--ink-faint);margin-top:5px">Paste directly into a Monday task for Oceros</div>'
    + '</div>'

    + '<div class="pl-panel-err" id="ap-err"></div>';

  var footer = '<button class="btn btn-primary" id="ap-save-btn" data-id="' + a.id + '">Save changes</button>'
    + (PL.isAdmin ? '<button class="btn" style="color:#DC2626;border-color:#FECACA;margin-left:auto" id="ap-del-btn" data-id="' + a.id + '">Delete</button>' : '');

  plShowPanel(plE(tname || 'Activity'), content, footer);

  // Bind buttons
  var saveBtn = document.getElementById('ap-save-btn');
  if (saveBtn) saveBtn.addEventListener('click', function() { plSaveActivity(this.getAttribute('data-id')); });

  var delBtn = document.getElementById('ap-del-btn');
  if (delBtn) delBtn.addEventListener('click', function() { plDeleteActivity(this.getAttribute('data-id')); });

  var briefBtn = document.getElementById('ap-brief-btn');
  if (briefBtn) briefBtn.addEventListener('click', function() { plCopyBrief(this.getAttribute('data-id')); });

  var addDelBtn = document.getElementById('ap-add-del-btn');
  if (addDelBtn) addDelBtn.addEventListener('click', function() { plAddDeliverable(a.id); });

  var budgetModalBtn = document.getElementById('ap-budget-modal-btn');
  if (budgetModalBtn) budgetModalBtn.addEventListener('click', function() { plOpenBudgetModal(this.getAttribute('data-id')); });

  // Load allocated total for this activity
  plLoadAllocTotal(a.id);

  // Load deliverables async
  await plLoadDeliverables(a.id);
}

/* ══ Deliverables ══ */
async function plLoadDeliverables(actId) {
  var el = document.getElementById('ap-deliverables');
  if (!el) return;
  try {
    var r = await fetch(SUPA_PL + '/activity_deliverables?activity_id=eq.' + actId + '&order=sort_order,created_at', { headers: getAuthHeaders() });
    var dels = r.ok ? await r.json() : [];

    // Update progress on the card
    var act = PL.activities.find(function(a) { return a.id === actId; });
    if (act) {
      act._del_done  = dels.filter(function(d) { return d.completed; }).length;
      act._del_total = dels.length;
    }

    if (!dels.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--ink-faint);padding:8px 0">No deliverables yet.</div>';
      return;
    }

    var html = '<div class="pl-deliverables">';
    dels.forEach(function(d) {
      html += '<div class="pl-del-row" data-del-id="' + d.id + '">'
        + '<label class="pl-del-check">'
        + '<input type="checkbox" class="pl-del-cb" data-del-id="' + d.id + '" data-act-id="' + actId + '"' + (d.completed ? ' checked' : '') + '>'
        + '<span class="pl-del-label' + (d.completed ? ' pl-del-done' : '') + '">' + plE(d.title) + '</span>'
        + '</label>'
        + (PL.isAdmin && d.is_custom ? '<button class="pl-del-remove" data-del-id="' + d.id + '" data-act-id="' + actId + '" title="Remove">×</button>' : '')
        + '</div>';
    });
    html += '</div>';
    el.innerHTML = html;

    // Bind checkboxes
    el.querySelectorAll('.pl-del-cb').forEach(function(cb) {
      cb.addEventListener('change', function() {
        plToggleDeliverable(this.getAttribute('data-del-id'), this.getAttribute('data-act-id'), this.checked);
      });
    });
    // Bind remove buttons
    el.querySelectorAll('.pl-del-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        plRemoveDeliverable(this.getAttribute('data-del-id'), this.getAttribute('data-act-id'));
      });
    });
  } catch(e) {
    var el2 = document.getElementById('ap-deliverables');
    if (el2) el2.innerHTML = '<div style="color:#DC2626;font-size:12px">Error loading deliverables</div>';
  }
}

async function plToggleDeliverable(delId, actId, checked) {
  try {
    var sess = await SB.auth.getSession();
    var userId = sess.data.session ? sess.data.session.user.id : null;
    // Look up campaign_team id from auth_user_id
    var teamId = null;
    if (userId) {
      var tr = await fetch(SUPA_PL + '/campaign_team?auth_user_id=eq.' + userId + '&select=id', { headers: getAuthHeaders() });
      if (tr.ok) { var rows = await tr.json(); if (rows.length) teamId = rows[0].id; }
    }
    await fetch(SUPA_PL + '/activity_deliverables?id=eq.' + delId, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type':'application/json', 'Prefer':'return=minimal' }),
      body: JSON.stringify({
        completed:    checked,
        completed_by: checked ? teamId : null,
        completed_at: checked ? new Date().toISOString() : null
      })
    });
    await plLoadDeliverables(actId);
    plRenderActivities(); // refresh progress bar on card
  } catch(e) { plShowToast('Error: ' + e.message, '#DC2626'); }
}

async function plAddDeliverable(actId) {
  var title = prompt('Deliverable title:');
  if (!title || !title.trim()) return;
  try {
    await fetch(SUPA_PL + '/activity_deliverables', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type':'application/json', 'Prefer':'return=minimal' }),
      body: JSON.stringify([{ activity_id: actId, title: title.trim(), is_custom: true, sort_order: 999 }])
    });
    await plLoadDeliverables(actId);
  } catch(e) { plShowToast('Error: ' + e.message, '#DC2626'); }
}

async function plRemoveDeliverable(delId, actId) {
  if (!confirm('Remove this deliverable?')) return;
  try {
    await fetch(SUPA_PL + '/activity_deliverables?id=eq.' + delId, { method:'DELETE', headers: getAuthHeaders() });
    await plLoadDeliverables(actId);
  } catch(e) { plShowToast('Error: ' + e.message, '#DC2626'); }
}

/* ══ Load allocated total for panel ══ */
async function plLoadAllocTotal(actId) {
  var el = document.getElementById('ap-alloc-total');
  if (!el) return;
  try {
    var r = await fetch(SUPA_PL + '/activity_budget_lines?activity_id=eq.' + actId + '&select=planned', { headers: getAuthHeaders() });
    var rows = r.ok ? await r.json() : [];
    var total = rows.reduce(function(s, r) { return s + (r.planned || 0); }, 0);
    el.textContent = total ? '£' + total.toLocaleString('en-GB') : '—';
  } catch(e) {
    el.textContent = '—';
  }
}

/* ══ Budget allocation modal (full width) ══ */
async function plOpenBudgetModal(actId) {
  var a = PL.activities.find(function(ac) { return ac.id === actId; });
  if (!a) return;

  var type  = PL.actTypes.find(function(t) { return t.id === a.type_id; });
  var tname = type ? type.name : '';
  var tcolor = type ? type.colour_hex : '#6B7280';
  var bname  = BRAND_NAMES[a.brand_id] || a.brand_id;
  var months = PL_Q_MONTHS[PL.quarter];

  // Build modal shell immediately, load data async
  var root = document.getElementById('pl-modal-root');
  if (!root) return;

  root.innerHTML = '<div class="pl-modal-overlay" id="pl-budget-modal-overlay">'
    + '<div style="background:var(--white);border-radius:8px;width:96vw;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.25)">'
    + '<div style="padding:18px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">'
    + '<div>'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">'
    + '<span class="pl-type-badge" style="background:' + tcolor + '">' + plE(tname) + '</span>'
    + '<span style="font-family:var(--font-d);font-size:18px;font-weight:800;color:var(--ink)">' + plE(a.title||'') + '</span>'
    + '</div>'
    + '<div style="font-size:12px;color:var(--ink-soft)">' + plE(bname) + ' · Q' + PL.quarter + ' ' + PL.year + ' · Budget allocation by site & channel</div>'
    + '</div>'
    + '<button onclick="plCloseBudgetModal()" style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--ink-soft);line-height:1">×</button>'
    + '</div>'
    + '<div style="flex:1;overflow:auto;padding:20px 24px" id="pl-budget-modal-body">'
    + '<div class="pl-loading-sm" style="text-align:center;padding:40px">Loading budget data…</div>'
    + '</div>'
    + '<div style="padding:14px 24px;border-top:1px solid var(--border);display:flex;gap:10px;align-items:center;background:var(--surface);border-radius:0 0 8px 8px;flex-shrink:0">'
    + '<button class="btn btn-primary" id="pl-budget-save-btn" data-act-id="' + actId + '">Save allocations</button>'
    + '<button class="btn" onclick="plCloseBudgetModal()">Cancel</button>'
    + '<span style="margin-left:auto;font-size:11px;color:var(--ink-faint)">Red = over-allocated vs available budget</span>'
    + '</div>'
    + '</div></div>';

  document.getElementById('pl-budget-save-btn').addEventListener('click', function() {
    plSaveAllocations(this.getAttribute('data-act-id'));
  });

  // Load data
  await plLoadBudgetModalData(actId, months);
}

async function plLoadBudgetModalData(actId, months) {
  var body = document.getElementById('pl-budget-modal-body');
  if (!body) return;

  try {
    var brandSites = PL.sites.filter(function(s) { return s.brand_id === PL.brand; });
    var siteIds    = brandSites.map(function(s) { return s.site_id; });

    if (!siteIds.length) {
      body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--ink-faint)">No sites found for this brand.</div>';
      return;
    }

    var [sblR, ablR, chanR] = await Promise.all([
      fetch(SUPA_PL + '/site_budget_lines?site_id=in.(' + siteIds.join(',') + ')&month=in.(' + months.join(',') + ')&year=eq.' + PL.year + '&select=site_id,channel,month,planned,actual&limit=5000', { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/activity_budget_lines?activity_id=eq.' + actId + '&select=id,site_id,channel_id,month,year,planned,actual', { headers: getAuthHeaders() }),
      fetch(SUPA_PL + '/activity_channels?active=eq.true&select=id,name,sbl_channel_name&order=sort_order', { headers: getAuthHeaders() }),
    ]);

    var sblRows  = sblR.ok  ? await sblR.json()  : [];
    var ablRows  = ablR.ok  ? await ablR.json()  : [];
    var channels = chanR.ok ? await chanR.json() : [];

    // Index sbl[site_id][channel_name][month]
    var sbl = {};
    sblRows.forEach(function(r) {
      if (!sbl[r.site_id]) sbl[r.site_id] = {};
      if (!sbl[r.site_id][r.channel]) sbl[r.site_id][r.channel] = {};
      sbl[r.site_id][r.channel][r.month] = { planned: r.planned||0, actual: r.actual||0 };
    });

    // Index abl[site_id][channel_id][month]
    var abl = {};
    ablRows.forEach(function(r) {
      if (!abl[r.site_id]) abl[r.site_id] = {};
      if (!abl[r.site_id][r.channel_id]) abl[r.site_id][r.channel_id] = {};
      abl[r.site_id][r.channel_id][r.month] = { planned: r.planned||0, actual: r.actual||0 };
    });

    // Only mapped channels
    var mappedChans = channels.filter(function(c) { return c.sbl_channel_name; });

    var mNames = PL_MONTHS;
    var thS  = 'padding:7px 10px;font-family:var(--font-m);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--ink-faint);text-align:right;white-space:nowrap;background:var(--surface);border-bottom:2px solid var(--border);position:sticky;top:0;z-index:1';
    var th1S = thS + ';text-align:left;min-width:140px';
    var th2S = thS + ';text-align:left;min-width:180px';

    var hdr = '<tr>'
      + '<th style="' + th1S + '">Site</th>'
      + '<th style="' + th2S + '">Channel</th>';
    months.forEach(function(m) {
      hdr += '<th style="' + thS + '" colspan="2">' + mNames[m-1] + '</th>';
    });
    hdr += '<th style="' + thS + '">Total<br>Allocated</th>'
         + '<th style="' + thS + '">Total<br>Actual</th>'
         + '</tr>'
    // Sub-header
     + '<tr style="background:var(--surface)">'
      + '<th style="' + thS + ';top:35px"></th><th style="' + thS + ';top:35px"></th>';
    months.forEach(function(m) {
      hdr += '<th style="' + thS + ';top:35px;color:var(--ink-faint);font-weight:400">Available</th>'
           + '<th style="' + thS + ';top:35px;color:var(--swansway)">Allocate</th>';
    });
    hdr += '<th style="' + thS + ';top:35px"></th><th style="' + thS + ';top:35px"></th></tr>';

    var rows = '';
    var grandAlloc = 0;
    var grandActual = 0;

    brandSites.forEach(function(site) {
      var sid = site.site_id;

      mappedChans.forEach(function(ch, ci) {
        var sblChan = ((sbl[sid]||{})[ch.sbl_channel_name])||{};
        var ablChan = ((abl[sid]||{})[ch.id])||{};
        var rowAlloc = 0, rowActual = 0;

        var tds = '';
        months.forEach(function(m) {
          var avail    = sblChan[m] ? sblChan[m].planned : 0;
          var allocVal = ablChan[m] ? ablChan[m].planned : 0;
          var actVal   = ablChan[m] ? ablChan[m].actual  : 0;
          rowAlloc  += allocVal;
          rowActual += actVal;
          var over  = allocVal > avail && avail > 0;
          var inId  = 'abl_' + sid + '_' + ch.id + '_' + m;

          tds += '<td style="padding:5px 8px;font-family:var(--font-m);font-size:11px;text-align:right;color:var(--ink-faint);white-space:nowrap">'
               + (avail ? '£' + avail.toLocaleString('en-GB') : '—') + '</td>'
               + '<td style="padding:3px 6px;text-align:right">'
               + '<input type="number" id="' + inId + '" value="' + allocVal + '" min="0" '
               + 'style="width:80px;padding:4px 8px;border:1.5px solid ' + (over ? '#FECACA' : 'var(--border-med)') + ';border-radius:3px;font-family:var(--font-m);font-size:11px;text-align:right;background:' + (over ? '#FEF2F2' : 'var(--white)') + '" '
               + 'data-site="' + sid + '" data-channel="' + ch.id + '" data-month="' + m + '" data-avail="' + avail + '" '
               + 'oninput="plCheckAlloc(this)">'
               + '</td>';
        });

        grandAlloc  += rowAlloc;
        grandActual += rowActual;

        var isFirst = ci === 0;
        var borderTop = isFirst ? 'border-top:2px solid var(--border-med)' : '';
        var siteCell = isFirst
          ? '<td rowspan="' + mappedChans.length + '" style="padding:10px;font-family:var(--font-b);font-size:12px;font-weight:700;color:var(--ink);vertical-align:top;border-right:1px solid var(--border);white-space:nowrap;border-top:2px solid var(--border-med)">' + plE(site.site_name) + '</td>'
          : '';

        rows += '<tr style="border-bottom:1px solid var(--border);' + borderTop + '">'
          + siteCell
          + '<td style="padding:6px 10px;font-family:var(--font-b);font-size:11px;color:var(--ink-soft)">' + plE(ch.name) + '</td>'
          + tds
          + '<td style="padding:6px 10px;font-family:var(--font-m);font-size:12px;font-weight:700;text-align:right;color:' + (rowAlloc > 0 ? 'var(--swansway)' : 'var(--ink-faint)') + ';white-space:nowrap">'
          + (rowAlloc ? '£' + rowAlloc.toLocaleString('en-GB') : '—') + '</td>'
          + '<td style="padding:6px 10px;font-family:var(--font-m);font-size:12px;text-align:right;color:' + (rowActual ? '#059669' : 'var(--ink-faint)') + ';white-space:nowrap">'
          + (rowActual ? '£' + rowActual.toLocaleString('en-GB') : '—') + '</td>'
          + '</tr>';
      });
    });

    // Grand total row
    rows += '<tr style="border-top:3px solid var(--swansway);background:var(--surface)">'
      + '<td colspan="' + (2 + months.length * 2) + '" style="padding:12px 10px;font-family:var(--font-m);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-faint)">Total allocated this activity</td>'
      + '<td style="padding:12px 10px;font-family:var(--font-d);font-size:18px;font-weight:800;text-align:right;color:var(--swansway)">£' + grandAlloc.toLocaleString('en-GB') + '</td>'
      + '<td style="padding:12px 10px;font-family:var(--font-d);font-size:18px;font-weight:800;text-align:right;color:#059669">' + (grandActual ? '£' + grandActual.toLocaleString('en-GB') : '—') + '</td>'
      + '</tr>';

    body.innerHTML = '<div style="overflow-x:auto">'
      + '<table style="width:100%;border-collapse:collapse;font-size:12px">'
      + '<thead>' + hdr + '</thead>'
      + '<tbody>' + rows + '</tbody>'
      + '</table></div>';

  } catch(err) {
    body.innerHTML = '<div style="color:#DC2626;padding:20px;text-align:center">Error loading budget data: ' + plE(err.message) + '</div>';
    console.error('Budget modal error:', err);
  }
}

function plCloseBudgetModal() {
  var root = document.getElementById('pl-modal-root');
  if (root) root.innerHTML = '';
}

function plCheckAlloc(input) {
  var avail = parseFloat(input.getAttribute('data-avail')) || 0;
  var val   = parseFloat(input.value) || 0;
  var over  = avail > 0 && val > avail;
  input.style.borderColor = over ? '#FECACA' : 'var(--border-med)';
  input.style.background  = over ? '#FEF2F2' : 'var(--white)';
}
/* ══ Save allocations ══ */
async function plSaveAllocations(actId) {
  var btn = document.getElementById('pl-budget-save-btn');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
  try {
    // Collect all allocation inputs from the modal
    var inputs  = document.querySelectorAll('#pl-budget-modal-body input[type="number"][data-site]');
    var upserts = [];
    inputs.forEach(function(inp) {
      var val = parseFloat(inp.value) || 0;
      upserts.push({
        activity_id: actId,
        site_id:     inp.getAttribute('data-site'),
        channel_id:  inp.getAttribute('data-channel'),
        month:       parseInt(inp.getAttribute('data-month')),
        year:        PL.year,
        planned:     val,
        actual:      0
      });
    });
    if (!upserts.length) {
      plShowToast('Nothing to save', '#6B7280');
      return;
    }
    var r = await fetch(SUPA_PL + '/activity_budget_lines', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type':'application/json', 'Prefer':'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify(upserts)
    });
    if (!r.ok) throw new Error(await r.text());
    plShowToast('Budget allocations saved ✓', '#059669');
    plCloseBudgetModal();
    plRenderBudgetStrip();
    await plLoadData();
    plRenderActivities();
    // Refresh the allocated total in the panel if still open
    plLoadAllocTotal(actId);
  } catch(e) {
    plShowToast('Save failed: ' + e.message, '#DC2626');
    console.error('Save allocations error:', e);
  } finally {
    if (btn) { btn.textContent = 'Save allocations'; btn.disabled = false; }
  }
}

/* ══ Copy brief to clipboard ══ */
async function plCopyBrief(actId) {
  var a    = PL.activities.find(function(ac) { return ac.id === actId; });
  if (!a) return;
  var type = PL.actTypes.find(function(t) { return t.id === a.type_id; });
  var bname = BRAND_NAMES[a.brand_id] || a.brand_id;
  var sites = PL.sites.filter(function(s) { return s.brand_id === a.brand_id; }).map(function(s) { return s.site_name; }).join(', ');

  // Load deliverables
  var dels = [];
  try {
    var r = await fetch(SUPA_PL + '/activity_deliverables?activity_id=eq.' + actId + '&order=sort_order', { headers: getAuthHeaders() });
    if (r.ok) dels = await r.json();
  } catch(e) {}

  var brief = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'SWANSWAY MARKETING BRIEF',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    'Brand:        ' + bname,
    'Campaign:     ' + (a.title||''),
    'Type:         ' + (type ? type.name : ''),
    'Quarter:      Q' + a.quarter + ' ' + a.year,
    'Sites:        ' + (sites || 'All ' + bname + ' sites'),
    'Budget:       ' + (a.total_budget ? '£' + Number(a.total_budget).toLocaleString('en-GB') : 'TBC'),
    'Owner:        ' + plGetTeamName(a.assigned_to),
    '',
    'DESCRIPTION',
    (a.description || 'See notes below'),
    '',
    'NOTES',
    (a.notes || '—'),
    '',
    'DELIVERABLES',
    dels.length ? dels.map(function(d) { return (d.completed ? '✓ ' : '☐ ') + d.title; }).join('\n') : '— None set',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    'Generated: ' + new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }),
    'Portal: Swansway Marketing Hub',
  ].join('\n');

  try {
    await navigator.clipboard.writeText(brief);
    var btn = document.getElementById('ap-brief-btn');
    if (btn) { btn.textContent = '✓ Copied to clipboard!'; setTimeout(function() { btn.textContent = '📋 Copy brief to clipboard'; }, 2500); }
  } catch(e) {
    // Fallback: show in textarea
    var ta = document.createElement('textarea');
    ta.value = brief;
    ta.style.cssText = 'position:fixed;top:10px;left:10px;width:80%;height:80%;z-index:9999;padding:16px;font-family:monospace;font-size:12px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    setTimeout(function() { document.body.removeChild(ta); }, 3000);
    plShowToast('Brief copied (fallback mode)', '#059669');
  }
}

/* ══ Save event ══ */
async function plSaveEvent(id) {
  var btn   = document.getElementById('ep-save-btn');
  var errEl = document.getElementById('ep-err');
  if (errEl) errEl.textContent = '';
  if (btn)   { btn.textContent = 'Saving…'; btn.disabled = true; }

  var payload = {
    rag_status:    (document.getElementById('ep-rag')      ||{}).value || 'Not Started',
    stage:         (document.getElementById('ep-stage')    ||{}).value || 'Not Started',
    assigned_to:   (document.getElementById('ep-assigned') ||{}).value || null,
    planned_budget: parseFloat((document.getElementById('ep-budget')||{}).value) || null,
    actual_spend:  parseFloat((document.getElementById('ep-actual') ||{}).value) || null,
    notes:         (document.getElementById('ep-notes')    ||{}).value || null,
    updated_at:    new Date().toISOString()
  };

  try {
    var r = await fetch(SUPA_PL + '/events?id=eq.' + id, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type':'application/json', 'Prefer':'return=minimal' }),
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(await r.text());
    plShowToast('Event updated ✓', '#059669');
    await plLoadData();
    plRenderEvents();
    plRenderBudgetStrip();
  } catch(e) {
    if (errEl) errEl.textContent = 'Save failed: ' + e.message;
  } finally {
    if (btn) { btn.textContent = 'Save changes'; btn.disabled = false; }
  }
}

/* ══ Delete event ══ */
async function plDeleteEvent(id) {
  if (!confirm('Delete this event? Cannot be undone.')) return;
  try {
    var r = await fetch(SUPA_PL + '/events?id=eq.' + id, { method:'DELETE', headers: getAuthHeaders() });
    if (!r.ok) throw new Error(await r.text());
    plShowToast('Event deleted', '#6B7280');
    plClosePanel();
    await plLoadData();
    plRenderEvents();
    plRenderBudgetStrip();
  } catch(e) { plShowToast('Error: ' + e.message, '#DC2626'); }
}

/* ══ Save activity ══ */
async function plSaveActivity(id) {
  var btn   = document.getElementById('ap-save-btn');
  var errEl = document.getElementById('ap-err');
  if (errEl) errEl.textContent = '';
  if (btn)   { btn.textContent = 'Saving…'; btn.disabled = true; }

  var payload = {
    rag_status:   (document.getElementById('ap-rag')      ||{}).value || 'Not Started',
    stage:        (document.getElementById('ap-stage')    ||{}).value || 'Not Started',
    assigned_to:  (document.getElementById('ap-assigned') ||{}).value || null,
    description:  (document.getElementById('ap-desc')     ||{}).value || null,
    notes:        (document.getElementById('ap-notes')    ||{}).value || null,
    updated_at:   new Date().toISOString()
  };

  try {
    var r = await fetch(SUPA_PL + '/activities?id=eq.' + id, {
      method: 'PATCH',
      headers: getAuthHeaders({ 'Content-Type':'application/json', 'Prefer':'return=minimal' }),
      body: JSON.stringify(payload)
    });
    if (!r.ok) throw new Error(await r.text());
    plShowToast('Activity updated ✓', '#059669');
    await plLoadData();
    plRenderActivities();
    plRenderBudgetStrip();
  } catch(e) {
    if (errEl) errEl.textContent = 'Save failed: ' + e.message;
  } finally {
    if (btn) { btn.textContent = 'Save changes'; btn.disabled = false; }
  }
}

/* ══ Delete activity ══ */
async function plDeleteActivity(id) {
  if (!confirm('Delete this activity and all its deliverables? Cannot be undone.')) return;
  try {
    await fetch(SUPA_PL + '/activity_deliverables?activity_id=eq.' + id, { method:'DELETE', headers: getAuthHeaders() });
    var r = await fetch(SUPA_PL + '/activities?id=eq.' + id, { method:'DELETE', headers: getAuthHeaders() });
    if (!r.ok) throw new Error(await r.text());
    plShowToast('Activity deleted', '#6B7280');
    plClosePanel();
    await plLoadData();
    plRenderActivities();
    plRenderBudgetStrip();
  } catch(e) { plShowToast('Error: ' + e.message, '#DC2626'); }
}

/* ══ Add activity modal ══ */
function plOpenAddActivity() {
  var typeOpts = PL.actTypes.map(function(t) {
    return '<option value="' + t.id + '">' + plE(t.name) + '</option>';
  }).join('');
  var teamOpts = '<option value="">Unassigned</option>' + PL.team.map(function(m) {
    return '<option value="' + m.id + '">' + plE(m.name) + '</option>';
  }).join('');

  var html = '<div class="pl-modal-overlay" onclick="if(event.target===this)plCloseAddModal()">'
    + '<div class="pl-modal">'
    + '<div class="pl-modal-hdr"><div class="pl-modal-title">Add activity</div>'
    + '<button class="pl-modal-close" onclick="plCloseAddModal()">×</button></div>'
    + '<div class="pl-modal-body">'
    + '<div class="pl-form-field"><label>Activity type</label><select id="na-type">' + typeOpts + '</select></div>'
    + '<div class="pl-form-field"><label>Title</label><input type="text" id="na-title" placeholder="e.g. Sep Plate Change Campaign"></div>'
    + '<div class="pl-form-row2">'
    + '<div class="pl-form-field"><label>Assigned to</label><select id="na-assigned">' + teamOpts + '</select></div>'
    + '<div class="pl-form-field"><label>Budget (£)</label><input type="number" id="na-budget" min="0" placeholder="0"></div>'
    + '</div>'
    + '<div class="pl-form-field"><label>Description</label><textarea id="na-desc" rows="2" placeholder="Campaign objective and details…"></textarea></div>'
    + '<div id="na-err" style="color:#DC2626;font-size:12px;margin-top:8px"></div>'
    + '</div>'
    + '<div class="pl-modal-footer">'
    + '<button class="btn btn-primary" id="na-save-btn">Add activity</button>'
    + '<button class="btn" onclick="plCloseAddModal()">Cancel</button>'
    + '</div>'
    + '</div></div>';

  var root = document.getElementById('pl-modal-root');
  if (root) {
    root.innerHTML = html;
    var saveBtn = root.querySelector('#na-save-btn');
    if (saveBtn) saveBtn.addEventListener('click', plSaveNewActivity);
  }
}

async function plSaveNewActivity() {
  var typeId  = (document.getElementById('na-type')     ||{}).value;
  var title   = ((document.getElementById('na-title')   ||{}).value||'').trim();
  var assigned= (document.getElementById('na-assigned') ||{}).value || null;
  var budget  = parseFloat((document.getElementById('na-budget')||{}).value) || null;
  var desc    = (document.getElementById('na-desc')     ||{}).value || null;
  var errEl   = document.getElementById('na-err');
  var btn     = document.getElementById('na-save-btn');

  if (errEl) errEl.textContent = '';
  if (!typeId) { if (errEl) errEl.textContent = 'Please select a type.'; return; }
  if (!title)  { if (errEl) errEl.textContent = 'Please enter a title.'; return; }

  if (btn) { btn.textContent = 'Adding…'; btn.disabled = true; }

  var id = 'act-' + PL.brand + '-' + typeId + '-' + Date.now();

  try {
    var r = await fetch(SUPA_PL + '/activities', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type':'application/json', 'Prefer':'return=representation' }),
      body: JSON.stringify([{
        id:           id,
        title:        title,
        type_id:      typeId,
        category_id:  typeId,
        brand_id:     PL.brand,
        site_id:      null,
        quarter:      PL.quarter,
        year:         PL.year,
        rag_status:   'Not Started',
        stage:        'Not Started',
        assigned_to:  assigned,
        total_budget: budget,
        description:  desc
      }])
    });
    if (!r.ok) throw new Error(await r.text());
    var newActs = await r.json();
    var newId   = newActs[0].id;

    // Seed default deliverables from type
    var type = PL.actTypes.find(function(t) { return t.id === typeId; });
    if (type && type.default_deliverables && type.default_deliverables.length) {
      var dels = type.default_deliverables.map(function(d, i) {
        return { activity_id: newId, title: d.title, sort_order: i, is_custom: false };
      });
      await fetch(SUPA_PL + '/activity_deliverables', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type':'application/json', 'Prefer':'return=minimal' }),
        body: JSON.stringify(dels)
      });
    }

    plCloseAddModal();
    plShowToast('Activity added ✓', '#059669');
    await plLoadData();
    plRenderActivities();
    plRenderBudgetStrip();
    // Open the new activity's panel
    setTimeout(function() { plOpenActPanel(newId); }, 100);
  } catch(e) {
    if (errEl) errEl.textContent = 'Error: ' + e.message;
    if (btn)   { btn.textContent = 'Add activity'; btn.disabled = false; }
  }
}

function plCloseAddModal() {
  var root = document.getElementById('pl-modal-root');
  if (root) root.innerHTML = '';
}

/* ══ Add event — opens existing evOpenForm ══ */
function plOpenAddEvent() {
  if (typeof evOpenForm === 'function') evOpenForm(null);
}

/* ══ Side panel ══ */
function plShowPanel(title, content, footer) {
  var panel = document.getElementById('pl-side-panel');
  var titleEl = document.getElementById('pl-panel-title');
  var contentEl = document.getElementById('pl-panel-content');
  var footerEl = document.getElementById('pl-panel-footer');

  if (!panel) return;
  if (titleEl)   titleEl.textContent  = title;
  if (contentEl) contentEl.innerHTML  = content;
  if (footerEl)  footerEl.innerHTML   = footer || '';

  panel.classList.add('open');
  document.getElementById('pl-panel-overlay').style.display = 'block';
}

function plClosePanel() {
  var panel = document.getElementById('pl-side-panel');
  if (panel) panel.classList.remove('open');
  var overlay = document.getElementById('pl-panel-overlay');
  if (overlay) overlay.style.display = 'none';
  PL.panel = null;
}

/* ══ Helpers ══ */
function plRagPill(rag) {
  var map = {
    'Complete':'complete','On Track':'on-track','In Progress':'in-progress',
    'At Risk':'at-risk','Not Started':'not-started','TBC':'tbc','Cancelled':'cancelled'
  };
  return '<span class="rag rag-' + (map[rag]||'not-started') + '">' + plE(rag||'—') + '</span>';
}

function plSelectOpts(opts, selected) {
  return opts.map(function(o) {
    return '<option value="' + o + '"' + (o===selected?' selected':'') + '>' + o + '</option>';
  }).join('');
}

function plFmtDates(start, end) {
  if (!start) return '';
  var s = new Date(start).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  if (!end || end === start) return s;
  var e = new Date(end).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  return s + ' – ' + e;
}

function plGetEvTypeName(id) {
  if (!id) return '';
  var t = PL.eventTypes.find(function(et) { return et.id === id; });
  return t ? t.name : '';
}

function plGetEvTypeColor(id) {
  if (!id) return '';
  var t = PL.eventTypes.find(function(et) { return et.id === id; });
  return t ? t.color : '';
}

function plGetSiteName(id) {
  if (!id) return '';
  var s = PL.sites.find(function(st) { return st.site_id === id; });
  return s ? s.site_name : id;
}

function plGetTeamName(id) {
  if (!id) return '';
  var m = PL.team.find(function(t) { return t.id === id; });
  return m ? m.name : id;
}

function plE(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function plShowToast(msg, bg) {
  var t = document.getElementById('pl-toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = bg || '#059669';
  t.style.display = 'block'; t.style.opacity = '1';
  setTimeout(function() { t.style.opacity = '0'; setTimeout(function() { t.style.display='none'; t.style.opacity='1'; }, 300); }, 3000);
}

/* ══ URL param: auto-open activity from dashboard ══ */
(function() {
  function plCheckUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var brandId = params.get('brand');
    var activityId = params.get('activity');
    if (!brandId && !activityId) return;

    var attempts = 0;
    function tryOpen() {
      attempts++;
      if (attempts > 20) return; // give up after 10s

      // Wait for brand data to load
      if (!PL.activities || !PL.activities.length) {
        setTimeout(tryOpen, 500);
        return;
      }

      // Switch brand if needed and wait for it to load
      if (brandId && PL.brand !== brandId) {
        plSetBrand(brandId);
        setTimeout(tryOpen, 800); // wait for brand switch + data load
        return;
      }

      // Open activity panel using the correct function
      if (activityId && typeof plOpenActPanel === 'function') {
        var act = PL.activities.find(function(a){ return a.id === activityId; });
        if (act) {
          plOpenActPanel(activityId);
          return;
        }
      }
      setTimeout(tryOpen, 500);
    }
    setTimeout(tryOpen, 1500); // wait for initial load
  }
  document.addEventListener('DOMContentLoaded', plCheckUrlParams);
})();
