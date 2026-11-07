import { createRoof3DViewer } from './roof3d.js';
import {
  ROOF_PROFILES,
  ROOF_COLORS,
  getProfileById,
  getColorById,
} from './data/products.js';

// ============================================================================
// 1. 239-FRAME 1080P CAB STEEL TRUCK LOADING HERO SEQUENCE ENGINE
// ============================================================================
function smoothStepRange(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function initHeroFrameSequence() {
  const TOTAL_FRAMES = 239;
  const canvas = document.getElementById('roofSequenceCanvas');
  const scrollTrack = document.getElementById('heroScrollTrack');
  const progressBar = document.getElementById('scrollProgressBar');
  const titleLine1 = document.getElementById('heroTitleLine1');
  const titleLine2 = document.getElementById('heroTitleLine2');
  const crimsonText = document.getElementById('heroCrimsonText');
  const outroLine1 = document.getElementById('heroOutroLine1');
  const outroLine2 = document.getElementById('heroOutroLine2');
  const outroCrimsonText = document.getElementById('heroOutroCrimsonText');
  const outroActions = document.getElementById('heroOutroActions');
  if (!canvas || !scrollTrack) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ctx = canvas.getContext('2d');
  const images = new Array(TOTAL_FRAMES);
  let targetFrame = 0;
  let currentFrame = 0;
  let isHeroNearViewport = true;

  function getFramePath(index) {
    const frameNum = String(index + 1).padStart(4, '0');
    return `./hero-truck-frames/frame-${frameNum}.webp`;
  }

  function drawTruckHeroFrame(img, frameNumber) {
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const isNarrow = cw < ch;

    // Guarantee full horizontal edge-to-edge coverage so the truck enters at x=0 and exits at x=cw
    const scale = isNarrow ? (cw * 1.04) / iw : cw / iw;
    const sw = iw * scale;
    const sh = ih * scale;
    const sx = (cw - sw) / 2;

    // Adaptive vertical framing:
    // - Frames 0..20: roof floats alone (y = 24.8%..62.4%), keep spacious upper studio air for headline
    // - Frames 55..205: yellow CAB Steel truck parks & loads (y = 17.1%..89.4%), center action so tires never clip
    let sy;
    if (isNarrow) {
      const syStart = (ch - sh) * 0.58;
      const syTruck = (ch - sh) * 0.52;
      const phase = smoothStepRange(18, 56, frameNumber);
      sy = syStart + (syTruck - syStart) * phase;
    } else {
      const syStart = ch * 0.60 - sh * 0.44;
      const syTruck = ch * 0.535 - sh * 0.533;
      const phase = smoothStepRange(18, 56, frameNumber);
      sy = syStart + (syTruck - syStart) * phase;
    }

    // Base studio backdrop matching new 1080p studio lighting
    ctx.fillStyle = '#EBEBEB';
    ctx.fillRect(0, 0, cw, ch);

    // Seamless studio light extension above top edge (preserves horizontal radial vignette)
    if (sy > 0) {
      ctx.drawImage(img, 0, 0, iw, 4, sx, 0, sw, sy + 2);
    }

    // Seamless studio floor extension below bottom edge
    if (sy + sh < ch) {
      ctx.drawImage(img, 0, ih - 4, iw, 4, sx, sy + sh - 2, sw, ch - (sy + sh) + 4);
    }

    ctx.drawImage(img, 0, 0, iw, ih, sx, sy, sw, sh);
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentFrame)));
    drawTruckHeroFrame(images[idx] || images[0], currentFrame);
  }

  window.addEventListener('resize', resizeCanvas);

  // Preload all 239 crisp 1080p WebP frames
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = getFramePath(i);
    if (i === 0) {
      img.onload = () => {
        resizeCanvas();
      };
    }
    images[i] = img;
  }

  const heroObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isHeroNearViewport = entry.isIntersecting;
      });
    },
    { rootMargin: '200px 0px' }
  );
  heroObserver.observe(scrollTrack);

  function syncHeroStageOverlays(scrollFraction) {
    // 1. Staggered two-line metallic exit + clearcoat highlight sweep on "the best."
    if (titleLine1) {
      const fade1 = smoothStepRange(0.02, 0.17, scrollFraction);
      titleLine1.style.opacity = (1 - fade1).toFixed(3);
      if (!prefersReducedMotion) {
        const y1 = (-30 * fade1).toFixed(1);
        const s1 = (1 - 0.02 * fade1).toFixed(4);
        titleLine1.style.transform = `translateY(${y1}px) scale(${s1})`;
      }
    }

    if (titleLine2) {
      const fade2 = smoothStepRange(0.06, 0.22, scrollFraction);
      titleLine2.style.opacity = (1 - fade2).toFixed(3);
      if (!prefersReducedMotion) {
        const y2 = (-20 * fade2).toFixed(1);
        titleLine2.style.transform = `translateY(${y2}px)`;
      }
    }

    if (crimsonText && !prefersReducedMotion) {
      const sweep = smoothStepRange(0.0, 0.22, scrollFraction);
      const posX = (18 + sweep * 72).toFixed(1);
      crimsonText.style.backgroundPosition = `${posX}% 50%`;
    }

    // 2. Frameless closing studio statement after yellow CAB Steel truck clears center stage
    if (outroLine1) {
      const r1 = smoothStepRange(0.79, 0.87, scrollFraction);
      outroLine1.style.opacity = r1.toFixed(3);
      if (!prefersReducedMotion) {
        const y1 = (28 * (1 - r1)).toFixed(1);
        const s1 = (0.985 + 0.015 * r1).toFixed(4);
        outroLine1.style.transform = `translateY(${y1}px) scale(${s1})`;
      }
    }

    if (outroLine2) {
      const r2 = smoothStepRange(0.82, 0.90, scrollFraction);
      outroLine2.style.opacity = r2.toFixed(3);
      if (!prefersReducedMotion) {
        const y2 = (22 * (1 - r2)).toFixed(1);
        outroLine2.style.transform = `translateY(${y2}px)`;
      }
    }

    if (outroCrimsonText && !prefersReducedMotion) {
      const outroSweep = smoothStepRange(0.81, 0.95, scrollFraction);
      const outroPosX = (86 - outroSweep * 64).toFixed(1);
      outroCrimsonText.style.backgroundPosition = `${outroPosX}% 50%`;
    }

    if (outroActions) {
      const r3 = smoothStepRange(0.85, 0.92, scrollFraction);
      outroActions.style.opacity = r3.toFixed(3);
      outroActions.style.pointerEvents = r3 > 0.6 ? 'auto' : 'none';
      if (!prefersReducedMotion) {
        const y3 = (16 * (1 - r3)).toFixed(1);
        outroActions.style.transform = `translateY(${y3}px)`;
      }
    }
  }

  let scrollTicking = false;
  function updateHeroScroll() {
    scrollTicking = false;
    const maxScroll = Math.max(1, scrollTrack.offsetHeight - window.innerHeight);
    const scrollFraction = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    const frameProgress = Math.min(1, scrollFraction / 0.90);
    targetFrame = frameProgress * (TOTAL_FRAMES - 1);

    const pct = Math.round(scrollFraction * 100);
    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }

    syncHeroStageOverlays(scrollFraction);
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateHeroScroll);
      }
    },
    { passive: true }
  );

  function tick() {
    if (isHeroNearViewport) {
      currentFrame += (targetFrame - currentFrame) * 0.16;
      const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentFrame)));
      const frameImg = images[frameIndex];
      if (frameImg && frameImg.complete) {
        drawTruckHeroFrame(frameImg, currentFrame);
      }
    }
    requestAnimationFrame(tick);
  }

  resizeCanvas();
  updateHeroScroll();
  requestAnimationFrame(tick);
}

