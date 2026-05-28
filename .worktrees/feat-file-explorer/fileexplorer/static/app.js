// fileexplorer/static/app.js

const SVG_NS = 'http://www.w3.org/2000/svg';

// ── Icon helpers (SVG sprite via <use>) ────────────────────────────────────

function makeIconEl(id, w, h) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('width', String(w));
  svg.setAttribute('height', String(h));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '#' + id);
  svg.appendChild(use);
  return svg;
}

const EXT_TO_ICON = {
  pdf: 'ico-pdf',
  docx: 'ico-word', doc: 'ico-word', odt: 'ico-word', rtf: 'ico-word',
  xlsx: 'ico-excel', xls: 'ico-excel',
  csv: 'ico-csv',
  pptx: 'ico-ppt', ppt: 'ico-ppt',
  jpg: 'ico-image', jpeg: 'ico-image', png: 'ico-image',
  gif: 'ico-image', webp: 'ico-image', bmp: 'ico-image', svg: 'ico-image',
  mp4: 'ico-video', avi: 'ico-video', mkv: 'ico-video', mov: 'ico-video',
  zip: 'ico-archive', rar: 'ico-archive', '7z': 'ico-archive',
  txt: 'ico-txt',
};

function fileIconEl(name, w, h) {
  const ext = name.split('.').pop().toLowerCase();
  return makeIconEl(EXT_TO_ICON[ext] || 'ico-file', w || 14, h || 17);
}

function folderIconId(path, isVirtual) {
  if (isVirtual) return 'ico-folder-shared';
  return state.treeExpanded.has(path) ? 'ico-folder-open' : 'ico-folder';
}

// ── State ──────────────────────────────────────────────────────────────────

const state = {
  username: '',
  shares: [],
  currentPath: '',
  currentItems: [],
  viewMode: localStorage.getItem('viewMode') || 'list',
  treeExpanded: new Set(),
  selected: new Set(),
  clipboard: [],
  cutMode: false,
  filterType: 'all',
  filterDate: 'all',
};

const treeCache = {};

const TYPE_FILTERS = {
  dir:   i => i.type === 'dir',
  doc:   i => i.type === 'file' && /\.(doc|docx|txt|odt|rtf)$/i.test(i.name),
  sheet: i => i.type === 'file' && /\.(xls|xlsx|csv|ods)$/i.test(i.name),
  pdf:   i => i.type === 'file' && /\.pdf$/i.test(i.name),
  img:   i => i.type === 'file' && /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(i.name),
};

function byDateFilter(period) {
  const limits = { today: 86400000, week: 7 * 86400000, month: 30 * 86400000 };
  const ms = limits[period], now = Date.now();
  return item => {
    if (!item.modified) return false;
    const t = new Date(item.modified.endsWith('Z') ? item.modified : item.modified + 'Z').getTime();
    return now - t <= ms;
  };
}

// ── Bootstrap ──────────────────────────────────────────────────────────────

async function init() {
  initTheme();
  const resp = await fetch('/api/me');
  if (!resp.ok) { window.location.href = '/login'; return; }
  const me = await resp.json();
  state.username = me.username;
  state.shares = me.shares || [];
  document.getElementById('topbar-user').textContent = me.username;
  setView(state.viewMode, false);
  wireButtons();
  renderSidebarExtras();
  await renderTree();
  const realShares = state.shares.filter(s => !s.virtual);
  if (realShares.length === 1) await navigate(realShares[0].name + '/');
}

function wireButtons() {
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('btn-list').addEventListener('click', () => setView('list', true));
  document.getElementById('btn-grid').addEventListener('click', () => setView('grid', true));
  document.getElementById('btn-dashboard').addEventListener('click', () => setMainView('dashboard'));
  document.getElementById('btn-explorer').addEventListener('click', () => setMainView('explorer'));
  document.getElementById('btn-upload').addEventListener('click', () => document.getElementById('file-input').click());
  document.getElementById('btn-mkdir').addEventListener('click', promptMkdir);
  document.getElementById('btn-copy').addEventListener('click', doCopy);
  document.getElementById('btn-cut').addEventListener('click', doCut);
  document.getElementById('btn-paste').addEventListener('click', doPaste);
  document.getElementById('btn-theme').addEventListener('click', toggleTheme);
  document.getElementById('file-input').addEventListener('change', e => uploadFiles(e.target.files));
  document.getElementById('search-input').addEventListener('input', applyAllFilters);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('share-cancel').addEventListener('click', closeShareModal);
  document.getElementById('share-confirm').addEventListener('click', submitShare);
  wireFilterBar();
  wireDragDrop();
}

async function logout() {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
}

// ── Theme ──────────────────────────────────────────────────────────────────

