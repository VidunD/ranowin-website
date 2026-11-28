'use strict';
(() => {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('Ranowin offline support could not be enabled.', error);
    });
  });

  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (document.getElementById('ranowin-install-banner')) return;

    const banner = document.createElement('aside');
    banner.id = 'ranowin-install-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Install Ranowin app');
    banner.innerHTML = `
      <span><strong>Get the Ranowin App</strong><small>Install on your phone for quick access.</small></span>
      <button type="button" id="ranowin-install-button">Install</button>
      <button type="button" id="ranowin-install-close" aria-label="Close install message">×</button>
    `;
    Object.assign(banner.style, {
      position: 'fixed', left: '12px', right: '12px', bottom: 'max(12px, env(safe-area-inset-bottom))',
      zIndex: '10000', display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px', borderRadius: '14px', background: '#fff', color: '#30233f',
      boxShadow: '0 5px 28px #24152f35', font: '14px system-ui'
    });
    const copy = banner.querySelector('span');
    Object.assign(copy.style, { flex: '1', display: 'grid', gap: '3px' });
    Object.assign(copy.querySelector('small').style, { color: '#71677d', fontSize: '12px' });
    const install = banner.querySelector('#ranowin-install-button');
    Object.assign(install.style, { border: '0', borderRadius: '9px', padding: '10px 15px', background: '#6b3eaa', color: '#fff', fontWeight: '700' });
    const close = banner.querySelector('#ranowin-install-close');
    Object.assign(close.style, { border: '0', background: 'transparent', color: '#51465e', fontSize: '23px' });
    install.addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      banner.remove();
    });
    close.addEventListener('click', () => banner.remove());
    document.body.appendChild(banner);
  });

  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    document.getElementById('ranowin-install-banner')?.remove();
  });
})();