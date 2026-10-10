import React from 'react';

interface MonkeyProps {
  focusState: 'idle' | 'email' | 'password';
  emailProgress: number;
  typingCounter: number;
  isPasswordVisible?: boolean;
}

const Monkey: React.FC<MonkeyProps> = ({ focusState, emailProgress, typingCounter, isPasswordVisible = false }) => {
  
  // --- Dynamic Calculations ---
  
  const getHeadTransform = () => {
    if (focusState === 'email') {
      // Tilt head based on email input length, slightly clamped
      // Using standard CSS rotate(deg) syntax
      const angle = Math.max(-8, Math.min(8, (emailProgress * 16) - 8));
      return `rotate(${angle}deg)`;
    }
    return 'rotate(0deg)';
  };

  const getPupilTransform = () => {
    if (focusState === 'password') {
        return 'translate(0px, 5px)'; // Look down
    }
    if (focusState === 'email') {
        // Jitter pupils slightly while typing to simulate reading/tracking
        const offset = typingCounter % 2 === 0 ? -1.5 : 1.5;
        return `translate(${offset}px, 5px)`;
    }
    return 'translate(0px, 0px)';
  };

  const getHandTransform = () => {
      if (focusState === 'password') {
          if (isPasswordVisible) {
              // Peek state: Hands slightly lower to reveal eyes
              return 'translateY(15px)';
          }
          // Hidden state: Hands fully up covering eyes
          return 'translateY(0px)'; 
      }
      // Idle/Email state: Hands hidden below
      // With overflow: hidden on the SVG, these will be clipped
      return 'translateY(100px)';
  };

  return (
    <svg 
      width="140" 
      height="140" 
      viewBox="0 0 100 100" 
      className="mx-auto -mb-6" 
      style={{ 
          zIndex: 10, 
          position: 'relative', 
          overflow: 'hidden' // Changed to hidden to prevent hands covering inputs
      }}
      aria-hidden="true"
    >
      <defs>
        {/* Premium Fur Gradient */}
        <linearGradient id="furGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" /> {/* Amber 600 */}
            <stop offset="100%" stopColor="#92400E" /> {/* Amber 800 */}
        </linearGradient>
        
        {/* Face Skin Gradient */}
        <linearGradient id="skinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FEF3C7" /> {/* Amber 100 */}
            <stop offset="100%" stopColor="#FDE68A" /> {/* Amber 200 */}
        </linearGradient>
        
        {/* Eye Reflection */}
        <radialGradient id="eyeShine" cx="30%" cy="30%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        
        {/* Soft Shadow under head */}
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer>
                <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
      </defs>

      {/* --- Head Group --- */}
      <g 
        id="head-group" 
        style={{ 
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          transform: getHeadTransform(),
          transformOrigin: '50px 55px' // Explicit origin allows correct CSS rotation
        }} 
        filter="url(#softShadow)"
      >
        {/* Ears (Back) */}
        <circle cx="18" cy="50" r="12" fill="url(#furGradient)" />
        <circle cx="82" cy="50" r="12" fill="url(#furGradient)" />
        
        {/* Main Head Shape */}
        <ellipse cx="50" cy="55" rx="38" ry="34" fill="url(#furGradient)" />
        
        {/* Face Shape (Heart-ish) */}
        <path 
            d="M50 35 C 35 35, 25 45, 25 60 C 25 75, 35 85, 50 85 C 65 85, 75 75, 75 60 C 75 45, 65 35, 50 35 Z" 
            fill="url(#skinGradient)" 
        />
        
        {/* Inner Ears */}
        <circle cx="18" cy="50" r="7" fill="#FDE68A" opacity="0.8" />
        <circle cx="82" cy="50" r="7" fill="#FDE68A" opacity="0.8" />

        {/* Hair Tuft */}
        <path d="M46 22 Q 50 15, 54 22" stroke="url(#furGradient)" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* --- Eyes --- */}
        <g id="eyes" transform="translate(0, 2)">
            <circle cx="36" cy="52" r="9" fill="white" />
            <circle cx="64" cy="52" r="9" fill="white" />
            
            {/* Pupils with Tracking */}
            <g style={{ transition: 'transform 0.1s ease-out', transform: getPupilTransform() }}>
                <circle cx="36" cy="52" r="4" fill="#1E293B" />
                <circle cx="64" cy="52" r="4" fill="#1E293B" />
                {/* Eye Glint/Shine */}
                <circle cx="38" cy="50" r="2" fill="white" opacity="0.6" />
                <circle cx="66" cy="50" r="2" fill="white" opacity="0.6" />
            </g>
        </g>

        {/* Nose */}
        <ellipse cx="50" cy="68" rx="5" ry="3" fill="#1E293B" opacity="0.8" />

        {/* Mouth (Smile changes slightly) */}
        <path 
            d="M42 76 Q 50 82, 58 76" 
            stroke="#4B5563" 
            strokeWidth="2" 
            fill="transparent" 
            strokeLinecap="round" 
            style={{ transition: 'd 0.3s' }}
        />
      </g>

      {/* --- Hands (Overlay) --- */}
      {/* 
         Hands are positioned absolutely in SVG coordinates. 
         They slide up from y=100 (bottom) to cover the eyes at y=~45.
      */}
      <g 
        id="hands-group" 
        style={{ 
            transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
            transform: getHandTransform()
        }} 
        filter="url(#softShadow)"
      >
          {/* Left Hand */}
          <path 
            d="M10 100 L 15 60 Q 15 45, 30 45 Q 45 45, 45 60 L 45 100 Z" 
            fill="url(#furGradient)" 
            stroke="#78350F"
            strokeWidth="1"
          />
          {/* Fingers Left */}
          <path d="M30 45 L 30 55" stroke="#78350F" strokeWidth="2" opacity="0.3" />
          <path d="M37 47 L 37 55" stroke="#78350F" strokeWidth="2" opacity="0.3" />
          <path d="M23 47 L 23 55" stroke="#78350F" strokeWidth="2" opacity="0.3" />

          {/* Right Hand */}
          <path 
            d="M90 100 L 85 60 Q 85 45, 70 45 Q 55 45, 55 60 L 55 100 Z" 
            fill="url(#furGradient)"
            stroke="#78350F"
            strokeWidth="1" 
          />
          {/* Fingers Right */}
          <path d="M70 45 L 70 55" stroke="#78350F" strokeWidth="2" opacity="0.3" />
          <path d="M63 47 L 63 55" stroke="#78350F" strokeWidth="2" opacity="0.3" />
          <path d="M77 47 L 77 55" stroke="#78350F" strokeWidth="2" opacity="0.3" />
      </g>

    </svg>
  );
};

export default Monkey;