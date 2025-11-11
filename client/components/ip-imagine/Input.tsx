import React, {
  ChangeEvent,
  Dispatch,
  FormEvent,
  KeyboardEvent,
  MutableRefObject,
  RefObject,
  SetStateAction,
  useState,
} from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  RemixImage,
  type PreviewImage,
  type PreviewImagesState,
} from "@/components/remix-mode";

type IpImagineInputProps = {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  waiting: boolean;
  previewImages: PreviewImagesState;
  setPreviewImages: Dispatch<SetStateAction<PreviewImagesState>>;
  uploadRef: MutableRefObject<HTMLInputElement | null>;
  handleImage: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => Promise<void> | void;
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement>;
  handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  toolsOpen: boolean;
  setToolsOpen: Dispatch<SetStateAction<boolean>>;
  suggestions: string[];
  setSuggestions: Dispatch<SetStateAction<string[]>>;
  attachmentLoading?: boolean;
  onRemixRegisterWarning?: () => void;
  onAddRemixImage?: () => void;
};

const IpImagineInput = ({
  input,
  setInput,
  waiting,
  previewImages,
  setPreviewImages,
  uploadRef,
  handleImage,
  onSubmit,
  inputRef,
  handleKeyDown,
  toolsOpen,
  setToolsOpen,
  suggestions,
  setSuggestions,
  attachmentLoading = false,
  onRemixRegisterWarning,
  onAddRemixImage,
}: IpImagineInputProps) => {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const navigate = useNavigate();

  return (
    <form
      className="chat-input flex items-center gap-2 px-3 sm:px-[1.45rem] py-3.5 border-t-0 md:border-t md:border-[#FF4DA6]/10 bg-slate-950/60 md:bg-gradient-to-r md:from-slate-950/60 md:via-[#FF4DA6]/5 md:to-slate-950/60 flex-none sticky bottom-0 z-10 backdrop-blur-xl transition-all duration-300"
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const isRemixWithRegister =
          previewImages.remixImage && input.toLowerCase().includes("register");
        if (isRemixWithRegister) {
          onRemixRegisterWarning?.();
        } else {
          void onSubmit();
        }
      }}
      autoComplete="off"
    >
      {/* Creations Gallery - Navigate to Creation Result */}
      <div className="mr-2 flex items-center">
        <button
          type="button"
          onClick={() => {
            const demoImageUrl =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23FF4DA6" width="400" height="300"/%3E%3Ctext x="200" y="150" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3ECreation Demo%3C/text%3E%3C/svg%3E';
            navigate("/creation-result", {
              state: {
                type: "image",
                outputUrl: demoImageUrl,
                prompt:
                  input ||
                  "This is a demo creation. Replace with actual generation results.",
                timestamp: new Date().toISOString(),
              },
            });
          }}
          className="flex-shrink-0 p-1.5 text-[#FF4DA6] hover:bg-[#FF4DA6]/10 rounded-lg active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA6]/30"
          aria-label="View creations and results"
          title="Creation Results"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM11 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM11 12a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 bg-slate-900/60 rounded-2xl pl-2 pr-4 py-2 focus-within:ring-2 focus-within:ring-[#FF4DA6]/30 transition-all duration-300">
        <RemixImage
          previewImages={previewImages}
          setPreviewImages={setPreviewImages}
          onAddImageClick={onAddRemixImage}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            data-file-input-btn
            disabled={attachmentLoading}
            className={`flex-shrink-0 p-1.5 rounded-lg active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA6]/30 ${attachmentLoading ? "text-slate-400 bg-slate-800/30 cursor-wait" : "text-[#FF4DA6] hover:bg-[#FF4DA6]/20"}`}
            onClick={() => uploadRef.current?.click()}
            onPointerDown={(event) => event.preventDefault()}
            aria-label="Add attachment"
          >
            {attachmentLoading ? (
              <svg
                className="h-5 w-5 animate-spin text-[#FF4DA6]"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeOpacity="0.15"
                  strokeWidth="3"
                />
                <path
                  d="M22 12a10 10 0 00-10-10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            )}
          </button>

          <textarea
            ref={inputRef as any}
            data-chat-input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Type to create…"
            disabled={waiting}
            className="flex-1 resize-none px-4 py-0 bg-transparent text-white placeholder:text-slate-400 min-h-[40px] max-h-32 overflow-y-auto focus:outline-none font-medium text-[0.97rem] disabled:opacity-50"
          />
        </div>


        {suggestions.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-1.5 px-4 py-2 border-t border-slate-700/50"
          >
            <p className="text-xs text-slate-400 font-medium">Suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion + index}
                  type="button"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    setInput(suggestion);
                    setSuggestions([]);
                    inputRef.current?.focus?.();
                  }}
                  className="px-3 py-1.5 text-xs bg-gradient-to-r from-[#FF4DA6]/20 to-[#FF4DA6]/10 text-[#FF4DA6] rounded-lg hover:from-[#FF4DA6]/30 hover:to-[#FF4DA6]/20 transition-all duration-200 hover:scale-105 cursor-pointer font-medium border border-[#FF4DA6]/20 hover:border-[#FF4DA6]/40"
                >
                  {suggestion}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={
          waiting ||
          (!input.trim() &&
            !previewImages.remixImage &&
            !previewImages.additionalImage)
        }
        className="flex-shrink-0 p-2 rounded-lg bg-[#FF4DA6]/20 text-[#FF4DA6] hover:bg-[#FF4DA6]/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF4DA6]/30"
        aria-label="Send message"
        onPointerDown={(event) => event.preventDefault()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M2.94 2.94a1.5 1.5 0 012.12 0L17 14.88V17a1 1 0 01-1 1h-2.12L2.94 5.06a1.5 1.5 0 010-2.12z" />
        </svg>
      </button>
    </form>
  );
};

export default IpImagineInput;
