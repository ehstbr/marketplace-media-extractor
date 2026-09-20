(() => {
  const MME = globalThis.MME = globalThis.MME || {};

  MME.defaults = {
    imageFormat: 'jpeg',
    jpegQuality: 0.95,
    folderTemplate: '{produto}',
    imageTemplate: '{produto}-{numero_imagem:02}',
    videoTemplate: '{produto}-video-{numero_video:02}',
    posterTemplate: '{produto}-video-{numero_video:02}-capa',
    quickAllAction: 'prepare',
    singleSaveAs: false,
    includeVideos: true,
    includeVideoPosters: false,
    floatingButton: true,
    galleryControls: true,
    thumbnailControls: false,
    downloadConcurrency: 'auto',
    conversionConcurrency: 'auto'
  };

  MME.state = {
    listing: null,
    settings: { ...MME.defaults },
    activeMediaId: null,
    downloading: new Set(),
    lastUrl: location.href,
    observers: [],
    progress: new Map(),
    downloadJobs: new Map(),
    activeBatch: null,
    transferHudTimer: null,
    galleryAnchor: null,
    floatRemovalTimer: null
  };

  MME.loadSettings = async () => {
    const stored = await chrome.storage.local.get(MME.defaults);
    MME.state.settings = { ...MME.defaults, ...stored };
    return MME.state.settings;
  };

  MME.escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  MME.sanitizeSegment = (value) => String(value || '')
    .normalize('NFC')
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/[. ]+$/g, '')
    .trim()
    .slice(0, 150) || 'arquivo';

  MME.slugify = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  MME.formatValue = (value, modifier) => {
    const text = String(value ?? '');
    if (!modifier) return text;
    if (modifier === 'lower') return text.toLowerCase();
    if (modifier === 'upper') return text.toUpperCase();
    if (modifier === 'slug') return MME.slugify(text);
    if (modifier === 'title') return text.toLocaleLowerCase('pt-BR').replace(/(^|\s|[-/])\S/g, (m) => m.toLocaleUpperCase('pt-BR'));
    return text;
  };

  MME.applyTemplate = (template, context) => {
    return String(template || '').replace(/\{([a-z_]+)(?::(\d+|lower|upper|title|slug))?\}/gi, (_all, key, modifier) => {
      let value = context[key] ?? '';
      if (/^\d+$/.test(modifier || '')) value = String(value).padStart(Number(modifier), '0');
      else value = MME.formatValue(value, modifier);
      return value;
    });
  };

  MME.extensionFor = (media, imageFormat) => {
    if (media.type === 'video') {
      if (media.delivery === 'DIRECT_WEBM') return 'webm';
      if (media.delivery === 'HLS' || media.delivery === 'SEGMENT_TS') return 'ts';
      return 'mp4';
    }
    if (media.subtype === 'video_poster' && imageFormat === 'original') {
      return (media.originalExtension || media.extension || 'jpg').replace('.', '');
    }
    if (imageFormat === 'jpeg') return 'jpg';
    if (imageFormat === 'png') return 'png';
    if (imageFormat === 'webp') return 'webp';
    return (media.originalExtension || media.extension || 'jpg').replace('.', '');
  };

  MME.mediaContext = (listing, media, counters = {}) => ({
    marketplace: 'Mercado Livre',
    produto: listing.productName || listing.originalTitle || 'produto',
    titulo_anuncio: listing.originalTitle || '',
    item_id: listing.listingId || '',
    catalog_id: listing.catalogId || '',
    vendedor: listing.seller || '',
    marca: listing.brand || '',
    numero: counters.global || media.galleryPosition || 1,
    numero_imagem: counters.image || media.imageIndex || 1,
    numero_video: counters.video || media.videoIndex || 1,
    tipo: media.type === 'video' ? 'video' : (media.subtype === 'video_poster' ? 'capa' : 'imagem'),
    largura: media.width || '',
    altura: media.height || '',
    resolucao: media.width && media.height ? `${media.width}x${media.height}` : '',
    formato: media.extension || '',
    data: new Date().toISOString().slice(0, 10),
    hora: new Date().toTimeString().slice(0, 5).replace(':', '-')
  });

  MME.makeFilename = (listing, media, counters, settings) => {
    const context = MME.mediaContext(listing, media, counters);
    const template = media.type === 'video'
      ? settings.videoTemplate
      : media.subtype === 'video_poster'
        ? settings.posterTemplate
        : settings.imageTemplate;
    const base = MME.sanitizeSegment(MME.applyTemplate(template, context));
    const folder = String(settings.folderTemplate || '')
      .split('/')
      .map((part) => MME.sanitizeSegment(MME.applyTemplate(part, context)))
      .filter(Boolean)
      .join('/');
    const ext = MME.extensionFor(media, settings.imageFormat);
    return `${folder ? `${folder}/` : ''}${base}.${ext}`;
  };

  MME.toast = (message, kind = 'info') => {
    let host = document.getElementById('mme-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'mme-toast-host';
      host.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:2147483647;display:flex;flex-direction:column;gap:8px;pointer-events:none';
      document.documentElement.appendChild(host);
    }
    const el = document.createElement('div');
    const bg = kind === 'error' ? '#b42318' : kind === 'success' ? '#067647' : '#222';
    el.style.cssText = `max-width:360px;background:${bg};color:#fff;padding:11px 14px;border-radius:10px;font:13px/1.35 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.24);opacity:0;transform:translateY(8px);transition:.18s ease`;
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; });
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 200);
    }, 3500);
  };
})();
