// Swansway Marketing Portal — Admin JS
const SUPA = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';

// ── State ──
var adminCfg = {};
var adminTeam = [];
var adminPerms = {};
var adminSiteBudgets = {};
var adminSiteKpis = {};
var currentTab = 'kpis';

// ── Auth ──
async function adminInit() {
  var sess = await SB.auth.getSession();
  if (!sess.data.session) { window.location = 'index.html'; return; }
  document.getElementById('admin-user').textContent = sess.data.session.user.email;
  await loadAll();
  showTab('kpis');
}

async function loadAll() {
  showLoading(true);
  try {
    await Promise.all([loadAdminCfg(), loadTeam(), loadSiteBudgets(), loadSiteKpis()]);
  } catch(e) { console.error('loadAll:', e); }
  showLoading(false);
}

function showLoading(on) {
  var el = document.getElementById('admin-loading');
  if (el) el.style.display = on ? 'flex' : 'none';
}

// ── Admin Config ──
async function loadAdminCfg() {
  var r = await fetch(SUPA + '/admin_config?select=config&limit=1', { headers: getAuthHeaders() });
  if (!r.ok) return;
  var rows = await r.json();
  adminCfg = (rows && rows.length && rows[0].config) ? rows[0].config : {};
}

async function saveAdminCfg() {
  var btn = document.getElementById('save-cfg-btn');
  btn.textContent = 'Saving…'; btn.disabled = true;
  try {
    var r = await fetch(SUPA + '/admin_config', {
      method: 'POST',
      headers: getAuthHeaders({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),
      body: JSON.stringify({ user_id: (await SB.auth.getUser()).data.user.id, config: adminCfg, updated_at: new Date().toISOString() })
    });
    if (!r.ok) throw new Error(await r.text());
    showToast('Admin config saved ✓', 'success');
    // Re-apply to live hub
    if (typeof applyAdminConfig === 'function') applyAdminConfig(adminCfg);
  } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
  btn.textContent = 'Save changes'; btn.disabled = false;
}

// ── Tab navigation ──
function showTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.admin-tab-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.admin-tab-panel').forEach(function(p) {
    p.style.display = p.id === 'tab-' + tab ? 'block' : 'none';
  });
  if (tab === 'kpis')     renderKpisTab();
  if (tab === 'team')     renderTeamTab();
  if (tab === 'budgets')  renderBudgetsTab();
  if (tab === 'settings') renderSettingsTab();
}

// ── KPIs Tab ──
function renderKpisTab() {
  var el = document.getElementById('tab-kpis');
  var BRANDS_LIST = [
    {id:'audi',name:'Audi',color:'#BB0A21'},
    {id:'vw',name:'Volkswagen',color:'#001E50'},
    {id:'vwcv',name:'VW Commercial',color:'#1B4F72'},
    {id:'seat',name:'SEAT',color:'#E2231A'},
    {id:'cupra',name:'CUPRA',color:'#C8920A'},
    {id:'landrover',name:'Land Rover',color:'#1D4E1D'},
    {id:'jaguar',name:'Jaguar',color:'#1B2631'},
    {id:'honda',name:'Honda',color:'#CC0000'},
    {id:'peugeot',name:'Peugeot',color:'#1B3A6B'},
    {id:'byd',name:'BYD',color:'#0066CC'},
    {id:'omoda',name:'OMODA/JAECOO',color:'#6B21A8'},
    {id:'motormatch',name:'Motor Match',color:'#374151'},
  ];

  var brands = adminCfg.brands || BRANDS_LIST.map(function(b) { return {id:b.id}; });

  el.innerHTML = '<div class="admin-section-header"><h2>KPI Targets</h2><p>Set annual targets for each brand. These drive the KPI Framework page.</p></div>'
    + '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'
    + '<th>Brand</th><th>New Units</th><th>EV %</th><th>Leads/mo</th><th>CPL £</th><th>Conv %</th><th>Retention %</th><th>NPS</th><th>Q2 Focus</th>'
    + '</tr></thead><tbody id="kpi-tbody"></tbody></table></div>'
    + '<div class="admin-actions"><button id="save-cfg-btn" class="btn btn-accent" onclick="saveAdminCfg()">Save changes</button></div>';

  var tbody = document.getElementById('kpi-tbody');
  BRANDS_LIST.forEach(function(brand) {
    var b = brands.find(function(x) { return x.id === brand.id; }) || {id: brand.id};
    var row = document.createElement('tr');
    row.innerHTML = '<td><span class="brand-dot" style="background:' + brand.color + '"></span>' + brand.name + '</td>'
      + kpiCell('newUnits', brand.id, b.newUnits, 'number', '0')
      + kpiCell('evPct', brand.id, b.evPct, 'number', '0')
      + kpiCell('leads', brand.id, b.leads, 'number', '0')
      + kpiCell('cpl', brand.id, b.cpl, 'number', '0')
      + kpiCell('convRate', brand.id, b.convRate, 'number', '0')
      + kpiCell('retention', brand.id, b.retention, 'number', '0')
      + kpiCell('nps', brand.id, b.nps, 'number', '0')
      + '<td><input class="admin-input" type="text" value="' + (b.q2Focus||'') + '" onchange="setKpi(\'' + brand.id + '\',\'q2Focus\',this.value)" placeholder="e.g. A6 launch"></td>';
    tbody.appendChild(row);
  });
}

