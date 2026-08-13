/* =========================================================
   customer.js — static customer dashboard.
========================================================= */
import { requireRole, signOut, showToast, paintUserPill, getProjects, getUpdates, getRequests, saveProjects, saveUpdates, saveRequests, getTeamStatuses } from './auth.js';

const STAGES=['Planning','Foundation','Structure','Plastering','Ceiling Construction','Electrical','Painting','Interior','Final Inspection','Handover'];
let profile=null, project=null;

function esc(str=''){const d=document.createElement('div');d.textContent=str;return d.innerHTML;}
function loadProject(){project=getProjects().filter(p=>p.customer_id===profile.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))[0]||null;renderDashboard();}
function loadUpdates(){return project?getUpdates().filter(u=>u.project_id===project.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,10):[];}
function loadChangeRequests(){return project?getRequests().filter(r=>r.project_id===project.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)):[];}

const TEAM_STATUS_META = {
  active: { label:'Active', helper:'On site today', css:'ongoing' },
  available: { label:'Available', helper:'Available for work', css:'available' },
  offsite: { label:'Off Site', helper:'Not on site today', css:'offsite' },
  completed: { label:'Completed', helper:'Work completed', css:'completed' }
};
function renderTeam(){
  const el=document.getElementById('customerTeam');
  if(!el)return;
  const statuses=getTeamStatuses();
  el.innerHTML=statuses.map(t=>{
    const meta=TEAM_STATUS_META[t.status]||TEAM_STATUS_META.available;
    return `<div class="crew-item"><div class="crew-avatar">${esc(t.initials||'TM')}</div><div class="team-info"><strong>${esc(t.name)}</strong><small>${meta.helper}</small></div><span class="status ${meta.css}">${meta.label}</span></div>`;
  }).join('');
}

