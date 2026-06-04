// Swansway Marketing Portal — Admin v2
// Full admin: all 13 sections, uses getAuthHeaders() (user JWT)

const SUPA = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';

var SB_SITES = [{"site_id": "audi-blackburn", "site_name": "Audi Blackburn", "brand_id": "audi", "brand_name": "Audi"}, {"site_id": "audi-carlisle", "site_name": "Audi Carlisle", "brand_id": "audi", "brand_name": "Audi"}, {"site_id": "audi-crewe", "site_name": "Audi Crewe", "brand_id": "audi", "brand_name": "Audi"}, {"site_id": "audi-preston", "site_name": "Audi Preston", "brand_id": "audi", "brand_name": "Audi"}, {"site_id": "audi-stafford", "site_name": "Audi Stafford", "brand_id": "audi", "brand_name": "Audi"}, {"site_id": "audi-stoke", "site_name": "Audi Stoke", "brand_id": "audi", "brand_name": "Audi"}, {"site_id": "vw-wrexham", "site_name": "VW Wrexham", "brand_id": "vw", "brand_name": "Volkswagen"}, {"site_id": "vw-crewe", "site_name": "VW Crewe", "brand_id": "vw", "brand_name": "Volkswagen"}, {"site_id": "vw-oldham", "site_name": "VW Oldham", "brand_id": "vw", "brand_name": "Volkswagen"}, {"site_id": "vwcv-wrexham", "site_name": "VWC Wrexham", "brand_id": "vwcv", "brand_name": "VW Commercial"}, {"site_id": "vwcv-liverpool", "site_name": "VWC Liverpool", "brand_id": "vwcv", "brand_name": "VW Commercial"}, {"site_id": "vwcv-lancashire", "site_name": "VWC Lancashire", "brand_id": "vwcv", "brand_name": "VW Commercial"}, {"site_id": "vwcv-birmingham", "site_name": "VWC Birmingham", "brand_id": "vwcv", "brand_name": "VW Commercial"}, {"site_id": "vwcv-oldham", "site_name": "VWC Oldham", "brand_id": "vwcv", "brand_name": "VW Commercial"}, {"site_id": "seat-crewe", "site_name": "SEAT Crewe", "brand_id": "seat", "brand_name": "SEAT"}, {"site_id": "seat-oldham", "site_name": "SEAT Oldham", "brand_id": "seat", "brand_name": "SEAT"}, {"site_id": "cupra-crewe", "site_name": "CUPRA Crewe", "brand_id": "cupra", "brand_name": "CUPRA"}, {"site_id": "cupra-oldham", "site_name": "CUPRA Oldham", "brand_id": "cupra", "brand_name": "CUPRA"}, {"site_id": "lr-stafford", "site_name": "Land Rover Stafford", "brand_id": "landrover", "brand_name": "Land Rover"}, {"site_id": "jag-crewe", "site_name": "Jaguar Crewe", "brand_id": "jaguar", "brand_name": "Jaguar"}, {"site_id": "honda-stockport", "site_name": "Honda Stockport", "brand_id": "honda", "brand_name": "Honda"}, {"site_id": "honda-bolton", "site_name": "Honda Bolton", "brand_id": "honda", "brand_name": "Honda"}, {"site_id": "peugeot-chester", "site_name": "Peugeot Chester", "brand_id": "peugeot", "brand_name": "Peugeot"}, {"site_id": "peugeot-crewe", "site_name": "Peugeot Crewe", "brand_id": "peugeot", "brand_name": "Peugeot"}, {"site_id": "byd-crewe", "site_name": "BYD Crewe", "brand_id": "byd", "brand_name": "BYD"}, {"site_id": "byd-chester", "site_name": "BYD Chester", "brand_id": "byd", "brand_name": "BYD"}, {"site_id": "byd-stoke", "site_name": "BYD Stoke", "brand_id": "byd", "brand_name": "BYD"}, {"site_id": "omoda-stockport", "site_name": "OMODA/JAECOO Stockport", "brand_id": "omoda", "brand_name": "OMODA/JAECOO"}, {"site_id": "mm-crewe", "site_name": "Motor Match Crewe", "brand_id": "motormatch", "brand_name": "Motor Match"}, {"site_id": "mm-stockport", "site_name": "Motor Match Stockport", "brand_id": "motormatch", "brand_name": "Motor Match"}, {"site_id": "mm-bolton", "site_name": "Motor Match Bolton", "brand_id": "motormatch", "brand_name": "Motor Match"}, {"site_id": "mm-chester", "site_name": "Motor Match Chester", "brand_id": "motormatch", "brand_name": "Motor Match"}, {"site_id": "mm-stoke", "site_name": "Motor Match Stoke", "brand_id": "motormatch", "brand_name": "Motor Match"}, {"site_id": "cupra-bolton", "site_name": "CUPRA Bolton Service", "brand_id": "cupra", "brand_name": "CUPRA"}, {"site_id": "seat-bolton", "site_name": "SEAT Bolton Service", "brand_id": "seat", "brand_name": "SEAT"}]


const BRAND_NAMES = {"audi":"Audi","vw":"Volkswagen","vwcv":"VW Commercial","seat":"SEAT","cupra":"CUPRA","landrover":"Land Rover","jaguar":"Jaguar","honda":"Honda","peugeot":"Peugeot","byd":"BYD","omoda":"OMODA/JAECOO","motormatch":"Motor Match"};
const BRAND_IDS = ['audi','vw','vwcv','seat','cupra','landrover','jaguar','honda','peugeot','byd','omoda','motormatch'];
const BRAND_COLORS = {"audi":"#BB0A21","vw":"#001E50","vwcv":"#1B4F72","seat":"#E2231A","cupra":"#C8920A","landrover":"#1D4E1D","jaguar":"#1B2631","honda":"#CC0000","peugeot":"#1B3A6B","byd":"#0066CC","omoda":"#6B21A8","motormatch":"#374151"};