function kpiCell(field, brandId, value, type, placeholder) {
  return '<td><input class="admin-input admin-input-num" type="' + type + '" value="' + (value||'') + '" placeholder="' + placeholder + '" onchange="setKpi(\'' + brandId + '\',\'' + field + '\',' + (type==='number'?'parseFloat(this.value)':'this.value') + ')"></td>';
}

function setKpi(brandId, field, value) {
  if (!adminCfg.brands) adminCfg.brands = [];
  var b = adminCfg.brands.find(function(x) { return x.id === brandId; });
  if (!b) { b = {id: brandId}; adminCfg.brands.push(b); }
  b[field] = value;
}

// ── Team Tab ──
async function loadTeam() {
  var r = await fetch(SUPA + '/campaign_team?select=*&order=name', { headers: getAuthHeaders() });
  if (!r.ok) return;
  adminTeam = await r.json();
  var r2 = await fetch(SUPA + '/campaign_permissions?select=*', { headers: getAuthHeaders() });
  if (r2.ok) {
    var perms = await r2.json();
    perms.forEach(function(p) { adminPerms[p.team_member_id] = p; });
  }
}

function renderTeamTab() {
  var el = document.getElementById('tab-team');
  el.innerHTML = '<div class="admin-section-header"><h2>Campaign Team</h2><p>Manage team members and their permissions.</p></div>'
    + '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'
    + '<th>Name</th><th>Email</th><th>Colour</th><th>Active</th><th>Approve all</th><th>Approve digital</th><th>Actions</th>'
    + '</tr></thead><tbody id="team-tbody"></tbody></table></div>'
    + '<div class="admin-actions">'
    + '<button class="btn btn-accent" onclick="addTeamMember()">+ Add member</button>'
    + '</div>'
    + '<div id="team-form" style="display:none;margin-top:1.5rem;padding:20px;background:var(--white);border:1px solid var(--border);border-radius:8px"></div>';

  renderTeamRows();
}

function renderTeamRows() {
  var tbody = document.getElementById('team-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  adminTeam.forEach(function(m) {
    var p = adminPerms[m.id] || {};
    var row = document.createElement('tr');
    row.innerHTML = '<td><strong>' + m.name + '</strong></td>'
      + '<td style="color:var(--ink-soft);font-size:12px">' + (m.email||'—') + '</td>'
      + '<td><span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:' + (m.color||'#374151') + '"></span></td>'
      + '<td><input type="checkbox" ' + (m.active?'checked':'') + ' onchange="updateTeamField(\'' + m.id + '\',\'active\',this.checked)"></td>'
      + '<td><input type="checkbox" ' + (p.can_approve_all?'checked':'') + ' onchange="updatePerm(\'' + m.id + '\',\'can_approve_all\',this.checked)"></td>'
      + '<td><input type="checkbox" ' + (p.can_approve_digital?'checked':'') + ' onchange="updatePerm(\'' + m.id + '\',\'can_approve_digital\',this.checked)"></td>'
      + '<td><button class="btn-sm" onclick="editTeamMember(\'' + m.id + '\')">Edit</button> '
      + '<button class="btn-sm btn-danger" onclick="deleteTeamMember(\'' + m.id + '\')">Delete</button></td>';
    tbody.appendChild(row);
  });
}

async function updateTeamField(id, field, value) {
  var obj = {}; obj[field] = value;
  await fetch(SUPA + '/campaign_team?id=eq.' + id, {
    method: 'PATCH',
    headers: getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
    body: JSON.stringify(obj)
  });
  var m = adminTeam.find(function(x) { return x.id === id; });
  if (m) m[field] = value;
}