function renderDashboard(){
  const empty=document.getElementById('emptyState'),content=document.getElementById('dashContent');
  if(!project){empty.classList.remove('hidden');content.classList.add('hidden');return;}
  empty.classList.add('hidden');content.classList.remove('hidden');
  document.getElementById('welcomeName').textContent=`${profile.full_name.split(' ')[0]}'s Home 👋`;
  document.getElementById('statProgress').textContent=`${project.progress}%`;
  const idx=STAGES.indexOf(project.stage);
  const completedStages = Number(project.progress) >= 100 ? STAGES.length : Math.max(idx,0);
  document.getElementById('statCompletedStages').textContent=`${completedStages} / ${STAGES.length}`;
  document.getElementById('statHandover').textContent=project.delivery_date?new Date(project.delivery_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}):'TBC';
  document.getElementById('projectTitle').textContent=project.project_name;
  document.getElementById('projectSub').textContent=`${project.house_type} · ${project.interior}`;
  document.getElementById('customerProgress').textContent=`${project.progress}%`;
  document.getElementById('progressFill').style.width=`${project.progress}%`;document.getElementById('progressFill').innerHTML=`<span>${project.progress}%</span>`;
  document.getElementById('deliveryDate').textContent=project.delivery_date?new Date(project.delivery_date).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}):'To be confirmed';
  document.getElementById('infoBlock').innerHTML=`<strong>Project:</strong> ${esc(project.project_name)}<br><strong>Type:</strong> ${esc(project.house_type)}<br><strong>Customer:</strong> ${esc(profile.full_name)}<br><strong>Location:</strong> ${esc(project.location||'Chennai')}<br><strong>Package:</strong> ${esc(project.interior)}<br><strong>Estimated Value:</strong> ₹${Number(project.total_price||0).toLocaleString('en-IN')}`;
  renderTimeline(); renderUpdates(loadUpdates()); renderTeam(); const req=loadChangeRequests();renderChangeRequests(req);document.getElementById('changeCount').textContent=req.filter(r=>r.status==='pending').length;
}
function renderTimeline(){const idx=STAGES.indexOf(project.stage);const isComplete=Number(project.progress)>=100;document.getElementById('timeline').innerHTML=STAGES.map((stage,i)=>{let cls='pending',icon='○',meta='Pending',progressLabel='';if(isComplete){cls='';icon='✓';meta='Completed';progressLabel=i===STAGES.length-1?`<div class="stage-progress">100%</div>`:'';}else if(i<idx){cls='';icon='✓';meta='Completed';}else if(i===idx){cls='active';icon=stage==='Handover'?'🏠':'🔨';meta='Currently Going On';progressLabel=`<div class="stage-progress">${project.progress}%</div>`;}return `<div class="timeline-item ${cls}"><div class="timeline-icon">${icon}</div><div><strong>${stage}</strong><small>${meta}</small></div>${progressLabel}</div>`}).join('');}
function renderUpdates(updates){const el=document.getElementById('updatesContainer');if(!updates.length){el.innerHTML='<div class="empty-state"><div class="icon">🏗️</div><h4>No updates yet</h4><p>Your builder hasn\'t posted a construction update yet. Check back soon.</p></div>';return;}el.innerHTML=updates.map(u=>`<div class="update-card"><div class="update-date">${new Date(u.created_at).toLocaleString('en-IN',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div><h4>🔨 ${esc(u.title)}</h4><p>${esc(u.body)}</p><div style="margin-top:12px;"><strong>Project Progress: ${u.progress}%</strong></div>${u.photo_url?`<img class="update-photo" src="${u.photo_url}" alt="Construction update">`:''}</div>`).join('');}
function renderChangeRequests(requests){const el=document.getElementById('myRequests');if(!requests.length){el.innerHTML='<p style="color:var(--ink-45);font-size:14px;">You haven\'t requested any changes yet.</p>';return;}el.innerHTML=requests.map(r=>{if(r.status==='pending')return `<div class="change-request"><strong>${esc(r.category)}</strong><div class="cr-body">${esc(r.description)}</div><div class="cr-meta">Status: Under Review</div></div>`;return `<div class="change-request resolved ${r.status==='approved'?'approved':'rejected'}"><strong>${esc(r.category)} — ${r.status==='approved'?'✓ Approved':'✕ Rejected'}</strong><div class="cr-body">${esc(r.description)}</div>${r.status==='approved'?`<div class="cr-meta">Additional cost: ₹${Number(r.additional_cost||0).toLocaleString('en-IN')} · Delivery impact: +${r.delivery_impact_days||0} day(s)</div>`:''}</div>`}).join('');}

window.openChangeModal=function(){if(!project)return showToast('Create a project first',true);document.getElementById('changeModal').classList.add('show');};
window.closeModal=function(id){document.getElementById(id).classList.remove('show');};
window.submitChange=function(){const category=document.getElementById('changeCategory').value,description=document.getElementById('changeDescription').value.trim();if(!description)return showToast('Please describe your requested change.',true);const requests=getRequests();requests.unshift({id:'cr-'+Date.now(),project_id:project.id,category,description,status:'pending',additional_cost:0,delivery_impact_days:0,created_at:new Date().toISOString()});saveRequests(requests);document.getElementById('changeDescription').value='';window.closeModal('changeModal');showToast('Change request submitted for admin review.');renderDashboard();};
window.customerPhoto=function(input){const file=input.files[0];if(!file||!project)return;const reader=new FileReader();reader.onload=e=>{const updates=getUpdates();updates.unshift({id:'up-'+Date.now(),project_id:project.id,stage:project.stage,title:'Photo shared by customer',body:`${profile.full_name} added a reference photo.`,progress:project.progress,photo_url:e.target.result,created_at:new Date().toISOString()});saveUpdates(updates);showToast('Photo added to your project.');renderDashboard();};reader.readAsDataURL(file);};

(async function init(){profile=await requireRole('customer');if(!profile)return;paintUserPill();document.getElementById('logoutBtn').addEventListener('click',signOut);loadProject();window.addEventListener('storage',()=>{loadProject();renderTeam();});})();