function initTheme() {
  const t = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = t === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.getElementById('btn-theme').textContent = next === 'dark' ? '☀️' : '🌙';
}

// ── Sidebar: Recentes + Favoritos + Compartilhados ─────────────────────────

function getRecents()   { try { return JSON.parse(localStorage.getItem('recents') || '[]'); } catch { return []; } }
function setRecents(a)  { localStorage.setItem('recents', JSON.stringify(a)); }
function getFavorites() { try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; } }
function setFavorites(a){ localStorage.setItem('favorites', JSON.stringify(a)); }

function addRecent(path) {
  const name = path.replace(/\/$/, '').split('/').pop();
  let arr = getRecents().filter(r => r.path !== path);
  arr.unshift({ path, name });
  setRecents(arr.slice(0, 10));
}

function toggleFavorite(path) {
  const name = path.replace(/\/$/, '').split('/').pop();
  let favs = getFavorites();
  const idx = favs.findIndex(f => f.path === path);
  if (idx >= 0) favs.splice(idx, 1);
  else favs.unshift({ path, name });
  setFavorites(favs);
  renderSidebarExtras();
}

function isFavorite(path) { return getFavorites().some(f => f.path === path); }

function renderSidebarExtras() {
  // Recentes
  const recents = getRecents();
  const secR = document.getElementById('section-recents');
  const listR = document.getElementById('recents-list');
  listR.textContent = '';
  if (recents.length === 0) { secR.classList.add('hidden'); }
  else {
    secR.classList.remove('hidden');
    recents.forEach(r => listR.appendChild(makeSidebarLink(r.name, r.path, 'ico-folder', false)));
  }

  // Favoritos
  const favs = getFavorites();
  const listF = document.getElementById('favorites-list');
  listF.textContent = '';
  if (favs.length === 0) {
    const emp = document.createElement('span');
    emp.className = 'sidebar-empty';
    emp.textContent = 'Nenhum favorito';
    listF.appendChild(emp);
  } else {
    favs.forEach(f => listF.appendChild(makeSidebarLink(f.name, f.path, 'ico-folder', true)));
  }

  // Compartilhados comigo (virtual shares)
  const virtualShares = state.shares.filter(s => s.virtual);
  const secS = document.getElementById('section-shared');
  const listS = document.getElementById('shared-list');
  listS.textContent = '';
  if (virtualShares.length === 0) { secS.classList.add('hidden'); }
  else {
    secS.classList.remove('hidden');
    virtualShares.forEach(s => {
      const el = makeSidebarLink(s.name, s.name + '/', 'ico-folder-shared', false);
      el.classList.add('virtual-share');
      listS.appendChild(el);
    });
  }
}

function makeSidebarLink(name, path, iconId, showRemoveStar) {
  const el = document.createElement('div');
  el.className = 'tree-item' + (state.currentPath === path ? ' active' : '');

  const iconWrap = document.createElement('span');
  iconWrap.className = 'tree-icon';
  iconWrap.appendChild(makeIconEl(iconId, 14, 12));
  el.appendChild(iconWrap);

  const label = document.createElement('span');
  label.textContent = name;
  el.appendChild(label);

  if (showRemoveStar) {
    const actions = document.createElement('span');
    actions.className = 'tree-item-actions';
    const btn = document.createElement('button');
    btn.textContent = '★';
    btn.title = 'Remover favorito';
    btn.addEventListener('click', e => { e.stopPropagation(); toggleFavorite(path); });
    actions.appendChild(btn);
    el.appendChild(actions);
  }

  el.addEventListener('click', () => navigate(path));
  return el;
}

// ── Filters ────────────────────────────────────────────────────────────────

function wireFilterBar() {
  document.querySelectorAll('[data-filter-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filterType = btn.dataset.filterType;
      document.querySelectorAll('[data-filter-type]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyAllFilters();
    });
  });
  document.querySelectorAll('[data-filter-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.filterDate = btn.dataset.filterDate;
      document.querySelectorAll('[data-filter-date]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyAllFilters();
    });
  });
}

function applyAllFilters() {
  const q = document.getElementById('search-input').value.toLowerCase();
  let items = state.currentItems;
  if (q) items = items.filter(i => i.name.toLowerCase().includes(q));
  if (state.filterType !== 'all') {
    const fn = TYPE_FILTERS[state.filterType];
    if (fn) items = items.filter(fn);
  }
  if (state.filterDate !== 'all') items = items.filter(byDateFilter(state.filterDate));
  renderItems(items);
}

// ── KPI bar ────────────────────────────────────────────────────────────────

