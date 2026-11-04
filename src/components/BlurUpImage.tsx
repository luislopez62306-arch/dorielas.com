import React, { useState } from 'react';
import { useProgressiveImage } from '../hooks/useProgressiveImage';

interface BlurUpImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
  filterClass?: string;
  onImageLoad?: () => void;
  rootMargin?: string;
}

/**
 * BlurUpImage component
 * Uses IntersectionObserver to defer image loading until in viewport,
 * displaying a lightweight blurred placeholder that smoothly transitions (blur-up)
 * to full high-definition resolution once loaded.
 */
export default function BlurUpImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  aspectRatio,
  filterClass = '',
  onImageLoad,
  rootMargin = '200px 0px',
}: BlurUpImageProps) {
  const { containerRef, isInView, isLoaded } = useProgressiveImage(src, { rootMargin });
  const [internalLoaded, setInternalLoaded] = useState(false);

  const isImageReady = isLoaded || internalLoaded;

  // Ultra-lightweight inline low-res monochromatic SVG placeholder
  const lowResSvgPlaceholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23171717"/><stop offset="50%" stop-color="%23262626"/><stop offset="100%" stop-color="%230f0f0f"/></linearGradient></defs><rect width="32" height="42" fill="url(%23bg)"/><circle cx="16" cy="18" r="6" fill="%23383838" opacity="0.5"/><path d="M7 36 C7 28, 25 28, 25 36 Z" fill="%23383838" opacity="0.5"/></svg>`;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-neutral-950 select-none ${aspectRatio || 'min-h-[200px]'} ${containerClassName}`}
    >
      {/* 1. Low-Resolution Blurred Placeholder */}
      <img
        src={lowResSvgPlaceholder}
        alt=""
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-700 ease-out ${
          isImageReady ? 'opacity-0' : 'opacity-100 animate-pulse'
        }`}
        style={{
          filter: 'blur(22px)',
          transform: 'scale(1.12)',
        }}
      />

      {/* 2. Shimmer sweep overlay while loading */}
      {!isImageReady && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer-sweep pointer-events-none" />
      )}

      {/* 3. High-Definition Image (loaded on viewport intersection) */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => {
            setInternalLoaded(true);
            if (onImageLoad) onImageLoad();
          }}
          className={`w-full h-auto object-cover transition-all duration-700 ease-out ${filterClass} ${className} ${
            isImageReady
              ? 'opacity-100 blur-0 scale-100'
              : 'opacity-0 blur-xl scale-105'
          }`}
          style={{
            willChange: 'filter, opacity, transform',
          }}
        />
      )}
    </div>
  );
}
