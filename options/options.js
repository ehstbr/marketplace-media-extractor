const defaults = {
  imageFormat: 'jpeg', jpegQuality: 0.95, folderTemplate: '{produto}',
  imageTemplate: '{produto}-{numero_imagem:02}', videoTemplate: '{produto}-video-{numero_video:02}',
  posterTemplate: '{produto}-video-{numero_video:02}-capa', quickAllAction: 'prepare',
  singleSaveAs: false, includeVideos: true, includeVideoPosters: false,
  floatingButton: true, galleryControls: true, thumbnailControls: false,
  downloadConcurrency: 'auto', conversionConcurrency: 'auto'
};

const ids = Object.keys(defaults);
const $ = (id) => document.getElementById(id);
let toastTimer = null;

function showToast(message, kind = 'success') {
  const toast = $('toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `toast ${kind}`;
  requestAnimationFrame(() => toast.classList.add('show'));
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { if (!toast.classList.contains('show')) toast.textContent = ''; }, 240);
  }, 2600);
}

function updateQualityLabel() {
  const quality = $('jpegQuality');
  const label = $('jpegQualityLabel');
  if (quality && label) label.textContent = `${quality.value}%`;
}

function applyToForm(data) {
  for (const id of ids) {
    const el = $(id);
    if (!el) continue;
    const value = Object.prototype.hasOwnProperty.call(data, id) ? data[id] : defaults[id];
    if (el.type === 'checkbox') el.checked = Boolean(value);
    else if (id === 'jpegQuality') el.value = Math.round(Number(value) * 100);
    else el.value = value ?? '';
  }
  updateQualityLabel();
}

async function load() {
  const data = await chrome.storage.local.get(defaults);
  applyToForm(data);
}

function collect() {
  const data = {};
  for (const id of ids) {
    const el = $(id);
    if (!el) continue;
    data[id] = el.type === 'checkbox' ? el.checked : id === 'jpegQuality' ? Number(el.value) / 100 : el.value;
  }
  return data;
}

async function save() {
  await chrome.storage.local.set(collect());
  showToast('Configurações salvas.');
}

async function reset() {
  await chrome.storage.local.remove(ids);
  await chrome.storage.local.set(defaults);
  applyToForm(defaults);
  showToast('Padrões restaurados.', 'info');
}

function bindTabs() {
  for (const tab of document.querySelectorAll('.tab')) {
    tab.addEventListener('click', () => {
      for (const item of document.querySelectorAll('.tab')) item.classList.toggle('active', item === tab);
      for (const panel of document.querySelectorAll('.panel')) panel.classList.toggle('active', panel.dataset.panel === tab.dataset.tab);
    });
  }
}

async function init() {
  const manifest = chrome.runtime.getManifest();
  if ($('version')) $('version').textContent = `v${manifest.version}`;
  if ($('aboutVersion')) $('aboutVersion').textContent = manifest.version;
  bindTabs();
  $('jpegQuality')?.addEventListener('input', updateQualityLabel);
  $('save')?.addEventListener('click', save);
  $('reset')?.addEventListener('click', reset);
  await load();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