function setKPIItem(id, value, label) {
  const el = document.getElementById(id);
  el.textContent = '';
  const v = document.createElement('span');
  v.className = 'kpi-value';
  v.textContent = String(value);
  const l = document.createElement('span');
  l.className = 'kpi-label';
  l.textContent = label;
  el.appendChild(v);
  el.appendChild(l);
}

function updateKPI(items) {
  const bar = document.getElementById('kpi-bar');
  if (!items || !items.length) { bar.classList.add('hidden'); return; }
  const files = items.filter(i => i.type === 'file');
  const dirs  = items.filter(i => i.type === 'dir');
  const total = files.reduce((s, i) => s + (i.size || 0), 0);
  const lastMod = items.reduce((latest, i) => {
    if (!i.modified) return latest;
    const t = new Date(i.modified.endsWith('Z') ? i.modified : i.modified + 'Z');
    return (!latest || t > latest) ? t : latest;
  }, null);
  setKPIItem('kpi-files',    files.length, 'Arquivo' + (files.length !== 1 ? 's' : ''));
  setKPIItem('kpi-folders',  dirs.length,  'Pasta' + (dirs.length !== 1 ? 's' : ''));
  setKPIItem('kpi-size',     fmtSize(total), 'Total');
  setKPIItem('kpi-modified', lastMod ? lastMod.toLocaleDateString('pt-BR') : '—', 'Última mod.');
  bar.classList.remove('hidden');
}

// ── Selection & Clipboard ──────────────────────────────────────────────────

function toggleSelect(itemPath, checked) {
  if (checked) state.selected.add(itemPath);
  else state.selected.delete(itemPath);
  updateClipboardBtns();
}

function updateClipboardBtns() {
  const n = state.selected.size;
  const btnCopy  = document.getElementById('btn-copy');
  const btnCut   = document.getElementById('btn-cut');
  btnCopy.textContent = '📋 Copiar' + (n ? ` (${n})` : '');
  btnCut.textContent  = '✂ Recortar' + (n ? ` (${n})` : '');
  btnCopy.classList.toggle('hidden', n === 0);
  btnCut.classList.toggle('hidden', n === 0);

  const btnPaste = document.getElementById('btn-paste');
  if (state.clipboard.length > 0) {
    btnPaste.textContent = state.cutMode ? '📌 Mover aqui' : '📌 Colar aqui';
    btnPaste.classList.remove('hidden');
    btnPaste.classList.toggle('cut-mode', state.cutMode);
  } else {
    btnPaste.classList.add('hidden');
  }
}

function doCopy() {
  if (!state.selected.size) return;
  state.clipboard = Array.from(state.selected);
  state.cutMode = false;
  state.selected.clear();
  updateClipboardBtns();
  showToast(state.clipboard.length + ' item(s) copiado(s) — navegue até o destino e cole');
  applyAllFilters();
}

function doCut() {
  if (!state.selected.size) return;
  state.clipboard = Array.from(state.selected);
  state.cutMode = true;
  state.selected.clear();
  updateClipboardBtns();
  showToast(state.clipboard.length + ' item(s) marcado(s) para mover');
  applyAllFilters();
}

async function doPaste() {
  if (!state.clipboard.length || !state.currentPath) return;
  const url  = state.cutMode ? '/api/files/move' : '/api/files/copy';
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources: state.clipboard, dest: state.currentPath }),
  });
  if (resp.ok) {
    const data = await resp.json();
    const key  = state.cutMode ? 'moved' : 'copied';
    showToast((data[key] || []).length + ' item(s) ' + (state.cutMode ? 'movido(s)' : 'colado(s)'));
    if (state.cutMode) { state.clipboard = []; state.cutMode = false; updateClipboardBtns(); }
    navigate(state.currentPath);
  } else {
    showToast('Erro ao ' + (state.cutMode ? 'mover' : 'colar'));
  }
}

// ── Tree ───────────────────────────────────────────────────────────────────

async function loadTreeDir(path) {
  if (treeCache[path]) return treeCache[path];
  const resp = await fetch('/api/files?path=' + encodeURIComponent(path));
  if (!resp.ok) return [];
  const data = await resp.json();
  treeCache[path] = (data.items || []).filter(i => i.type === 'dir');
  return treeCache[path];
}

async function renderTree() {
  const nav = document.getElementById('tree');
  nav.textContent = '';
  for (const share of state.shares.filter(s => !s.virtual)) {
    await renderTreeNode(nav, share.name + '/', 0, false);
  }
}

