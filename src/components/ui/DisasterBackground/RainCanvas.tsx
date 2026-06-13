'use client';

import React, { useEffect, useRef, useState } from 'react';

class RainDrop {
  x: number = 0;
  y: number = 0;
  length: number = 0;
  speed: number = 0;
  opacity: number = 0;
  width: number = 0;
  heightLimit: number = 0;

  constructor(width: number, height: number, isInitial: boolean = false) {
    this.reset(width, height, isInitial);
  }

  reset(width: number, height: number, isInitial: boolean = false) {
    this.x = Math.random() * (width + 150) - 75;
    this.y = isInitial ? Math.random() * height : -80;
    this.length = 20 + Math.random() * 25;
    this.speed = 14 + Math.random() * 14;
    
    const depth = Math.random();
    if (depth > 0.8) {
      this.width = 1.4 + Math.random() * 0.8;
      this.opacity = 0.35 + Math.random() * 0.15;
      this.speed += 5;
    } else if (depth > 0.45) {
      this.width = 0.8 + Math.random() * 0.5;
      this.opacity = 0.22 + Math.random() * 0.1;
    } else {
      this.width = 0.4 + Math.random() * 0.3;
      this.opacity = 0.08 + Math.random() * 0.08;
      this.speed -= 4;
    }
    this.heightLimit = height - (Math.random() * 15);
  }

  update(width: number, height: number, wind: number) {
    this.y += this.speed;
    this.x += wind;

    if (this.y > this.heightLimit) {
      return true;
    }
    return false;
  }

  draw(ctx: CanvasRenderingContext2D, wind: number) {
    ctx.strokeStyle = `rgba(180, 215, 255, ${this.opacity})`;
    ctx.lineWidth = this.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + wind * 0.8, this.y + this.length);
    ctx.stroke();
  }
}

class Splash {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  gravity: number = 0.22;
  opacity: number = 1.0;
  size: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 5;
    this.vy = -Math.random() * 2.5 - 1;
    this.size = 0.6 + Math.random() * 1.0;
    this.opacity = 0.7 + Math.random() * 0.3;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.opacity -= 0.05;
    return this.opacity <= 0;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgba(180, 220, 255, ${Math.max(0, this.opacity)})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

class WindStreak {
  x: number = 0;
  y: number = 0;
  length: number = 0;
  speed: number = 0;
  opacity: number = 0;
  width: number = 0;
  amplitude: number = 0;
  frequency: number = 0;

  constructor(width: number, height: number, isInitial: boolean = false) {
    this.reset(width, height, isInitial);
  }

  reset(width: number, height: number, isInitial: boolean = false) {
    this.x = isInitial ? Math.random() * width : width + 100;
    this.y = Math.random() * height * 0.9;
    this.length = 100 + Math.random() * 160;
    this.speed = 4 + Math.random() * 6;
    this.opacity = 0.05 + Math.random() * 0.09;
    this.width = 0.5 + Math.random() * 0.8;
    this.amplitude = 4 + Math.random() * 6;
    this.frequency = 0.005 + Math.random() * 0.005;
  }

