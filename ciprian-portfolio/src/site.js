(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (systemDark ? 'dark' : 'light');
  root.dataset.theme = initial;

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    const update = () => {
      const dark = root.dataset.theme === 'dark';
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.innerHTML = dark ? '☀' : '☾';
    };
    update();
    btn.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', root.dataset.theme);
      document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
        const dark = root.dataset.theme === 'dark';
        b.innerHTML = dark ? '☀' : '☾';
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
    document.addEventListener('click', () => lang.classList.remove('open'));
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
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

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
          requestAnimationFrame(() => successPanel.classList.add('show'));
          successPanel.focus({ preventScroll: true });
        } else {
          status.textContent = contactForm.dataset.success || 'Thank you. Your message has been sent.';
        }
      } catch (_) {
        status.textContent = 'Unable to send the message right now. Please use email.';
      }
    });
  }


  const escHtml = (value = '') => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const renderInlineMarkdown = (value = '') => escHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const renderMarkdown = (value = '') => {
    const lines = String(value).split(/\r?\n/);
    let html = '', inList = false;
    const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) { closeList(); continue; }
      const h = line.match(/^(#{1,4})\s+(.+)$/);
      if (h) { closeList(); const level = h[1].length; html += `<h${level}>${renderInlineMarkdown(h[2])}</h${level}>`; continue; }
      const li = line.match(/^[-*]\s+(.+)$/);
      if (li) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${renderInlineMarkdown(li[1])}</li>`; continue; }
      closeList(); html += `<p>${renderInlineMarkdown(line)}</p>`;
    }
    closeList();
    return html;
  };

  document.querySelectorAll('[data-notebook-url]').forEach(async (shell) => {
    const status = shell.querySelector('.notebook-status');
    const target = shell.querySelector('.notebook-content');
    try {
      const response = await fetch(shell.dataset.notebookUrl, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Notebook request failed');
      const notebook = await response.json();
      const frag = document.createDocumentFragment();
      (notebook.cells || []).forEach((cell, index) => {
        const el = document.createElement('section');
        el.className = `nb-cell ${cell.cell_type || 'raw'}`;
        const source = Array.isArray(cell.source) ? cell.source.join('') : (cell.source || '');
        if (cell.cell_type === 'markdown') {
          el.innerHTML = `<div class="nb-markdown">${renderMarkdown(source)}</div>`;
        } else if (cell.cell_type === 'code') {
          const label = document.createElement('div');
          label.className = 'nb-code-label';
          label.textContent = `In [${cell.execution_count ?? ' '} ]`;
          const pre = document.createElement('pre');
          pre.className = 'nb-code';
          pre.textContent = source;
          el.append(label, pre);
          const outputs = cell.outputs || [];
          if (outputs.length) {
            const out = document.createElement('div'); out.className = 'nb-output';
            outputs.forEach((o) => {
              const data = o.data || {};
              if (data['image/png']) {
                const img = document.createElement('img');
                const encoded = Array.isArray(data['image/png']) ? data['image/png'].join('') : data['image/png'];
                img.src = `data:image/png;base64,${encoded}`; img.alt = 'Notebook output'; out.appendChild(img);
              } else {
                const textValue = o.text ?? data['text/plain'];
                if (textValue) {
                  const opre = document.createElement('pre');
                  opre.textContent = Array.isArray(textValue) ? textValue.join('') : textValue;
                  out.appendChild(opre);
                }
              }
            });
            if (out.childNodes.length) el.appendChild(out);
          }
        } else {
          const pre = document.createElement('pre'); pre.className = 'nb-code'; pre.textContent = source; el.appendChild(pre);
        }
        frag.appendChild(el);
      });
      target.appendChild(frag); target.hidden = false; status.remove();
    } catch (error) {
      status.textContent = shell.dataset.error || 'Notebook preview unavailable.';
    }
  });

})();