async function renderTreeNode(parent, path, depth, isVirtual) {
  const parts = path.replace(/\/$/, '').split('/');
  const name  = parts[parts.length - 1];
  const isExpanded = state.treeExpanded.has(path);
  const isActive   = state.currentPath === path || state.currentPath.startsWith(path);

  const el = document.createElement('div');
  el.className = [
    'tree-item',
    depth === 0 ? 'share-root' : '',
    isActive    ? 'active'     : '',
    isVirtual   ? 'virtual-share' : '',
  ].filter(Boolean).join(' ');
  el.style.paddingLeft = (12 + depth * 14) + 'px';

  const arrow = document.createElement('span');
  arrow.className = 'tree-arrow';
  arrow.textContent = isExpanded ? '▾' : '▸';
  el.appendChild(arrow);

  const iconWrap = document.createElement('span');
  iconWrap.className = 'tree-icon';
  iconWrap.appendChild(makeIconEl(folderIconId(path, isVirtual), 14, 12));
  el.appendChild(iconWrap);

  const label = document.createElement('span');
  label.textContent = name;
  el.appendChild(label);

  const actions = document.createElement('span');
  actions.className = 'tree-item-actions';
  const starBtn = document.createElement('button');
  starBtn.textContent = isFavorite(path) ? '★' : '☆';
  starBtn.title = isFavorite(path) ? 'Remover favorito' : 'Favoritar';
  starBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggleFavorite(path);
    renderTree();
  });
  actions.appendChild(starBtn);
  el.appendChild(actions);

  el.addEventListener('click', async e => {
    e.stopPropagation();
    const expanded = state.treeExpanded.has(path);
    if (expanded) {
      state.treeExpanded.delete(path);
      await renderTree();
    } else {
      navigate(path); // navigate() adds to treeExpanded and re-renders
    }
  });

  parent.appendChild(el);

  if (isExpanded) {
    const children = await loadTreeDir(path);
    for (const child of children) {
      await renderTreeNode(parent, path + child.name + '/', depth + 1, isVirtual);
    }
  }
}

// ── Navigation ─────────────────────────────────────────────────────────────

async function navigate(path) {
  setMainView('explorer');
  state.currentPath = path.endsWith('/') ? path : path + '/';
  state.selected.clear();
  updateClipboardBtns();

  const parts = state.currentPath.replace(/\/$/, '').split('/');
  let built = '';
  for (const part of parts) {
    built += (built ? '/' : '') + part;
    state.treeExpanded.add(built + '/');
  }

  const resp = await fetch('/api/files?path=' + encodeURIComponent(state.currentPath));
  if (!resp.ok) { showToast('Erro ao listar diretório'); return; }
  const data = await resp.json();
  state.currentItems = data.items || [];
  delete treeCache[state.currentPath];

  addRecent(state.currentPath);
  renderSidebarExtras();
  renderBreadcrumb();
  applyAllFilters();
  await renderTree();
  document.getElementById('search-input').value = '';
}

function renderBreadcrumb() {
  const bc = document.getElementById('breadcrumb');
  bc.textContent = '';
  const parts = state.currentPath.replace(/\/$/, '').split('/').filter(Boolean);
  let built = '';
  parts.forEach((part, i) => {
    built += (built ? '/' : '') + part;
    if (i > 0) {
      const sep = document.createElement('span');
      sep.className = 'bc-sep';
      sep.textContent = ' › ';
      bc.appendChild(sep);
    }
    const span = document.createElement('span');
    span.textContent = part;
    if (i < parts.length - 1) {
      span.className = 'bc-link';
      const cap = built + '/';
      span.addEventListener('click', () => navigate(cap));
    } else {
      span.className = 'bc-current';
    }
    bc.appendChild(span);
  });
}

// ── Render items ───────────────────────────────────────────────────────────

function renderItems(items) {
  const container = document.getElementById('file-list');
  document.getElementById('item-count').textContent =
    items.length + ' ' + (items.length === 1 ? 'item' : 'itens');

  updateKPI(state.currentItems);
  container.textContent = '';

  if (state.viewMode === 'list') {
    container.className = 'file-list list-view';
    const header = document.createElement('div');
    header.className = 'list-header';
    ['', '', 'Nome', 'Tamanho', 'Modificado', 'Ações'].forEach(t => {
      const s = document.createElement('span');
      s.textContent = t;
      header.appendChild(s);
    });
    container.appendChild(header);
    items.forEach(item => container.appendChild(makeListRow(item)));
  } else {
    container.className = 'file-list grid-view';
    items.forEach(item => container.appendChild(makeGridCard(item)));
  }
}

