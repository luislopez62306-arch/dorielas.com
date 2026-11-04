import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Shirt,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  ArrowUpRight,
  ExternalLink,
  X,
  ChevronDown,
  Volume2,
  VolumeX,
  Send,
  Camera,
  Maximize2,
  Heart,
  Sliders,
  RotateCw,
  Lock,
  Unlock,
  EyeOff,
  Play,
  Pause,
  Disc
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Interactive3DEnvelope from './components/Interactive3DEnvelope';
import BlurUpImage from './components/BlurUpImage';
import { backgroundAudio } from './utils/backgroundAudio';

interface RSVPData {
  name: string;
  attending: 'yes' | 'no';
  guests: number;
  dietary: string;
  message: string;
  confirmedAt: string;
  ticketId: string;
}

interface PhotoItem {
  id: string;
  url: string;
  title: string;
  caption: string;
  likes: number;
  isUserUploaded?: boolean;
}



function RevealOnScroll({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (domRef.current) {
              observer.unobserve(domRef.current);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const currentEl = domRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, []);

  return (
    <div
      ref={domRef}
      style={{
        transitionDuration: '850ms',
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className={`transition-all will-change-[transform,opacity] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function App() {
  // Target Event Date: Friday, November 6, 2026, 3:00 PM
  const eventDate = new Date('2026-11-06T15:00:00');



  // Countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // UI state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [rsvpData, setRsvpData] = useState<RSVPData | null>(null);
  const [isLocationFlipped, setIsLocationFlipped] = useState(false);
  const [isDressCodeFlipped, setIsDressCodeFlipped] = useState(false);
  const [isVibrating, setIsVibrating] = useState(false);
  const [isSuccessAnimated, setIsSuccessAnimated] = useState(false);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);

  // Gallery state
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'mono'>('mono');
  const [likedPhotoIds, setLikedPhotoIds] = useState<Record<string, boolean>>({});

  // Form state
  const [guestName, setGuestName] = useState('');
  const [attending, setAttending] = useState<'yes' | 'no'>('yes');
  const [guestCount, setGuestCount] = useState<number>(1);
  const [dietary, setDietary] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio tone synthesizer
  const audioCtxRef = useRef<AudioContext | null>(null);

  // User's Dorielas Birthday celebration photo collection
  const initialPhotos: PhotoItem[] = [
    {
      id: 'p1',
      url: 'https://i.ibb.co/33kTZ86/IMG-6234.jpg',
      title: 'Dorielas',
      caption: 'Momento inolvidable',
      likes: 48,
    },
    {
      id: 'p2',
      url: 'https://i.ibb.co/xST3zVtJ/IMG-6233.jpg',
      title: 'Celebración',
      caption: 'Sonrisas y buena energía',
      likes: 39,
    },
    {
      id: 'p3',
      url: 'https://i.ibb.co/93zpYdz6/IMG-6232.jpg',
      title: 'Vibes',
      caption: 'Estilo y autenticidad',
      likes: 52,
    },
    {
      id: 'p4',
      url: 'https://i.ibb.co/TMGG6y5v/IMG-6231.jpg',
      title: 'Black & White',
      caption: 'Elegancia monocromática',
      likes: 34,
    },
    {
      id: 'p5',
      url: 'https://i.ibb.co/BH5PpC6j/IMG-6230.jpg',
      title: 'Birthday Girl',
      caption: 'Celebrando la vida',
      likes: 61,
    },
    {
      id: 'p6',
      url: 'https://i.ibb.co/KzmGrkcM/IMG-6229.jpg',
      title: 'Recuerdos',
      caption: 'Momentos que quedan por siempre',
      likes: 45,
    },
    {
      id: 'p7',
      url: 'https://i.ibb.co/nN1FS3J5/IMG-6228.jpg',
      title: 'Golden Hour',
      caption: 'Lista para celebrar este 6 de Noviembre',
      likes: 56,
    },
  ];

  const allPhotos = initialPhotos;

  useEffect(() => {
    // Check saved RSVP
    const savedRSVP = localStorage.getItem('dorielas_birthday_rsvp');
    if (savedRSVP) {
      try {
        setRsvpData(JSON.parse(savedRSVP));
      } catch {
        // ignore
      }
    }

    // Countdown
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = eventDate.getTime() - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // Attach audio element if present
    if (audioRef.current) {
      backgroundAudio.attachElement(audioRef.current);
    }

    // Synchronize mute and playback state with backgroundAudio manager
    const unsubscribeAudio = backgroundAudio.subscribe((state) => {
      setIsMuted(state.isMuted);
      setIsPlayingAudio(state.isPlaying);
    });

    return () => {
      clearInterval(interval);
      unsubscribeAudio();
    };
  }, []);

  const handleToggleMute = () => {
    const nextMuted = backgroundAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleTogglePlayPause = () => {
    if (isPlayingAudio) {
      backgroundAudio.pause(true);
    } else {
      backgroundAudio.play(true);
    }
  };

  const handlePauseMusic = () => {
    backgroundAudio.pause(true);
  };

  const handleStartMusic = () => {
    setIsMuted(false);
    backgroundAudio.play(true);
  };



  const triggerIntenseMonochromeConfetti = () => {
    // High-contrast monochrome palette: Pure White, Jet Black, Silver, Platinum
    const monoColors = ['#ffffff', '#000000', '#f3f4f6', '#a3a3a3', '#171717', '#e5e5e5'];

    try {
      // 1. Central high-impact blast
      confetti({
        particleCount: 130,
        spread: 100,
        origin: { y: 0.55 },
        colors: monoColors,
        shapes: ['square', 'circle'],
        scalar: 1.15,
        ticks: 240,
      });

      // 2. Left high-velocity cannon
      confetti({
        particleCount: 85,
        angle: 60,
        spread: 75,
        origin: { x: 0, y: 0.65 },
        colors: monoColors,
        ticks: 220,
      });

      // 3. Right high-velocity cannon
      confetti({
        particleCount: 85,
        angle: 120,
        spread: 75,
        origin: { x: 1, y: 0.65 },
        colors: monoColors,
        ticks: 220,
      });

      // 4. Secondary celebration shower from above (300ms)
      setTimeout(() => {
        confetti({
          particleCount: 90,
          spread: 120,
          decay: 0.91,
          scalar: 1.25,
          origin: { y: 0.35 },
          colors: monoColors,
          ticks: 260,
        });
      }, 300);

      // 5. Final curtain of silver and black stars (600ms)
      setTimeout(() => {
        confetti({
          particleCount: 70,
          spread: 90,
          origin: { y: 0.5 },
          colors: monoColors,
          ticks: 200,
        });
      }, 600);
    } catch {
      // fallback
    }
  };

  const playCelebrationChime = () => {
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
      // Cheerful ascending arpeggio (D5 -> F#5 -> A5 -> D6)
      const freqs = [587.33, 739.99, 880.0, 1174.66];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.08;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.08, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // fallback
    }
  };


  const playChime = () => {
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
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // fallback
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('Pizza Nostra');
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2200);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Dorielas Birthday Invitation',
      text: '¡Estás invitado al cumpleaños de Dorielas! Viernes 6 de Noviembre, 2026 a las 3:00 PM en Pizza Nostra. Dress Code: Blanco y Negro.',
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user closed
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleAddToCalendar = () => {
    const title = encodeURIComponent('Cumpleaños de Dorielas');
    const details = encodeURIComponent(
      'Celebración del cumpleaños de Dorielas en Pizza Nostra. Dress Code: Blanco y Negro (Black & White).'
    );
    const location = encodeURIComponent('Pizza Nostra');
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=20261106T150000/20261106T200000&details=${details}&location=${location}`;
    window.open(gCalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitRSVP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    setIsSubmitting(true);
    setIsVibrating(true);

    // Haptic vibration feedback on mobile devices
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([45, 50, 45, 70]);
      } catch {
        // ignore
      }
    }

    setTimeout(() => {
      const newRSVP: RSVPData = {
        name: guestName.trim(),
        attending,
        guests: attending === 'yes' ? guestCount : 0,
        dietary: dietary.trim(),
        message: message.trim(),
        confirmedAt: new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        ticketId: `DB-${Math.floor(100000 + Math.random() * 900000)}`,
      };

      localStorage.setItem('dorielas_birthday_rsvp', JSON.stringify(newRSVP));
      setRsvpData(newRSVP);
      setIsSubmitting(false);
      setIsSuccessAnimated(true);

      // Trigger intense Black & White confetti storm and celebration arpeggio
      triggerIntenseMonochromeConfetti();
      playCelebrationChime();

      // Stop vibration animation after 500ms
      setTimeout(() => {
        setIsVibrating(false);
      }, 500);

      // Transition smoothly from success state to VIP pass view
      setTimeout(() => {
        setIsSuccessAnimated(false);
        setIsModalOpen(false);
        // Scroll to RSVP section so user sees their generated VIP Pass
        scrollToRSVP();
      }, 2000);
    }, 450);
  };

  const handleWhatsAppSend = () => {
    if (!rsvpData) return;
    const text =
      attending === 'yes'
        ? `¡Hola Dorielas! Confirmo mi asistencia a tu cumpleaños 🎉%0A%0A*Nombre:* ${rsvpData.name}%0A*Pase:* ${rsvpData.ticketId}%0A*Invitados:* ${rsvpData.guests}%0A*Dress Code:* Blanco y Negro 🖤🤍%0A${
            rsvpData.dietary ? `*Nota:* ${rsvpData.dietary}%0A` : ''
          }${rsvpData.message ? `*Mensaje:* "${rsvpData.message}"%0A` : ''}%0A¡Nos vemos el Viernes 6 de Noviembre en Pizza Nostra!`
        : `¡Hola Dorielas! Gracias por la invitación a tu cumpleaños. Lamentablemente no podré acompañarte en esta ocasión, pero te deseo el mejor de los cumpleaños ❤️🎂`;

    window.open(`https://wa.me/?text=${text}`, '_blank');
  };



  const togglePhotoLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedPhotoIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const scrollToRSVP = () => {
    const el = document.getElementById('rsvp-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEnterInvitation = () => {
    playCelebrationChime();
    triggerIntenseMonochromeConfetti();
    setIsEnvelopeOpen(true);
    // Keep ambient music flowing smoothly into the celebration
    if (!isMuted) {
      backgroundAudio.play(false);
    }
  };

  // Elegant high-fashion display typography
  const getDisplayFontClass = () => 'font-editorial font-black italic tracking-tight';

  return (
    <div className="min-h-screen bg-black text-white font-sans-clean selection:bg-white selection:text-black overflow-x-hidden">
      {/* Top Floating Minimalist Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b border-neutral-900 transition-all">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs uppercase tracking-widest font-mono text-neutral-300">
              06.NOV.2026
            </span>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-widest text-neutral-400 font-bold">
            <a href="#location-section" className="hover:text-white transition-colors">
              Ubicación
            </a>
            <a href="#dresscode-section" className="hover:text-white transition-colors">
              Dress Code
            </a>
            <a href="#photos-section" className="hover:text-white transition-colors flex items-center gap-1">
              <Camera className="w-3 h-3" />
              Fotos
            </a>
            <a href="#rsvp-section" className="hover:text-white transition-colors">
              RSVP
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* BOTÓN DIRECTO PARA PAUSAR / REPRODUCIR LA MÚSICA */}
            <button
              onClick={handleTogglePlayPause}
              aria-label={isPlayingAudio ? 'Pausar música' : 'Reproducir música'}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 border border-neutral-700 hover:border-white bg-neutral-900/90 hover:bg-neutral-800 transition-all text-neutral-200 hover:text-white cursor-pointer"
              title={isPlayingAudio ? 'Pausar música' : 'Reproducir música'}
            >
              {isPlayingAudio ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-white fill-white" />
                  <span className="text-[10px] sm:text-[11px] uppercase font-mono tracking-wider font-bold">Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-white fill-white" />
                  <span className="text-[10px] sm:text-[11px] uppercase font-mono tracking-wider font-bold">Play</span>
                </>
              )}
            </button>

            <button
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
              className="flex items-center gap-1.5 px-2 py-1 border border-neutral-800 hover:border-white transition-all text-neutral-400 hover:text-white cursor-pointer"
              title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-white" />
              )}
            </button>

            <button
              onClick={handleShare}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-wider font-semibold border border-neutral-800 hover:border-white hover:bg-white hover:text-black transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir</span>
                </>
              )}
            </button>

            <button
              onClick={scrollToRSVP}
              className="px-3 py-1 text-xs uppercase tracking-widest font-black bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              RSVP
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          0. PORTADA DE INICIO: SOBRE OFICIAL SELLADO CON CERA 'D'
             (EMBOSSED WHITE ENVELOPE CON SELLO DE CERA Y MANCUERNAS)
         ======================================================== */}
      {!isEnvelopeOpen && (
        <Interactive3DEnvelope
          onEnter={handleEnterInvitation}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onStartMusic={handleStartMusic}
          isPlaying={isPlayingAudio}
          onTogglePlayPause={handleTogglePlayPause}
        />
      )}

      {/* ========================================================
          1. HERO SECTION (PORTADA)
          Fondo negro puro con texto blanco, nueva tipografía de alto impacto
         ======================================================== */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 px-4 sm:px-6 flex flex-col items-center justify-center min-h-[92vh] border-b border-neutral-900">
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />

        <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center relative z-10">
          {/* Subtle top kicker */}
          <div className="inline-flex items-center gap-3 px-3 py-1 mb-6 border border-neutral-800 bg-neutral-950 uppercase tracking-[0.3em] text-[11px] sm:text-xs text-neutral-400 font-medium">
            <span className="w-1.5 h-1.5 bg-white inline-block" />
            Estás invitado a celebrar
            <span className="w-1.5 h-1.5 bg-white inline-block" />
          </div>

          {/* Título principal GIGANTE con foto de portada integrada */}
          <div className="w-full my-1">
            <h1
              className={`${getDisplayFontClass()} text-[13vw] sm:text-[11vw] md:text-[9.5vw] lg:text-[8.5rem] leading-[0.85] uppercase select-none text-white text-center break-words`}
            >
              DORIELAS
            </h1>
          </div>

          {/* FOTO DE PORTADA - FOTO #5 (IMG-6230) REVISTA EDITORIAL / HIGH-FASHION COVER */}
          <div className="relative my-4 sm:my-6 max-w-[270px] sm:max-w-[310px] md:max-w-xs w-full mx-auto z-20">
            <div className="relative aspect-[3/4] border-4 border-white bg-neutral-950 shadow-[10px_10px_0px_0px_#ffffff] sm:shadow-[14px_14px_0px_0px_#ffffff] overflow-hidden group">
              <BlurUpImage
                src="https://i.ibb.co/BH5PpC6j/IMG-6230.jpg"
                alt="Doriela"
                aspectRatio="aspect-[3/4]"
                filterClass="grayscale contrast-125 hover:grayscale-0"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </div>

          <div className="w-full my-1">
            <h1
              className={`${getDisplayFontClass()} text-[13vw] sm:text-[11vw] md:text-[9.5vw] lg:text-[8.5rem] leading-[0.85] uppercase select-none text-white text-center break-words`}
            >
              BIRTHDAY
            </h1>
          </div>

          <div className="w-24 sm:w-36 h-[2px] bg-white my-8" />

          {/* Fecha y Hora destacadas */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
            <div className="inline-flex items-center gap-2 text-base sm:text-lg md:text-xl font-bold tracking-tight text-white uppercase">
              <Calendar className="w-5 h-5 text-white" />
              <span>Viernes 6 de Noviembre, 2026</span>
            </div>
            <span className="hidden sm:inline text-neutral-500 font-light text-xl">|</span>
            <div className="inline-flex items-center gap-2 text-base sm:text-lg md:text-xl font-bold tracking-tight text-white uppercase">
              <Clock className="w-5 h-5 text-white" />
              <span>3:00 PM</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleAddToCalendar}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-widest font-bold border border-white text-white hover:bg-white hover:text-black transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Añadir a mi Calendario</span>
            </button>
            <button
              onClick={scrollToRSVP}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs uppercase tracking-widest font-black bg-white text-black hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              <span>Confirmar Asistencia</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MENSAJE DE DEDICACIÓN ESPECIAL DE CUMPLEAÑOS (LUIS Y NIKOLL SOLO ABAJO) */}
          <div className="mt-10 max-w-xl w-full mx-auto p-6 sm:p-8 border-2 border-white bg-neutral-950 text-white relative shadow-[8px_8px_0px_0px_#ffffff] text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 bg-white text-black text-[10px] sm:text-xs uppercase font-mono tracking-[0.25em] font-black">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>DEDICATORIA ESPECIAL</span>
              <Sparkles className="w-3.5 h-3.5 text-black" />
            </div>

            <p className="font-editorial italic text-base sm:text-lg md:text-xl text-neutral-200 leading-relaxed">
              “Dori, eres de esas personas que dejan una huella imborrable en el corazón. Tu luz, tu alegría inagotable, tu nobleza y esa energía tan bonita y auténtica te hacen verdaderamente única. Gracias por ser una amiga incondicional, leal y maravillosa a la que queremos y admiramos con toda el alma. ¡Que la vida te multiplique todo lo bueno que das a los demás!”
            </p>

            <div className="my-4 py-2 border-y border-neutral-800">
              <p className="font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                ¡Felicidades a la <span className="bg-white text-black px-2 py-0.5 inline-block font-black">“vayan calentando”</span>! 💪✨
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-neutral-400 font-mono">
              <Heart className="w-3.5 h-3.5 fill-white text-white" />
              <span>Con mucho cariño, de parte de: <strong className="text-white font-bold">Luis y Nikoll</strong></span>
              <Heart className="w-3.5 h-3.5 fill-white text-white" />
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="mt-12 w-full max-w-xl">
            <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500 mb-3 font-semibold">
              Cuenta Regresiva
            </p>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: 'DÍAS', value: timeLeft.days },
                { label: 'HORAS', value: timeLeft.hours },
                { label: 'MINUTOS', value: timeLeft.minutes },
                { label: 'SEGUNDOS', value: timeLeft.seconds },
              ].map((item, idx) => (
                <div key={idx} className="border border-neutral-800 bg-neutral-950 p-3 sm:p-4 text-center">
                  <span className="font-editorial font-bold text-2xl sm:text-4xl md:text-5xl block text-white tabular-nums leading-none">
                    {String(item.value).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[10px] tracking-widest text-neutral-400 uppercase font-semibold mt-1 block">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hidden Background Audio element (seamless background playback without visual clutter) */}
          <audio
            ref={audioRef}
            loop
            preload="auto"
            className="hidden"
            src="https://www.dropbox.com/scl/fi/gxpmufvs9dzube4lkodtw/Hoy-es-mi-cumplea-os-Los-Titanes-de-Durango-Letra.mp3?rlkey=lcx7auljavpcxaj9eucft0dx0&st=194yep9y&raw=1"
          >
            <source
              src="https://www.dropbox.com/scl/fi/gxpmufvs9dzube4lkodtw/Hoy-es-mi-cumplea-os-Los-Titanes-de-Durango-Letra.mp3?rlkey=lcx7auljavpcxaj9eucft0dx0&st=194yep9y&raw=1"
              type="audio/mpeg"
            />
            <source
              src="/audio/hoy-es-mi-cumpleanos.mp3"
              type="audio/mpeg"
            />
          </audio>

          {/* Scroll down */}
          <button
            onClick={() => {
              document.getElementById('location-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            aria-label="Ir a la ubicación"
            className="mt-12 text-neutral-500 hover:text-white transition-colors animate-bounce p-2"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Marquee Banner - Solo Doriela Birthday */}
      <div className="bg-white text-black py-2.5 overflow-hidden whitespace-nowrap select-none border-y border-black font-black text-xs sm:text-sm tracking-widest uppercase">
        <div className="inline-block animate-pulse">
          <span>
            DORIELA BIRTHDAY &bull; DORIELA BIRTHDAY &bull; DORIELA BIRTHDAY &bull; DORIELA BIRTHDAY &bull; DORIELA BIRTHDAY &bull; DORIELA BIRTHDAY &bull; DORIELA BIRTHDAY &bull; DORIELA BIRTHDAY
          </span>
        </div>
      </div>

      {/* ========================================================
          2. UBICACIÓN (TARJETA DE LUGAR - 3D FLIP CARD DESTAPABLE)
         ======================================================== */}
      <section id="location-section" className="py-20 md:py-28 px-4 sm:px-6 bg-white text-black relative">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-10">
              <span className="text-xs uppercase tracking-[0.25em] font-black text-black">
                [ 01 / UBICACIÓN ]
              </span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isLocationFlipped ? 'bg-black' : 'bg-neutral-400 animate-ping'}`} />
                <span className="text-xs uppercase tracking-widest text-neutral-600 font-bold">
                  {isLocationFlipped ? 'Destapada ✓' : 'Toca para destapar'}
                </span>
              </div>
            </div>

            {/* 3D Flip Card Container */}
            <div className="perspective-1000 w-full min-h-[460px] sm:min-h-[420px]">
              <div
                onClick={() => {
                  setIsLocationFlipped(!isLocationFlipped);
                  playChime();
                  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    try { navigator.vibrate(35); } catch {}
                  }
                }}
                style={{
                  transform: isLocationFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
                className="relative w-full h-full transform-style-3d transition-transform duration-700 ease-in-out cursor-pointer"
              >
                {/* CARA FRONTAL: TOTALMENTE OCULTA / SELLADA (NO MUESTRA NADA HASTA DESTAPAR) */}
                <div className="backface-hidden w-full h-full border-4 border-black p-8 sm:p-12 md:p-14 bg-white text-black shadow-[8px_8px_0px_0px_#000000] flex flex-col justify-between select-none">
                  <div className="flex items-center justify-between border-b-2 border-black pb-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-[11px] uppercase tracking-widest font-black">
                      <Lock className="w-3.5 h-3.5" />
                      Lugar Protegido
                    </span>
                    <span className="text-xs uppercase tracking-widest font-mono text-neutral-500 font-bold">
                      SECRETO
                    </span>
                  </div>

                  <div className="my-8 text-center flex flex-col items-center">
                    <div className="relative mb-5">
                      <div className="w-16 h-16 rounded-full bg-neutral-100 border-2 border-black flex items-center justify-center">
                        <Lock className="w-7 h-7 text-black stroke-[2]" />
                      </div>
                      <div className="absolute -inset-1.5 rounded-full border border-black animate-ping opacity-25 pointer-events-none" />
                    </div>

                    <h3 className={`${getDisplayFontClass()} text-4xl sm:text-5xl md:text-6xl uppercase text-black leading-none mb-3`}>
                      ¿DÓNDE CELEBRAREMOS?
                    </h3>

                    <p className="text-sm sm:text-base font-semibold text-neutral-700 max-w-md mx-auto leading-relaxed">
                      La ubicación oficial se encuentra sellada para los invitados. Toca esta tarjeta para romper el sello y destapar el punto de encuentro.
                    </p>

                    <div className="mt-6">
                      <span className="inline-flex items-center gap-2 px-6 py-3.5 bg-black text-white text-xs uppercase tracking-widest font-black shadow-[4px_4px_0px_0px_#737373] hover:bg-neutral-800 transition-all border-2 border-black">
                        <Unlock className="w-4 h-4" />
                        <span>TOCAR PARA DESTAPAR EL LUGAR</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-black flex items-center justify-between text-xs uppercase font-extrabold text-neutral-500">
                    <span>Información Oculta</span>
                    <span className="text-black inline-flex items-center gap-1.5">
                      <span>Destapar</span>
                      <RotateCw className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* CARA TRASERA: DESTAPADA / REVELACIÓN COMPLETA DE PIZZA NOSTRA */}
                <div className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full border-4 border-black p-6 sm:p-10 md:p-12 bg-black text-white shadow-[8px_8px_0px_0px_#ffffff] flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-white text-black text-xs uppercase tracking-widest font-black">
                        <Unlock className="w-3.5 h-3.5" />
                        ¡Ubicación Destapada!
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsLocationFlipped(false);
                          playChime();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 border border-neutral-700 bg-neutral-900 hover:bg-white hover:text-black text-white text-xs uppercase tracking-widest font-black transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Volver a Tapar</span>
                      </button>
                    </div>

                    <h3 className={`${getDisplayFontClass()} text-4xl sm:text-5xl md:text-7xl uppercase text-white leading-none mb-2`}>
                      PIZZA NOSTRA
                    </h3>

                    <p className="text-sm sm:text-base text-neutral-300 font-medium max-w-xl">
                      El punto de encuentro para una tarde de pizzas artesanales, brindis y la mejor compañía para celebrar a Dorielas.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-3 border-t border-neutral-800">
                      <div className="p-3 bg-neutral-950 border border-neutral-800">
                        <p className="text-[10px] uppercase tracking-widest font-mono text-neutral-400">
                          Fecha & Horario
                        </p>
                        <p className="text-sm font-bold text-white mt-0.5">
                          Viernes 6 de Noviembre, 2026
                        </p>
                        <p className="text-xs text-neutral-400">
                          Inicio puntual: 3:00 PM
                        </p>
                      </div>

                      <div className="p-3 bg-neutral-950 border border-neutral-800">
                        <p className="text-[10px] uppercase tracking-widest font-mono text-neutral-400">
                          Recepción
                        </p>
                        <p className="text-sm font-bold text-white mt-0.5">
                          Mesa VIP Reservada
                        </p>
                        <p className="text-xs text-neutral-400">
                          Preguntar por la mesa de Dorielas
                        </p>
                      </div>
                    </div>

                    {/* Botones de acción al destapar */}
                    <div className="flex flex-wrap items-center gap-3 mt-5">
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Pizza+Nostra"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-black text-xs uppercase tracking-widest font-black hover:bg-neutral-200 transition-all border-2 border-white group"
                      >
                        <span>Abrir en Google Maps</span>
                        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </a>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyAddress();
                        }}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-black text-white text-xs uppercase tracking-widest font-bold hover:bg-neutral-900 transition-all border-2 border-neutral-700 hover:border-white"
                      >
                        {copiedAddress ? (
                          <>
                            <Check className="w-4 h-4 text-white" />
                            <span>¡Nombre Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copiar Nombre</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs uppercase text-neutral-400">
                    <span>Toca en cualquier parte para volver a tapar</span>
                    <RotateCw className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ========================================================
          3. DRESS CODE (CÓDIGO DE VESTIMENTA - 3D FLIP CARD DESTAPABLE)
         ======================================================== */}
      <section id="dresscode-section" className="py-20 md:py-28 px-4 sm:px-6 bg-black text-white border-t border-b border-neutral-900 relative">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-10">
              <span className="text-xs uppercase tracking-[0.25em] font-black text-white">
                [ 02 / CÓDIGO DE VESTIMENTA ]
              </span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isDressCodeFlipped ? 'bg-white' : 'bg-neutral-500 animate-ping'}`} />
                <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
                  {isDressCodeFlipped ? 'Destapado ✓' : 'Toca para destapar'}
                </span>
              </div>
            </div>

            {/* 3D Flip Card Container */}
            <div className="perspective-1000 w-full min-h-[480px] sm:min-h-[440px]">
              <div
                onClick={() => {
                  setIsDressCodeFlipped(!isDressCodeFlipped);
                  playChime();
                  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    try { navigator.vibrate(35); } catch {}
                  }
                }}
                style={{
                  transform: isDressCodeFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
                className="relative w-full h-full transform-style-3d transition-transform duration-700 ease-in-out cursor-pointer"
              >
                {/* CARA FRONTAL: TOTALMENTE OCULTA / SELLADA (NO MUESTRA NADA HASTA DESTAPAR) */}
                <div className="backface-hidden w-full h-full border-4 border-neutral-800 p-8 sm:p-12 md:p-14 bg-neutral-950 text-white shadow-[8px_8px_0px_0px_#262626] flex flex-col justify-between select-none">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-white text-black text-[11px] uppercase tracking-widest font-black">
                      <EyeOff className="w-3.5 h-3.5" />
                      Temática Oculta
                    </span>
                    <span className="text-xs uppercase tracking-widest font-mono text-neutral-500 font-bold">
                      CLASIFICADO
                    </span>
                  </div>

                  <div className="my-8 text-center flex flex-col items-center">
                    <div className="relative mb-5">
                      <div className="w-16 h-16 rounded-full bg-black border-2 border-neutral-700 flex items-center justify-center">
                        <EyeOff className="w-7 h-7 text-white stroke-[2]" />
                      </div>
                      <div className="absolute -inset-1.5 rounded-full border border-white/50 animate-ping opacity-25 pointer-events-none" />
                    </div>

                    <h3 className={`${getDisplayFontClass()} text-4xl sm:text-5xl md:text-6xl uppercase text-white leading-none mb-3`}>
                      ¿CÓMO DEBES VENIR VESTIDO?
                    </h3>

                    <p className="text-sm sm:text-base font-light text-neutral-300 max-w-md mx-auto leading-relaxed">
                      El código de vestimenta es una sorpresa temática especial. Toca esta tarjeta para romper el sello y destapar los colores requeridos.
                    </p>

                    <div className="mt-6">
                      <span className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-black text-xs uppercase tracking-widest font-black shadow-[4px_4px_0px_0px_#ffffff] hover:bg-neutral-200 transition-all border-2 border-white">
                        <Sparkles className="w-4 h-4" />
                        <span>TOCAR PARA DESTAPAR DRESS CODE</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-xs uppercase font-extrabold text-neutral-400">
                    <span>Regla Oculta</span>
                    <span className="text-white inline-flex items-center gap-1.5">
                      <span>Destapar</span>
                      <RotateCw className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* CARA TRASERA: DESTAPADA / REVELACIÓN COMPLETA DE BLANCO Y NEGRO */}
                <div className="backface-hidden rotate-y-180 absolute inset-0 w-full h-full border-4 border-black p-6 sm:p-10 md:p-12 bg-white text-black shadow-[8px_8px_0px_0px_#ffffff] flex flex-col justify-between overflow-y-auto">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-xs uppercase tracking-widest font-black">
                        <Sparkles className="w-3.5 h-3.5" />
                        ¡Dress Code Destapado!
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDressCodeFlipped(false);
                          playChime();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-black bg-neutral-100 hover:bg-black hover:text-white text-black text-xs uppercase tracking-widest font-black transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Volver a Tapar</span>
                      </button>
                    </div>

                    <div className="space-y-1 mb-4">
                      <span className="text-xs uppercase tracking-[0.25em] font-extrabold text-neutral-500">
                        La Temática Oficial
                      </span>
                      <h3 className={`${getDisplayFontClass()} text-4xl sm:text-5xl md:text-6xl uppercase text-black leading-none`}>
                        BLANCO Y NEGRO
                      </h3>
                      <p className="text-sm font-semibold text-neutral-700">
                        Ven con tu mejor outfit monocromático (Black & White).
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="p-3 bg-neutral-100 border-2 border-black">
                        <span className="text-[10px] uppercase tracking-widest font-black bg-black text-white px-2 py-0.5 inline-block">
                          01 / Total Black
                        </span>
                        <p className="text-xs text-neutral-800 mt-1 leading-snug">
                          Negro completo de pies a cabeza. Sofisticado y audaz.
                        </p>
                      </div>

                      <div className="p-3 bg-neutral-100 border-2 border-black">
                        <span className="text-[10px] uppercase tracking-widest font-black bg-black text-white px-2 py-0.5 inline-block">
                          02 / All White
                        </span>
                        <p className="text-xs text-neutral-800 mt-1 leading-snug">
                          Blanco puro de pies a cabeza. Fresco, limpio y elegante.
                        </p>
                      </div>

                      <div className="p-3 bg-neutral-100 border-2 border-black">
                        <span className="text-[10px] uppercase tracking-widest font-black bg-black text-white px-2 py-0.5 inline-block">
                          03 / B&W Mix
                        </span>
                        <p className="text-xs text-neutral-800 mt-1 leading-snug">
                          Combinación en bloques blanco y negro con alto contraste.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 p-2.5 bg-neutral-50 border border-neutral-300 text-xs text-neutral-800 flex items-center justify-between">
                      <span><strong>Accesorios:</strong> Plata, acero o negro mate.</span>
                      <div className="flex gap-1.5 shrink-0 ml-2">
                        <span className="w-4 h-4 bg-black border border-neutral-400" />
                        <span className="w-4 h-4 bg-white border border-black" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t-2 border-black flex items-center justify-between text-xs uppercase font-extrabold text-neutral-600">
                    <span>Toca en cualquier parte para volver a tapar</span>
                    <RotateCw className="w-3.5 h-3.5 text-black" />
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ========================================================
          NUEVA SECCIÓN: SECCIÓN DE FOTOS (GALERÍA DE RECUERDOS & VIBES)
         ======================================================== */}
      <section
        id="photos-section"
        className="py-20 md:py-28 px-4 sm:px-6 bg-neutral-950 text-white border-b border-neutral-900 relative"
      >
        <div className="max-w-5xl mx-auto">
          {/* Section Indicator & Header con animación de revelación */}
          <RevealOnScroll>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-10">
              <span className="text-xs uppercase tracking-[0.25em] font-black text-white">
                [ 03 / SECCIÓN DE FOTOS ]
              </span>
              <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                Photo Dump & Recuerdos
              </span>
            </div>

            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <span className="text-xs uppercase tracking-[0.3em] text-neutral-500 font-bold block mb-2">
                  Galería Visual
                </span>
                <h3 className={`${getDisplayFontClass()} text-4xl sm:text-5xl md:text-7xl uppercase text-white leading-none`}>
                  MOMENTOS & VIBES
                </h3>
                <p className="text-neutral-400 text-sm sm:text-base max-w-xl mt-3 font-light">
                  Capturas de los mejores momentos, la estética en blanco y negro y los recuerdos que crearemos en esta celebración.
                </p>
              </div>

              {/* Controls: B&W Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGalleryFilter(galleryFilter === 'mono' ? 'all' : 'mono')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs uppercase tracking-wider font-bold border transition-all ${
                    galleryFilter === 'mono'
                      ? 'border-white bg-white text-black'
                      : 'border-neutral-700 text-neutral-300 hover:border-white'
                  }`}
                  title="Alternar filtro blanco y negro"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{galleryFilter === 'mono' ? 'Filtro B&N: Activo' : 'Color Original'}</span>
                </button>
              </div>
            </div>
          </RevealOnScroll>

          {/* Photos Masonry Grid con animación de revelación */}
          <RevealOnScroll delay={150}>
            <div className="columns-2 md:columns-3 gap-4 space-y-4">
              {allPhotos.map((photo, index) => {
                const isLiked = likedPhotoIds[photo.id];
                return (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="break-inside-avoid group cursor-pointer border-2 border-neutral-800 bg-black p-2.5 sm:p-3 hover:border-white transition-all duration-300 relative shadow-md hover:shadow-2xl"
                  >
                    {/* Photo Container with IntersectionObserver & Blur-Up Effect */}
                    <div className="relative overflow-hidden bg-neutral-900">
                      <BlurUpImage
                        src={photo.url}
                        alt={photo.title || `Momento ${index + 1}`}
                        filterClass={galleryFilter === 'mono' ? 'grayscale contrast-125' : ''}
                        className="group-hover:scale-[1.02] transition-transform duration-500"
                      />

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="p-2.5 bg-white text-black">
                          <Maximize2 className="w-4 h-4 stroke-[2.5]" />
                        </span>
                      </div>

                      {/* Tag badge */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-0.5 bg-black/85 backdrop-blur-sm border border-neutral-700 text-[10px] uppercase font-mono tracking-widest text-white">
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                      </div>

                      {/* Like button */}
                      <button
                        type="button"
                        onClick={(e) => togglePhotoLike(photo.id, e)}
                        aria-label="Me gusta esta foto"
                        className="absolute top-2 right-2 p-1.5 bg-black/85 backdrop-blur-sm border border-neutral-700 hover:border-white transition-colors"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-colors ${
                            isLiked ? 'fill-white text-white' : 'text-neutral-300'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Caption footer */}
                    <div className="pt-2.5 pb-0.5 flex items-center justify-between text-left">
                      <div>
                        <h4 className="text-xs uppercase font-extrabold tracking-wider text-white">
                          {photo.title}
                        </h4>
                        <p className="text-[11px] text-neutral-400 truncate max-w-[160px] sm:max-w-[200px]">
                          {photo.caption}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest shrink-0">
                        {photo.likes + (isLiked ? 1 : 0)} ♥
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs uppercase tracking-widest text-neutral-500 mt-8 font-semibold">
              Haz clic en cualquier imagen para verla en pantalla completa
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* PHOTO LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full border-4 border-white bg-black p-4 sm:p-6 text-white relative shadow-[0_0_50px_rgba(255,255,255,0.1)]"
          >
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-white text-black hover:bg-neutral-200 transition-colors z-10"
              aria-label="Cerrar foto"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-neutral-950 mb-4 border border-neutral-800">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className={`w-full h-full object-contain ${
                  galleryFilter === 'mono' ? 'grayscale contrast-125' : ''
                }`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800 pt-4">
              <div>
                <h4 className="font-display text-2xl uppercase font-black text-white">
                  {selectedPhoto.title}
                </h4>
                <p className="text-sm text-neutral-400 mt-0.5">
                  {selectedPhoto.caption}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGalleryFilter(galleryFilter === 'mono' ? 'all' : 'mono')}
                  className="px-3 py-1.5 border border-neutral-700 text-xs uppercase tracking-widest font-bold hover:border-white"
                >
                  {galleryFilter === 'mono' ? 'Ver en Color' : 'Ver en B&N'}
                </button>
                <a
                  href={selectedPhoto.url}
                  download="dorielas_birthday_photo.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-1.5 bg-white text-black text-xs uppercase tracking-widest font-black hover:bg-neutral-200"
                >
                  Descargar
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          4. CONFIRMACIÓN (RSVP)
         ======================================================== */}
      <section id="rsvp-section" className="py-20 md:py-28 px-4 sm:px-6 bg-white text-black relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Header con revelación al scroll */}
          <RevealOnScroll>
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-10">
              <span className="text-xs uppercase tracking-[0.25em] font-black text-black">
                [ 04 / CONFIRMACIÓN ]
              </span>
              <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">
                R.S.V.P.
              </span>
            </div>

            <h3 className={`${getDisplayFontClass()} text-4xl sm:text-6xl md:text-7xl uppercase leading-none text-black mb-4`}>
              CONFIRMAR ASISTENCIA
            </h3>

            <p className="text-lg sm:text-xl font-medium text-neutral-800 max-w-xl mx-auto mb-8">
              Por favor, confirma tu asistencia para reservar tu lugar.
            </p>
          </RevealOnScroll>

          {/* Tarjeta / Botón RSVP con revelación escalonada al scroll */}
          <RevealOnScroll delay={150}>
            {rsvpData ? (
              <div className="border-4 border-black p-6 sm:p-8 bg-neutral-50 text-left relative shadow-[8px_8px_0px_0px_#000000]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-4 mb-6">
                  <div>
                    <span className="text-[11px] uppercase tracking-widest font-black bg-black text-white px-2 py-0.5 inline-block">
                      Pase Confirmado
                    </span>
                    <p className="text-xl uppercase font-black text-black mt-1 font-mono">
                      {rsvpData.ticketId}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs uppercase font-extrabold text-black">
                    <CheckCircle2 className="w-4 h-4 text-black" />
                    <span>Lugar Reservado</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-widest font-bold text-neutral-500">
                    Invitado Registrado:
                  </p>
                  <p className={`${getDisplayFontClass()} text-3xl sm:text-4xl uppercase text-black`}>
                    {rsvpData.name}
                  </p>
                  <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                    <div>
                      <span className="text-xs text-neutral-500 uppercase tracking-wider block font-bold">Estado:</span>
                      <span className="font-bold text-black">
                        {rsvpData.attending === 'yes' ? `Asistirá (${rsvpData.guests} persona${rsvpData.guests > 1 ? 's' : ''})` : 'No podrá asistir'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-neutral-500 uppercase tracking-wider block font-bold">Dress Code:</span>
                      <span className="font-bold text-black">Blanco y Negro</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-6 mt-6 border-t-2 border-black">
                  <button
                    onClick={handleWhatsAppSend}
                    className="inline-flex items-center gap-2 px-5 py-3 bg-black text-white text-xs uppercase tracking-widest font-black hover:bg-neutral-800 transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Confirmación a Dorielas</span>
                  </button>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-3 bg-white text-black border-2 border-black text-xs uppercase tracking-widest font-bold hover:bg-neutral-100 transition-all"
                  >
                    <span>Editar Registro</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 bg-black text-white text-base sm:text-lg uppercase tracking-widest font-black hover:bg-neutral-800 transition-all shadow-[6px_6px_0px_0px_#333333] active:translate-x-1 active:translate-y-1 active:shadow-none border-2 border-black"
                >
                  <span>Confirmar Asistencia</span>
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                </button>

                <p className="text-xs uppercase tracking-widest text-neutral-500 font-semibold mt-4">
                  Toma menos de 1 minuto &bull; Reserva instantánea
                </p>
              </div>
            )}
          </RevealOnScroll>
        </div>
      </section>

      {/* MODAL DE CONFIRMACIÓN (RSVP CON VIBRACIÓN Y ANIMACIÓN DE ENVÍO EXITOSO) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg bg-white text-black border-4 border-black p-6 sm:p-8 relative shadow-[12px_12px_0px_0px_#ffffff] max-h-[90vh] overflow-y-auto transition-all ${
              isVibrating ? 'animate-vibrate-subtle' : ''
            }`}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-black hover:bg-neutral-200 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            {isSuccessAnimated ? (
              /* EFECTO VISUAL DE ENVÍO EXITOSO */
              <div className="py-10 px-2 flex flex-col items-center justify-center text-center animate-success-pop">
                <div className="relative mb-6">
                  {/* Outer pulse wave */}
                  <div className="absolute -inset-3 rounded-full border-2 border-black animate-ping opacity-60" />
                  <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center border-4 border-black shadow-xl">
                    <Check className="w-10 h-10 stroke-[3.5] animate-pulse" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-xs uppercase tracking-[0.25em] font-black mb-3">
                  <Sparkles className="w-3.5 h-3.5" />
                  ¡Envío Exitoso!
                  <Sparkles className="w-3.5 h-3.5" />
                </div>

                <h4 className={`${getDisplayFontClass()} text-3xl sm:text-4xl uppercase text-black leading-tight mb-2`}>
                  LUGAR CONFIRMADO
                </h4>

                <p className="text-sm font-medium text-neutral-700 max-w-xs mx-auto leading-relaxed">
                  Gracias, <strong className="text-black font-extrabold">{guestName}</strong>. Tu asistencia ha sido registrada. Generando tu pase digital VIP...
                </p>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-black text-black">
                  <span className="w-2 h-2 rounded-full bg-black animate-ping" />
                  <span>Black & White &bull; 06.Nov.2026</span>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b-2 border-black pb-3 mb-6">
                  <span className="text-[10px] uppercase tracking-[0.25em] font-black text-neutral-500">
                    Reserva de Lugar
                  </span>
                  <h4 className={`${getDisplayFontClass()} text-3xl sm:text-4xl uppercase text-black`}>
                    CONFIRMAR ASISTENCIA
                  </h4>
                  <p className="text-xs uppercase tracking-wider text-neutral-600 font-semibold mt-1">
                    Dorielas Birthday &bull; Pizza Nostra
                  </p>
                </div>

                <form onSubmit={handleSubmitRSVP} className="space-y-5">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-black text-black mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Ej. Sofia Méndez"
                      className="w-full px-4 py-3 bg-neutral-50 border-2 border-black text-black font-semibold text-sm focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-black text-black mb-2">
                      ¿Asistirás a la celebración? *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAttending('yes')}
                        className={`py-3 px-4 text-xs uppercase tracking-widest font-black border-2 border-black transition-all ${
                          attending === 'yes'
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-neutral-100'
                        }`}
                      >
                        ✓ ¡Sí, asistiré!
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttending('no')}
                        className={`py-3 px-4 text-xs uppercase tracking-widest font-black border-2 border-black transition-all ${
                          attending === 'no'
                            ? 'bg-black text-white'
                            : 'bg-white text-black hover:bg-neutral-100'
                        }`}
                      >
                        ✕ No podré ir
                      </button>
                    </div>
                  </div>

                  {attending === 'yes' && (
                    <>
                      <div>
                        <label className="block text-xs uppercase tracking-widest font-black text-black mb-1">
                          Número total de personas (tú + acompañantes)
                        </label>
                        <select
                          value={guestCount}
                          onChange={(e) => setGuestCount(Number(e.target.value))}
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-black text-black font-semibold text-sm focus:outline-none focus:bg-white"
                        >
                          <option value={1}>1 persona (solo yo)</option>
                          <option value={2}>2 personas (+1 acompañante)</option>
                          <option value={3}>3 personas (+2 acompañantes)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-widest font-black text-black mb-1">
                          Preferencia de pizza o alergias (Opcional)
                        </label>
                        <input
                          type="text"
                          value={dietary}
                          onChange={(e) => setDietary(e.target.value)}
                          placeholder="Ej. Vegetariana, Sin gluten, Sin queso"
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-black text-black font-semibold text-sm focus:outline-none focus:bg-white"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs uppercase tracking-widest font-black text-black mb-1">
                      Mensaje para Dorielas (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="¡Nos vemos para celebrar!"
                      className="w-full px-4 py-2.5 bg-neutral-50 border-2 border-black text-black font-semibold text-sm focus:outline-none focus:bg-white resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-4 bg-black text-white text-xs sm:text-sm uppercase tracking-widest font-black hover:bg-neutral-800 transition-all border-2 border-black flex items-center justify-center gap-2 ${
                        isVibrating ? 'animate-vibrate-subtle' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Procesando...</span>
                        </span>
                      ) : (
                        <>
                          <span>Guardar mi Confirmación</span>
                          <Check className="w-4 h-4 stroke-[3]" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-black text-white py-12 px-4 sm:px-6 border-t border-neutral-900">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <p className={`${getDisplayFontClass()} text-2xl uppercase tracking-wider text-white`}>
              DORIELAS BIRTHDAY
            </p>
            <p className="text-xs uppercase tracking-widest text-neutral-400 mt-1 font-semibold font-mono">
              06.NOV.2026 &bull; PIZZA NOSTRA &bull; 3:00 PM
            </p>
          </div>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-xs uppercase tracking-widest font-bold text-neutral-400 hover:text-white transition-colors"
          >
            Volver Arriba ↑
          </button>
        </div>
      </footer>

      {/* Floating Bottom Audio Controller: Permite pausar/reproducir con 1 clic en cualquier lugar */}
      {isEnvelopeOpen && (
        <aside
          aria-label="Reproductor de música flotante"
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 p-1.5 sm:p-2 bg-black/95 backdrop-blur-md border border-neutral-700 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.8)] transition-all animate-fade-in"
        >
          <div className="flex items-center gap-2 pl-2 sm:pl-3 pr-1">
            <Disc
              className={`w-4 h-4 text-neutral-300 ${isPlayingAudio ? 'animate-spin' : ''}`}
              style={{ animationDuration: '3s' }}
            />
            <div className="hidden xs:block text-left max-w-[120px] sm:max-w-[160px]">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white truncate leading-tight">
                Hoy es mi cumpleaños
              </p>
              <p className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest truncate">
                Titanes de Durango
              </p>
            </div>
            {isPlayingAudio && !isMuted && (
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-0.5 h-3 bg-white animate-pulse" />
                <span className="w-0.5 h-1.5 bg-white animate-pulse" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-2 bg-white animate-pulse" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {/* Botón Destacado: Pausar / Reproducir */}
          <button
            type="button"
            onClick={handleTogglePlayPause}
            aria-label={isPlayingAudio ? 'Pausar música' : 'Reproducir música'}
            className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              isPlayingAudio
                ? 'bg-white text-black hover:bg-neutral-200 shadow-md'
                : 'bg-neutral-900 text-white border border-neutral-600 hover:border-white'
            }`}
            title={isPlayingAudio ? 'Pausar música' : 'Reproducir música'}
          >
            {isPlayingAudio ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-black text-black" />
                <span className="text-[11px] font-bold">Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white text-white" />
                <span className="text-[11px] font-bold">Play</span>
              </>
            )}
          </button>

          {/* Mute/Sonido */}
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-white" />}
          </button>
        </aside>
      )}
    </div>
  );
}
