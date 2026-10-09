"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { useReveal } from "@/hooks/use-reveal";
import type { HomeContent } from "@/data/content";
import { BrandGlow } from "@/components/ui/page-hero";
import { CtaButton } from "@/components/ui/cta-button";

const Counter = ({
  value,
  decimals = 0,
  delay = 0,
}: {
  value: number;
  decimals?: number;
  delay?: number;
}) => {
  const [display, setDisplay] = useState((0).toFixed(decimals));
  useGSAP(() => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: value,
      duration: 3.5,
      delay,
      ease: "expo",
      onUpdate: () => setDisplay(obj.v.toFixed(decimals)),
    });
  }, []);
  return <span>{display}</span>;
};

const MolecularBackground = ({
  mousePosition,
}: {
  mousePosition: React.MutableRefObject<{ x: number; y: number }>;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim();
    let particles: Particle[] = [];
    let frame: number;
    let time = 0;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseVx: number;
      baseVy: number;
      size: number;
      type: "dot" | "plus" | "hollow";
      pulseOffset: number;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.baseVx = (Math.random() - 0.5) * 0.1;
        this.baseVy = (Math.random() - 0.5) * 0.1;
        this.vx = this.baseVx;
        this.vy = this.baseVy;
        this.size = Math.random() * 1.5 + (isMobile ? 1 : 1.2);
        this.pulseOffset = Math.random() * Math.PI * 2;
        const rand = Math.random();
        this.type = rand > 0.85 ? "plus" : rand > 0.65 ? "hollow" : "dot";
      }

      update(w: number, h: number) {
        const dx = this.x - mousePosition.current.x;
        const dy = this.y - mousePosition.current.y;
        const distSq = dx * dx + dy * dy;
        const radius = isMobile ? 120 : 250;

        if (distSq < radius * radius) {
          const dist = Math.sqrt(distSq);
          const force = (radius - dist) / 7000;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }

        this.vx *= 0.98;
        this.vy *= 0.98;
        this.vx += (this.baseVx - this.vx) * 0.01;
        this.vy += (this.baseVy - this.vy) * 0.01;
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = w;
        else if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        else if (this.y > h) this.y = 0;
      }

      draw(ctx: CanvasRenderingContext2D, time: number, color: string) {
        const pulse = Math.sin(time + this.pulseOffset) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.globalAlpha = pulse * 0.8;
        ctx.strokeStyle = ctx.fillStyle = color;
        ctx.lineWidth = 1.2;

        if (this.type === "plus") {
          const s = this.size * 1.8;
          ctx.moveTo(this.x - s, this.y);
          ctx.lineTo(this.x + s, this.y);
          ctx.moveTo(this.x, this.y - s);
          ctx.lineTo(this.x, this.y + s);
          ctx.stroke();
        } else if (this.type === "hollow") {
          ctx.arc(this.x, this.y, this.size * 1.4, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const init = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      particles = Array.from(
        { length: isMobile ? 35 : 75 },
        () => new Particle(canvas.width, canvas.height),
      );
    };

    const draw = () => {
      time += 0.012;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update(canvas.width, canvas.height);
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < (isMobile ? 8100 : 22500)) {
            ctx.save();
            ctx.beginPath();
            ctx.globalAlpha =
              (1 - Math.sqrt(dSq) / (isMobile ? 90 : 150)) * 0.45;
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 1.2;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
        p1.draw(ctx, time, accentColor);
      }
      frame = requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", init);
    };
  }, [mousePosition]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-70 mix-blend-plus-lighter"
    />
  );
};

