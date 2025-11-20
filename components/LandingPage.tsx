import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [demoStep, setDemoStep] = useState(0);
  // 0: Typing "My deepest secret..."
  // 1: Encrypting (Scramble)
  // 2: Locked

  useEffect(() => {
    const loop = () => {
      setDemoStep(0); // Type
      setTimeout(() => setDemoStep(1), 2500); // Encrypt after 2.5s
      setTimeout(() => setDemoStep(2), 4000); // Lock after 4s
      setTimeout(() => setDemoStep(0), 6000); // Reset after 6s
    };
    loop();
    const interval = setInterval(loop, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold font-serif tracking-tight flex items-center gap-2">
           <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
           </div>
           <span>Diary</span>
        </div>
        <button 
          onClick={onGetStarted}
          className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
        >
          Log In
        </button>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-10 pb-20 sm:pt-20 max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
        
        {/* Left: Copy */}
        <div className="flex-1 text-center lg:text-left space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"/>
            Secure by Design
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-serif leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            Your thoughts.<br/>
            Encrypted.<br/>
            Forever.
          </h1>
          
          <p className="text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            The only journal with true client-side encryption and biometric security. 
            We can't read your data even if we wanted to.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-lg transition-all hover:scale-105 shadow-xl shadow-indigo-500/25 flex items-center gap-2"
            >
              Start Writing
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="pt-8 flex items-center justify-center lg:justify-start gap-6 opacity-50 grayscale hover:grayscale-0 transition-all">
             <div className="text-xs font-mono text-slate-500 border border-slate-700 px-2 py-1 rounded">AES-GCM 256</div>
             <div className="text-xs font-mono text-slate-500 border border-slate-700 px-2 py-1 rounded">PBKDF2 SHA-256</div>
             <div className="text-xs font-mono text-slate-500 border border-slate-700 px-2 py-1 rounded">WebAuthn PRF</div>
          </div>
        </div>

        {/* Right: 3D Phone Animation */}
        <div className="flex-1 w-full max-w-md lg:max-w-full flex justify-center perspective-1000">
           <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl animate-float-phone preserve-3d ring-1 ring-slate-700/50">
              {/* Phone Reflection/Gloss */}
              <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-white/5 to-transparent pointer-events-none z-20" />
              
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-slate-800 rounded-b-2xl z-30" />
              
              {/* Screen Content */}
              <div className="absolute inset-2 bg-slate-950 rounded-[2.5rem] overflow-hidden flex flex-col">
                 {/* App Header */}
                 <div className="h-20 bg-slate-900 flex items-end pb-4 px-6 justify-between border-b border-slate-800">
                    <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
                    <div className="h-4 w-24 bg-slate-800 rounded" />
                 </div>
                 
                 {/* App Body */}
                 <div className="flex-1 p-6 space-y-6">
                    <div className="space-y-2">
                        <div className="h-8 w-3/4 bg-slate-800/50 rounded" />
                        <div className="h-4 w-1/2 bg-slate-800/30 rounded" />
                    </div>
                    
                    {/* The Typing/Encrypting Area */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 min-h-[200px] font-mono text-sm relative overflow-hidden">
                        {demoStep === 0 && (
                            <div className="text-slate-300">
                                My deepest secret is<span className="typing-cursor">|</span>
                            </div>
                        )}
                        {demoStep === 1 && (
                            <div className="break-all animate-matrix text-green-500 text-xs leading-relaxed">
                                0x9F3a2B1c8D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e
                            </div>
                        )}
                        {demoStep === 2 && (
                            <div className="flex items-center justify-center h-full text-slate-500 flex-col gap-2 h-[200px]">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-bold uppercase tracking-widest">Locked</span>
                            </div>
                        )}
                    </div>
                 </div>
                 
                 {/* App Footer / Home Bar */}
                 <div className="h-8 bg-slate-900 flex justify-center items-center pt-2">
                    <div className="w-1/3 h-1 bg-slate-700 rounded-full" />
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;