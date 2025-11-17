import React from 'react';

interface MonkeyProps {
  focusState: 'idle' | 'email' | 'password';
  emailProgress: number;
  typingCounter: number;
}

const Monkey: React.FC<MonkeyProps> = ({ focusState, emailProgress, typingCounter }) => {
  const getHeadTransform = () => {
    if (focusState === 'email') {
      // Tilt head based on email input length, from -8 to +8 degrees
      const angle = (emailProgress * 16) - 8;
      return `rotate(${angle} 50 60)`;
    }
    // Center the head for password or idle states
    return 'rotate(0 50 60)';
  };

  const getPupilTransform = () => {
    const isTyping = focusState === 'email';
    // Small back-and-forth wiggle on each key press
    const typingOffset = isTyping ? (typingCounter % 2 === 0 ? -1.5 : 1.5) : 0;

    switch (focusState) {
      case 'idle':
        return 'translate(0, 0)';
      case 'email':
        // Look down and towards the email input
        return `translate(${typingOffset}, 5)`;
      case 'password':
        // Look down towards the password input
        return `translate(0, 5)`;
      default:
        return 'translate(0, 0)';
    }
  };

  return (
    <svg 
      width="120" 
      height="120" 
      viewBox="0 0 100 100" 
      className="mx-auto -mb-4" 
      style={{ zIndex: 10, position: 'relative' }}
      aria-hidden="true"
    >
      <g id="head-group" style={{ transition: 'transform 0.3s ease' }} transform={getHeadTransform()}>
        {/* Head */}
        <path d="M50 10 C 25 10, 10 35, 10 60 C 10 85, 25 100, 50 100 C 75 100, 90 85, 90 60 C 90 35, 75 10, 50 10 Z" fill="#A0522D" />
        
        {/* Face */}
        <path d="M50 25 C 30 25, 20 40, 20 60 C 20 80, 30 90, 50 90 C 70 90, 80 80, 80 60 C 80 40, 70 25, 50 25 Z" fill="#F5DEB3" />
        
        {/* Ears */}
        <circle cx="15" cy="50" r="10" fill="#A0522D" />
        <circle cx="85" cy="50" r="10" fill="#A0522D" />
        <circle cx="17" cy="50" r="7" fill="#F5DEB3" />
        <circle cx="83" cy="50" r="7" fill="#F5DEB3" />

        {/* Open Eyes */}
        <g id="open-eyes" style={{ opacity: focusState === 'password' ? 0 : 1, transition: 'opacity 0.2s ease-in-out' }}>
            <circle cx="38" cy="55" r="8" fill="white" />
            <circle cx="62" cy="55" r="8" fill="white" />
            <g id="pupils" style={{ transition: 'transform 0.1s linear' }} transform={getPupilTransform()}>
                <circle cx="38" cy="55" r="4" fill="#2F4F4F" />
                <circle cx="62" cy="55" r="4" fill="#2F4F4F" />
            </g>
        </g>
        
        {/* Heart Eyes */}
        <g id="heart-eyes" style={{ opacity: focusState === 'password' ? 1 : 0, transition: 'opacity 0.2s ease-in-out' }}>
            <path d="M38 53 C 34 49, 30 53, 38 59 C 46 53, 42 49, 38 53 Z" fill="#F5DEB3" stroke="#A0522D" strokeWidth="1.5" />
            <path d="M62 53 C 58 49, 54 53, 62 59 C 70 53, 66 49, 62 53 Z" fill="#F5DEB3" stroke="#A0522D" strokeWidth="1.5" />
        </g>

        {/* Mouth */}
        <path d="M40 75 Q 50 82, 60 75" stroke="#696969" strokeWidth="1.5" fill="transparent" />
      </g>
    </svg>
  );
};

export default Monkey;