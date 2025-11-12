import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-black">
      <div className="text-center px-4">
        <h1 className="text-6xl font-bold mb-4 text-white">404</h1>
        <p className="text-xl text-slate-300 mb-8">Oops! Page not found</p>
        <a href="/" className="inline-block px-6 py-3 bg-[#FF4DA6] text-white font-semibold rounded-lg hover:bg-[#FF4DA6]/90 transition-all duration-200 hover:shadow-lg hover:shadow-[#FF4DA6]/30">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
