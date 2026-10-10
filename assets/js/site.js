document.documentElement.classList.add('js');

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
if (toggle && nav) {
  toggle.hidden = false;
  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });
  nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
}

const filters = document.querySelector('.project-filters');
if (filters) {
  filters.hidden = false;
  const cards = [...document.querySelectorAll('.project-collection .research-card')];
  const count = document.querySelector('.project-count');
  filters.addEventListener('click', event => {
    const button = event.target.closest('.filter-button');
    if (!button) return;
    filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let visible = 0;
    for (const card of cards) {
      card.hidden = button.dataset.filter !== 'All' && card.dataset.area !== button.dataset.filter;
      if (!card.hidden) visible++;
    }
    count.textContent = visible + (visible === 1 ? ' project' : ' projects');
  });
}

// Remove only the former portfolio worker and its own caches.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(async registrations => {
    for (const registration of registrations) {
      const worker = registration.active || registration.waiting || registration.installing;
      if (!worker) continue;
      const url = new URL(worker.scriptURL);
      const root = new URL('./', document.querySelector('link[rel=stylesheet]').href).pathname.replace(/assets\/css\/$/, '');
      if (url.origin === location.origin && url.pathname === root + 'sw.min.js') {
        await registration.unregister();
        if ('caches' in window) {
          for (const name of await caches.keys()) {
            if (name.startsWith('chirpy-')) await caches.delete(name);
          }
        }
      }
    }
  }).catch(() => {});
}