function makeListRow(item) {
  const itemPath = state.currentPath + item.name;
  const row = document.createElement('div');
  row.className = 'file-row' + (state.selected.has(itemPath) ? ' selected' : '');

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'row-check';
  cb.checked = state.selected.has(itemPath);
  cb.addEventListener('change', e => { e.stopPropagation(); toggleSelect(itemPath, e.target.checked); });
  row.appendChild(cb);

  const iconWrap = document.createElement('span');
  iconWrap.className = 'f-icon';
  iconWrap.appendChild(item.type === 'dir'
    ? makeIconEl('ico-folder', 16, 14)
    : fileIconEl(item.name, 13, 16));
  row.appendChild(iconWrap);

  const name = document.createElement('span');
  name.className = 'f-name ' + (item.type === 'dir' ? 'is-dir' : 'is-file');
  name.textContent = item.name;
  if (item.type === 'dir') name.addEventListener('click', () => navigate(itemPath + '/'));
  else name.addEventListener('click', () => openFile(itemPath, item.name));
  row.appendChild(name);

  const size = document.createElement('span');
  size.className = 'f-meta';
  size.textContent = item.size != null ? fmtSize(item.size) : '—';
  row.appendChild(size);

  const mod = document.createElement('span');
  mod.className = 'f-meta';
  mod.textContent = item.modified
    ? new Date(item.modified.endsWith('Z') ? item.modified : item.modified + 'Z').toLocaleString('pt-BR')
    : '—';
  row.appendChild(mod);

  row.appendChild(makeActionButtons(item, itemPath));
  return row;
}

function makeGridCard(item) {
  const itemPath = state.currentPath + item.name;
  const card = document.createElement('div');
  card.className = 'file-card' + (state.selected.has(itemPath) ? ' selected' : '');

  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'card-check';
  cb.checked = state.selected.has(itemPath);
  cb.addEventListener('change', e => { e.stopPropagation(); toggleSelect(itemPath, e.target.checked); });
  card.appendChild(cb);

  card.addEventListener('click', e => {
    if (e.target === cb) return;
    if (item.type === 'dir') navigate(itemPath + '/');
    else openFile(itemPath, item.name);
  });

  const iconWrap = document.createElement('div');
  iconWrap.className = 'card-icon';
  iconWrap.appendChild(item.type === 'dir'
    ? makeIconEl('ico-folder', 36, 32)
    : fileIconEl(item.name, 26, 32));
  card.appendChild(iconWrap);

  const label = document.createElement('div');
  label.className = 'card-name';
  label.title = item.name;
  label.textContent = item.name;
  card.appendChild(label);

  const actions = makeActionButtons(item, itemPath);
  actions.className = 'card-actions';
  card.appendChild(actions);
  return card;
}

function makeActionButtons(item, itemPath) {
  const wrap = document.createElement('span');
  wrap.className = 'f-actions';

  if (item.type === 'file') {
    const dl = document.createElement('button');
    dl.title = 'Download'; dl.textContent = '⬇';
    dl.addEventListener('click', e => { e.stopPropagation(); openFile(itemPath, item.name); });
    wrap.appendChild(dl);
  }

  const shareBtn = document.createElement('button');
  shareBtn.title = 'Compartilhar'; shareBtn.textContent = '🔗';
  shareBtn.addEventListener('click', e => { e.stopPropagation(); promptShare(itemPath, item.type); });
  wrap.appendChild(shareBtn);

  if (item.type === 'dir') {

    const starBtn = document.createElement('button');
    const favPath = itemPath + '/';
    starBtn.textContent = isFavorite(favPath) ? '★' : '☆';
    starBtn.title = 'Favoritar';
    starBtn.addEventListener('click', e => {
      e.stopPropagation();
      toggleFavorite(favPath);
      renderTree();
      applyAllFilters();
    });
    wrap.appendChild(starBtn);
  }

  const ren = document.createElement('button');
  ren.title = 'Renomear'; ren.textContent = '✏';
  ren.addEventListener('click', e => { e.stopPropagation(); promptRename(itemPath, item.name); });
  wrap.appendChild(ren);

  const del = document.createElement('button');
  del.title = 'Deletar'; del.textContent = '🗑';
  del.addEventListener('click', e => { e.stopPropagation(); promptDelete(itemPath, item.type === 'dir'); });
  wrap.appendChild(del);

  return wrap;
}

function setView(mode, rerender) {
  state.viewMode = mode;
  localStorage.setItem('viewMode', mode);
  document.getElementById('btn-list').classList.toggle('active', mode === 'list');
  document.getElementById('btn-grid').classList.toggle('active', mode === 'grid');
  if (rerender && state.currentItems.length) applyAllFilters();
}

// ── File open (OS-level) ───────────────────────────────────────────────────

function openFile(path, name) {
  // <a download> forces the browser to download (never render inline).
  // Windows then opens the file with the registered OS app (Word, Excel, Acrobat, etc.)
  const a = document.createElement('a');
  a.href = '/api/files/download?path=' + encodeURIComponent(path);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Directory operations ───────────────────────────────────────────────────

function promptMkdir() {
  showModal('Nome da nova pasta:', '', true, async name => {
    if (!name || name.includes('/') || name.includes('\\')) { showToast('Nome inválido'); return; }
    const resp = await fetch('/api/files/mkdir', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: state.currentPath + name }),
    });
    if (resp.ok) navigate(state.currentPath);
    else showToast('Erro ao criar pasta');
  });
}

