// Swansway Marketing Portal — Campaigns board functions

async function cbLoad() {
  var anon = SUPABASE_ANON_KEY;
  var base = 'https://humitzrleflxnlnodpde.supabase.co/rest/v1';
  var hdrs = getAuthHeaders();
  try {
    var results = await Promise.all([
      fetch(base+'/campaigns?select=*&order=created_at.desc',{headers:hdrs}).then(function(r){return r.json();}),
      fetch(base+'/campaign_team?select=*&active=eq.true',{headers:hdrs}).then(function(r){return r.json();}),
      fetch(base+'/campaign_permissions?select=*',{headers:hdrs}).then(function(r){return r.json();}),
      fetch(base+'/briefs?select=*&order=created_at.desc',{headers:hdrs}).then(function(r){return r.json();}),
    ]);
    CB_CAMPAIGNS = Array.isArray(results[0]) ? results[0] : [];
    CB_TEAM = {};
    (Array.isArray(results[1])?results[1]:[]).forEach(function(m){CB_TEAM[m.id]=m;});
    CB_PERMS = {};
    (Array.isArray(results[2])?results[2]:[]).forEach(function(p){CB_PERMS[p.team_member_id]=p;});
    CB_ALL_BRIEFS = Array.isArray(results[3]) ? results[3] : [];
    console.log('CB loaded:', CB_CAMPAIGNS.length, 'campaigns,', CB_ALL_BRIEFS.length, 'briefs,', Object.keys(CB_TEAM).length, 'team members');
    cbPopulateUserDropdown();
    cbRenderDashboard();
  } catch(e) { console.warn('cbLoad error:', e); }
}


function cbPopulateUserDropdown() {
  var sel = document.getElementById('cb-user-sel');
  if (!sel) return;
  if (!Object.keys(CB_TEAM).length) return;
  sel.innerHTML = '<option value="">&#8212; Select your name &#8212;</option>';
  Object.values(CB_TEAM).forEach(function(m) {
    var o = document.createElement('option');
    o.value = m.id;
    o.textContent = m.name + ' — ' + m.role;
    sel.appendChild(o);
  });
  // Auto-detect from Supabase auth email
  if (CB_CURRENT_USER) {
    sel.value = CB_CURRENT_USER;
  } else if (typeof SB_USER !== 'undefined' && SB_USER && SB_USER.email) {
    var emailLower = SB_USER.email.toLowerCase();
    var match = Object.values(CB_TEAM).find(function(m){
      return m.email && m.email.toLowerCase() === emailLower;
    });
    if (match) {
      sel.value = match.id;
      CB_CURRENT_USER = match.id;
      console.log('Auto-detected user:', match.name);
    }
  }
}


function cbSetUser(id) { CB_CURRENT_USER=id||null; cbRenderDashboard(); }


function cbRenderDashboard() {
  var el=document.getElementById('cb-campaign-list');
  var detail=document.getElementById('cb-detail');
  if(!el) return;
  if(detail) detail.style.display='none';
  el.style.display='block';
  var camps=CB_CAMPAIGNS.filter(function(c){return CB_FILTER==='all'||c.status===CB_FILTER;});
  if(!camps.length){
    el.innerHTML='<div style="padding:40px;text-align:center;color:var(--ink-faint)">'
      +'<div style="font-size:48px;margin-bottom:16px">\uD83C\uDFAF</div>'
      +'<div style="font-size:16px;font-weight:700;margin-bottom:8px">No campaigns yet</div>'
      +'<div style="font-size:13px;margin-bottom:20px">Create a campaign from a completed brief or start one directly.</div>'
      +'<button class="btn btn-primary" onclick="cbNewCampaign()">+ Create first campaign</button></div>';
    return;
  }
  el.innerHTML='';
  camps.forEach(function(c){el.appendChild(cbMakeCampaignCard(c));});
}