async function updatePerm(memberId, field, value) {
  var existing = adminPerms[memberId];
  var obj = {team_member_id: memberId}; obj[field] = value;
  if (existing && existing.id) {
    await fetch(SUPA + '/campaign_permissions?id=eq.' + existing.id, {
      method: 'PATCH',
      headers: getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
      body: JSON.stringify(obj)
    });
    adminPerms[memberId][field] = value;
  } else {
    var r = await fetch(SUPA + '/campaign_permissions', {
      method: 'POST',
      headers: getAuthHeaders({'Content-Type':'application/json','Prefer':'return=representation'}),
      body: JSON.stringify([obj])
    });
    if (r.ok) { var rows = await r.json(); adminPerms[memberId] = rows[0]; }
  }
}

function addTeamMember() {
  showTeamForm({});
}

function editTeamMember(id) {
  var m = adminTeam.find(function(x) { return x.id === id; });
  showTeamForm(m || {});
}

function showTeamForm(m) {
  var form = document.getElementById('team-form');
  form.style.display = 'block';
  form.innerHTML = '<h3 style="font-family:var(--font-d);font-size:16px;font-weight:700;margin-bottom:16px">' + (m.id ? 'Edit' : 'Add') + ' team member</h3>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">'
    + adminField('Name', 'tf-name', m.name||'', 'text', 'Full name')
    + adminField('Email', 'tf-email', m.email||'', 'email', 'name@swansway.co.uk')
    + adminField('Role', 'tf-role', m.role||'', 'text', 'e.g. Head of Marketing')
    + adminField('Colour', 'tf-color', m.color||'#374151', 'color', '')
    + '</div>'
    + '<input type="hidden" id="tf-id" value="' + (m.id||'') + '">'
    + '<div style="display:flex;gap:8px">'
    + '<button class="btn btn-accent" onclick="saveTeamMember()">Save</button>'
    + '<button class="btn" onclick="document.getElementById(\'team-form\').style.display=\'none\'">Cancel</button>'
    + '</div>';
}

function adminField(label, id, value, type, placeholder) {
  return '<div><div class="admin-field-label">' + label + '</div>'
    + '<input class="admin-input" id="' + id + '" type="' + type + '" value="' + (value||'') + '" placeholder="' + placeholder + '"></div>';
}

async function saveTeamMember() {
  var id = document.getElementById('tf-id').value;
  var obj = {
    name: document.getElementById('tf-name').value,
    email: document.getElementById('tf-email').value,
    role: document.getElementById('tf-role').value,
    color: document.getElementById('tf-color').value,
    active: true,
  };
  if (id) {
    await fetch(SUPA + '/campaign_team?id=eq.' + id, {
      method: 'PATCH',
      headers: getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
      body: JSON.stringify(obj)
    });
    var m = adminTeam.find(function(x) { return x.id === id; });
    if (m) Object.assign(m, obj);
  } else {
    var r = await fetch(SUPA + '/campaign_team', {
      method: 'POST',
      headers: getAuthHeaders({'Content-Type':'application/json','Prefer':'return=representation'}),
      body: JSON.stringify([obj])
    });
    if (r.ok) { var rows = await r.json(); adminTeam.push(rows[0]); }
  }
  document.getElementById('team-form').style.display = 'none';
  renderTeamRows();
  showToast('Team member saved ✓', 'success');
}

async function deleteTeamMember(id) {
  if (!confirm('Remove this team member?')) return;
  await fetch(SUPA + '/campaign_team?id=eq.' + id, { method: 'DELETE', headers: getAuthHeaders() });
  adminTeam = adminTeam.filter(function(m) { return m.id !== id; });
  renderTeamRows();
  showToast('Team member removed', 'success');
}

// ── Site Budgets Tab ──
async function loadSiteBudgets() {
  var r = await fetch(SUPA + '/site_budgets?select=*&order=brand_id,site_id', { headers: getAuthHeaders() });
  if (!r.ok) return;
  var rows = await r.json();
  rows.forEach(function(row) { adminSiteBudgets[row.site_id] = row; });
}