const BRAND_DEFAULTS = [
  {id:'audi',name:'Audi',color:'#CC0000',segment:'Premium',sites:6,budget:0,leads:420,newUnits:1800,evPct:45,convRate:12,cpl:38,retention:70,usedUnits:960,fleetUnits:240,nps:75,q2Focus:'A6 e-tron Avant launch + Summer Drive VIP event',sitenames:'Blackburn · Carlisle · Crewe · Preston · Stafford · Stoke'},
  {id:'vw',name:'Volkswagen',color:'#001E5A',segment:'Mainstream',sites:3,budget:0,leads:380,newUnits:2400,evPct:35,convRate:10,cpl:26,retention:68,usedUnits:1200,fleetUnits:180,nps:70,q2Focus:'ID.3 summer finance push + Golf facelift media',sitenames:'Chester · Crewe · Oldham · Preston · Stafford'},
  {id:'vwcv',name:'VW Commercial',color:'#1B4F72',segment:'Commercial',sites:5,budget:0,leads:120,newUnits:600,evPct:20,convRate:14,cpl:45,retention:72,usedUnits:300,fleetUnits:280,nps:68,q2Focus:'Transporter T7 launch + fleet drive days',sitenames:'Oldham VW Van Centre · Preston VW Van Centre'},
  {id:'seat',name:'SEAT',color:'#E2231A',segment:'Mainstream',sites:3,budget:0,leads:250,newUnits:1100,evPct:25,convRate:9,cpl:22,retention:65,usedUnits:600,fleetUnits:60,nps:68,q2Focus:'Ibiza summer social push + Leon Cupra-lite crossover',sitenames:'Chester · Crewe · Stafford'},
  {id:'cupra',name:'CUPRA',color:'#C8920A',segment:'Performance EV',sites:3,budget:0,leads:180,newUnits:400,evPct:60,convRate:11,cpl:42,retention:70,usedUnits:200,fleetUnits:40,nps:78,q2Focus:'Born EV summer + padel tennis series Crewe',sitenames:'Crewe CUPRA · Stockport CUPRA'},
  {id:'landrover',name:'Land Rover',color:'#1D4E1D',segment:'Premium Luxury',sites:1,budget:0,leads:180,newUnits:500,evPct:40,convRate:18,cpl:55,retention:72,usedUnits:400,fleetUnits:80,nps:80,q2Focus:'Defender adventure camp + Range Rover lifestyle push',sitenames:'Chester · Crewe'},
  {id:'jaguar',name:'Jaguar',color:'#1B2631',segment:'Premium Luxury',sites:1,budget:0,leads:80,newUnits:180,evPct:50,convRate:15,cpl:52,retention:68,usedUnits:120,fleetUnits:30,nps:72,q2Focus:'Brand relaunch support + EV positioning',sitenames:'Crewe Jaguar'},
  {id:'honda',name:'Honda',color:'#CC0000',segment:'Mainstream Hybrid',sites:2,budget:0,leads:280,newUnits:1400,evPct:55,convRate:10,cpl:28,retention:70,usedUnits:700,fleetUnits:80,nps:74,q2Focus:'e:HEV hybrid summer campaign + HR-V push',sitenames:'Blackburn · Bolton · Stockport · Stafford'},
  {id:'peugeot',name:'Peugeot',color:'#1B3A6B',segment:'Mainstream EV',sites:2,budget:0,leads:240,newUnits:1200,evPct:40,convRate:9,cpl:24,retention:65,usedUnits:500,fleetUnits:70,nps:68,q2Focus:'E-308 summer lease push + 3008 PHEV launch',sitenames:'Chester · Crewe · Stockport'},
  {id:'byd',name:'BYD',color:'#0066CC',segment:'EV-Led',sites:3,budget:0,leads:180,newUnits:500,evPct:100,convRate:8,cpl:35,retention:60,usedUnits:100,fleetUnits:50,nps:68,q2Focus:'BYD Seal awareness push + EV education campaign',sitenames:'Cheshire · Cheshire 2 · Stoke'},
  {id:'omoda',name:'OMODA / JAECOO',color:'#6B21A8',segment:'EV-Led New Brand',sites:1,budget:0,leads:100,newUnits:250,evPct:55,convRate:7,cpl:30,retention:55,usedUnits:50,fleetUnits:20,nps:65,q2Focus:'OMODA 7 launch + Jaecoo 5 EV push + grand opening follow-up',sitenames:'Stockport (dual brand showroom)'},
  {id:'motormatch',name:'Motor Match',color:'#374151',segment:'Used Car',sites:5,budget:0,leads:600,newUnits:4000,evPct:15,convRate:6,cpl:14,retention:0,usedUnits:4000,fleetUnits:0,nps:70,q2Focus:'Top Value Dealer maintenance + summer stock push',sitenames:'Chester · Crewe · Stockport · Stoke · Fenton'},
];
const GROUP_DEFAULTS = {
  name:'Swansway Motor Group', year:'2026', desc:'11 brands · 30 dealerships · North West, Midlands & North Wales',
  fystart:'January', budget:0, evPct:38, digSplit:'70% digital / 30% traditional', coopPct:15,
  units:0, leads:0, evSales:0, conv:0, retention:0, used:0, nps:0, cpl:0
};
const CHANNEL_DEFAULTS = [
  {name:'Digital Paid (PPC/Display)',pct:30,color:'#1E3A8A',note:'Google, Bing, AutoTrader PPC — brand-specific ad sets per brand and dealership.'},
  {name:'Social & Content',pct:20,color:'#14532D',note:'TikTok, Instagram, Facebook, YouTube — brand personality-led content.'},
  {name:'Manufacturer Co-op',pct:15,color:'#78350F',note:'Leverage VW Group, JLR, Honda, Stellantis, OMODA UK central funds.'},
  {name:'Email & CRM',pct:12,color:'#4C1D95',note:'Lifecycle nurture, conquest, retention — segmented by brand and lifecycle stage.'},
  {name:'Events & Showroom',pct:10,color:'#831843',note:'VIP nights, test drive events, fleet drive days, padel events.'},
  {name:'SEO & Local Search',pct:8,color:'#065F46',note:'Google Business Profile optimisation across all 30 sites.'},
  {name:'OOH & Print',pct:5,color:'#92400E',note:'Regional press, radio, outdoor — plate-change bursts and new brand launches.'},
];
var SK_TARGETS = [
  {key:'units_target',    label:'New units target', unit:''},
  {key:'used_target',     label:'Used units target', unit:''},
  {key:'ev_pct_target',   label:'EV/PHEV % target', unit:'%'},
  {key:'leads_target',    label:'Leads target/mo',  unit:''},
  {key:'conversion_target',label:'Conversion %',    unit:'%'},
  {key:'retention_target', label:'Retention %',     unit:'%'},
  {key:'nps_target',      label:'NPS target',       unit:''},
  {key:'cpl_target',      label:'CPL target (£)',   unit:''},
];
var SK_MONTHLY = [
  {prefix:'units', label:'New units'},
  {prefix:'used',  label:'Used units'},
  {prefix:'ev',    label:'EV% actual'},
  {prefix:'leads', label:'Leads'},
];
var SK_YTD = [
  {key:'conversion_actual', label:'Conversion %'},
  {key:'retention_actual',  label:'Retention %'},
  {key:'nps_actual',        label:'NPS actual'},
  {key:'cpl_actual',        label:'CPL actual (£)'},
];
var BK_FIELDS = [
  {section:'Manufacturer Co-op', fields:[
    {key:'coop_available', label:'Co-op available (£)', type:'number', hint:'Total £ allocated by manufacturer for 2026'},
    {key:'coop_claimed',   label:'Co-op claimed (£)',  type:'number', hint:'£ actually claimed and deployed YTD'},
  ]},
  {section:'Fleet & B2B', fields:[
    {key:'fleet_target', label:'Fleet accounts target', type:'number', hint:'Active fleet accounts target for 2026'},
    {key:'fleet_actual', label:'Fleet accounts actual', type:'number', hint:'Active fleet accounts YTD'},
  ]},
  {section:'Social Media', fields:[
    {key:'social_followers', label:'Current followers',  type:'number', hint:'Combined followers across all social channels'},
    {key:'social_target',    label:'Year-end target',    type:'number', hint:'Follower count target by Dec 2026'},
  ]},
  {section:'AutoTrader Response Time', fields:[
    {key:'autotrader_response_target', label:'Target (mins)', type:'number', hint:'Target response time in minutes'},
    {key:'autotrader_response_actual', label:'Actual (mins)', type:'number', hint:'Current average response time in minutes'},
  ]},
];
var BC_DEFAULT_CHANNELS = [{"channel": "Paid Search (Google/Bing)", "color": "#4285F4"}, {"channel": "AutoTrader", "color": "#F15A22"}, {"channel": "Meta (Facebook/Instagram)", "color": "#1877F2"}, {"channel": "Display & Programmatic", "color": "#34A853"}, {"channel": "Email Marketing", "color": "#EA4335"}, {"channel": "Social Organic", "color": "#9C27B0"}, {"channel": "Manufacturer Co-op", "color": "#FF9800"}, {"channel": "Events & Showroom", "color": "#607D8B"}, {"channel": "Other / Local", "color": "#795548"}];
var CT_PERM_LABELS = [
  {key:'can_approve_all',      label:'Approve any task',          desc:'Can approve all tasks across all stages'},
  {key:'can_approve_digital',  label:'Approve digital/CRM tasks', desc:'Can approve digital and CRM-specific tasks'},
  {key:'can_advance_stage',    label:'Advance or reopen stages',  desc:'Can move campaign forward or back a stage'},
  {key:'can_manage_campaigns', label:'Manage campaigns',          desc:'Can create, edit, pause and cancel campaigns'},
  {key:'can_complete_tasks',   label:'Complete own tasks',        desc:'Can mark assigned tasks as complete'},
  {key:'can_reject_tasks',     label:'Reject tasks',              desc:'Can reject tasks and send back with a reason'},
  {key:'can_add_notes',        label:'Add notes',                 desc:'Can add notes to any task'},
];
/* ── STATE ── */
var STATE = {
  group: JSON.parse(JSON.stringify(GROUP_DEFAULTS)),
  brands: JSON.parse(JSON.stringify(BRAND_DEFAULTS)),
  channels: JSON.parse(JSON.stringify(CHANNEL_DEFAULTS)),
  kpis: [],
};
var SB_SITE_DATA = {};
var SK_SITE_DATA = {};
var SC_DATA = {};
var BK_DATA = {};
var BC_DATA = {};
var CT_MEMBERS = {};
var CT_PERMISSIONS = {};
var CT_SELECTED = null;
var CURRENT_PAGE = 'dashboard';
var SB_CURRENT_BRAND = 'audi';
var SK_CURRENT_BRAND = 'audi';
var SC_CURRENT_BRAND = 'audi';
var BK_CURRENT_BRAND = 'audi';
var BC_CURRENT_BRAND = 'audi';

/* ══ INIT ══ */
async function loadSiteBudgetsForDash() {
  try {
    var r = await fetch(SUPA + '/site_budgets?select=site_id,annual_planned,brand_id', { headers: getAuthHeaders() });
    if (!r.ok) return;
    var rows = await r.json();
    rows.forEach(function(row) { SB_SITE_DATA[row.site_id] = row; });
  } catch(e) {}
}