function cbMakeCampaignCard(c) {
  var stage=c.current_stage||1;
  var stageName=CB_STAGE_NAMES[stage-1]||'Stage '+stage;
  var stageIcon=CB_STAGE_ICONS[stage-1]||'\uD83D\uDCCC';
  var statusColors={active:'#059669',paused:'#D97706',complete:'#2563EB',cancelled:'#DC2626'};
  var statusColor=statusColors[c.status]||'#6B7280';
  var scopeVal=c.site_id||(c.brand_id?(window.BRAND_NAMES&&BRAND_NAMES[c.brand_id]||c.brand_id):'Group');
  var scopeLabel=c.site_id?'Site':c.brand_id?'Brand':'Group';

  var dots=CB_STAGE_NAMES.map(function(sn,i){
    var done=i<stage-1,active=i===stage-1;
    var bg=done?'#059669':active?'var(--swansway)':'var(--surface-2)';
    var tc=(done||active)?'#fff':'var(--ink-faint)';
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1">'
      +'<div style="width:24px;height:24px;border-radius:50%;background:'+bg+';display:flex;align-items:center;justify-content:center;font-size:10px;color:'+tc+';font-weight:700">'+(done?'\u2713':(i+1))+'</div>'
      +'<div style="font-size:9px;color:var(--ink-faint);text-align:center;font-family:var(--font-m)">'+sn.split(' ')[0]+'</div></div>';
  }).join('');

  var card=document.createElement('div');
  card.style.cssText='background:var(--white);border:1px solid var(--border);border-radius:6px;padding:20px;margin-bottom:12px;cursor:pointer;transition:box-shadow .2s;border-left:4px solid '+statusColor;
  card.onmouseenter=function(){this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';};
  card.onmouseleave=function(){this.style.boxShadow='none';};
  card.dataset.campaignId=c.id;
  card.onclick=function(){cbOpenCampaign(this.dataset.campaignId);};
  card.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">'
    +'<div><div style="font-family:var(--font-d);font-size:16px;font-weight:700;color:var(--ink);margin-bottom:4px">'+c.title+'</div>'
    +'<div style="display:flex;gap:8px;align-items:center">'
    +'<span style="font-size:11px;background:var(--surface);padding:2px 8px;border-radius:10px;color:var(--ink-soft);font-family:var(--font-m)">'+scopeLabel+': '+scopeVal+'</span>'
    +'<span style="font-size:11px;color:var(--ink-faint)">'+new Date(c.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})+'</span>'
    +'</div></div>'
    +'<div style="text-align:right">'
    +'<span style="font-size:11px;padding:3px 10px;border-radius:10px;background:'+statusColor+'20;color:'+statusColor+';font-family:var(--font-m);font-weight:600">'+c.status.charAt(0).toUpperCase()+c.status.slice(1)+'</span>'
    +'<div style="font-size:12px;color:var(--ink-soft);margin-top:6px">'+stageIcon+' '+stageName+'</div>'
    +'</div></div>'
    +'<div style="display:flex;gap:4px">'+dots+'</div>';
  return card;
}


async function cbOpenCampaign(campaignId) {
  CB_CURRENT=campaignId;
  var c=CB_CAMPAIGNS.find(function(x){return x.id===campaignId;});
  if(!c) return;
  try {
    var anon=SUPABASE_ANON_KEY;
    var tasks=await fetch(CB_API+'/campaign_tasks?campaign_id=eq.'+campaignId+'&order=stage,task_order',{
      headers:getAuthHeaders()
    }).then(function(r){return r.json();});
    CB_TASKS[campaignId]=Array.isArray(tasks)?tasks:[];
  } catch(e){CB_TASKS[campaignId]=[];}
  cbRenderCampaignDetail(c);
}


