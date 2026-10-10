import React from 'react';
import { Link } from 'react-router-dom';

const MyStuffHome: React.FC = () => {
    return (
        <div className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">My Stuff</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/app/mystuff/images" className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-[#EAE1D6] dark:border-slate-700 flex flex-col items-center justify-center gap-4 group">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Images</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-center">View all photos uploaded to your diary entries</p>
                </Link>

                <Link to="/app/mystuff/audio" className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow border border-[#EAE1D6] dark:border-slate-700 flex flex-col items-center justify-center gap-4 group">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Audio</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-center">Listen to voice memos and audio recordings</p>
                </Link>
            </div>
        </div>
    );
};

export default MyStuffHome;
