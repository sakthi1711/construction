/* =========================================================
   landing.js — static BuildTrack landing/customizer.
========================================================= */
import { signUp, signIn, getProfile, getSession, getProjects, saveProjects, showToast, seedDemoData } from './auth.js';

function scrollToId(id) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }
window.scrollToId = scrollToId;

const houseByCard = {
  'Modern Villa': { name: 'Villa', price: 3500000 },
  'Luxury Residence': { name: 'Apartment', price: 5500000 },
  'Urban Home': { name: 'Apartment', price: 2800000 }
};

window.selectHouse = function(cardName) {
  const preset = houseByCard[cardName];
  if (preset) {
    document.querySelectorAll('.options')[0].querySelectorAll('.option').forEach(opt => {
      const isVilla = preset.name === 'Villa' && opt.textContent.includes('Villa');
      const isApartment = preset.name === 'Apartment' && opt.textContent.includes('Apartment');
      opt.classList.toggle('selected', isVilla || isApartment);
    });
    customization.house = { name: preset.name, price: preset.price };
    calculatePrice();
  }
  scrollToId('customizer');
  showToast(`${cardName} selected — customize it below`);
};

const customization = {
  house: { name: 'Villa', price: 3500000 },
  furnishing: { name: 'Semi Furnished', price: 0 },
  interior: { name: 'Basic Interior', price: 0 },
  features: []
};

function formatCurrency(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
function calculatePrice() {
  const total = customization.house.price + customization.furnishing.price + customization.interior.price + customization.features.reduce((s,f)=>s+f.price,0);
  document.getElementById('totalPrice').textContent = formatCurrency(total);
  const rows = [[customization.house.name, customization.house.price],[customization.furnishing.name, customization.furnishing.price],[customization.interior.name, customization.interior.price],...customization.features.map(f=>[f.name,f.price])];
  document.getElementById('priceBreakdown').innerHTML = rows.map(([label,price])=>`<div><span>${label}</span><span>${price ? formatCurrency(price) : '—'}</span></div>`).join('');
  return total;
}
window.chooseOption = function(el, category, name, price) {
  el.parentElement.querySelectorAll('.option').forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected'); customization[category] = { name, price }; calculatePrice();
};
window.toggleFeature = function(el, name, price) {
  el.classList.toggle('selected');
  const idx = customization.features.findIndex(f=>f.name===name);
  if (idx >= 0) customization.features.splice(idx,1); else customization.features.push({name,price});
  calculatePrice();
};

window.createProject = async function() {
  const profile = await getProfile();
  if (!profile) { showToast('Please sign in to create your project'); openAuthModal('signup','customer'); return; }
  if (profile.role !== 'customer') { showToast('Only customer accounts can create a project', true); return; }

  const total = calculatePrice();
  const btn = document.getElementById('createProjectBtn'); btn.disabled = true; btn.innerHTML='<span class="spinner"></span> Creating…';
  const projects = getProjects();
  const project = {
    id:'p-'+Date.now(), customer_id:profile.id, project_name:`${customization.house.name} · ${profile.full_name}`,
    house_type:customization.house.name, furnishing:customization.furnishing.name, interior:customization.interior.name,
    features:customization.features, total_price:total, progress:0, stage:'Planning', status:'ongoing', location:'Chennai', delivery_date:'2026-12-20', created_at:new Date().toISOString()
  };
  projects.unshift(project); saveProjects(projects);
  btn.disabled=false; btn.textContent='Create My Project →';
  showToast('Project created successfully!');
  setTimeout(()=>window.location.href='customer.html',500);
};

let authMode='login', authRole='customer';
window.openAuthModal=function(mode='login',role='customer'){authMode=mode;authRole=role;renderAuthModal();document.getElementById('authModal').classList.add('show');};
window.closeAuthModal=function(){document.getElementById('authModal').classList.remove('show');};
window.setAuthMode=function(mode){authMode=mode;renderAuthModal();};
window.setAuthRole=function(role){authRole=role;renderAuthModal();};
function renderAuthModal(){
  document.getElementById('authTabLogin').classList.toggle('active',authMode==='login');
  document.getElementById('authTabSignup').classList.toggle('active',authMode==='signup');
  document.getElementById('nameField').classList.toggle('hidden',authMode!=='signup');
  document.getElementById('roleField').classList.toggle('hidden',authMode!=='signup');
  document.getElementById('roleCustomer').classList.toggle('selected',authRole==='customer');
  document.getElementById('roleAdmin').classList.toggle('selected',authRole==='admin');
  document.getElementById('authSubmitBtn').textContent=authMode==='login'?'Sign In →':'Create Account →';
  document.getElementById('authError').classList.remove('show');
}

window.submitAuth=async function(){
  const email=document.getElementById('authEmail').value.trim(), password=document.getElementById('authPassword').value, fullName=document.getElementById('authName').value.trim();
  const errorEl=document.getElementById('authError'), btn=document.getElementById('authSubmitBtn'); errorEl.classList.remove('show');
  if(!email||!password||(authMode==='signup'&&!fullName)){errorEl.textContent='Please fill in all fields.';errorEl.classList.add('show');return;}
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span>';
  try{
    if(authMode==='signup') await signUp({email,password,fullName,role:authRole}); else await signIn({email,password});
    const profile=await getProfile(); closeAuthModal(); showToast('Welcome to BuildTrack!');
    setTimeout(()=>window.location.href=profile?.role==='admin'?'admin.html':'customer.html',400);
  }catch(err){errorEl.textContent=err.message||'Something went wrong.';errorEl.classList.add('show');}
  finally{btn.disabled=false;renderAuthModal();}
};

(function init(){
  seedDemoData(); calculatePrice();
  const params=new URLSearchParams(window.location.search); if(params.get('auth')==='1') openAuthModal('login','customer');
  getSession().then(async session=>{
    const pill=document.getElementById('userPill');
    if(session){const profile=await getProfile();pill.textContent=profile?`${profile.full_name} · ${profile.role==='admin'?'Admin':'Customer'}`:'Account';pill.onclick=()=>window.location.href=profile?.role==='admin'?'admin.html':'customer.html';}
    else {pill.textContent='Sign In';pill.onclick=()=>openAuthModal('login','customer');}
  });
})();
