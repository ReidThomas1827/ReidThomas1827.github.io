'use strict';

/* ─── Footer year ────────────────────────────────────────────── */
const currentYear = new Date().getFullYear();
document.querySelectorAll('#footer-year, #portfolio-year').forEach(element => {
  element.textContent = currentYear;
  element.setAttribute('datetime', String(currentYear));
});

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ─── Unified scroll handler: header shadow, progress bar,
       hero parallax — one rAF-throttled listener ─────────────── */
const header = document.querySelector('.site-header');
const hero = document.querySelector('.hero');
const heroInner = document.querySelector('.hero__inner');

const progressBar = document.createElement('div');
progressBar.className = 'scroll-progress';
progressBar.setAttribute('aria-hidden', 'true');
document.body.prepend(progressBar);

let scrollScheduled = false;
const onScroll = () => {
  scrollScheduled = false;
  const y = window.scrollY;

  header?.classList.toggle('is-scrolled', y > 8);

  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;

  // Hero content drifts up slightly and fades as it scrolls away
  if (!prefersReducedMotion && hero && heroInner && y < hero.offsetHeight) {
    heroInner.style.transform = `translateY(${y * 0.12}px)`;
    heroInner.style.opacity = String(Math.max(1 - y / (hero.offsetHeight * 0.9), 0));
  }
};
window.addEventListener('scroll', () => {
  if (!scrollScheduled) {
    scrollScheduled = true;
    requestAnimationFrame(onScroll);
  }
}, { passive: true });
onScroll(); // run once on load

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
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  // Add class to animatable elements
  const targets = document.querySelectorAll(
    '.section__head, .card, .xp__item, .about__bio, .about__skills, ' +
    '.skill, .contact__inner'
  );
  targets.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--reveal-delay', `${(i % 4) * 55}ms`);
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

/* ─── Restrained hero depth — desktop pointers only ─────────── */
if (!prefersReducedMotion && finePointer && hero) {
  let frameId = 0;
  let pointerX = 0;
  let pointerY = 0;

  const renderDepth = () => {
    hero.style.setProperty('--hero-x', pointerX.toFixed(3));
    hero.style.setProperty('--hero-y', pointerY.toFixed(3));
    frameId = 0;
  };

  hero.addEventListener('pointermove', event => {
    const bounds = hero.getBoundingClientRect();
    pointerX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointerY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    if (!frameId) frameId = requestAnimationFrame(renderDepth);
  }, { passive: true });

  hero.addEventListener('pointerleave', () => {
    pointerX = 0;
    pointerY = 0;
    if (!frameId) frameId = requestAnimationFrame(renderDepth);
  });
}
