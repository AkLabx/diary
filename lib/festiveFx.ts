/**
 * Diwali Fireworks & Fine Pyrotechnics Engine
 * 100% Free, zero-dependency, hardware-accelerated Canvas & Web Audio API synthesizer.
 * Features needle-sharp velocity streaks, 4-point diamond sparkle glints,
 * secondary branching cracklers, clay Anar fountain streaks, and authentic acoustic synthesis.
 */

export function isFestiveSoundEnabled(): boolean {
  try {
    const val = localStorage.getItem('diary_festive_sound');
    return val !== 'false';
  } catch {
    return true;
  }
}

export function setFestiveSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem('diary_festive_sound', String(enabled));
  } catch {
    // Ignore storage errors
  }
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Synthesizes the authentic rising whistle / whoosh of a sky-rocket launching.
 */
export function playRocketWhistleSound(): void {
  if (!isFestiveSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(1450, now + 0.65);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.65);
    filter.Q.value = 3.0;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.15);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch (e) {
    console.debug('Rocket sound ignored:', e);
  }
}

/**
 * Synthesizes the deep explosion boom + crackle of an exploding sky-shot.
 */
export function playFirecrackerDetonationSound(): void {
  if (!isFestiveSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 1. Deep Bass Boom (Explosion thump)
    const boomOsc = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boomOsc.type = 'sine';
    boomOsc.frequency.setValueAtTime(160, now);
    boomOsc.frequency.exponentialRampToValueAtTime(32, now + 0.45);

    boomGain.gain.setValueAtTime(0.22, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    boomOsc.connect(boomGain);
    boomGain.connect(ctx.destination);
    boomOsc.start(now);
    boomOsc.stop(now + 0.5);

    // 2. High-Frequency Sparkler Crackle
    const bufferSize = Math.floor(ctx.sampleRate * 0.45);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() > 0.86 ? (Math.random() * 2 - 1) : 0;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1600;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.09, now + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now + 0.04);
    noise.stop(now + 0.52);
  } catch (e) {
    console.debug('Detonation sound ignored:', e);
  }
}

/**
 * Synthesizes a delicate festive chime or tactile pop.
 */
export function playFestiveChime(type: 'sparkle' | 'chime' | 'pop' = 'sparkle'): void {
  if (!isFestiveSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === 'sparkle') {
      const freqs = [659.25, 783.99, 880.0, 1046.5, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);

        const startTime = now + idx * 0.045;
        const duration = 0.35;

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.05, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
      });
    } else if (type === 'pop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    }
  } catch (err) {
    console.debug('Festive sound playback ignored:', err);
  }
}

// Particle & Rocket Data Structures
interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  bodyColor: string;
  coneColor: string;
  exploded: boolean;
  delayMs: number;
  launched: boolean;
}

interface SharpSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  hasCrackle?: boolean;
  crackled?: boolean;
}

interface FlashBurst {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: string;
}

// Intense, vibrant pyrotechnic hues with brilliant white-hot cores
const PYRO_PALETTES = [
  ['#FFFBEB', '#FDE047', '#F59E0B', '#EF4444', '#DC2626'], // Golden Fire & Ruby Saffron
  ['#F0FDF4', '#86EFAC', '#22C55E', '#10B981', '#F59E0B'], // Electric Emerald & Gold
  ['#FAF5FF', '#D8B4FE', '#A855F7', '#EC4899', '#F43F5E'], // Neon Violet & Magenta
  ['#EFF6FF', '#93C5FD', '#3B82F6', '#60A5FA', '#FDE047'], // Cobalt Sky & Starlight
];

/**
 * Launches authentic Diwali Sky-Rockets with sharp needle-streak trails,
 * sparkling diamond glints, secondary branching crackle bursts, and bottom Anar fountains.
 */
