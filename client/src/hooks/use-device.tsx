import { useState, useEffect } from "react";

export function useDevice() {
  const [isMobile, setIsMobile] = useState(false);
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    const checkDevice = () => {
      // Check if mobile based on screen width
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      // Determine more specific device type
      if (width < 640) {
        setDeviceType('mobile');
      } else if (width < 1024) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };
    
    // Check for touch capability (additional mobile indicator)
    const hasTouchScreen = () => {
      return 'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - For IE-specific detection
        navigator.msMaxTouchPoints > 0;
    };
    
    // Check on initial load
    checkDevice();
    
    // If touch is available, it's likely a mobile device
    if (hasTouchScreen() && window.innerWidth < 1024) {
      setIsMobile(true);
      if (window.innerWidth < 640) {
        setDeviceType('mobile');
      } else {
        setDeviceType('tablet');
      }
    }
    
    // Add event listener for window resize
    window.addEventListener("resize", checkDevice);
    
    // Clean up event listener
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return { 
    isMobile, 
    deviceType,
    isDesktop: deviceType === 'desktop',
    isTablet: deviceType === 'tablet',
    isMobileDevice: deviceType === 'mobile'
  };
}