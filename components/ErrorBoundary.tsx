
import { useRouteError } from "react-router-dom";

export default function ErrorBoundary() {
  const error: any = useRouteError();
  console.error(error);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen p-4 bg-[#FBF8F3] dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h1>
      <p className="mb-8 text-center text-red-500">
        {error?.message || "An unexpected error occurred."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        Reload App
      </button>
    </div>
  );
}
