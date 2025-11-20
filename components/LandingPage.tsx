import React, { useEffect, useState } from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [demoStep, setDemoStep] = useState(0);
  // 0: Typing
  // 1: Encrypting
  // 2: Locked
  
  const words = ["Thoughts", "Secrets", "Memories", "Dreams"];
  const [wordIndex, setWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter Effect for the Headline
  useEffect(() => {
    const currentWord = words[wordIndex];
    const typeSpeed = isDeleting ? 50 : 100;

    const timeout = setTimeout(() => {
      if (!isDeleting && displayedText === currentWord) {
        // Finished typing word, wait then delete
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayedText === "") {
        // Finished deleting, move to next word
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % words.length);
      } else {
        // Typing or Deleting characters
        const nextText = isDeleting 
          ? currentWord.substring(0, displayedText.length - 1)
          : currentWord.substring(0, displayedText.length + 1);
        setDisplayedText(nextText);
      }
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, wordIndex]);


  // Phone Screen Demo Loop
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
    <div className="min-h-screen bg-[#FBF8F3] text-slate-800 font-sans overflow-x-hidden selection:bg-indigo-200">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/30 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-orange-100/50 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <div className="text-2xl font-bold font-serif tracking-tight flex items-center gap-2 text-slate-800">
           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/5 border border-slate-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
           </div>
           <span>Diary</span>
        </div>
        
        <button 
          onClick={onGetStarted}
          className="px-8 py-2.5 rounded-full text-white font-semibold bg-gradient-to-br from-indigo-400 to-purple-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),0_8px_20px_-6px_rgba(124,58,237,0.5)] hover:scale-105 transition-transform border border-indigo-300/50"
        >
          Log In
        </button>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-6 flex flex-col items-center pb-20">
        
        {/* 1. THE 3D PHONE (Now at Top, Polished Black Metal) */}
        <div className="w-full flex justify-center perspective-1000 py-12 sm:py-16 relative">
           
           {/* Grounding Shadow - The Floor */}
           <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-56 h-8 bg-black/20 blur-2xl rounded-[100%]" />

           {/* The Phone Body */}
           <div className="relative w-[280px] h-[580px] bg-slate-900 rounded-[3.5rem] border-[6px] border-slate-950 shadow-[0_0_0_1.5px_rgba(255,255,255,0.15),0_50px_100px_-20px_rgba(0,0,0,0.5)] animate-float-phone preserve-3d">
              
              {/* Metallic Gloss Reflection */}
              <div className="absolute inset-0 rounded-[3.2rem] bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none z-20" />
              
              {/* Buttons (Darkened) */}
              <div className="absolute top-24 -right-[7px] w-[7px] h-16 bg-slate-800 rounded-r-md border-l border-slate-950 shadow-sm" />
              <div className="absolute top-24 -left-[7px] w-[7px] h-10 bg-slate-800 rounded-l-md border-r border-slate-950 shadow-sm" />
              <div className="absolute top-36 -left-[7px] w-[7px] h-10 bg-slate-800 rounded-l-md border-r border-slate-950 shadow-sm" />
              
              {/* Notch (Deep Black) */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-2xl z-30 flex justify-center items-center">
                  <div className="w-12 h-1.5 bg-slate-800/50 rounded-full" />
              </div>
              
              {/* Screen Content (Light Mode UI for Contrast) */}
              <div className="absolute inset-[6px] bg-[#FBF8F3] rounded-[3.1rem] overflow-hidden flex flex-col shadow-inner">
                 {/* App Header */}
                 <div className="h-20 bg-white flex items-end pb-4 px-6 justify-between border-b border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 animate-pulse" />
                    <div className="h-4 w-24 bg-slate-100 rounded" />
                 </div>
                 
                 {/* App Body */}
                 <div className="flex-1 p-5 space-y-6">
                    <div className="space-y-2">
                        <div className="h-6 w-3/4 bg-slate-200/50 rounded" />
                        <div className="h-3 w-1/2 bg-slate-200/30 rounded" />
                    </div>
                    
                    {/* The Typing/Encrypting Area */}
                    <div className="p-5 rounded-2xl bg-white shadow-sm border border-slate-100 min-h-[220px] font-serif text-lg relative overflow-hidden flex flex-col">
                        <div className="text-xs font-sans uppercase tracking-wider text-slate-300 mb-4">Nov 18, 2025</div>
                        
                        {demoStep === 0 && (
                            <div className="text-slate-700 leading-relaxed">
                                My deepest secret is<span className="typing-cursor border-indigo-500">|</span>
                            </div>
                        )}
                        {demoStep === 1 && (
                            <div className="break-all animate-matrix text-emerald-600 font-mono text-xs leading-relaxed opacity-80">
                                0x9F3a2B1c8D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e
                            </div>
                        )}
                        {demoStep === 2 && (
                            <div className="flex flex-1 items-center justify-center flex-col gap-3">
                                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Secure</span>
                            </div>
                        )}
                    </div>
                 </div>
                 
                 {/* Home Indicator */}
                 <div className="h-6 w-full flex justify-center items-start pt-1">
                    <div className="w-1/3 h-1 bg-slate-300 rounded-full" />
                 </div>
              </div>
           </div>
        </div>

        {/* 2. Hero Text */}
        <div className="text-center space-y-8 max-w-2xl">
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-serif leading-[1.1] tracking-tight text-slate-900">
            Your <span className="text-indigo-600 inline-block min-w-[200px] border-b-4 border-indigo-200">{displayedText}</span><br/>
            Encrypted. Forever.
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-500 leading-relaxed max-w-lg mx-auto">
            Write freely in a beautiful, private space. Secured with military-grade encryption that only <strong>you</strong> hold the keys to.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-4">
            <button 
              onClick={onGetStarted}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:-translate-y-1 shadow-xl shadow-indigo-200 flex items-center gap-2"
            >
              Get Started for Free
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="pt-10 flex flex-wrap justify-center gap-x-8 gap-y-4 opacity-60 text-slate-400 font-medium text-sm">
             <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                 End-to-End Encrypted
             </div>
             <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                 Biometric Lock
             </div>
             <div className="flex items-center gap-2">
                 <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                 Local First
             </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default LandingPage;