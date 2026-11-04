import React, { useEffect, useRef, useState } from 'react';

const TOTAL_FRAMES = 239;

function getFramePath(index) {
  const frameNum = String(index + 1).padStart(4, '0');
  return `/ezgif-8e1e996d95d816b7-jpg/frame-${frameNum}.png`;
}

export default function HeroSection() {
  const canvasRef = useRef(null);
  const trackRef = useRef(null);
  const [scrollPercent, setScrollPercent] = useState(0);

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

      const verticalOffset = ch * 0.13;
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
      setScrollPercent(Math.round(scrollFraction * 100));
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
      style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
      className="relative w-full h-[400vh] bg-[#DCDCDC] text-[#18181A] antialiased selection:bg-[#A81B22] selection:text-white"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800;900&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
        .font-brochure {
          font-family: 'Barlow Condensed', Impact, sans-serif;
          letter-spacing: 0.01em;
        }
        .outline-red {
          color: transparent;
          -webkit-text-stroke: 2.2px #A81B22;
          letter-spacing: 0.02em;
        }
        .studio-ambient-vignette {
          pointer-events-none;
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 90% 70% at 50% 50%, transparent 45%, rgba(0, 0, 0, 0.12) 100%);
          mix-blend-mode: multiply;
        }
      `}</style>

      {/* Sticky Fullscreen Viewport */}
      <section className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col justify-between">
        {/* Fullscreen Frame-Sequence Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        />

        {/* Soft seamless studio ambient lighting */}
        <div className="studio-ambient-vignette z-[4]" />

        {/* Top Navigation Bar */}
        <header className="relative z-20 w-full px-6 sm:px-12 lg:px-16 pt-6 flex items-center justify-between">
          <a href="#" className="flex items-center">
            <img
              src="/images/cabsteel-logo.png"
              alt="CAB STEEL Metal Fabrication"
              className="h-14 sm:h-16 w-auto object-contain block"
            />
          </a>

          <nav className="flex items-center gap-6 sm:gap-9 text-xs sm:text-[13px] font-extrabold uppercase tracking-wider text-[#18181A]">
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
              className="px-6 py-2.5 rounded-full bg-[#A81B22] text-white text-xs sm:text-[13px] font-black uppercase hover:bg-[#8c141a] shadow-sm transition-all"
            >
              GET A QUOTE
            </a>
          </nav>
        </header>

        {/* Headline with Brochure Font + Hollow Red "THE BEST" */}
        <div className="relative z-10 w-full px-4 text-center mt-6 sm:mt-10 lg:mt-12 pointer-events-none select-none">
          <h1 className="font-brochure font-black text-6xl sm:text-8xl lg:text-[104px] uppercase tracking-tight leading-[0.92] text-[#18181A]">
            YOUR ROOF DESERVES <span className="outline-red ml-1 sm:ml-2">THE BEST</span>
          </h1>
        </div>

        <div className="flex-1" />

        {/* Bottom Center Dynamic Scroll Progress Bar */}
        <div className="relative z-20 pb-8 flex items-center justify-center select-none">
          <div className="w-36 sm:w-44 h-[3px] bg-black/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#A81B22] transition-all duration-75 rounded-full"
              style={{ width: `${scrollPercent}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