function promptRename(path, currentName) {
  showModal('Novo nome:', currentName, true, async newName => {
    if (!newName || newName === currentName || newName.includes('/') || newName.includes('\\')) {
      showToast('Nome inválido'); return;
    }
    const resp = await fetch('/api/files/rename', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, new_name: newName }),
    });
    if (resp.ok) navigate(state.currentPath);
    else showToast('Erro ao renomear');
  });
}

function promptDelete(path, isDir) {
  const name = path.split('/').pop();
  const msg = isDir
    ? 'Deletar pasta "' + name + '" e todo o seu conteúdo?'
    : 'Deletar arquivo "' + name + '"?';
  showModal(msg, null, false, async () => {
    const resp = await fetch(
      '/api/files?path=' + encodeURIComponent(path) + '&confirm=true',
      { method: 'DELETE' }
    );
    if (resp.ok) navigate(state.currentPath);
    else showToast('Erro ao deletar');
  });
}

// ── Sharing ────────────────────────────────────────────────────────────────

let _sharePath = '';

function promptShare(path, type) {
  // For files, share the parent directory so recipient can navigate to it
  const sharePath = type === 'file' ? path.substring(0, path.lastIndexOf('/') + 1) || path : path;
  const defaultName = type === 'file'
    ? path.split('/').pop()
    : path.replace(/\/$/, '').split('/').pop();
  _sharePath = sharePath;
  document.getElementById('share-modal-path').textContent = path;
  document.getElementById('share-display-name').value = defaultName;
  document.getElementById('share-recipients').value = '';
  document.getElementById('share-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('share-display-name').focus(), 50);
}

function closeShareModal() {
  document.getElementById('share-modal').classList.add('hidden');
}

async function submitShare() {
  const name = document.getElementById('share-display-name').value.trim();
  const raw  = document.getElementById('share-recipients').value.trim();
  if (!name || !raw) { showToast('Preencha nome e destinatário(s)'); return; }
  const recipients = raw.split(',').map(s => s.trim()).filter(Boolean);
  const resp = await fetch('/api/shares', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_path: _sharePath, name, recipients }),
  });
  closeShareModal();
  if (resp.ok) showToast('Pasta compartilhada com ' + recipients.join(', '));
  else showToast('Erro ao compartilhar — verifique os usuários');
}

// ── Upload ─────────────────────────────────────────────────────────────────

async function uploadFiles(files) {
  for (const file of Array.from(files)) {
    const toast = showToast('Enviando ' + file.name + '…', true);
    const form  = new FormData();
    form.append('file', file);
    const resp = await fetch(
      '/api/files/upload?path=' + encodeURIComponent(state.currentPath),
      { method: 'POST', body: form }
    );
    toast.remove();
    if (!resp.ok) showToast('Erro ao enviar ' + file.name);
  }
  navigate(state.currentPath);
  document.getElementById('file-input').value = '';
}

function wireDragDrop() {
  const overlay = document.getElementById('drop-overlay');
  let depth = 0;
  document.addEventListener('dragenter', e => { e.preventDefault(); depth++; overlay.classList.remove('hidden'); });
  document.addEventListener('dragleave', () => { if (--depth <= 0) { depth = 0; overlay.classList.add('hidden'); } });
  document.addEventListener('dragover',  e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault(); depth = 0; overlay.classList.add('hidden');
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  });
}

// ── Modal ──────────────────────────────────────────────────────────────────

let _modalCb = null;

function showModal(msg, inputDefault, hasInput, callback) {
  _modalCb = callback;
  document.getElementById('modal-msg').textContent = msg;
  const inp = document.getElementById('modal-input');
  if (hasInput) {
    inp.classList.remove('hidden');
    inp.value = inputDefault || '';
    setTimeout(() => inp.focus(), 50);
  } else {
    inp.classList.add('hidden');
  }
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('modal-confirm').onclick = () => {
    const val = hasInput ? inp.value.trim() : null;
    const cb  = _modalCb;
    closeModal();
    cb && cb(val);
  };
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  _modalCb = null;
}

// ── Toast ──────────────────────────────────────────────────────────────────

function showToast(msg, persistent) {
  const el = document.createElement('div');
  el.className = 'upload-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  if (!persistent) setTimeout(() => el.remove(), 3500);
  return el;
}

// ── Utils ──────────────────────────────────────────────────────────────────

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(1) + ' GB';
}