// ============================================================================
// 2. FLOATING NAVIGATION, GLIDING PILL, SMOOTH SCROLL & MOBILE DRAWER (B7)
// ============================================================================
function initNavigation() {
  const toggleBtn = document.getElementById('mobileMenuBtn');
  const drawer = document.getElementById('mobileMenuDrawer');
  const pillTrack = document.getElementById('navPillTrack');
  const slidingIndicator = document.getElementById('navSlidingIndicator');
  const hoverIndicator = document.getElementById('navHoverIndicator');
  const navLinks = Array.from(document.querySelectorAll('[data-nav-section]'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (navLinks.length && pillTrack) {
    const sectionIds = ['profiles', 'products', 'why-us', 'about', 'faq'];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    let activeSectionId = 'top';
    let lockedSectionId = null;
    let scrollAnimRaf = null;

    if (slidingIndicator) {
      pillTrack.classList.add('has-glider');
    }

    function syncSlidingIndicator(linkEl, instant = false) {
      if (!slidingIndicator || !linkEl) return;
      const x = linkEl.offsetLeft;
      const w = linkEl.offsetWidth;
      if (w <= 0) return;

      if (instant) {
        slidingIndicator.classList.add('no-transition');
        slidingIndicator.style.width = `${w}px`;
        slidingIndicator.style.transform = `translate3d(${x}px, 0, 0)`;
        // Force style flush before re-enabling transitions
        void slidingIndicator.offsetWidth;
        requestAnimationFrame(() => {
          slidingIndicator.classList.remove('no-transition');
        });
      } else {
        slidingIndicator.style.width = `${w}px`;
        slidingIndicator.style.transform = `translate3d(${x}px, 0, 0)`;
      }
    }

    function setActiveNav(id, instant = false) {
      activeSectionId = id;
      let matchedLink = null;
      navLinks.forEach((link) => {
        const isMatch = link.getAttribute('data-nav-section') === id;
        link.classList.toggle('is-active', isMatch);
        if (isMatch) {
          link.setAttribute('aria-current', 'page');
          matchedLink = link;
        } else {
          link.removeAttribute('aria-current');
        }
      });
      if (matchedLink) {
        syncSlidingIndicator(matchedLink, instant);
      }
    }

    // Smooth hover follower inside the track
    if (hoverIndicator) {
      navLinks.forEach((link) => {
        link.addEventListener('mouseenter', () => {
          const x = link.offsetLeft;
          const w = link.offsetWidth;
          if (w <= 0) return;
          hoverIndicator.style.width = `${w}px`;
          hoverIndicator.style.transform = `translate3d(${x}px, 0, 0)`;
          const isCurrent = link.getAttribute('data-nav-section') === activeSectionId;
          hoverIndicator.style.opacity = isCurrent ? '0' : '1';
        });
      });

      pillTrack.addEventListener('mouseleave', () => {
        hoverIndicator.style.opacity = '0';
      });
    }

    // Cancel programmatic scroll immediately if user manually wheels or touches
    function cancelProgrammaticScroll() {
      if (scrollAnimRaf) {
        cancelAnimationFrame(scrollAnimRaf);
        scrollAnimRaf = null;
      }
      lockedSectionId = null;
    }
    window.addEventListener('wheel', cancelProgrammaticScroll, { passive: true });
    window.addEventListener('touchstart', cancelProgrammaticScroll, { passive: true });

    // Weighted smooth scroll to section with header clearance & single-glide pill lock
    function smoothScrollToY(targetY, targetId) {
      cancelProgrammaticScroll();

      if (prefersReducedMotion) {
        window.scrollTo(0, targetY);
        setActiveNav(targetId, true);
        return;
      }

      lockedSectionId = targetId;
      setActiveNav(targetId, false);
      if (hoverIndicator) hoverIndicator.style.opacity = '0';

      const startY = window.scrollY;
      const delta = targetY - startY;
      if (Math.abs(delta) < 2) {
        lockedSectionId = null;
        return;
      }

      const duration = Math.min(820, Math.max(460, Math.abs(delta) * 0.22));
      const startTime = performance.now();

      function step(now) {
        const rawT = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - rawT, 3.6);
        window.scrollTo(0, startY + delta * eased);

        if (rawT < 1) {
          scrollAnimRaf = requestAnimationFrame(step);
        } else {
          scrollAnimRaf = null;
          lockedSectionId = null;
        }
      }

      scrollAnimRaf = requestAnimationFrame(step);
    }

    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('data-nav-section');
        if (!targetId) return;
        e.preventDefault();

        if (targetId === 'top') {
          smoothScrollToY(0, 'top');
          history.replaceState(null, '', '#top');
          return;
        }

        const sec = document.getElementById(targetId);
        if (!sec) return;
        const headerOffset = 80;
        const destY = Math.max(0, sec.getBoundingClientRect().top + window.scrollY - headerOffset);
        smoothScrollToY(destY, targetId);
        history.replaceState(null, '', `#${targetId}`);
      });
    });

    document.querySelectorAll('[data-scroll-target]').forEach((trigger) => {
      trigger.addEventListener('click', (e) => {
        const targetId = trigger.getAttribute('data-scroll-target');
        if (!targetId) return;
        const sec = document.getElementById(targetId);
        if (!sec) return;
        e.preventDefault();
        const headerOffset = 80;
        const destY = Math.max(0, sec.getBoundingClientRect().top + window.scrollY - headerOffset);
        smoothScrollToY(destY, targetId);
        history.replaceState(null, '', `#${targetId}`);
      });
    });

    // Live scroll-spy when user scrolls organically
    let spyTicking = false;
    function updateScrollSpy(instant = false) {
      spyTicking = false;
      if (lockedSectionId) return;

      const probeY = window.innerHeight * 0.36;
      let currentId = 'top';
      for (const sec of sections) {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= probeY) {
          currentId = sec.id;
        }
      }

      if (instant || currentId !== activeSectionId) {
        setActiveNav(currentId, instant);
      }
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!spyTicking) {
          spyTicking = true;
          requestAnimationFrame(() => updateScrollSpy(false));
        }
      },
      { passive: true }
    );

    // Keep indicator pixel-accurate on resize & webfont load
    const ro = new ResizeObserver(() => {
      const currentLink = navLinks.find(
        (l) => l.getAttribute('data-nav-section') === activeSectionId
      );
      if (currentLink) syncSlidingIndicator(currentLink, true);
    });
    ro.observe(pillTrack);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        const currentLink = navLinks.find(
          (l) => l.getAttribute('data-nav-section') === activeSectionId
        );
        if (currentLink) syncSlidingIndicator(currentLink, true);
      });
    }

    updateScrollSpy(true);
  }

  if (!toggleBtn || !drawer) return;

  const mobileLinks = drawer.querySelectorAll('a');

  function setMenuOpen(open) {
    toggleBtn.setAttribute('aria-expanded', String(open));
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }

  toggleBtn.addEventListener('click', () => {
    const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
    setMenuOpen(!isOpen);
  });

  mobileLinks.forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggleBtn.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      toggleBtn.focus();
    }
  });
}

