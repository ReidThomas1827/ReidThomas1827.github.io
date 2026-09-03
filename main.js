'use strict';

/* ─── Footer year ────────────────────────────────────────────── */
const currentYear = new Date().getFullYear();
document.querySelectorAll('#footer-year, #portfolio-year').forEach(element => {
  element.textContent = currentYear;
  element.setAttribute('datetime', String(currentYear));
});

/* ─── Header shadow on scroll ────────────────────────────────── */
const header = document.querySelector('.site-header');
if (header) {
  const onScroll = () =>
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ─── Mobile nav toggle ──────────────────────────────────────── */
const toggle = document.querySelector('.nav__toggle');
const menu   = document.getElementById('nav-menu');

if (toggle && menu) {
  const menuLinks = [...menu.querySelectorAll('.nav__link')];
  const open = () => {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';
    menuLinks[0]?.focus();
  };
  const close = () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
  };
  const isOpen = () => menu.classList.contains('is-open');

  toggle.addEventListener('click', () => isOpen() ? close() : open());

  // Close on nav link click
  menuLinks.forEach(link =>
    link.addEventListener('click', close)
  );

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) { close(); toggle.focus(); }
  });

  // Close when clicking outside the nav
  document.addEventListener('pointerdown', e => {
    if (isOpen() && !menu.contains(e.target) && !toggle.contains(e.target)) {
      close();
    }
  });

  // Keep keyboard focus inside the full-screen mobile menu.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !isOpen() || !menuLinks.length) return;
    const focusable = [toggle, ...menuLinks];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const mobileQuery = window.matchMedia('(max-width: 640px)');
  mobileQuery.addEventListener?.('change', event => {
    if (!event.matches) close();
  });
}

/* ─── Active nav link on scroll ─────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav__link');

if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          link.removeAttribute('aria-current');
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.setAttribute('aria-current', 'location');
          }
        });
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );
  sections.forEach(s => io.observe(s));
}

/* ─── Reveal animations (respects prefers-reduced-motion) ────── */
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const style = document.createElement('style');
  style.textContent = `
    .reveal {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1),
                  transform 0.5s cubic-bezier(0.16,1,0.3,1);
    }
    .reveal.is-visible {
      opacity: 1;
      transform: none;
    }
  `;
  document.head.appendChild(style);

  // Add class to animatable elements
  const targets = document.querySelectorAll(
    '.card, .xp__item, .about__bio, .about__skills, .contact__inner'
  );
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 4) * 60}ms`;
  });

  const revealObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -80px 0px', threshold: 0.05 }
  );
  targets.forEach(el => revealObserver.observe(el));
}
