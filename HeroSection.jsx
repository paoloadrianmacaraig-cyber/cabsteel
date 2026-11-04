import React, { useEffect, useRef } from 'react';

const TOTAL_FRAMES = 239;

function getFramePath(index) {
  const frameNum = String(index + 1).padStart(4, '0');
  return `/ezgif-8e1e996d95d816b7-jpg/frame-${frameNum}.jpg`;
}

export default function HeroSection() {
  const canvasRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const track = trackRef.current;
    if (!canvas || !track) return;

    const ctx = canvas.getContext('2d');
    const images = new Array(TOTAL_FRAMES);
    let targetFrame = 0;
    let currentFrame = 0;
    let rafId;

    const drawFrameSpacious = (img) => {
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;

      const scale = Math.max(cw / iw, ch / ih);
      const sw = iw * scale;
      const sh = ih * scale;
      const sx = (cw - sw) / 2;

      const verticalOffset = ch * 0.08;
      const sy = (ch - sh) / 2 + verticalOffset;

      if (sy > 0) {
        ctx.drawImage(img, 0, 0, iw, 4, sx, 0, sw, sy + 2);
      }

      ctx.drawImage(img, 0, 0, iw, ih, sx, sy, sw, sh);
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      drawFrameSpacious(images[Math.round(currentFrame)] || images[0]);
    };

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFramePath(i);
      if (i === 0) {
        img.onload = () => resizeCanvas();
      }
      images[i] = img;
    }

    const onScroll = () => {
      const maxScroll = track.offsetHeight - window.innerHeight;
      const scrollFraction = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      targetFrame = scrollFraction * (TOTAL_FRAMES - 1);
    };

    const tick = () => {
      currentFrame += (targetFrame - currentFrame) * 0.16;
      const frameIndex = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentFrame)));
      const frameImg = images[frameIndex];
      if (frameImg && frameImg.complete) {
        drawFrameSpacious(frameImg);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', onScroll, { passive: true });
    resizeCanvas();
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={trackRef}
      style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif" }}
      className="relative w-full h-[400vh] bg-[#DCDCDC] text-[#18181A] antialiased selection:bg-[#A81B22] selection:text-white"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=Montserrat:wght@900&display=swap');
        .font-logo {
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 900;
          letter-spacing: -0.02em;
        }
      `}</style>

      {/* Sticky Fullscreen Viewport */}
      <section className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col justify-between">
        {/* Fullscreen Frame-Sequence Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        />

        {/* Top Navigation Bar */}
        <header className="relative z-20 w-full px-6 sm:px-12 lg:px-16 pt-6 flex items-center justify-between">
          <a href="#" className="flex items-center group">
            <img
              src="/images/cabsteel-logo.png"
              alt="CAB STEEL Metal Fabrication"
              className="h-14 sm:h-16 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </a>

          <nav className="flex items-center gap-6 sm:gap-9 font-logo text-xs sm:text-[13px] uppercase text-[#18181A]">
            <a href="#" className="hidden md:inline-block hover:text-[#A81B22] transition-colors">
              HOME
            </a>
            <a href="#" className="hidden md:inline-block hover:text-[#A81B22] transition-colors">
              ABOUT US
            </a>
            <a href="#" className="hidden md:inline-block hover:text-[#A81B22] transition-colors">
              WHY US?
            </a>
            <a href="#" className="hidden md:inline-block hover:text-[#A81B22] transition-colors">
              PRODUCTS
            </a>
            <a
              href="tel:09184080396"
              class="px-6 py-2.5 rounded-full bg-[#A81B22] text-white text-xs sm:text-[13px] font-black uppercase hover:bg-[#8c141a] shadow-sm transition-all"
            >
              GET A QUOTE
            </a>
          </nav>
        </header>

        {/* Headline Positioned with Logo Font Geometry */}
        <div className="relative z-10 w-full px-4 text-center mt-6 sm:mt-10 lg:mt-12 pointer-events-none select-none">
          <h1 className="text-5xl sm:text-7xl lg:text-[88px] font-black uppercase tracking-tight leading-[0.94] text-[#18181A]">
            YOUR ROOF DESERVES <span className="text-[#A81B22]">THE BEST</span>
          </h1>
        </div>

        <div className="flex-1" />

        {/* Bottom Center Scroll Indicator */}
        <div className="relative z-20 pb-7 flex items-center justify-center gap-3 text-[#18181A]/80 text-sm sm:text-base font-extrabold uppercase tracking-[0.22em] select-none">
          <span>SCROLL</span>
          <span className="w-12 h-[2px] bg-[#A81B22] inline-block" />
        </div>
      </section>
    </div>
  );
}
