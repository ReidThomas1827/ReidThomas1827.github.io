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
    '.section__head, .card, .xp__item, .about__bio, .about__skills, ' +
    '.skill, .contact__inner'
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

/* ─── Hero cursor glow — lerped trail, desktop pointers only ── */
if (!prefersReducedMotion && finePointer && hero) {
  const glow = document.createElement('div');
  glow.className = 'hero__glow';
  glow.setAttribute('aria-hidden', 'true');
  hero.prepend(glow);

  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  let rafId = null;

  const tick = () => {
    curX += (targetX - curX) * 0.12;
    curY += (targetY - curY) * 0.12;
    glow.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
    if (Math.abs(targetX - curX) > 0.5 || Math.abs(targetY - curY) > 0.5) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  };

  hero.addEventListener('pointermove', e => {
    const rect = hero.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    if (rafId === null) rafId = requestAnimationFrame(tick);
  });
  hero.addEventListener('pointerenter', e => {
    const rect = hero.getBoundingClientRect();
    curX = targetX = e.clientX - rect.left;
    curY = targetY = e.clientY - rect.top;
    glow.style.transform = `translate3d(${curX}px, ${curY}px, 0)`;
    hero.classList.add('is-glowing');
  });
  hero.addEventListener('pointerleave', () => {
    hero.classList.remove('is-glowing');
  });
}

/* ─── Magnetic hero CTAs — subtle pull toward the cursor ─────── */
if (!prefersReducedMotion && finePointer) {
  document.querySelectorAll('.hero__actions .btn').forEach(btn => {
    const strength = 0.22;
    const maxShift = 6;

    btn.addEventListener('pointermove', e => {
      const rect = btn.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const x = Math.max(-maxShift, Math.min(maxShift, dx * strength));
      const y = Math.max(-maxShift, Math.min(maxShift, dy * strength));
      btn.style.transition = 'transform 80ms linear';
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transition = 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)';
      btn.style.transform = '';
    });
  });
}
