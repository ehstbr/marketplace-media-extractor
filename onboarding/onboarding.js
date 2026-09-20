function initOnboarding() {
  const version = document.getElementById('onboardingVersion');
  if (version) version.textContent = chrome.runtime.getManifest().version;
  const finish = document.getElementById('finish');
  const advanced = document.getElementById('advanced');

  const persistBaseChoices = async () => {
    const format = document.getElementById('format');
    const all = document.getElementById('all');
    await chrome.storage.local.set({
      onboardingCompleted: true,
      imageFormat: format ? format.value : 'jpeg',
      folderTemplate: '{produto}',
      imageTemplate: '{produto}-{numero_imagem:02}',
      videoTemplate: '{produto}-video-{numero_video:02}',
      posterTemplate: '{produto}-video-{numero_video:02}-capa',
      quickAllAction: all ? all.value : 'prepare'
    });
  };

  finish?.addEventListener('click', async () => {
    await persistBaseChoices();
    window.close();
  });

  advanced?.addEventListener('click', async () => {
    await persistBaseChoices();
    try {
      if (chrome.runtime?.openOptionsPage) {
        await chrome.runtime.openOptionsPage();
      }
    } catch (err) {
      console.error('Não foi possível abrir as configurações avançadas.', err);
    }
    window.close();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initOnboarding, { once: true });
} else {
  initOnboarding();
}
