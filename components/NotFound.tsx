import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 font-sans">
      <div className="text-center p-8">
        <h1 className="text-6xl font-bold text-indigo-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Page Not Found</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition-colors shadow-lg shadow-indigo-200 dark:shadow-none"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;