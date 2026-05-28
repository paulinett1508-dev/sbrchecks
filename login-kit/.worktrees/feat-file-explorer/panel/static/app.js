// panel/static/app.js
let currentUser = null;

async function init() {
  const r = await fetch('/api/me');
  if (!r.ok) { window.location.href = '/login'; return; }
  currentUser = await r.json();
  document.getElementById('topUser').textContent = currentUser.sub + ' · ' + currentUser.role;
  if (currentUser.role === 'superadmin') {
    document.getElementById('navTerminal').style.display = 'flex';
  }
  updateClock();
  setInterval(updateClock, 1000);
  startTopbarSSE();
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', () => navigate(el.dataset.page));
  });
  navigate('dashboard');
}

let sseSource = null;

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const el = document.querySelector('.nav-item[data-page="' + page + '"]');
  if (el) el.classList.add('active');
  if (sseSource) { sseSource.close(); sseSource = null; }
  _migClearTimer();
  if (typeof _deltaClearTimer === 'function') _deltaClearTimer();
  if (typeof _bkgClearTimer   === 'function') _bkgClearTimer();
  const main = document.getElementById('main');
  main.textContent = '';
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.textContent = 'Carregando...';
  main.appendChild(loading);
  const loaders = {
    alertas: fetchAlertas, dashboard: fetchDashboard, discos: fetchDiscos, shares: fetchShares,
    servicos: fetchServicos, conexoes: fetchConexoes, usuarios: fetchUsuarios,
    migracao: fetchMigracao, 'delta-sync': fetchDeltaSync, cutover: fetchCutover,
    backup: fetchBackup, 'backup-gdrive': fetchBackupGDrive,
    logs: fetchLogs, admin: fetchAdmin, terminal: renderTerminal,
    'file-audit': fetchFileAudit,
  };
  if (loaders[page]) loaders[page]();
}

function updateClock() {
  const now = new Date();
  const days = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const months = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  document.getElementById('clock').textContent =
    days[now.getDay()] + ' ' + String(now.getDate()).padStart(2,'0') + ' ' +
    months[now.getMonth()] + ' ' + now.getFullYear() + ' · ' +
    String(now.getHours()).padStart(2,'0') + ':' +
    String(now.getMinutes()).padStart(2,'0') + ':' +
    String(now.getSeconds()).padStart(2,'0');
}

let _lastAlertCount = 0;
let _alertsViewedAt = 0; // unread count when user last visited Alertas page

function _updateAlertBadges(count) {
  // Badge só aparece se há alertas E são mais do que quando o usuário visitou a página
  const show = count > 0 && count > _alertsViewedAt;
  const bell = document.getElementById('alertBadge');
  const side = document.getElementById('sideAlertBadge');
  const bellBtn = bell ? bell.closest('.bell-btn') : null;
  if (bell) {
    bell.textContent = count;
    bell.style.display = show ? 'inline-flex' : 'none';
  }
  if (side) {
    side.textContent = count;
    side.style.display = show ? 'inline-flex' : 'none';
  }
  if (bellBtn) bellBtn.classList.toggle('has-alerts', show);
  if (count > _lastAlertCount) {
    _showToast('⚑ ' + count + ' alerta(s) ativo(s) — verifique a página Alertas', 'warning');
  }
  _lastAlertCount = count;
}

function _showToast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'info');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 5000);
}

function _updateProcBadges(deltaRunning, bkgRunning) {
  const db = document.getElementById('navDeltaBadge');
  const bb = document.getElementById('navBkgBadge');
  if (db) db.style.display = deltaRunning ? 'inline-block' : 'none';
  if (bb) bb.style.display = bkgRunning  ? 'inline-block' : 'none';
}

function startTopbarSSE() {
  const es = new EventSource('/api/dashboard/sse-topbar');
  es.onmessage = (e) => {
    const d = JSON.parse(e.data);
    const dots = document.getElementById('svcDots');
    dots.textContent = '';
    d.services.forEach(s => {
      const span = document.createElement('span');
      span.className = 'svc-dot';
      const dot = document.createElement('span');
      dot.className = 'dot dot-' + (s.active ? 'green' : 'red');
      span.appendChild(dot);
      span.appendChild(document.createTextNode(s.name));
      dots.appendChild(span);
    });
    if (typeof d.alert_count === 'number') _updateAlertBadges(d.alert_count);
    _updateProcBadges(d.delta_running, d.backup_gdrive_running);
  };
  es.onerror = () => { es.close(); setTimeout(startTopbarSSE, 5000); };
}

async function logout() {
  await fetch('/api/logout', {method: 'POST'});
  window.location.href = '/login';
}

async function apiGet(path) {
  const r = await fetch(path);
  if (r.status === 401) { window.location.href = '/login'; return null; }
  return r.ok ? r.json() : null;
}

async function apiPost(path, body) {
  const r = await fetch(path, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body || {})
  });
  if (r.status === 401) { window.location.href = '/login'; return null; }
  if (r.ok) return r.json();
  // Extrai detalhe do erro para exibição ao chamador
  try { return await r.json(); } catch { return null; }
}

function pctColor(p) {
  if (p >= 90) return '#f85149';
  if (p >= 80) return '#d29922';
  return '#3fb950';
}

function esc(str) {
  const d = document.createElement('div');
  d.textContent = String(str == null ? '' : str);
  return d.innerHTML;
}

