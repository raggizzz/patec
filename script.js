/* PaTec — interações e animações */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- year ---------- */
  const yEl = $('#year'); if (yEl) yEl.textContent = new Date().getFullYear();

  /* ---------- loader ---------- */
  window.addEventListener('load', () => {
    setTimeout(() => $('#loader')?.classList.add('done'), 700);
  });

  /* ---------- lenis smooth scroll ---------- */
  let lenis;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* anchor click — let lenis handle smooth */
  const nav = $('#nav');
  const burger = $('#burger');
  const closeMenu = () => {
    nav?.classList.remove('menu-open');
    document.body.classList.remove('lock');
    burger?.setAttribute('aria-expanded', 'false');
  };
  const openMenu = () => {
    nav?.classList.add('menu-open');
    document.body.classList.add('lock');
    burger?.setAttribute('aria-expanded', 'true');
  };

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -80 });
      else target.scrollIntoView({ behavior: 'smooth' });
      closeMenu();
    });
  });

  /* ---------- nav scroll state ---------- */
  const onScroll = () => {
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- burger ---------- */
  burger?.setAttribute('aria-expanded', 'false');
  burger?.addEventListener('click', () => {
    if (nav?.classList.contains('menu-open')) closeMenu();
    else openMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 920) closeMenu();
  });
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- custom cursor ---------- */
  const cur = $('#cursor');
  if (cur && matchMedia('(hover: hover)').matches) {
    let tx = 0, ty = 0, x = 0, y = 0;
    window.addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      cur.style.transform = `translate(${x}px, ${y}px)`;
      requestAnimationFrame(tick);
    };
    tick();
    const hovers = 'a, button, [data-magnet], .bento, .mission, .join-card, .tab, input, select, textarea';
    document.addEventListener('mouseover', e => { if (e.target.closest(hovers)) cur.classList.add('is-hover'); });
    document.addEventListener('mouseout', e => { if (e.target.closest(hovers)) cur.classList.remove('is-hover'); });
  }

  /* ---------- char reveal setup (keep whole words together) ---------- */
  $$('.char-reveal').forEach(h => {
    const walk = (node) => {
      const parts = [];
      node.childNodes.forEach(child => {
        if (child.nodeType === 3) {
          const text = child.textContent;
          const frag = document.createDocumentFragment();
          text.split(/(\s+)/).forEach(token => {
            if (!token) return;
            if (/^\s+$/.test(token)) {
              frag.appendChild(document.createTextNode(token));
              return;
            }

            const word = document.createElement('span');
            word.className = 'ch-word';

            [...token].forEach(ch => {
              const span = document.createElement('span');
              span.className = 'ch';
              span.textContent = ch;
              word.appendChild(span);
            });

            frag.appendChild(word);
          });
          parts.push({ old: child, frag });
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
      parts.forEach(p => p.old.replaceWith(p.frag));
    };
    walk(h);
    h.querySelectorAll('.ch').forEach((c, i) => c.style.setProperty('--i', i));
  });

  /* ---------- reveal on scroll (IntersectionObserver + manual fallback) ---------- */
  const revealEl = (el) => {
    el.classList.add('in');
    if (el.classList.contains('char-reveal')) el.classList.add('revealed');
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { revealEl(en.target); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* manual fallback — in case IO is flaky */
  const checkReveal = () => {
    $$('.reveal:not(.in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.92 && r.bottom > 0) { revealEl(el); io.unobserve(el); }
    });
  };
  window.addEventListener('scroll', checkReveal, { passive: true });
  window.addEventListener('resize', checkReveal);
  setTimeout(checkReveal, 60);
  setTimeout(checkReveal, 400);
  /* nuclear fallback: after 1.5s guarantee every char-reveal is visible */
  setTimeout(() => {
    $$('.char-reveal:not(.revealed)').forEach(el => {
      el.classList.add('in', 'revealed');
      io.unobserve(el);
    });
  }, 1500);

  /* ---------- scroll progress bar ---------- */
  const prog = $('#scrollProgress');
  if (prog) {
    const updateProg = () => {
      const h = document.documentElement;
      const p = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight);
      prog.style.setProperty('--p', Math.max(0, Math.min(1, p)) * 100 + '%');
    };
    updateProg();
    window.addEventListener('scroll', updateProg, { passive: true });
  }

  /* ---------- mouse glow (hero) ---------- */
  const glow = $('#mouseGlow');
  if (glow && matchMedia('(hover: hover)').matches) {
    let gx = 0, gy = 0, tx = 0, ty = 0, moving = false, running = false, active = false;
    const hero = $('.hero');
    const onMove = (e) => { tx = e.clientX; ty = e.clientY; moving = true; if (!running && active) loop(); };
    window.addEventListener('mousemove', onMove);
    const loop = () => {
      running = true;
      gx += (tx - gx) * 0.14;
      gy += (ty - gy) * 0.14;
      glow.style.transform = `translate(${gx}px, ${gy}px) translate(-50%, -50%)`;
      if (Math.abs(tx - gx) < 0.4 && Math.abs(ty - gy) < 0.4) { running = false; return; }
      requestAnimationFrame(loop);
    };
    const obs = new IntersectionObserver(([en]) => {
      active = en.isIntersecting;
      glow.classList.toggle('on', active);
      if (active && !running) loop();
    }, { threshold: 0.05 });
    if (hero) obs.observe(hero);
  }

  /* ---------- 3D tilt + cursor blob on cards ---------- */
  if (matchMedia('(hover: hover)').matches && !reduced) {
    const tiltTargets = $$('.mission, .join-card, .stat-card, .comp-card, .method li, .depo');
    tiltTargets.forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const cx = e.clientX - r.left, cy = e.clientY - r.top;
        const rx = ((cy / r.height) - 0.5) * -6;
        const ry = ((cx / r.width) - 0.5) * 8;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        el.style.setProperty('--mx', cx + 'px');
        el.style.setProperty('--my', cy + 'px');
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- section dots ---------- */
  const dotsEl = $('#dots');
  if (dotsEl) {
    const dotLinks = $$('a', dotsEl);
    const sections = dotLinks.map(a => document.getElementById(a.dataset.target)).filter(Boolean);
    const updateDots = () => {
      const y = window.scrollY + innerHeight * 0.35;
      let activeId = sections[0]?.id;
      sections.forEach(s => { if (s.offsetTop <= y) activeId = s.id; });
      dotLinks.forEach(a => a.classList.toggle('active', a.dataset.target === activeId));
    };
    updateDots();
    window.addEventListener('scroll', updateDots, { passive: true });
    window.addEventListener('resize', updateDots);
  }

  /* ---------- nav active link ---------- */
  const navLinks = $$('.nav__menu a');
  const navTargets = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const updateNav = () => {
    const y = window.scrollY + innerHeight * 0.35;
    let activeId = null;
    navTargets.forEach(s => { if (s.offsetTop <= y) activeId = s.id; });
    navLinks.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + activeId));
  };
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  /* ---------- hero title — line reveal ---------- */
  const heroTitle = $('.hero__title');
  if (window.gsap && !reduced) {
    heroTitle?.classList.remove('pre-anim');
    gsap.set('.split-line > span', { clearProps: 'all' });
    gsap.fromTo('.split-line > span',
      { yPercent: 110, y: 0 },
      { yPercent: 0, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.3, immediateRender: true }
    );
  } else {
    heroTitle?.classList.remove('pre-anim');
  }

  /* ---------- counters ---------- */
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    const target = +el.dataset.count;
    const dur = 1600;
    const start = performance.now();
    const fmt = (v) => v.toLocaleString('pt-BR') + (target >= 1000 ? '+' : '');
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      const val = Math.floor(eased * target);
      el.textContent = fmt(val);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(step);
  };
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { runCounter(en.target); countObs.unobserve(en.target); } });
  }, { threshold: 0.01 });
  counters.forEach(c => countObs.observe(c));
  /* manual fallback */
  const checkCounters = () => {
    counters.forEach(el => {
      if (el.dataset.done) return;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.95 && r.bottom > 0) runCounter(el);
    });
  };
  window.addEventListener('scroll', checkCounters, { passive: true });
  setTimeout(checkCounters, 80);
  setTimeout(checkCounters, 600);

  /* ---------- tabs (oferta) ---------- */
  $$('.tab').forEach(t => {
    t.addEventListener('click', () => {
      const id = t.dataset.tab;
      $$('.tab').forEach(x => x.classList.toggle('active', x === t));
      $$('.panel').forEach(p => p.classList.toggle('active', p.dataset.panel === id));
    });
  });

  /* ---------- magnetic buttons ---------- */
  if (matchMedia('(hover: hover)').matches && !reduced) {
    $$('[data-magnet]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - (r.left + r.width / 2);
        const my = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${mx * 0.18}px, ${my * 0.25}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- orb parallax + grid parallax (hero) ---------- */
  if (window.gsap && !reduced) {
    gsap.to('.orb--1', { x: 80, y: 60, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.orb--2', { x: -120, y: -40, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__logo', { y: -60, rotation: 4, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.grid-bg', { y: 80, scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    /* bento parallax (zoom on enter) */
    $$('.bento').forEach(b => {
      const img = b.querySelector('img');
      gsap.fromTo(img, { yPercent: -8 }, {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: b, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });

    /* footer huge text — parallax in */
    gsap.fromTo('.footer__huge', { y: 40, opacity: .2 }, {
      y: 0, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });

    /* missoes — track horizontal subtle */
    gsap.utils.toArray('.mission').forEach((m, i) => {
      gsap.from(m, {
        y: 40, opacity: 0, duration: .8, ease: 'power3.out',
        scrollTrigger: { trigger: m, start: 'top 85%' }
      });
    });
  }

  /* ---------- FAQ accordion ---------- */
  $$('.faq__item').forEach(item => {
    const btn = item.querySelector('.faq__q');
    btn?.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- floating CTA visibility ---------- */
  const fcta = $('#floatCta');
  if (fcta) {
    const heroEl = $('.hero');
    const contactEl = $('#contato');
    const updateFcta = () => {
      const heroBottom = heroEl ? heroEl.getBoundingClientRect().bottom : 0;
      const contactTop = contactEl ? contactEl.getBoundingClientRect().top : Infinity;
      const show = heroBottom < 80 && contactTop > innerHeight * 0.6;
      fcta.classList.toggle('show', show);
    };
    updateFcta();
    window.addEventListener('scroll', updateFcta, { passive: true });
    window.addEventListener('resize', updateFcta);
  }

  /* ---------- contact form ---------- */
  window.sendMail = function (e) {
    e.preventDefault();
    const f = e.target;
    const note = document.getElementById('formNote');
    const btn  = document.getElementById('formBtn');
    const data = new FormData(f);

    /* ── Opção A: Formspree (recomendado) ──────────────────────────────
       1. Crie conta gratuita em formspree.io
       2. Crie um formulário e copie o endpoint (ex.: https://formspree.io/f/XXXXXXXX)
       3. Substitua o action abaixo e descomente o bloco fetch
    const FORMSPREE = 'https://formspree.io/f/SEU_ID_AQUI';
    btn.disabled = true;
    if (note) { note.className = 'form-note'; note.textContent = 'Enviando…'; }
    fetch(FORMSPREE, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(res => {
        if (res.ok) {
          if (note) { note.className = 'form-note'; note.textContent = '✓ Mensagem enviada! Retornaremos em breve.'; }
          f.reset();
        } else throw new Error();
      })
      .catch(() => {
        if (note) { note.className = 'form-note error'; note.textContent = 'Erro ao enviar. Tente por e-mail diretamente.'; }
      })
      .finally(() => { btn.disabled = false; });
    return false;
    ── fim Opção A ──────────────────────────────────────────────────── */

    /* ── Opção B: mailto (fallback atual) ─────────────────────────── */
    const subject = encodeURIComponent(`[Site PaTec] Contato — ${data.get('perfil')}`);
    const body = encodeURIComponent(
      `Nome: ${data.get('nome')}\nE-mail: ${data.get('email')}\nPerfil: ${data.get('perfil')}\n\n${data.get('mensagem')}`
    );
    if (note) { note.className = 'form-note'; note.textContent = 'Abrindo seu aplicativo de e-mail…'; }
    window.location.href = `mailto:contato@patecbrasilia.com.br?subject=${subject}&body=${body}`;
    return false;
  };
})();
