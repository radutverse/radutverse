import { useEffect, useRef } from "react";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface FlyingImageAnimationProps {
  isActive: boolean;
  // the element that should be the target (gallery button)
  targetRef: React.RefObject<HTMLElement>;
  // the element where the animation should start (send button)
  startRef: React.RefObject<HTMLElement>;
  onComplete?: () => void;
}

const FlyingImageAnimation = ({
  isActive,
  targetRef,
  startRef,
  onComplete,
}: FlyingImageAnimationProps) => {
  const animRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // debug logs
    // eslint-disable-next-line no-console
    console.log("[FlyingImageAnimation] isActive:", isActive, "startRef.current:", startRef?.current, "targetRef.current:", targetRef?.current, "animRef.current:", animRef.current);

    if (
      !isActive ||
      !targetRef.current ||
      !startRef?.current ||
      !animRef.current
    ) {
      // eslint-disable-next-line no-console
      console.warn("[FlyingImageAnimation] missing refs or not active");
      return;
    }

    const startRect = startRef.current.getBoundingClientRect();
    const targetRect = targetRef.current.getBoundingClientRect();

    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const endX = targetRect.left + targetRect.width / 2;
    const endY = targetRect.top + targetRect.height / 2;

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Position the anim element centered at the start position
    const el = animRef.current;
    const size = 64; // w-16 h-16
    el.style.left = `${startX - size / 2}px`;
    el.style.top = `${startY - size / 2}px`;

    const animation = el.animate(
      [
        { transform: `translate(0px, 0px) scale(1)`, opacity: 1 },
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(0.9)`,
          opacity: 0.1,
        },
      ],
      {
        duration: 650,
        easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        fill: "forwards",
      },
    );

    const handle = setTimeout(() => onComplete?.(), 650);

    return () => {
      animation.cancel();
      clearTimeout(handle);
    };
  }, [isActive, targetRef, startRef, onComplete]);

  if (!isActive) return null;

  return (
    <div
      ref={animRef}
      className="fixed z-50 pointer-events-none"
      style={{ width: 64, height: 64 }}
    >
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#FF4DA6] to-[#FF4DA6]/60 border-2 border-[#FF4DA6] shadow-lg flex items-center justify-center"
      >
        <svg
          className="w-8 h-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default FlyingImageAnimation;
