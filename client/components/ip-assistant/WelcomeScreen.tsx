import { useState } from "react";
import { motion } from "framer-motion";

type WelcomeScreenProps = {
  onRegisterWork: () => void;
  onRemixWork: () => void;
};

export const WelcomeScreen = ({
  onRegisterWork,
  onRemixWork,
}: WelcomeScreenProps) => {
  const [showGuide, setShowGuide] = useState(false);

  const handleRegisterClick = () => {
    setShowGuide(true);
    onRegisterWork();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full flex items-center justify-center px-4"
    >
      <div className="text-center max-w-2xl">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-bold text-white mb-2"
        >
          Welcome to Radut IP Assistant
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-300 mb-12"
        >
          What do you need?
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={handleRegisterClick}
            className="px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 bg-[#FF4DA6] hover:bg-[#FF4DA6]/90 hover:shadow-lg hover:shadow-[#FF4DA6]/30"
          >
            Register your work
          </button>
          <button
            onClick={onRemixWork}
            className="px-8 py-4 rounded-lg font-semibold text-white transition-all duration-200 bg-slate-700 hover:bg-slate-600 hover:shadow-lg hover:shadow-slate-600/30"
          >
            Remix popular work
          </button>
        </motion.div>

        {showGuide && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 p-6 rounded-lg bg-slate-900/50 border border-slate-700/50"
          >
            <h3 className="text-lg font-semibold text-[#FF4DA6] mb-4">
              How to Register Your Work
            </h3>
            <div className="space-y-3 text-left">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF4DA6] text-white flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div>
                  <p className="text-slate-100 font-medium">Choose a file</p>
                  <p className="text-slate-400 text-sm">
                    Click the attachment button below to upload an image of your IP work
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF4DA6] text-white flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div>
                  <p className="text-slate-100 font-medium">Type "register"</p>
                  <p className="text-slate-400 text-sm">
                    Type "register" in the chat and send to begin the registration process
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
