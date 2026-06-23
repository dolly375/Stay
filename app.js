// ============================================================
// StayEasy — Shared JS Utilities
// ============================================================

const API = 'http://localhost:8080/api';
const FACILITIES = ['WiFi','Food','AC','Parking','Laundry','CCTV','Gym','Hot Water','Power Backup'];

// ---- Auth (stored in localStorage) ----
const Auth = {
  save(d) {
    localStorage.setItem('se_token', d.token);
    localStorage.setItem('se_user', JSON.stringify({ id:d.userId, name:d.name, email:d.email, role:d.role }));
  },
  token()    { return localStorage.getItem('se_token'); },
  user()     { const u = localStorage.getItem('se_user'); return u ? JSON.parse(u) : null; },
  loggedIn() { return !!this.token(); },
  logout()   { localStorage.clear(); location.href = 'login.html'; },
  guard(role) {
    const u = this.user();
    if (!u || (role && u.role !== role)) {
      Toast.show('Please log in first.', 'err');
      setTimeout(() => location.href = 'login.html', 1000);
      return false;
    }
    return true;
  }
};

// ---- HTTP helpers ----
const Http = {
  headers(isForm) {
    const h = {};
    if (!isForm) h['Content-Type'] = 'application/json';
    const t = Auth.token();
    if (t) h['X-Auth-Token'] = t;
    return h;
  },
  async _do(method, path, body, isForm) {
    const res = await fetch(API + path, {
      method, headers: this.headers(isForm), body
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) throw new Error(json.message || 'Request failed');
    return json.data;
  },
  get(path)         { return this._do('GET',    path, null, false); },
  post(path, body)  { return this._do('POST',   path, JSON.stringify(body), false); },
  put(path, body)   { return this._do('PUT',    path, body ? JSON.stringify(body) : null, false); },
  del(path)         { return this._do('DELETE', path, null, false); },
  postForm(path, fd){ return this._do('POST',   path, fd, true); },
  putForm(path, fd) { return this._do('PUT',    path, fd, true); },
};

// ---- Toast notifications ----
const Toast = {
  box: null,
  _init() {
    if (!this.box) {
      this.box = document.createElement('div');
      this.box.className = 'toasts';
      document.body.appendChild(this.box);
    }
  },
  show(msg, type = 'ok', ms = 3200) {
    this._init();
    const icons = { ok:'✅', err:'❌' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `${icons[type]||''} ${msg}`;
    this.box.appendChild(el);
    setTimeout(() => el.remove(), ms);
  }
};

// ---- Navbar ----
function renderNav(active) {
  const u = Auth.user();
  const dashHref = u?.role === 'ADMIN' ? 'admin.html'
                 : u?.role === 'OWNER' ? 'owner.html'
                 : 'user.html';
  document.getElementById('nav').innerHTML = `
    <nav class="nav">
      <a class="nav-brand" href="index.html">🏠 StayEasy</a>
      <div class="nav-links">
        <a class="nav-link" href="index.html">Browse PGs</a>
        ${u ? `
          <a class="nav-link" href="${dashHref}">Dashboard</a>
          <span style="color:var(--muted);font-size:.85rem;padding:0 .4rem;">Hi, ${u.name.split(' ')[0]}</span>
          <button class="btn btn-outline btn-sm" onclick="Auth.logout()">Logout</button>
        ` : `
          <a class="btn btn-ghost btn-sm" href="login.html">Login</a>
          <a class="btn btn-primary btn-sm" href="register.html">Register</a>
        `}
      </div>
    </nav>`;
}

// ---- PG Card ----
function pgCard(pg, onclick) {
  const facs = (pg.facilities || '').split(',').filter(Boolean).slice(0,3);
  const imgEl = pg.imageUrl
    ? `<img class="pg-card-img" src="http://localhost:8080${pg.imageUrl}" alt="${pg.title}"
           onerror="this.outerHTML='<div class=pg-card-img>🏠</div>'">`
    : `<div class="pg-card-img">🏠</div>`;
  return `
    <div class="pg-card" onclick="${onclick}(${pg.id})">
      ${imgEl}
      <div class="pg-card-body">
        <div class="pg-card-title">${pg.title}</div>
        <div class="pg-card-loc">📍 ${pg.area}, ${pg.city}</div>
        <div class="pg-card-rent">₹${Number(pg.rent).toLocaleString('en-IN')}<span>/month</span></div>
        <div class="tags">
          <span class="tag blue">${pg.roomType}</span>
          ${facs.map(f=>`<span class="tag">${f}</span>`).join('')}
        </div>
        <button class="btn btn-primary" style="width:100%;justify-content:center;">View Details</button>
      </div>
    </div>`;
}

// ---- Facility checkboxes builder ----
function buildFacChecks(containerId, selected = '') {
  const sel = selected.split(',').map(s=>s.trim()).filter(Boolean);
  document.getElementById(containerId).innerHTML =
    FACILITIES.map(f => `
      <label class="fac-item">
        <input type="checkbox" value="${f}" ${sel.includes(f)?'checked':''}>
        ${f}
      </label>`).join('');
}

function getCheckedFacs(containerId) {
  return [...document.querySelectorAll(`#${containerId} input:checked`)]
    .map(c=>c.value).join(',');
}

// ---- Loader / Empty ----
function loader(id)           { document.getElementById(id).innerHTML = `<div class="loader"><div class="spin"></div> Loading…</div>`; }
function empty(id, msg, icon) { document.getElementById(id).innerHTML = `<div class="empty"><div class="icon">${icon||'📭'}</div><h3>${msg}</h3></div>`; }

// ---- Date format ----
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
}