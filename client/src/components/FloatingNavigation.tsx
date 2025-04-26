import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'wouter';
import { 
  Home, 
  Leaf, 
  BarChart2, 
  MessageCircle, 
  Settings,
  Camera,
  Upload,
  Plus
} from 'lucide-react';

export function FloatingNavigation() {
  const [location] = useLocation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Handle scroll effect with improved behavior for Apple-inspired UX
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        // Hide navbar only when scrolling down actively and past a threshold
        // This creates a more fluid experience similar to iOS apps
        if (window.scrollY > lastScrollY && window.scrollY > 150) {
          // Scrolling down & past threshold - hide navbar
          setIsVisible(false);
        } else if (window.scrollY < lastScrollY || window.scrollY < 50) {
          // Scrolling up or near the top - show navbar
          setIsVisible(true);
        }
        
        // Add small delay for smoother appearance
        const timeoutId = setTimeout(() => {
          // Update last scroll position with a slight delay to create a more natural feel
          setLastScrollY(window.scrollY);
        }, 50);
        
        return () => clearTimeout(timeoutId);
      }
    };

    // Add scroll event listener with passive option for better performance
    window.addEventListener('scroll', controlNavbar, { passive: true });

    // Touch events for better mobile interaction: show navbar on touch start (like tapping)
    const handleTouchStart = () => {
      if (!isVisible && window.scrollY > 0) {
        setIsVisible(true);
      }
    };
    
    window.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', controlNavbar);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [lastScrollY, isVisible]);
  
  // Define animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 100 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: 100,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };
  
  const iconVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 500
      }
    },
    tap: { 
      scale: 0.92,
      y: 2
    },
    bounce: (delay: number) => ({
      y: [0, -10, 0],
      transition: {
        delay: delay,
        duration: 0.5,
        times: [0, 0.5, 1],
        type: "spring",
        stiffness: 300
      }
    })
  };
  
  const panelVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  };
  
  // Determine if a route is active
  const isActive = (path: string) => location === path;
  
  // Navigation items
  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/my-plants', icon: Leaf, label: 'My Plants' },
    { path: '/analytics', icon: BarChart2, label: 'Analytics' },
    { path: '/chat', icon: MessageCircle, label: 'Chat' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];
  
  // Quick actions for the popup panel
  const quickActions = [
    { icon: Camera, label: 'Take Photo', action: () => console.log('Take photo') },
    { icon: Upload, label: 'Upload Image', action: () => console.log('Upload image') }
  ];
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-6 pointer-events-none"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
        >
          {/* Quick actions panel with enhanced glassmorphism */}
          <AnimatePresence>
            {isPanelOpen && (
              <motion.div
                className="mb-4 dark:bg-gray-800/80 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 mx-4 pointer-events-auto border border-white/20 dark:border-gray-700/30"
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(255, 255, 255, 0.1) inset',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)'
                }}
              >
                <div className="grid grid-cols-2 gap-4 w-full">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.label}
                      className="flex flex-col items-center justify-center space-y-3 p-4 rounded-xl dark:bg-gray-700/60 bg-gray-50/60 border border-white/20 dark:border-gray-700/30 hover:bg-gray-100/70 dark:hover:bg-gray-600/70 transition-all backdrop-blur-md"
                      onClick={() => {
                        action.action();
                        setIsPanelOpen(false);
                      }}
                      whileTap={{ scale: 0.92, y: 2 }}
                      whileHover={{ 
                        scale: 1.05, 
                        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(255, 255, 255, 0.1) inset' 
                      }}
                      variants={iconVariants}
                      style={{
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(255, 255, 255, 0.1) inset'
                      }}
                    >
                      <action.icon className="h-7 w-7 text-primary drop-shadow-sm" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 sf-pro-display">
                        {action.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main navigation bar with enhanced glassmorphism */}
          <motion.div
            className="dark:bg-gray-800/85 bg-white/85 backdrop-blur-2xl rounded-full shadow-xl mx-4 pointer-events-auto border border-white/20 dark:border-gray-700/30"
            style={{
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(255, 255, 255, 0.1) inset',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              width: 'calc(100% - 2rem)',
              maxWidth: '500px'
            }}
          >
            <div className="flex items-center justify-around p-3">
              {navItems.map((item, index) => {
                const active = isActive(item.path);
                
                return (
                  <Link key={item.path} href={item.path}>
                    <motion.div
                      className={`flex flex-col items-center justify-center p-3 rounded-full ${
                        active 
                          ? 'text-primary bg-gray-100/50 dark:bg-gray-700/50 border border-white/30 dark:border-gray-600/30 shadow-sm' 
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/30 dark:hover:bg-gray-700/30 transition-all'
                      } cursor-pointer`}
                      whileTap="tap"
                      variants={iconVariants}
                      custom={index * 0.15}
                      animate={active ? ["visible", "bounce"] : "visible"}
                      style={{
                        backdropFilter: active ? 'blur(8px)' : 'none',
                        WebkitBackdropFilter: active ? 'blur(8px)' : 'none'
                      }}
                      whileHover={!active ? {
                        y: -2,
                        transition: { duration: 0.2 }
                      } : {}}
                    >
                      <item.icon
                        className={`h-6 w-6 transition-transform ${active ? 'scale-110 drop-shadow-sm' : ''}`}
                      />
                      <span className="text-xs mt-1 font-medium sf-pro-display">
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
              
              {/* Center Action Button with enhanced Apple-like design */}
              <motion.button
                className="flex items-center justify-center p-3.5 rounded-full bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg border border-white/10"
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                whileTap={{ scale: 0.85, boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)' }}
                whileHover={{ 
                  scale: 1.08, 
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.25), 0 2px 10px rgba(0, 0, 0, 0.2)', 
                  y: -2 
                }}
                variants={iconVariants}
                style={{
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2), 0 1px 8px rgba(255, 255, 255, 0.1) inset',
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                }}
              >
                <motion.div
                  animate={{ 
                    rotate: isPanelOpen ? 45 : 0,
                    scale: isPanelOpen ? 1.1 : 1
                  }}
                  className="flex items-center justify-center"
                  style={{ originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Plus className="h-6 w-6 drop-shadow-sm" />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}