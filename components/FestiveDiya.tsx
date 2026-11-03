import React, { useState } from 'react';
import { createFestiveBurst, launchDiwaliRockets } from '../lib/festiveFx';

interface FestiveDiyaProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FestiveDiya: React.FC<FestiveDiyaProps> = ({ className = '', size = 'md' }) => {
  const [isSparking, setIsSparking] = useState(false);
  const [showBlessing, setShowBlessing] = useState(false);

  const sizeMap = {
    sm: { box: 'w-8 h-8', svg: 32 },
    md: { box: 'w-10 h-10', svg: 40 },
    lg: { box: 'w-14 h-14', svg: 56 },
  };

  const currentSize = sizeMap[size];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 3; // Flame tip

    // 1. Flame sparkler pop
    createFestiveBurst(originX, originY, {
      count: 32,
      colors: ['#F59E0B', '#EAB308', '#FCD34D', '#F97316', '#FFFFFF'],
      sound: 'sparkle',
    });

    // 2. Launch full recognizable Diwali sky-rockets from bottom of the page!
    launchDiwaliRockets();

    setIsSparking(true);
    setShowBlessing(true);

    setTimeout(() => setIsSparking(false), 800);
    setTimeout(() => setShowBlessing(false), 3200);
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Floating blessing badge when tapped */}
      {showBlessing && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-white font-semibold text-[11px] shadow-lg shadow-amber-500/40 animate-fade-in z-20 pointer-events-none flex items-center gap-1.5 border border-amber-300/40">
          <span>🚀</span>
          <span>Happy Diwali! 🪔</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        title="Tap the Diya to launch Diwali rockets & fireworks! 🚀✨"
        aria-label="Festive Diya - Tap to launch Diwali firecrackers"
        className={`relative ${currentSize.box} rounded-2xl flex items-center justify-center transition-transform hover:scale-115 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400/50 group select-none`}
      >
        {/* Ambient Radial Halo Glow */}
        <div
          className={`absolute inset-0 bg-amber-400/30 dark:bg-amber-400/20 rounded-full blur-md transition-all duration-300 ${
            isSparking ? 'scale-150 bg-amber-400/60' : 'group-hover:scale-125'
          }`}
        />

        {/* Handcrafted Vector Diya */}
        <svg
          width={currentSize.svg}
          height={currentSize.svg}
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible relative z-10 drop-shadow-sm"
        >
          <defs>
            <linearGradient id="clayGradient" x1="16" y1="36" x2="48" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D97706" />
              <stop offset="0.6" stopColor="#B45309" />
              <stop offset="1" stopColor="#78350F" />
            </linearGradient>
            <linearGradient id="flameOuter" x1="32" y1="6" x2="32" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#DC2626" />
            </linearGradient>
            <linearGradient id="flameInner" x1="32" y1="14" x2="32" y2="34" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" />
              <stop offset="0.6" stopColor="#FEF08A" />
              <stop offset="1" stopColor="#F59E0B" />
            </linearGradient>
          </defs>

          {/* Clay Diya Base */}
          <path
            d="M12 36C12 49 22 56 32 56C42 56 52 49 52 36C45 39 39 40 32 40C25 40 19 39 12 36Z"
            fill="url(#clayGradient)"
          />
          {/* Diya Rim Oval with golden trim */}
          <ellipse cx="32" cy="36" rx="20" ry="4.5" fill="#B45309" />
          <ellipse cx="32" cy="35.5" rx="17" ry="3" fill="#F59E0B" opacity="0.8" />
          <ellipse cx="32" cy="35" rx="14" ry="2" fill="#78350F" />

          {/* Flickering Outer Flame */}
          <g className="animate-flame origin-bottom">
            <path
              d="M32 7C35 15 42 21 42 29C42 36 37 38 32 38C27 38 22 36 22 29C22 21 29 15 32 7Z"
              fill="url(#flameOuter)"
              className="drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
            />
            {/* White-Hot Flame Core */}
            <path
              d="M32 15C34 20 38 24 38 29C38 34 35 36 32 36C29 36 26 34 26 29C26 24 30 20 32 15Z"
              fill="url(#flameInner)"
            />
          </g>

          {/* Golden Sparkle accents */}
          <circle cx="20" cy="18" r="1" fill="#FDE047" className="animate-ping opacity-75" />
          <circle cx="44" cy="16" r="1.2" fill="#FCD34D" className="animate-pulse" />
        </svg>
      </button>
    </div>
  );
};

export default FestiveDiya;
