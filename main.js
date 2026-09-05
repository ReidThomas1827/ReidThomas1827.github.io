"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const year = new Date().getFullYear();

document.querySelectorAll("[data-year]").forEach((element) => {
  element.textContent = String(year);
  element.setAttribute("datetime", String(year));
});

/* Header state and composited scroll progress */
const header = document.querySelector("[data-header]");
let scrollFrame = 0;
const updateScrollState = () => {
  const top = window.scrollY;
  const max = Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    1,
  );
  document.documentElement.style.setProperty(
    "--scroll-progress",
    Math.min(top / max, 1).toFixed(4),
  );
  header?.classList.toggle("is-scrolled", top > 18);
  scrollFrame = 0;
};
window.addEventListener(
  "scroll",
  () => {
    if (!scrollFrame)
      scrollFrame = window.requestAnimationFrame(updateScrollState);
  },
  { passive: true },
);
window.addEventListener("resize", updateScrollState, { passive: true });
updateScrollState();

/* Mobile navigation */
const navToggle = document.querySelector(".nav__toggle");
const navMenu = document.getElementById("nav-menu");
const navLinks = [...document.querySelectorAll(".nav__link")];

if (navToggle && navMenu) {
  const setMenu = (open) => {
    navMenu.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute(
      "aria-label",
      `${open ? "Close" : "Open"} navigation menu`,
    );
    if (open) navLinks[0]?.focus();
  };
  navToggle.addEventListener("click", () =>
    setMenu(navToggle.getAttribute("aria-expanded") !== "true"),
  );
  navLinks.forEach((link) =>
    link.addEventListener("click", () => setMenu(false)),
  );
  document.addEventListener("pointerdown", (event) => {
    if (
      navToggle.getAttribute("aria-expanded") === "true" &&
      !navMenu.contains(event.target) &&
      !navToggle.contains(event.target)
    )
      setMenu(false);
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      navToggle.getAttribute("aria-expanded") === "true"
    ) {
      setMenu(false);
      navToggle.focus();
    }
  });
  window
    .matchMedia("(min-width: 961px)")
    .addEventListener?.("change", (event) => {
      if (event.matches) setMenu(false);
    });
}

/* Sliding nav underline that follows hover/focus and settles on the active
   section link. Additive: CSS hides it on mobile and falls back to the
   per-link underline without JS. */
if (navMenu && navLinks.length) {
  const slider = document.createElement("span");
  slider.className = "nav__slider";
  slider.setAttribute("aria-hidden", "true");
  navMenu.appendChild(slider);
  const activeLink = () =>
    navMenu.querySelector('.nav__link[aria-current="location"]');
  const moveTo = (link) => {
    if (!link) {
      slider.style.opacity = "0";
      return;
    }
    slider.style.opacity = "1";
    slider.style.width = `${link.offsetWidth}px`;
    slider.style.transform = `translateX(${link.offsetLeft}px)`;
  };
  navLinks.forEach((link) => {
    link.addEventListener("pointerenter", () => moveTo(link));
    link.addEventListener("focus", () => moveTo(link));
  });
  navMenu.addEventListener("pointerleave", () => moveTo(activeLink()));
  navMenu.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!navMenu.contains(document.activeElement)) moveTo(activeLink());
    }, 0);
  });
  const sliderObserver = new MutationObserver(() => {
    if (!navMenu.matches(":hover")) moveTo(activeLink());
  });
  navLinks.forEach((link) =>
    sliderObserver.observe(link, {
      attributes: true,
      attributeFilter: ["aria-current"],
    }),
  );
  window.addEventListener(
    "resize",
    () => moveTo(navMenu.querySelector(".nav__link:hover") || activeLink()),
    { passive: true },
  );
  window.requestAnimationFrame(() => moveTo(activeLink()));
}

