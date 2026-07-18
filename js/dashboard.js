// dashboard.js v110 — Swansway Marketing Portal home dashboard

var DB = {
  activities: [],
  events:     [],
  loaded:     false
};

var _dbInitDone = false;
var _dbInitRunning = false;

async function dbInit() {
  if (_dbInitDone || _dbInitRunning) return;

  // Must have a real user JWT — anon key returns 0 rows from RLS tables
  var token = window.SB_ACCESS_TOKEN;
  if (!token || !SB_USER || token === SUPABASE_ANON_KEY) {
    console.log('Dashboard: waiting for user token...');
    return;
  }

  // Must have core globals
  if (typeof HUB_SITES === 'undefined' || !HUB_SITES.length || typeof BRANDS === 'undefined' || !BRANDS.length) {
    setTimeout(dbInit, 300);
    return;
  }

  // Build BRAND_NAMES and BRAND_COLORS from BRANDS array if not set
  if (typeof BRAND_NAMES === 'undefined' || !Object.keys(BRAND_NAMES).length) {
    window.BRAND_NAMES = {};
    window.BRAND_COLORS = {};
    BRANDS.forEach(function(b) {
      window.BRAND_NAMES[b.id] = b.name;
      window.BRAND_COLORS[b.id] = b.color;
    });
  }

  _dbInitRunning = true;
  console.log('Dashboard: starting init with token', token.substring(0, 20) + '...');

  var SUPA = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var Q = 3; var YEAR = 2026;
  var now = new Date();

  // Greeting
  function updateGreeting() {
    var hour = now.getHours();
    var greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    // Try CB_TEAM first for real name, fall back to user-name element
    var firstName = '';
    if (typeof CB_CURRENT_USER !== 'undefined' && CB_CURRENT_USER && typeof CB_TEAM !== 'undefined' && CB_TEAM[CB_CURRENT_USER]) {
      firstName = CB_TEAM[CB_CURRENT_USER].name.split(' ')[0];
    }
    if (!firstName) {
      var nameEl = document.getElementById('user-name');
      var raw = nameEl ? nameEl.textContent.replace('Loading…','').trim() : '';
      // If it looks like an email prefix (no space, has dot), skip it
      if (raw && raw.indexOf(' ') !== -1) firstName = raw.split(' ')[0];
    }
    var el = document.getElementById('db-greeting');
    if (el) el.textContent = greet + (firstName ? ' ' + firstName : '');
  }
  updateGreeting();
  setTimeout(updateGreeting, 2000);

  var dateEl = document.getElementById('db-date');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' }) + ' · Q' + Q + ' ' + YEAR;

  try {
    var hdrs = getAuthHeaders();
    var q3Start = YEAR + '-07-01';
    var q3End   = YEAR + '-09-30';

    var [actR, evR] = await Promise.all([
      fetch(SUPA + '/activities?quarter=eq.' + Q + '&year=eq.' + YEAR + '&is_archived=eq.false&select=id,title,type_id,brand_id,rag_status,stage,assigned_to&limit=500', { headers: hdrs }),
      fetch(SUPA + '/events?start_date=gte.' + q3Start + '&start_date=lte.' + q3End + '&select=id,title,brand_id,site_id,start_date,end_date,rag_status,planned_budget&order=start_date&limit=200', { headers: hdrs }),
    ]);

    var acts = actR.ok ? await actR.json() : [];
    var allEvents = evR.ok ? await evR.json() : [];

    console.log('Dashboard: loaded', acts.length, 'activities,', allEvents.length, 'Q3 events');

    DB.activities = Array.isArray(acts) ? acts : [];
    DB.events = Array.isArray(allEvents) ? allEvents : [];

    var weekStart = new Date(now); weekStart.setHours(0,0,0,0);
    var weekEnd   = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
    DB.eventsThisWeek = DB.events.filter(function(e) {
      if (!e.start_date) return false;
      var d = new Date(e.start_date + 'T00:00:00');
      return d >= weekStart && d <= weekEnd;
    });

    DB.loaded = true;
    _dbInitDone = true;
    _dbInitRunning = false;

  } catch(err) {
    console.warn('dbInit load error:', err);
    DB.activities = []; DB.events = []; DB.eventsThisWeek = [];
    _dbInitRunning = false;
    return;
  }

  dbRenderKPIs();
  dbRenderUrgent();
  dbRenderThisWeek();

  if (typeof SITE_BUDGETS !== 'undefined' && Object.keys(SITE_BUDGETS).length) {
    dbRenderBrands();
  } else {
    setTimeout(function() { dbRenderBrands(); }, 2000);
  }
}