function renderBudgetsTab() {
  var el = document.getElementById('tab-budgets');
  var BRANDS_SITES = typeof BRANDS !== 'undefined' ? BRANDS : [];
  var rows = Object.values(adminSiteBudgets);

  el.innerHTML = '<div class="admin-section-header"><h2>Site Budgets</h2><p>Set annual planned budget per dealership site.</p></div>'
    + '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>'
    + '<th>Site</th><th>Brand</th><th>Annual Planned £</th><th>Jan</th><th>Feb</th><th>Mar</th><th>Apr</th><th>May</th><th>Jun</th><th>Jul</th><th>Aug</th><th>Sep</th><th>Oct</th><th>Nov</th><th>Dec</th>'
    + '</tr></thead><tbody id="budgets-tbody"></tbody></table></div>'
    + '<div class="admin-actions"><button class="btn btn-accent" onclick="saveSiteBudgets()">Save budgets</button></div>';

  var tbody = document.getElementById('budgets-tbody');
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="15" style="text-align:center;padding:20px;color:var(--ink-soft)">No site budgets yet. Add sites in Supabase or via the Site Directory.</td></tr>';
    return;
  }

  rows.sort(function(a,b) { return (a.brand_id+a.site_id).localeCompare(b.brand_id+b.site_id); });
  rows.forEach(function(row) {
    var tr = document.createElement('tr');
    var months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    tr.innerHTML = '<td><strong>' + row.site_id + '</strong></td>'
      + '<td style="color:var(--ink-soft);font-size:12px">' + (row.brand_id||'') + '</td>'
      + '<td><input class="admin-input admin-input-num" type="number" value="' + (row.annual_planned||0) + '" onchange="setSiteBudget(\'' + row.site_id + '\',\'annual_planned\',parseFloat(this.value))"></td>'
      + months.map(function(m) {
          return '<td><input class="admin-input admin-input-sm" type="number" value="' + (row['budget_'+m]||0) + '" onchange="setSiteBudget(\'' + row.site_id + '\',\'budget_'+m+'\',parseFloat(this.value))"></td>';
        }).join('');
    tbody.appendChild(tr);
  });
}

function setSiteBudget(siteId, field, value) {
  if (!adminSiteBudgets[siteId]) adminSiteBudgets[siteId] = {site_id: siteId};
  adminSiteBudgets[siteId][field] = value;
}

async function saveSiteBudgets() {
  var btn = event.currentTarget;
  btn.textContent = 'Saving…'; btn.disabled = true;
  try {
    var rows = Object.values(adminSiteBudgets);
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var r = await fetch(SUPA + '/site_budgets?site_id=eq.' + row.site_id, {
        method: 'PATCH',
        headers: getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
        body: JSON.stringify(row)
      });
      if (!r.ok) throw new Error('Failed for site ' + row.site_id);
    }
    showToast('Site budgets saved ✓', 'success');
  } catch(e) { showToast('Save failed: ' + e.message, 'error'); }
  btn.textContent = 'Save budgets'; btn.disabled = false;
}

// ── Settings Tab ──
function renderSettingsTab() {
  var el = document.getElementById('tab-settings');
  var g = adminCfg.group || {};
  el.innerHTML = '<div class="admin-section-header"><h2>Group Settings</h2><p>Set group-level targets that appear on the overview page.</p></div>'
    + '<div class="admin-card">'
    + '<h3 class="admin-card-title">Group KPI Targets</h3>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">'
    + adminField('Group leads/month target', 'gs-leads', g.leads||'', 'number', '0')
    + adminField('Group new units target', 'gs-units', g.units||'', 'number', '0')
    + adminField('EV sales % target', 'gs-evSales', g.evSales||'', 'number', '0')
    + adminField('Group CPL target £', 'gs-cpl', g.cpl||'', 'number', '0')
    + adminField('Conversion rate % target', 'gs-conv', g.conv||'', 'number', '0')
    + adminField('Customer retention % target', 'gs-retention', g.retention||'', 'number', '0')
    + adminField('NPS target', 'gs-nps', g.nps||'', 'number', '0')
    + adminField('EV % target', 'gs-evPct', g.evPct||'', 'number', '0')
    + '</div>'
    + '</div>'
    + '<div class="admin-actions"><button id="save-cfg-btn" class="btn btn-accent" onclick="saveGroupSettings()">Save settings</button></div>';
}

async function saveGroupSettings() {
  if (!adminCfg.group) adminCfg.group = {};
  var fields = ['leads','units','evSales','cpl','conv','retention','nps','evPct'];
  fields.forEach(function(f) {
    var el = document.getElementById('gs-' + f);
    if (el) adminCfg.group[f] = parseFloat(el.value) || 0;
  });
  await saveAdminCfg();
}