// Safe embedding of JS values inside HTML onclick="..." attributes.
// JSON.stringify wraps in double quotes and escapes special chars;
// &quot; encodes the resulting double quotes for the HTML attribute context.
function jse(val) {
  return JSON.stringify(String(val == null ? '' : val)).replace(/"/g, '&quot;');
}

function setPageHtml(html) {
  document.getElementById('main').innerHTML = html;
}

function diskHtml(disks) {
  return disks.map(d =>
    '<div class="disk-row">' +
    '<div class="disk-header"><span class="disk-name">' + esc(d.device) + ' — ' + esc(d.mount) + '</span>' +
    '<span class="disk-pct" style="color:' + pctColor(d.percent) + '">' + esc(d.percent) + '%</span></div>' +
    '<div class="disk-bar"><div class="disk-fill" style="width:' + esc(d.percent) + '%;background:' + pctColor(d.percent) + '"></div></div>' +
    '<div class="disk-detail">' + esc(d.avail) + ' livres de ' + esc(d.size) + '</div>' +
    '</div>'
  ).join('');
}

function sessionHtml(sessions, deniedUsers) {
  deniedUsers = deniedUsers || [];
  return sessions.map(s => {
    const warn = deniedUsers.includes(s.username);
    const initials = s.fullname.split(' ').slice(0,2).map(w => w[0]).join('');
    return '<div class="session-row' + (warn ? ' warn' : '') + '">' +
      '<div class="session-avatar"' + (warn ? ' style="background:#3d2a00;color:#d29922"' : '') + '>' + esc(initials) + '</div>' +
      '<div class="session-info">' +
        '<div class="session-name">' + esc(s.fullname) + (warn ? ' <span class="session-warn">&#9888; acesso negado</span>' : '') + '</div>' +
        '<div class="session-meta">' + esc(s.username) + ' · ' + esc(s.group) + '</div>' +
      '</div>' +
      '<span class="session-share"' + (warn ? ' style="background:#3d2a00;color:#d29922"' : '') + '>' + esc(s.share) + '</span>' +
      '<span class="session-time">' + esc(s.duration) + '</span>' +
      '<div class="session-actions">' +
        '<button class="btn-sm" onclick="openAudit(' + jse(s.username) + ',' + jse(s.fullname) + ')">auditar</button>' +
        '<button class="btn-sm danger" onclick="disconnectUser(' + jse(s.username) + ')">desconectar</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

async function disconnectUser(username) {
  if (!confirm('Desconectar ' + username + ' do Samba?')) return;
  const r = await apiPost('/api/conexoes/disconnect', {username});
  if (r) alert(username + ' desconectado.');
}

async function openAudit(username, fullname) {
  const data = await apiGet('/api/logs/audit/' + encodeURIComponent(username));
  if (!data) return;
  document.getElementById('auditTitle').textContent = fullname;
  document.getElementById('auditSub').textContent = username;
  document.getElementById('auditAcessos').textContent = data.stats.acessos;
  document.getElementById('auditMods').textContent = data.stats.modificacoes;
  document.getElementById('auditUploads').textContent = data.stats.uploads;
  document.getElementById('auditNegados').textContent = data.stats.negados;
  const tl = document.getElementById('auditTimeline');
  tl.textContent = '';
  data.timeline.forEach(e => {
    const item = document.createElement('div'); item.className = 'timeline-item';
    const t = document.createElement('span'); t.className = 'tl-time'; t.textContent = e.timestamp;
    const op = document.createElement('span'); op.className = 'tl-op ' + e.op; op.textContent = e.op;
    const f = document.createElement('span'); f.className = 'tl-file'; f.title = e.file; f.textContent = e.share + '/' + e.file;
    item.appendChild(t); item.appendChild(op); item.appendChild(f); tl.appendChild(item);
  });
  document.getElementById('auditModal').classList.add('open');
}

function exportAudit(fmt) {
  const username = document.getElementById('auditSub').textContent;
  window.open('/api/logs/export/' + encodeURIComponent(username) + '?format=' + fmt);
}

async function fetchDashboard() {
  const d = await apiGet('/api/dashboard');
  if (!d) return;
  const denied = (d.connections || []).filter(c => c.warn).map(c => c.username);
  const svcHtml = (d.services || []).map(s =>
    '<div class="svc-row"><span class="dot ' + (s.active ? 'dot-green' : 'dot-red') + '"></span>' +
    '<span class="svc-name">' + esc(s.name) + '</span>' +
    '<span class="svc-status">' + esc(s.active ? 'ativo' : 'inativo') + '</span>' +
    '<button class="btn-sm" onclick="restartSvc(' + jse(s.name) + ')">restart</button></div>'
  ).join('');
  const activeCount = (d.services || []).filter(s => s.active).length;
  const totalSvc = (d.services || []).length;
  const warnDisk = (d.disks || []).some(x => x.percent >= 80);
  const okDisks = (d.disks || []).filter(x => x.percent < 80).length;
  const diskAlerts = d.disk_alerts || [];
  const alertBanner = diskAlerts.length > 0
    ? '<div class="alert-banner">&#9888; DISCO COM USO ELEVADO: ' +
        diskAlerts.map(a => '<strong>' + esc(a.mount) + '</strong> ' + esc(a.percent) + '% — ' + esc(a.avail) + ' livres').join(' &nbsp;·&nbsp; ') +
      '</div>'
    : '';
  setPageHtml(
    alertBanner +
    '<div class="page-title">Dashboard</div>' +
    '<div class="page-sub">Visão geral — atualizado em tempo real</div>' +
    '<div class="cards-row">' +
      '<div class="stat-card green"><div class="stat-label">SERVIÇOS ATIVOS</div>' +
        '<div class="stat-value green">' + activeCount + '/' + totalSvc + '</div>' +
        '<div class="stat-sub">' + (d.services||[]).map(s=>esc(s.name)).join(' · ') + '</div></div>' +
      '<div class="stat-card blue"><div class="stat-label">SHARES SAMBA</div>' +
        '<div class="stat-value blue">19</div><div class="stat-sub">12 críticos · 7 secundários</div></div>' +
      '<div class="stat-card purple"><div class="stat-label">CONEXÕES ATIVAS</div>' +
        '<div class="stat-value purple">' + (d.connections||[]).length + '</div>' +
        '<div class="stat-sub">labsobralnet.ind</div></div>' +
      '<div class="stat-card yellow"><div class="stat-label">DISCOS OK</div>' +
        '<div class="stat-value ' + (warnDisk?'yellow':'green') + '">' + okDisks + '/' + (d.disks||[]).length + '</div>' +
        '<div class="stat-sub">alerta se uso &gt; 80%</div></div>' +
    '</div>' +
    '<div class="grid-2">' +
      '<div class="panel"><div class="panel-title">DISCOS</div>' + diskHtml(d.disks||[]) + '</div>' +
      '<div class="panel"><div class="panel-title">SERVIÇOS</div>' + svcHtml + '</div>' +
    '</div>' +
    '<div class="panel">' +
      '<div class="panel-title">USUÁRIOS CONECTADOS — SMB' +
        '<span style="color:#484f58;font-weight:400;margin-left:8px;font-size:10px">via smbstatus + AD</span></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + sessionHtml(d.connections||[],denied) + '</div>' +
    '</div>'
  );
}

async function fetchDiscos() {
  const d = await apiGet('/api/discos');
  if (!d) return;
  setPageHtml(
    '<div class="page-title">Discos</div>' +
    '<div class="page-sub">Uso de armazenamento por ponto de montagem</div>' +
    '<div class="panel"><table><thead><tr><th>DEVICE</th><th>MOUNT</th><th>TOTAL</th><th>USADO</th><th>LIVRE</th><th>USO</th></tr></thead><tbody>' +
    (d.disks||[]).map(k =>
      '<tr><td style="font-family:monospace">' + esc(k.device) + '</td>' +
      '<td style="font-family:monospace">' + esc(k.mount) + '</td>' +
      '<td>' + esc(k.size) + '</td><td>' + esc(k.used) + '</td><td>' + esc(k.avail) + '</td>' +
      '<td><span class="badge badge-' + (k.percent>=90?'red':k.percent>=80?'yellow':'green') + '">' + esc(k.percent) + '%</span></td></tr>'
    ).join('') +
    '</tbody></table></div>'
  );
}

async function fetchShares() {
  const d = await apiGet('/api/shares');
  if (!d) return;
  setPageHtml(
    '<div class="page-title">Shares Samba</div>' +
    '<div class="page-sub">' + esc(d.total||0) + ' compartilhamentos configurados</div>' +
    '<div class="panel"><table><thead><tr><th>SHARE</th><th>GRUPO AD</th><th>CONEXÕES</th></tr></thead><tbody>' +
    (d.shares||[]).map(s =>
      '<tr><td style="font-family:monospace;color:#58a6ff">' + esc(s.name) + '</td>' +
      '<td style="color:#8b949e;font-size:11px">' + esc(s.group) + '</td>' +
      '<td><span class="badge badge-' + (s.active_connections?'green':'blue') + '">' + (s.active_connections?'ativo':'livre') + '</span></td></tr>'
    ).join('') +
    '</tbody></table></div>'
  );
}

async function fetchServicos() {
  const d = await apiGet('/api/servicos');
  if (!d) return;
  setPageHtml(
    '<div class="page-title">Servi\u00e7os</div>' +
    '<div class="page-sub">Status e controle dos servi\u00e7os do sistema</div>' +
    (d.services||[]).map(s =>
      '<div class="panel"><div class="panel-title">' + esc(s.name) +
        ' <span class="badge badge-' + (s.active?'green':'red') + '">' + esc(s.status) + '</span></div>' +
      '<div style="font-size:11px;color:#8b949e;margin-bottom:8px">PID: ' + esc(s.pid) + ' \u00b7 desde: ' + esc(s.since) + '</div>' +
      '<button class="btn-sm primary" onclick="restartSvc(' + jse(s.name) + ')">Restart</button>' +
      '<button class="btn-sm" style="margin-left:6px" onclick="showSvcLogs(' + jse(s.name) + ')">Ver logs</button>' +
      '<pre id="logs-' + esc(s.name) + '" style="display:none;margin-top:10px;background:#0d1117;padding:10px;border-radius:4px;font-size:10px;color:#8b949e;overflow-x:auto;white-space:pre-wrap"></pre>' +
      '</div>'
    ).join('')
  );
}

async function restartSvc(name) {
  if (!confirm('Reiniciar ' + name + '?')) return;
  const r = await apiPost('/api/servicos/' + encodeURIComponent(name) + '/restart');
  if (r && r.ok) { alert(name + ' reiniciado.'); fetchServicos(); }
  else if (r) alert('Erro: ' + (r.error || 'desconhecido'));
}

async function showSvcLogs(name) {
  const el = document.getElementById('logs-' + name);
  if (el.style.display !== 'none') { el.style.display = 'none'; return; }
  const d = await apiGet('/api/servicos/' + encodeURIComponent(name) + '/logs');
  if (d) { el.textContent = d.logs; el.style.display = 'block'; }
}

async function fetchConexoes() {
  const d = await apiGet('/api/conexoes');
  if (!d) return;
  const sessions = Object.values(d.sessions || {});
  setPageHtml(
    '<div class="page-title">Conex\u00f5es SMB</div>' +
    '<div class="page-sub">' + sessions.length + ' sess\u00f5es ativas \u00b7 smbstatus</div>' +
    '<div class="panel"><table><thead><tr>' +
    '<th>USU\u00c1RIO</th><th>M\u00c1QUINA</th><th>SHARE</th><th>CONECTADO</th><th>A\u00c7\u00c3O</th>' +
    '</tr></thead><tbody>' +
    sessions.map(s => {
      const rawUser = (s.username||'').split('\\').pop().split('@')[0];
      return '<tr><td style="font-family:monospace">' + esc(rawUser) + '</td>' +
        '<td style="color:#8b949e">' + esc(s.machine||'') + '</td>' +
        '<td style="color:#58a6ff">' + esc(s.share||'') + '</td>' +
        '<td style="color:#484f58;font-family:monospace;font-size:10px">' + esc(s.connected_at||'') + '</td>' +
        '<td><button class="btn-sm danger" onclick="disconnectUser(' + jse(rawUser) + ')">desconectar</button></td></tr>';
    }).join('') +
    '</tbody></table></div>'
  );
}

let _usuariosAll = [];
let _usuariosCacheOk = false;
let _usrFilter = '';
let _usrSortCol = 'fullname';
let _usrSortDir = 1; // 1=A-Z, -1=Z-A

async function fetchUsuarios() {
  const d = await apiGet('/api/usuarios');
  if (!d) return;
  _usuariosAll = d.users || [];
  _usuariosCacheOk = !!d.cache_ok;
  _usrFilter = '';
  _renderUsuarios();
}

function _usrSort(col) {
  if (_usrSortCol === col) { _usrSortDir *= -1; } else { _usrSortCol = col; _usrSortDir = 1; }
  _renderUsuarios();
}

function _renderUsuarios(filter) {
  if (filter !== undefined) _usrFilter = filter;
  const q = _usrFilter.toLowerCase();
  let visible = q
    ? _usuariosAll.filter(u =>
        u.username.toLowerCase().includes(q) ||
        (u.fullname||'').toLowerCase().includes(q) ||
        (u.department||'').toLowerCase().includes(q))
    : [..._usuariosAll];

  visible.sort((a, b) => {
    const va = (a[_usrSortCol] || '').toLowerCase();
    const vb = (b[_usrSortCol] || '').toLowerCase();
    return va < vb ? -_usrSortDir : va > vb ? _usrSortDir : 0;
  });

  const adCount = _usuariosAll.filter(u => u.type === 'ad').length;
  const localCount = _usuariosAll.filter(u => u.type === 'local').length;
  const cacheNote = _usuariosCacheOk
    ? '<span style="color:#3fb950">\u2713 dados do AD</span>'
    : '<span style="color:#d29922">\u26a0 sem conex\u00e3o AD</span>';

  const arrow = col => _usrSortCol === col ? (_usrSortDir === 1 ? ' \u25b2' : ' \u25bc') : ' \u25b7';
  const th = (col, label) =>
    '<th style="cursor:pointer;user-select:none" onclick="_usrSort(\'' + col + '\')">' +
    label + arrow(col) + '</th>';

  const rows = visible.map(u =>
    '<tr>' +
    '<td style="font-family:monospace;color:#58a6ff">' + esc(u.username) + '</td>' +
    '<td>' + (u.fullname ? esc(u.fullname) : '<span style="color:#484f58">\u2014</span>') + '</td>' +
    '<td style="color:#8b949e;font-size:11px">' + esc(u.department || '\u2014') + '</td>' +
    '<td style="color:#8b949e;font-size:11px;font-family:monospace">' + esc(u.last_logon || '\u2014') + '</td></tr>'
  ).join('');

  setPageHtml(
    '<div class="page-title">Usu\u00e1rios AD</div>' +
    '<div class="page-sub">' + esc(visible.length) + ' de ' + esc(_usuariosAll.length) +
    ' usu\u00e1rios \u00b7 ' + esc(adCount) + ' AD \u00b7 ' + esc(localCount) +
    ' locais \u00b7 ' + cacheNote + '</div>' +
    '<div class="panel">' +
    '<input type="text" placeholder="Filtrar por username, nome ou departamento\u2026" ' +
    'value="' + esc(_usrFilter) + '" ' +
    'oninput="_renderUsuarios(this.value)" ' +
    'style="width:100%;padding:7px 10px;margin-bottom:12px;background:#161b22;border:1px solid #30363d;color:#e6edf3;border-radius:6px;font-size:13px">' +
    '<table><thead><tr>' +
    th('username', 'USERNAME') +
    th('fullname', 'NOME COMPLETO') +
    th('department', 'DEPARTAMENTO') +
    th('last_logon', '\u00daLT. ACESSO LABSRV') +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>'
  );
}

let _migTimer = null;
let _migCountdown = 30;

function _migClearTimer() {
  if (_migTimer) { clearInterval(_migTimer); _migTimer = null; }
}

function _migStartTimer() {
  _migCountdown = 30;
  const cdEl = () => document.getElementById('migCd');
  _migTimer = setInterval(() => {
    _migCountdown--;
    if (cdEl()) cdEl().textContent = ' (' + _migCountdown + 's)';
    if (_migCountdown <= 0) fetchMigracao();
  }, 1000);
}

async function fetchMigracao() {
  _migClearTimer();
  const d = await apiGet('/api/migracao');
  if (!d) { _migStartTimer(); return; }  // mantém o auto-refresh mesmo em falha

  const cur      = d.current;
  const sizes    = d.folder_sizes || {};
  const delta    = d.delta || {};
  const errCount = d.error_count || 0;
  const doneCount = d.done_count || 0;
  const total    = d.total || 43;
  const diskPct  = d.disk_percent || 0;
  const now      = new Date().toLocaleTimeString('pt-BR');

  const curPartial  = cur && cur.percent > 0 ? cur.percent / 100 : 0;
  const overallRaw  = total > 0 ? ((doneCount + curPartial) / total) * 100 : 0;
  const overallPct  = overallRaw.toFixed(1);  // ex: "19.4"
  const overallBar  = Math.min(overallRaw, 100);
  const diskColor  = diskPct >= 80 ? '#d29922' : diskPct >= 60 ? '#58a6ff' : '#3fb950';
  const procColor  = d.process_running ? '#3fb950' : '#f85149';
  const procLabel  = d.process_running ? '&#9679; rodando' : '&#9679; parado';

  const drives = d.drives || [];
  const running = drives.filter(x => x.status === 'running');
  const errors  = drives.filter(x => x.status === 'error');
  const done    = drives.filter(x => x.status === 'done');
  const pending = drives.filter(x => x.status === 'pending');

  const isSuperAdmin = currentUser && currentUser.role === 'superadmin';

  function driveRow(dr, showSize) {
    const sz = showSize && sizes[dr.name]
      ? ' <span style="color:#3fb950;font-size:10px">' + esc(sizes[dr.name]) + '</span>' : '';
    const pularBtn = isSuperAdmin && (dr.status === 'running' || dr.status === 'error')
      ? ' <button class="btn-sm" style="font-size:10px;padding:1px 6px;margin-left:6px" ' +
        'onclick="migPular(' + jse(dr.name) + ')" title="Marcar como conclu&#237;do e pular">Pular</button>'
      : '';
    return '<div class="mig-item ' + esc(dr.status) + '" style="display:flex;align-items:center;justify-content:space-between">' +
      '<span class="mig-item-name">' + esc(dr.name) + sz + pularBtn + '</span>' +
      (dr.status === 'running' && dr.percent > 0
        ? '<span style="font-size:10px;color:#58a6ff;white-space:nowrap">' +
          esc(dr.percent) + '% &nbsp;&#183;&nbsp; ' + esc(dr.speed) + ' &nbsp;&#183;&nbsp; ETA ' + esc(dr.eta) + '</span>'
        : '') +
      '</div>';
  }

  function section(title, color, icon, list, showSize) {
    if (!list.length) return '';
    return '<div class="panel" style="border-left:3px solid ' + color + '">' +
      '<div class="panel-title" style="color:' + color + '">' + icon + ' ' + title +
        ' <span style="color:#484f58;font-weight:400">(' + list.length + ')</span></div>' +
      list.map(dr => driveRow(dr, showSize)).join('') +
      '</div>';
  }

  const deltaHtml = '<div class="panel"><div class="panel-title" style="color:#484f58">DELTA SYNC' +
    (delta.running ? ' <span class="badge badge-blue">rodando</span>' : '') + '</div>' +
    (!delta.exists
      ? '<div style="color:#484f58;font-size:11px">Executar antes do cutover: ' +
        '<code style="color:#58a6ff">bash ~/labsrvfiles/scripts/delta-sync.sh</code></div>'
      : '<div style="font-size:11px">' +
          '<span style="color:#3fb950">&#10003; ' + esc(delta.done) + ' sincronizados</span>' +
          (delta.errors ? ' &nbsp;&#183;&nbsp; <span style="color:#f85149">&#10007; ' + esc(delta.errors) + ' com erro</span>' : '') +
        '</div>') + '</div>';

  setPageHtml(
    // ── Cabeçalho ──
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">' +
      '<div>' +
        '<div class="page-title">Migra&#231;&#227;o Google Drive</div>' +
        '<div class="page-sub" style="margin-top:2px">' +
          'processo: <span style="color:' + procColor + '">' + procLabel + '</span>' +
          ' &nbsp;&#183;&nbsp; atualizado ' + esc(now) +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;align-items:center;margin-top:4px">' +
        '<button class="btn-sm primary" id="btnRefreshMig" onclick="fetchMigracao()">' +
          '&#8635; Atualizar <span id="migCd" style="color:#8b949e"></span>' +
        '</button>' +
        (isSuperAdmin
          ? (d.process_running
              ? '<button class="btn-sm" style="color:#f85149;border-color:#f85149" onclick="migParar()">&#9646;&#9646; Parar</button>'
              : '<button class="btn-sm primary" onclick="migReiniciar()">&#9654; Iniciar</button>') +
            '<button class="btn-sm" onclick="migReiniciar()" title="Matar processos e reiniciar do ponto onde parou">&#8635; Reiniciar</button>'
          : '') +
      '</div>' +
    '</div>' +

    // ── Progresso geral ──
    '<div class="panel">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<span style="font-size:12px;color:#8b949e">PROGRESSO GERAL</span>' +
        '<span style="font-size:22px;font-weight:700;color:#58a6ff">' + overallPct + '%</span>' +
      '</div>' +
      '<div class="mig-bar" style="height:10px;margin-bottom:8px">' +
        '<div class="mig-fill' + (d.process_running ? ' running' : '') + '" style="width:' + overallBar + '%"></div>' +
      '</div>' +
      '<div style="display:flex;gap:20px;font-size:11px">' +
        '<span style="color:#3fb950">&#10003; ' + doneCount + ' conclu&#237;dos</span>' +
        (errCount ? '<span style="color:#f85149">&#10007; ' + errCount + ' com erro</span>' : '') +
        '<span style="color:#484f58">&#9675; ' + pending.length + ' pendentes</span>' +
        '<span style="color:#8b949e">total: ' + total + '</span>' +
      '</div>' +
    '</div>' +

    // ── Discos de migração (todos os 4 destinos) ──
    '<div class="panel">' +
      '<div style="font-size:11px;color:#8b949e;margin-bottom:8px;letter-spacing:1px">DISCOS DE MIGRA&#199;&#195;O</div>' +
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">' +
        (d.migration_disks || []).map(function(dk) {
          const pct = dk.percent || 0;
          const col = pct >= 85 ? '#f85149' : pct >= 70 ? '#d29922' : '#3fb950';
          return '<div style="background:#0d1117;border-radius:6px;padding:8px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
              '<span style="font-size:11px;font-weight:700;color:#e6edf3">' + esc(dk.label) + '</span>' +
              '<span style="font-size:11px;font-weight:700;color:' + col + '">' + pct + '%</span>' +
            '</div>' +
            '<div class="mig-bar" style="height:4px;margin-bottom:4px">' +
              '<div class="mig-fill" style="width:' + pct + '%;background:' + col + '"></div>' +
            '</div>' +
            '<div style="font-size:10px;color:#8b949e">' + esc(dk.free||'?') + ' livres / ' + esc(dk.size||'?') + '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>' +

    // ── Drive atual ──
    (cur
      ? '<div class="panel" style="border-left:3px solid #58a6ff;background:#0a1628">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
            '<div>' +
              '<div style="font-size:10px;color:#484f58;letter-spacing:1px;margin-bottom:2px">EM ANDAMENTO</div>' +
              '<div style="font-size:15px;font-weight:700;color:#e6edf3">' + esc(cur.name) + '</div>' +
            '</div>' +
            '<span style="font-size:28px;font-weight:700;color:#58a6ff">' + esc(cur.percent||0) + '%</span>' +
          '</div>' +
          '<div class="mig-bar" style="height:8px;margin-bottom:8px">' +
            '<div class="mig-fill" style="width:' + esc(cur.percent||0) + '%"></div>' +
          '</div>' +
          '<div style="display:flex;gap:16px;font-size:11px;color:#8b949e">' +
            '<span>&#9889; ' + esc(cur.speed||'—') + '</span>' +
            '<span>&#128336; ETA ' + esc(cur.eta||'—') + '</span>' +
            (cur.files_copied > 0
              ? '<span style="color:#3fb950">&#128196; ' + cur.files_copied.toLocaleString('pt-BR') + ' arqs copiados</span>'
              : '') +
          '</div>' +
        '</div>'
      : '') +

    // ── Seções por status ──
    section('EM ANDAMENTO', '#58a6ff', '&#8635;', running, false) +
    section('COM ERRO', '#f85149', '&#10007;', errors, false) +
    section('CONCLU&#205;DOS', '#3fb950', '&#10003;', done, true) +
    section('PENDENTES', '#484f58', '&#9675;', pending, false) +

    deltaHtml
  );

  _migStartTimer();
}

async function migReiniciar() {
  if (!confirm('Reiniciar a migração? Os processos atuais serão encerrados e o script recomeçará do ponto onde parou.')) return;
  const r = await apiPost('/api/migracao/reiniciar');
  if (r && r.ok) { setTimeout(fetchMigracao, 2000); }
  else alert('Erro ao reiniciar: ' + (r && r.detail ? r.detail : 'falha desconhecida'));
}

async function migParar() {
  if (!confirm('Parar a migração? O processo será encerrado.')) return;
  const r = await apiPost('/api/migracao/parar');
  if (r && r.ok) { setTimeout(fetchMigracao, 1500); }
  else alert('Erro ao parar: ' + (r && r.detail ? r.detail : 'falha desconhecida'));
}

async function migPular(drive) {
  if (!confirm('Pular o drive "' + drive + '"?\nEle será marcado como concluído e a migração avançará para o próximo.')) return;
  const r = await apiPost('/api/migracao/pular/' + encodeURIComponent(drive));
  if (r && r.ok) { setTimeout(fetchMigracao, 1000); }
  else alert('Erro ao pular drive.');
}

async function fetchBackup() {
  const d = await apiGet('/api/backup');
  if (!d) return;
  const runBtn = currentUser && currentUser.role === 'superadmin'
    ? '<div style="margin-bottom:16px"><button class="btn-sm primary" onclick="runBackup()">\u25b6 Executar Backup Agora</button></div>'
    : '';
  setPageHtml(
    '<div class="page-title">Backup</div>' +
    '<div class="page-sub">Pr\u00f3xima execu\u00e7\u00e3o: <code style="color:#58a6ff">' + esc(d.next_cron||'\u2014') + '</code></div>' +
    runBtn +
    '<div class="panel"><div class="panel-title">HIST\u00d3RICO</div>' +
    '<table><thead><tr><th>IN\u00cdCIO</th><th>STATUS</th><th>TAMANHO</th><th>DURA\u00c7\u00c3O</th><th>ARQUIVOS</th></tr></thead><tbody>' +
    (d.history||[]).map(b =>
      '<tr><td style="font-family:monospace;font-size:10px">' + esc(b.start) + '</td>' +
      '<td><span class="badge badge-' + (b.status==='ok'?'green':'red') + '">' + esc(b.status) + '</span></td>' +
      '<td>' + esc(b.size) + '</td><td>' + esc(b.duration) + '</td><td>' + esc(b.files) + '</td></tr>'
    ).join('') +
    '</tbody></table></div>'
  );
}

async function runBackup() {
  if (!confirm('Iniciar backup rsync manual agora?')) return;
  const r = await apiPost('/api/backup/run');
  if (r) alert(r.message || 'Backup iniciado.');
}

async function fetchLogs(page, username, share, op) {
  page = page||1; username = username||''; share = share||''; op = op||'';
  const params = new URLSearchParams({page, username, share, op});
  const d = await apiGet('/api/logs?' + params.toString());
  if (!d) return;
  setPageHtml(
    '<div class="page-title">Logs Samba</div>' +
    '<div class="page-sub">' + esc(d.total||0) + ' entradas \u00b7 p\u00e1gina ' + esc(d.page||1) + '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:12px">' +
      '<input id="fUser" placeholder="usu\u00e1rio" value="' + esc(username) + '" style="background:#161b22;border:1px solid #30363d;color:#e6edf3;padding:5px 8px;border-radius:4px;font-size:11px">' +
      '<input id="fShare" placeholder="share" value="' + esc(share) + '" style="background:#161b22;border:1px solid #30363d;color:#e6edf3;padding:5px 8px;border-radius:4px;font-size:11px">' +
      '<select id="fOp" style="background:#161b22;border:1px solid #30363d;color:#e6edf3;padding:5px;border-radius:4px;font-size:11px">' +
        '<option value="">todas as ops</option>' +
        ["OPEN","CREATE","WRITE","DELETE","DENIED","RENAME"].map(o => "<option" + (op===o?" selected":"") + ">" + esc(o) + "</option>").join("") +
      '</select>' +
      '<button class="btn-sm primary" onclick="fetchLogs(1,document.getElementById(\x27fUser\x27).value,document.getElementById(\x27fShare\x27).value,document.getElementById(\x27fOp\x27).value)">Filtrar</button>' +
    '</div>' +
    '<div class="panel"><table><thead><tr>' +
    '<th>TIMESTAMP</th><th>USU\u00c1RIO</th><th>OP</th><th>SHARE</th><th>ARQUIVO</th><th>IP</th>' +
    '</tr></thead><tbody>' +
    (d.entries||[]).map(e =>
      '<tr><td style="font-family:monospace;font-size:10px;color:#484f58">' + esc(e.timestamp) + '</td>' +
      '<td style="font-family:monospace">' + esc(e.user) + '</td>' +
      '<td><span class="tl-op ' + esc(e.op) + '" style="font-size:11px;font-weight:600">' + esc(e.op) + '</span></td>' +
      '<td style="color:#58a6ff">' + esc(e.share) + '</td>' +
      '<td style="color:#8b949e;font-size:10px">' + esc(e.file) + '</td>' +
      '<td style="color:#484f58;font-size:10px">' + esc(e.ip) + '</td></tr>'
    ).join('') +
    '</tbody></table>' +
    '<div style="margin-top:12px;display:flex;gap:8px">' +
      ((d.page>1) ? '<button class="btn-sm" onclick="fetchLogs(' + (d.page-1) + ')">\u2190 anterior</button>' : '') +
      ((d.total>d.page*d.per_page) ? '<button class="btn-sm" onclick="fetchLogs(' + (d.page+1) + ')">pr\u00f3xima \u2192</button>' : '') +
    '</div></div>'
  );
}

async function fetchAdmin() {
  const d = await apiGet('/api/admin');
  if (!d) return;
  const isSuperAdmin = currentUser && currentUser.role === 'superadmin';
  setPageHtml(
    '<div class="page-title">Admin Config</div>' +
    '<div class="page-sub">Fonte: <code style="color:#58a6ff">' + esc(d.ad_group||'') + '</code> \u00b7 ' + esc(d.note||'') + '</div>' +
    '<div class="panel"><div class="panel-title">ADMINS DO PAINEL</div>' +
    '<table><thead><tr><th>USERNAME</th><th>NOME COMPLETO</th><th>ROLE</th><th>A\u00c7\u00c3O</th></tr></thead><tbody>' +
    (d.admins||[]).map(a =>
      '<tr><td style="font-family:monospace;color:#58a6ff">' + esc(a.username) + '</td>' +
      '<td>' + esc(a.fullname) + '</td>' +
      '<td><span class="badge badge-' + (a.role==='superadmin'?'green':a.role==='operador'?'blue':'yellow') + '">' + esc(a.role) + '</span></td>' +
      '<td>' + (isSuperAdmin ?
        '<select onchange="setRole(\x27' + esc(a.username) + '\x27, this.value)" style="background:#0d1117;border:1px solid #30363d;color:#e6edf3;padding:3px;border-radius:4px;font-size:10px">' +
        ["superadmin","operador","readonly"].map(ro => "<option" + (a.role===ro?" selected":"") + ">" + esc(ro) + "</option>").join("") +
        '</select>' : '\u2014') + '</td></tr>'
    ).join('') +
    '</tbody></table></div>' +
    '<div class="panel"><div class="panel-title">LOG DE A\u00c7\u00d5ES ADMINISTRATIVAS</div>' +
    (d.action_log||[]).map(l =>
      '<div style="font-size:10px;font-family:monospace;color:#8b949e;padding:2px 0;border-bottom:1px solid #21262d">' + esc(l) + '</div>'
    ).join('') +
    '</div>'
  );
}

async function setRole(username, role) {
  const r = await apiPost('/api/admin/role', {username, role});
  if (r && r.ok) fetchAdmin();
}

function renderTerminal() {
  if (!currentUser || currentUser.role !== 'superadmin') {
    const main = document.getElementById('main');
    main.textContent = '';
    const div = document.createElement('div');
    div.className = 'loading';
    div.textContent = 'Acesso restrito a Super Admin';
    main.appendChild(div);
    return;
  }
  setPageHtml(
    '<div class="page-title">Terminal</div>' +
    '<div class="page-sub">Sess\u00e3o bash no servidor \u00b7 somente Super Admin</div>' +
    '<div id="xterm-container" style="background:#000;border-radius:6px;padding:8px;height:500px"></div>'
  );
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css';
  document.head.appendChild(link);
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.min.js';
  script.onload = initTerminal;
  document.body.appendChild(script);
}

function initTerminal() {
  const term = new Terminal({theme: {background: '#000000', foreground: '#e6edf3'}});
  term.open(document.getElementById('xterm-container'));
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(proto + '://' + location.host + '/ws/terminal');
  ws.binaryType = 'arraybuffer';
  ws.onopen = () => term.write('\r\n\x1b[32mConectado ao LABSRVFILES\x1b[0m\r\n');
  ws.onmessage = e => term.write(new Uint8Array(e.data));
  ws.onclose = () => term.write('\r\n\x1b[31m[Sess\u00e3o encerrada]\x1b[0m\r\n');
  term.onData(data => { if (ws.readyState === 1) ws.send(new TextEncoder().encode(data)); });
}

async function fetchAlertas() {
  const d = await apiGet('/api/alertas?historico=false');
  if (!d) return;
  _alertsViewedAt = d.unread; // marca como "lido" — badge some até chegar alerta novo
  _updateAlertBadges(d.unread);

  const sevIcon = s => s === 'critical' ? '🔴' : '🟡';
  const sevLabel = s => s === 'critical' ? 'CRÍTICO' : 'AVISO';
  const sevClass = s => s === 'critical' ? 'critical' : 'warning';
  const typeLabel = t => t === 'disk' ? 'Disco cheio' : t;

  const cards = (d.alerts || []).map(a =>
    '<div class="alert-card ' + sevClass(a.severity) + '" id="ac-' + esc(a.id) + '">' +
      '<div class="alert-icon">' + sevIcon(a.severity) + '</div>' +
      '<div class="alert-body">' +
        '<div class="alert-title">' + typeLabel(a.type) + ' — ' + esc(a.message) + '</div>' +
        '<div class="alert-meta">' +
          '<span class="badge badge-' + sevClass(a.severity) + '">' + sevLabel(a.severity) + '</span>' +
          '&nbsp; Detectado: ' + esc(a.timestamp) +
          (a.updated_at ? ' · Atualizado: ' + esc(a.updated_at) : '') +
        '</div>' +
        '<button class="btn-sm primary" onclick="ackAlerta(' + jse(a.id) + ')">✓ Confirmar</button>' +
      '</div>' +
    '</div>'
  ).join('');

  const hist = await apiGet('/api/alertas?historico=true');
  const acked = (hist ? hist.alerts : []).filter(a => a.acknowledged);
  const ackedCards = acked.slice(0, 20).map(a =>
    '<div class="alert-card ' + sevClass(a.severity) + ' acked">' +
      '<div class="alert-icon">✓</div>' +
      '<div class="alert-body">' +
        '<div class="alert-title">' + typeLabel(a.type) + ' — ' + esc(a.message) + '</div>' +
        '<div class="alert-ack">Confirmado por ' + esc(a.ack_by) + ' em ' + esc(a.ack_at) + '</div>' +
      '</div>' +
    '</div>'
  ).join('');

  setPageHtml(
    '<div class="page-title">Alertas</div>' +
    '<div class="page-sub">Monitoramento de discos e serviços — atualiza a cada 30s via topbar</div>' +
    '<div class="cards-row">' +
      '<div class="stat-card ' + (d.unread > 0 ? 'red' : 'green') + '">' +
        '<div class="stat-label">ALERTAS ATIVOS</div>' +
        '<div class="stat-value ' + (d.unread > 0 ? 'red' : 'green') + '">' + d.unread + '</div>' +
      '</div>' +
      '<div class="stat-card blue"><div class="stat-label">HISTÓRICO</div>' +
        '<div class="stat-value blue">' + (hist ? hist.alerts.length : '—') + '</div></div>' +
    '</div>' +
    (d.unread === 0
      ? '<div class="panel" style="color:#3fb950;padding:20px;text-align:center">✓ Nenhum alerta ativo</div>'
      : '<div class="panel"><div class="panel-title">ALERTAS ATIVOS</div>' + cards + '</div>') +
    (ackedCards
      ? '<div class="panel"><div class="panel-title" style="color:#484f58">HISTÓRICO (últimos 20)</div>' + ackedCards + '</div>'
      : '')
  );
}

async function ackAlerta(id) {
  const r = await apiPost('/api/alertas/' + encodeURIComponent(id) + '/ack', {});
  if (r && r.ok) {
    _updateAlertBadges(r.unread);
    fetchAlertas();
  }
}

// ── Delta-sync ────────────────────────────────────────────────────────────────

let _deltaTimer = null;

function _deltaClearTimer() { if (_deltaTimer) { clearInterval(_deltaTimer); _deltaTimer = null; } }

function _deltaStartTimer() {
  let cd = 30;
  const el = () => document.getElementById('deltaCd');
  _deltaTimer = setInterval(() => {
    cd--;
    if (el()) el().textContent = ' (' + cd + 's)';
    if (cd <= 0) fetchDeltaSync();
  }, 1000);
}

async function fetchDeltaSync() {
  _deltaClearTimer();
  const d = await apiGet('/api/delta-sync');
  if (!d) { _deltaStartTimer(); return; }

  const isSA = currentUser && currentUser.role === 'superadmin';
  const pct  = d.total > 0 ? ((d.done_count / d.total) * 100).toFixed(1) : '0.0';
  const bar  = Math.min(parseFloat(pct), 100);
  const running = d.process_running;
  const drives  = d.drives || [];
  const done    = drives.filter(x => x.status === 'done');
  const errors  = drives.filter(x => x.status === 'error');
  const inprog  = drives.filter(x => x.status === 'running');
  const pending = drives.filter(x => x.status === 'pending');

  function driveItem(dr) {
    const colMap = {done:'#3fb950', running:'#58a6ff', error:'#f85149', pending:'#484f58'};
    const iconMap = {done:'✓', running:'⟳', error:'✗', pending:'○'};
    return '<div class="mig-item ' + esc(dr.status) + '">' +
      '<span class="mig-item-name">' + esc(dr.name) + '</span>' +
      '<span style="font-size:10px;color:' + colMap[dr.status] + '">' + iconMap[dr.status] + '</span>' +
    '</div>';
  }

  function section(title, color, list) {
    if (!list.length) return '';
    return '<div class="panel" style="border-left:3px solid ' + color + '">' +
      '<div class="panel-title" style="color:' + color + '">' + title +
        ' <span style="color:#484f58;font-weight:400">(' + list.length + ')</span></div>' +
      list.map(driveItem).join('') + '</div>';
  }

  setPageHtml(
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">' +
      '<div>' +
        '<div class="page-title">Delta-sync</div>' +
        '<div class="page-sub">Sincroniza alterações do GDrive feitas durante a migração bruta · ' +
          '<span style="color:' + (running?'#3fb950':'#484f58') + '">' + (running?'● rodando':'● parado') + '</span>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;align-items:center;margin-top:4px">' +
        '<button class="btn-sm primary" onclick="fetchDeltaSync()">↻ Atualizar <span id="deltaCd" style="color:#8b949e"></span></button>' +
        (isSA
          ? (running
              ? '<button class="btn-sm" style="color:#f85149;border-color:#f85149" onclick="deltaParar()">❙❙ Parar</button>'
              : '<button class="btn-sm primary" onclick="deltaIniciar()">▶ Iniciar</button>')
          : '') +
      '</div>' +
    '</div>' +

    (!d.log_exists
      ? '<div class="panel" style="color:#484f58;text-align:center;padding:20px">' +
          '⟳ Delta-sync ainda não foi executado<br>' +
          '<code style="margin-top:8px;display:inline-block">nohup bash ~/labsrvfiles/scripts/delta-sync.sh &amp;</code>' +
        '</div>'
      : '') +

    '<div class="panel">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<span style="font-size:12px;color:#8b949e">PROGRESSO</span>' +
        '<span style="font-size:22px;font-weight:700;color:#58a6ff">' + pct + '%</span>' +
      '</div>' +
      '<div class="mig-bar" style="height:10px;margin-bottom:8px">' +
        '<div class="mig-fill' + (running?' running':'') + '" style="width:' + bar + '%"></div>' +
      '</div>' +
      '<div style="display:flex;gap:20px;font-size:11px">' +
        '<span style="color:#3fb950">✓ ' + d.done_count + ' sincronizados</span>' +
        (d.error_count ? '<span style="color:#f85149">✗ ' + d.error_count + ' com erro</span>' : '') +
        '<span style="color:#484f58">○ ' + pending.length + ' pendentes</span>' +
        '<span style="color:#8b949e">total: ' + d.total + '</span>' +
      '</div>' +
    '</div>' +

    section('EM ANDAMENTO', '#58a6ff', inprog) +
    section('COM ERRO',     '#f85149', errors) +
    section('CONCLUÍDOS',   '#3fb950', done) +
    section('PENDENTES',    '#484f58', pending) +

    (d.log_exists
      ? '<div class="panel"><div class="panel-title">LOG (últimas linhas)</div>' +
          '<div class="log-tail">' + esc(d.log_tail) + '</div></div>'
      : '')
  );

  _deltaStartTimer();
}

async function deltaIniciar() {
  if (!confirm('Iniciar o delta-sync agora?')) return;
  const r = await apiPost('/api/delta-sync/iniciar');
  if (r && r.ok) { setTimeout(fetchDeltaSync, 1500); }
  else alert('Erro: ' + (r && r.detail ? r.detail : 'falha'));
}

async function deltaParar() {
  if (!confirm('Parar o delta-sync?')) return;
  const r = await apiPost('/api/delta-sync/parar');
  if (r && r.ok) { setTimeout(fetchDeltaSync, 1500); }
}


// ── Cutover ───────────────────────────────────────────────────────────────────

async function fetchCutover() {
  const d = await apiGet('/api/cutover');
  if (!d) return;

  const isSA = currentUser && currentUser.role === 'superadmin';
  const isOp = currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'operador');
  const pct  = d.total > 0 ? Math.round((d.done_count / d.total) * 100) : 0;
  const bar  = pct;

  const badge = document.getElementById('navCutoverBadge');
  if (badge) {
    badge.textContent = d.done_count + '/' + d.total;
    badge.style.display = 'inline-flex';
    badge.style.background = d.done_count === d.total ? '#3fb950' : '#d29922';
  }

  const rows = (d.shares || []).map(s => {
    const cls = s.validated ? 'validated' : (s.exists ? '' : 'missing');
    const icon = s.validated ? '✓' : (s.exists ? '○' : '✗');
    const iconColor = s.validated ? '#3fb950' : (s.exists ? '#484f58' : '#f85149');
    return '<div class="cutover-row ' + cls + '">' +
      '<span style="font-size:14px;color:' + iconColor + ';width:16px;text-align:center">' + icon + '</span>' +
      '<span class="cutover-share-name">\\\\192.86.221.213\\' + esc(s.name) + '</span>' +
      '<span class="cutover-group">' + esc(s.group) + '</span>' +
      (s.validated
        ? '<span class="cutover-meta">' + esc(s.validated_by) + ' · ' + esc(s.validated_at) + '</span>'
        : (!s.exists ? '<span class="cutover-meta" style="color:#f85149">dir não encontrado</span>' : '')) +
      (isOp && !s.validated && s.exists
        ? '<button class="btn-sm primary" onclick="cutoverValidar(' + jse(s.name) + ')" style="white-space:nowrap">✓ Validar</button>'
        : '') +
      (isSA && s.validated
        ? '<button class="btn-sm" onclick="cutoverReset(' + jse(s.name) + ')" title="Reverter validação">↩</button>'
        : '') +
    '</div>';
  }).join('');

  setPageHtml(
    '<div class="page-title">Cutover — Validação de Shares</div>' +
    '<div class="page-sub">Cada depto valida o acesso antes de ser desconectado do Google Drive</div>' +

    '<div class="cards-row">' +
      '<div class="stat-card ' + (d.done_count === d.total ? 'green' : 'yellow') + '">' +
        '<div class="stat-label">VALIDADOS</div>' +
        '<div class="stat-value ' + (d.done_count === d.total ? 'green' : 'yellow') + '">' + d.done_count + '/' + d.total + '</div>' +
        '<div class="stat-sub">' + pct + '% concluído</div>' +
      '</div>' +
      '<div class="stat-card ' + (d.done_count === d.total ? 'green' : 'blue') + '">' +
        '<div class="stat-label">STATUS</div>' +
        '<div class="stat-value ' + (d.done_count === d.total ? 'green' : 'blue') + '" style="font-size:16px;padding-top:4px">' +
          (d.done_count === d.total ? '✓ PRONTO' : 'Em andamento') + '</div>' +
        '<div class="stat-sub">' + (d.done_count === d.total ? 'Pode fazer cutover' : (d.total - d.done_count) + ' shares pendentes') + '</div>' +
      '</div>' +
    '</div>' +

    '<div class="panel" style="margin-bottom:8px">' +
      '<div class="mig-bar" style="height:8px;margin-bottom:0"><div class="mig-fill" style="width:' + bar + '%;background:' + (pct===100?'#3fb950':'#58a6ff') + '"></div></div>' +
    '</div>' +

    '<div class="panel">' +
      '<div class="panel-title">SHARES — CHECKLIST</div>' +
      rows +
    '</div>'
  );
}

async function cutoverValidar(share) {
  const r = await apiPost('/api/cutover/' + encodeURIComponent(share) + '/validar');
  if (r && r.ok) {
    _showToast('✓ ' + share + ' validado', 'info');
    fetchCutover();
  }
}

async function cutoverReset(share) {
  if (!confirm('Reverter validação de ' + share + '?')) return;
  const r = await apiPost('/api/cutover/' + encodeURIComponent(share) + '/reset');
  if (r && r.ok) fetchCutover();
}


// ── Backup GDrive ─────────────────────────────────────────────────────────────

let _bkgTimer = null;

function _bkgClearTimer() { if (_bkgTimer) { clearInterval(_bkgTimer); _bkgTimer = null; } }

function _bkgStartTimer() {
  let cd = 30;
  const el = () => document.getElementById('bkgCd');
  _bkgTimer = setInterval(() => {
    cd--;
    if (el()) el().textContent = ' (' + cd + 's)';
    if (cd <= 0) fetchBackupGDrive();
  }, 1000);
}

async function fetchBackupGDrive() {
  _bkgClearTimer();
  const d = await apiGet('/api/backup-gdrive');
  if (!d) { _bkgStartTimer(); return; }

  const isSA  = currentUser && currentUser.role === 'superadmin';
  const running = d.process_running;
  const drives  = d.drives || [];
  const done    = drives.filter(x => x.status === 'done');
  const errors  = drives.filter(x => x.status === 'error');
  const pending = drives.filter(x => x.status === 'pending');
  const pct     = d.total > 0 ? Math.round((d.done_count / d.total) * 100) : 0;

  const driveGrid = (list, cls) =>
    '<div class="bkg-drive-grid">' +
    list.map(dr => '<div class="bkg-drive-item ' + cls + '">' +
      (cls==='done'?'✓':cls==='error'?'✗':'○') + ' ' + esc(dr.name) + '</div>').join('') +
    '</div>';

  setPageHtml(
    '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">' +
      '<div>' +
        '<div class="page-title">Backup → GDrive</div>' +
        '<div class="page-sub">Fluxo pós-cutover: servidor → Google Drive · backup offsite diário · ' +
          '<span style="color:' + (running?'#3fb950':'#484f58') + '">' + (running?'● rodando':'● parado') + '</span>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:4px">' +
        '<button class="btn-sm primary" onclick="fetchBackupGDrive()">↻ <span id="bkgCd" style="color:#8b949e"></span></button>' +
        (isSA
          ? (!running
              ? '<button class="btn-sm primary" onclick="bkgRun()">▶ Executar</button>' +
                '<button class="btn-sm" onclick="bkgDryRun()" title="Simula sem alterar nada">▶ Dry-run</button>'
              : '<button class="btn-sm" style="color:#f85149;border-color:#f85149" onclick="bkgParar()">❙❙ Parar</button>') +
            (d.cron_active
              ? '<button class="btn-sm" onclick="bkgCronDesativar()" title="Remover cron 23h">⏱ Desativar cron</button>'
              : '<button class="btn-sm primary" onclick="bkgCronAtivar()" title="Ativar backup diário 23h">⏱ Ativar cron 23h</button>')
          : '') +
      '</div>' +
    '</div>' +

    '<div class="cards-row">' +
      '<div class="stat-card ' + (d.cron_active?'green':'yellow') + '">' +
        '<div class="stat-label">CRON DIÁRIO</div>' +
        '<div class="stat-value ' + (d.cron_active?'green':'yellow') + '" style="font-size:16px;padding-top:4px">' +
          (d.cron_active?'✓ Ativo':'○ Inativo') + '</div>' +
        '<div class="stat-sub">' + (d.cron_active ? '23h diário · ' + esc(d.cron_line).slice(0,40) : 'ainda não configurado') + '</div>' +
      '</div>' +
      '<div class="stat-card blue">' +
        '<div class="stat-label">ÚLTIMO BACKUP</div>' +
        '<div class="stat-value blue" style="font-size:13px;padding-top:6px">' + esc(d.last_run_start || '—') + '</div>' +
        '<div class="stat-sub">' + (d.completed ? '✓ concluído · até ' + esc(d.last_run_end||'?') : (d.last_run_start ? '⟳ em andamento ou incompleto' : 'nunca executado')) + '</div>' +
      '</div>' +
      '<div class="stat-card ' + (d.error_count>0?'red':'green') + '">' +
        '<div class="stat-label">DRIVES</div>' +
        '<div class="stat-value ' + (d.error_count>0?'red':'green') + '">' + d.done_count + '/' + d.total + '</div>' +
        '<div class="stat-sub">' + (d.error_count?d.error_count+' com erro':'todos OK') + '</div>' +
      '</div>' +
    '</div>' +

    (d.log_exists && d.total > 0
      ? '<div class="panel">' +
          '<div class="mig-bar" style="height:6px;margin-bottom:8px">' +
            '<div class="mig-fill' + (running?' running':'') + '" style="width:' + pct + '%;background:' + (d.error_count?'#d29922':'#3fb950') + '"></div>' +
          '</div>' +
          (done.length ? '<div class="panel-title" style="color:#3fb950">CONCLUÍDOS (' + done.length + ')</div>' + driveGrid(done,'done') : '') +
          (errors.length ? '<div class="panel-title" style="color:#f85149;margin-top:12px">COM ERRO (' + errors.length + ')</div>' + driveGrid(errors,'error') : '') +
          (pending.length ? '<div class="panel-title" style="color:#484f58;margin-top:12px">PENDENTES (' + pending.length + ')</div>' + driveGrid(pending,'pending') : '') +
        '</div>'
      : '') +

    (d.log_exists
      ? '<div class="panel"><div class="panel-title">LOG (últimas linhas)</div>' +
          '<div class="log-tail">' + esc(d.log_tail) + '</div></div>'
      : '<div class="panel" style="color:#484f58;text-align:center;padding:24px">' +
          '☁ Backup GDrive ainda não foi executado<br>' +
          '<span style="font-size:11px;margin-top:8px;display:inline-block">Use os botões acima para executar um dry-run primeiro</span>' +
        '</div>')
  );

  _bkgStartTimer();
}

async function bkgRun() {
  if (!confirm('Iniciar backup → GDrive agora?\n\nIsso irá sincronizar os dados do servidor para os Drives Compartilhados no Google.')) return;
  const r = await apiPost('/api/backup-gdrive/run');
  if (r && r.ok) { _showToast('☁ Backup GDrive iniciado', 'info'); setTimeout(fetchBackupGDrive, 1500); }
  else alert('Erro: ' + (r && r.detail ? r.detail : 'falha'));
}

async function bkgDryRun() {
  if (!confirm('Executar DRY-RUN do backup GDrive?\n\nNenhum arquivo será alterado — apenas simula o que seria copiado.')) return;
  const r = await apiPost('/api/backup-gdrive/run-dry');
  if (r && r.ok) { _showToast('Dry-run iniciado — acompanhe no log', 'info'); setTimeout(fetchBackupGDrive, 1500); }
  else alert('Erro: ' + (r && r.detail ? r.detail : 'falha'));
}

async function bkgParar() {
  if (!confirm('Parar o backup GDrive em andamento?')) return;
  const r = await apiPost('/api/backup-gdrive/parar');
  if (r && r.ok) setTimeout(fetchBackupGDrive, 1500);
}

async function bkgCronAtivar() {
  const r = await apiPost('/api/backup-gdrive/cron/ativar');
  if (r && r.ok) { _showToast('⏱ Cron ativado: backup 23h diário', 'info'); fetchBackupGDrive(); }
}

async function bkgCronDesativar() {
  if (!confirm('Desativar o cron de backup diário?')) return;
  const r = await apiPost('/api/backup-gdrive/cron/desativar');
  if (r && r.ok) { _showToast('Cron desativado', 'info'); fetchBackupGDrive(); }
}

// ── Auditoria de Arquivos (labsrv-files) ──────────────────────────────────────

async function fetchFileAudit() {
  const d = await apiGet('/api/admin/file-audit?limit=100');
  if (!d) return;
  const logs = d.logs || [];
  const actionColors = { upload: '#3fb950', download: '#58a6ff', delete: '#f85149', mkdir: '#d29922', rename: '#e6edf3' };
  const rows = logs.length === 0
    ? '<tr><td colspan="5" style="text-align:center;color:#8b949e">' + esc(d.note || 'Sem registros') + '</td></tr>'
    : logs.map(r =>
        '<tr>' +
        '<td style="font-family:monospace;font-size:10px;color:#484f58">' + esc(r.timestamp) + '</td>' +
        '<td style="font-family:monospace">' + esc(r.username) + '</td>' +
        '<td style="color:' + (actionColors[r.action] || '#e6edf3') + ';font-weight:500">' + esc(r.action) + '</td>' +
        '<td style="color:#8b949e;font-size:10px">' + esc(r.path) + '</td>' +
        '<td style="color:#484f58;font-size:10px">' + esc(r.ip) + '</td>' +
        '</tr>'
      ).join('');
  setPageHtml(
    '<div class="page-title">Auditoria de Arquivos</div>' +
    '<div class="page-sub">Operações realizadas no Explorador de Arquivos (labsrv-files) \u00b7 últimos 100 registros</div>' +
    '<div class="panel"><table><thead><tr>' +
    '<th>TIMESTAMP</th><th>USUÁRIO</th><th>AÇÃO</th><th>CAMINHO</th><th>IP</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div>'
  );
}

window.addEventListener('DOMContentLoaded', init);