  update(width: number, height: number) {
    this.x -= this.speed;
    if (this.x < -this.length - 100) {
      this.reset(width, height);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = `rgba(192, 57, 43, ${this.opacity * 0.35})`;
    ctx.lineWidth = this.width;
    ctx.beginPath();
    for (let offset = 0; offset < this.length; offset += 5) {
      const px = this.x + offset;
      const py = this.y + Math.sin(px * this.frequency) * this.amplitude;
      if (offset === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.6})`;
    ctx.lineWidth = this.width * 0.8;
    ctx.beginPath();
    for (let offset = 20; offset < this.length - 20; offset += 5) {
      const px = this.x + offset;
      const py = this.y + Math.sin(px * this.frequency) * this.amplitude;
      if (offset === 20) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }
}

class SunRay {
  x: number = 0;
  width: number = 0;
  opacity: number = 0;
  pulseSpeed: number = 0;
  time: number = 0;

  constructor(width: number) {
    this.x = Math.random() * width;
    this.width = 120 + Math.random() * 180;
    this.opacity = 0.02 + Math.random() * 0.04;
    this.pulseSpeed = 0.003 + Math.random() * 0.006;
    this.time = Math.random() * 100;
  }

  update() {
    this.time += this.pulseSpeed;
  }

  draw(ctx: CanvasRenderingContext2D, height: number, timeOfDay: 'day' | 'evening' | 'night') {
    const currentOpacity = this.opacity * (0.4 + Math.sin(this.time) * 0.6);
    
    let fillStyle = `rgba(255, 242, 215, ${currentOpacity})`; // Day light rays
    if (timeOfDay === 'evening') {
      fillStyle = `rgba(255, 100, 30, ${currentOpacity * 0.85})`; // Sunset orange beams
    } else if (timeOfDay === 'night') {
      fillStyle = `rgba(224, 240, 255, ${currentOpacity * 0.22})`; // Moonlight cool rays
    }

    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(this.x, 0);
    ctx.lineTo(this.x + this.width, 0);
    ctx.lineTo(this.x + this.width - 200, height);
    ctx.lineTo(this.x - 200, height);
    ctx.closePath();
    ctx.fill();
  }
}

class SunParticle {
  x: number = 0;
  y: number = 0;
  vx: number = 0;
  vy: number = 0;
  size: number = 0;
  opacity: number = 0;
  time: number = 0;
  oscSpeed: number = 0;

  constructor(width: number, height: number, isInitial: boolean = false) {
    this.reset(width, height, isInitial);
  }

  reset(width: number, height: number, isInitial: boolean = false) {
    this.x = Math.random() * width;
    this.y = isInitial ? Math.random() * height : height + 20;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = -(0.4 + Math.random() * 0.8);
    this.size = 0.8 + Math.random() * 2.2;
    this.opacity = 0.08 + Math.random() * 0.22;
    this.time = Math.random() * 100;
    this.oscSpeed = 0.01 + Math.random() * 0.025;
  }

  update(width: number, height: number) {
    this.y += this.vy;
    this.x += this.vx + Math.sin(this.time) * 0.15;
    this.time += this.oscSpeed;

    if (this.y < -20 || this.x < -20 || this.x > width + 20) {
      this.reset(width, height);
    }
  }

  draw(ctx: CanvasRenderingContext2D, timeOfDay: 'day' | 'evening' | 'night') {
    let fillStyle = `rgba(255, 218, 140, ${this.opacity})`; // Day golden dust
    if (timeOfDay === 'evening') {
      fillStyle = `rgba(255, 120, 40, ${this.opacity * 1.25})`; // Sunset glowing embers
    } else if (timeOfDay === 'night') {
      fillStyle = `rgba(240, 248, 255, ${this.opacity * 1.6})`; // Star sparkles
    }

    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}



export default function RainCanvas({ 
  rainEnabled = true,
  weatherType = 'sunny',
  timeOfDay = 'day'
}: { 
  rainEnabled?: boolean;
  weatherType?: 'sunny' | 'rain' | 'storm' | 'cloudy';
  timeOfDay?: 'day' | 'evening' | 'night';
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const parent = canvas.parentElement;
    
    let width = (canvas.width = parent ? parent.clientWidth : window.innerWidth);
    let height = (canvas.height = parent ? parent.clientHeight : 600);

    const wind = -3.2;
    const drops: RainDrop[] = [];
    const splashes: Splash[] = [];
    const windStreaks: WindStreak[] = [];
    const sunRays: SunRay[] = [];
    const sunParticles: SunParticle[] = [];

    // Initialize rain drops
    const dropDensity = Math.floor((width * height) / 8000);
    const maxDrops = Math.min(dropDensity, 150);
    for (let i = 0; i < maxDrops; i++) {
      drops.push(new RainDrop(width, height, true));
    }

    // Initialize air stream streaks
    const streakCount = Math.floor(width / 150);
    for (let i = 0; i < streakCount; i++) {
      windStreaks.push(new WindStreak(width, height, true));
    }

    // Initialize sun rays
    for (let i = 0; i < 5; i++) {
      sunRays.push(new SunRay(width));
    }

    // Initialize solar dust shimmers
    for (let i = 0; i < 35; i++) {
      sunParticles.push(new SunParticle(width, height, true));
    }



    const handleResize = () => {
      if (!canvas) return;
      const currentParent = canvas.parentElement;
      width = canvas.width = currentParent ? currentParent.clientWidth : window.innerWidth;
      height = canvas.height = currentParent ? currentParent.clientHeight : 600;
    };
    window.addEventListener('resize', handleResize);

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw air streaks (Always active in background)
      windStreaks.forEach((streak) => {
        streak.update(width, height);
        streak.draw(ctx);
      });

      // 2. Weather Dependent Animations
      if (rainEnabled) {
        // Draw and update rain
        drops.forEach((drop) => {
          const collided = drop.update(width, height, wind);
          if (collided) {
            const splashCount = 2 + Math.floor(Math.random() * 3);
            for (let s = 0; s < splashCount; s++) {
              splashes.push(new Splash(drop.x, drop.y));
            }
            drop.reset(width, height);
          }
          drop.draw(ctx, wind);
        });

        // Draw and update splashes
        for (let i = splashes.length - 1; i >= 0; i--) {
          const splash = splashes[i];
          const expired = splash.update();
          if (expired) {
            splashes.splice(i, 1);
          } else {
            splash.draw(ctx);
          }
        }
      } else if (weatherType === 'sunny') {

        // Draw shifting sun/moon light rays
        sunRays.forEach((ray) => {
          ray.update();
          ray.draw(ctx, height, timeOfDay);
        });

        // Draw floating solar/sunset/starry particles
        sunParticles.forEach((particle) => {
          particle.update(width, height);
          particle.draw(ctx, timeOfDay);
        });
      }

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [mounted, rainEnabled, weatherType, timeOfDay]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3,
        opacity: 0.9,
      }}
    />
  );
}
