import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { APP_NAV_ITEMS } from "@/config/navigation";

const BRAND_NAME = "Radut Verse";
const BRAND_IMAGE_URL =
  "https://cdn.builder.io/api/v1/image/assets%2Fc692190cfd69486380fecff59911b51b%2F52cfa9fa715049a49469c1473e1a313e";

interface WelcomeScreenProps {
  onChatClick: () => void;
  onLicenseClick: () => void;
  onRemixClick: () => void;
}

export const WelcomeScreen = ({
  onChatClick,
  onLicenseClick,
  onRemixClick,
}: WelcomeScreenProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderBrandHeader = () => (
    <div className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-300">
      <span
        aria-hidden
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF4DA6]/10"
        style={{
          backgroundImage: `url(${BRAND_IMAGE_URL})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />
      <div className="text-base font-bold text-[#FF4DA6]">{BRAND_NAME}</div>
    </div>
  );

  const renderNavItems = (closeSidebar?: () => void) => (
    <nav className="mt-6 flex-1 w-full text-slate-300 space-y-1">
      <ul className="flex flex-col gap-1">
        {APP_NAV_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          return (
            <li key={item.id}>
              <NavLink
                to={item.to}
                className={({ isActive }) => {
                  const baseClasses =
                    "flex items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium transition-colors";
                  const activeClasses = "bg-[#FF4DA6]/15 text-[#FF4DA6]";
                  const inactiveClasses =
                    "text-slate-400 hover:text-slate-200 hover:bg-white/5";
                  return [
                    baseClasses,
                    isActive ? activeClasses : inactiveClasses,
                  ].join(" ");
                }}
                onClick={() => closeSidebar?.()}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800/50 text-slate-500">
                  <ItemIcon className="h-4 w-4" />
                </span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const sidebar = (
    <div className="flex w-full flex-col gap-6">
      {renderBrandHeader()}
      {renderNavItems(() => setSidebarOpen(false))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100">
      <div className="flex min-h-screen w-full md:overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-slate-950/80 text-slate-100 py-6 px-4 sticky top-0 max-h-screen min-h-screen overflow-y-auto">
          {sidebar}
        </aside>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="fixed inset-0 z-50 md:hidden flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="fixed inset-0 bg-black/40"
                onClick={() => setSidebarOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
              <motion.aside
                className="relative w-64 bg-slate-950/90 text-slate-100 py-6 px-4 h-full overflow-y-auto"
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 28 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">{renderBrandHeader()}</div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-md border-0 bg-transparent text-[#FF4DA6] hover:bg-[#FF4DA6]/10 transition-colors"
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-6">
                  {renderNavItems(() => setSidebarOpen(false))}
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex min-h-0 flex-col">
          <motion.header
            className="flex items-center gap-4 px-6 py-3.5 bg-slate-950/70 md:hidden flex-shrink-0"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              type="button"
              className="p-2 rounded-md border-0 bg-transparent text-[#FF4DA6] hover:bg-[#FF4DA6]/10 active:scale-[0.98] transition-all"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </motion.header>

          <div className="flex-1 flex items-center justify-center px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-6xl font-bold mb-8 text-slate-100 leading-tight"
              >
                Welcome to{" "}
                <span className="bg-gradient-to-r from-[#FF4DA6] to-pink-500 bg-clip-text text-transparent">
                  Radut Agent
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-2xl md:text-3xl text-slate-300 mb-16 font-light"
              >
                What do you need, babe?
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <Button
                  onClick={onLicenseClick}
                  disabled
                  className="px-8 py-6 text-lg font-semibold bg-slate-800 text-slate-100 rounded-lg w-full sm:w-auto border border-slate-700 opacity-50 cursor-not-allowed"
                >
                  License your work
                </Button>

                <Button
                  onClick={onRemixClick}
                  disabled
                  className="px-8 py-6 text-lg font-semibold bg-slate-800 text-slate-100 rounded-lg w-full sm:w-auto border border-slate-700 opacity-50 cursor-not-allowed"
                >
                  Remix popular work
                </Button>

                <Button
                  onClick={onChatClick}
                  className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-[#FF4DA6] to-pink-500 text-white hover:opacity-90 transition-opacity rounded-lg w-full sm:w-auto"
                >
                  Chat with me
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};
