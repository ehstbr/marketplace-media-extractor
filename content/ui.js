(() => {
  const MME = globalThis.MME;
  const BRAND_ICON_URL = chrome.runtime.getURL('assets/icons/icon48.png');

  const UI_CSS = `
    :host{all:initial;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1f2937}
    *{box-sizing:border-box}
    button,input,select{font:inherit}
    .btn{border:0;border-radius:10px;background:#1f2937;color:#fff;padding:9px 12px;cursor:pointer;font-weight:650;box-shadow:0 5px 16px rgba(0,0,0,.14)}
    .btn:hover{filter:brightness(1.08)}
    .btn:disabled{opacity:.55;cursor:default}
    .btn.secondary{background:#fff;color:#1f2937;border:1px solid #d1d5db;box-shadow:none}
    .btn.orange{background:#e85d04}
    .gallery-toolbar{display:flex;align-items:center;gap:3px;padding:4px;border:1px solid rgba(17,24,39,.10);border-radius:14px;background:rgba(255,255,255,.88);backdrop-filter:blur(14px) saturate(1.15);-webkit-backdrop-filter:blur(14px) saturate(1.15);box-shadow:0 8px 28px rgba(15,23,42,.16),0 1px 2px rgba(15,23,42,.08);pointer-events:auto;user-select:none;transition:opacity .15s ease,transform .15s ease}
    .gallery-toolbar:hover{background:rgba(255,255,255,.96);box-shadow:0 10px 32px rgba(15,23,42,.20),0 1px 2px rgba(15,23,42,.10)}
    .gallery-action{position:relative;width:38px;height:38px;border:0;border-radius:10px;background:transparent;color:#1f2937;display:grid;place-items:center;cursor:pointer;transition:background .14s ease,transform .14s ease}
    .gallery-action:hover{background:rgba(15,23,42,.075)}
    .gallery-action:active{transform:scale(.94)}
    .gallery-action:disabled{opacity:.45;cursor:default;transform:none}
    .gallery-action svg{width:20px;height:20px;display:block;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    .gallery-divider{width:1px;height:22px;background:rgba(15,23,42,.10)}
    .gallery-count{position:absolute;right:1px;top:0;min-width:16px;height:16px;padding:0 4px;border-radius:9px;display:grid;place-items:center;background:#172554;color:#fff;border:2px solid rgba(255,255,255,.95);font-size:9px;font-weight:800;line-height:1}
    .gallery-progress{position:absolute;inset:3px;border-radius:9px;background:rgba(255,255,255,.94);display:none;place-items:center;font-size:9px;font-weight:800;color:#172554}
    .gallery-action.busy .gallery-progress{display:grid}
    .thumb-download{width:28px;height:28px;border:1px solid rgba(17,24,39,.12);border-radius:9px;background:rgba(255,255,255,.94);color:#1f2937;display:grid;place-items:center;cursor:pointer;box-shadow:0 4px 14px rgba(15,23,42,.18);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);transition:transform .12s ease,background .12s ease,opacity .12s ease}
    .thumb-download:hover{background:#fff;transform:translateY(-1px)}
    .thumb-download:active{transform:scale(.94)}
    .thumb-download[aria-disabled="true"]{opacity:.55;cursor:default;transform:none}
    .thumb-download svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .thumb-download.busy{font-size:9px;font-weight:800;color:#172554}
    .transfer-card{width:min(320px,calc(100vw - 36px));background:rgba(255,255,255,.97);border:1px solid rgba(15,23,42,.10);border-radius:15px;padding:12px 13px;box-shadow:0 16px 42px rgba(15,23,42,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);opacity:0;transform:translateY(8px) scale(.98);transition:opacity .18s ease,transform .2s cubic-bezier(.2,.8,.2,1);pointer-events:none}
    .transfer-card.show{opacity:1;transform:translateY(0) scale(1)}
    .transfer-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:8px}.transfer-title{font-size:12px;font-weight:850;color:#111827;line-height:1.25}.transfer-percent{font-size:11px;font-weight:850;color:#172554;background:#eef2ff;border-radius:999px;padding:3px 7px;white-space:nowrap}.transfer-detail{font-size:10px;line-height:1.35;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:8px}.transfer-track{height:6px;border-radius:999px;background:#e5e7eb;overflow:hidden}.transfer-bar{height:100%;width:0;background:linear-gradient(90deg,#1d4ed8,#2563eb);border-radius:inherit;transition:width .18s ease}.transfer-card.done .transfer-bar{background:#059669}.transfer-card.error .transfer-bar{background:#dc2626}
    @keyframes mme-float-enter{from{opacity:0;transform:translateY(10px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}
    @media (prefers-reduced-motion:reduce){.gallery-toolbar,.gallery-action,.thumb-download,.float,.float-main,.float-menu,.transfer-card,.transfer-bar{transition:none!important}.float{animation:none!important;transform:none!important;opacity:1!important}.float-menu{transform:none}}
    .float{display:flex;flex-direction:column;align-items:flex-end;gap:8px;opacity:1;transform:translateY(0) scale(1);transform-origin:100% 100%;pointer-events:none;animation:mme-float-enter .22s cubic-bezier(.2,.8,.2,1) both;transition:opacity .18s ease,transform .22s cubic-bezier(.2,.8,.2,1)}
    .float.is-exiting{opacity:0;transform:translateY(10px) scale(.94);pointer-events:none}
    .float-main{width:54px;height:54px;border-radius:18px;border:0;background:transparent;padding:0;cursor:pointer;pointer-events:auto;transition:transform .16s ease;overflow:visible}
    .float-main img{width:54px;height:54px;border-radius:18px;display:block;box-shadow:0 12px 34px rgba(0,0,0,.28);transition:box-shadow .18s ease,filter .18s ease}
    .float-main:hover{transform:translateY(-2px)}
    .float-main:hover img{box-shadow:0 15px 38px rgba(0,0,0,.32);filter:brightness(1.03)}
    .float-main:active{transform:translateY(0) scale(.94)}
    .float-menu{width:225px;border:1px solid #e5e7eb;background:#fff;border-radius:15px;padding:7px;box-shadow:0 18px 48px rgba(0,0,0,.22);opacity:0;visibility:hidden;pointer-events:none;transform:translateY(8px) scale(.975);transform-origin:100% 100%;transition:opacity .15s ease,transform .18s cubic-bezier(.2,.8,.2,1),visibility 0s linear .18s}
    .float.open .float-menu{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0) scale(1);transition-delay:0s}
    .menu-btn{width:100%;border:0;background:transparent;text-align:left;padding:10px 11px;border-radius:9px;cursor:pointer;color:#111827;display:flex;align-items:center;gap:10px;transition:background .14s ease,color .14s ease,transform .14s ease}
    .menu-btn:hover{background:#f3f4f6}
    .menu-btn:active{transform:scale(.985)}
    .menu-icon{width:18px;height:18px;display:grid;place-items:center;color:#172554;flex:0 0 18px}
    .menu-icon svg{width:18px;height:18px;display:block;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
    .menu-copy{flex:1 1 auto;min-width:0}
    .menu-text{display:block;font-size:13px;font-weight:700;color:#111827;line-height:1.2}
    .menu-sub{display:block;font-size:11px;color:#6b7280;line-height:1.25;margin-top:2px}
    .menu-sep{height:1px;background:#e5e7eb;margin:5px 4px}
  `;

  function createShadowHost(id, styleText = '') {
    let host = document.getElementById(id);
    if (host) return { host, shadow: host.shadowRoot };
    host = document.createElement('div');
    host.id = id;
    host.style.cssText = styleText;
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = UI_CSS;
    shadow.appendChild(style);
    document.documentElement.appendChild(host);
    return { host, shadow };
  }

  const MODAL_TRANSITION_MS = 230;

  function openAnimatedModal(shadow) {
    const backdrop = shadow?.querySelector('.backdrop');
    if (!backdrop) return;
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduced) {
      backdrop.classList.add('is-open');
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('is-open')));
  }

  function closeAnimatedModal(host, shadow) {
    if (!host?.isConnected) return;
    if (host.dataset.mmeClosing === '1') return;
    const backdrop = shadow?.querySelector('.backdrop');
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (!backdrop || reduced) {
      host.remove();
      return;
    }
    host.dataset.mmeClosing = '1';
    backdrop.classList.remove('is-open');
    backdrop.classList.add('is-closing');
    setTimeout(() => host.remove(), MODAL_TRANSITION_MS);
  }

  function formatDuration(seconds) {
    if (!seconds || !Number.isFinite(seconds)) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function selectedMedia(listing, settings) {
    return listing.media.filter((m) => {
      if (m.type === 'video' && !settings.includeVideos) return false;
      if (m.subtype === 'video_poster' && !settings.includeVideoPosters) return false;
      return m.selected !== false;
    });
  }

  function countersForMedia(mediaList) {
    const map = new Map();
    let global = 0, image = 0, video = 0;
    for (const m of mediaList) {
      global++;
      if (m.type === 'video') video++;
      else if (m.subtype !== 'video_poster') image++;
      map.set(m.id, { global, image: m.type === 'image' && m.subtype !== 'video_poster' ? image : image, video: m.type === 'video' ? video : (m.videoIndex || video) });
    }
    return map;
  }

  function stageLabel(stage, mediaType = 'image') {
    const map = {
      queued: 'Preparando…', resolving: 'Procurando a melhor resolução…', resolved: 'Melhor fonte encontrada',
      converting: 'Convertendo imagem…', converted: 'Imagem convertida', 'starting-download': 'Iniciando download…',
      download: 'Baixando arquivo…', paused: 'Download pausado', complete: 'Concluído', error: 'Falha no download',
      'hls-manifest': 'Lendo vídeo…', 'hls-segments': 'Baixando segmentos do vídeo…', 'hls-assembling': 'Montando vídeo…', 'hls-ready': 'Vídeo preparado'
    };
    return map[stage] || (mediaType === 'video' ? 'Processando vídeo…' : 'Processando imagem…');
  }

  function ensureTransferHud() {
    let host = document.getElementById('mme-transfer-progress-host');
    if (host) return host.shadowRoot;
    host = document.createElement('div');
    host.id = 'mme-transfer-progress-host';
    host.style.cssText = 'position:fixed;right:18px;bottom:86px;z-index:2147483646;pointer-events:none;';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style'); style.textContent = UI_CSS; shadow.appendChild(style);
    const card = document.createElement('div');
    card.className = 'transfer-card';
    card.innerHTML = '<div class="transfer-head"><div class="transfer-title">Preparando download</div><div class="transfer-percent">0%</div></div><div class="transfer-detail">Aguardando…</div><div class="transfer-track"><div class="transfer-bar"></div></div>';
    shadow.appendChild(card);
    document.documentElement.appendChild(host);
    return shadow;
  }

  function renderTransferHud({ title, detail, percent = 0, state = '' }) {
    clearTimeout(MME.state.transferHudTimer);
    const shadow = ensureTransferHud();
    const card = shadow.querySelector('.transfer-card');
    if (!card) return;
    card.classList.remove('done', 'error');
    if (state) card.classList.add(state);
    card.querySelector('.transfer-title').textContent = title || 'Download';
    card.querySelector('.transfer-detail').textContent = detail || '';
    const safe = Math.max(0, Math.min(100, Math.round(Number(percent || 0))));
    card.querySelector('.transfer-percent').textContent = `${safe}%`;
    card.querySelector('.transfer-bar').style.width = `${safe}%`;
    requestAnimationFrame(() => card.classList.add('show'));
  }

  function hideTransferHud(delay = 1600) {
    clearTimeout(MME.state.transferHudTimer);
    MME.state.transferHudTimer = setTimeout(() => {
      const host = document.getElementById('mme-transfer-progress-host');
      const card = host?.shadowRoot?.querySelector('.transfer-card');
      card?.classList.remove('show');
      setTimeout(() => { if (!card?.classList.contains('show')) host?.remove(); }, 240);
    }, delay);
  }

  function registerDownloadJob(jobId, media, filename, batch = null, initialStatus = 'active') {
    MME.state.downloadJobs.set(jobId, { jobId, mediaId: media.id, mediaType: media.type, filename, percent: 0, status: initialStatus, batchId: batch?.id || null, index: batch?.index || 1, total: batch?.total || 1 });
    MME.state.progress.set(media.id, 0);
    if (!batch) renderTransferHud({ title: media.type === 'video' ? 'Baixando vídeo' : 'Baixando imagem', detail: filename.split('/').pop(), percent: 0 });
  }

  function maybeFinishBatch() {
    const batch = MME.state.activeBatch;
    if (!batch) return;
    const jobs = [...MME.state.downloadJobs.values()].filter((j) => j.batchId === batch.id);
    const settled = jobs.filter((j) => j.status === 'complete' || j.status === 'error').length;
    const completed = jobs.filter((j) => j.status === 'complete').length;
    const failed = jobs.filter((j) => j.status === 'error').length;
    const sum = jobs.reduce((acc, j) => acc + Number(j.percent || 0), 0);
    const percent = batch.total ? Math.round(sum / batch.total) : 100;
    const activeJobs = jobs.filter((j) => j.status === 'active');
    const queuedJobs = jobs.filter((j) => j.status === 'queued');
    const activity = settled < batch.total ? ` • ${activeJobs.length} em processamento${queuedJobs.length ? ` • ${queuedJobs.length} na fila` : ''}` : '';
    renderTransferHud({ title: 'Baixando mídias', detail: `${settled}/${batch.total} concluídas${activity}`, percent, state: settled === batch.total ? (failed ? 'error' : 'done') : '' });
    if (settled >= batch.total) {
      if (completed) MME.toast(`${completed} mídia${completed === 1 ? '' : 's'} baixada${completed === 1 ? '' : 's'}.`, 'success');
      if (failed) MME.toast(`${failed} mídia${failed === 1 ? '' : 's'} não pôde${failed === 1 ? '' : 'ram'} ser baixada${failed === 1 ? '' : 's'}.`, 'error');
      MME.state.activeBatch = null;
      hideTransferHud(failed ? 2600 : 1700);
      setTimeout(() => { for (const [id, j] of MME.state.downloadJobs) if (j.batchId === batch.id) MME.state.downloadJobs.delete(id); }, 3000);
    }
  }

  function updateDownloadJob(message) {
    const job = MME.state.downloadJobs.get(message.jobId);
    if (!job) return;
    job.percent = Math.max(0, Math.min(100, Number(message.percent || 0)));
    if (job.status === 'queued' && message.stage !== 'complete' && message.stage !== 'error') job.status = 'active';
    if (message.stage === 'complete') job.status = 'complete';
    if (message.stage === 'error') job.status = 'error';
    MME.state.progress.set(job.mediaId, job.percent);
    if (job.status !== 'active') {
      MME.state.downloading.delete(job.mediaId);
      if (job.status === 'error' && message.error) MME.toast(String(message.error), 'error');
    }
    MME.refreshControls?.();

    if (job.batchId) {
      maybeFinishBatch();
    } else {
      renderTransferHud({ title: job.mediaType === 'video' ? 'Baixando vídeo' : 'Baixando imagem', detail: message.stage === 'complete' ? job.filename.split('/').pop() : `${stageLabel(message.stage, job.mediaType)} • ${job.filename.split('/').pop()}`, percent: job.percent, state: job.status === 'complete' ? 'done' : job.status === 'error' ? 'error' : '' });
      if (job.status === 'complete' || job.status === 'error') {
        hideTransferHud(job.status === 'complete' ? 1500 : 2600);
        setTimeout(() => { MME.state.downloadJobs.delete(message.jobId); MME.state.progress.delete(job.mediaId); MME.refreshControls?.(); }, 2800);
      }
    }
  }

  function failDownloadJob(jobId, error) {
    updateDownloadJob({ jobId, stage: 'error', percent: 0, error: String(error?.message || error || 'Falha no download.') });
  }

  function autoDownloadConcurrency() {
    const hc = Math.max(1, Number(navigator.hardwareConcurrency || 4));
    if (hc >= 12) return 6;
    if (hc >= 8) return 4;
    if (hc >= 4) return 3;
    return 2;
  }

  function autoConversionConcurrency() {
    const hc = Math.max(1, Number(navigator.hardwareConcurrency || 4));
    return hc >= 6 ? 2 : 1;
  }

  function effectiveConcurrency(value, kind = 'download') {
    if (value === 'auto' || value == null || value === '') return kind === 'conversion' ? autoConversionConcurrency() : autoDownloadConcurrency();
    const numeric = Number(value);
    const max = kind === 'conversion' ? 4 : 8;
    return Number.isFinite(numeric) ? Math.max(1, Math.min(max, Math.round(numeric))) : (kind === 'conversion' ? autoConversionConcurrency() : autoDownloadConcurrency());
  }

  async function runTaskPool(items, limit, worker) {
    if (!items.length) return;
    let cursor = 0;
    const count = Math.max(1, Math.min(limit, items.length));
    await Promise.all(Array.from({ length: count }, async () => {
      while (true) {
        const index = cursor++;
        if (index >= items.length) return;
        await worker(items[index], index);
      }
    }));
  }

  function waitForJobSettlement(jobId, timeoutMs = 15 * 60 * 1000) {
    return new Promise((resolve) => {
      const started = Date.now();
      const check = () => {
        const job = MME.state.downloadJobs.get(jobId);
        if (!job || job.status === 'complete' || job.status === 'error') return resolve(job);
        if (Date.now() - started >= timeoutMs) {
          failDownloadJob(jobId, 'Tempo limite excedido durante o download.');
          return resolve(MME.state.downloadJobs.get(jobId));
        }
        setTimeout(check, 120);
      };
      check();
    });
  }

  async function downloadOne(media, customSettings = null) {
    const listing = MME.state.listing;
    if (!listing || !media) return;
    if (media.type === 'video') {
      await MME.refreshVideoSourcesFromNetwork?.();
      media = listing.media.find((m) => m.id === media.id) || media;
    }
    if (MME.state.downloading.has(media.id)) return;
    MME.state.downloading.add(media.id);
    MME.refreshControls?.();

    const settings = { ...MME.state.settings, ...(customSettings || {}) };
    const list = listing.media.filter((m) => m.subtype !== 'video_poster' || settings.includeVideoPosters);
    const counterMap = countersForMedia(list);
    const filename = MME.makeFilename(listing, media, counterMap.get(media.id) || { global: 1, image: media.imageIndex || 1, video: media.videoIndex || 1 }, settings);
    const jobId = crypto.randomUUID();
    registerDownloadJob(jobId, media, filename);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'DOWNLOAD_MEDIA', jobId,
        media,
        filename,
        imageFormat: settings.imageFormat,
        jpegQuality: settings.jpegQuality,
        conversionConcurrency: effectiveConcurrency(settings.conversionConcurrency, 'conversion'),
        saveAs: settings.singleSaveAs
      });
      if (!response?.ok) {
        if (response?.unsupportedStream) throw new Error(`${response.delivery}: formato de vídeo ainda não suportado para download.`);
        throw new Error(response?.error || 'Falha no download.');
      }
    } catch (error) {
      failDownloadJob(jobId, error);
    }
  }

  MME.downloadOne = downloadOne;

  async function downloadMany(mediaList, customSettings = null) {
    const listing = MME.state.listing;
    if (!listing || !mediaList?.length) return;
    const settings = { ...MME.state.settings, ...(customSettings || {}) };
    const downloadLimit = effectiveConcurrency(settings.downloadConcurrency, 'download');
    const conversionLimit = effectiveConcurrency(settings.conversionConcurrency, 'conversion');

    if (mediaList.some((m) => m.type === 'video')) await MME.refreshVideoSourcesFromNetwork?.();

    const refreshed = mediaList.map((media) => media.type === 'video' ? (listing.media.find((m) => m.id === media.id) || media) : media);
    const counterMap = countersForMedia(refreshed);
    const batch = { id: crypto.randomUUID(), total: refreshed.length, concurrency: downloadLimit };
    MME.state.activeBatch = batch;

    const tasks = refreshed.map((media, index) => {
      const filename = MME.makeFilename(listing, media, counterMap.get(media.id), settings);
      const jobId = crypto.randomUUID();
      MME.state.downloading.add(media.id);
      registerDownloadJob(jobId, media, filename, { id: batch.id, index: index + 1, total: batch.total }, 'queued');
      return { media, filename, jobId };
    });
    MME.refreshControls?.();
    maybeFinishBatch();

    const processTask = async ({ media, filename, jobId }) => {
      const job = MME.state.downloadJobs.get(jobId);
      if (job) job.status = 'active';
      maybeFinishBatch();
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'DOWNLOAD_MEDIA', jobId,
          media,
          filename,
          imageFormat: settings.imageFormat,
          jpegQuality: settings.jpegQuality,
          conversionConcurrency: conversionLimit,
          saveAs: false
        });
        if (!response?.ok) {
          const msg = response?.unsupportedStream ? `${response.delivery}: formato de vídeo não suportado.` : (response?.error || 'Falha no download.');
          failDownloadJob(jobId, msg);
          return;
        }
        await waitForJobSettlement(jobId);
      } catch (error) {
        failDownloadJob(jobId, error);
      }
    };

    const imageTasks = tasks.filter((task) => task.media.type !== 'video');
    const videoTasks = tasks.filter((task) => task.media.type === 'video');
    await Promise.all([
      runTaskPool(imageTasks, downloadLimit, processTask),
      runTaskPool(videoTasks, 1, processTask)
    ]);
    maybeFinishBatch();
  }

  MME.downloadMany = downloadMany;

  function installGalleryControls() {
    if (!MME.state.settings.galleryControls) {
      document.getElementById('mme-gallery-controls-host')?.remove();
      MME.state.galleryAnchor = null;
      MME.syncGalleryControlsAnchor = null;
      MME.repositionGalleryControls = null;
      return;
    }
    let host = document.getElementById('mme-gallery-controls-host');
    let shadow;
    if (!host) {
      host = document.createElement('div');
      host.id = 'mme-gallery-controls-host';
      host.style.cssText = 'position:absolute;z-index:2147483645;display:none;pointer-events:none;top:12px;right:12px;';
      shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style'); style.textContent = UI_CSS; shadow.appendChild(style);
      const toolbar = document.createElement('div');
      toolbar.className = 'gallery-toolbar';
      toolbar.innerHTML = `
        <button class="gallery-action" data-action="current" title="Baixar esta mídia" aria-label="Baixar esta mídia">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 19h14"></path></svg>
          <span class="gallery-progress">0%</span>
        </button>
        <span class="gallery-divider" aria-hidden="true"></span>
        <button class="gallery-action" data-action="all" title="Baixar todas as mídias" aria-label="Baixar todas as mídias">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="11" height="11" rx="2"></rect><path d="M8 2h9a3 3 0 0 1 3 3v9"></path><path d="M10 10v8"></path><path d="m7 15 3 3 3-3"></path></svg>
          <span class="gallery-count">0</span>
        </button>`;
      shadow.appendChild(toolbar);
      for (const el of [toolbar, ...toolbar.querySelectorAll('*')]) {
        el.addEventListener?.('pointerdown', (e) => e.stopPropagation());
        el.addEventListener?.('mousedown', (e) => e.stopPropagation());
        el.addEventListener?.('dblclick', (e) => e.stopPropagation());
      }
      toolbar.querySelector('[data-action="current"]').addEventListener('click', (e) => { e.stopPropagation(); downloadOne(MME.getCurrentMedia()); });
      toolbar.querySelector('[data-action="all"]').addEventListener('click', (e) => {
        e.stopPropagation();
        if (MME.state.settings.quickAllAction === 'download') downloadMany(selectedMedia(MME.state.listing, MME.state.settings));
        else MME.openPrepareModal();
      });
    } else shadow = host.shadowRoot;

    function findStableAnchor() {
      const media = MME.findMainMediaElement?.();
      let root = MME.findGalleryRoot?.();
      const currentRoot = MME.state.galleryAnchor;
      // Image zoom on Mercado Livre can create/move a large cloned image under the mouse.
      // Keep the already mounted gallery root while it is valid; only switch anchors for
      // a real video viewer or when the previous gallery was removed from the DOM.
      if (currentRoot?.isConnected && media?.tagName !== 'VIDEO') {
        const r = currentRoot.getBoundingClientRect();
        if (r.width >= 180 && r.height >= 180) root = currentRoot;
      }
      if (!media || !root) return null;
      let node = root;
      let positioned = null;
      for (let i = 0; node && node !== document.body && i < 5; i++, node = node.parentElement) {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        if (rect.width < 180 || rect.height < 180) continue;
        if (style.position !== 'static' && style.transform === 'none') { positioned = node; break; }
      }
      return { media, root, positioned };
    }

    const syncAnchor = () => {
      const found = findStableAnchor();
      if (!found || !MME.state.listing) { host.style.display = 'none'; return; }
      const { root, positioned } = found;
      const rootRect = root.getBoundingClientRect();
      if (rootRect.width < 180 || rootRect.height < 180) { host.style.display = 'none'; return; }
      host.style.display = 'block';

      if (positioned) {
        if (host.parentElement !== positioned) positioned.appendChild(host);
        const a = positioned.getBoundingClientRect();
        host.style.position = 'absolute';
        host.style.left = 'auto';
        host.style.bottom = 'auto';
        host.style.right = `${Math.max(10, a.right - rootRect.right + 12)}px`;
        host.style.top = `${Math.max(10, rootRect.top - a.top + 12)}px`;
      } else {
        if (host.parentElement !== document.documentElement) document.documentElement.appendChild(host);
        host.style.position = 'fixed';
        host.style.left = 'auto';
        host.style.bottom = 'auto';
        host.style.right = `${Math.max(10, innerWidth - rootRect.right + 12)}px`;
        host.style.top = `${Math.max(10, rootRect.top + 12)}px`;
      }
      MME.state.galleryAnchor = root;
    };

    MME.syncGalleryControlsAnchor = syncAnchor;
    MME.repositionGalleryControls = syncAnchor; // backwards compatibility with bootstrap v0.1 calls
    if (!MME.state.galleryViewportListeners) {
      MME.state.galleryViewportListeners = true;
      addEventListener('scroll', () => MME.syncGalleryControlsAnchor?.(), { passive: true });
      addEventListener('resize', () => MME.syncGalleryControlsAnchor?.(), { passive: true });
      visualViewport?.addEventListener?.('resize', () => MME.syncGalleryControlsAnchor?.(), { passive: true });
      visualViewport?.addEventListener?.('scroll', () => MME.syncGalleryControlsAnchor?.(), { passive: true });
    }
    syncAnchor();
    MME.refreshControls?.();
  }

  function cleanupThumbnailControls() {
    for (const host of document.querySelectorAll('[data-mme-thumbnail-control]')) host.remove();
    for (const el of document.querySelectorAll('[data-mme-thumb-wrapper]')) el.removeAttribute('data-mme-thumb-wrapper');
    for (const el of document.querySelectorAll('[data-mme-thumb-position-patched]')) {
      const original = el.getAttribute('data-mme-thumb-original-position') || '';
      el.style.position = original;
      el.removeAttribute('data-mme-thumb-position-patched');
      el.removeAttribute('data-mme-thumb-original-position');
    }
    document.getElementById('mme-thumbnail-page-style')?.remove();
  }

  function installThumbnailControls() {
    if (!MME.state.settings.thumbnailControls || !MME.state.listing) {
      cleanupThumbnailControls();
      MME.syncThumbnailControls = null;
      return;
    }

    if (!document.getElementById('mme-thumbnail-page-style')) {
      const pageStyle = document.createElement('style');
      pageStyle.id = 'mme-thumbnail-page-style';
      pageStyle.textContent = `
        [data-mme-thumb-wrapper] > [data-mme-thumbnail-control]{opacity:0!important;transform:translateY(2px) scale(.96);transition:opacity .14s ease,transform .16s ease!important}
        [data-mme-thumb-wrapper]:hover > [data-mme-thumbnail-control],
        [data-mme-thumbnail-control]:focus-within{opacity:1!important;transform:translateY(0) scale(1)}
        @media (hover:none),(pointer:coarse){[data-mme-thumb-wrapper] > [data-mme-thumbnail-control]{opacity:1!important;transform:none}}
        @media (prefers-reduced-motion:reduce){[data-mme-thumb-wrapper] > [data-mme-thumbnail-control]{transition:none!important;transform:none!important}}
      `;
      (document.head || document.documentElement).appendChild(pageStyle);
    }

    function candidateImages() {
      const root = MME.findGalleryRoot?.();
      const set = new Set();
      if (!root) return [];

      // The thumbnail rail can be a sibling of the main gallery. Search only a small
      // neighborhood around the gallery to avoid controls in recommendations.
      const scopes = [root];
      let parent = root.parentElement;
      for (let depth = 0; parent && parent !== document.body && depth < 2; depth++, parent = parent.parentElement) {
        const rect = parent.getBoundingClientRect();
        if (rect.width <= innerWidth * 1.15 && rect.height <= Math.max(innerHeight * 1.6, 900)) scopes.push(parent);
      }
      for (const scope of scopes) {
        for (const img of scope.querySelectorAll('img')) set.add(img);
      }
      return [...set];
    }

    function chooseWrapper(img) {
      const media = MME.mediaForElement?.(img);
      if (!media) return null;
      const imgRect = img.getBoundingClientRect();
      if (imgRect.width < 28 || imgRect.height < 28 || imgRect.width > 180 || imgRect.height > 180) return null;
      if (imgRect.bottom <= 0 || imgRect.top >= innerHeight || imgRect.right <= 0 || imgRect.left >= innerWidth) return null;

      let wrapper = img.closest('button,a,[role="button"],li') || img.parentElement;
      if (!wrapper || wrapper.closest?.('[id^="mme-"]')) return null;
      const rect = wrapper.getBoundingClientRect();
      if (rect.width < 28 || rect.height < 28 || rect.width > 220 || rect.height > 220) wrapper = img.parentElement;
      if (!wrapper) return null;
      return { wrapper, media };
    }

    function addControl(wrapper, media) {
      const existing = [...wrapper.children].find((child) => child?.hasAttribute?.('data-mme-thumbnail-control'));
      if (existing) {
        existing.dataset.mediaId = media.id;
        return;
      }

      if (getComputedStyle(wrapper).position === 'static') {
        wrapper.setAttribute('data-mme-thumb-position-patched', '1');
        wrapper.setAttribute('data-mme-thumb-original-position', wrapper.style.position || '');
        wrapper.style.position = 'relative';
      }

      wrapper.setAttribute('data-mme-thumb-wrapper', '1');
      const host = document.createElement('span');
      host.setAttribute('data-mme-thumbnail-control', '1');
      host.dataset.mediaId = media.id;
      host.style.cssText = 'position:absolute;top:5px;right:5px;z-index:20;display:block;line-height:1;pointer-events:auto;';
      const shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = UI_CSS;
      const button = document.createElement('span');
      button.className = 'thumb-download';
      button.setAttribute('role', 'button');
      button.setAttribute('tabindex', '0');
      button.setAttribute('aria-disabled', 'false');
      button.title = media.type === 'video' ? 'Baixar este vídeo' : 'Baixar esta imagem';
      button.setAttribute('aria-label', button.title);
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 19h14"></path></svg>';
      shadow.append(style, button);

      const stop = (e) => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation?.(); };
      for (const type of ['pointerdown', 'mousedown', 'dblclick']) host.addEventListener(type, stop, true);
      const runDownload = async (e) => {
        stop(e);
        const current = MME.state.listing?.media.find((m) => m.id === host.dataset.mediaId) || media;
        if (!current || MME.state.downloading.has(current.id) || button.getAttribute('aria-disabled') === 'true') return;
        button.setAttribute('aria-disabled', 'true');
        button.classList.add('busy');
        button.textContent = '…';
        try { await downloadOne(current); }
        finally {
          button.setAttribute('aria-disabled', 'false');
          button.classList.remove('busy');
          button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11"></path><path d="m8 10 4 4 4-4"></path><path d="M5 19h14"></path></svg>';
        }
      };
      button.addEventListener('click', runDownload, true);
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') runDownload(e);
      }, true);

      wrapper.appendChild(host);
    }

    const sync = () => {
      if (!MME.state.settings.thumbnailControls) {
        cleanupThumbnailControls();
        return;
      }
      const seen = new Set();
      for (const img of candidateImages()) {
        const result = chooseWrapper(img);
        if (!result) continue;
        const { wrapper, media } = result;
        if (seen.has(wrapper)) continue;
        seen.add(wrapper);
        addControl(wrapper, media);
      }

      for (const host of document.querySelectorAll('[data-mme-thumbnail-control]')) {
        const wrapper = host.parentElement;
        const mediaId = host.dataset.mediaId;
        if (!wrapper?.isConnected || !MME.state.listing?.media.some((m) => m.id === mediaId)) host.remove();
      }
    };

    MME.syncThumbnailControls = sync;
    sync();
  }

  const FLOAT_TRANSITION_MS = 230;

  function removeFloatingButtonAnimated() {
    const host = document.getElementById('mme-floating-host');
    if (!host) return;
    const wrap = host.shadowRoot?.querySelector('.float');
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    clearTimeout(MME.state.floatRemovalTimer);
    MME.state.floatRemovalTimer = null;
    if (!wrap || reduced) {
      host.remove();
      return;
    }
    wrap.classList.remove('open');
    wrap.classList.add('is-exiting');
    MME.state.floatRemovalTimer = setTimeout(() => {
      if (host.isConnected && !MME.state.settings.floatingButton) host.remove();
      MME.state.floatRemovalTimer = null;
    }, FLOAT_TRANSITION_MS);
  }

  function installFloatingButton() {
    if (!MME.state.settings.floatingButton) {
      removeFloatingButtonAnimated();
      return;
    }

    clearTimeout(MME.state.floatRemovalTimer);
    MME.state.floatRemovalTimer = null;

    const { host, shadow } = createShadowHost(
      'mme-floating-host',
      'position:fixed;right:18px;bottom:20px;z-index:2147483646;'
    );

    let wrap = shadow.querySelector('.float');
    if (wrap) {
      wrap.classList.remove('is-exiting');
      return;
    }

    wrap = document.createElement('div');
    wrap.className = 'float';
    wrap.innerHTML = `
      <div class="float-menu" aria-hidden="true">
        <button class="menu-btn" data-action="prepare">
          <span class="menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 20h14"></path></svg></span>
          <span class="menu-copy"><span class="menu-text">Preparar download</span><span class="menu-sub">Revisar nome, formatos e seleção</span></span>
        </button>
        <button class="menu-btn" data-action="all">
          <span class="menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="10" height="12" rx="2"></rect><path d="M14 9h3a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-1"></path></svg></span>
          <span class="menu-copy"><span class="menu-text">Baixar tudo agora</span><span class="menu-sub">Todas as mídias do anúncio</span></span>
        </button>
        <button class="menu-btn" data-action="current">
          <span class="menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><rect x="4" y="18" width="16" height="3" rx="1.5"></rect></svg></span>
          <span class="menu-copy"><span class="menu-text">Baixar esta mídia</span><span class="menu-sub">Somente a foto ou vídeo atual</span></span>
        </button>
        <div class="menu-sep"></div>
        <button class="menu-btn" data-action="options">
          <span class="menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v3"></path><path d="M12 18v3"></path><path d="M3 12h3"></path><path d="M18 12h3"></path><path d="m5.64 5.64 2.12 2.12"></path><path d="m16.24 16.24 2.12 2.12"></path><path d="m16.24 7.76 2.12-2.12"></path><path d="m5.64 18.36 2.12-2.12"></path><circle cx="12" cy="12" r="3"></circle></svg></span>
          <span class="menu-copy"><span class="menu-text">Configurações</span><span class="menu-sub">Preferências da extensão</span></span>
        </button>
        <button class="menu-btn" data-action="about">
          <span class="menu-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v6"></path><path d="M12 7h.01"></path></svg></span>
          <span class="menu-copy"><span class="menu-text">Sobre</span><span class="menu-sub">Projeto, versão e links</span></span>
        </button>
      </div>
      <button class="float-main" title="Marketplace Media Extractor" aria-label="Abrir menu do Marketplace Media Extractor" aria-expanded="false"><img src="${BRAND_ICON_URL}" alt=""></button>
    `;
    shadow.appendChild(wrap);

    const menu = wrap.querySelector('.float-menu');
    const main = wrap.querySelector('.float-main');
    const setOpen = (open) => {
      wrap.classList.toggle('open', open);
      main.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    };
    const closeMenu = () => setOpen(false);

    main.addEventListener('click', (event) => {
      event.stopPropagation();
      setOpen(!wrap.classList.contains('open'));
    });
    wrap.querySelector('[data-action="prepare"]').addEventListener('click', () => { closeMenu(); MME.openPrepareModal(); });
    wrap.querySelector('[data-action="all"]').addEventListener('click', () => { closeMenu(); downloadMany(selectedMedia(MME.state.listing, MME.state.settings)); });
    wrap.querySelector('[data-action="current"]').addEventListener('click', () => { closeMenu(); downloadOne(MME.getCurrentMedia()); });
    wrap.querySelector('[data-action="options"]').addEventListener('click', () => { closeMenu(); MME.openSettingsModal?.('interface'); });
    wrap.querySelector('[data-action="about"]').addEventListener('click', () => { closeMenu(); MME.openSettingsModal?.('about'); });

    document.addEventListener('click', (event) => {
      const path = event.composedPath?.() || [];
      if (!path.includes(host)) closeMenu();
    }, true);

    shadow.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && wrap.classList.contains('open')) {
        closeMenu();
        main.focus();
      }
    });

  }

  function settingsModalCss() {
    return `
      :host{all:initial;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827}
      *{box-sizing:border-box}button,input,select{font:inherit}
      .backdrop{position:fixed;inset:0;background:rgba(15,23,42,.50);display:grid;place-items:center;padding:18px;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);opacity:0;pointer-events:none;transition:opacity .18s ease}
      .settings-modal{position:relative;width:min(780px,96vw);max-height:min(760px,94vh);background:#fff;border:1px solid rgba(15,23,42,.08);border-radius:20px;box-shadow:0 28px 90px rgba(0,0,0,.34);overflow:hidden;display:flex;flex-direction:column;opacity:0;transform:translateY(10px) scale(.985);transform-origin:50% 45%;transition:opacity .18s ease,transform .22s cubic-bezier(.2,.8,.2,1)}
      .backdrop.is-open{opacity:1;pointer-events:auto}.backdrop.is-open .settings-modal{opacity:1;transform:translateY(0) scale(1)}.backdrop.is-closing{pointer-events:none}
      .settings-header{display:flex;align-items:center;justify-content:space-between;padding:17px 20px 14px;border-bottom:1px solid #e5e7eb;background:linear-gradient(#fff,#fcfcfd)}
      .settings-title{display:flex;align-items:center;gap:11px}.settings-mark{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;overflow:hidden}.settings-mark img{width:34px;height:34px;display:block;border-radius:11px}.settings-title h2{margin:0;font-size:18px;line-height:1.2}.settings-title p{margin:3px 0 0;color:#6b7280;font-size:11px}
      .close{width:34px;height:34px;border:0;border-radius:10px;background:#f3f4f6;color:#374151;cursor:pointer;font-size:20px;line-height:1}.close:hover{background:#e5e7eb}
      .tabs{display:flex;gap:5px;padding:10px 14px;border-bottom:1px solid #e5e7eb;background:#fafafa;overflow:auto;scrollbar-width:thin}
      .tab{white-space:nowrap;border:0;border-radius:9px;background:transparent;color:#4b5563;padding:8px 10px;font-size:12px;font-weight:750;cursor:pointer}.tab:hover{background:#f1f5f9;color:#111827}.tab.active{background:#172554;color:#fff}
      .content{padding:19px 22px 22px;overflow:auto;min-height:360px;display:grid;align-items:start;min-width:0}.panel{grid-area:1/1;display:block;visibility:hidden;opacity:0;pointer-events:none;min-width:0}.panel.active{visibility:visible;opacity:1;pointer-events:auto}.panel-title{font-size:16px;margin:0 0 4px}.panel-sub{font-size:12px;color:#6b7280;margin:0 0 18px}
      .section{display:grid;gap:13px}.field{display:grid;gap:7px}.field>label,.field-label{font-size:11px;font-weight:800;color:#4b5563;text-transform:uppercase;letter-spacing:.045em}
      input[type="text"],select{width:100%;border:1px solid #d1d5db;border-radius:10px;padding:10px 11px;background:#fff;color:#111827;outline:none}input[type="text"]:focus,select:focus{border-color:#64748b;box-shadow:0 0 0 3px rgba(100,116,139,.13)}
      input[type="range"]{width:100%;accent-color:#172554}.range-row{display:grid;grid-template-columns:1fr 48px;align-items:center;gap:12px}.range-value{text-align:center;font-weight:800;font-size:12px;color:#172554;background:#eef2ff;border-radius:8px;padding:6px 5px}
      .check-card{display:flex;align-items:flex-start;gap:10px;padding:11px 12px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer}.check-card:hover{background:#fafafa}.check-card input{margin:2px 0 0;width:17px;height:17px;accent-color:#172554}.check-copy{display:grid;gap:2px}.check-title{font-size:13px;font-weight:760;color:#111827}.check-desc{font-size:11px;line-height:1.45;color:#6b7280}
      .hint{font-size:11px;line-height:1.5;color:#6b7280}.hint code,.code-chip{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:#f3f4f6;color:#374151;border-radius:6px;padding:2px 5px}.variables{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.code-chip{font-size:10px;border:1px solid #e5e7eb;background:#fafafa}
      .about-card{border:1px solid #e5e7eb;border-radius:15px;padding:16px;background:linear-gradient(145deg,#fff,#f8fafc);display:grid;gap:13px}.about-head{display:flex;gap:12px;align-items:center}.about-icon{width:48px;height:48px;border-radius:15px;display:grid;place-items:center;overflow:hidden}.about-icon img{width:48px;height:48px;display:block;border-radius:15px}.about-name{font-size:16px;font-weight:850}.about-version{font-size:11px;color:#6b7280;margin-top:2px}.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.about-item{padding:10px 11px;background:#fff;border:1px solid #e5e7eb;border-radius:10px}.about-item strong{display:block;font-size:11px;color:#374151;margin-bottom:2px}.about-item span{font-size:11px;color:#6b7280}.about-links{display:flex;flex-wrap:wrap;gap:8px}.about-link{display:inline-flex;align-items:center;gap:6px;padding:8px 10px;border:1px solid #e5e7eb;border-radius:10px;background:#fff;color:#1d4ed8;text-decoration:none;font-size:11px;font-weight:750}.about-link:hover{background:#f8fafc;border-color:#cbd5e1}
      .footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 18px;border-top:1px solid #e5e7eb;background:#fafafa}.footer-right{display:flex;gap:8px}.btn{border:0;border-radius:10px;padding:9px 13px;font-size:12px;font-weight:780;cursor:pointer}.btn.secondary{background:#fff;color:#111827;border:1px solid #d1d5db}.btn.secondary:hover{background:#f9fafb}.btn.primary{background:#e85d04;color:#fff}.btn.primary:hover{filter:brightness(1.04)}.btn.ghost{background:transparent;color:#6b7280}.btn.ghost:hover{background:#f1f5f9;color:#111827}
      .settings-flash{position:absolute;left:50%;top:70px;z-index:10;transform:translate(-50%,-8px) scale(.98);min-width:220px;max-width:80%;padding:10px 14px;border-radius:12px;background:#111827;color:#fff;box-shadow:0 14px 38px rgba(15,23,42,.28);font-size:12px;font-weight:720;text-align:center;opacity:0;pointer-events:none;transition:opacity .22s ease,transform .22s ease}.settings-flash.show{opacity:1;transform:translate(-50%,0) scale(1)}.settings-flash.success{background:#067647}.settings-flash.info{background:#172554}
      @media(max-width:640px){.backdrop{padding:7px}.settings-modal{width:100%;max-height:97vh;border-radius:16px}.content{padding:16px;min-height:330px}.tabs{padding:8px}.footer{align-items:stretch;flex-direction:column}.footer-right{justify-content:flex-end}.about-grid{grid-template-columns:1fr}}
      @media(prefers-reduced-motion:reduce){.backdrop,.settings-modal,.settings-flash{transition:none}.settings-modal{transform:none}}
    `;
  }

  MME.openSettingsModal = async (initialTab = 'interface') => {
    await MME.loadSettings();
    document.getElementById('mme-settings-host')?.remove();

    const host = document.createElement('div');
    host.id = 'mme-settings-host';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;';
    const shadow = host.attachShadow({ mode: 'open' });
    const version = chrome.runtime.getManifest().version;
    shadow.innerHTML = `<style>${settingsModalCss()}</style>
      <div class="backdrop">
        <div class="settings-modal" role="dialog" aria-modal="true" aria-label="Configurações do Marketplace Media Extractor">
          <div class="settings-flash" id="settingsFlash" role="status" aria-live="polite"></div>
          <div class="settings-header">
            <div class="settings-title"><div class="settings-mark"><img src="${BRAND_ICON_URL}" alt=""></div><div><h2>Configurações</h2><p>Marketplace Media Extractor · v${MME.escapeHtml(version)}</p></div></div>
            <button class="close" type="button" title="Fechar" aria-label="Fechar">×</button>
          </div>
          <nav class="tabs" aria-label="Seções das configurações">
            <button class="tab active" type="button" data-tab="interface">Interface</button>
            <button class="tab" type="button" data-tab="images">Imagens</button>
            <button class="tab" type="button" data-tab="naming">Nomes e organização</button>
            <button class="tab" type="button" data-tab="videos">Vídeos</button>
            <button class="tab" type="button" data-tab="downloads">Downloads</button>
            <button class="tab" type="button" data-tab="about">Sobre</button>
          </nav>
          <div class="content">
            <section class="panel active" data-panel="interface">
              <h3 class="panel-title">Interface na página</h3><p class="panel-sub">Escolha quais atalhos aparecem sobre o anúncio do Mercado Livre.</p>
              <div class="section">
                <label class="check-card"><input id="settings-galleryControls" type="checkbox"><span class="check-copy"><span class="check-title">Controles sobre a mídia principal</span><span class="check-desc">Exibe o download da mídia atual e o atalho para baixar todas as mídias junto à galeria.</span></span></label>
                <label class="check-card"><input id="settings-thumbnailControls" type="checkbox"><span class="check-copy"><span class="check-title">Controles nas miniaturas</span><span class="check-desc">Exibe um pequeno botão de download nas miniaturas reconhecidas da galeria.</span></span></label>
                <label class="check-card"><input id="settings-floatingButton" type="checkbox"><span class="check-copy"><span class="check-title">Botão flutuante</span><span class="check-desc">Mantém o menu rápido da extensão no canto da página. Mesmo desativado, as configurações podem ser abertas pelo ícone da extensão no Chrome.</span></span></label>
                <div class="field"><label for="settings-quickAllAction">Ação de “Baixar tudo”</label><select id="settings-quickAllAction"><option value="prepare">Abrir Preparar download</option><option value="download">Baixar imediatamente</option></select></div>
              </div>
            </section>
            <section class="panel" data-panel="images">
              <h3 class="panel-title">Imagens</h3><p class="panel-sub">Formato de saída e qualidade usada nas conversões.</p>
              <div class="section">
                <div class="field"><label for="settings-imageFormat">Formato padrão</label><select id="settings-imageFormat"><option value="original">Original</option><option value="jpeg">JPEG</option><option value="png">PNG</option><option value="webp">WebP</option></select></div>
                <div class="field"><label for="settings-jpegQuality">Qualidade JPEG</label><div class="range-row"><input id="settings-jpegQuality" type="range" min="70" max="100" step="1"><span class="range-value" id="settings-jpegQualityLabel">95%</span></div><div class="hint">Só é aplicada quando a saída escolhida é JPEG.</div></div>
              </div>
            </section>
            <section class="panel" data-panel="naming">
              <h3 class="panel-title">Nomes e organização</h3><p class="panel-sub">Defina a pasta e os padrões usados para nomear cada tipo de mídia.</p>
              <div class="section">
                <div class="field"><label for="settings-folderTemplate">Pasta</label><input id="settings-folderTemplate" type="text"><div class="hint">Padrão: <code>{produto}</code></div></div>
                <div class="field"><label for="settings-imageTemplate">Imagens</label><input id="settings-imageTemplate" type="text"><div class="hint">Padrão: <code>{produto}-{numero_imagem:02}</code></div></div>
                <div class="field"><label for="settings-videoTemplate">Vídeos</label><input id="settings-videoTemplate" type="text"><div class="hint">Padrão: <code>{produto}-video-{numero_video:02}</code></div></div>
                <div class="field"><label for="settings-posterTemplate">Capas de vídeo</label><input id="settings-posterTemplate" type="text"><div class="hint">Padrão: <code>{produto}-video-{numero_video:02}-capa</code></div></div>
                <div><div class="field-label">Variáveis disponíveis</div><div class="variables"><span class="code-chip">{produto}</span><span class="code-chip">{titulo_anuncio}</span><span class="code-chip">{item_id}</span><span class="code-chip">{catalog_id}</span><span class="code-chip">{numero_imagem:02}</span><span class="code-chip">{numero_video:02}</span><span class="code-chip">{tipo}</span><span class="code-chip">{data}</span></div></div>
              </div>
            </section>
            <section class="panel" data-panel="videos">
              <h3 class="panel-title">Vídeos</h3><p class="panel-sub">Controle o que entra nos downloads em lote.</p>
              <div class="section">
                <label class="check-card"><input id="settings-includeVideos" type="checkbox"><span class="check-copy"><span class="check-title">Incluir vídeos em “Baixar tudo”</span><span class="check-desc">Inclui Clips suportados junto com as imagens selecionadas.</span></span></label>
                <label class="check-card"><input id="settings-includeVideoPosters" type="checkbox"><span class="check-copy"><span class="check-title">Incluir capas/posters por padrão</span><span class="check-desc">Quando uma capa de vídeo for detectada, ela também será selecionada nos lotes.</span></span></label>
                <div class="hint">Nesta versão, MP4/WebM direto e HLS MPEG-TS são suportados. HLS MPEG-TS é reunido em um arquivo <code>.ts</code>.</div>
                <div class="field"><div class="field-label">Avançado</div><button class="btn secondary" id="settingsVideoDiagnostics" type="button">Abrir diagnóstico de vídeo</button></div>
              </div>
            </section>
            <section class="panel" data-panel="downloads">
              <h3 class="panel-title">Downloads</h3><p class="panel-sub">Preferências do comportamento ao salvar arquivos.</p>
              <div class="section">
                <label class="check-card"><input id="settings-singleSaveAs" type="checkbox"><span class="check-copy"><span class="check-title">Usar “Salvar como” no download individual</span><span class="check-desc">Ao baixar somente uma mídia, abre o seletor de destino do Chrome em vez de salvar automaticamente.</span></span></label>
                <div class="field"><label for="settings-downloadConcurrency">Downloads de imagens simultâneos</label><select id="settings-downloadConcurrency"><option value="auto">Automático (recomendado)</option><option value="1">1</option><option value="2">2</option><option value="4">4</option><option value="6">6</option><option value="8">8</option></select><div class="hint">Controla quantas imagens podem passar pelo pipeline de resolução, processamento e download ao mesmo tempo. O modo automático usa de 2 a 6 conforme o dispositivo.</div></div>
                <div class="field"><label for="settings-conversionConcurrency">Conversões simultâneas</label><select id="settings-conversionConcurrency"><option value="auto">Automático (recomendado)</option><option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option></select><div class="hint">Limita conversões JPEG/PNG/WebP em paralelo para evitar consumo excessivo de memória.</div></div>
              </div>
            </section>
            <section class="panel" data-panel="about">
              <h3 class="panel-title">Sobre</h3><p class="panel-sub">Informações sobre a extensão e o processamento das mídias.</p>
              <div class="about-card">
                <div class="about-head"><div class="about-icon"><img src="${BRAND_ICON_URL}" alt=""></div><div><div class="about-name">Marketplace Media Extractor</div><div class="about-version">Versão ${MME.escapeHtml(version)} · Manifest V3</div></div></div>
                <div class="about-grid">
                  <div class="about-item"><strong>Marketplace atual</strong><span>Mercado Livre</span></div>
                  <div class="about-item"><strong>Processamento</strong><span>Local no navegador, sem backend próprio</span></div>
                  <div class="about-item"><strong>Imagens</strong><span>Original, JPEG, PNG e WebP</span></div>
                  <div class="about-item"><strong>Vídeos</strong><span>MP4/WebM direto e HLS MPEG-TS</span></div>
                </div>
                <div class="hint">A extensão procura a melhor mídia disponível no anúncio e mantém as preferências no armazenamento local do Chrome.</div>
                <div class="about-links">
                  <a class="about-link" href="https://github.com/ehstbr/marketplace-media-extractor" target="_blank" rel="noreferrer">GitHub</a>
                  <a class="about-link" href="https://eduhcommerce.com.br" target="_blank" rel="noreferrer">eduhcommerce.com.br</a>
                  <a class="about-link" href="https://instagram.com/eduhcommmerce" target="_blank" rel="noreferrer">@eduhcommmerce</a>
                </div>
              </div>
            </section>
          </div>
          <div class="footer"><button class="btn ghost" id="settingsReset" type="button">Restaurar padrões</button><div class="footer-right"><button class="btn secondary" id="settingsClose" type="button">Fechar</button><button class="btn primary" id="settingsSave" type="button">Salvar configurações</button></div></div>
        </div>
      </div>`;
    document.documentElement.appendChild(host);
    openAnimatedModal(shadow);

    const $ = (selector) => shadow.querySelector(selector);
    const settingKeys = Object.keys(MME.defaults);
    let flashTimer = null;

    const flash = (message, kind = 'success') => {
      const el = $('#settingsFlash');
      if (!el) return;
      clearTimeout(flashTimer);
      el.textContent = message;
      el.className = `settings-flash ${kind}`;
      requestAnimationFrame(() => el.classList.add('show'));
      flashTimer = setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => { if (!el.classList.contains('show')) el.textContent = ''; }, 240);
      }, 2600);
    };

    const field = (key) => $(`#settings-${key}`);
    const applyToForm = (data) => {
      for (const key of settingKeys) {
        const el = field(key);
        if (!el) continue;
        const value = Object.prototype.hasOwnProperty.call(data, key) ? data[key] : MME.defaults[key];
        if (el.type === 'checkbox') el.checked = Boolean(value);
        else if (key === 'jpegQuality') el.value = Math.round(Number(value) * 100);
        else el.value = value ?? '';
      }
      const q = field('jpegQuality');
      const qLabel = $('#settings-jpegQualityLabel');
      if (q && qLabel) qLabel.textContent = `${q.value}%`;
    };
    const collect = () => {
      const data = {};
      for (const key of settingKeys) {
        const el = field(key);
        if (!el) continue;
        data[key] = el.type === 'checkbox' ? el.checked : key === 'jpegQuality' ? Number(el.value) / 100 : el.value;
      }
      return data;
    };

    applyToForm(MME.state.settings);

    const activateTab = (name) => {
      const wanted = shadow.querySelector(`.tab[data-tab="${name}"]`) || shadow.querySelector('.tab[data-tab="interface"]');
      if (!wanted) return;
      for (const item of shadow.querySelectorAll('.tab')) item.classList.toggle('active', item === wanted);
      for (const panel of shadow.querySelectorAll('.panel')) panel.classList.toggle('active', panel.dataset.panel === wanted.dataset.tab);
    };
    for (const tab of shadow.querySelectorAll('.tab')) {
      tab.addEventListener('click', () => activateTab(tab.dataset.tab));
    }
    activateTab(initialTab);

    field('jpegQuality')?.addEventListener('input', () => {
      const label = $('#settings-jpegQualityLabel');
      if (label) label.textContent = `${field('jpegQuality').value}%`;
    });

    const close = () => closeAnimatedModal(host, shadow);
    $('.close')?.addEventListener('click', close);
    $('#settingsClose')?.addEventListener('click', close);
    shadow.querySelector('.backdrop')?.addEventListener('click', (e) => { if (e.target.classList.contains('backdrop')) close(); });
    shadow.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    $('#settingsVideoDiagnostics')?.addEventListener('click', () => { close(); setTimeout(() => MME.openDiagnostics?.(), 240); });

    $('#settingsSave')?.addEventListener('click', async () => {
      const data = collect();
      await chrome.storage.local.set(data);
      MME.state.settings = { ...MME.defaults, ...data };
      MME.installUI?.();
      MME.syncGalleryControlsAnchor?.();
      MME.syncThumbnailControls?.();
      MME.refreshControls?.();
      flash('Configurações salvas.', 'success');
    });

    $('#settingsReset')?.addEventListener('click', async () => {
      await chrome.storage.local.remove(settingKeys);
      await chrome.storage.local.set(MME.defaults);
      MME.state.settings = { ...MME.defaults };
      applyToForm(MME.defaults);
      MME.installUI?.();
      MME.syncGalleryControlsAnchor?.();
      MME.syncThumbnailControls?.();
      MME.refreshControls?.();
      flash('Padrões restaurados.', 'info');
    });
  };

  function modalCss() {
    return `
      :host{all:initial;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111827}
      *{box-sizing:border-box} button,input,select{font:inherit}
      .backdrop{position:fixed;inset:0;background:rgba(15,23,42,.48);display:grid;place-items:center;padding:24px;opacity:0;pointer-events:none;transition:opacity .18s ease}
      .modal{width:min(980px,96vw);max-height:92vh;background:#fff;border-radius:18px;box-shadow:0 28px 80px rgba(0,0,0,.32);overflow:hidden;display:flex;flex-direction:column;opacity:0;transform:translateY(12px) scale(.985);transform-origin:50% 45%;transition:opacity .18s ease,transform .22s cubic-bezier(.2,.8,.2,1)}
      .backdrop.is-open{opacity:1;pointer-events:auto}.backdrop.is-open .modal{opacity:1;transform:translateY(0) scale(1)}.backdrop.is-closing{pointer-events:none}
      .header{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid #e5e7eb}
      .header h2{font-size:19px;margin:0}.close{border:0;background:#f3f4f6;width:34px;height:34px;border-radius:10px;cursor:pointer;font-size:20px}
      .body{padding:18px 22px;overflow:auto;display:grid;gap:18px}
      .field{display:grid;gap:7px}.field label{font-size:12px;font-weight:800;color:#4b5563;text-transform:uppercase;letter-spacing:.04em}
      input,select{border:1px solid #d1d5db;border-radius:10px;padding:10px 11px;outline:none;width:100%;background:#fff;color:#111827}
      input:focus,select:focus{border-color:#64748b;box-shadow:0 0 0 3px rgba(100,116,139,.14)}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.row{display:flex;gap:9px;align-items:center;flex-wrap:wrap}
      .tokens{display:flex;gap:6px;flex-wrap:wrap}.token{border:1px solid #d1d5db;background:#f9fafb;border-radius:999px;padding:6px 9px;font-size:11px;cursor:pointer}
      .media{border:1px solid #e5e7eb;border-radius:13px;overflow:hidden}.media-head{display:flex;justify-content:space-between;padding:10px 12px;background:#f8fafc;font-weight:750;font-size:13px}
      .media-list{max-height:240px;overflow:auto}.media-row{display:grid;grid-template-columns:24px 46px 1fr auto;align-items:center;gap:10px;padding:9px 12px;border-top:1px solid #f0f1f3;font-size:12px}
      .thumb{width:44px;height:44px;border-radius:8px;object-fit:cover;background:#e5e7eb}.kind{font-weight:800}.muted{color:#6b7280}
      .preview{background:#111827;color:#e5e7eb;border-radius:12px;padding:12px;max-height:170px;overflow:auto;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}.preview div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .footer{display:flex;justify-content:space-between;align-items:center;padding:15px 22px;border-top:1px solid #e5e7eb;background:#fafafa}.summary{font-size:12px;color:#4b5563}
      .actions{display:flex;gap:9px}.btn{border:0;border-radius:10px;padding:10px 14px;cursor:pointer;font-weight:750}.btn.secondary{border:1px solid #d1d5db;background:#fff;color:#111827}.btn.primary{background:#e85d04;color:#fff}
      .seg{display:inline-flex;border:1px solid #d1d5db;border-radius:10px;overflow:hidden}.seg button{border:0;background:#fff;padding:7px 10px;cursor:pointer}.seg button.active{background:#111827;color:#fff}
      .warning{background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;border-radius:10px;padding:9px 11px;font-size:12px}
      @media(max-width:700px){.grid{grid-template-columns:1fr}.modal{width:100%;max-height:96vh}.backdrop{padding:8px}.media-row{grid-template-columns:24px 42px 1fr}.media-row .meta{display:none}}
      @media(prefers-reduced-motion:reduce){.backdrop,.modal{transition:none}.modal{transform:none}}
    `;
  }

  MME.openPrepareModal = async () => {
    await MME.refreshVideoSourcesFromNetwork?.();
    const listing = MME.state.listing;
    if (!listing) return;
    document.getElementById('mme-prepare-host')?.remove();
    const host = document.createElement('div');
    host.id = 'mme-prepare-host';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;';
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${modalCss()}</style><div class="backdrop"><div class="modal">
      <div class="header"><h2>Preparar download</h2><button class="close" title="Fechar">×</button></div>
      <div class="body">
        <div class="field"><label>Nome do produto</label><input id="productName"></div>
        <div class="grid">
          <div class="field"><label>Formato das imagens</label><select id="imageFormat"><option value="original">Original</option><option value="jpeg">JPEG</option><option value="png">PNG</option><option value="webp">WebP</option></select></div>
          <div class="field"><label>Qualidade JPEG</label><input id="quality" type="range" min="70" max="100" step="1"><span id="qualityLabel" class="muted"></span></div>
        </div>
        <div class="field"><label>Pasta</label><input id="folderTemplate"><div class="tokens" data-target="folderTemplate"></div></div>
        <div class="field"><label>Nome das imagens</label><input id="imageTemplate"><div class="tokens" data-target="imageTemplate"></div></div>
        <div class="field"><label>Nome dos vídeos</label><input id="videoTemplate"><div class="tokens" data-target="videoTemplate"></div></div>
        <div class="media">
          <div class="media-head"><span>Mídias encontradas</span><span id="mediaCount"></span></div>
          <div class="media-list" id="mediaList"></div>
        </div>
        <div class="warning" id="streamWarning" hidden>Vídeos HLS MPEG-TS são montados e baixados como .ts nesta versão. DASH, HLS com áudio separado e streams protegidos continuam somente em diagnóstico.</div>
        <div class="field"><label>Prévia dos nomes</label><div class="preview" id="preview"></div></div>
      </div>
      <div class="footer"><div class="summary" id="summary"></div><div class="actions"><button class="btn secondary" id="cancel">Cancelar</button><button class="btn primary" id="download">Baixar selecionados</button></div></div>
    </div></div>`;
    document.documentElement.appendChild(host);
    openAnimatedModal(shadow);

    const $ = (sel) => shadow.querySelector(sel);
    const settings = { ...MME.state.settings };
    $('#productName').value = listing.productName;
    $('#imageFormat').value = settings.imageFormat;
    $('#quality').value = Math.round(settings.jpegQuality * 100);
    $('#qualityLabel').textContent = `${$('#quality').value}%`;
    $('#folderTemplate').value = settings.folderTemplate;
    $('#imageTemplate').value = settings.imageTemplate;
    $('#videoTemplate').value = settings.videoTemplate;

    const tokenDefs = [
      ['Produto', '{produto}'], ['Título original', '{titulo_anuncio}'], ['Item ID', '{item_id}'], ['Catálogo', '{catalog_id}'],
      ['01, 02…', '{numero_imagem:02}'], ['Vídeo 01…', '{numero_video:02}'], ['Tipo', '{tipo}'], ['Data', '{data}']
    ];
    for (const box of shadow.querySelectorAll('.tokens')) {
      const target = box.dataset.target;
      for (const [label, token] of tokenDefs) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'token'; b.textContent = `+ ${label}`;
        b.addEventListener('click', () => {
          const input = $(`#${target}`);
          const start = input.selectionStart ?? input.value.length;
          const end = input.selectionEnd ?? start;
          input.value = input.value.slice(0, start) + token + input.value.slice(end);
          input.focus(); input.setSelectionRange(start + token.length, start + token.length);
          refresh();
        });
        box.appendChild(b);
      }
    }

    const mediaList = $('#mediaList');
    for (const media of listing.media) {
      const row = document.createElement('label');
      row.className = 'media-row';
      const thumb = media.type === 'video' ? (media.posterUrl || '') : media.sourceUrl;
      const stream = media.type === 'video' && !['DIRECT_MP4', 'DIRECT_WEBM', 'HLS'].includes(media.delivery);
      row.innerHTML = `
        <input type="checkbox" data-id="${MME.escapeHtml(media.id)}" ${media.selected !== false ? 'checked' : ''}>
        ${thumb ? `<img class="thumb" src="${MME.escapeHtml(thumb)}">` : `<div class="thumb"></div>`}
        <div><div class="kind">${media.type === 'video' ? 'Vídeo' : media.subtype === 'video_poster' ? 'Capa de vídeo' : 'Imagem'}</div><div class="muted">${media.type === 'video' ? `${media.delivery || 'UNKNOWN'} ${formatDuration(media.duration)}` : `${media.width || '?'}×${media.height || '?'}`}</div></div>
        <div class="meta muted">${stream ? 'Não suportado' : (media.type === 'video' && media.delivery === 'HLS' ? 'HLS → TS' : (media.extension || ''))}</div>`;
      mediaList.appendChild(row);
    }

    function snapshotSettings() {
      return {
        ...settings,
        imageFormat: $('#imageFormat').value,
        jpegQuality: Number($('#quality').value) / 100,
        folderTemplate: $('#folderTemplate').value,
        imageTemplate: $('#imageTemplate').value,
        videoTemplate: $('#videoTemplate').value
      };
    }

    function refresh() {
      listing.productName = $('#productName').value.trim() || listing.originalTitle;
      $('#qualityLabel').textContent = `${$('#quality').value}%`;
      const chosen = listing.media.filter((m) => shadow.querySelector(`input[data-id="${CSS.escape(m.id)}"]`)?.checked);
      const local = snapshotSettings();
      const map = countersForMedia(chosen);
      $('#preview').innerHTML = chosen.map((m) => `<div>${MME.escapeHtml(MME.makeFilename(listing, m, map.get(m.id), local))}</div>`).join('') || '<div>Nenhuma mídia selecionada.</div>';
      const imgCount = chosen.filter((m) => m.type === 'image' && m.subtype !== 'video_poster').length;
      const videoCount = chosen.filter((m) => m.type === 'video').length;
      $('#mediaCount').textContent = `${imgCount} imagem(ns) · ${videoCount} vídeo(s)`;
      $('#summary').textContent = `${chosen.length} arquivo(s) selecionado(s)`;
      $('#streamWarning').hidden = !chosen.some((m) => m.type === 'video' && (!['DIRECT_MP4', 'DIRECT_WEBM', 'HLS'].includes(m.delivery) || m.delivery === 'HLS')); 
    }

    shadow.addEventListener('input', refresh);
    shadow.addEventListener('change', refresh);
    const close = () => closeAnimatedModal(host, shadow);
    $('.close').addEventListener('click', close);
    $('#cancel').addEventListener('click', close);
    shadow.querySelector('.backdrop').addEventListener('click', (e) => { if (e.target.classList.contains('backdrop')) close(); });
    shadow.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    $('#download').addEventListener('click', async () => {
      const chosen = listing.media.filter((m) => shadow.querySelector(`input[data-id="${CSS.escape(m.id)}"]`)?.checked);
      const local = snapshotSettings();
      await chrome.storage.local.set({
        [listing.productNameStorageKey]: listing.productName,
        imageFormat: local.imageFormat,
        jpegQuality: local.jpegQuality,
        folderTemplate: local.folderTemplate,
        imageTemplate: local.imageTemplate,
        videoTemplate: local.videoTemplate
      });
      Object.assign(MME.state.settings, local);
      close();
      downloadMany(chosen, local);
    });
    refresh();
  };

  MME.openDiagnostics = async () => {
    const report = await MME.buildDiagnostics();
    document.getElementById('mme-diagnostics-host')?.remove();
    const host = document.createElement('div');
    host.id = 'mme-diagnostics-host';
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;';
    const shadow = host.attachShadow({ mode: 'open' });
    const text = JSON.stringify(report, null, 2);
    shadow.innerHTML = `<style>${modalCss()}</style><div class="backdrop"><div class="modal" style="width:min(820px,96vw)"><div class="header"><h2>Diagnóstico de vídeo / mídia</h2><button class="close">×</button></div><div class="body"><div class="warning">O diagnóstico agora resolve o HLS e informa variante, quantidade de segmentos, criptografia e tipo de entrega. Se o Clip ainda estiver como UNKNOWN, reproduza-o por alguns segundos e gere novamente.</div><pre class="preview" style="max-height:55vh;white-space:pre-wrap">${MME.escapeHtml(text)}</pre></div><div class="footer"><div class="summary">Nenhum conteúdo é enviado para servidor externo.</div><div class="actions"><button class="btn secondary" id="close">Fechar</button><button class="btn primary" id="copy">Copiar relatório</button></div></div></div></div>`;
    document.documentElement.appendChild(host);
    openAnimatedModal(shadow);
    const close = () => closeAnimatedModal(host, shadow);
    shadow.querySelector('.close').onclick = close;
    shadow.querySelector('#close').onclick = close;
    shadow.querySelector('.backdrop').addEventListener('click', (e) => { if (e.target.classList.contains('backdrop')) close(); });
    shadow.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    shadow.querySelector('#copy').onclick = async () => {
      await navigator.clipboard.writeText(text);
      MME.toast('Relatório copiado.', 'success');
    };
  };

  MME.removeInlineUI = () => {
    document.getElementById('mme-gallery-controls-host')?.remove();
    document.getElementById('mme-floating-host')?.remove();
    document.getElementById('mme-transfer-progress-host')?.remove();
    cleanupThumbnailControls();
    MME.state.galleryAnchor = null;
    MME.syncGalleryControlsAnchor = null;
    MME.repositionGalleryControls = null;
    MME.syncThumbnailControls = null;
  };

  MME.installUI = () => {
    if (!MME.isProductDetailPage?.() || !MME.state.listing) {
      MME.removeInlineUI?.();
      return;
    }
    const installers = [
      ['gallery controls', installGalleryControls],
      ['thumbnail controls', installThumbnailControls],
      ['floating button', installFloatingButton]
    ];
    for (const [name, install] of installers) {
      try { install(); }
      catch (error) { console.error(`[Marketplace Media Extractor] Failed to install ${name}:`, error); }
    }
  };

  MME.refreshControls = () => {
    const shadow = document.getElementById('mme-gallery-controls-host')?.shadowRoot;
    if (shadow) {
      const media = MME.getCurrentMedia();
      const btn = shadow.querySelector('[data-action="current"]');
      if (btn) {
        const busy = media ? MME.state.downloading.has(media.id) : false;
        btn.disabled = !media || busy;
        btn.classList.toggle('busy', busy);
        btn.title = media?.type === 'video' ? 'Baixar este vídeo' : 'Baixar esta imagem';
        const progress = shadow.querySelector('.gallery-progress');
        const p = media ? MME.state.progress.get(media.id) : null;
        if (progress) progress.textContent = p != null ? `${p}%` : '…';
      }
      const all = shadow.querySelector('[data-action="all"]');
      const count = MME.state.listing ? selectedMedia(MME.state.listing, MME.state.settings).length : 0;
      const badge = all?.querySelector('.gallery-count');
      if (badge) badge.textContent = count > 99 ? '99+' : String(count);
      if (all) all.title = `Preparar download de todas as mídias (${count})`;
    }

    for (const host of document.querySelectorAll('[data-mme-thumbnail-control]')) {
      const media = MME.state.listing?.media.find((m) => m.id === host.dataset.mediaId);
      const button = host.shadowRoot?.querySelector('.thumb-download');
      if (!button || !media) continue;
      button.setAttribute('aria-disabled', MME.state.downloading.has(media.id) ? 'true' : 'false');
    }
  };
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === 'OPEN_SETTINGS_MODAL') {
      MME.openSettingsModal?.();
      return;
    }
    if (message?.type === 'MEDIA_PROGRESS') {
      updateDownloadJob(message);
      return;
    }
    if (message?.type !== 'HLS_PROGRESS') return;
    const current = MME.getCurrentMedia?.();
    if (!current || current.type !== 'video') return;
    MME.state.progress.set(current.id, Number(message.percent || 0));
    MME.refreshControls?.();
  });

})();