export function launchDiwaliRockets(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';

  const W = window.innerWidth;
  const H = window.innerHeight;

  canvas.width = W * dpr;
  canvas.height = H * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  // 3 Ascending Sky-Rockets
  const rockets: Rocket[] = [
    {
      x: W * 0.28,
      y: H + 30,
      vx: 1.4,
      vy: -15.8,
      targetY: H * 0.30,
      bodyColor: '#DC2626',
      coneColor: '#F59E0B',
      exploded: false,
      delayMs: 0,
      launched: false,
    },
    {
      x: W * 0.72,
      y: H + 30,
      vx: -1.5,
      vy: -16.2,
      targetY: H * 0.25,
      bodyColor: '#059669',
      coneColor: '#F59E0B',
      exploded: false,
      delayMs: 200,
      launched: false,
    },
    {
      x: W * 0.50,
      y: H + 30,
      vx: 0.1,
      vy: -17.0,
      targetY: H * 0.20,
      bodyColor: '#DB2777',
      coneColor: '#FDE047',
      exploded: false,
      delayMs: 420,
      launched: false,
    },
  ];

  const sparks: SharpSpark[] = [];
  const exhaustSparks: SharpSpark[] = [];
  const anarParticles: SharpSpark[] = [];
  const flashes: FlashBurst[] = [];

  const anars = [
    { x: W * 0.12, y: H - 4 },
    { x: W * 0.88, y: H - 4 }
  ];

  const startTime = performance.now();
  let animationFrameId: number;

  function render(now: number) {
    if (!ctx) return;
    const elapsed = now - startTime;
    ctx.clearRect(0, 0, W, H);

    let active = false;

    // --- 1. DETONATION FLASH RAYS ---
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.radius += 3.5;
      f.alpha -= 0.12;
      if (f.alpha <= 0) {
        flashes.splice(i, 1);
        continue;
      }
      active = true;

      ctx.save();
      ctx.globalAlpha = f.alpha;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 1.4;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FFFFFF';

      // 8 Radiant needle starburst rays
      for (let k = 0; k < 8; k++) {
        const rayAngle = (k * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(f.x + Math.cos(rayAngle) * f.radius, f.y + Math.sin(rayAngle) * f.radius);
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- 2. UPDATE & DRAW ROCKETS ---
    rockets.forEach((r) => {
      if (r.exploded) return;

      if (!r.launched) {
        if (elapsed >= r.delayMs) {
          r.launched = true;
          playRocketWhistleSound();
        } else {
          active = true;
          return;
        }
      }

      active = true;
      r.x += r.vx;
      r.y += r.vy;
      r.vy += 0.08;

      // Sizzling exhaust needle sparks
      for (let i = 0; i < 3; i++) {
        const angle = Math.atan2(r.vy, r.vx) + Math.PI + (Math.random() - 0.5) * 0.45;
        const speed = Math.random() * 4.5 + 1.2;
        exhaustSparks.push({
          x: r.x,
          y: r.y + 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 1.5 + 1.0,
          color: Math.random() > 0.3 ? '#F59E0B' : '#EF4444',
          alpha: 1.0,
          decay: 0.048,
        });
      }

      // Draw Distinct Firecracker Rocket Body
      ctx.save();
      ctx.translate(r.x, r.y);
      const angle = Math.atan2(r.vy, r.vx);
      ctx.rotate(angle + Math.PI / 2);

      // Wooden guide stick
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(0, 8);
      ctx.lineTo(0, 32);
      ctx.stroke();

      // Burning tail fuse
      ctx.strokeStyle = '#FDE047';
      ctx.lineWidth = 2.4;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo((Math.random() - 0.5) * 4, 10);
      ctx.stroke();

      // Cylindrical explosive canister body
      ctx.fillStyle = r.bodyColor;
      ctx.fillRect(-3.5, -8, 7, 16);

      // Gold decorative band
      ctx.fillStyle = '#F59E0B';
      ctx.fillRect(-3.5, -2, 7, 4);

      // Sharp pointed rocket nose cone
      ctx.fillStyle = r.coneColor;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(4.5, -8);
      ctx.lineTo(-4.5, -8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Detonation at apex
      if (r.y <= r.targetY || r.vy >= -1.0) {
        r.exploded = true;
        playFirecrackerDetonationSound();

        // Explosion flash rays
        flashes.push({
          x: r.x,
          y: r.y,
          radius: 6,
          alpha: 1.0,
          color: '#FFFFFF'
        });

        // 80 Sharp Needle Firework Streaks
        const palette = PYRO_PALETTES[Math.floor(Math.random() * PYRO_PALETTES.length)];
        for (let i = 0; i < 80; i++) {
          const burstAngle = Math.random() * Math.PI * 2;
          const burstSpeed = Math.random() * 7.5 + 2.0;
          sparks.push({
            x: r.x,
            y: r.y,
            vx: Math.cos(burstAngle) * burstSpeed,
            vy: Math.sin(burstAngle) * burstSpeed - 0.8,
            size: Math.random() * 1.8 + 1.2, // Needle thickness
            color: palette[Math.floor(Math.random() * palette.length)],
            alpha: 1.0,
            decay: Math.random() * 0.016 + 0.012,
            hasCrackle: Math.random() > 0.70, // 30% emit secondary cracklers
            crackled: false,
          });
        }
      }
    });

    // --- 3. ANAR (FLOWERPOT) FOUNTAINS (First 1.8s) ---
    if (elapsed < 1800) {
      active = true;
      anars.forEach((anar) => {
        // Clay anar cone
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.moveTo(anar.x, anar.y - 14);
        ctx.lineTo(anar.x + 10, anar.y);
        ctx.lineTo(anar.x - 10, anar.y);
        ctx.closePath();
        ctx.fill();

        // Upward fountain needle sparks
        for (let k = 0; k < 4; k++) {
          const fAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.42;
          const fSpeed = Math.random() * 8.5 + 4.5;
          anarParticles.push({
            x: anar.x + (Math.random() - 0.5) * 4,
            y: anar.y - 14,
            vx: Math.cos(fAngle) * fSpeed,
            vy: Math.sin(fAngle) * fSpeed,
            size: Math.random() * 1.6 + 1.0,
            color: Math.random() > 0.25 ? '#FDE047' : '#F59E0B',
            alpha: 1.0,
            decay: 0.038,
          });
        }
      });
    }

    // --- 4. RENDER ANAR SPARKS AS SHARP NEEDLE STREAKS ---
    for (let i = anarParticles.length - 1; i >= 0; i--) {
      const p = anarParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // Gravity
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        anarParticles.splice(i, 1);
        continue;
      }
      active = true;

      // Draw sharp vertical needle streak
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;

      ctx.beginPath();
      ctx.moveTo(p.x, p.y - p.vy * 1.8);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      if (p.alpha > 0.55) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(p.x - 0.8, p.y - 0.8, 1.6, 1.6);
      }
      ctx.restore();
    }

    // --- 5. RENDER EXHAUST SPARKS AS FINE STREAKS ---
    for (let i = exhaustSparks.length - 1; i >= 0; i--) {
      const e = exhaustSparks[i];
      e.x += e.vx;
      e.y += e.vy;
      e.alpha -= e.decay;

      if (e.alpha <= 0) {
        exhaustSparks.splice(i, 1);
        continue;
      }
      active = true;

      ctx.save();
      ctx.globalAlpha = Math.max(0, e.alpha);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(e.x - e.vx * 1.6, e.y - e.vy * 1.6);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
      ctx.restore();
    }

    // --- 6. RENDER SHARP FIREWORK STREAKS & CRACKLERS ---
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.12; // Natural gravity curve
      s.vx *= 0.98; // Air resistance
      s.alpha -= s.decay;

      // Secondary branching crackle bursts (the Diwali "chatai" crackle!)
      if (s.hasCrackle && !s.crackled && s.alpha < 0.45 && s.alpha > 0.3) {
        s.crackled = true;
        for (let c = 0; c < 3; c++) {
          const cAngle = Math.random() * Math.PI * 2;
          const cSpeed = Math.random() * 2.8 + 1.2;
          sparks.push({
            x: s.x,
            y: s.y,
            vx: Math.cos(cAngle) * cSpeed,
            vy: Math.sin(cAngle) * cSpeed,
            size: 1.0,
            color: '#FFFFFF',
            alpha: 0.9,
            decay: 0.08,
            hasCrackle: false,
            crackled: true,
          });
        }
      }

      if (s.alpha <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      active = true;

      // Calculate sharp velocity streak length
      const speed = Math.hypot(s.vx, s.vy);
      const streakLen = Math.min(speed * 3.4, 26);
      const sAngle = Math.atan2(s.vy, s.vx);

      const tailX = s.x - Math.cos(sAngle) * streakLen;
      const tailY = s.y - Math.sin(sAngle) * streakLen;

      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);

      // 1. Sharp Needle Streak Line (NOT round bubbles!)
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.size;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 8;
      ctx.shadowColor = s.color;

      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // 2. White-Hot Diamond Glint / 4-Point Star Sparkle at Head
      if (s.alpha > 0.35) {
        const glint = Math.max(1.5, s.size * 1.5);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#FFFFFF';

        // Horizontal ray
        ctx.fillRect(s.x - glint, s.y - 0.5, glint * 2, 1.0);
        // Vertical ray
        ctx.fillRect(s.x - 0.5, s.y - glint, 1.0, glint * 2);
      }

      ctx.restore();
    }

    if (active || elapsed < 3200) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  }

  animationFrameId = requestAnimationFrame(render);
}