// ============================================================================
// 3. SECTION REVEALS ON INTERSECTION OBSERVER (B7: 32px rise, once)
// ============================================================================
function initSectionReveals() {
  const sections = document.querySelectorAll('.reveal-section');
  if (!sections.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    sections.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  sections.forEach((el) => observer.observe(el));
}

// ============================================================================
// 4. MANDATORY WORD-BY-WORD TAGLINE REVEAL (B11: rAF-throttled)
// ============================================================================
function initTaglineReveal() {
  const container = document.getElementById('taglineRevealText');
  if (!container) return;

  const words = Array.from(container.querySelectorAll('.tagline-word'));
  if (!words.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    words.forEach((w) => w.classList.add('is-active'));
    return;
  }

  let ticking = false;

  function updateWords() {
    ticking = false;
    const rect = container.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    // Start activating when top enters lower 82% of viewport, finish when section reaches upper 32%
    const startY = vh * 0.84;
    const endY = vh * 0.28;
    const progress = Math.max(0, Math.min(1, (startY - rect.top) / (startY - endY)));

    const activeCount = Math.floor(progress * words.length);
    for (let i = 0; i < words.length; i++) {
      words[i].classList.toggle('is-active', i < activeCount);
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateWords);
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', updateWords);
  updateWords();
}

// ============================================================================
// 5. INTERACTIVE 3D 360° ROOFING PROFILES STUDIO
// ============================================================================
function initRoofStudio3D() {
  const stageEl = document.getElementById('roof3DCanvasMount');
  const skeletonEl = document.getElementById('viewer3DSkeleton');
  if (!stageEl) return;

  let activeProfileId = 'longspan';
  let activeColorId = 'red';

  const profileTitleEl = document.getElementById('studioProfileTitle');
  const profileSummaryEl = document.getElementById('studioProfileSummary');
  const specsListEl = document.getElementById('studioSpecsList');
  const activeBadgeEl = document.getElementById('studioActiveBadge');
  const colorNameEl = document.getElementById('studioColorName');
  const colorHexEl = document.getElementById('studioColorHex');
  const quoteLinkEl = document.getElementById('studioQuoteLink');
  const swatchMount = document.getElementById('studioSwatchMount');
  const profileBtns = document.querySelectorAll('[data-profile-select]');
  const presetBtns = document.querySelectorAll('[data-cam-preset]');
  const zoomInBtn = document.getElementById('studioZoomIn');
  const zoomOutBtn = document.getElementById('studioZoomOut');
  const autoRotateBtn = document.getElementById('studioAutoRotate');

  let viewer = null;
  try {
    viewer = createRoof3DViewer(stageEl, {
      profile: activeProfileId,
      colorId: activeColorId,
      autoRotate: true,
    });
    if (skeletonEl) {
      skeletonEl.classList.add('hidden');
    }
  } catch (err) {
    if (skeletonEl) {
      skeletonEl.innerHTML =
        '<p class="body-5 text-[#4A4A48] px-6 text-center">3D preview requires WebGL support in your browser. Select any profile and color on the right to continue to your quote.</p>';
      skeletonEl.classList.remove('skeleton-pulse');
    }
  }

  // Render 5 brochure color swatches
  if (swatchMount) {
    swatchMount.innerHTML = ROOF_COLORS.map(
      (col) => `
      <button
        type="button"
        role="radio"
        aria-checked="${col.id === activeColorId}"
        aria-label="${col.name}"
        data-color-select="${col.id}"
        class="color-swatch-btn w-10 h-10 rounded-full border border-black/15 flex items-center justify-center cursor-pointer"
        style="background-color: ${col.hex};"
        title="${col.name}"
      >
        <span class="sr-only">${col.name}</span>
      </button>
    `
    ).join('');
  }

  function syncStudioUI() {
    const profile = getProfileById(activeProfileId);
    const color = getColorById(activeColorId);

    if (profileTitleEl) profileTitleEl.textContent = profile.name;
    if (profileSummaryEl) profileSummaryEl.textContent = profile.summary;
    if (activeBadgeEl) {
      activeBadgeEl.textContent = `${profile.shortName} · ${color.name}`;
    }
    if (colorNameEl) colorNameEl.textContent = color.name;
    if (colorHexEl) colorHexEl.textContent = color.hex;

    if (specsListEl) {
      specsListEl.innerHTML = profile.specs
        .map(
          (spec, idx) => `
          ${idx > 0 ? '<div class="h-px w-full bg-black/10"></div>' : ''}
          <div class="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span class="caption-1 text-[#6E6E6A]">${spec.label}</span>
            <span class="body-4 text-[#181818] sm:text-right">${spec.value}</span>
          </div>
        `
        )
        .join('');
    }

    profileBtns.forEach((btn) => {
      const isSelected = btn.getAttribute('data-profile-select') === activeProfileId;
      btn.setAttribute('aria-pressed', String(isSelected));
      if (isSelected) {
        btn.className =
          'btn-interactive py-2 px-3 rounded-lg bg-[#9E1B22] text-white button-sm text-center cursor-pointer';
      } else {
        btn.className =
          'btn-interactive py-2 px-3 rounded-lg bg-transparent text-[#4A4A48] hover:text-[#181818] button-sm text-center cursor-pointer';
      }
    });

    if (swatchMount) {
      swatchMount.querySelectorAll('[data-color-select]').forEach((sw) => {
        const isSelected = sw.getAttribute('data-color-select') === activeColorId;
        sw.setAttribute('aria-checked', String(isSelected));
      });
    }

    if (quoteLinkEl) {
      quoteLinkEl.href = `./quote.html?profile=${encodeURIComponent(activeProfileId)}&color=${encodeURIComponent(activeColorId)}`;
    }
  }

  profileBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextProfile = btn.getAttribute('data-profile-select');
      if (!nextProfile || nextProfile === activeProfileId) return;
      activeProfileId = nextProfile;
      if (viewer) viewer.setProfile(activeProfileId);
      syncStudioUI();
    });
  });

  if (swatchMount) {
    swatchMount.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-color-select]');
      if (!btn) return;
      const nextColor = btn.getAttribute('data-color-select');
      if (!nextColor) return;
      activeColorId = nextColor;
      if (viewer) viewer.setColor(activeColorId);
      syncStudioUI();
    });
  }

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-cam-preset');
      if (viewer && preset) {
        viewer.setPresetView(preset);
      }
      presetBtns.forEach((b) => {
        const active = b === btn;
        b.className = active
          ? 'btn-interactive py-1 px-2 rounded-md bg-[#181818] text-white caption-3 cursor-pointer'
          : 'btn-interactive py-1 px-2 rounded-md bg-white text-[#4A4A48] hover:text-[#181818] border border-black/10 caption-3 cursor-pointer';
      });
    });
  });

  if (zoomInBtn && viewer) {
    zoomInBtn.addEventListener('click', () => viewer.zoomIn());
  }
  if (zoomOutBtn && viewer) {
    zoomOutBtn.addEventListener('click', () => viewer.zoomOut());
  }
  if (autoRotateBtn && viewer) {
    autoRotateBtn.addEventListener('click', () => {
      const next = !viewer.getAutoRotate();
      viewer.setAutoRotate(next);
      autoRotateBtn.setAttribute('aria-pressed', String(next));
      autoRotateBtn.textContent = next ? 'Auto spin: On' : 'Auto spin: Off';
    });
  }

  syncStudioUI();
}