/* Section visibility and active navigation */
const revealTargets = [...document.querySelectorAll("[data-reveal]")];
if (reducedMotion.matches || !("IntersectionObserver" in window)) {
  revealTargets.forEach((target) => target.classList.add("is-visible"));
} else {
  revealTargets.forEach(
    (target, index) => (target.style.transitionDelay = `${(index % 3) * 55}ms`),
  );
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  );
  revealTargets.forEach((target) => revealObserver.observe(target));
}
document.documentElement.classList.add("js-ready");

/* Project context filter. All work remains visible without JavaScript. */
const projectFilters = document.querySelector("[data-project-filters]");
let applyProjectFilter = null;
if (projectFilters) {
  const filterButtons = [
    ...projectFilters.querySelectorAll("[data-project-filter]"),
  ];
  const projects = [...document.querySelectorAll("[data-project-context]")];
  const filterStatus = projectFilters.querySelector(
    "[data-project-filter-status]",
  );

  const validFilters = new Set(["all", "independent", "coursework"]);
  filterButtons.forEach((button) => {
    const filter = button.dataset.projectFilter;
    const count = projects.filter(
      (project) =>
        filter === "all" || project.dataset.projectContext === filter,
    ).length;
    const countLabel = button.querySelector("span");
    if (countLabel) countLabel.textContent = String(count).padStart(2, "0");
  });
  const setProjectFilter = (
    filter,
    { updateUrl = false, animate = false } = {},
  ) => {
    const safeFilter = validFilters.has(filter) ? filter : "all";
    let visibleCount = 0;
    filterButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.projectFilter === safeFilter),
      ),
    );
    projects.forEach((project) => {
      const visible =
        safeFilter === "all" || project.dataset.projectContext === safeFilter;
      project.hidden = !visible;
      project.classList.remove("project-filter-enter");
      if (!visible) return;
      visibleCount += 1;
      if (
        animate &&
        !reducedMotion.matches &&
        !document.documentElement.classList.contains("motion-paused")
      ) {
        window.requestAnimationFrame(() =>
          project.classList.add("project-filter-enter"),
        );
      }
    });
    if (filterStatus) {
      const label =
        safeFilter === "coursework" ? "coursework" : `${safeFilter} work`;
      filterStatus.textContent = `Showing ${visibleCount} items: ${label}.`;
    }
    if (updateUrl) {
      const url = new URL(window.location.href);
      if (safeFilter === "all") url.searchParams.delete("work");
      else url.searchParams.set("work", safeFilter);
      window.history.pushState({ work: safeFilter }, "", url);
    }
  };
  applyProjectFilter = setProjectFilter;

  filterButtons.forEach((button) =>
    button.addEventListener("click", () =>
      setProjectFilter(button.dataset.projectFilter, {
        updateUrl: true,
        animate: true,
      }),
    ),
  );
  const requestedFilter = new URLSearchParams(window.location.search).get(
    "work",
  );
  setProjectFilter(requestedFilter || "all");
  window.addEventListener("popstate", () => {
    const restoredFilter = new URLSearchParams(window.location.search).get(
      "work",
    );
    setProjectFilter(restoredFilter || "all", { animate: true });
  });
}

let filterBeforePrint = null;
window.addEventListener("beforeprint", () => {
  filterBeforePrint = document.querySelector(
    '[data-project-filter][aria-pressed="true"]',
  )?.dataset.projectFilter;
  applyProjectFilter?.("all");
});
window.addEventListener("afterprint", () => {
  if (filterBeforePrint) applyProjectFilter?.(filterBeforePrint);
  filterBeforePrint = null;
});