async function adminInit() {
  var sess = await SB.auth.getSession();
  if (!sess.data.session) { window.location = 'index.html'; return; }
  var email = sess.data.session.user.email;

  // Check is_admin flag via campaign_team email lookup + campaign_permissions.is_admin
  var allowed = false;
  try {
    var tr = await fetch(SUPA + '/campaign_team?email=eq.' + encodeURIComponent(email) + '&select=id', { headers: getAuthHeaders() });
    if (tr.ok) {
      var members = await tr.json();
      if (members && members.length) {
        var pr = await fetch(SUPA + '/campaign_permissions?team_member_id=eq.' + members[0].id + '&select=is_admin', { headers: getAuthHeaders() });
        if (pr.ok) {
          var perms = await pr.json();
          allowed = perms && perms.length > 0 && perms[0].is_admin === true;
        }
      }
    }
  } catch(e) { console.warn('adminInit auth check:', e); }

  if (!allowed) {
    alert('You do not have permission to access the admin area.');
    window.location = 'index.html';
    return;
  }

  var unEl = document.getElementById('user-name'); if (unEl) unEl.textContent = email.split('@')[0];
  showLoading(true);
  await loadAdminCfg();
  showLoading(false);
  showPage('dashboard');
}

function showLoading(on) {
  var el = document.getElementById('admin-loading');
  if (el) el.style.display = on ? 'flex' : 'none';
}

/* ══ NAVIGATION ══ */
function showPage(id) {
  CURRENT_PAGE = id;
  document.querySelectorAll('.admin-page').forEach(function(p) { p.style.display = 'none'; });
  document.querySelectorAll('.snav').forEach(function(b) { b.classList.remove('active'); });
  var page = document.getElementById('page-' + id);
  if (page) page.style.display = 'block';
  var btn = document.querySelector('[data-page="' + id + '"]');
  if (btn) btn.classList.add('active');
  // Lazy-load page data
  if (id === 'dashboard')    { refreshDashboard(); } // async — runs in background
  if (id === 'group')        { populateGroupForm(); }
  if (id === 'channels')     { renderChannelEditor(); }
  if (id === 'brand')        { renderBrandEditor(BRAND_IDS[0]); }
  if (id === 'sitebudgets')  { sbLoad(); }
  if (id === 'sitekpis')     { skLoad(); }
  if (id === 'sitecontacts') { scLoad(); }
  if (id === 'brandkpis')    { bkLoad(); }
  if (id === 'brandchannels'){ bcLoad(); }
  if (id === 'campaignteam') { ctLoad().then(function(){ ctRenderList(); }); }
  if (id === 'history')      { historyLoad(); }
  if (id === 'data')         { renderDataPage(); }
}

/* ══ ADMIN CONFIG (brands + group + channels) ══ */
async function loadAdminCfg() {
  try {
    var r = await fetch(SUPA + '/admin_config?select=config&order=updated_at.desc&limit=1', { headers: getAuthHeaders() });
    if (!r.ok) return;
    var rows = await r.json();
    if (!rows || !rows.length || !rows[0].config) return;
    var cfg = rows[0].config;
    if (cfg.group)            STATE.group    = Object.assign({}, GROUP_DEFAULTS, cfg.group);
    if (cfg.brands && cfg.brands.length)   STATE.brands   = cfg.brands;
    if (cfg.channels && cfg.channels.length) STATE.channels = cfg.channels;
    if (cfg.kpis && cfg.kpis.length)     STATE.kpis     = cfg.kpis;
  } catch(e) { console.warn('loadAdminCfg:', e); }
}

async function saveAll() {
  var btn = document.getElementById('save-all-btn');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled = true; }
  collectGroupForm();
  collectChannelForm();
  var payload = { group: STATE.group, brands: STATE.brands, channels: STATE.channels, kpis: STATE.kpis };
  try {
    var sess = await SB.auth.getUser();
    var uid = sess.data.user.id;
    var r = await fetch(SUPA + '/admin_config', {
      method: 'POST',
      headers: getAuthHeaders({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),
      body: JSON.stringify([{ user_id: uid, config: payload, updated_at: new Date().toISOString() }])
    });
    if (!r.ok) throw new Error(await r.text());
    showToast('Saved ✓', 'success');
    if (typeof applyAdminConfig === 'function') applyAdminConfig(payload);
    var el = document.getElementById('last-saved');
    if (el) el.textContent = 'Last saved: ' + new Date().toLocaleTimeString('en-GB');
  } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
  if (btn) { btn.textContent = 'Save all'; btn.disabled = false; }
}

/* ══ DASHBOARD ══ */
async function refreshDashboard() {
  // Load site budgets if not already loaded
  if (!Object.keys(SB_SITE_DATA).length) await loadSiteBudgetsForDash();
  var totalBudget = 0;
  SB_SITES.forEach(function(site) {
    var d = SB_SITE_DATA[site.site_id] || {};
    totalBudget += d.annual_planned || 0;
  });
  if (!totalBudget) totalBudget = STATE.brands.reduce(function(s,b){return s+(b.budget||0);},0);
  var totalUnits = STATE.brands.filter(function(b){return b.id!=='motormatch';}).reduce(function(s,b){return s+(b.newUnits||0);},0);
  var totalLeads = STATE.brands.reduce(function(s,b){return s+(b.leads||0);},0);
  var avgEV = Math.round(STATE.brands.filter(function(b){return b.id!=='motormatch';}).reduce(function(s,b){return s+(b.evPct||0);},0)/11);

  var el = document.getElementById('dash-metrics');
  if (el) el.innerHTML = [
    {label:'Group annual budget', val:'£'+(totalBudget/1000000).toFixed(2)+'M', color:'var(--swansway)'},
    {label:'New car/van target', val:totalUnits.toLocaleString(), color:'#C8102E'},
    {label:'Leads/month target', val:totalLeads.toLocaleString(), color:'#059669'},
    {label:'Avg EV target', val:avgEV+'%', color:'#7C3AED'},
  ].map(function(m){
    return '<div class="admin-metric" style="border-top:3px solid '+m.color+'"><div class="admin-metric-label">'+m.label+'</div><div class="admin-metric-val" style="color:'+m.color+'">'+m.val+'</div></div>';
  }).join('');

  var tbl = document.getElementById('dash-brand-table');
  if (tbl) {
    tbl.innerHTML = '<thead><tr><th>Brand</th><th>Budget</th><th>New cars</th><th>Leads/mo</th><th>EV %</th><th>CPL £</th><th>Conv %</th></tr></thead>'
      + '<tbody>' + STATE.brands.map(function(b){
        return '<tr onclick=\"showPage(\'brand\');renderBrandEditor(\''+b.id+'\')" style="cursor:pointer">'
          +'<td><span class="brand-dot" style="background:'+BRAND_COLORS[b.id]+'"></span><strong>'+b.name+'</strong></td>'
          +'<td>£'+(b.budget||0).toLocaleString()+'</td>'
          +'<td>'+(b.newUnits||0).toLocaleString()+'</td>'
          +'<td>'+(b.leads||0).toLocaleString()+'</td>'
          +'<td>'+(b.evPct||0)+'%</td>'
          +'<td>£'+(b.cpl||0)+'</td>'
          +'<td>'+(b.convRate||0)+'%</td></tr>';
      }).join('') + '</tbody>';
  }
}

/* ══ GROUP SETTINGS ══ */
function populateGroupForm() {
  var g = STATE.group;
  var fields = ['name','year','desc','budget','evPct','coopPct','units','leads','evSales','conv','retention','nps','cpl'];
  fields.forEach(function(f) {
    var el = document.getElementById('gs-'+f);
    if (el) el.value = g[f] || '';
  });
}
function collectGroupForm() {
  var g = STATE.group;
  var numFields = ['budget','evPct','coopPct','units','leads','evSales','conv','retention','nps','cpl'];
  var strFields = ['name','year','desc'];
  numFields.forEach(function(f) {
    var el = document.getElementById('gs-'+f);
    if (el) g[f] = parseFloat(el.value)||0;
  });
  strFields.forEach(function(f) {
    var el = document.getElementById('gs-'+f);
    if (el) g[f] = el.value;
  });
}