function dbRenderKPIs() {
  var acts = DB.activities;

  // At risk
  var atRisk = acts.filter(function(a) { return a.rag_status === 'At Risk' || a.rag_status === 'Not Started'; });
  document.getElementById('db-kpi-atrisk').textContent = atRisk.length;
  document.getElementById('db-kpi-atrisk-sub').textContent = atRisk.length + ' activit' + (atRisk.length === 1 ? 'y' : 'ies') + ' need attention';

  // Events this week
  var evWk = DB.eventsThisWeek || [];
  document.getElementById('db-kpi-events').textContent = evWk.length;
  var BN = (typeof BRAND_NAMES !== 'undefined' && Object.keys(BRAND_NAMES).length) ? BRAND_NAMES : {};
  document.getElementById('db-kpi-events-sub').textContent = evWk.length ? evWk.map(function(e){ return BN[e.brand_id]||e.brand_id; }).filter(function(v,i,a){ return a.indexOf(v)===i; }).slice(0,3).join(', ') : 'No events this week';

  // Budget committed — from SITE_BUDGETS (loaded by group.js)
  var budgetPct = 0;
  if (typeof SITE_BUDGETS !== 'undefined' && Object.keys(SITE_BUDGETS).length) {
    var totalPlan = 0, totalAlloc = 0, totalEv = 0;
    Object.values(SITE_BUDGETS).forEach(function(d) {
      for (var i=6;i<=8;i++) totalPlan += (d['m'+i+'_planned']||0); // Q3 months 6,7,8 (0-indexed)
    });
    // Activity allocations Q3
    if (window.ACTIVITY_ALLOCATIONS) {
      Object.values(window.ACTIVITY_ALLOCATIONS).forEach(function(months) {
        [6,7,8].forEach(function(m) { totalAlloc += months[m]||0; });
      });
    }
    // Events
    if (typeof EV_EVENTS_BUDGET !== 'undefined') {
      EV_EVENTS_BUDGET.forEach(function(ev) {
        if (!ev.start_date) return;
        var m = new Date(ev.start_date+'T00:00:00').getMonth();
        if (m>=6 && m<=8) totalEv += ev.planned_budget||0;
      });
    }
    budgetPct = totalPlan > 0 ? Math.round((totalAlloc + totalEv) / totalPlan * 100) : 0;
  }
  document.getElementById('db-kpi-budget').textContent = budgetPct + '%';
  document.getElementById('db-kpi-budget-sub').textContent = 'of Q3 budget allocated or committed';

  // On track
  var onTrack = acts.filter(function(a) { return a.rag_status === 'On Track' || a.rag_status === 'Complete' || a.rag_status === 'In Progress'; });
  document.getElementById('db-kpi-complete').textContent = onTrack.length;
  document.getElementById('db-kpi-complete-sub').textContent = acts.length ? Math.round(onTrack.length/acts.length*100) + '% of ' + acts.length + ' activities' : 'No activities yet';
}