/**
 * Fires a lightweight GPU-accelerated needle-streak sparkler pop from specified (x, y).
 */
export function createFestiveBurst(
  originX: number,
  originY: number,
  options?: {
    count?: number;
    colors?: string[];
    sound?: 'sparkle' | 'chime' | 'pop' | false;
  }
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const count = options?.count ?? 32;
  const colors = options?.colors ?? ['#F59E0B', '#FDE047', '#EC4899', '#8B5CF6', '#10B981', '#3B82F6', '#EF4444'];

  if (options?.sound !== false) {
    playFestiveChime(options?.sound ?? 'sparkle');
  }

  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';

  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const particles: SharpSpark[] = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5.8 + 2.2;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      size: Math.random() * 1.6 + 1.1, // Fine needle line width
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1.0,
      decay: Math.random() * 0.024 + 0.016,
    });
  }

  let animationFrameId: number;

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let activeCount = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.alpha <= 0) continue;

      activeCount++;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.14;
      p.vx *= 0.96;
      p.alpha -= p.decay;

      const currentAlpha = Math.max(0, p.alpha);
      const speed = Math.hypot(p.vx, p.vy);
      const streakLen = Math.min(speed * 2.8, 16);
      const pAngle = Math.atan2(p.vy, p.vx);

      ctx.save();
      ctx.globalAlpha = currentAlpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;

      ctx.beginPath();
      ctx.moveTo(p.x - Math.cos(pAngle) * streakLen, p.y - Math.sin(pAngle) * streakLen);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Sharp white micro-glint
      if (currentAlpha > 0.4) {
        const glint = 2.0;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(p.x - glint, p.y - 0.5, glint * 2, 1.0);
        ctx.fillRect(p.x - 0.5, p.y - glint, 1.0, glint * 2);
      }

      ctx.restore();
    }

    if (activeCount > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