/* ══ BRAND EDITOR ══ */
function renderBrandEditor(id) {
  var b = STATE.brands.find(function(x){return x.id===id;});
  if (!b) return;
  // Highlight active brand tab
  document.querySelectorAll('[data-brand-tab]').forEach(function(t){
    t.style.fontWeight = t.dataset.brandTab === id ? '800' : '';
    t.style.color = t.dataset.brandTab === id ? BRAND_COLORS[id] : '';
  });
  var c = document.getElementById('brand-page-content');
  if (!c) return;
  c.innerHTML = '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:10px">'
    + '<div><div style="font-family:var(--font-d);font-size:22px;font-weight:800;color:'+BRAND_COLORS[id]+'">'+b.name+'</div>'
    + '<div style="font-size:13px;color:var(--ink-soft)">'+b.segment+' · '+b.sites+' site'+(b.sites>1?'s':'')+' · '+(b.sitenames||'')+'</div></div>'
    + '<div style="display:flex;gap:8px">'
    + '<button class="btn btn-accent" onclick=\"saveBrand(\''+id+'\')\">Save '+b.name+'</button>'
    + '</div></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">'
    + '<div class="admin-card"><h3 class="admin-card-title">Budget & Financial Targets</h3>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    + brandField('Annual budget (£)', 'b-'+id+'-budget', b.budget, 'number')
    + brandField('New car/van target', 'b-'+id+'-newUnits', b.newUnits, 'number')
    + brandField('EV/PHEV target (%)', 'b-'+id+'-evPct', b.evPct, 'number')
    + brandField('Leads per month', 'b-'+id+'-leads', b.leads, 'number')
    + brandField('CPL target (£)', 'b-'+id+'-cpl', b.cpl, 'number')
    + brandField('Conversion rate (%)', 'b-'+id+'-convRate', b.convRate, 'number')
    + brandField('Used car target', 'b-'+id+'-usedUnits', b.usedUnits, 'number')
    + brandField('Fleet target', 'b-'+id+'-fleetUnits', b.fleetUnits, 'number')
    + brandField('Retention (%)', 'b-'+id+'-retention', b.retention, 'number')
    + brandField('NPS target', 'b-'+id+'-nps', b.nps, 'number')
    + '</div></div>'
    + '<div class="admin-card"><h3 class="admin-card-title">Identity & Focus</h3>'
    + '<div style="display:grid;gap:10px">'
    + brandField('Brand name', 'b-'+id+'-name', b.name, 'text')
    + brandField('Segment', 'b-'+id+'-segment', b.segment, 'text')
    + brandField('Site names', 'b-'+id+'-sitenames', b.sitenames, 'text')
    + brandField('Q2/Current focus', 'b-'+id+'-q2Focus', b.q2Focus, 'text')
    + '</div></div></div>';
}

function brandField(label, id, value, type) {
  return '<div><div class="admin-field-label">'+label+'</div>'
    + '<input class="admin-input" id="'+id+'" type="'+type+'" value="'+(value||'')+'" style="width:100%"></div>';
}

function saveBrand(id) {
  var b = STATE.brands.find(function(x){return x.id===id;});
  if (!b) return;
  var numFields = ['budget','newUnits','evPct','leads','cpl','convRate','usedUnits','fleetUnits','retention','nps'];
  var strFields = ['name','segment','sitenames','q2Focus'];
  numFields.forEach(function(f) {
    var el = document.getElementById('b-'+id+'-'+f);
    if (el) b[f] = parseFloat(el.value)||0;
  });
  strFields.forEach(function(f) {
    var el = document.getElementById('b-'+id+'-'+f);
    if (el) b[f] = el.value;
  });
  saveAll();
}

/* ══ CHANNEL MIX ══ */
function renderChannelEditor() {
  var el = document.getElementById('channel-editor-rows');
  if (!el) return;
  var totalBudget = STATE.brands.reduce(function(s,b){return s+(b.budget||0);},0);
  el.innerHTML = '';
  STATE.channels.forEach(function(c, i) {
    var val = totalBudget ? Math.round(totalBudget * c.pct / 100) : 0;
    var row = document.createElement('div');
    row.className = 'channel-row';
    row.innerHTML = '<input type="color" value="'+(c.color||'#333')+'" style="width:28px;height:28px;border:none;border-radius:3px;cursor:pointer" onchange="STATE.channels['+i+'].color=this.value">'
      + '<input class="admin-input" style="flex:2" type="text" value="'+(c.name||'')+'" onchange="STATE.channels['+i+'].name=this.value" placeholder="Channel name">'
      + '<div style="display:flex;align-items:center;gap:6px;flex:1">'
      + '<input type="range" min="0" max="60" value="'+(c.pct||0)+'" style="flex:1" oninput="STATE.channels['+i+'].pct=parseInt(this.value);this.nextElementSibling.textContent=this.value+'%';updateChannelTotals()">'
      + '<span style="font-family:var(--font-m);font-size:12px;font-weight:700;min-width:36px">'+(c.pct||0)+'%</span></div>'
      + '<span style="font-family:var(--font-m);font-size:12px;color:var(--ink-soft);min-width:70px">'+(val>0?'£'+val.toLocaleString():'—')+'</span>'
      + '<input class="admin-input" style="flex:2" type="text" value="'+(c.note||'')+'" onchange="STATE.channels['+i+'].note=this.value" placeholder="Notes">'
      + '<button class="btn-sm btn-danger" onclick="STATE.channels.splice('+i+',1);renderChannelEditor()">✕</button>';
    el.appendChild(row);
  });
  updateChannelTotals();
}
function updateChannelTotals() {
  var total = STATE.channels.reduce(function(s,c){return s+(parseFloat(c.pct)||0);},0);
  var el = document.getElementById('channel-total');
  if (el) { el.textContent = Math.round(total)+'%'; el.style.color = Math.abs(total-100)<1?'#059669':'#DC2626'; }
}
function normaliseChannels() {
  var total = STATE.channels.reduce(function(s,c){return s+(parseFloat(c.pct)||0);},0);
  if (!total) return;
  STATE.channels.forEach(function(c){c.pct = Math.round(c.pct/total*100);});
  renderChannelEditor();
}
function addChannel() {
  STATE.channels.push({name:'New channel',pct:0,color:'#6B7280',note:''});
  renderChannelEditor();
}
function collectChannelForm() { /* channels are updated live via oninput */ }

/* ══ SITE BUDGETS ══ */
async function sbLoad() {
  var el = document.getElementById('sb-tbody');
  if (el) el.innerHTML = '<tr><td colspan="26" style="padding:20px;text-align:center;color:var(--ink-soft)">Loading…</td></tr>';
  try {
    var r = await fetch(SUPA + '/site_budgets?select=*', { headers: getAuthHeaders() });
    console.log('sbLoad status:', r.status);
    if (!r.ok) {
      var err = await r.text();
      console.warn('sbLoad error:', err);
      if (el) el.innerHTML = '<tr><td colspan="26" style="padding:20px;color:#C8102E">Error loading budgets: ' + r.status + '</td></tr>';
      return;
    }
    var rows = await r.json();
    console.log('sbLoad rows:', rows.length);
    SB_SITE_DATA = {};
    rows.forEach(function(row) { SB_SITE_DATA[row.site_id] = row; });
    sbRenderTable(SB_CURRENT_BRAND);
    sbUpdateMetrics(SB_CURRENT_BRAND);
  } catch(e) {
    console.warn('sbLoad:', e);
    if (el) el.innerHTML = '<tr><td colspan="26" style="padding:20px;color:#C8102E">Error: ' + e.message + '</td></tr>';
  }
}
function sbSelectBrand(brandId) {
  SB_CURRENT_BRAND = brandId;
  document.querySelectorAll('[data-sb-brand]').forEach(function(t){
    t.className = 'brand-tab-btn' + (t.dataset.sbBrand===brandId?' active':'');
  });
  sbRenderTable(brandId);
}
function sbRenderTable(brandId) {
  var thead = document.getElementById('sb-thead');
  var tbody = document.getElementById('sb-tbody');
  var metrics = document.getElementById('sb-metrics');
  if (!tbody) return;
  var sites = SB_SITES.filter(function(s){return s.brand_id===brandId;});
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  if (thead) {
    thead.innerHTML = '<tr><th>Site</th><th>Annual</th>'
      + months.map(function(m){return '<th>'+m+' Plan</th>';}).join('')
      + months.map(function(m){return '<th style="background:rgba(26,46,74,0.06)">'+m+' Act</th>';}).join('')
      + '</tr>';
  }
  tbody.innerHTML = '';
  var totalPlan=0, totalActual=0;
  sites.forEach(function(site) {
    var d = SB_SITE_DATA[site.site_id] || {};
    var tr = document.createElement('tr');
    var annPlan = 0;
    for (var i=0;i<12;i++) annPlan += (d['m'+i+'_planned']||0);
    d.annual_planned = annPlan || (d.annual_planned||0);
    totalPlan += d.annual_planned||0;
    for (var i=0;i<12;i++) totalActual += (d['m'+i+'_actual']||0);

    tr.innerHTML = '<td style="font-weight:600;white-space:nowrap">'+site.site_name+'</td>'
      + '<td style="font-family:var(--font-m);font-weight:700;color:var(--swansway);white-space:nowrap">£'+(d.annual_planned||0).toLocaleString()+'</td>'
      + months.map(function(m,i){
          return '<td><input class="admin-input admin-input-sm" type="number" value="'+(d['m'+i+'_planned']||0)+'" data-site="'+site.site_id+'" data-field="m'+i+'_planned" onchange="sbSetVal(this)"></td>';
        }).join('')
      + months.map(function(m,i){
          return '<td style="background:rgba(26,46,74,0.03)"><input class="admin-input admin-input-sm" type="number" value="'+(d['m'+i+'_actual']||0)+'" data-site="'+site.site_id+'" data-field="m'+i+'_actual" onchange="sbSetVal(this)"></td>';
        }).join('');
    tbody.appendChild(tr);
  });
  if (metrics) metrics.innerHTML = [
    {l:'Planned total',v:'£'+totalPlan.toLocaleString(),c:'var(--swansway)'},
    {l:'Actual YTD',v:totalActual>0?'£'+totalActual.toLocaleString():'—',c:'#059669'},
    {l:'Variance',v:totalActual>0?(totalActual>=totalPlan?'+':'')+'£'+Math.abs(totalActual-totalPlan).toLocaleString():'—',c:totalActual>totalPlan?'#DC2626':'#059669'},
    {l:'Sites',v:sites.length,c:'#6B7280'},
  ].map(function(m){return '<div class="admin-metric" style="border-top-color:'+m.c+'"><div class="admin-metric-label">'+m.l+'</div><div class="admin-metric-val" style="color:'+m.c+'">'+m.v+'</div></div>';}).join('');
}
function sbSetVal(inp) {
  var sid = inp.dataset.site, field = inp.dataset.field;
  if (!SB_SITE_DATA[sid]) SB_SITE_DATA[sid] = {site_id:sid};
  SB_SITE_DATA[sid][field] = parseFloat(inp.value)||0;
  // Recalc annual
  var total = 0;
  for (var i=0;i<12;i++) total += SB_SITE_DATA[sid]['m'+i+'_planned']||0;
  SB_SITE_DATA[sid].annual_planned = total;
  sbRenderTable(SB_CURRENT_BRAND);
}
async function sbSave() {
  var btn = document.getElementById('sb-save-btn');
  if (btn) { btn.textContent = 'Saving…'; btn.disabled=true; }
  try {
    var rows = SB_SITES.map(function(site) {
      var d = SB_SITE_DATA[site.site_id] || {};
      var row = {site_id:site.site_id,site_name:site.site_name,brand_id:site.brand_id,brand_name:site.brand_name,annual_planned:d.annual_planned||0,updated_at:new Date().toISOString()};
      for (var i=0;i<12;i++) { row['m'+i+'_planned']=d['m'+i+'_planned']||0; row['m'+i+'_actual']=d['m'+i+'_actual']||0; }
      return row;
    });
    var r = await fetch(SUPA + '/site_budgets', {
      method:'POST',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),
      body:JSON.stringify(rows)
    });
    if (!r.ok) throw new Error(await r.text());
    showToast('Site budgets saved ✓','success');
  } catch(e) { showToast('Save error: '+e.message,'error'); }
  if (btn) { btn.textContent='Save budgets'; btn.disabled=false; }
}