export default function HeroSection({ sectors, stats, tagline }: HomeContent) {
  const [index, setIndex] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const mousePosition = useRef({ x: -1000, y: -1000 });

  const contentRef = useReveal<HTMLDivElement>();
  const statsScope = useReveal<HTMLDivElement>({
    y: 24,
    blur: 0,
    stagger: 0.12,
    delay: 1.1,
    duration: 0.7,
  });
  const sectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(
      () => setIndex((i) => (i + 1) % sectors.length),
      4500,
    );
    return () => clearInterval(t);
  }, []);

  useGSAP(
    () => {
      gsap.fromTo(
        sectorRef.current,
        { y: 20, autoAlpha: 0, filter: "blur(10px)" },
        {
          y: 0,
          autoAlpha: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "expo",
        },
      );
    },
    { dependencies: [index] },
  );

  // Scrub parallax exit: content fades + drifts up faster, the stats bar drifts
  // slower for depth, as the hero scrolls away.
  useGSAP(
    () => {
      if (!sectionRef.current) return;
      gsap.to(contentRef.current, {
        yPercent: -12,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
      gsap.to(statsScope.current, {
        yPercent: -6,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: sectionRef },
  );

  const handleInteraction = (e: any) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    mousePosition.current = { x: clientX - rect.left, y: clientY - rect.top };
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleInteraction}
      onTouchMove={handleInteraction}
      data-header-theme={"dark"}
      className="relative min-h-screen flex flex-col justify-between bg-background text-foreground overflow-hidden"
    >
      <BrandGlow />
      <MolecularBackground mousePosition={mousePosition} />

      <div
        ref={contentRef}
        className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-10 pt-24 pb-12 flex-1 flex flex-col items-center justify-center"
      >
        <div
          data-reveal
          className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12"
        >
          <div className="h-px w-5 md:w-12 bg-accent/60 shrink-0" />
          <span className="text-[11px] sm:text-sm uppercase tracking-[0.3em] sm:tracking-[0.5em] font-bold text-accent text-center whitespace-nowrap">
            Est. 2008 · Chemical Engineering
          </span>
          <div className="h-px w-5 md:w-12 bg-accent/60 shrink-0" />
        </div>

        <h1
          data-reveal
          className="text-5xl sm:text-7xl md:text-[8rem] lg:text-[10rem] font-bold tracking-[-0.04em] leading-[0.9] text-foreground mb-8 md:mb-12 text-center"
        >
          SM <span className="font-light italic text-muted">Chemicals</span>
        </h1>

        <div
          data-reveal
          className="flex flex-col items-center w-full mb-8 md:mb-12"
        >
          <span className="text-[11px] md:text-[11px] uppercase tracking-[0.4em] md:tracking-[0.6em] text-muted font-bold mb-3">
            Engineering Chemicals for
          </span>
          <div className="relative h-10 md:h-16 w-full flex justify-center items-center">
            <div
              ref={sectorRef}
              className="absolute text-2xl sm:text-3xl md:text-5xl font-light text-sky tracking-tight text-center"
            >
              {sectors[index].toUpperCase()}
            </div>
          </div>
        </div>

        <p
          data-reveal
          className="max-w-xs sm:max-w-md md:max-w-2xl text-center text-foreground/75 text-base sm:text-lg md:text-xl font-light tracking-wide leading-relaxed mb-10 md:mb-12"
        >
          {tagline}
        </p>

        <div
          data-reveal
          className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto px-4 sm:px-0"
        >
          <CtaButton href="/products" className="w-full sm:w-auto">
            Explore Products
            <FlaskConical className="w-4 h-4" />
          </CtaButton>
          <CtaButton
            href="/about#milestones"
            variant="outline"
            className="w-full sm:w-auto"
          >
            Our Journey
            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </CtaButton>
        </div>
      </div>

      <div className="relative z-10 w-full border-t border-line bg-deep/60 backdrop-blur-sm">
        <div
          ref={statsScope}
          className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-8 md:py-12 grid grid-cols-2 md:grid-cols-5 gap-y-8 gap-x-6"
        >
          {stats.map((s, i) => (
            <div
              key={i}
              data-reveal
              className="flex flex-col items-center md:items-start group cursor-default"
            >
              <div className="flex items-baseline mb-1">
                <span className="text-2xl sm:text-4xl md:text-5xl font-extralight tracking-tighter text-foreground">
                  <Counter
                    value={s.value}
                    decimals={s.decimals}
                    delay={1.1 + i * 0.12}
                  />
                </span>
                <span className="text-base sm:text-lg md:text-2xl text-accent ml-0.5 font-bold tracking-normal">
                  {s.suffix}
                </span>
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted group-hover:text-accent transition-colors duration-500">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
