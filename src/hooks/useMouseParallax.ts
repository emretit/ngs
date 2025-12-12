import { useState, useEffect, useCallback, useRef } from 'react';

interface UseMouseParallaxOptions {
  maxTilt?: number;
  smoothing?: number;
  respectReducedMotion?: boolean;
  disableOnMobile?: boolean;
}

interface ParallaxResult {
  tiltX: number;
  tiltY: number;
  isEnabled: boolean;
}

export const useMouseParallax = ({
  maxTilt = 6,
  smoothing = 0.1,
  respectReducedMotion = true,
  disableOnMobile = true,
}: UseMouseParallaxOptions = {}): ParallaxResult => {
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  
  const targetTiltX = useRef(0);
  const targetTiltY = useRef(0);
  const animationFrameId = useRef<number>();

  useEffect(() => {
    // Check for reduced motion preference
    if (respectReducedMotion) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setIsEnabled(false);
        return;
      }
    }

    // Check for mobile devices
    if (disableOnMobile) {
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
      if (isMobile) {
        setIsEnabled(false);
        return;
      }
    }

    setIsEnabled(true);
  }, [respectReducedMotion, disableOnMobile]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isEnabled) return;

    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;

    // Calculate position relative to center (-1 to 1)
    const x = (clientX / innerWidth - 0.5) * 2;
    const y = (clientY / innerHeight - 0.5) * 2;

    // Set target tilts
    targetTiltX.current = -y * maxTilt; // Invert Y for natural feel
    targetTiltY.current = x * maxTilt;
  }, [isEnabled, maxTilt]);

  // Smooth animation loop with lerp
  useEffect(() => {
    if (!isEnabled) return;

    const animate = () => {
      setTiltX(prev => prev + (targetTiltX.current - prev) * smoothing);
      setTiltY(prev => prev + (targetTiltY.current - prev) * smoothing);
      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isEnabled, smoothing]);

  useEffect(() => {
    if (!isEnabled) return;

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isEnabled, handleMouseMove]);

  // Reset on disable
  useEffect(() => {
    if (!isEnabled) {
      setTiltX(0);
      setTiltY(0);
      targetTiltX.current = 0;
      targetTiltY.current = 0;
    }
  }, [isEnabled]);

  return { tiltX, tiltY, isEnabled };
};
