/**
 * Chart animation configurations and utilities
 */

export const CHART_ANIMATION_DURATION = 800;
export const CHART_EASING = "ease-in-out";

/**
 * Recharts animation configuration
 */
export const chartAnimationConfig = {
  animationDuration: CHART_ANIMATION_DURATION,
  animationEasing: CHART_EASING,
  isAnimationActive: true,
};

/**
 * Staggered animation delays for multiple elements
 */
export const getStaggerDelay = (index: number, baseDelay = 50): number => {
  return index * baseDelay;
};

/**
 * Fade in animation class
 */
export const fadeInAnimation = "animate-in fade-in duration-500";

/**
 * Slide up animation class
 */
export const slideUpAnimation = "animate-in slide-in-from-bottom-4 duration-500";

/**
 * Scale animation class
 */
export const scaleAnimation = "animate-in zoom-in-95 duration-300";

/**
 * Chart container animations
 */
export const chartContainerAnimation = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

/**
 * Stats card animations with stagger
 */
export const statsCardAnimation = (index: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.4,
    delay: getStaggerDelay(index, 100),
    ease: "easeOut",
  },
});

/**
 * Summary stats grid animation
 */
export const summaryStatsAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.6, staggerChildren: 0.1 },
};

/**
 * Hover scale effect
 */
export const hoverScaleClass = "transition-transform hover:scale-[1.02] active:scale-[0.98]";

/**
 * Smooth color transition
 */
export const colorTransitionClass = "transition-colors duration-300";