// ── Main view switcher ─────────────────────────────────────────────────────

function setMainView(mode) {
  const dash = document.getElementById('dashboard-panel');
  const exp  = document.getElementById('explorer-panel');
  const btnD = document.getElementById('btn-dashboard');
  const btnE = document.getElementById('btn-explorer');
  if (mode === 'dashboard') {
    dash.classList.remove('hidden');
    exp.classList.add('hidden');
    btnD.classList.add('active');
    btnE.classList.remove('active');
    renderDashboard();
  } else {
    dash.classList.add('hidden');
    exp.classList.remove('hidden');
    btnD.classList.remove('active');
    btnE.classList.add('active');
  }
}

function renderDashboard() {
  const panel = document.getElementById('dashboard-panel');
  panel.textContent = '';

  const recents = getRecents();
  const favs    = getFavorites();
  const shares  = state.shares;
  const virtual = shares.filter(s => s.virtual);
  const myShares = shares.filter(s => !s.virtual);
  const now = new Date();

  // ── Header strip ────────────────────────────────────────────────
  const strip = document.createElement('div');
  strip.className = 'db-strip';

  function kpiTile(value, label, accent) {
    const t = document.createElement('div');
    t.className = 'db-kpi' + (accent ? ' db-kpi-accent' : '');
    const v = document.createElement('div'); v.className = 'db-kpi-val'; v.textContent = String(value);
    const l = document.createElement('div'); l.className = 'db-kpi-label'; l.textContent = label;
    t.appendChild(v); t.appendChild(l);
    return t;
  }

  strip.appendChild(kpiTile(myShares.length, 'Diretórios', true));
  strip.appendChild(kpiTile(virtual.length, 'Compartilhados'));
  strip.appendChild(kpiTile(favs.length, 'Favoritos'));
  strip.appendChild(kpiTile(recents.length, 'Recentes'));
  strip.appendChild(kpiTile(now.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}), 'Horário'));
  panel.appendChild(strip);

  // ── Main body ────────────────────────────────────────────────────
  const body = document.createElement('div');
  body.className = 'db-body';

  // ── Left: Diretórios grid ─────────────────────────────────────
  const colL = document.createElement('div');
  colL.className = 'db-col';

  const h1 = document.createElement('div'); h1.className = 'db-section-head';
  const h1t = document.createElement('span'); h1t.className = 'db-section-title'; h1t.textContent = 'Diretórios';
  const h1s = document.createElement('span'); h1s.className = 'db-section-count'; h1s.textContent = myShares.length;
  h1.appendChild(h1t); h1.appendChild(h1s);
  colL.appendChild(h1);

  const sharesGrid = document.createElement('div');
  sharesGrid.className = 'db-shares-grid';
  myShares.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'db-share-card';
    card.style.animationDelay = (i * 40) + 'ms';

    const dot = document.createElement('div'); dot.className = 'db-status-dot';
    const ico = document.createElement('div'); ico.className = 'db-card-ico';
    ico.appendChild(makeIconEl('ico-folder', 32, 28));
    const body = document.createElement('div'); body.className = 'db-card-body';
    const nm = document.createElement('div'); nm.className = 'db-card-name'; nm.textContent = s.name;
    const sub = document.createElement('div'); sub.className = 'db-card-sub'; sub.textContent = 'Samba share';
    body.appendChild(nm); body.appendChild(sub);

    card.appendChild(dot); card.appendChild(ico); card.appendChild(body);
    card.addEventListener('click', () => navigate(s.name + '/'));
    sharesGrid.appendChild(card);
  });
  colL.appendChild(sharesGrid);

  // ── Compartilhados comigo ──────────────────────────────────────
  if (virtual.length > 0) {
    const h2 = document.createElement('div'); h2.className = 'db-section-head';
    const h2t = document.createElement('span'); h2t.className = 'db-section-title'; h2t.textContent = 'Compartilhados comigo';
    const h2s = document.createElement('span'); h2s.className = 'db-section-count'; h2s.textContent = virtual.length;
    h2.appendChild(h2t); h2.appendChild(h2s);
    colL.appendChild(h2);

    const vGrid = document.createElement('div'); vGrid.className = 'db-shares-grid';
    virtual.forEach((s, i) => {
      const card = document.createElement('div'); card.className = 'db-share-card db-share-card-virtual';
      card.style.animationDelay = (i * 40) + 'ms';
      const ico = document.createElement('div'); ico.className = 'db-card-ico';
      ico.appendChild(makeIconEl('ico-folder-shared', 32, 28));
      const body = document.createElement('div'); body.className = 'db-card-body';
      const nm = document.createElement('div'); nm.className = 'db-card-name'; nm.textContent = s.name;
      const owner = document.createElement('div'); owner.className = 'db-card-sub-green'; owner.textContent = 'de ' + (s.owner || '?');
      body.appendChild(nm); body.appendChild(owner);
      card.appendChild(ico); card.appendChild(body);
      card.addEventListener('click', () => navigate(s.name + '/'));
      vGrid.appendChild(card);
    });
    colL.appendChild(vGrid);
  }

  body.appendChild(colL);

  // ── Right column ──────────────────────────────────────────────
  const colR = document.createElement('div');
  colR.className = 'db-col db-col-right';

  // Recentes
  const hr = document.createElement('div'); hr.className = 'db-section-head';
  const hrt = document.createElement('span'); hrt.className = 'db-section-title'; hrt.textContent = 'Visitados Recentemente';
  hr.appendChild(hrt); colR.appendChild(hr);

  const timelineWrap = document.createElement('div'); timelineWrap.className = 'db-timeline';
  if (recents.length === 0) {
    const e = document.createElement('div'); e.className = 'db-empty'; e.textContent = 'Nenhuma visita registrada';
    timelineWrap.appendChild(e);
  } else {
    recents.slice(0, 8).forEach((r, i) => {
      const row = document.createElement('div'); row.className = 'db-timeline-row';
      row.style.animationDelay = (i * 35) + 'ms';
      const dot = document.createElement('div'); dot.className = 'db-tl-dot' + (i === 0 ? ' db-tl-dot-active' : '');
      const info = document.createElement('div'); info.className = 'db-tl-info';
      const nm = document.createElement('div'); nm.className = 'db-tl-name'; nm.textContent = r.name;
      const ph = document.createElement('div'); ph.className = 'db-tl-path'; ph.textContent = r.path;
      info.appendChild(nm); info.appendChild(ph);
      row.appendChild(dot); row.appendChild(info);
      row.addEventListener('click', () => { setMainView('explorer'); navigate(r.path); });
      timelineWrap.appendChild(row);
    });
  }
  colR.appendChild(timelineWrap);

  // Favoritos
  const hf = document.createElement('div'); hf.className = 'db-section-head';
  const hft = document.createElement('span'); hft.className = 'db-section-title'; hft.textContent = 'Favoritos';
  const hfs = document.createElement('span'); hfs.className = 'db-section-count'; hfs.textContent = favs.length;
  hf.appendChild(hft); hf.appendChild(hfs); colR.appendChild(hf);

  const favWrap = document.createElement('div'); favWrap.className = 'db-favs';
  if (favs.length === 0) {
    const e = document.createElement('div'); e.className = 'db-empty'; e.textContent = 'Nenhum favorito ainda — use ★ nos arquivos';
    favWrap.appendChild(e);
  } else {
    favs.slice(0, 6).forEach((f, i) => {
      const card = document.createElement('div'); card.className = 'db-fav-card';
      card.style.animationDelay = (i * 40) + 'ms';
      card.appendChild(makeIconEl('ico-folder', 14, 12));
      const n = document.createElement('span'); n.textContent = f.name; card.appendChild(n);
      card.addEventListener('click', () => navigate(f.path));
      favWrap.appendChild(card);
    });
  }
  colR.appendChild(favWrap);
  body.appendChild(colR);
  panel.appendChild(body);

  // ── User greeting ────────────────────────────────────────────────
  const greeting = document.createElement('div');
  greeting.className = 'db-greeting';
  const hr2 = now.getHours();
  const greetTxt = hr2 < 12 ? 'Bom dia' : hr2 < 18 ? 'Boa tarde' : 'Boa noite';
  greeting.textContent = greetTxt + ', ' + (state.username || 'usuário') + '.';
  panel.insertBefore(greeting, strip);
}

// ── Sidebar resizer ────────────────────────────────────────────────────────

function initResizer() {
  const resizer = document.getElementById('resizer');
  const sidebar = document.querySelector('.sidebar');
  if (!resizer || !sidebar) return;

  const SIDEBAR_MIN = 120;
  const SIDEBAR_MAX = 480;
  const saved = parseInt(localStorage.getItem('sidebarWidth'), 10);
  if (saved && saved >= SIDEBAR_MIN && saved <= SIDEBAR_MAX) sidebar.style.width = saved + 'px';

  let startX, startW;

  resizer.addEventListener('mousedown', e => {
    startX = e.clientX;
    startW = sidebar.getBoundingClientRect().width;
    resizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function onMove(ev) {
      const w = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW + ev.clientX - startX));
      sidebar.style.width = w + 'px';
    }
    function onUp() {
      resizer.classList.remove('dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem('sidebarWidth', parseInt(sidebar.style.width, 10));
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

init();
initResizer();