// ============================================================================
// 6. ACCESSIBLE FAQ ACCORDION & LEGAL DIALOG MODAL
// ============================================================================
function initFaqAccordion() {
  const triggers = document.querySelectorAll('[data-faq-trigger]');
  triggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const panelId = btn.getAttribute('aria-controls');
      const panel = panelId ? document.getElementById(panelId) : null;

      btn.setAttribute('aria-expanded', String(!expanded));
      if (panel) {
        panel.classList.toggle('hidden', expanded);
      }
    });
  });
}

function initLegalModal() {
  const modal = document.getElementById('legalModal');
  const modalTitle = document.getElementById('legalModalTitle');
  const modalBody = document.getElementById('legalModalBody');
  const closeBtn = document.getElementById('closeLegalModal');
  const openBtns = document.querySelectorAll('[data-legal-open]');

  if (!modal || !modalTitle || !modalBody) return;

  const CONTENT = {
    privacy: {
      title: 'Privacy policy',
      body: `
        <p class="body-3 text-[#4A4A48]">CAB Steel Metal Fabrication collects only the contact and roofing specification details you voluntarily enter when preparing a roofing quote or contacting our Taal, Batangas plant.</p>
        <p class="body-3 text-[#4A4A48] mt-4">Your name, phone number, project location, and sheet cut list are used solely to confirm coil stock availability, compute custom sheet fabrication pricing, and coordinate pickup or delivery from Brgy Halang, Bypass Rd. Taal, Batangas.</p>
        <p class="body-3 text-[#4A4A48] mt-4">We never sell or rent customer contact records to third parties. To update or remove an inquiry record, call or message us directly at 0918 408 0396.</p>
      `,
    },
    terms: {
      title: 'Terms of quotation and fabrication',
      body: `
        <p class="body-3 text-[#4A4A48]">Online quote estimates reflect CAB Steel Metal Fabrication brochure rates per linear meter: Premium (₱455 Long Span / ₱525 Tile Span), Original (₱370 Long Span / ₱440 Tile Span), and Economy (₱270 Long Span / ₱340 Tile Span).</p>
        <p class="body-3 text-[#4A4A48] mt-4">Because every order is roll formed and cut to your custom sheet lengths in house, final production begins upon order confirmation with our Batangas plant team. Bulk order and repeat contractor discounts are confirmed prior to fabrication.</p>
        <p class="body-3 text-[#4A4A48] mt-4">Site delivery within 3 km of CAB Steel in Brgy Halang, Taal, Batangas is free of charge. Delivery distances exceeding 3 km are billed at ₱150 per excess kilometer based on verified road distance.</p>
      `,
    },
  };

  openBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-legal-open');
      const item = CONTENT[key] || CONTENT.privacy;
      modalTitle.textContent = item.title;
      modalBody.innerHTML = item.body;
      if (typeof modal.showModal === 'function') {
        modal.showModal();
      } else {
        modal.removeAttribute('hidden');
      }
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (typeof modal.close === 'function') {
        modal.close();
      } else {
        modal.setAttribute('hidden', '');
      }
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal && typeof modal.close === 'function') {
      modal.close();
    }
  });
}

// Initialize all modules cleanly
document.addEventListener('DOMContentLoaded', () => {
  initHeroFrameSequence();
  initNavigation();
  initSectionReveals();
  initTaglineReveal();
  initRoofStudio3D();
  initFaqAccordion();
  initLegalModal();
});

