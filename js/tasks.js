// Swansway Marketing Portal — Tasks functions // v8-cache-bust


var LEADERSHIP_IDS = ['marcus', 'anna', 'beth_a'];

async function mtLoad() {
  await swEnsureUser();
  if (!CB_CURRENT_USER) { mtRender([], []); return; }
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var hdrs = getAuthHeaders();
  // Leadership members also see shared 'leadership' tasks
  var isLeadership = LEADERSHIP_IDS.indexOf(CB_CURRENT_USER) >= 0;
  var taskFilter = isLeadership
    ? '&or=(assigned_to.eq.'+CB_CURRENT_USER+',assigned_to.eq.leadership)'
    : '&assigned_to=eq.'+CB_CURRENT_USER;
  try {
    var results = await Promise.all([
      fetch(base+'/campaign_tasks?select=id,task_name,stage,campaign_id,campaigns(id,title,current_stage,brief_id)'+taskFilter+'&completed=eq.false&approved=eq.false&rejected=eq.false',{headers:hdrs}).then(function(r){return r.json();}),
      fetch(base+'/campaigns?status=eq.active&select=*&order=created_at.desc',{headers:hdrs}).then(function(r){return r.json();})
    ]);
    var allTasks = Array.isArray(results[0]) ? results[0] : [];
    var allCamps = Array.isArray(results[1]) ? results[1] : [];
    CB_CAMPAIGNS = allCamps;
    var active = allTasks.filter(function(t){
      var c = t.campaigns; return c && t.stage === c.current_stage;
    });
    mtRender(active, allCamps);
    loadActiveCampaignsBanner(allCamps, active);
  } catch(e) { console.warn('mtLoad:', e); }
}


function mtRender(tasks, campaigns) {
  var badge = document.getElementById('mt-badge');
  var header = document.getElementById('mt-header');
  var list = document.getElementById('mt-list');
  var footer = document.getElementById('mt-footer');
  if (!list) return;
  var me = CB_TEAM[CB_CURRENT_USER] || {};
  var first = me.name ? me.name.split(' ')[0] : 'there';
  var count = tasks.length;
  // Badge = task count
  if (badge) { badge.style.display = count > 0 ? 'flex' : 'none'; badge.textContent = count; }
  if (header) header.textContent = count > 0
    ? 'Hi ' + first + ' — ' + count + ' task' + (count !== 1 ? 's' : '') + ' waiting for you 📋'
    : 'Hi ' + first + ' — all caught up ✅';
  list.innerHTML = '';
  var SN = ['Pre-Production','Production','Pre-Live Approval','Go Live','In-Flight','Close & Review'];
  // Show campaigns section first
  if (campaigns && campaigns.length) {
    campaigns.forEach(function(camp) {
      var campTasks = tasks.filter(function(t){ return t.campaign_id === camp.id; });
      var row = document.createElement('div');
      row.style.cssText = 'padding:11px 16px;border-bottom:1px solid var(--border);cursor:pointer;background:var(--surface)';
      row.onmouseenter = function(){this.style.background='#e8e8e8';};
      row.onmouseleave = function(){this.style.background='var(--surface)';};
      var stage = camp.current_stage||1;
      row.innerHTML = '<div style="font-size:14px;font-weight:700;color:var(--ink);margin-bottom:3px">'+camp.title+'</div>'
        + '<div style="display:flex;align-items:center;gap:6px">'
        + '<span style="font-size:11px;background:#DBEAFE;color:#2563EB;padding:1px 7px;border-radius:8px;font-weight:600">Stage '+stage+': '+(SN[stage-1]||'')+'</span>'
        + (campTasks.length>0
          ? '<span style="font-size:11px;color:#92400E;background:#FEF3C7;padding:1px 7px;border-radius:8px;font-weight:600">'+campTasks.length+' task'+(campTasks.length!==1?'s':'')+' for you</span>'
          : '<span style="font-size:11px;color:#059669">✓ Your tasks done</span>')
        + '<span style="font-size:11px;color:var(--ink-faint);margin-left:auto">Open →</span>'
        + '</div>';
      (function(cid,bid){
        row.onclick = function(){
          MT_OPEN=false;
          var dd=document.getElementById('mt-dropdown'); if(dd) dd.style.display='none';
          openCampaignFromBanner(cid, bid);
        };
      })(camp.id, camp.brief_id||'');
      list.appendChild(row);
    });
  } else if (!count) {
    list.innerHTML = '<div style="padding:20px 18px;text-align:center;color:var(--ink-soft);font-size:14px">Nothing right now — 🎉 nice work!</div>';
  }
  // Individual tasks below campaigns
  tasks.forEach(function(t) {
    var c = t.campaigns || {};
    var row = document.createElement('div');
    row.style.cssText = 'padding:10px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s;padding-left:24px';
    row.onmouseenter = function(){this.style.background='var(--surface)';};
    row.onmouseleave = function(){this.style.background='';};
    row.innerHTML = '<div style="font-size:12px;color:var(--ink-soft);margin-bottom:1px">→ '+(c.title||'Campaign')+'</div>'
      + '<div style="font-size:13px;font-weight:600;color:var(--ink)">'+t.task_name+'</div>';
    var _bid = c.brief_id||'';
    row.onclick = function(){
      MT_OPEN=false;
      var dd=document.getElementById('mt-dropdown'); if(dd) dd.style.display='none';
      if(_bid) openCampaignFromBanner(null, _bid);
    };
    list.appendChild(row);
  });
  if (footer) footer.textContent = 'Click to jump straight in';
}


function mtToggle(e) {
  if (e && e.stopPropagation) e.stopPropagation();
  MT_OPEN = !MT_OPEN;
  var dd = document.getElementById('mt-dropdown');
  if (!dd) return;
  dd.style.display = MT_OPEN ? 'block' : 'none';
  if (MT_OPEN) mtLoad();
}
