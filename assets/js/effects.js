// ============================================
// عادل - Visual Effects System
// assets/js/effects.js
// ============================================

const EffectsSystem = (() => {
  
  // ── DOM Particles (for UI screens) ──
  function spawnParticle(x, y, emoji, count = 5) {
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      el.textContent = emoji;
      el.style.left = (x + (Math.random() - 0.5) * 80) + 'px';
      el.style.top = y + 'px';
      el.style.fontSize = (1 + Math.random()) + 'rem';
      el.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  function spawnCollectEffect(x, y, text) {
    const emojis = ['⭐', '✨', '🌟', '💫'];
    emojis.forEach(e => spawnParticle(x, y, e, 2));
    
    // floating score text
    const score = document.createElement('div');
    score.style.cssText = `
      position:fixed; left:${x}px; top:${y}px;
      font-family:'Fredoka One',cursive; font-size:1.5rem;
      color:#FFD700; text-shadow:2px 2px 4px rgba(0,0,0,0.5);
      pointer-events:none; z-index:999;
      animation: floatParticle 1s ease-out forwards;
    `;
    score.textContent = text;
    document.body.appendChild(score);
    score.addEventListener('animationend', () => score.remove());
  }

  // ── Canvas Particle System ──
  class CanvasParticles {
    constructor() {
      this.particles = [];
    }

    spawn(x, y, options = {}) {
      const {
        emoji = '⭐',
        count = 8,
        speed = 3,
        life = 60,
        color = '#FFD700',
        type = 'burst'
      } = options;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i;
        const s = speed * (0.5 + Math.random());
        this.particles.push({
          x, y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s - 2,
          life,
          maxLife: life,
          emoji,
          color,
          size: 16 + Math.random() * 10,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.2,
          type,
        });
      }
    }

    spawnTrail(x, y, color = '#FFD700') {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 1,
        vy: -Math.random() * 2,
        life: 20,
        maxLife: 20,
        emoji: null,
        color,
        size: 6 + Math.random() * 6,
        rotation: 0,
        rotSpeed: 0,
        type: 'circle',
      });
    }

    update() {
      this.particles = this.particles.filter(p => p.life > 0);
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life--;
        p.rotation += p.rotSpeed;
        p.vx *= 0.96;
      });
    }

    draw(ctx) {
      this.particles.forEach(p => {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.emoji) {
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.emoji, 0, 0);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });
    }

    clear() { this.particles = []; }
  }

  // ── Screen Flash ──
  function flashScreen(color = 'white', duration = 200) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; inset:0; background:${color}; opacity:0.5;
      pointer-events:none; z-index:500;
      transition: opacity ${duration}ms ease;
    `;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = '0';
    });
    setTimeout(() => el.remove(), duration + 50);
  }

  // ── Achievement Toast ──
  function showAchievementToast(achievement) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      background: linear-gradient(135deg, #1A1A2E, #16213E);
      border: 2px solid gold;
      border-radius: 20px;
      padding: 16px 24px;
      color: white;
      font-family: 'Tajawal', sans-serif;
      text-align: center;
      z-index: 1000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(255,215,0,0.3);
      transition: transform 0.4s cubic-bezier(0.4,0,0.2,1);
      direction: rtl;
      min-width: 240px;
    `;
    toast.innerHTML = `
      <div style="font-size:2rem">${achievement.icon}</div>
      <div style="font-weight:700;font-size:0.9rem;color:gold">إنجاز جديد!</div>
      <div style="font-weight:900;font-size:1.1rem">${achievement.name}</div>
      <div style="font-size:0.8rem;color:#CCC">${achievement.desc}</div>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.transform = 'translateX(-50%) translateY(-100px)';
      setTimeout(() => toast.remove(), 400);
    }, 3000);

    AudioSystem.playAchievement();
  }

  // ── Weather Effects (Canvas) ──
  class WeatherSystem {
    constructor() {
      this.drops = [];
      this.type = 'sunny'; // sunny | cloudy | rain
    }

    setType(type) { this.type = type; }

    update(width, height) {
      if (this.type !== 'rain') return;
      // Add rain drops
      if (this.drops.length < 50) {
        this.drops.push({
          x: Math.random() * width,
          y: -10,
          speed: 4 + Math.random() * 4,
          length: 10 + Math.random() * 10,
        });
      }
      this.drops.forEach(d => {
        d.y += d.speed;
        d.x -= 1;
      });
      this.drops = this.drops.filter(d => d.y < height + 20);
    }

    draw(ctx, width, height) {
      if (this.type === 'rain') {
        ctx.save();
        ctx.strokeStyle = 'rgba(150,200,255,0.4)';
        ctx.lineWidth = 1.5;
        this.drops.forEach(d => {
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - 2, d.y + d.length);
          ctx.stroke();
        });
        ctx.restore();
      }
    }
  }

  return {
    spawnParticle,
    spawnCollectEffect,
    CanvasParticles,
    WeatherSystem,
    flashScreen,
    showAchievementToast,
  };
})();