/* ══ SITE KPIs ══ */
async function skLoad() {
  try {
    var r = await fetch(SUPA + '/site_kpis?select=*', { headers: getAuthHeaders() });
    if (!r.ok) return;
    var rows = await r.json();
    rows.forEach(function(row) { SK_SITE_DATA[row.site_id] = row; });
    skRenderContent(SK_CURRENT_BRAND);
  } catch(e) { console.warn('skLoad:', e); }
}
function skSelectBrand(brandId) {
  SK_CURRENT_BRAND = brandId;
  document.querySelectorAll('[data-sk-brand]').forEach(function(t){
    t.className = 'brand-tab-btn' + (t.dataset.skBrand===brandId?' active':'');
  });
  skRenderContent(brandId);
}
function skRenderContent(brandId) {
  var el = document.getElementById('sk-content');
  if (!el) return;
  var sites = SB_SITES.filter(function(s){return s.brand_id===brandId;});
  el.innerHTML = '';
  sites.forEach(function(site) {
    var d = SK_SITE_DATA[site.site_id] || {};
    var sec = document.createElement('div');
    sec.style.cssText = 'border-bottom:2px solid var(--border);padding:18px 20px';
    var hdr = document.createElement('div');
    hdr.style.cssText = 'font-family:var(--font-d);font-size:14px;font-weight:700;margin-bottom:12px';
    hdr.textContent = site.site_name;
    sec.appendChild(hdr);
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px';
    var lbl = document.createElement('div');
    lbl.style.cssText = 'grid-column:1/-1;font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px';
    lbl.textContent = 'Annual targets';
    grid.appendChild(lbl);
    SK_TARGETS.forEach(function(t) {
      var wrap = document.createElement('div');
      var lbl2 = document.createElement('label');
      lbl2.style.cssText = 'font-size:10px;color:var(--ink-soft);display:block;margin-bottom:3px';
      lbl2.textContent = t.label;
      var inp = document.createElement('input');
      inp.type='number'; inp.min='0'; inp.value=d[t.key]||0;
      inp.style.cssText='width:100%;padding:4px 7px;border:1px solid var(--border);border-radius:2px;font-size:12px;font-family:var(--font-m)';
      inp.dataset.siteId=site.site_id; inp.dataset.field=t.key;
      inp.addEventListener('change',function(){skSetVal(this.dataset.siteId,this.dataset.field,this.value);});
      wrap.appendChild(lbl2); wrap.appendChild(inp); grid.appendChild(wrap);
    });
    sec.appendChild(grid);
    el.appendChild(sec);
  });
}
function skSetVal(sid, field, value) {
  if (!SK_SITE_DATA[sid]) SK_SITE_DATA[sid] = {site_id:sid};
  SK_SITE_DATA[sid][field] = parseFloat(value)||0;
}
async function skSave() {
  var btn = document.getElementById('sk-save-btn');
  if (btn) { btn.textContent='Saving…'; btn.disabled=true; }
  try {
    var rows = SB_SITES.map(function(site) {
      var d = SK_SITE_DATA[site.site_id] || {};
      var row = {site_id:site.site_id,site_name:site.site_name,brand_id:site.brand_id,brand_name:site.brand_name,updated_at:new Date().toISOString()};
      SK_TARGETS.forEach(function(t){row[t.key]=d[t.key]||0;});
      return row;
    });
    var r = await fetch(SUPA + '/site_kpis', {
      method:'POST',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),
      body:JSON.stringify(rows)
    });
    if (!r.ok) throw new Error(await r.text());
    showToast('Site KPIs saved ✓','success');
  } catch(e) { showToast('Save error: '+e.message,'error'); }
  if (btn) { btn.textContent='Save KPIs'; btn.disabled=false; }
}

