import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
  trail: { x: number; y: number }[];
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  length: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

const GOLD_COLORS = [
  "#FFD700", "#FFC200", "#FFAA00", "#FFE066", "#FFF0A0",
  "#FF6B6B", "#FF4444", "#FF9900", "#FFFFFF", "#FFB347",
  "#C0A060", "#E8D5A3",
];

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const starsRef = useRef<Star[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const [revealed, setRevealed] = useState(false);
  const [textVisible, setTextVisible] = useState(false);

  const createFirework = (canvas: HTMLCanvasElement, x: number, y: number) => {
    const count = 80 + Math.floor(Math.random() * 60);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = 2 + Math.random() * 6;
      const color = GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)];
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.8,
        color,
        size: 1.5 + Math.random() * 3,
        gravity: 0.06 + Math.random() * 0.04,
        trail: [],
      });
    }
  };

  const createShootingStar = (canvas: HTMLCanvasElement) => {
    const angle = (Math.random() * Math.PI) / 4 + Math.PI / 8;
    const speed = 8 + Math.random() * 10;
    shootingStarsRef.current.push({
      x: Math.random() * canvas.width * 0.8,
      y: Math.random() * canvas.height * 0.4,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 0.4 + Math.random() * 0.4,
      length: 60 + Math.random() * 80,
    });
  };

  const initStars = (canvas: HTMLCanvasElement) => {
    starsRef.current = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 0.3 + Math.random() * 1.8,
      opacity: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars(canvas);
    };
    resize();
    window.addEventListener("resize", resize);

    let lastFirework = 0;
    let lastShooting = 0;
    let fireworkCount = 0;

    const fireworkPositions = [
      [0.2, 0.25], [0.8, 0.2], [0.5, 0.15],
      [0.15, 0.45], [0.85, 0.4], [0.35, 0.3],
      [0.65, 0.28], [0.5, 0.35],
    ];

    const loop = (timestamp: number) => {
      timeRef.current = timestamp;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(timestamp * 0.001 * star.twinkleSpeed + star.twinkleOffset);
        const op = star.opacity * (0.7 + 0.3 * twinkle);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 248, 220, ${op})`;
        ctx.fill();
      });

      // Auto fireworks
      if (timestamp - lastFirework > 900 && fireworkCount < fireworkPositions.length * 3) {
        const pos = fireworkPositions[fireworkCount % fireworkPositions.length];
        const jitter = (Math.random() - 0.5) * 0.15;
        createFirework(
          canvas,
          (pos[0] + jitter) * canvas.width,
          (pos[1] + (Math.random() - 0.5) * 0.1) * canvas.height
        );
        lastFirework = timestamp;
        fireworkCount++;
      }

      // Periodic fireworks after initial burst
      if (fireworkCount >= fireworkPositions.length * 3 && timestamp - lastFirework > 1800) {
        createFirework(
          canvas,
          0.1 * canvas.width + Math.random() * 0.8 * canvas.width,
          0.1 * canvas.height + Math.random() * 0.35 * canvas.height
        );
        lastFirework = timestamp;
      }

      // Shooting stars
      if (timestamp - lastShooting > 2200 + Math.random() * 2000) {
        createShootingStar(canvas);
        lastShooting = timestamp;
      }

      // Draw shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.018;
        if (s.life <= 0) return false;
        const progress = s.life / s.maxLife;
        const tailX = s.x - s.vx * (s.length / 10);
        const tailY = s.y - s.vy * (s.length / 10);
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, "rgba(255, 248, 200, 0)");
        grad.addColorStop(1, `rgba(255, 255, 255, ${progress * 0.9})`);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Star head glow
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${progress})`;
        ctx.fill();
        return true;
      });

      // Draw particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 6) p.trail.shift();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.life -= 0.012;
        if (p.life <= 0) return false;

        const progress = p.life / p.maxLife;

        // Trail
        if (p.trail.length > 1) {
          for (let i = 1; i < p.trail.length; i++) {
            const t = i / p.trail.length;
            ctx.beginPath();
            ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y);
            ctx.lineTo(p.trail[i].x, p.trail[i].y);
            ctx.strokeStyle = p.color + Math.floor(t * progress * 180).toString(16).padStart(2, "0");
            ctx.lineWidth = p.size * t * 0.6;
            ctx.stroke();
          }
        }

        // Spark
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * progress, 0, Math.PI * 2);
        const alpha = Math.floor(progress * 255).toString(16).padStart(2, "0");
        ctx.fillStyle = p.color + alpha;
        ctx.fill();

        // Glow
        if (progress > 0.4) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * progress * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = p.color + "22";
          ctx.fill();
        }

        return true;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    // Reveal text
    setTimeout(() => setRevealed(true), 600);
    setTimeout(() => setTextVisible(true), 1200);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    createFirework(canvas, e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at 50% 30%, #1a0f2e 0%, #0d0820 40%, #050310 100%)",
        overflow: "hidden",
        fontFamily: "'Cormorant Garamond', serif",
      }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          position: "absolute",
          inset: 0,
          cursor: "crosshair",
          zIndex: 1,
        }}
      />

      {/* Decorative vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Ornamental borders */}
      <div
        style={{
          position: "absolute",
          inset: "16px",
          border: "1px solid rgba(212, 175, 55, 0.25)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "22px",
          border: "1px solid rgba(212, 175, 55, 0.12)",
          pointerEvents: "none",
          zIndex: 3,
        }}
      />

      {/* Corner ornaments */}
      {[
        { top: 8, left: 8 },
        { top: 8, right: 8 },
        { bottom: 8, left: 8 },
        { bottom: 8, right: 8 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            ...pos,
            width: 40,
            height: 40,
            pointerEvents: "none",
            zIndex: 4,
            opacity: revealed ? 1 : 0,
            transition: "opacity 1.5s ease",
          }}
        >
          <svg viewBox="0 0 40 40" fill="none">
            <path
              d="M2 2 L2 14 M2 2 L14 2"
              stroke="#D4AF37"
              strokeWidth="1.5"
              opacity="0.7"
            />
            <circle cx="2" cy="2" r="2" fill="#D4AF37" opacity="0.9" />
          </svg>
        </div>
      ))}

      {/* Main content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 5,
          pointerEvents: "none",
          padding: "40px 20px",
        }}
      >
        {/* Top ornament */}
        <div
          style={{
            opacity: revealed ? 1 : 0,
            transform: revealed ? "translateY(0)" : "translateY(-20px)",
            transition: "opacity 1.2s ease, transform 1.2s ease",
            marginBottom: "24px",
          }}
        >
          <svg width="200" height="24" viewBox="0 0 200 24" fill="none">
            <line x1="0" y1="12" x2="75" y2="12" stroke="url(#goldL)" strokeWidth="1" />
            <circle cx="85" cy="12" r="3" fill="#D4AF37" opacity="0.8" />
            <circle cx="100" cy="12" r="5" fill="#D4AF37" opacity="0.9" />
            <circle cx="115" cy="12" r="3" fill="#D4AF37" opacity="0.8" />
            <line x1="125" y1="12" x2="200" y2="12" stroke="url(#goldR)" strokeWidth="1" />
            <defs>
              <linearGradient id="goldL" x1="0" y1="0" x2="75" y2="0">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="goldR" x1="125" y1="0" x2="200" y2="0">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Date label */}
        <div
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "11px",
            letterSpacing: "6px",
            color: "#C9A84C",
            opacity: textVisible ? 0.85 : 0,
            transition: "opacity 1.5s ease 0.3s",
            marginBottom: "16px",
            textTransform: "uppercase",
          }}
        >
          9 мая 2026
        </div>

        {/* Main heading */}
        <div
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
            transition: "opacity 1.4s ease 0.1s, transform 1.4s ease 0.1s",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(52px, 10vw, 120px)",
              fontWeight: 300,
              lineHeight: 1,
              margin: 0,
              background: "linear-gradient(135deg, #C9A84C 0%, #FFD700 35%, #FFF0A0 55%, #FFD700 70%, #C9A84C 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
              letterSpacing: "-1px",
            }}
          >
            С Днём
          </h1>
          <h1
            style={{
              fontSize: "clamp(52px, 10vw, 120px)",
              fontWeight: 600,
              lineHeight: 1,
              margin: 0,
              fontStyle: "italic",
              background: "linear-gradient(135deg, #D4AF37 0%, #FFD700 30%, #FFFACD 50%, #FFD700 70%, #D4AF37 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "2px",
            }}
          >
            Победы!
          </h1>
        </div>

        {/* Divider */}
        <div
          style={{
            opacity: textVisible ? 1 : 0,
            transition: "opacity 1.5s ease 0.5s",
            margin: "28px 0",
          }}
        >
          <svg width="280" height="20" viewBox="0 0 280 20" fill="none">
            <line x1="0" y1="10" x2="110" y2="10" stroke="url(#dl)" strokeWidth="0.8" />
            <path d="M130 3 L140 10 L150 3 L140 17 Z" fill="#D4AF37" opacity="0.8" />
            <line x1="170" y1="10" x2="280" y2="10" stroke="url(#dr)" strokeWidth="0.8" />
            <defs>
              <linearGradient id="dl" x1="0" y1="0" x2="110" y2="0">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="dr" x1="170" y1="0" x2="280" y2="0">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Congratulation text */}
        <div
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 1.6s ease 0.7s, transform 1.6s ease 0.7s",
            textAlign: "center",
            maxWidth: "640px",
          }}
        >
          <p
            style={{
              fontSize: "clamp(18px, 3vw, 26px)",
              fontWeight: 300,
              fontStyle: "italic",
              color: "#E8D5A3",
              lineHeight: 1.7,
              margin: 0,
              letterSpacing: "0.5px",
            }}
          >
            Поздравляем с Великим праздником —
            <br />
            <span style={{ color: "#FFD700", fontWeight: 400 }}>
              Днём Победы!
            </span>
          </p>
          <p
            style={{
              marginTop: "16px",
              fontSize: "clamp(14px, 2vw, 18px)",
              fontWeight: 300,
              color: "rgba(232, 213, 163, 0.75)",
              lineHeight: 1.8,
              letterSpacing: "0.3px",
            }}
          >
            Мир, добытый ценой великих жертв,
            <br />
            должен храниться в наших сердцах вечно.
            <br />
            <em style={{ color: "rgba(212, 175, 55, 0.9)" }}>Вечная память героям.</em>
          </p>
        </div>

        {/* Bottom ornament */}
        <div
          style={{
            opacity: revealed ? 1 : 0,
            transition: "opacity 1.2s ease 1s",
            marginTop: "32px",
          }}
        >
          <svg width="200" height="24" viewBox="0 0 200 24" fill="none">
            <line x1="0" y1="12" x2="75" y2="12" stroke="url(#goldBL)" strokeWidth="1" />
            <circle cx="85" cy="12" r="3" fill="#D4AF37" opacity="0.8" />
            <circle cx="100" cy="12" r="5" fill="#D4AF37" opacity="0.9" />
            <circle cx="115" cy="12" r="3" fill="#D4AF37" opacity="0.8" />
            <line x1="125" y1="12" x2="200" y2="12" stroke="url(#goldBR)" strokeWidth="1" />
            <defs>
              <linearGradient id="goldBL" x1="0" y1="0" x2="75" y2="0">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="goldBR" x1="125" y1="0" x2="200" y2="0">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Hint */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            fontFamily: "'Montserrat', sans-serif",
            fontSize: "11px",
            letterSpacing: "3px",
            color: "rgba(212, 175, 55, 0.4)",
            opacity: textVisible ? 1 : 0,
            transition: "opacity 2s ease 2s",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          нажмите, чтобы запустить салют
        </div>
      </div>
    </div>
  );
};

export default Index;
