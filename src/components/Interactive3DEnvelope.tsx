import React, { useState, useRef } from 'react';
import { Sparkles, Mail, RotateCcw, ArrowRight, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Interactive3DEnvelopeProps {
  onEnter: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onStartMusic?: () => void;
  isPlaying?: boolean;
  onTogglePlayPause?: () => void;
}

export default function Interactive3DEnvelope({
  onEnter,
  isMuted,
  onToggleMute,
  onStartMusic,
  isPlaying = false,
  onTogglePlayPause,
}: Interactive3DEnvelopeProps) {
  // Envelope animation states: 'idle' | 'cracking' | 'opening' | 'revealed'
  const [stage, setStage] = useState<'idle' | 'cracking' | 'opening' | 'revealed'>('idle');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play royal crystalline chime arpeggio on wax seal break
  const playUnsealAudio = () => {
    if (isMuted) return;
    try {
      const ctx =
        audioCtxRef.current ||
        new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Royal ascending notes: D4 -> A4 -> D5 -> F#5 -> A5
      const notes = [293.66, 440.0, 587.33, 739.99, 880.0];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.55);
      });
    } catch {
      // fallback
    }
  };

  const triggerMonochromeConfetti = () => {
    const monoColors = ['#ffffff', '#000000', '#f3f4f6', '#a3a3a3', '#171717', '#e5e5e5'];
    try {
      // Seal center burst
      confetti({
        particleCount: 110,
        spread: 95,
        origin: { y: 0.52 },
        colors: monoColors,
        scalar: 1.15,
        ticks: 220,
      });

      // Side cannons for celebration
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 70,
          origin: { x: 0.05, y: 0.65 },
          colors: monoColors,
          ticks: 230,
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 70,
          origin: { x: 0.95, y: 0.65 },
          colors: monoColors,
          ticks: 230,
        });
      }, 420);
    } catch {
      // fallback
    }
  };

  const handleOpen = () => {
    if (stage !== 'idle') return;

    // Trigger background instrumental lounge music immediately within user tap gesture
    if (onStartMusic) {
      onStartMusic();
    }

    // Phase 1: Cracking wax seal
    setStage('cracking');
    playUnsealAudio();
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([45, 60, 90]);
      } catch {
        // ignore
      }
    }
    triggerMonochromeConfetti();

    // Phase 2: Flap unfolds upwards in 3D & Card rises
    setTimeout(() => {
      setStage('opening');
    }, 380);

    // Phase 3: Card is fully revealed and stays front-and-center
    setTimeout(() => {
      setStage('revealed');
      setTilt({ x: 0, y: 0 });
    }, 1300);
  };

  const handleReset = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStage('idle');
    setTilt({ x: 0, y: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (stage !== 'idle') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 18, y: -y * 18 });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <section className="fixed inset-0 z-50 bg-[#070707] text-white flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden select-none">
      {/* Background Luxury Ambient Glow & Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Ambient Lighting Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header Information */}
      <header className="relative z-20 pt-2 sm:pt-4 flex flex-col items-center text-center">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 border border-neutral-800 bg-neutral-950/90 backdrop-blur-md uppercase tracking-[0.25em] text-[10px] sm:text-xs text-neutral-300 font-medium">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            <span>Invitación Exclusiva &bull; Edición Especial</span>
            <span className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>

          {onTogglePlayPause && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlayPause();
              }}
              aria-label={isPlaying ? 'Pausar música' : 'Reproducir música'}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-neutral-700 hover:border-white bg-neutral-900/90 text-neutral-200 hover:text-white transition-all text-xs font-mono uppercase cursor-pointer"
              title={isPlaying ? 'Pausar música' : 'Reproducir música'}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-white fill-white" />
                  <span className="text-[10px] tracking-wider">Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                  <span className="text-[10px] tracking-wider">Reproducir</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Activar música' : 'Silenciar música'}
            className="flex items-center gap-1.5 px-2.5 py-1 border border-neutral-800 hover:border-white bg-neutral-950/80 transition-all text-neutral-300 hover:text-white cursor-pointer"
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 hidden xs:inline">Mute</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-white" />
                <div className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 h-2.5 bg-white animate-pulse" />
                  <span className="w-0.5 h-1.5 bg-white animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-0.5 h-2 bg-white animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-200 hidden xs:inline">Sonido</span>
              </>
            )}
          </button>
        </div>

        <h1 className="font-editorial font-black italic tracking-tight text-3xl sm:text-5xl md:text-6xl uppercase text-white mt-3 select-none">
          DORIELAS BIRTHDAY
        </h1>
        <p className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-neutral-400 font-mono mt-1">
          06 DE NOVIEMBRE, 2026 &bull; PIZZA NOSTRA &bull; 3:00 PM
        </p>
      </header>

      {/* Central Interactive 3D Envelope Experience */}
      <div className="relative z-20 w-full max-w-[560px] px-3 my-auto flex flex-col items-center">
        {/* Soft breathing shadow underneath floating envelope */}
        <div
          className={`w-[85%] h-10 mx-auto -mb-5 rounded-[50%] bg-white/20 blur-xl pointer-events-none transition-all duration-700 ${
            stage === 'idle' ? 'animate-shadow-breath' : 'opacity-10 scale-90'
          }`}
        />

        {/* 3D Tilt Wrapper & Floating Levitation */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`perspective-1000 relative w-full ${stage === 'idle' ? 'animate-envelope-float' : ''}`}
        >
          {/* Ambient floating sparkle stars */}
          {stage === 'idle' && (
            <>
              <div className="absolute -top-7 -left-5 text-white/60 text-xl animate-float-particle pointer-events-none">✦</div>
              <div className="absolute top-1/4 -right-7 text-white/50 text-lg animate-float-particle pointer-events-none" style={{ animationDelay: '1.2s' }}>✧</div>
              <div className="absolute -bottom-6 -right-3 text-white/40 text-xl animate-float-particle pointer-events-none" style={{ animationDelay: '0.6s' }}>★</div>
              <div className="absolute bottom-1/3 -left-7 text-white/50 text-base animate-float-particle pointer-events-none" style={{ animationDelay: '2.1s' }}>✦</div>
            </>
          )}

          {/* ========================================================
              THE CRAFTED REALISTIC 3D ENVELOPE (LIKE THE IMAGE)
              - Pure Warm Cardstock (#F6F4EE)
              - Embossed Dumbbell Pattern (blind embossed letterpress)
              - 3D Hinged Triangular Flap with preserve-3d
              - Authentic Ivory Wax Seal with "D" & dumbbell
              - VIP Letter Card emerging from inside the pocket
             ======================================================== */}
          <div
            onClick={stage === 'idle' ? handleOpen : undefined}
            style={{
              transform:
                stage === 'idle'
                  ? `perspective(1000px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`
                  : 'perspective(1000px) rotateY(0deg) rotateX(0deg)',
              transition: isHovered && stage === 'idle' ? 'transform 0.1s ease-out' : 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className={`relative w-full aspect-[1.48] rounded-md cursor-pointer select-none transition-all duration-500 shadow-[0_25px_60px_-15px_rgba(255,255,255,0.2)] ${
              stage === 'idle' ? 'hover:shadow-[0_30px_70px_-10px_rgba(255,255,255,0.3)]' : ''
            }`}
          >
            {/* 1. Envelope Back Wall (Interior of the pocket) */}
            <div className="absolute inset-0 rounded-md bg-[#ECE8DE] overflow-hidden border border-[#D5D0C5] shadow-inner">
              {/* Interior embossed pattern and dark pocket gradient */}
              <DumbbellPattern opacity={0.06} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-transparent pointer-events-none" />
            </div>

            {/* 2. The VIP Invitation Letter Card (Tucked inside, emerges when opened) */}
            <div
              className={`absolute inset-x-5 sm:inset-x-8 top-4 bottom-4 z-10 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                stage === 'idle' || stage === 'cracking'
                  ? 'translate-y-2 opacity-95 scale-[0.98]'
                  : stage === 'opening'
                  ? '-translate-y-[62%] sm:-translate-y-[70%] scale-[1.03] shadow-[0_30px_80px_rgba(0,0,0,0.85)] z-30'
                  : '-translate-y-[70%] sm:-translate-y-[78%] scale-[1.04] shadow-[0_35px_90px_rgba(0,0,0,0.95)] z-40'
              }`}
            >
              {/* VIP Letter Card Body */}
              <div className="w-full h-full bg-[#FAF9F5] text-black p-4 sm:p-5 border-4 border-black flex flex-col justify-between shadow-2xl relative overflow-hidden">
                {/* Metallic diagonal gloss line across card */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 pointer-events-none" />

                {/* Card Header */}
                <div className="flex items-center justify-between border-b-2 border-black pb-2 relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-black text-white text-[9px] uppercase tracking-widest font-black">
                    <Sparkles className="w-3 h-3 text-white" />
                    PASE VIP EXCLUSIVO
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-700">
                    06.NOV.2026
                  </span>
                </div>

                {/* Card Content with Dorielas Photo #5 */}
                <div className="flex items-center gap-4 py-3 relative z-10 my-auto">
                  <img
                    src="https://i.ibb.co/BH5PpC6j/IMG-6230.jpg"
                    alt="Doriela"
                    className="w-16 h-20 sm:w-20 sm:h-24 object-cover border-2 border-black grayscale contrast-125 shadow-md shrink-0"
                  />
                  <div className="text-left flex-1">
                    <div className="inline-block px-2 py-0.5 bg-neutral-200 text-neutral-800 text-[8px] font-mono font-bold uppercase tracking-widest mb-1.5">
                      ACCESO TOTAL &bull; VIP PASS
                    </div>
                    <h3 className="font-editorial font-black italic text-2xl sm:text-3xl uppercase leading-tight text-black">
                      DORIELA BIRTHDAY
                    </h3>
                  </div>
                </div>

                {/* Card Footer Bar */}
                <div className="pt-2 border-t border-neutral-300 flex items-center justify-between text-[9px] font-mono text-neutral-600 relative z-10">
                  <span>ID: DB-2026-VIP</span>
                  <span className="font-bold text-black uppercase tracking-wider">
                    {stage === 'revealed' ? '✓ INVITACIÓN DESBLOQUEADA' : '★ ACCESO CONFIRMADO'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Envelope Front Pocket (Bottom and Side Folds that cover the card) */}
            <div className="absolute inset-0 z-20 pointer-events-none rounded-md overflow-hidden">
              {/* Bottom fold triangle extending upwards to center */}
              <div
                className="absolute inset-0 bg-[#F5F3EC] border-b border-x border-[#E3DFD5]"
                style={{
                  clipPath: 'polygon(0% 100%, 50% 51%, 100% 100%)',
                  filter: 'drop-shadow(0 -4px 6px rgba(0,0,0,0.06))',
                }}
              >
                <DumbbellPattern opacity={0.16} />
                {/* Subtle paper gradient shading */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/[0.04] to-transparent" />
              </div>

              {/* Left side triangle fold */}
              <div
                className="absolute inset-0 bg-[#F3F1E9]"
                style={{
                  clipPath: 'polygon(0% 0%, 50% 51%, 0% 100%)',
                  filter: 'drop-shadow(2px 0 4px rgba(0,0,0,0.04))',
                }}
              >
                <DumbbellPattern opacity={0.15} />
              </div>

              {/* Right side triangle fold */}
              <div
                className="absolute inset-0 bg-[#F3F1E9]"
                style={{
                  clipPath: 'polygon(100% 0%, 50% 51%, 100% 100%)',
                  filter: 'drop-shadow(-2px 0 4px rgba(0,0,0,0.04))',
                }}
              >
                <DumbbellPattern opacity={0.15} />
              </div>

              {/* Front crease lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="0" y1="100%" x2="50%" y2="51%" stroke="#DDD8CC" strokeWidth="1" />
                <line x1="100%" y1="100%" x2="50%" y2="51%" stroke="#DDD8CC" strokeWidth="1" />
              </svg>
            </div>

            {/* 4. Envelope Top Flap (Triangular flap that hinges open in 3D) */}
            <div
              style={{
                transformOrigin: 'top center',
                transformStyle: 'preserve-3d',
                transform:
                  stage === 'idle' || stage === 'cracking'
                    ? 'rotateX(0deg)'
                    : 'rotateX(-175deg)',
                transition: 'transform 0.85s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: stage === 'idle' || stage === 'cracking' ? 25 : 5,
              }}
              className="absolute inset-0 pointer-events-none rounded-t-md"
            >
              {/* Flap Outer Surface (Warm cardstock with embossed dumbbells) */}
              <div
                className="absolute inset-0 bg-[#F7F5EF] backface-hidden"
                style={{
                  clipPath: 'polygon(0% 0%, 100% 0%, 50% 54%)',
                  filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.12))',
                }}
              >
                <DumbbellPattern opacity={0.18} />
                {/* Flap border creases */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/[0.04]" />
              </div>

              {/* Flap Crease Border line */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="0" y1="0" x2="50%" y2="54%" stroke="#DDD8CD" strokeWidth="1.2" />
                <line x1="100%" y1="0" x2="50%" y2="54%" stroke="#DDD8CD" strokeWidth="1.2" />
              </svg>

              {/* 5. The Authentic Pearlescent Wax Seal with "D" & Dumbbell */}
              <div
                className="absolute left-1/2 -translate-x-1/2 top-[54%] -translate-y-1/2 pointer-events-auto"
                style={{
                  width: '94px',
                  height: '94px',
                }}
              >
                <WaxSeal
                  isCracking={stage === 'cracking'}
                  isBroken={stage === 'opening' || stage === 'revealed'}
                  onClick={handleOpen}
                />
              </div>
            </div>

            {/* Shimmer Light Reflection Sweep diagonally across envelope */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-26 rounded-md">
              <div className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 animate-shimmer-sweep" />
            </div>

            {/* Bottom Floating Interactive Action Badge */}
            {stage === 'idle' && (
              <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none z-30">
                <span className="px-4 py-1.5 bg-black/85 backdrop-blur-md border border-neutral-600 text-white text-[10px] sm:text-xs uppercase tracking-widest font-black group-hover:bg-white group-hover:text-black group-hover:border-white transition-all shadow-xl flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse text-neutral-200" />
                  <span>Toca el sobre o el sello para abrir</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls Beneath Envelope */}
        <div className="mt-7 flex flex-col items-center z-30 w-full max-w-sm">
          {stage === 'idle' ? (
            <>
              <button
                type="button"
                onClick={handleOpen}
                className="w-full py-4 bg-white text-black hover:bg-neutral-200 text-xs sm:text-sm uppercase tracking-[0.25em] font-black transition-all shadow-[6px_6px_0px_0px_#737373] active:translate-x-0.5 active:translate-y-0.5 border-2 border-white flex items-center justify-center gap-3 cursor-pointer group"
              >
                <Mail className="w-4 h-4 stroke-[2.5] group-hover:scale-110 transition-transform" />
                <span>ABRIR INVITACIÓN</span>
                <Sparkles className="w-4 h-4 stroke-[2.5]" />
              </button>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono mt-2.5">
                [ Haz clic en el sobre o en el sello 'D' ]
              </span>
            </>
          ) : stage === 'revealed' ? (
            <div className="w-full flex flex-col gap-2.5 animate-success-pop">
              <button
                type="button"
                onClick={onEnter}
                className="w-full py-4 bg-white text-black hover:bg-neutral-200 text-xs sm:text-sm uppercase tracking-[0.25em] font-black transition-all shadow-[6px_6px_0px_0px_#737373] active:translate-x-0.5 active:translate-y-0.5 border-2 border-white flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>INGRESAR A LA CELEBRACIÓN</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white font-mono transition-colors text-center py-1.5 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Volver a cerrar sobre y repetir animación</span>
              </button>
            </div>
          ) : (
            <div className="py-3 px-6 bg-black/80 border border-neutral-700 text-white text-xs uppercase tracking-widest font-mono flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-white" />
              <span>Deslacrando sobre oficial...</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Info */}
      <footer className="relative z-20 pb-2 sm:pb-3 text-center">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-neutral-400 font-semibold font-mono">
          DRESS CODE: BLANCO Y NEGRO &bull; STRICT MONOCHROME
        </p>
      </footer>
    </section>
  );
}

// ============================================================================
// EMBOSSED DUMBBELL PATTERN (Blind Embossed Letterpress on Cardstock)
// ============================================================================
function DumbbellPattern({ opacity = 0.16 }: { opacity?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ opacity }}>
      <svg width="100%" height="100%">
        <defs>
          {/* Tactile Letterpress Emboss Filter */}
          <filter id="blind-emboss" x="-20%" y="-20%" width="140%" height="140%">
            {/* White specular highlight on top-left */}
            <feDropShadow dx="-1" dy="-1" stdDeviation="0.4" floodColor="#ffffff" floodOpacity="0.9" />
            {/* Soft gray shadow on bottom-right */}
            <feDropShadow dx="1.4" dy="1.6" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.18" />
          </filter>

          {/* Repeating Staggered Grid of Dumbbells */}
          <pattern id="dumbbell-grid" width="110" height="74" patternUnits="userSpaceOnUse">
            {/* Dumbbell 1 */}
            <g transform="translate(14, 18)" filter="url(#blind-emboss)">
              {/* Center bar */}
              <rect x="14" y="10" width="22" height="3" rx="1.5" fill="#DDD9CF" />
              {/* Inner weights */}
              <rect x="9" y="4" width="3.5" height="15" rx="1.5" fill="#DDD9CF" />
              <rect x="37.5" y="4" width="3.5" height="15" rx="1.5" fill="#DDD9CF" />
              {/* Outer weights */}
              <rect x="3.5" y="6" width="3.5" height="11" rx="1.5" fill="#DDD9CF" />
              <rect x="43" y="6" width="3.5" height="11" rx="1.5" fill="#DDD9CF" />
            </g>

            {/* Dumbbell 2 (Staggered offset) */}
            <g transform="translate(68, 54)" filter="url(#blind-emboss)">
              <rect x="14" y="10" width="22" height="3" rx="1.5" fill="#DDD9CF" />
              <rect x="9" y="4" width="3.5" height="15" rx="1.5" fill="#DDD9CF" />
              <rect x="37.5" y="4" width="3.5" height="15" rx="1.5" fill="#DDD9CF" />
              <rect x="3.5" y="6" width="3.5" height="11" rx="1.5" fill="#DDD9CF" />
              <rect x="43" y="6" width="3.5" height="11" rx="1.5" fill="#DDD9CF" />
            </g>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#dumbbell-grid)" />
      </svg>
    </div>
  );
}

// ============================================================================
// THE LUXURY PEARLESCENT WAX SEAL WITH CALLIGRAPHY "D" AND DUMBBELL
// ============================================================================
function WaxSeal({
  isCracking,
  isBroken,
  onClick,
}: {
  isCracking: boolean;
  isBroken: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full cursor-pointer flex items-center justify-center transition-all duration-300 ${
        isCracking ? 'animate-seal-crack' : isBroken ? 'opacity-0 scale-125' : 'hover:scale-105 active:scale-95'
      }`}
    >
      {/* Concentric Pulsing Light Ripples */}
      {!isBroken && (
        <>
          <div className="absolute -inset-2.5 rounded-full border border-white/60 animate-ping opacity-35 pointer-events-none" />
          <div className="absolute -inset-1 rounded-full border border-white/80 animate-seal-pulse pointer-events-none" />
        </>
      )}

      {/* SVG Wax Seal */}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_8px_16px_rgba(0,0,0,0.22)] select-none pointer-events-none"
      >
        <defs>
          {/* Pearlescent wax radial gradient */}
          <radialGradient id="wax-surface" cx="42%" cy="38%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F4F1EA" />
            <stop offset="85%" stopColor="#E2DDD2" />
            <stop offset="100%" stopColor="#CDC7BA" />
          </radialGradient>

          {/* Inner stamped seal depression gradient */}
          <radialGradient id="inner-seal" cx="48%" cy="46%" r="50%">
            <stop offset="0%" stopColor="#ECE8DE" />
            <stop offset="70%" stopColor="#DDD8CB" />
            <stop offset="100%" stopColor="#C8C2B3" />
          </radialGradient>

          {/* Deboss letterpress filter for the D and dumbbell */}
          <filter id="wax-engrave" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1.2" dy="1.4" stdDeviation="0.6" floodColor="#7A756A" floodOpacity="0.55" />
            <feDropShadow dx="-1" dy="-1" stdDeviation="0.5" floodColor="#FFFFFF" floodOpacity="0.85" />
          </filter>
        </defs>

        {/* Organic irregular wax perimeter droplets */}
        <path
          d="M 50,4 
             C 63,3 74,9 83,18 
             C 93,28 97,41 95,54 
             C 94,68 87,80 77,88 
             C 65,97 49,98 37,94 
             C 24,90 13,81 7,69 
             C 2,56 4,41 11,30 
             C 19,17 34,5 50,4 Z"
          fill="url(#wax-surface)"
          stroke="#C5BEAF"
          strokeWidth="1"
        />

        {/* Outer raised stamped ring */}
        <circle
          cx="50"
          cy="50"
          r="34"
          fill="none"
          stroke="#ECE7DC"
          strokeWidth="3.5"
          filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.15))"
        />
        <circle
          cx="50"
          cy="50"
          r="32.5"
          fill="url(#inner-seal)"
          stroke="#BAAF9F"
          strokeWidth="1"
        />

        {/* Decorative thin inner concentric circle */}
        <circle
          cx="50"
          cy="50"
          r="28.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />

        {/* The Calligraphy Monogram "D" */}
        <text
          x="50"
          y="53"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#8C8476"
          filter="url(#wax-engrave)"
          fontFamily="'Playfair Display', Georgia, serif"
          fontStyle="italic"
          fontWeight="bold"
          fontSize="31"
        >
          D
        </text>

        {/* Engraved Dumbbell beneath the "D" */}
        <g transform="translate(34, 63) scale(0.65)" filter="url(#wax-engrave)">
          {/* Bar */}
          <rect x="12" y="8" width="24" height="3" rx="1.5" fill="#8C8476" />
          {/* Left weights */}
          <rect x="7" y="3" width="4" height="13" rx="1.5" fill="#8C8476" />
          <rect x="1" y="5" width="4" height="9" rx="1.5" fill="#8C8476" />
          {/* Right weights */}
          <rect x="37" y="3" width="4" height="13" rx="1.5" fill="#8C8476" />
          <rect x="43" y="5" width="4" height="9" rx="1.5" fill="#8C8476" />
        </g>
      </svg>
    </div>
  );
}