/* ══ SITE DIRECTORY ══ */
const SC_MANAGERS = [{key:'general_manager',label:'General Manager'},{key:'head_of_business',label:'Head of Business'},{key:'sales_manager',label:'Sales Manager'},{key:'service_manager',label:'Service Manager'},{key:'parts_manager',label:'Parts Manager'}];
async function scLoad() {
  try {
    var r = await fetch(SUPA + '/site_contacts?select=*', { headers: getAuthHeaders() });
    if (!r.ok) return;
    var rows = await r.json();
    rows.forEach(function(row) { SC_DATA[row.site_id] = row; });
    scRenderContent(SC_CURRENT_BRAND);
  } catch(e) { console.warn('scLoad:', e); }
}
function scSelectBrand(brandId) {
  SC_CURRENT_BRAND = brandId;
  document.querySelectorAll('[data-sc-brand]').forEach(function(t){
    t.className = 'brand-tab-btn' + (t.dataset.scBrand===brandId?' active':'');
  });
  scRenderContent(brandId);
}
function scRenderContent(brandId) {
  var el = document.getElementById('sc-content');
  if (!el) return;
  var sites = SB_SITES.filter(function(s){return s.brand_id===brandId;});
  el.innerHTML = '';
  sites.forEach(function(site, si) {
    var d = SC_DATA[site.site_id] || {};
    var sec = document.createElement('div');
    sec.style.cssText = 'border-bottom:2px solid var(--border);padding:20px;' + (si%2===0?'':'background:var(--surface)');
    var hdr = document.createElement('div');
    hdr.style.cssText = 'font-family:var(--font-d);font-size:15px;font-weight:700;margin-bottom:14px';
    hdr.textContent = site.site_name;
    sec.appendChild(hdr);
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px';
    [['Address',(d.address||'')+(d.town?', '+d.town:'')+(d.postcode?', '+d.postcode:'')],['Phone',d.phone||''],['Website',d.website_url?'<a href="'+d.website_url+'" target="_blank" style="color:var(--swansway);font-size:11px">View site</a>':'—']]
    .forEach(function(item){
      var box=document.createElement('div'); box.style.cssText='background:var(--white);border:1px solid var(--border);border-radius:3px;padding:10px 12px';
      var l=document.createElement('div'); l.style.cssText='font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px'; l.textContent=item[0];
      var v=document.createElement('div'); v.style.cssText='font-size:12px;color:var(--ink)'; v.innerHTML=item[1]||'<span style="color:var(--ink-faint)">—</span>';
      box.appendChild(l); box.appendChild(v); grid.appendChild(box);
    });
    sec.appendChild(grid);
    var mgGrid = document.createElement('div');
    mgGrid.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:8px';
    SC_MANAGERS.forEach(function(mg){
      var wrap=document.createElement('div');
      var lbl=document.createElement('label'); lbl.style.cssText='font-size:10px;color:var(--ink-soft);display:block;margin-bottom:3px'; lbl.textContent=mg.label;
      var inp=document.createElement('input'); inp.type='text'; inp.value=d[mg.key]||'';
      inp.style.cssText='width:100%;padding:5px 8px;border:1px solid var(--border);border-radius:3px;font-size:12px';
      inp.dataset.siteId=site.site_id; inp.dataset.field=mg.key;
      inp.addEventListener('change',function(){scSetVal(this.dataset.siteId,this.dataset.field,this.value);});
      wrap.appendChild(lbl); wrap.appendChild(inp); mgGrid.appendChild(wrap);
    });
    sec.appendChild(mgGrid);
    el.appendChild(sec);
  });
}
function scSetVal(sid, field, value) {
  if (!SC_DATA[sid]) SC_DATA[sid] = {site_id:sid};
  SC_DATA[sid][field] = value;
  // Set brand_id too
  var site = SB_SITES.find(function(s){return s.site_id===sid;});
  if (site) { SC_DATA[sid].brand_id = site.brand_id; SC_DATA[sid].site_name = site.site_name; }
}
async function scSave() {
  var btn = document.getElementById('sc-save-btn');
  if (btn) { btn.textContent='Saving…'; btn.disabled=true; }
  try {
    var rows = Object.keys(SC_DATA).map(function(sid){
      var d = SC_DATA[sid];
      return {site_id:sid,site_name:d.site_name||sid,brand_id:d.brand_id||'',general_manager:d.general_manager||'',head_of_business:d.head_of_business||'',sales_manager:d.sales_manager||'',service_manager:d.service_manager||'',parts_manager:d.parts_manager||'',updated_at:new Date().toISOString()};
    });
    var r = await fetch(SUPA + '/site_contacts', {
      method:'POST',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),
      body:JSON.stringify(rows)
    });
    if (!r.ok) throw new Error(await r.text());
    showToast('Site directory saved ✓','success');
  } catch(e) { showToast('Save error: '+e.message,'error'); }
  if (btn) { btn.textContent='Save directory'; btn.disabled=false; }
}

/* ══ BRAND KPIs ══ */
async function bkLoad() {
  try {
    var r = await fetch(SUPA + '/brand_kpis?select=*', { headers: getAuthHeaders() });
    if (!r.ok) return;
    var rows = await r.json();
    rows.forEach(function(row) { BK_DATA[row.brand_id] = row; });
    bkRenderContent(BK_CURRENT_BRAND);
  } catch(e) { console.warn('bkLoad:', e); }
}
function bkSelectBrand(brandId) {
  BK_CURRENT_BRAND = brandId;
  document.querySelectorAll('[data-bk-brand]').forEach(function(t){
    t.className = 'brand-tab-btn' + (t.dataset.bkBrand===brandId?' active':'');
  });
  bkRenderContent(brandId);
}
function bkRenderContent(brandId) {
  var el = document.getElementById('bk-content');
  if (!el) return;
  var d = BK_DATA[brandId] || {};
  el.innerHTML = '';
  BK_FIELDS.forEach(function(section) {
    var secDiv = document.createElement('div');
    secDiv.style.cssText = 'margin-bottom:1.5rem';
    var secLbl = document.createElement('div');
    secLbl.style.cssText = 'font-family:var(--font-m);font-size:10px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--border)';
    secLbl.textContent = section.section;
    secDiv.appendChild(secLbl);
    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:12px';
    section.fields.forEach(function(f) {
      var wrap = document.createElement('div');
      var lbl = document.createElement('label');
      lbl.style.cssText = 'font-size:11px;color:var(--ink-soft);display:block;margin-bottom:4px;font-weight:600';
      lbl.textContent = f.label;
      if (f.hint) { var hint = document.createElement('div'); hint.style.cssText='font-size:10px;color:var(--ink-faint);margin-bottom:4px'; hint.textContent=f.hint; wrap.appendChild(lbl); wrap.appendChild(hint); }
      else { wrap.appendChild(lbl); }
      var inp = document.createElement('input');
      inp.type=f.type||'text'; inp.min='0'; inp.value=d[f.key]||''; inp.placeholder='0';
      inp.style.cssText='width:100%;padding:6px 10px;border:1px solid var(--border);border-radius:3px;font-size:13px;font-family:var(--font-m);box-sizing:border-box';
      inp.dataset.brandId=brandId; inp.dataset.field=f.key;
      inp.addEventListener('input',function(){if(!BK_DATA[this.dataset.brandId])BK_DATA[this.dataset.brandId]={};BK_DATA[this.dataset.brandId][this.dataset.field]=parseFloat(this.value)||0;});
      wrap.appendChild(inp); grid.appendChild(wrap);
    });
    secDiv.appendChild(grid); el.appendChild(secDiv);
  });
}
async function bkSave() {
  var btn = document.getElementById('bk-save-btn');
  if (btn) { btn.textContent='Saving…'; btn.disabled=true; }
  var brandId = BK_CURRENT_BRAND;
  var d = BK_DATA[brandId] || {};
  var row = Object.assign({brand_id:brandId,brand_name:BRAND_NAMES[brandId],updated_at:new Date().toISOString()}, d);
  try {
    var r = await fetch(SUPA + '/brand_kpis', {
      method:'POST',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),
      body:JSON.stringify([row])
    });
    if (!r.ok) throw new Error(await r.text());
    showToast(BRAND_NAMES[brandId]+' KPIs saved ✓','success');
  } catch(e) { showToast('Save error: '+e.message,'error'); }
  if (btn) { btn.textContent='Save KPIs'; btn.disabled=false; }
}