const observedSections = [...document.querySelectorAll("main section[id]")];
if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const current = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!current) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${current.target.id}`;
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    },
    { rootMargin: "-34% 0px -55% 0px", threshold: [0, 0.1, 0.4] },
  );
  observedSections.forEach((section) => sectionObserver.observe(section));
}

/* Hero system state visualization */
const systemVisual = document.querySelector("[data-system-visual]");
if (systemVisual) {
  const stateLabel = systemVisual.querySelector("[data-system-state]");
  const phaseLabel = systemVisual.querySelector("[data-system-phase]");
  const logLabel = systemVisual.querySelector("[data-system-log]");
  const progressBar = systemVisual.querySelector("[data-system-progress]");
  const percentLabel = systemVisual.querySelector("[data-system-percent]");
  const states = [
    {
      state: "ONLINE",
      phase: "ANALYZING",
      log: "Framing the problem",
      progress: 38,
    },
    {
      state: "WORKING",
      phase: "EXPLORING",
      log: "Comparing possible approaches",
      progress: 61,
    },
    {
      state: "WORKING",
      phase: "BUILDING",
      log: "Implementing a working model",
      progress: 84,
    },
    {
      state: "VERIFIED",
      phase: "COMPLETE",
      log: "Testing assumptions and edges",
      progress: 100,
    },
  ];
  let stateIndex = 0;
  let stateTimer = 0;
  let systemInView = true;
  const renderState = (index) => {
    const next = states[index];
    stateLabel.textContent = next.state;
    phaseLabel.textContent = next.phase;
    logLabel.textContent = next.log;
    progressBar.style.setProperty("--system-progress", `${next.progress}%`);
    percentLabel.textContent = `${next.progress}%`;
  };
  const startStates = () => {
    if (reducedMotion.matches || stateTimer) return;
    stateTimer = window.setInterval(() => {
      stateIndex = (stateIndex + 1) % states.length;
      renderState(stateIndex);
    }, 2600);
  };
  const stopStates = () => {
    window.clearInterval(stateTimer);
    stateTimer = 0;
  };
  if (reducedMotion.matches) renderState(states.length - 1);
  else if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          systemInView = entry.isIntersecting;
          systemInView ? startStates() : stopStates();
        }),
      { threshold: 0.08 },
    ).observe(systemVisual);
  } else startStates();
  document.addEventListener("visibilitychange", () =>
    document.hidden || !systemInView ? stopStates() : startStates(),
  );
  document.addEventListener("portfolio:motion-toggle", (event) =>
    event.detail?.paused ? stopStates() : startStates(),
  );
  reducedMotion.addEventListener?.("change", (event) => {
    if (event.matches) {
      stopStates();
      stateIndex = states.length - 1;
      renderState(stateIndex);
    } else if (
      systemInView &&
      !document.documentElement.classList.contains("motion-paused")
    ) {
      startStates();
    }
  });

  if (!reducedMotion.matches && finePointer.matches) {
    let visualFrame = 0;
    systemVisual.addEventListener(
      "pointermove",
      (event) => {
        if (
          reducedMotion.matches ||
          document.documentElement.classList.contains("motion-paused")
        )
          return;
        if (visualFrame) return;
        visualFrame = window.requestAnimationFrame(() => {
          const bounds = systemVisual.getBoundingClientRect();
          systemVisual.style.setProperty(
            "--hero-x",
            ((event.clientX - bounds.left) / bounds.width - 0.5).toFixed(3),
          );
          systemVisual.style.setProperty(
            "--hero-y",
            ((event.clientY - bounds.top) / bounds.height - 0.5).toFixed(3),
          );
          visualFrame = 0;
        });
      },
      { passive: true },
    );
    systemVisual.addEventListener("pointerleave", () => {
      systemVisual.style.setProperty("--hero-x", 0);
      systemVisual.style.setProperty("--hero-y", 0);
    });
  }
}

/* Subtle project perspective and pointer-local glow */
if (!reducedMotion.matches && finePointer.matches) {
  document.querySelectorAll("[data-project]").forEach((project) => {
    const visual = project.querySelector(".project__visual");
    let tiltFrame = 0;
    project.addEventListener(
      "pointermove",
      (event) => {
        if (document.documentElement.classList.contains("motion-paused"))
          return;
        if (tiltFrame) return;
        tiltFrame = window.requestAnimationFrame(() => {
          const bounds = visual.getBoundingClientRect();
          const x = Math.max(
            0,
            Math.min(1, (event.clientX - bounds.left) / bounds.width),
          );
          const y = Math.max(
            0,
            Math.min(1, (event.clientY - bounds.top) / bounds.height),
          );
          visual.style.setProperty("--light-x", `${(x * 100).toFixed(1)}%`);
          visual.style.setProperty("--light-y", `${(y * 100).toFixed(1)}%`);
          visual.style.setProperty(
            "--tilt-x",
            `${((0.5 - y) * 3).toFixed(2)}deg`,
          );
          visual.style.setProperty(
            "--tilt-y",
            `${((x - 0.5) * 3).toFixed(2)}deg`,
          );
          tiltFrame = 0;
        });
      },
      { passive: true },
    );
    project.addEventListener("pointerleave", () => {
      visual.style.setProperty("--tilt-x", "0deg");
      visual.style.setProperty("--tilt-y", "0deg");
    });
  });
}

/* Subtle magnetic pull on primary buttons (pointer feedback only). Skips
   touch and reduced-motion, and yields to the Pause-motion control. */
if (!reducedMotion.matches && finePointer.matches) {
  const magneticButtons = [...document.querySelectorAll(".button")];
  const MAX_PULL = 5;
  const clearPulls = () =>
    magneticButtons.forEach((b) => (b.style.transform = ""));
  magneticButtons.forEach((button) => {
    let magFrame = 0;
    button.addEventListener(
      "pointermove",
      (event) => {
        if (
          magFrame ||
          document.documentElement.classList.contains("motion-paused")
        )
          return;
        magFrame = window.requestAnimationFrame(() => {
          const b = button.getBoundingClientRect();
          const dx = (event.clientX - (b.left + b.width / 2)) / (b.width / 2);
          const dy = (event.clientY - (b.top + b.height / 2)) / (b.height / 2);
          button.style.transform = `translate(${(dx * MAX_PULL).toFixed(1)}px, ${(dy * MAX_PULL).toFixed(1)}px)`;
          magFrame = 0;
        });
      },
      { passive: true },
    );
    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });
  document.addEventListener("portfolio:motion-toggle", (event) => {
    if (event.detail?.paused) clearPulls();
  });
}

/* Local, zero-network lab interaction. Decorative: responds to mouse and
   touch (the passive listener never blocks scroll) and is hidden from
   assistive tech, so it is not presented as an operable control. */
const signalCard = document.querySelector("[data-signal-field]");
if (signalCard && !reducedMotion.matches) {
  const field = signalCard.querySelector(".signal-field");
  const xLabel = signalCard.querySelector("[data-signal-x]");
  const yLabel = signalCard.querySelector("[data-signal-y]");
  let signalFrame = 0;
  field.addEventListener(
    "pointermove",
    (event) => {
      if (document.documentElement.classList.contains("motion-paused")) return;
      if (signalFrame) return;
      signalFrame = window.requestAnimationFrame(() => {
        const bounds = field.getBoundingClientRect();
        const x = Math.max(
          0,
          Math.min(1, (event.clientX - bounds.left) / bounds.width),
        );
        const y = Math.max(
          0,
          Math.min(1, (event.clientY - bounds.top) / bounds.height),
        );
        field.style.setProperty("--signal-x", `${(x * 100).toFixed(1)}%`);
        field.style.setProperty("--signal-y", `${(y * 100).toFixed(1)}%`);
        xLabel.textContent = x.toFixed(2);
        yLabel.textContent = y.toFixed(2);
        signalFrame = 0;
      });
    },
    { passive: true },
  );
}

/* Accessible command palette */
const palette = document.querySelector("[data-command-palette]");
const paletteInput = document.getElementById("command-input");
const commandStatus = document.getElementById("command-status");
const commandEmpty = palette?.querySelector("[data-command-empty]");
const paletteButtons = palette
  ? [...palette.querySelectorAll("[data-command]")]
  : [];
const paletteBackground = [
  document.querySelector(".site-header"),
  document.querySelector("main"),
  document.querySelector(".site-footer"),
  document.querySelector("[data-chat-widget]"),
].filter(Boolean);
let selectedCommand = 0;
let commandReturnTarget = null;

const setPaletteBackgroundInert = (inert) => {
  paletteBackground.forEach((element) => (element.inert = inert));
};

const visibleCommands = () => paletteButtons.filter((button) => !button.hidden);
const selectCommand = (index) => {
  const visible = visibleCommands();
  if (!visible.length) {
    paletteInput?.removeAttribute("aria-activedescendant");
    if (commandStatus) commandStatus.textContent = "No commands found.";
    return;
  }
  selectedCommand = (index + visible.length) % visible.length;
  paletteButtons.forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-selected", "false");
  });
  const selected = visible[selectedCommand];
  selected.classList.add("is-selected");
  selected.setAttribute("aria-selected", "true");
  paletteInput?.setAttribute("aria-activedescendant", selected.id);
  if (commandStatus)
    commandStatus.textContent = `${selected.textContent.trim()} selected. ${visible.length} commands available.`;
  selected.scrollIntoView({ block: "nearest" });
};
const closePalette = () => {
  if (!palette || palette.hidden) return;
  palette.hidden = true;
  document.body.style.overflow = "";
  setPaletteBackgroundInert(false);
  paletteInput?.setAttribute("aria-expanded", "false");
  paletteInput?.removeAttribute("aria-activedescendant");
  commandReturnTarget?.focus();
};
const openPalette = (trigger) => {
  if (!palette) return;
  const requestedReturnTarget = trigger || document.activeElement;
  window.dispatchEvent(new CustomEvent("portfolio:close-chat"));
  commandReturnTarget = requestedReturnTarget?.closest?.(".chat-panel")
    ? document.querySelector(".chat-launcher")
    : requestedReturnTarget;
  palette.hidden = false;
  document.body.style.overflow = "hidden";
  setPaletteBackgroundInert(true);
  paletteInput.setAttribute("aria-expanded", "true");
  paletteInput.value = "";
  paletteButtons.forEach((button) => (button.hidden = false));
  if (commandEmpty) commandEmpty.hidden = true;
  selectedCommand = 0;
  selectCommand(0);
  window.requestAnimationFrame(() => paletteInput.focus());
};
const runCommand = (button) => {
  const action = button?.dataset.command;
  if (!action) return;
  closePalette();
  if (action === "chat")
    window.dispatchEvent(new CustomEvent("portfolio:open-chat"));
  else if (action === "copy-email")
    document.querySelector("[data-copy-email]")?.click();
  else if (action === "copy-link")
    copyText(window.location.href)
      .then(() => showToast("Current portfolio link copied."))
      .catch(() => showToast("Copy unavailable — use the browser address."));
  else if (action === "print") window.print();
  else if (action === "motion")
    document.querySelector("[data-motion-toggle]")?.click();
  else if (action.startsWith("#")) {
    if (action.startsWith("#project-")) {
      applyProjectFilter?.("all");
    }
    const targetUrl = new URL(window.location.href);
    if (action.startsWith("#project-")) targetUrl.searchParams.delete("work");
    targetUrl.hash = action;
    window.history.pushState(null, "", targetUrl);
    document
      .querySelector(action)
      ?.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth" });
  } else if (action.startsWith("http"))
    window.open(action, "_blank", "noopener,noreferrer");
  else window.location.href = action;
};

document
  .querySelectorAll("[data-command-open]")
  .forEach((button) =>
    button.addEventListener("click", () => openPalette(button)),
  );
palette
  ?.querySelector("[data-command-close]")
  ?.addEventListener("click", closePalette);
paletteButtons.forEach((button) => {
  // Options are driven by aria-activedescendant, not DOM focus, so they must
  // not be tab stops — otherwise Tab desyncs focus from the highlighted item.
  button.tabIndex = -1;
  button.addEventListener("pointerenter", () =>
    selectCommand(visibleCommands().indexOf(button)),
  );
  button.addEventListener("click", () => runCommand(button));
});
paletteInput?.addEventListener("input", () => {
  const query = paletteInput.value.trim().toLowerCase();
  paletteButtons.forEach(
    (button) =>
      (button.hidden = !button.textContent.toLowerCase().includes(query)),
  );
  if (commandEmpty) commandEmpty.hidden = visibleCommands().length > 0;
  selectedCommand = 0;
  selectCommand(0);
});
document.addEventListener("keydown", (event) => {
  const shortcut =
    (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
  if (shortcut) {
    event.preventDefault();
    palette?.hidden ? openPalette(document.activeElement) : closePalette();
    return;
  }
  if (!palette || palette.hidden) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closePalette();
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    selectCommand(selectedCommand + 1);
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    selectCommand(selectedCommand - 1);
  }
  if (event.key === "Enter") {
    event.preventDefault();
    runCommand(visibleCommands()[selectedCommand]);
  }
  if (event.key === "Tab") {
    // Trap focus on the input; options are reached via arrows, not Tab.
    event.preventDefault();
    paletteInput?.focus();
  }
});

document
  .querySelectorAll("[data-chat-open]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      window.dispatchEvent(new CustomEvent("portfolio:open-chat")),
    ),
  );

document
  .querySelectorAll("[data-print]")
  .forEach((button) => button.addEventListener("click", () => window.print()));

/* Platform-correct keyboard shortcut hints (defaults assume macOS in markup) */
const isMacPlatform = /mac|iphone|ipad|ipod/i.test(
  navigator.platform || navigator.userAgent || "",
);
if (!isMacPlatform) {
  document
    .querySelectorAll("[data-shortcut-hint]")
    .forEach((el) => (el.textContent = "Ctrl K"));
  document
    .querySelectorAll("[data-shortcut-mod]")
    .forEach((el) => (el.textContent = "CTRL"));
}

/* Enhanced cursor is additive; the native cursor is never disabled */
const cursor = document.querySelector(".cursor");
if (cursor && finePointer.matches && !reducedMotion.matches) {
  let pointerX = -100;
  let pointerY = -100;
  let cursorFrame = 0;
  const drawCursor = () => {
    cursor.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
    cursorFrame = 0;
  };
  document.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      cursor.classList.add("is-visible");
      if (!cursorFrame) cursorFrame = window.requestAnimationFrame(drawCursor);
    },
    { passive: true },
  );
  document.addEventListener("pointerover", (event) => {
    const target = event.target.closest("a, button, [data-cursor]");
    cursor.classList.toggle("is-active", Boolean(target));
    cursor.querySelector("span").textContent =
      target?.dataset.cursor || (target?.matches("a") ? "OPEN" : "SELECT");
  });
  document.addEventListener("pointerleave", () =>
    cursor.classList.remove("is-visible"),
  );
}

const siteToast = document.querySelector("[data-site-toast]");
let toastTimer = 0;
let toastHideTimer = 0;
const showToast = (message) => {
  if (!siteToast) return;
  window.clearTimeout(toastTimer);
  window.clearTimeout(toastHideTimer);
  siteToast.textContent = message;
  siteToast.hidden = false;
  window.requestAnimationFrame(() => siteToast.classList.add("is-visible"));
  toastTimer = window.setTimeout(() => {
    siteToast.classList.remove("is-visible");
    toastHideTimer = window.setTimeout(
      () => (siteToast.hidden = true),
      reducedMotion.matches ? 0 : 300,
    );
  }, 2200);
};
const copyText = async (value) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const field = document.createElement("textarea");
  field.value = value;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  if (!copied) throw new Error("Copy command unavailable");
};

document.querySelectorAll("[data-copy-project]").forEach((button) => {
  button.addEventListener("click", async () => {
    const project = button.closest("[data-project]");
    const projectName = project?.querySelector("h3")?.textContent.trim();
    const url = new URL(window.location.href);
    url.searchParams.delete("work");
    url.hash = button.dataset.copyProject;
    try {
      await copyText(url.href);
      showToast(`${projectName || "Project"} link copied.`);
    } catch {
      showToast("Copy unavailable — use the browser address.");
    }
  });
});

/* Contact utility with a secure-context Clipboard API path and a small
   compatibility fallback for local/static previews. */
const copyEmailButton = document.querySelector("[data-copy-email]");
const copyEmailStatus = document.querySelector("[data-copy-email-status]");
if (copyEmailButton) {
  let copyResetTimer = 0;
  copyEmailButton.addEventListener("click", async () => {
    const email = copyEmailButton.dataset.copyEmail;
    try {
      await copyText(email);
      window.clearTimeout(copyResetTimer);
      copyEmailButton.textContent = "Copied";
      copyEmailButton.classList.add("is-copied");
      if (copyEmailStatus)
        copyEmailStatus.textContent = "Email address copied to clipboard.";
      showToast("Email address copied.");
      copyResetTimer = window.setTimeout(() => {
        copyEmailButton.textContent = "Copy email";
        copyEmailButton.classList.remove("is-copied");
      }, 2400);
    } catch {
      if (copyEmailStatus) {
        copyEmailStatus.textContent =
          "Copy was unavailable. The email link remains available.";
      }
      showToast("Copy unavailable — use the email link.");
    }
  });
}

/* Dynamic footer time is real local client time */
const localTime = document.querySelector("[data-local-time]");
const connectionLabel = document.querySelector("[data-connection-label]");
const updateConnectionLabel = () => {
  const offline = !window.navigator.onLine;
  document.documentElement.classList.toggle("is-offline", offline);
  if (connectionLabel)
    connectionLabel.textContent = offline
      ? "Interface offline"
      : "Interface online";
};
window.addEventListener("online", updateConnectionLabel);
window.addEventListener("offline", updateConnectionLabel);
updateConnectionLabel();
const updateTime = () => {
  if (!localTime) return;
  const now = new Date();
  localTime.textContent = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
  localTime.dateTime = now.toISOString();
};
updateTime();
let timeTimer = window.setInterval(updateTime, 1000);
document.addEventListener("visibilitychange", () => {
  window.clearInterval(timeTimer);
  timeTimer = 0;
  if (!document.hidden) {
    updateTime();
    timeTimer = window.setInterval(updateTime, 1000);
  }
});

const motionToggle = document.querySelector("[data-motion-toggle]");
if (motionToggle) {
  const motionCommand = document.querySelector("[data-motion-command]");
  const setMotionPaused = (paused, { announce = false } = {}) => {
    document.documentElement.classList.toggle("motion-paused", paused);
    motionToggle.setAttribute("aria-pressed", String(paused));
    motionToggle.textContent = paused ? "Resume motion" : "Pause motion";
    if (motionCommand)
      motionCommand.textContent = paused ? "Resume motion" : "Pause motion";
    try {
      window.localStorage.setItem("portfolio-motion-paused", String(paused));
    } catch {
      // Storage can be unavailable in private or restricted browsing modes.
    }
    document.dispatchEvent(
      new CustomEvent("portfolio:motion-toggle", { detail: { paused } }),
    );
    if (announce) showToast(paused ? "Motion paused." : "Motion resumed.");
  };
  motionToggle.addEventListener("click", () =>
    setMotionPaused(
      !document.documentElement.classList.contains("motion-paused"),
      { announce: true },
    ),
  );
  let savedMotionPaused = false;
  try {
    savedMotionPaused =
      window.localStorage.getItem("portfolio-motion-paused") === "true";
  } catch {
    // Keep the default when preference storage is unavailable.
  }
  setMotionPaused(savedMotionPaused);
}

console.info(
  "%c RT / SYSTEM ONLINE ",
  "background:#55d8ff;color:#071015;padding:5px 8px;font:12px monospace",
  "\nBuilt with HTML, CSS, JavaScript, and a healthy respect for the layers below.",
);