function dbRenderUrgent() {
  var el = document.getElementById('db-urgent-list');
  var countEl = document.getElementById('db-urgent-count');
  if (!el) return;

  // At risk activities + events without budget
  var urgent = [];

  console.log('Dashboard urgent: activities sample rag_status =', DB.activities.slice(0,3).map(function(a){return a.rag_status;}));
  DB.activities.filter(function(a) { return a.rag_status === 'At Risk'; }).forEach(function(a) {
    var bname = (BRAND_NAMES||{})[a.brand_id] || a.brand_id;
    var color = (BRAND_COLORS||{})[a.brand_id] || '#DC2626';
    urgent.push({ type:'activity', title: a.title, sub: bname + ' · At Risk', color:'#DC2626', dot:color, href:'planner.html', id:a.id });
  });

  // Events this week with no status update
  DB.eventsThisWeek.filter(function(e) { return e.rag_status === 'Not Started'; }).forEach(function(e) {
    var bname = (typeof BRAND_NAMES !== 'undefined' ? BRAND_NAMES : {})[e.brand_id] || e.brand_id;
    var siteName = '';
    if (typeof HUB_SITES !== 'undefined') {
      var site = HUB_SITES.find(function(s){ return s.site_id === e.site_id; });
      if (site) siteName = ' · ' + site.site_name;
    }
    var color = (BRAND_COLORS||{})[e.brand_id] || '#7C3AED';
    urgent.push({ type:'event', title: e.title, sub: bname + siteName + ' · This week · Not Started', color:'#D97706', dot:color, href:'planner.html' });
  });

  // Not Started activities that should be underway (Q3 has started)
  var notStarted = DB.activities.filter(function(a) {
    return a.rag_status === 'Not Started' && ['plate-change','paid-search','paid-social','email-crm','autotrader-carwow'].indexOf(a.type_id) !== -1;
  }).slice(0, 5);
  notStarted.forEach(function(a) {
    var bname = (BRAND_NAMES||{})[a.brand_id] || a.brand_id;
    var color = (BRAND_COLORS||{})[a.brand_id] || '#6B7280';
    urgent.push({ type:'activity', title: a.title, sub: bname + ' · Not started — Q3 underway', color:'#6B7280', dot:color, href:'planner.html', id:a.id });
  });

  if (countEl) countEl.textContent = urgent.length + ' item' + (urgent.length !== 1 ? 's' : '');

  if (!urgent.length) {
    el.innerHTML = '<div class="db-empty">✅ Nothing urgent right now</div>';
    return;
  }

  el.innerHTML = urgent.slice(0, 12).map(function(item) {
    return '<div class="db-item" onclick="window.location=\'' + item.href + '\'">'
      + '<div class="db-item-dot" style="background:' + item.dot + '"></div>'
      + '<div class="db-item-body">'
      + '<div class="db-item-title">' + dbEsc(item.title) + '</div>'
      + '<div class="db-item-sub">' + dbEsc(item.sub) + '</div>'
      + '</div>'
      + '<span class="db-item-badge" style="background:' + item.color + '20;color:' + item.color + '">' + item.type + '</span>'
      + '</div>';
  }).join('');
}

function dbRenderThisWeek() {
  var el = document.getElementById('db-week-list');
  var countEl = document.getElementById('db-week-count');
  if (!el) return;

  var items = [];

  // Events this week
  DB.eventsThisWeek.forEach(function(e) {
    var bname = (typeof BRAND_NAMES !== 'undefined' ? BRAND_NAMES : {})[e.brand_id] || e.brand_id;
    var color = (BRAND_COLORS||{})[e.brand_id] || '#7C3AED';
    var siteName = '';
    if (typeof HUB_SITES !== 'undefined') {
      var site = HUB_SITES.find(function(s){ return s.site_id === e.site_id; });
      if (site) siteName = ' · ' + site.site_name;
    }
    var d = new Date(e.start_date + 'T00:00:00');
    var dayStr = d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' });
    items.push({ title: e.title, sub: dayStr + siteName + ' · ' + bname, dot: color, badge:'event', badgeColor:'#7C3AED', href:'planner.html' });
  });

  // Activities In Progress assigned to current user
  var userName = (document.getElementById('user-name')||{}).textContent || '';
  DB.activities.filter(function(a) { return a.rag_status === 'In Progress'; }).slice(0, 8).forEach(function(a) {
    var bname = (BRAND_NAMES||{})[a.brand_id] || a.brand_id;
    var color = (BRAND_COLORS||{})[a.brand_id] || '#059669';
    items.push({ title: a.title, sub: bname + ' · In Progress', dot: color, badge:'activity', badgeColor:'#059669', href:'planner.html' });
  });

  if (countEl) countEl.textContent = items.length + ' item' + (items.length !== 1 ? 's' : '');

  if (!items.length) {
    el.innerHTML = '<div class="db-empty">No events or active activities this week</div>';
    return;
  }

  el.innerHTML = items.slice(0, 12).map(function(item) {
    return '<div class="db-item" onclick="window.location=\'' + item.href + '\'">'
      + '<div class="db-item-dot" style="background:' + item.dot + '"></div>'
      + '<div class="db-item-body">'
      + '<div class="db-item-title">' + dbEsc(item.title) + '</div>'
      + '<div class="db-item-sub">' + dbEsc(item.sub) + '</div>'
      + '</div>'
      + '<span class="db-item-badge" style="background:' + item.badgeColor + '20;color:' + item.badgeColor + '">' + item.badge + '</span>'
      + '</div>';
  }).join('');
}