/* ══ BRAND CHANNELS ══ */
async function bcLoad() {
  try {
    var r = await fetch(SUPA + '/brand_channels?select=*&order=brand_id,sort_order', { headers: getAuthHeaders() });
    if (!r.ok) return;
    var rows = await r.json();
    var grouped = {};
    rows.forEach(function(row){if(!grouped[row.brand_id])grouped[row.brand_id]=[];grouped[row.brand_id].push(row);});
    BRAND_IDS.forEach(function(id){if(!grouped[id])grouped[id]=BC_DEFAULT_CHANNELS.map(function(c){return Object.assign({brand_id:id},c);});});
    BC_DATA = grouped;
    bcRenderContent(BC_CURRENT_BRAND);
  } catch(e) { console.warn('bcLoad:', e); }
}
function bcSelectBrand(brandId) {
  BC_CURRENT_BRAND = brandId;
  document.querySelectorAll('[data-bc-brand]').forEach(function(t){
    t.className = 'brand-tab-btn' + (t.dataset.bcBrand===brandId?' active':'');
  });
  bcRenderContent(brandId);
}
function bcSetVal(brandId, idx, field, value) {
  if (!BC_DATA[brandId]) BC_DATA[brandId] = [];
  if (!BC_DATA[brandId][idx]) BC_DATA[brandId][idx] = {};
  BC_DATA[brandId][idx][field] = value;
}
function bcRenderContent(brandId) {
  var el = document.getElementById('bc-content');
  var sumEl = document.getElementById('bc-summary');
  if (!el) return;
  if (!BC_DATA[brandId]) BC_DATA[brandId] = BC_DEFAULT_CHANNELS.map(function(c){return Object.assign({brand_id:brandId},c);});
  var channels = BC_DATA[brandId];
  el.innerHTML = '';
  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:grid;grid-template-columns:36px 1fr 160px 1fr 36px;gap:12px;padding:10px 16px;background:var(--surface);font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em;border-bottom:1px solid var(--border)';
  ['','Channel','Allocation','Notes',''].forEach(function(h){var d=document.createElement('div');d.textContent=h;hdr.appendChild(d);});
  el.appendChild(hdr);
  var totalPct = 0;
  channels.forEach(function(ch, idx) {
    totalPct += parseFloat(ch.pct)||0;
    var row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:36px 1fr 160px 1fr 36px;gap:12px;padding:8px 16px;align-items:center;border-bottom:1px solid var(--border);background:'+(idx%2===0?'var(--white)':'var(--surface)');
    var sw=document.createElement('input'); sw.type='color'; sw.value=ch.color||'#333'; sw.style.cssText='width:28px;height:28px;border:none;border-radius:3px;cursor:pointer;padding:0'; sw.dataset.idx=idx; sw.dataset.brand=brandId; sw.dataset.field='color'; sw.addEventListener('input',function(){bcSetVal(this.dataset.brand,parseInt(this.dataset.idx),this.dataset.field,this.value);}); row.appendChild(sw);
    var ni=document.createElement('input'); ni.type='text'; ni.value=ch.channel||''; ni.style.cssText='width:100%;padding:5px 8px;border:1px solid var(--border);border-radius:3px;font-size:12px'; ni.dataset.idx=idx; ni.dataset.brand=brandId; ni.dataset.field='channel'; ni.addEventListener('input',function(){bcSetVal(this.dataset.brand,parseInt(this.dataset.idx),this.dataset.field,this.value);}); row.appendChild(ni);
    var pi=document.createElement('div'); pi.style.cssText='display:flex;align-items:center;gap:8px;min-width:0';
    var numInp=document.createElement('input'); numInp.type='number'; numInp.min='0'; numInp.max='100'; numInp.value=ch.pct||0;
    numInp.style.cssText='width:56px;padding:5px 7px;border:1px solid var(--border);border-radius:3px;font-family:var(--font-m);font-size:13px;font-weight:700;text-align:right;flex-shrink:0';
    numInp.dataset.idx=idx; numInp.dataset.brand=brandId;
    var pLabel=document.createElement('span'); pLabel.style.cssText='font-family:var(--font-m);font-size:12px;color:var(--ink-soft)'; pLabel.textContent='%';
    var range=document.createElement('input'); range.type='range'; range.min='0'; range.max='100'; range.value=ch.pct||0; range.style.cssText='flex:1;min-width:0';
    range.dataset.idx=idx; range.dataset.brand=brandId;
    range.addEventListener('input',function(){
      var v=parseInt(this.value);
      bcSetVal(this.dataset.brand,parseInt(this.dataset.idx),'pct',v);
      this.parentElement.querySelector('input[type=number]').value=v;
      bcUpdateTotal(this.dataset.brand);
    });
    numInp.addEventListener('change',function(){
      var v=parseFloat(this.value)||0;
      bcSetVal(this.dataset.brand,parseInt(this.dataset.idx),'pct',v);
      this.parentElement.querySelector('input[type=range]').value=v;
      bcUpdateTotal(this.dataset.brand);
    });
    pi.appendChild(numInp); pi.appendChild(pLabel); pi.appendChild(range); row.appendChild(pi);
    var no=document.createElement('input'); no.type='text'; no.value=ch.note||''; no.style.cssText='width:100%;padding:5px 8px;border:1px solid var(--border);border-radius:3px;font-size:12px'; no.dataset.idx=idx; no.dataset.brand=brandId; no.dataset.field='note'; no.addEventListener('input',function(){bcSetVal(this.dataset.brand,parseInt(this.dataset.idx),this.dataset.field,this.value);}); row.appendChild(no);
    var del=document.createElement('button'); del.className='btn-sm btn-danger'; del.textContent='✕'; del.onclick=(function(i,bid){return function(){BC_DATA[bid].splice(i,1);bcRenderContent(bid);};})(idx,brandId); row.appendChild(del);
    el.appendChild(row);
  });
  if (sumEl) { var tot=Math.round(totalPct); sumEl.textContent='Total: '+tot+'%'; sumEl.style.color=Math.abs(tot-100)<1?'#059669':'#DC2626'; }
}
function bcUpdateTotal(brandId) {
  var tot = (BC_DATA[brandId]||[]).reduce(function(s,c){return s+(parseFloat(c.pct)||0);},0);
  var el = document.getElementById('bc-summary');
  if (el) { el.textContent='Total: '+Math.round(tot)+'%'; el.style.color=Math.abs(tot-100)<1?'#059669':'#DC2626'; }
}
function bcAddChannel(brandId) {
  if (!BC_DATA[brandId]) BC_DATA[brandId]=[];
  BC_DATA[brandId].push({brand_id:brandId,channel:'New channel',pct:0,color:'#6B7280',note:''});
  bcRenderContent(brandId);
}
async function bcSave() {
  var btn = document.getElementById('bc-save-btn');
  if (btn) { btn.textContent='Saving…'; btn.disabled=true; }
  var brandId = BC_CURRENT_BRAND;
  var channels = BC_DATA[brandId] || [];
  try {
    await fetch(SUPA + '/brand_channels?brand_id=eq.'+brandId, {method:'DELETE',headers:getAuthHeaders()});
    var rows = channels.map(function(ch,i){return {brand_id:brandId,channel:ch.channel||'',pct:parseFloat(ch.pct)||0,color:ch.color||'#333',note:ch.note||'',sort_order:i};});
    var r = await fetch(SUPA + '/brand_channels', {
      method:'POST',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
      body:JSON.stringify(rows)
    });
    if (!r.ok) throw new Error(await r.text());
    showToast(BRAND_NAMES[brandId]+' channels saved ✓','success');
  } catch(e) { showToast('Save error: '+e.message,'error'); }
  if (btn) { btn.textContent='Save channels'; btn.disabled=false; }
}

/* ══ CAMPAIGN TEAM ══ */
async function ctLoad() {
  try {
    var results = await Promise.all([
      fetch(SUPA + '/campaign_team?select=*&order=name', {headers:getAuthHeaders()}).then(function(r){return r.json();}),
      fetch(SUPA + '/campaign_permissions?select=*', {headers:getAuthHeaders()}).then(function(r){return r.json();})
    ]);
    CT_MEMBERS = {};
    (results[0]||[]).forEach(function(m){CT_MEMBERS[m.id]=m;});
    CT_PERMISSIONS = {};
    (results[1]||[]).forEach(function(p){CT_PERMISSIONS[p.team_member_id]=p;});
  } catch(e) { console.warn('ctLoad:', e); }
}
function ctRenderList() {
  var el = document.getElementById('ct-team-list');
  if (!el) return;
  var members = Object.values(CT_MEMBERS);
  if (!members.length) { el.innerHTML='<div style="padding:20px;color:var(--ink-faint);font-size:13px">No team members yet. Add one below.</div>'; return; }
  el.innerHTML = '';
  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr 100px 140px 120px;gap:8px;padding:8px 20px;background:var(--surface);font-family:var(--font-m);font-size:9px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:0.08em';
  hdr.innerHTML = '<div>Name</div><div>Role</div><div>Email</div><div>Status</div><div>Permissions</div><div></div>';
  el.appendChild(hdr);
  members.forEach(function(m, idx) {
    var perms = CT_PERMISSIONS[m.id] || {};
    var permBadge = perms.can_approve_all ? '<span style="font-size:9px;background:#059669;color:#fff;padding:1px 6px;border-radius:8px">Full approver</span>'
      : perms.can_approve_digital ? '<span style="font-size:9px;background:#2563EB;color:#fff;padding:1px 6px;border-radius:8px">Digital approver</span>' : '<span style="font-size:9px;color:var(--ink-faint)">No special perms</span>';
    var row = document.createElement('div');
    row.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr 100px 140px 120px;gap:8px;padding:12px 20px;align-items:center;border-bottom:1px solid var(--border);background:'+(idx%2===0?'var(--white)':'var(--surface)');
    row.innerHTML = '<div style="font-weight:700;font-size:13px">'+m.name+'</div>'
      +'<div style="font-size:12px;color:var(--ink-soft)">'+(m.role||'—')+'</div>'
      +'<div style="font-size:12px;color:var(--ink-soft)">'+(m.email||'—')+'</div>'
      +'<div><span style="font-size:11px;padding:2px 8px;border-radius:10px;background:'+(m.active?'#D1FAE5':'#FEE2E2')+';color:'+(m.active?'#059669':'#DC2626')+'">'+(m.active?'Active':'Inactive')+'</span></div>'
      +'<div>'+permBadge+'</div>'
      +'<div style="display:flex;gap:4px"><button class="btn-sm" data-id="'+m.id+'" onclick="ctEdit(this.getAttribute(\"data-id\"))">Edit</button> <button class="btn-sm btn-danger" data-id="'+m.id+'" onclick="ctDelete(this.getAttribute(\"data-id\"))">\u2715</button></div>';
    el.appendChild(row);
  });
}
function ctEdit(id) {
  CT_SELECTED = id;
  var m = CT_MEMBERS[id] || {};
  var perms = CT_PERMISSIONS[id] || {};
  var form = document.getElementById('ct-form');
  if (!form) return;
  form.style.display = 'block';
  form.innerHTML = '<h3 style="font-family:var(--font-d);font-size:16px;font-weight:700;margin-bottom:16px">Edit '+(m.name||'member')+'</h3>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'
    + ctField('Name','ct-name',m.name||'','text','Full name')
    + ctField('Email','ct-email',m.email||'','email','name@swansway.co.uk')
    + ctField('Role','ct-role',m.role||'','text','e.g. Head of Marketing')
    + '<div><div class="admin-field-label">Active</div><label style="display:flex;align-items:center;gap:6px;margin-top:8px"><input type="checkbox" id="ct-active" '+(m.active?'checked':'')+'>Active member</label></div>'
    + '</div>'
    + '<div style="margin-bottom:16px"><div class="admin-field-label" style="margin-bottom:10px">Permissions</div>'
    + CT_PERM_LABELS.map(function(p){
        return '<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px"><input type="checkbox" id="perm-'+p.key+'" '+(perms[p.key]?'checked':'')+'><div><div style="font-weight:600">'+p.label+'</div><div style="font-size:11px;color:var(--ink-soft)">'+p.desc+'</div></div></label>';
      }).join('')
    + '<label style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:13px;border-top:1px solid var(--border);padding-top:12px;margin-top:4px"><input type="checkbox" id="perm-is_admin" '+(perms.is_admin?'checked':'')+'><div><div style="font-weight:700;color:var(--swansway)">Admin access</div><div style="font-size:11px;color:var(--ink-soft)">Can access the Admin section of the portal</div></div></label>'
    + '</div>'
    + '<div style="display:flex;gap:8px"><button class="btn btn-accent" onclick="ctSave()">Save</button><button class="btn" onclick="ctCancelForm()">Cancel</button></div>';
}
function ctField(label, id, value, type, placeholder) {
  return '<div><div class="admin-field-label">'+label+'</div><input class="admin-input" id="'+id+'" type="'+type+'" value="'+(value||'')+'" placeholder="'+(placeholder||'')+'" style="width:100%"></div>';
}
function ctCancelForm() { var f=document.getElementById("ct-form"); if(f) f.style.display="none"; }

