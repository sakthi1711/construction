/* =========================================================
   admin.js — static admin dashboard.
========================================================= */
import { requireRole, signOut, showToast, paintUserPill, getProjects, getUpdates, getRequests, saveProjects, saveUpdates, saveRequests, getTeamStatuses, saveTeamStatuses } from './auth.js';

const STAGES=['Planning','Foundation','Structure','Plastering','Ceiling Construction','Electrical','Painting','Interior','Final Inspection','Handover'];
let projects=[],pendingRequests=[];
const esc=s=>{const d=document.createElement('div');d.textContent=s??'';return d.innerHTML;};

function loadProjects(){projects=getProjects().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));let changed=false;projects.forEach(p=>{if(Number(p.progress)>=100){if(p.progress!==100){p.progress=100;changed=true;}if(p.stage!=='Handover'){p.stage='Handover';changed=true;}if(p.status!=='completed'){p.status='completed';changed=true;}}});if(changed)saveProjects(projects);renderStats();renderProjectsTable();populateProjectSelect();}
function loadChangeRequests(){pendingRequests=getRequests().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));renderChangeRequests();document.getElementById('adminChangeCount').textContent=pendingRequests.filter(r=>r.status==='pending').length;}
function renderStats(){document.getElementById('statTotal').textContent=projects.length;document.getElementById('statOngoing').textContent=projects.filter(p=>p.status==='ongoing').length;document.getElementById('statCompleted').textContent=projects.filter(p=>p.status==='completed').length;}
function customerName(id){const users=JSON.parse(localStorage.getItem('buildtrack_users')||'[]');return users.find(u=>u.id===id)?.full_name||'Customer';}
function renderProjectsTable(){const tbody=document.getElementById('projectsBody');if(!projects.length){tbody.innerHTML='<tr><td colspan="5"><div class="empty-state"><div class="icon">🏗️</div><h4>No projects yet</h4><p>Projects appear here once a customer creates one.</p></div></td></tr>';return;}tbody.innerHTML=projects.map(p=>`<tr class="admin-row" onclick="window.openProjectDetail('${p.id}')"><td><strong>${esc(p.project_name)}</strong></td><td>${esc(customerName(p.customer_id))}</td><td><span class="mini-bar"><span style="width:${p.progress}%"></span></span>${p.progress}%</td><td>${esc(p.stage)}</td><td><span class="status ${p.status}">${p.status}</span></td></tr>`).join('');}
window.openProjectDetail=function(id){document.getElementById('updateProject').value=id;openUpdateModal();};
function renderChangeRequests(){const el=document.getElementById('adminRequests');const pending=pendingRequests.filter(r=>r.status==='pending');if(!pending.length){el.innerHTML='<p style="color:var(--ink-45);font-size:14px;">No pending change requests.</p>';return;}el.innerHTML=pending.map(r=>`<div class="change-request" data-id="${r.id}"><strong>${esc(projects.find(p=>p.id===r.project_id)?.project_name||'Project')} · ${esc(customerName(projects.find(p=>p.id===r.project_id)?.customer_id))}</strong><div class="cr-body"><strong>${esc(r.category)}:</strong> ${esc(r.description)}</div><div class="change-buttons"><button class="approve" onclick="window.approveChange('${r.id}')">✓ Approve</button><button class="reject" onclick="window.rejectChange('${r.id}')">Reject</button></div></div>`).join('');}
window.approveChange=function(id){const cost=prompt('Additional cost for this change (₹)','2500');if(cost===null)return;const days=prompt('Delivery impact (days)','1');if(days===null)return;const requests=getRequests();const r=requests.find(x=>x.id===id);if(!r)return;r.status='approved';r.additional_cost=Number(cost)||0;r.delivery_impact_days=Number(days)||0;saveRequests(requests);showToast('Change approved. Customer has been notified.');loadChangeRequests();};
window.rejectChange=function(id){const requests=getRequests();const r=requests.find(x=>x.id===id);if(!r)return;r.status='rejected';saveRequests(requests);showToast('Change request rejected.');loadChangeRequests();};
function populateProjectSelect(){const select=document.getElementById('updateProject');select.innerHTML=projects.map(p=>`<option value="${p.id}">${esc(p.project_name)} — ${esc(customerName(p.customer_id))}</option>`).join('');}
window.openUpdateModal=function(){if(!projects.length)return showToast('No projects to update yet.',true);document.getElementById('updateModal').classList.add('show');};
window.closeModal=function(id){document.getElementById(id).classList.remove('show');};
window.previewAdminPhoto=function(input){const file=input.files[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{const preview=document.getElementById('adminPhotoPreview');preview.src=e.target.result;preview.style.display='block';};reader.readAsDataURL(file);};
window.publishUpdate=function(){const projectId=document.getElementById('updateProject').value,stage=document.getElementById('updateStage').value,body=document.getElementById('updateText').value.trim()||'Construction work has been updated today.',progress=Math.max(0,Math.min(100,parseInt(document.getElementById('updateProgress').value)||0)),photoInput=document.getElementById('adminPhoto'),btn=document.getElementById('publishBtn');if(!projectId)return showToast('Select a project first.',true);const project=projects.find(p=>p.id===projectId);if(!project)return;if(progress>=100){stage='Handover';}btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Publishing…';
  const save=photoUrl=>{const updates=getUpdates();updates.unshift({id:'up-'+Date.now(),project_id:projectId,stage,title:`${stage} updated`,body,progress,photo_url:photoUrl||'',created_at:new Date().toISOString()});saveUpdates(updates);project.progress=progress;project.stage=stage;project.status=progress>=100?'completed':'ongoing';saveProjects(projects);btn.disabled=false;btn.textContent='Publish Update';document.getElementById('updateText').value='';photoInput.value='';document.getElementById('adminPhotoPreview').style.display='none';window.closeModal('updateModal');showToast('Construction update published. Customer can now see it.');loadProjects();};
  if(photoInput.files[0]){const reader=new FileReader();reader.onload=e=>save(e.target.result);reader.readAsDataURL(photoInput.files[0]);}else save('');
};

const TEAM_META = [
  { id:'civil', name:'Civil Team', initials:'CT' },
  { id:'electrical', name:'Electrical Team', initials:'ET' },
  { id:'interior', name:'Interior Team', initials:'IT' }
];
const TEAM_STATUS_META = {
  active: { label:'Active', helper:'On site today', css:'ongoing' },
  available: { label:'Available', helper:'Available for work', css:'available' },
  offsite: { label:'Off Site', helper:'Not on site today', css:'offsite' },
  completed: { label:'Completed', helper:'Work completed', css:'completed' }
};
function renderTeamControls(){
  const statuses=getTeamStatuses();
  const byId=Object.fromEntries(statuses.map(t=>[t.id,t]));
  const el=document.getElementById('teamControls');
  if(!el)return;
  el.innerHTML=TEAM_META.map(t=>{
    const current=byId[t.id]?.status||'available';
    return `<div class="crew-item team-control-row">
      <div class="crew-avatar">${t.initials}</div>
      <div class="team-info"><strong>${t.name}</strong><small>Set the current team availability</small></div>
      <select class="team-status-select" data-team-id="${t.id}" aria-label="${t.name} status">
        ${Object.entries(TEAM_STATUS_META).map(([value,m])=>`<option value="${value}" ${current===value?'selected':''}>${m.label}</option>`).join('')}
      </select>
    </div>`;
  }).join('');
}
window.saveTeamStatus=function(){
  const existing=getTeamStatuses();
  const byId=Object.fromEntries(existing.map(t=>[t.id,t]));
  document.querySelectorAll('.team-status-select').forEach(select=>{
    const id=select.dataset.teamId;
    if(byId[id]) byId[id].status=select.value;
  });
  const updated=TEAM_META.map(t=>({...(byId[t.id]||{}), ...t, status:byId[t.id]?.status||'available'}));
  saveTeamStatuses(updated);
  renderTeamControls();
  showToast('Construction team statuses updated. Customers can now see the changes.');
};

(async function init(){const profile=await requireRole('admin');if(!profile)return;paintUserPill();document.getElementById('logoutBtn').addEventListener('click',signOut);loadProjects();loadChangeRequests();renderTeamControls();window.addEventListener('storage',()=>{loadProjects();loadChangeRequests();renderTeamControls();});})();