function cbRenderCampaignDetail(c) {
  var listEl = document.getElementById('cb-briefs-list') || document.getElementById('cb-campaign-list');
  var detailEl = document.getElementById('cb-detail');
  if (!detailEl) return;
  if (listEl) listEl.style.display = 'none';
  detailEl.style.display = 'block';
  detailEl.innerHTML = '';
  var vcEl = document.getElementById('view-campaigns');
  if (vcEl) vcEl.scrollIntoView({behavior:'smooth', block:'start'});
  window.scrollTo({top:0, behavior:'smooth'});

  var tasks = CB_TASKS[c.id] || [];
  var stage = c.current_stage || 1;
  var perms = CB_PERMS[CB_CURRENT_USER] || {};
  var canApprove = !!perms.can_approve_all;
  var canApproveDigital = !!perms.can_approve_digital;
  var canReject = !!(perms.can_reject_tasks || perms.can_approve_all);
  var canAdvance = !!perms.can_advance_stage;
  var canComplete = !!perms.can_complete_tasks;

  var byStage = {};
  for (var s = 1; s <= 6; s++) byStage[s] = [];
  tasks.forEach(function(t) { if (byStage[t.stage]) byStage[t.stage].push(t); });

  var statusColors = {active:'#059669',paused:'#D97706',complete:'#2563EB',cancelled:'#DC2626'};
  var statusColor = statusColors[c.status] || '#6B7280';
  var brandColor = (BB_BRANDS && BB_BRANDS.find(function(b){return b.id===c.brand_id;})||{}).color || 'var(--swansway)';

  // ── BACK ──
  var backBtn = document.createElement('button');
  backBtn.className = 'sw-back-btn';
  backBtn.innerHTML = '\u2190 All campaigns';
  backBtn.onclick = cbBackToDashboard;
  detailEl.appendChild(backBtn);

  // ── HEADER ──
  var header = document.createElement('div');
  header.className = 'sw-campaign-header';
  var totalTasks = tasks.length;
  var doneTasks = tasks.filter(function(t){return t.approved;}).length;
  var pct = totalTasks > 0 ? Math.round(doneTasks/totalTasks*100) : 0;
  var scopeLabel = c.site_id ? 'Site: ' + c.site_id : c.brand_id ? (window.BRAND_NAMES && BRAND_NAMES[c.brand_id] || c.brand_id) : 'Group';
  header.innerHTML =
    '<div class="sw-ch-top" style="border-left:5px solid ' + brandColor + '">' +
      '<div class="sw-ch-meta">' +
        '<span class="sw-label">' + CB_STAGE_ICONS[stage-1] + ' Stage ' + stage + ' of 6 — ' + CB_STAGE_NAMES[stage-1] + '</span>' +
        '<div class="sw-ch-title">' + c.title + '</div>' +
        '<div class="sw-ch-pills">' +
          '<span class="sw-pill" style="background:' + statusColor + '20;color:' + statusColor + '">' + c.status.charAt(0).toUpperCase() + c.status.slice(1) + '</span>' +
          '<span class="sw-pill sw-pill-muted">' + scopeLabel + '</span>' +
          (c.campaign_type ? '<span class="sw-pill sw-pill-muted">' + c.campaign_type + '</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="sw-ch-actions">' +
        (canAdvance && stage < 6 && c.status === 'active' ? '<button class="btn btn-primary sw-advance-btn" data-cid="' + c.id + '" onclick="cbAdvanceStage(this.dataset.cid)">Advance to Stage ' + (stage+1) + ' \u2192</button>' : '') +
        (canAdvance && stage > 1 ? '<button class="btn" data-cid="' + c.id + '" onclick="cbReopenStage(this.dataset.cid)">\u21a9 Reopen</button>' : '') +
      '</div>' +
    '</div>' +
    '<div class="sw-ch-progress">' +
      '<div class="sw-ch-prog-bar"><div class="sw-ch-prog-fill" style="width:' + pct + '%"></div></div>' +
      '<div class="sw-ch-prog-labels">' +
        '<span>' + doneTasks + ' of ' + totalTasks + ' tasks approved</span>' +
        '<span>' + pct + '% complete</span>' +
      '</div>' +
    '</div>' +
    '<div class="sw-ch-stages">' +
      CB_STAGE_NAMES.map(function(sn,i){
        var s2=i+1, done=s2<stage, active=s2===stage;
        var col = done?'#059669':active?'var(--swansway)':'var(--border)';
        var tc = (done||active)?'#fff':'var(--ink-faint)';
        return '<div class="sw-stage-pip" style="background:' + col + ';color:' + tc + '">' +
          '<span class="sw-stage-pip-icon">' + CB_STAGE_ICONS[i] + '</span>' +
          '<span class="sw-stage-pip-name">' + sn.split(' ')[0] + '</span>' +
        '</div>';
      }).join('') +
    '</div>';
  detailEl.appendChild(header);

  // ── NO USER WARNING ──
  if (!CB_CURRENT_USER) {
    var userBar = document.createElement('div');
    userBar.className = 'sw-notice sw-notice-amber';
    userBar.innerHTML = '<span style="font-size:18px">\u26a0\ufe0f</span><div><strong>Who are you?</strong> Select your name from the dropdown above to see your tasks and take actions. We promise we won\'t judge.</div>';
    detailEl.appendChild(userBar);
  }

  // ── MY TASKS SPOTLIGHT ──
  if (CB_CURRENT_USER) {
    var myTasks = tasks.filter(function(t){ return t.assigned_to === CB_CURRENT_USER && t.stage === stage && !t.approved && !t.rejected; });
    if (myTasks.length > 0) {
      var spotlight = document.createElement('div');
      spotlight.className = 'sw-spotlight';
      var me = CB_TEAM[CB_CURRENT_USER] || {name: CB_CURRENT_USER};
      var pending = myTasks.filter(function(t){return !t.completed;}).length;
      var done2   = myTasks.filter(function(t){return t.completed;}).length;
      spotlight.innerHTML =
        '<div class="sw-spotlight-header">' +
          '<div class="sw-avatar sw-avatar-lg">' + me.name.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase() + '</div>' +
          '<div><div class="sw-spotlight-title">Your tasks this stage, ' + me.name.split(' ')[0] + '</div>' +
            '<div class="sw-spotlight-sub">' + pending + ' to do &middot; ' + done2 + ' done &middot; awaiting approval</div>' +
          '</div>' +
        '</div>' +
        '<div class="sw-spotlight-tasks">' +
          myTasks.map(function(t){
            var status = t.completed ? 'done' : 'todo';
            return '<div class="sw-spotlight-task sw-spotlight-task-' + status + '">' +
              '<span class="sw-spotlight-tick">' + (t.completed?'\u2713':'\u25cb') + '</span>' +
              '<span>' + t.task_name + (t.is_blocker?' <span class="sw-blocker-tag">BLOCKER</span>':'') + '</span>' +
            '</div>';
          }).join('') +
        '</div>';
      detailEl.appendChild(spotlight);
    }
  }

  // ── STAGE SECTIONS (Slack-style) ──
  for (var si = 1; si <= 6; si++) {
    var stageTasks = byStage[si];
    var isActive = si === stage;
    var isDone = si < stage;
    var isFuture = si > stage;
    var stageApproved = stageTasks.filter(function(t){return t.approved;}).length;
    var stageBlockers = stageTasks.filter(function(t){return t.is_blocker;}).length;

    var section = document.createElement('div');
    section.className = 'sw-stage-section' + (isFuture?' sw-stage-future':'');

    // ── Stage divider (Slack-style channel header) ──
    var divider = document.createElement('div');
    divider.className = 'sw-stage-divider';
    divider.innerHTML =
      '<div class="sw-stage-divider-icon" style="background:' + (isDone?'#059669':isActive?'var(--swansway)':'var(--surface-2)') + ';color:' + (isDone||isActive?'#fff':'var(--ink-faint)') + '">' +
        (isDone ? '\u2713' : CB_STAGE_ICONS[si-1]) +
      '</div>' +
      '<div class="sw-stage-divider-name">Stage ' + si + ' &mdash; ' + CB_STAGE_NAMES[si-1] + '</div>' +
      '<div class="sw-stage-divider-line"></div>' +
      (isDone ? '<span class="sw-pill" style="background:#D1FAE5;color:#059669">\u2713 Complete</span>' : '') +
      (isActive ? '<span class="sw-pill" style="background:rgba(200,16,46,0.1);color:var(--accent)">Active</span>' : '') +
      (stageBlockers > 0 ? '<span class="sw-pill sw-pill-muted">' + stageApproved + '/' + stageBlockers + ' approved</span>' : '');
    section.appendChild(divider);

    // ── Tasks ──
    if (!stageTasks.length) {
      var empty2 = document.createElement('div');
      empty2.className = 'sw-empty-tasks';
      empty2.textContent = 'No tasks for this stage.';
      section.appendChild(empty2);
    } else {
      stageTasks.forEach(function(task) {
        var assignee = CB_TEAM[task.assigned_to] || {name: task.assigned_to || 'Unassigned'};
        var approvedByMember = task.approved_by ? CB_TEAM[task.approved_by] : null;
        var rejectedByMember = task.rejected_by ? CB_TEAM[task.rejected_by] : null;
        var isDigital = task.approver_scope === 'digital';
        var isMyTask = CB_CURRENT_USER && CB_CURRENT_USER === task.assigned_to;
        var canUserComplete = isActive && canComplete && isMyTask && !task.completed && !task.rejected;
        var canUserApprove = isActive && (canApprove || (canApproveDigital && isDigital)) && task.completed && !task.approved && !task.rejected;
        var canUserReject = isActive && (canReject || canApprove) && task.completed && !task.approved;
        var canUserNote = isActive && CB_CURRENT_USER;
        var taskStatus = task.approved ? 'approved' : task.rejected ? 'rejected' : task.completed ? 'pending' : 'todo';
        var accentColors = {approved:'#059669', rejected:'#DC2626', pending:'#D97706', todo:'transparent'};

        var row = document.createElement('div');
        row.className = 'sw-task-row sw-task-' + taskStatus;

        // Avatar
        var avatarInitials = assignee.name.split(' ').map(function(n){return n[0];}).join('').substring(0,2).toUpperCase();
        var avatarColor = getAvatarColor(task.assigned_to);

        // Status icon
        var statusIcon = task.approved ? '\u2713' : task.rejected ? '\u2715' : task.completed ? '\u23f3' : '\u25cb';
        var statusIconColor = {approved:'#059669', rejected:'#DC2626', pending:'#D97706', todo:'var(--ink-faint)'}[taskStatus];

        row.innerHTML =
          '<div class="sw-task-status-icon" style="color:' + statusIconColor + '">' + statusIcon + '</div>' +
          '<div class="sw-avatar sw-avatar-sm" style="background:' + avatarColor + ';flex-shrink:0">' + avatarInitials + '</div>' +
          '<div class="sw-task-body">' +
            '<div class="sw-task-name-row">' +
              '<span class="sw-task-name' + (task.is_blocker?' sw-task-blocker':'') + '">' + task.task_name + '</span>' +
              (task.is_blocker ? '<span class="sw-blocker-tag">BLOCKER</span>' : '') +
              '<span class="sw-dept-tag">' + (task.department||'General') + '</span>' +
            '</div>' +
            '<div class="sw-task-meta">' +
              '<span class="sw-task-assignee"><strong>' + assignee.name + '</strong></span>' +
              (task.approved && approvedByMember ? ' &middot; <span style="color:#059669">\u2713 approved by ' + approvedByMember.name + (task.approved_at?' on '+new Date(task.approved_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'') + '</span>' : '') +
              (task.rejected && rejectedByMember ? ' &middot; <span style="color:#DC2626">\u2715 rejected by ' + rejectedByMember.name + (task.rejection_reason?' &mdash; <em>' + task.rejection_reason + '</em>':'') + '</span>' : '') +
              (task.completed && !task.approved && !task.rejected ? ' &middot; <span style="color:#D97706">waiting on ' + (isDigital?'Anna, Marcus or Beth':'Anna or Marcus') + '</span>' : '') +
            '</div>' +
            (task.notes ? '<div class="sw-task-note">\uD83D\uDCDD ' + task.notes + '</div>' : '') +
          '</div>' +
          '<div class="sw-task-actions">' +
            (canUserComplete ? '<button class="sw-btn-complete" data-tid="' + task.id + '" onclick="cbCompleteTask(this.dataset.tid)">\u2713 Done</button>' : '') +
            (canUserApprove  ? '<button class="sw-btn-approve" data-tid="' + task.id + '" onclick="cbApproveTask(this.dataset.tid)">\u2713 Approve</button>' : '') +
            (canUserReject   ? '<button class="sw-btn-reject" data-tid="' + task.id + '" onclick="cbRejectTask(this.dataset.tid)">\u2715 Reject</button>' : '') +
            (canUserNote     ? '<button class="sw-btn-note" data-tid="' + task.id + '" onclick="cbAddNote(this.dataset.tid)">\uD83D\uDCDD Note</button>' : '') +
          '</div>';

        section.appendChild(row);
      });
    }

    detailEl.appendChild(section);
  }
}


function cbBackToDashboard(){
  CB_CURRENT=null;
  var d=document.getElementById('cb-detail');
  var l=document.getElementById('cb-briefs-list') || document.getElementById('cb-campaign-list');
  if(d) d.style.display='none';
  if(l) l.style.display='block';
  window.scrollTo({top:0, behavior:'smooth'});
}


async function cbCompleteTask(taskId){
  if(!CB_CURRENT_USER){showToast('Pick your name from the dropdown first 👆', 'error'); return; }
  // inline action — no confirm needed
  await cbUpdateTask(taskId,{completed:true,completed_by:CB_CURRENT_USER,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()});
}


async function cbApproveTask(taskId){
  if(!CB_CURRENT_USER){alert('Please select your name first');return;}
  await cbUpdateTask(taskId,{approved:true,approved_by:CB_CURRENT_USER,approved_at:new Date().toISOString(),rejected:false,rejection_reason:'',updated_at:new Date().toISOString()});
  await cbCheckStageAdvance(CB_CURRENT);
}


async function cbRejectTask(taskId){
  if(!CB_CURRENT_USER){alert('Please select your name first');return;}
  var reason=prompt('Reason for rejection (required):');
  if(!reason||!reason.trim()) return;
  await cbUpdateTask(taskId,{rejected:true,rejected_by:CB_CURRENT_USER,rejected_at:new Date().toISOString(),rejection_reason:reason.trim(),completed:false,approved:false,updated_at:new Date().toISOString()});
}


async function cbAddNote(taskId){
  var note=prompt('Add a note:');
  if(!note||!note.trim()) return;
  var task=null;
  Object.values(CB_TASKS).forEach(function(arr){arr.forEach(function(t){if(t.id===taskId) task=t;});});
  var existing=task?(task.notes||''):'';
  var combined=existing?existing+' | '+note.trim():note.trim();
  await cbUpdateTask(taskId,{notes:combined,updated_at:new Date().toISOString()});
}


async function cbUpdateTask(taskId,updates){
  var anon=SUPABASE_ANON_KEY;
  try{
    var resp=await fetch(CB_API+'/campaign_tasks?id=eq.'+taskId,{
      method:'PATCH',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
      body:JSON.stringify(updates)
    });
    if(!resp.ok) throw new Error(await resp.text());
    Object.keys(CB_TASKS).forEach(function(cid){
      CB_TASKS[cid]=CB_TASKS[cid].map(function(t){return t.id===taskId?Object.assign({},t,updates):t;});
    });
    var c=CB_CAMPAIGNS.find(function(x){return x.id===CB_CURRENT;});
    if(c) cbRenderCampaignDetail(c);
  }catch(e){alert('Error: '+e.message);}
}


async function cbCheckStageAdvance(campaignId){
  var tasks=CB_TASKS[campaignId]||[];
  var c=CB_CAMPAIGNS.find(function(x){return x.id===campaignId;});
  if(!c||c.current_stage>=6) return;
  var stage=c.current_stage;
  var blockers=tasks.filter(function(t){return t.stage===stage&&t.is_blocker;});
  if(!blockers.length||!blockers.every(function(t){return t.approved;})) return;
  var anon=SUPABASE_ANON_KEY;
  var newStage=stage+1;
  try{
    await fetch(CB_API+'/campaigns?id=eq.'+campaignId,{
      method:'PATCH',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),
      body:JSON.stringify({current_stage:newStage,updated_at:new Date().toISOString()})
    });
    CB_CAMPAIGNS=CB_CAMPAIGNS.map(function(x){return x.id===campaignId?Object.assign({},x,{current_stage:newStage}):x;});
    var banner=document.createElement('div');
    banner.style.cssText='position:fixed;top:80px;right:24px;background:#059669;color:#fff;padding:12px 20px;border-radius:6px;font-size:14px;font-weight:700;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
    banner.textContent='\uD83C\uDF89 Stage '+newStage+': '+CB_STAGE_NAMES[newStage-1]+' is now active!';
    document.body.appendChild(banner);
    setTimeout(function(){banner.remove();},4000);
    var updated=CB_CAMPAIGNS.find(function(x){return x.id===campaignId;});
    if(updated) cbRenderCampaignDetail(updated);
  }catch(e){console.warn('Stage advance error:',e);}
}


async function cbAdvanceStage(campaignId){
  var c=CB_CAMPAIGNS.find(function(x){return x.id===campaignId;});
  if(!c||c.current_stage>=6) return;
  var anon=SUPABASE_ANON_KEY;
  var newStage=c.current_stage+1;
  try{
    await fetch(CB_API+'/campaigns?id=eq.'+campaignId,{method:'PATCH',headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({current_stage:newStage,updated_at:new Date().toISOString()})});
    CB_CAMPAIGNS=CB_CAMPAIGNS.map(function(x){return x.id===campaignId?Object.assign({},x,{current_stage:newStage}):x;});
    var updated=CB_CAMPAIGNS.find(function(x){return x.id===campaignId;});
    if(updated) cbRenderCampaignDetail(updated);
  }catch(e){alert('Error: '+e.message);}
}


async function cbReopenStage(campaignId){
  var c=CB_CAMPAIGNS.find(function(x){return x.id===campaignId;});
  if(!c||c.current_stage<=1) return;
  var anon=SUPABASE_ANON_KEY;
  var newStage=c.current_stage-1;
  try{
    await fetch(CB_API+'/campaigns?id=eq.'+campaignId,{method:'PATCH',headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify({current_stage:newStage,updated_at:new Date().toISOString()})});
    CB_CAMPAIGNS=CB_CAMPAIGNS.map(function(x){return x.id===campaignId?Object.assign({},x,{current_stage:newStage}):x;});
    var updated=CB_CAMPAIGNS.find(function(x){return x.id===campaignId;});
    if(updated) cbRenderCampaignDetail(updated);
  }catch(e){alert('Error: '+e.message);}
}


async function cbNewCampaign(){
  var title=prompt('Campaign title:');
  if(!title||!title.trim()) return;
  var anon=SUPABASE_ANON_KEY;
  try{
    var cr=await fetch(CB_API+'/campaigns',{
      method:'POST',
      headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=representation'}),
      body:JSON.stringify([{title:title.trim(),scope:'brand',status:'active',current_stage:1,created_by:CB_CURRENT_USER||'unknown',confirmed_channels:[]}])
    });
    if(!cr.ok) throw new Error(await cr.text());
    var newCamps=await cr.json();
    var newCamp=newCamps[0];
    var templates=await fetch(CB_API+'/campaign_task_templates?select=*&order=stage,task_order',{headers:getAuthHeaders()}).then(function(r){return r.json();});
    if(Array.isArray(templates)&&templates.length){
      var taskRows=templates.map(function(t){
        return {campaign_id:newCamp.id,stage:t.stage,task_order:t.task_order,task_name:t.task_name,department:t.department,assigned_to:t.default_assignee,approver_scope:t.approver_scope,is_blocker:t.is_blocker,channel:t.channel,completed:false,approved:false,rejected:false,notes:''};
      });
      await fetch(CB_API+'/campaign_tasks',{method:'POST',headers:getAuthHeaders({'Content-Type':'application/json','Prefer':'return=minimal'}),body:JSON.stringify(taskRows)});
    }
    CB_CAMPAIGNS.unshift(newCamp);
    await cbOpenCampaign(newCamp.id);
  }catch(e){alert('Error: '+e.message);}
}


function cbAddBriefButton() { /* disabled - campaign section handles this */ }


async function cbSubmitRejection(taskId, btn) {
  var form = btn.closest('.sw-reject-form');
  var reason = form.querySelector('input').value.trim();
  if (!reason) { form.querySelector('input').style.borderColor = '#DC2626'; form.querySelector('input').focus(); return; }
  btn.textContent = '…'; btn.disabled = true;
  try {
    await cbUpdateTask(taskId, {
      rejected: true, rejected_by: CB_CURRENT_USER,
      rejected_at: new Date().toISOString(), rejection_reason: reason,
      completed: false, approved: false, updated_at: new Date().toISOString()
    });
    showToast('Rejected — ' + reason.substring(0, 40), 'error');
    cbRefreshCurrentView();
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
    btn.textContent = 'Reject'; btn.disabled = false;
  }
}


async function cbSubmitNote(taskId, btn) {
  var form = btn.closest('.sw-note-form');
  var note = form.querySelector('input').value.trim();
  if (!note) return;
  btn.textContent = '…'; btn.disabled = true;
  var task = null;
  Object.values(CB_TASKS).forEach(function(arr){ arr.forEach(function(t){ if(t.id===taskId) task=t; }); });
  var existing = task ? (task.notes || '') : '';
  var combined = existing ? existing + ' | ' + note : note;
  try {
    await cbUpdateTask(taskId, {notes: combined, updated_at: new Date().toISOString()});
    showToast('Note saved 📝', 'success');
    cbRefreshCurrentView();
  } catch(e) {
    showToast('Error: ' + e.message, 'error');
    btn.textContent = 'Save'; btn.disabled = false;
  }
}


function cbRefreshCurrentView() {
  // Refresh whichever campaign view is currently showing
  if (CB_CURRENT) {
    var camp = CB_CAMPAIGNS.find(function(c){ return c.id === CB_CURRENT; });
    if (camp) cbRenderCampaignDetail(camp);
  } else if (window._bbCampModeActive && window._bbCampModeBrief) {
    bbEnterCampaignMode(window._bbCampModeBrief);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  if (typeof cbLoad === 'function') cbLoad();
});