async function ctSave() {
  var id = CT_SELECTED;
  if (!id) return;
  var m = Object.assign({}, CT_MEMBERS[id]||{});
  m.name = document.getElementById('ct-name').value;
  m.email = document.getElementById('ct-email').value;
  m.role = document.getElementById('ct-role').value;
  m.active = document.getElementById('ct-active').checked;
  CT_MEMBERS[id] = m;
  var perms = {team_member_id:id};
  CT_PERM_LABELS.forEach(function(p){
    var el = document.getElementById('perm-'+p.key);
    perms[p.key] = el ? el.checked : false;
  });
  var isAdminEl = document.getElementById('perm-is_admin');
  perms.is_admin = isAdminEl ? isAdminEl.checked : false;
  CT_PERMISSIONS[id] = perms;
  try {
    await fetch(SUPA + '/campaign_team?id=eq.'+id, {method:'PATCH',headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({name:m.name,role:m.role,email:m.email,active:m.active,updated_at:new Date().toISOString()})});
    await fetch(SUPA + '/campaign_permissions', {method:'POST',headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify([perms])});
    showToast(m.name+' saved ✓','success');
    document.getElementById('ct-form').style.display='none';
    ctRenderList();
  } catch(e) { showToast('Save error: '+e.message,'error'); }
}
async function ctAddMember() {
  var name = prompt('New team member full name:');
  if (!name||!name.trim()) return;
  var role = prompt('Their role (e.g. Marketing Manager):') || '';
  var email = prompt('Email address (optional):') || '';
  var id = name.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,'');
  try {
    var r = await fetch(SUPA + '/campaign_team', {
      method:'POST',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=representation'}),
      body:JSON.stringify([{id:id,name:name.trim(),role:role.trim(),email:email.trim(),active:true}])
    });
    if (!r.ok) throw new Error(await r.text());
    var rows = await r.json();
    CT_MEMBERS[id] = rows[0];
    showToast(name.trim()+' added ✓','success');
    ctRenderList();
  } catch(e) { showToast('Error: '+e.message,'error'); }
}
async function ctDelete(id) {
  var m = CT_MEMBERS[id];
  if (!confirm('Remove '+(m?m.name:id)+' from the team?')) return;
  await fetch(SUPA + '/campaign_team?id=eq.'+id, {method:'DELETE',headers:getAuthHeaders()});
  delete CT_MEMBERS[id];
  delete CT_PERMISSIONS[id];
  ctRenderList();
  showToast('Team member removed','success');
}

/* ══ HISTORY ══ */
async function historyLoad() {
  try {
    var r = await fetch(SUPA + '/admin_snapshots?select=*&order=created_at.desc&limit=20', {headers:getAuthHeaders()});
    if (!r.ok) return;
    var rows = await r.json();
    var el = document.getElementById('history-list');
    if (!el) return;
    if (!rows.length) { el.innerHTML='<div style="padding:20px;color:var(--ink-faint)">No snapshots yet.</div>'; return; }
    el.innerHTML = '<table class="admin-table"><thead><tr><th>Label</th><th>Date</th><th>Action</th></tr></thead><tbody>'
      + rows.map(function(row){
          return '<tr><td><strong>'+row.label+'</strong></td><td style="color:var(--ink-soft);font-size:12px">'+new Date(row.created_at).toLocaleString('en-GB')+'</td>'
            +'<td><button class="btn-sm" onclick="historyRestore(this.getAttribute(\'data-id\'))" data-id="'+row.id+'">Restore</button></td></tr>';
        }).join('')
      + '</tbody></table>';
  } catch(e) {}
}
async function takeSnapshot() {
  var label = prompt('Snapshot label:');
  if (!label) return;
  collectGroupForm(); collectChannelForm();
  var payload = {group:STATE.group,brands:STATE.brands,channels:STATE.channels,kpis:STATE.kpis};
  var sess = await SB.auth.getUser();
  await fetch(SUPA + '/admin_snapshots', {
    method:'POST',
    headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
    body:JSON.stringify([{user_id:sess.data.user.id,label:label,config:payload}])
  });
  showToast('Snapshot saved ✓','success');
  historyLoad();
}
async function historyRestore(id) {
  if (!confirm('Restore this snapshot? This will overwrite current config.')) return;
  var r = await fetch(SUPA + '/admin_snapshots?id=eq.'+id+'&select=config', {headers:getAuthHeaders()});
  var rows = await r.json();
  if (!rows||!rows.length) return;
  var cfg = rows[0].config;
  if (cfg.group)    STATE.group    = Object.assign({},GROUP_DEFAULTS,cfg.group);
  if (cfg.brands&&cfg.brands.length)   STATE.brands   = cfg.brands;
  if (cfg.channels&&cfg.channels.length) STATE.channels = cfg.channels;
  if (cfg.kpis&&cfg.kpis.length)     STATE.kpis     = cfg.kpis;
  await saveAll();
  showToast('Snapshot restored ✓','success');
  refreshDashboard();
}

/* ══ DATA & EXPORT ══ */
function renderDataPage() {}
function exportConfig() {
  collectGroupForm(); collectChannelForm();
  var payload = {group:STATE.group,brands:STATE.brands,channels:STATE.channels,kpis:STATE.kpis};
  var blob = new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  var a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='swansway-admin-config.json'; a.click();
}
function exportCSV() {
  var rows = [['Brand','Budget','New Units','EV%','Leads/mo','CPL','Conv%','Retention%','NPS']];
  STATE.brands.forEach(function(b){rows.push([b.name,b.budget,b.newUnits,b.evPct,b.leads,b.cpl,b.convRate,b.retention,b.nps]);});
  var csv = rows.map(function(r){return r.join(',');}).join('\n');
  var blob = new Blob([csv],{type:'text/csv'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='swansway-kpis.csv'; a.click();
}
function triggerImport() { document.getElementById('import-file').click(); }
function handleImport(e) {
  var file = e.target.files[0]; if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var cfg = JSON.parse(ev.target.result);
      if (cfg.group) STATE.group = Object.assign({},GROUP_DEFAULTS,cfg.group);
      if (cfg.brands&&cfg.brands.length) STATE.brands = cfg.brands;
      if (cfg.channels&&cfg.channels.length) STATE.channels = cfg.channels;
      showToast('Config imported ✓ Click Save to apply','success');
      populateGroupForm(); renderChannelEditor(); refreshDashboard();
    } catch(err) { showToast('Invalid JSON file','error'); }
  };
  reader.readAsText(file);
}

/* ── Brand tab builder helper ── */
function buildBrandTabs(prefix, currentBrand, dataAttr) {
  return BRAND_IDS.map(function(id){
    return '<button class="brand-tab-btn'+(id===currentBrand?' active':'')+' " data-'+dataAttr+'="'+id+'" onclick="'+fn+'(this.dataset.'+dataAttr+')">'+BRAND_NAMES[id]+'</button>';
  }).join('');
}
