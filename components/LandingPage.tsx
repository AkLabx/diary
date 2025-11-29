import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
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

  const handleGetStarted = () => {
    navigate('/login');
  };

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
          onClick={handleGetStarted}
          className="px-8 py-2.5 rounded-full text-white font-semibold bg-gradient-to-br from-indigo-400 to-purple-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2),0_8px_20px_-6px_rgba(124,58,237,0.5)] hover:scale-105 transition-transform border border-indigo-300/50"
        >
          Log In
        </button>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 w-full flex flex-col items-center">
        
        {/* --- HERO SECTION --- */}
        <section className="max-w-6xl mx-auto px-6 pb-20 pt-10 w-full flex flex-col items-center">
            {/* 1. THE 3D PHONE (Polished Black Metal) */}
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
                                    0x9F3a2B1c8D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0c1D2e3F4a5B6c7D8e9F0a1B2c3D4e
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
                onClick={handleGetStarted}
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
        </section>

        {/* --- HOW IT WORKS (The Journey) --- */}
        <section className="w-full bg-white py-24 border-y border-slate-100">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold font-serif text-slate-900 mb-4">How Your Privacy is Guaranteed</h2>
                    <p className="text-slate-500 max-w-lg mx-auto">We don't rely on trust. We rely on math. Here is the lifecycle of your diary data.</p>
                </div>

                <div className="relative border-l-2 border-indigo-100 ml-6 md:ml-12 space-y-16">
                    {/* Step 1 */}
                    <div className="relative pl-8 md:pl-12">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 shadow-lg shadow-indigo-200 ring-4 ring-white"></div>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">1. Local Key Generation</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    When you create your account, your browser generates a unique 256-bit encryption key. This process happens entirely on your device. We never see this key.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative pl-8 md:pl-12">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-300"></div>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">2. The Biometric Vault</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    Your key is wrapped using your device's secure hardware (FaceID or TouchID). This allows you to unlock your diary instantly without typing a password, while keeping the key mathematically secure.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative pl-8 md:pl-12">
                         <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-300"></div>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">3. Zero-Knowledge Sync</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    When you save an entry, it is encrypted <i>before</i> it leaves your browser. Our servers only receive a scrambled "blob" of data. We cannot decrypt it even if compelled by law.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* --- FEATURES GRID (The Toolkit) --- */}
        <section className="max-w-6xl mx-auto px-6 py-24">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold font-serif text-slate-900 mb-4">More Than Just Text</h2>
                <p className="text-slate-500">A complete suite of tools to capture your life in high fidelity.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
                    <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Rich Editor</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Format your thoughts with a beautiful, distraction-free editor. Supports custom fonts, lists, and dynamic layouts.
                    </p>
                </div>

                 {/* Feature 2 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
                    <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Secure Media</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Attach photos and images. They are encrypted with the same military-grade key as your text.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
                    <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                             <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Voice Memos</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Record encrypted audio notes for when typing feels like too much work. Stored securely in the cloud.
                    </p>
                </div>

                {/* Feature 4 */}
                <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
                    <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 mb-6">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Mood Tracking</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Track your emotional journey over time. Filter entries by mood to see patterns in your life.
                    </p>
                </div>

                 {/* Feature 5 */}
                 <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Smart Organization</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Organize entries with tags, journals, and location data (weather). Find any memory instantly.
                    </p>
                </div>

                 {/* Feature 6 */}
                 <div className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-3">Total Ownership</h3>
                    <p className="text-slate-500 leading-relaxed">
                        Your data is yours. Export your entire diary history to JSON or ZIP at any time. No lock-in.
                    </p>
                </div>
            </div>
        </section>

        {/* --- FOOTER CTA --- */}
        <section className="w-full bg-indigo-900 text-white py-20 mt-12 relative overflow-hidden">
             {/* Decorative circles */}
             <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
             <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                <h2 className="text-4xl font-bold font-serif mb-6">Ready to start writing?</h2>
                <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
                    Join thousands of others who have reclaimed their privacy. No credit card required.
                </p>
                 <button 
                    onClick={handleGetStarted}
                    className="px-10 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:bg-indigo-50 transition-all hover:scale-105 shadow-xl"
                >
                    Create Your Sanctuary
                </button>
            </div>
        </section>

      </main>
    </div>
  );
};

export default LandingPage;