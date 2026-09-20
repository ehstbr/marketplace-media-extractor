(() => {
  const MME = globalThis.MME;
  let refreshTimer = null;
  let mutationObserver = null;
  let mutationTimer = null;

  async function refresh(reason = 'initial') {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(async () => {
      try {
        await MME.loadSettings();
        await MME.extractListing();
        if (reason === 'navigation') {
          document.getElementById('mme-gallery-controls-host')?.remove();
          document.getElementById('mme-floating-host')?.remove();
          MME.state.galleryAnchor = null;
        }
        MME.installUI();
        MME.repositionGalleryControls?.();
        MME.refreshControls?.();
      } catch (error) {
        console.debug('[MME] refresh failed', error);
      }
    }, reason === 'initial' ? 50 : 350);
  }


  function watchSettings() {
    chrome.storage.onChanged.addListener(async (changes, areaName) => {
      if (areaName !== 'local') return;
      const relevant = Object.keys(MME.defaults).some((key) => Object.prototype.hasOwnProperty.call(changes, key));
      if (!relevant) return;
      try {
        await MME.loadSettings();
        MME.installUI?.();
        MME.syncGalleryControlsAnchor?.();
        MME.syncThumbnailControls?.();
        MME.refreshControls?.();
      } catch (error) {
        console.debug('[MME] settings refresh failed', error);
      }
    });
  }

  function watchNavigation() {
    const notify = () => {
      if (MME.state.lastUrl !== location.href) {
        MME.state.lastUrl = location.href;
        refresh('navigation');
      }
    };
    const originalPush = history.pushState;
    history.pushState = function (...args) { const result = originalPush.apply(this, args); setTimeout(notify, 0); return result; };
    const originalReplace = history.replaceState;
    history.replaceState = function (...args) { const result = originalReplace.apply(this, args); setTimeout(notify, 0); return result; };
    addEventListener('popstate', notify);

    mutationObserver = new MutationObserver(() => {
      notify();
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        MME.syncGalleryControlsAnchor?.();
        MME.syncThumbnailControls?.();
        MME.refreshControls?.();
      }, 100);
    });
    mutationObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset', 'poster'] });
  }

  watchNavigation();
  watchSettings();
  refresh('initial');
})();
