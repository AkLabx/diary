import React, { useState, useRef, useEffect } from 'react';

export interface RecordedAudio {
  id: string;
  blob: Blob;
}

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  recordings: RecordedAudio[]; // Array of temporary recordings
  savedAudios?: { id: string; type: string }[]; // Array of already saved audios (metadata only needed for display/count)
  onDeleteRecording: (id: string) => void; // For deleting new/temp recordings
  onDeleteSaved: (id: string) => void; // For deleting existing saved audios
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  recordings,
  savedAudios = [],
  onDeleteRecording,
  onDeleteSaved
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const totalCount = recordings.length + savedAudios.length;
  const isLimitReached = totalCount >= 5;

  // Cleanup URL on unmount if needed, though handled by parent mainly
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    if (isLimitReached) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine supported mimeType
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        // Use the actual mimeType from the recorder if available
        const finalMimeType = mediaRecorderRef.current?.mimeType || mimeType;
        const blob = new Blob(chunksRef.current, { type: finalMimeType });
        onRecordingComplete(blob);
        chunksRef.current = [];
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full space-y-3">
      {/* Existing Saved Audios List */}
      {savedAudios.map((audio, index) => (
        <div key={audio.id} className="w-full p-2 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                </div>
                <span className="text-xs font-medium text-indigo-800 dark:text-indigo-300">Saved Audio {index + 1}</span>
            </div>
            <button 
                onClick={() => onDeleteSaved(audio.id)}
                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                title="Delete Audio"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
      ))}

      {/* New Recordings List */}
      {recordings.map((rec, index) => (
         <div key={rec.id} className="w-full p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center text-green-600 dark:text-green-300">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                </div>
                <span className="text-xs font-medium text-green-800 dark:text-green-300">New Recording {savedAudios.length + index + 1}</span>
            </div>
            <button
                onClick={() => onDeleteRecording(rec.id)}
                className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
                title="Delete Recording"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
      ))}

      {/* Recorder Controls */}
      {!isRecording ? (
        <button 
          onClick={startRecording}
          disabled={isLimitReached}
          className="w-full flex items-center justify-center gap-3 p-2 rounded-md text-sm text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            <span>{isLimitReached ? 'Limit Reached (5)' : 'Record Audio'}</span>
        </button>
      ) : (
        <div className="w-full flex items-center justify-between p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
           <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </div>
              <span className="text-sm font-mono font-medium text-red-600 dark:text-red-300">{formatTime(recordingTime)}</span>
           </div>
           <button 
            onClick={stopRecording}
            className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-800 dark:text-red-200 dark:hover:bg-red-700 transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
             </svg>
           </button>
        </div>
      )}

      <div className="text-xs text-slate-400 text-center">
          {totalCount} / 5 recordings
      </div>
    </div>
  );
};

export default AudioRecorder;
