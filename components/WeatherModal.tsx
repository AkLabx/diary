import React, { useState, useEffect, useId, useRef } from 'react';
import { Weather } from '../types';
import { getWeatherConditionEmoji, getCustomCity } from '../lib/weather';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: Weather | null;
  isLoading: boolean;
  onRefresh: () => Promise<void> | void;
  onSetCustomCity: (city: string) => Promise<boolean>;
  onUseGPSLocation: () => Promise<void> | void;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weather,
  isLoading,
  onRefresh,
  onSetCustomCity,
  onUseGPSLocation,
}) => {
  const [cityInput, setCityInput] = useState('');
  const [isSubmittingCity, setIsSubmittingCity] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const closingProgrammaticallyRef = useRef(false);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();

  const customCity = getCustomCity();

  useEffect(() => {
    if (isOpen) {
      setCityInput(customCity || '');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen, customCity]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        closingProgrammaticallyRef.current = false;
        dialog.showModal();
      }
    } else if (dialog.open) {
      closingProgrammaticallyRef.current = true;
      dialog.close();
    }
  }, [isOpen]);

  const isOutsideDialog = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return false;
    const rect = dialog.getBoundingClientRect();
    return e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom;
  };

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityInput.trim()) return;

    setIsSubmittingCity(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const success = await onSetCustomCity(cityInput.trim());
      if (success) {
        setSuccessMessage(`Location updated to ${cityInput.trim()}`);
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setErrorMessage("Could not find that city. Please verify spelling and try again.");
      }
    } catch (err) {
      setErrorMessage("Failed to update location. Please try again.");
    } finally {
      setIsSubmittingCity(false);
    }
  };

  const handleResetToGPS = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setCityInput('');
    await onUseGPSLocation();
    setSuccessMessage("Switched to device GPS location.");
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const getSourceLabel = () => {
    if (!weather?.source) return null;
    switch (weather.source) {
      case 'manual':
        return { text: 'Custom City', icon: '✏️', bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' };
      case 'gps':
        return { text: 'Device GPS', icon: '📍', bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' };
      case 'ip':
        return { text: 'Network Location', icon: '🌐', bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300' };
      case 'cache':
        return { text: 'Cached', icon: '⚡', bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300' };
      default:
        return null;
    }
  };

  const sourceInfo = getSourceLabel();

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, string>)}
      onClose={() => {
        if (closingProgrammaticallyRef.current) {
          closingProgrammaticallyRef.current = false;
          return;
        }
        if (isOpen) {
          onClose();
        }
      }}
      onPointerDown={(e) => {
        pressedOutsideRef.current = isOutsideDialog(e);
      }}
      onPointerUp={(e) => {
        if (!('closedBy' in HTMLDialogElement.prototype) && pressedOutsideRef.current && isOutsideDialog(e)) {
          onClose();
        }
        pressedOutsideRef.current = false;
      }}
      className="m-auto p-0 border-0 bg-transparent w-[calc(100%-2rem)] max-w-md rounded-3xl shadow-2xl animate-fade-in"
    >
      {isOpen && (
      <div
        className="relative w-full bg-white dark:bg-slate-900 rounded-3xl text-left overflow-hidden border border-[#EAE1D6] dark:border-slate-800 p-6 sm:p-7"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE1D6] dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌤️</span>
            <h3 id={titleId} className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Weather & Location
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Current Weather Card */}
        <div className="mt-5">
          {weather ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-slate-800/80 dark:to-slate-800/40 p-5 border border-amber-200/50 dark:border-slate-700/60">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl select-none" role="img" aria-label="weather-icon">
                    {getWeatherConditionEmoji(weather.icon, weather.description)}
                  </span>
                  <span className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
                    {Math.round(weather.temp)}°C
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onRefresh()}
                  disabled={isLoading}
                  title="Refresh weather"
                  className="p-2 rounded-xl bg-white/80 dark:bg-slate-700/80 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 shadow-xs border border-amber-200/40 dark:border-slate-600 transition-all active:scale-95 disabled:opacity-50"
                >
                  <svg className={`h-4 w-4 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <span>📍</span>
                    <span>{weather.location}</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                    {weather.description || 'Clear weather'}
                  </p>
                </div>

                {sourceInfo && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sourceInfo.bg}`}>
                    <span>{sourceInfo.icon}</span>
                    <span>{sourceInfo.text}</span>
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-5 text-center border border-dashed border-slate-300 dark:border-slate-700">
              <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-xl text-indigo-600 dark:text-indigo-400 mb-2">
                📍
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {isLoading ? 'Detecting Location...' : 'Location Not Set'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                {isLoading 
                  ? 'Fetching local weather and coordinates...' 
                  : 'Allow device location permission in your browser or set a city manually below.'}
              </p>
              {!isLoading && (
                <button
                  type="button"
                  onClick={handleResetToGPS}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
                >
                  <span>🎯</span> Use Device GPS
                </button>
              )}
            </div>
          )}
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-200 dark:border-emerald-900/60">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Manual City Configuration */}
        <div className="mt-5 pt-4 border-t border-[#EAE1D6] dark:border-slate-800">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Set City Manually
          </h4>
          <form onSubmit={handleCitySubmit} className="flex gap-2">
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="e.g. New Delhi, London, Tokyo..."
              disabled={isSubmittingCity}
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <button
              type="submit"
              disabled={isSubmittingCity || !cityInput.trim()}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-all shadow-xs flex items-center gap-1.5 flex-shrink-0"
            >
              {isSubmittingCity ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                'Save'
              )}
            </button>
          </form>

          {customCity && (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Overriding GPS with: <strong className="text-slate-700 dark:text-slate-200">{customCity}</strong></span>
              <button
                type="button"
                onClick={handleResetToGPS}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                Clear & use GPS
              </button>
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>

      </div>
      )}
    </dialog>
  );
};
