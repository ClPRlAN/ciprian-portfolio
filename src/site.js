(function () {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scrollBehavior = () => reducedMotion.matches ? 'auto' : 'smooth';
  const themePreference = window.matchMedia('(prefers-color-scheme: dark)');
  let saved;
  try { saved = localStorage.getItem('theme'); } catch (_) {}
  let hasThemePreference = saved === 'dark' || saved === 'light';
  root.dataset.theme = hasThemePreference ? saved : (themePreference.matches ? 'dark' : 'light');

  const themeButtons = document.querySelectorAll('[data-theme-toggle]');
  const sun = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>';
  const moon = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.7 13.4A8.8 8.8 0 0 1 10.6 3.3 8.8 8.8 0 1 0 20.7 13.4Z"/></svg>';
  const updateThemeButtons = () => {
    const dark = root.dataset.theme === 'dark';
    themeButtons.forEach((button) => {
      const label = dark ? button.dataset.lightLabel : button.dataset.darkLabel;
      if (label) button.setAttribute('aria-label', label);
      button.innerHTML = dark ? sun : moon;
    });
  };
  updateThemeButtons();
  themeButtons.forEach((button) => button.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    hasThemePreference = true;
    try { localStorage.setItem('theme', root.dataset.theme); } catch (_) {}
    updateThemeButtons();
  }));
  themePreference.addEventListener('change', (event) => {
    if (!hasThemePreference) {
      root.dataset.theme = event.matches ? 'dark' : 'light';
      updateThemeButtons();
    }
  });

  const lang = document.querySelector('.lang');
  const langButton = document.querySelector('.lang-btn');
  const langMenu = document.querySelector('.lang-menu');
  let closeLanguage = () => {};
  if (lang && langButton && langMenu) {
    const setLanguageOpen = (open, returnFocus = false) => {
      lang.classList.toggle('open', open);
      langButton.setAttribute('aria-expanded', String(open));
      langMenu.inert = !open;
      langMenu.setAttribute('aria-hidden', String(!open));
      if (!open && returnFocus) langButton.focus();
    };
    closeLanguage = (returnFocus = false) => setLanguageOpen(false, returnFocus);
    setLanguageOpen(false);
    langButton.addEventListener('click', () => setLanguageOpen(!lang.classList.contains('open')));
    langButton.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setLanguageOpen(true);
        langMenu.querySelector('a')?.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!lang.contains(event.target)) closeLanguage();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && lang.classList.contains('open')) {
        event.preventDefault();
        closeLanguage(lang.contains(document.activeElement));
      }
    });
    lang.addEventListener('focusout', (event) => {
      if (!lang.contains(event.relatedTarget)) closeLanguage();
    });
  }

  const menuButton = document.querySelector('.menu-btn');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (menuButton && mobileMenu) {
    const desktop = window.matchMedia('(min-width: 1081px)');
    const openLabel = menuButton.dataset.openLabel || menuButton.getAttribute('aria-label');
    const closeLabel = menuButton.dataset.closeLabel || menuButton.dataset.closeMenuLabel || openLabel;
    const menuIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    const closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg>';
    const focusableItems = () => [menuButton, ...mobileMenu.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')].filter((item) => !item.hidden && item.getClientRects().length);
    const setMobileOpen = (open, returnFocus = false) => {
      mobileMenu.classList.toggle('open', open);
      mobileMenu.inert = !open;
      mobileMenu.setAttribute('aria-hidden', String(!open));
      document.body.classList.toggle('menu-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-pressed', String(open));
      const label = open ? closeLabel : openLabel;
      if (label) menuButton.setAttribute('aria-label', label);
      menuButton.innerHTML = open ? closeIcon : menuIcon;
      if (open) {
        closeLanguage();
        requestAnimationFrame(() => {
          if (mobileMenu.classList.contains('open')) mobileMenu.querySelector('a[href], button')?.focus();
        });
      } else if (returnFocus) menuButton.focus();
    };
    setMobileOpen(false);
    menuButton.addEventListener('click', () => setMobileOpen(!mobileMenu.classList.contains('open')));
    mobileMenu.querySelectorAll('a').forEach((anchor) => anchor.addEventListener('click', () => setMobileOpen(false)));
    document.addEventListener('keydown', (event) => {
      if (!mobileMenu.classList.contains('open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setMobileOpen(false, true);
      } else if (event.key === 'Tab') {
        const items = focusableItems();
        const index = items.indexOf(document.activeElement);
        if (!items.length) return;
        if (event.shiftKey && index <= 0) {
          event.preventDefault();
          items[items.length - 1].focus();
        } else if (!event.shiftKey && (index === items.length - 1 || index === -1)) {
          event.preventDefault();
          items[0].focus();
        }
      }
    });
    desktop.addEventListener('change', (event) => {
      if (event.matches) setMobileOpen(false);
    });
  }

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .08 });
    document.querySelectorAll('.reveal').forEach((element) => {
      // Only offscreen content waits for a reveal; all content remains readable without JavaScript.
      if (element.getBoundingClientRect().top >= window.innerHeight) element.classList.add('reveal-pending');
      observer.observe(element);
    });
    reducedMotion.addEventListener('change', (event) => {
      if (event.matches) {
        document.querySelectorAll('.reveal-pending').forEach((element) => element.classList.add('visible'));
        observer.disconnect();
      }
    });
  }

  const backToTop = document.querySelector('.back-to-top');
  let scrollFrame = 0;
  const updateScroll = () => {
    const total = root.scrollHeight - root.clientHeight;
    root.style.setProperty('--scroll-progress', total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)).toFixed(4) : '0');
    if (backToTop) {
      const visible = window.scrollY > 450;
      backToTop.classList.toggle('is-visible', visible);
      backToTop.tabIndex = visible ? 0 : -1;
      backToTop.setAttribute('aria-hidden', String(!visible));
    }
    scrollFrame = 0;
  };
  const queueScroll = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  };
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll, { passive: true });
  window.addEventListener('load', queueScroll, { once: true });
  updateScroll();
  backToTop?.addEventListener('click', () => {
    const destination = document.querySelector('main h1') || document.querySelector('main');
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
    if (destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
    }
  });

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.card, .cert, .button, .skill-group').forEach((surface) => {
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const clearPointer = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      surface.style.removeProperty('--pointer-x');
      surface.style.removeProperty('--pointer-y');
    };
    surface.addEventListener('pointermove', (event) => {
      if (!finePointer.matches || reducedMotion.matches) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!frame) frame = requestAnimationFrame(() => {
        const bounds = surface.getBoundingClientRect();
        surface.style.setProperty('--pointer-x', `${pointerX - bounds.left}px`);
        surface.style.setProperty('--pointer-y', `${pointerY - bounds.top}px`);
        frame = 0;
      });
    }, { passive: true });
    surface.addEventListener('pointerleave', clearPointer);
    reducedMotion.addEventListener('change', clearPointer);
    finePointer.addEventListener('change', clearPointer);
  });

  document.querySelectorAll('[data-artifact-tabs]').forEach((workspace) => {
    const tablist = workspace.querySelector('.artifact-tabs');
    const tabs = [...workspace.querySelectorAll('[data-artifact-tab]')];
    const panels = [...workspace.querySelectorAll('[data-artifact-panel]')];
    if (!tablist || tabs.length < 2 || tabs.some((tab) => !panels.some((panel) => panel.id === tab.dataset.artifactTab))) return;
    tablist.setAttribute('role', 'tablist');
    const selectTab = (selected, { focus = false, scroll = false, updateHash = false } = {}) => {
      tabs.forEach((tab) => {
        const active = tab === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        const panel = panels.find((item) => item.id === tab.dataset.artifactTab);
        panel.hidden = !active;
      });
      if (focus) selected.focus({ preventScroll: true });
      if (updateHash && location.hash !== selected.hash) history.pushState(null, '', selected.hash);
      if (scroll) tablist.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      queueScroll();
    };
    tabs.forEach((tab, index) => {
      const panel = panels.find((item) => item.id === tab.dataset.artifactTab);
      tab.id ||= `artifact-tab-${panel.id}`;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      tab.addEventListener('click', (event) => {
        if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        selectTab(tab, { updateHash: true, scroll: true });
      });
      tab.addEventListener('keydown', (event) => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          selectTab(tabs[next], { focus: true, updateHash: true });
        }
      });
    });
    const tabFromHash = () => tabs.find((tab) => `#${tab.dataset.artifactTab}` === location.hash);
    const initialTab = tabFromHash();
    selectTab(initialTab || tabs[0]);
    if (initialTab) requestAnimationFrame(() => selectTab(initialTab, { scroll: true }));
    window.addEventListener('hashchange', () => {
      const tab = tabFromHash();
      if (tab) selectTab(tab, { scroll: true });
      else if (!location.hash) selectTab(tabs[0]);
    });
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest('a[href]');
      if (!anchor) return;
      const target = new URL(anchor.href, location.href);
      if (target.origin !== location.origin || target.pathname !== location.pathname) return;
      const tab = tabs.find((item) => `#${item.dataset.artifactTab}` === target.hash);
      if (!tab) return;
      event.preventDefault();
      selectTab(tab, { updateHash: true, scroll: true });
    });
    workspace.classList.add('tabs-ready');
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
    let sending = false;
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (sending) return;
      const status = contactForm.querySelector('.status');
      const endpoint = contactForm.getAttribute('action') || '';
      if (!endpoint || endpoint.includes('YOUR_FORM_ID')) {
        if (status) status.textContent = contactForm.dataset.notReady || 'Contact form is not connected yet.';
        return;
      }
      const submitButton = contactForm.querySelector('[type="submit"]');
      sending = true;
      contactForm.setAttribute('aria-busy', 'true');
      if (submitButton) submitButton.disabled = true;
      if (status) status.textContent = contactForm.dataset.sending || '…';
      try {
        const response = await fetch(endpoint, { method: 'POST', body: new FormData(contactForm), headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Request failed');
        contactForm.reset();
        const successPanel = document.querySelector('[data-contact-success]');
        if (successPanel) {
          contactForm.hidden = true;
          successPanel.hidden = false;
          requestAnimationFrame(() => {
            successPanel.classList.add('show');
            successPanel.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
            successPanel.focus({ preventScroll: true });
          });
        } else if (status) {
          status.textContent = contactForm.dataset.success || 'Thank you. Your message has been sent.';
        }
      } catch (_) {
        if (status) status.textContent = contactForm.dataset.error || 'Your message could not be sent. Please try again.';
      } finally {
        sending = false;
        contactForm.removeAttribute('aria-busy');
        if (submitButton) submitButton.disabled = false;
      }
    });
  }
})();
