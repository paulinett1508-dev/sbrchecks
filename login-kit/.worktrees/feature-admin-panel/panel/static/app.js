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
  const main = document.getElementById('main');
  main.textContent = '';
  const loading = document.createElement('div');
  loading.className = 'loading';
  loading.textContent = 'Carregando...';
  main.appendChild(loading);
  const loaders = {
    dashboard: fetchDashboard, discos: fetchDiscos, shares: fetchShares,
    servicos: fetchServicos, conexoes: fetchConexoes, usuarios: fetchUsuarios,
    migracao: fetchMigracao, backup: fetchBackup, logs: fetchLogs,
    admin: fetchAdmin, terminal: renderTerminal,
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
  };
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
  return r.ok ? r.json() : null;
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

async function fetchUsuarios() {
  const d = await apiGet('/api/usuarios');
  if (!d) return;
  setPageHtml(
    '<div class="page-title">Usu\u00e1rios AD</div>' +
    '<div class="page-sub">' + esc(d.total||0) + ' usu\u00e1rios vis\u00edveis via SSSD \u00b7 somente leitura</div>' +
    '<div class="panel"><table><thead><tr>' +
    '<th>USERNAME</th><th>NOME COMPLETO</th><th>GRUPOS</th><th>\u00daNTIMO LOGIN</th>' +
    '</tr></thead><tbody>' +
    (d.users||[]).map(u =>
      '<tr><td style="font-family:monospace;color:#58a6ff">' + esc(u.username) + '</td>' +
      '<td>' + esc(u.fullname) + '</td>' +
      '<td style="font-size:10px;color:#8b949e">' + esc((u.groups||[]).slice(0,3).join(', ')) + '</td>' +
      '<td style="font-size:10px;color:#484f58;font-family:monospace">' + esc((u.last_login||'').slice(0,40)) + '</td></tr>'
    ).join('') +
    '</tbody></table></div>'
  );
}

let _migTimer = null;
let _migCountdown = 30;

function _migClearTimer() {
  if (_migTimer) { clearInterval(_migTimer); _migTimer = null; }
}

async function fetchMigracao() {
  _migClearTimer();
  const d = await apiGet('/api/migracao');
  if (!d) return;

  const cur      = d.current;
  const sizes    = d.folder_sizes || {};
  const delta    = d.delta || {};
  const errCount = d.error_count || 0;
  const doneCount = d.done_count || 0;
  const total    = d.total || 43;
  const diskPct  = d.disk_percent || 0;
  const now      = new Date().toLocaleTimeString('pt-BR');

  const overallPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const diskColor  = diskPct >= 80 ? '#d29922' : diskPct >= 60 ? '#58a6ff' : '#3fb950';
  const procColor  = d.process_running ? '#3fb950' : '#f85149';
  const procLabel  = d.process_running ? '&#9679; rodando' : '&#9679; parado';

  const drives = d.drives || [];
  const running = drives.filter(x => x.status === 'running');
  const errors  = drives.filter(x => x.status === 'error');
  const done    = drives.filter(x => x.status === 'done');
  const pending = drives.filter(x => x.status === 'pending');

  function driveRow(dr, showSize) {
    const sz = showSize && sizes[dr.name]
      ? ' <span style="color:#3fb950;font-size:10px">' + esc(sizes[dr.name]) + '</span>' : '';
    return '<div class="mig-item ' + esc(dr.status) + '">' +
      '<span class="mig-item-name">' + esc(dr.name) + sz + '</span>' +
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
      '<button class="btn-sm primary" id="btnRefreshMig" onclick="fetchMigracao()" style="margin-top:4px">' +
        '&#8635; Atualizar <span id="migCd" style="color:#8b949e"></span>' +
      '</button>' +
    '</div>' +

    // ── Progresso geral ──
    '<div class="panel">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '<span style="font-size:12px;color:#8b949e">PROGRESSO GERAL</span>' +
        '<span style="font-size:22px;font-weight:700;color:#58a6ff">' + overallPct + '%</span>' +
      '</div>' +
      '<div class="mig-bar" style="height:10px;margin-bottom:8px">' +
        '<div class="mig-fill" style="width:' + overallPct + '%"></div>' +
      '</div>' +
      '<div style="display:flex;gap:20px;font-size:11px">' +
        '<span style="color:#3fb950">&#10003; ' + doneCount + ' conclu&#237;dos</span>' +
        (errCount ? '<span style="color:#f85149">&#10007; ' + errCount + ' com erro</span>' : '') +
        '<span style="color:#484f58">&#9675; ' + pending.length + ' pendentes</span>' +
        '<span style="color:#8b949e">total: ' + total + '</span>' +
      '</div>' +
    '</div>' +

    // ── Disco /mnt/hdd3 ──
    '<div class="panel">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
        '<span style="font-size:11px;color:#8b949e">/mnt/hdd3 — DISCO DE MIGRA&#199;&#195;O</span>' +
        '<span style="font-size:13px;font-weight:600;color:' + diskColor + '">' + diskPct + '% &nbsp;<span style="font-size:10px;font-weight:400">(' + esc(d.disk_free||'?') + ' livres)</span></span>' +
      '</div>' +
      '<div class="mig-bar" style="height:6px">' +
        '<div class="mig-fill" style="width:' + diskPct + '%;background:' + diskColor + '"></div>' +
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

  // Auto-refresh countdown
  _migCountdown = 30;
  const cdEl = () => document.getElementById('migCd');
  _migTimer = setInterval(() => {
    _migCountdown--;
    if (cdEl()) cdEl().textContent = ' (' + _migCountdown + 's)';
    if (_migCountdown <= 0) fetchMigracao();
  }, 1000);
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

window.addEventListener('DOMContentLoaded', init);
