import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Profile, Weather } from '../types';
import { FestiveDiya } from './FestiveDiya';
import { createFestiveBurst } from '../lib/festiveFx';

interface InteractiveGreetingProps {
  profile: Profile | null;
  weather: Weather | null;
}

const REFLECTION_PROMPTS = [
  "What made you smile or feel genuinely grateful today?",
  "What was a small win or progress you made today?",
  "What was the quietest, most peaceful moment of your day?",
  "What challenged your patience today, and what did you learn?",
  "Who is someone you appreciated today, and why?",
  "What is one thought you'd like to let go of before you rest?",
  "What surprised you today that you didn't expect?",
  "A conversation or word that stuck with you today...",
  "How did you take care of yourself today?",
  "If today was a chapter in your story, what would its title be?",
  "What is something you are looking forward to tomorrow?",
  "What was a moment today when you felt fully present?",
  "What is a detail about your surroundings today that caught your eye?",
  "What is one thing you did today that your future self will thank you for?",
  "What emotion took up the most space in your heart today?"
];

const QUICK_MOODS = [
  { emoji: '😊', label: 'Joyful', bg: 'hover:bg-amber-100/70 dark:hover:bg-amber-950/40 hover:border-amber-300 dark:hover:border-amber-700 text-amber-900 dark:text-amber-200' },
  { emoji: '😌', label: 'Calm', bg: 'hover:bg-purple-100/70 dark:hover:bg-purple-950/40 hover:border-purple-300 dark:hover:border-purple-700 text-purple-900 dark:text-purple-200' },
  { emoji: '🤔', label: 'Reflective', bg: 'hover:bg-indigo-100/70 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700 text-indigo-900 dark:text-indigo-200' },
  { emoji: '🥳', label: 'Excited', bg: 'hover:bg-emerald-100/70 dark:hover:bg-emerald-950/40 hover:border-emerald-300 dark:hover:border-emerald-700 text-emerald-900 dark:text-emerald-200' },
  { emoji: '😢', label: 'Down', bg: 'hover:bg-blue-100/70 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 text-blue-900 dark:text-blue-200' },
];

const MOOD_PARTICLE_COLORS: Record<string, string[]> = {
  '😊': ['#F59E0B', '#FBBF24', '#FCD34D', '#FFFBEB'],
  '😌': ['#A855F7', '#C084FC', '#E9D5FF', '#F3E8FF'],
  '🤔': ['#6366F1', '#818CF8', '#C7D2FE', '#EEF2FF'],
  '🥳': ['#10B981', '#34D399', '#A7F3D0', '#EC4899', '#F59E0B'],
  '😢': ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
};

export const InteractiveGreeting: React.FC<InteractiveGreetingProps> = ({ profile, weather }) => {
  const navigate = useNavigate();
  const [promptIndex, setPromptIndex] = useState(() => {
    // Deterministic daily index based on day of year, but shuffleable
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return dayOfYear % REFLECTION_PROMPTS.length;
  });

  const [isShuffling, setIsShuffling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('diary_hide_prompt_card') === 'true';
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = profile?.full_name ? profile.full_name.split(' ')[0] : 'friend';

    if (hour >= 5 && hour < 12) {
      return { greeting: `Good morning, ${name}`, icon: '🌅' };
    } else if (hour >= 12 && hour < 17) {
      return { greeting: `Good afternoon, ${name}`, icon: '☀️' };
    } else if (hour >= 17 && hour < 22) {
      return { greeting: `Good evening, ${name}`, icon: '🌆' };
    } else {
      return { greeting: `Peaceful night, ${name}`, icon: '🌙' };
    }
  };

  const { greeting, icon } = getGreeting();
  const currentPrompt = REFLECTION_PROMPTS[promptIndex];

  const handleMoodSelect = (moodEmoji: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const colors = MOOD_PARTICLE_COLORS[moodEmoji] || ['#6366F1', '#F59E0B'];
    
    // Tactile mood spark pop
    createFestiveBurst(originX, originY, { count: 26, colors, sound: 'pop' });
    
    setTimeout(() => {
      navigate(`/app/new?mood=${encodeURIComponent(moodEmoji)}`);
    }, 120);
  };

  const handlePromptSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    
    createFestiveBurst(originX, originY, {
      count: 32,
      colors: ['#6366F1', '#8B5CF6', '#F59E0B', '#FFFFFF'],
      sound: 'sparkle'
    });

    setTimeout(() => {
      navigate(`/app/new?prompt=${encodeURIComponent(currentPrompt)}`);
    }, 140);
  };

  const handleShufflePrompt = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    
    createFestiveBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, {
      count: 18,
      colors: ['#6366F1', '#EC4899', '#F59E0B', '#10B981'],
      sound: 'pop'
    });

    setIsShuffling(true);
    setTimeout(() => {
      setPromptIndex((prev) => (prev + 1) % REFLECTION_PROMPTS.length);
      setIsShuffling(false);
    }, 180);
  };

  const handleToggleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isDismissed;
    setIsDismissed(next);
    localStorage.setItem('diary_hide_prompt_card', String(next));
  };

  return (
    <div className="space-y-4 mb-6 animate-fade-in">
      {/* 1. Dynamic Time-of-Day Greeting with Ambient Festive Diya */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-md flex-shrink-0 transform hover:scale-105 transition-transform">
              <span>{icon}</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span>{greeting}</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {weather ? (
                  <span>
                    {Math.round(weather.temp)}°C in {weather.location} · Take a quiet moment to reflect.
                  </span>
                ) : (
                  <span>Welcome back to your private sanctuary.</span>
                )}
              </p>
            </div>
          </div>

          {/* Interactive Handcrafted Glowing Diya */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <FestiveDiya size="md" />
          </div>
        </div>

        {isDismissed && (
          <button
            type="button"
            onClick={handleToggleDismiss}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-800/50 transition-all active:scale-95"
          >
            <span>✨</span> Daily Thought
          </button>
        )}
      </div>

      {/* 2. Quick Mood Check-in Bar */}
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border border-[#EAE1D6] dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>💭</span> Quick Mood Check-in
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden xs:inline">
            Tap to start an entry
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {QUICK_MOODS.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={(e) => handleMoodSelect(m.emoji, e)}
              title={`Feeling ${m.label}? Write a quick entry.`}
              className={`flex-1 min-w-[70px] sm:min-w-[85px] py-2 px-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-xs font-medium flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ${m.bg}`}
            >
              <span className="text-lg leading-none select-none transform hover:scale-110 transition-transform">
                {m.emoji}
              </span>
              <span className="text-[11px] sm:text-xs font-medium whitespace-nowrap">
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Daily Reflection Starter Card */}
      {!isDismissed && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-50/80 via-indigo-50/40 to-purple-50/70 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-indigo-950/30 p-4 sm:p-5 border border-amber-200/50 dark:border-slate-700/60 shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              <span className="animate-spin-slow">✨</span> Daily Reflection Starter
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShufflePrompt}
                title="Shuffle another thought prompt"
                className={`p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 hover:bg-white/80 dark:hover:bg-slate-700 transition-all active:scale-90 ${isShuffling ? 'rotate-180' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleToggleDismiss}
                title="Dismiss for now"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <p className="font-serif italic text-base sm:text-lg text-slate-800 dark:text-slate-100 my-2.5 leading-relaxed">
            &ldquo;{currentPrompt}&rdquo;
          </p>

          <div className="flex items-center justify-end mt-3">
            <button
              type="button"
              onClick={handlePromptSelect}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm active:scale-95 transition-all"
            >
              <span>✍️</span> Write about this
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveGreeting;
