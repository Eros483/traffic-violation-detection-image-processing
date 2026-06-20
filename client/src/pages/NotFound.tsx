import { useNavigate } from "react-router-dom";

export function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-24 text-center">
      <div className="tnum text-4xl font-bold text-slate-300">404</div>
      <div className="text-sm font-semibold text-slate-700">Page not found</div>
      <p className="max-w-sm text-sm text-slate-500">The page you’re looking for doesn’t exist in this console.</p>
      <button
        onClick={() => navigate("/")}
        className="mt-1 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-[#fff] hover:bg-blue-800"
      >
        Back to dashboard
      </button>
    </div>
  );
}
