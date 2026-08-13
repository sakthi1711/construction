/* =========================================================
   auth.js — Static demo authentication using localStorage.
   No backend / Supabase required.
========================================================= */

const STORAGE = {
  users: 'buildtrack_users',
  currentUser: 'buildtrack_current_user',
  projects: 'buildtrack_projects',
  updates: 'buildtrack_updates',
  requests: 'buildtrack_change_requests',
  teamStatuses: 'buildtrack_team_statuses'
};


const DEFAULT_TEAM_STATUSES = [
  { id:'civil', name:'Civil Team', initials:'CT', status:'active' },
  { id:'electrical', name:'Electrical Team', initials:'ET', status:'available' },
  { id:'interior', name:'Interior Team', initials:'IT', status:'active' }
];

const DEMO_USERS = [
  { id: 'u-customer-001', full_name: 'Sandhya Kumar', email: 'customer@buildtrack.demo', password: 'customer123', role: 'customer' },
  { id: 'u-admin-001', full_name: 'Aarti Builder Admin', email: 'admin@buildtrack.demo', password: 'admin123', role: 'admin' }
];

const DEMO_PROJECTS = [
  {
    id: 'p-001', customer_id: 'u-customer-001', project_name: 'Villa · Sandhya Kumar',
    house_type: 'Villa', furnishing: 'Fully Furnished', interior: 'Premium Interior',
    features: [{name:'Modular Kitchen',price:150000},{name:'Wardrobe',price:100000}],
    total_price: 4000000, progress: 68, stage: 'Electrical', status: 'ongoing',
    location: 'Chennai', delivery_date: '2026-10-20', created_at: '2026-06-10T09:00:00+05:30'
  },
  {
    id: 'p-002', customer_id: 'u-customer-001', project_name: 'Apartment · Priya Demo',
    house_type: 'Apartment', furnishing: 'Semi Furnished', interior: 'Basic Interior',
    features: [], total_price: 2800000, progress: 100, stage: 'Handover', status: 'completed',
    location: 'Chennai', delivery_date: '2026-07-15', created_at: '2026-03-12T09:00:00+05:30'
  }
];

const DEMO_UPDATES = [
  { id:'up-001', project_id:'p-001', stage:'Electrical', title:'Electrical updated', body:'Wiring and switch-board installation completed for the ground floor. Final testing is in progress.', progress:68, photo_url:'', created_at:'2026-08-12T16:30:00+05:30' },
  { id:'up-002', project_id:'p-001', stage:'Plastering', title:'Plastering updated', body:'Interior wall plastering completed in bedrooms and living area.', progress:58, photo_url:'', created_at:'2026-08-06T15:00:00+05:30' },
  { id:'up-003', project_id:'p-001', stage:'Ceiling Construction', title:'Ceiling Construction updated', body:'False ceiling framework completed in the living and dining areas.', progress:48, photo_url:'', created_at:'2026-07-30T14:00:00+05:30' }
];

const DEMO_REQUESTS = [
  { id:'cr-001', project_id:'p-001', category:'Kitchen', description:'Add two extra electrical sockets above the kitchen counter.', status:'pending', additional_cost:0, delivery_impact_days:0, created_at:'2026-08-11T11:20:00+05:30' },
  { id:'cr-002', project_id:'p-001', category:'Interior', description:'Use a wooden finish for the TV unit.', status:'approved', additional_cost:12000, delivery_impact_days:2, created_at:'2026-07-28T10:10:00+05:30' }
];

function read(key, fallback) {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
  catch { return fallback; }
}
function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

export function seedDemoData() {
  if (!localStorage.getItem(STORAGE.users)) write(STORAGE.users, DEMO_USERS);
  if (!localStorage.getItem(STORAGE.projects)) write(STORAGE.projects, DEMO_PROJECTS);
  if (!localStorage.getItem(STORAGE.updates)) write(STORAGE.updates, DEMO_UPDATES);
  if (!localStorage.getItem(STORAGE.requests)) write(STORAGE.requests, DEMO_REQUESTS);
  if (!localStorage.getItem(STORAGE.teamStatuses)) write(STORAGE.teamStatuses, DEFAULT_TEAM_STATUSES);
}

export function getUsers() { seedDemoData(); return read(STORAGE.users, []); }
export function getProjects() { seedDemoData(); return read(STORAGE.projects, []); }
export function getUpdates() { seedDemoData(); return read(STORAGE.updates, []); }
export function getRequests() { seedDemoData(); return read(STORAGE.requests, []); }
export function getTeamStatuses() { seedDemoData(); return read(STORAGE.teamStatuses, DEFAULT_TEAM_STATUSES); }
export function saveProjects(items) { write(STORAGE.projects, items); }
export function saveUpdates(items) { write(STORAGE.updates, items); }
export function saveRequests(items) { write(STORAGE.requests, items); }
export function saveTeamStatuses(items) { write(STORAGE.teamStatuses, items); }

export function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toastText').textContent = message;
  toast.classList.toggle('error', isError);
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('show'), 3200);
}

export async function getSession() {
  seedDemoData();
  const id = localStorage.getItem(STORAGE.currentUser);
  return id ? { user: { id } } : null;
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  return getUsers().find(u => u.id === session.user.id) || null;
}

export async function requireRole(role) {
  const profile = await getProfile();
  if (!profile) {
    window.location.href = 'index.html?auth=1';
    return null;
  }
  if (profile.role !== role) {
    window.location.href = profile.role === 'admin' ? 'admin.html' : 'customer.html';
    return null;
  }
  return profile;
}

export async function signUp({ email, password, fullName, role }) {
  seedDemoData();
  const users = getUsers();
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists. Please sign in.');
  }
  const user = { id: 'u-' + Date.now(), full_name: fullName, email, password, role };
  users.push(user);
  write(STORAGE.users, users);
  localStorage.setItem(STORAGE.currentUser, user.id);
  return { user };
}

export async function signIn({ email, password }) {
  const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) throw new Error('Invalid email or password. Try one of the demo accounts below.');
  localStorage.setItem(STORAGE.currentUser, user.id);
  return { user };
}

export async function signOut() {
  localStorage.removeItem(STORAGE.currentUser);
  window.location.href = 'index.html';
}

export async function paintUserPill(elementId = 'userPill') {
  const el = document.getElementById(elementId);
  if (!el) return;
  const profile = await getProfile();
  if (!profile) { el.textContent = 'Guest'; return; }
  const initial = profile.full_name?.charAt(0).toUpperCase() || '?';
  el.innerHTML = `<span class="avatar">${initial}</span>${profile.full_name} · ${profile.role === 'admin' ? 'Admin' : 'Customer'}`;
}

export { STORAGE };
