(function () {
  const root = document.documentElement;
  let saved;
  try { saved = localStorage.getItem('theme'); } catch (_) {}
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (systemDark ? 'dark' : 'light');
  root.dataset.theme = initial;

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    const update = () => {
      const dark = root.dataset.theme === 'dark';
      btn.setAttribute('aria-label', dark ? btn.dataset.lightLabel : btn.dataset.darkLabel);
      btn.innerHTML = dark ? '☀' : '☾';
    };
    update();
    btn.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', root.dataset.theme); } catch (_) {}
      document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
        const dark = root.dataset.theme === 'dark';
        b.innerHTML = dark ? '☀' : '☾';
        b.setAttribute('aria-label', dark ? b.dataset.lightLabel : b.dataset.darkLabel);
      });
      update();
    });
  });

  const lang = document.querySelector('.lang');
  const langBtn = document.querySelector('.lang-btn');
  if (lang && langBtn) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      lang.classList.toggle('open');
      langBtn.setAttribute('aria-expanded', String(lang.classList.contains('open')));
    });
    const closeLanguage = () => { lang.classList.remove('open'); langBtn.setAttribute('aria-expanded', 'false'); };
    document.addEventListener('click', closeLanguage);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLanguage(); });
  }

  const menuBtn = document.querySelector('.menu-btn');
  const mobile = document.querySelector('.mobile-menu');
  if (menuBtn && mobile) {
    menuBtn.addEventListener('click', () => {
      const open = mobile.classList.toggle('open');
      document.body.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.innerHTML = open ? '×' : '☰';
    });
    mobile.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
      mobile.classList.remove('open');
      document.body.classList.remove('menu-open');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.innerHTML = '☰';
    }));
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach((el) => {
    // Keep content visible without JavaScript and above-the-fold content visible immediately.
    if (el.getBoundingClientRect().top >= window.innerHeight) el.classList.add('reveal-pending');
    io.observe(el);
  });

  const revealPhone = document.querySelector('[data-reveal-phone]');
  if (revealPhone) {
    revealPhone.addEventListener('click', () => {
      const target = document.querySelector('[data-phone-value]');
      if (target) target.textContent = revealPhone.dataset.phone;
      revealPhone.remove();
    });
  }

  const contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      const status = contactForm.querySelector('.status');
      const endpoint = contactForm.getAttribute('action') || '';
      if (endpoint.includes('YOUR_FORM_ID')) {
        event.preventDefault();
        status.textContent = contactForm.dataset.notReady || 'Contact form is not connected yet.';
        return;
      }
      event.preventDefault();
      status.textContent = '…';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: new FormData(contactForm), headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error('Request failed');
        contactForm.reset();
        const successPanel = document.querySelector('[data-contact-success]');
        contactForm.hidden = true;
        if (successPanel) {
          successPanel.hidden = false;
          requestAnimationFrame(() => {
            successPanel.classList.add('show');
            successPanel.scrollIntoView({ block: 'start' });
          });
          successPanel.focus({ preventScroll: true });
        } else {
          status.textContent = contactForm.dataset.success || 'Thank you. Your message has been sent.';
        }
      } catch (_) {
        status.textContent = contactForm.dataset.error;
      }
    });
  }
})();