function dbRenderBrands() {
  var el = document.getElementById('db-brands-grid');
  if (!el || typeof BRAND_NAMES === 'undefined') { setTimeout(dbRenderBrands, 500); return; }

  var brands = Object.keys(BRAND_NAMES);

  el.innerHTML = brands.map(function(bid) {
    var color  = (BRAND_COLORS||{})[bid] || '#6B7280';
    var name   = BRAND_NAMES[bid] || bid;

    // Count activities for this brand
    var bActs  = DB.activities.filter(function(a){ return a.brand_id === bid; });
    var atRisk = bActs.filter(function(a){ return a.rag_status === 'At Risk'; }).length;
    var inProg = bActs.filter(function(a){ return a.rag_status === 'In Progress'; }).length;
    var onTrack= bActs.filter(function(a){ return a.rag_status === 'On Track' || a.rag_status === 'Complete'; }).length;
    var total  = bActs.length;
    var pct    = total > 0 ? Math.round((inProg + onTrack) / total * 100) : 0;

    // Budget
    var bSites = (typeof HUB_SITES !== 'undefined') ? HUB_SITES.filter(function(s){ return s.brand_id === bid; }) : [];
    var bBudget = bSites.reduce(function(sum, site) {
      var d = SITE_BUDGETS && SITE_BUDGETS[site.site_id] || {};
      return sum + (d.annual_planned || 0);
    }, 0);
    var budgetStr = bBudget >= 1000 ? '£' + Math.round(bBudget/1000) + 'K' : bBudget > 0 ? '£' + bBudget : '—';

    var ragColor = atRisk > 0 ? '#DC2626' : pct >= 50 ? '#059669' : '#6B7280';
    var ragLabel = atRisk > 0 ? atRisk + ' at risk' : inProg > 0 ? inProg + ' in progress' : total + ' activities';

    return '<div class="db-brand-card" style="--bc:' + color + '" onclick="window.location=\'brand.html?brand=' + bid + '\'">'
      + '<div class="db-brand-name">' + dbEsc(name) + '</div>'
      + '<div class="db-brand-bar-wrap"><div class="db-brand-bar-fill" style="width:' + pct + '%;background:' + ragColor + '"></div></div>'
      + '<div class="db-brand-meta" style="color:' + ragColor + '">' + ragLabel + '</div>'
      + (budgetStr !== '—' ? '<div class="db-brand-meta" style="margin-top:2px">' + budgetStr + ' planned</div>' : '')
      + '</div>';
  }).join('');
}

function dbScrollToEvents() {
  var el = document.getElementById('db-week-list');
  if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
}

function dbEsc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Refresh brands grid once site budgets load
window.addEventListener('swBudgetsLoaded', function() {
  if (_dbInitDone) { dbRenderBrands(); dbRenderKPIs(); }
});

// dbInit is called from sbHandleSession in bundle-core.js after auth
// Fallback in case page loads with existing session before sbHandleSession fires
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    if (!_dbInitDone && typeof SB_USER !== 'undefined' && SB_USER) dbInit();
  }, 2000);
});
