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
          {/* Ultra-premium quick actions panel with Apple-inspired design */}
          <AnimatePresence>
            {isPanelOpen && (
              <motion.div
                className="mb-6 dark:bg-gray-800/70 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl mx-4 pointer-events-auto"
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18), 0 10px 20px rgba(0, 0, 0, 0.1), 0 0 0 0.5px rgba(255, 255, 255, 0.3), 0 1px 3px rgba(255, 255, 255, 0.15) inset',
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)'
                }}
              >
                {/* Subtle top highlight */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>
                
                <div className="p-6">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center sf-pro-display tracking-tight">
                    <motion.span 
                      className="inline-block mr-2"
                      animate={{
                        rotate: [0, -10, 0, 10, 0],
                        transition: { duration: 1.5, repeat: Infinity, repeatDelay: 3 }
                      }}
                    >✨</motion.span>
                    Quick Actions
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-5 w-full">
                    {quickActions.map((action, index) => (
                      <motion.button
                        key={action.label}
                        className="flex flex-col items-center space-y-3 p-5 rounded-2xl backdrop-blur-lg"
                        onClick={() => {
                          action.action();
                          setIsPanelOpen(false);
                        }}
                        whileTap={{ scale: 0.92 }}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -5,
                          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.15), 0 5px 15px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(255, 255, 255, 0.5), 0 1px 3px rgba(255, 255, 255, 0.2) inset' 
                        }}
                        variants={iconVariants}
                        style={{
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.06) 100%)',
                          boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08), 0 5px 12px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(255, 255, 255, 0.4), 0 1px 3px rgba(255, 255, 255, 0.15) inset'
                        }}
                      >
                        {/* Animated icon container */}
                        <motion.div
                          className="bg-gradient-to-br from-primary-light/20 to-primary/10 p-3.5 rounded-xl"
                          animate={{
                            boxShadow: [
                              '0 8px 20px rgba(0, 0, 0, 0.08), 0 3px 8px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(255, 255, 255, 0.5)',
                              '0 10px 25px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(255, 255, 255, 0.6)',
                              '0 8px 20px rgba(0, 0, 0, 0.08), 0 3px 8px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(255, 255, 255, 0.5)'
                            ]
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          style={{
                            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08), 0 3px 8px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(255, 255, 255, 0.5)'
                          }}
                        >
                          <action.icon className="h-8 w-8 text-primary drop-shadow-md" />
                        </motion.div>
                        
                        <div className="text-center">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 sf-pro-display tracking-tight">
                            {action.label}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 sf-pro-display">
                            {index === 0 ? 'Use camera' : 'From gallery'}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main navigation bar with ultra-premium Apple-inspired glassmorphism */}
          <motion.div
            className="dark:bg-gray-900/85 bg-white/90 backdrop-blur-2xl rounded-full shadow-xl mx-4 pointer-events-auto"
            style={{
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(255, 255, 255, 0.1) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              width: 'calc(100% - 2rem)',
              maxWidth: '500px'
            }}
            animate={{
              boxShadow: [
                '0 10px 30px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(255, 255, 255, 0.1) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.2)',
                '0 10px 30px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(255, 255, 255, 0.1) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.25)',
                '0 10px 30px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(255, 255, 255, 0.1) inset, 0 0 0 0.5px rgba(255, 255, 255, 0.2)'
              ]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="flex items-center justify-around p-2">
              {navItems.map((item, index) => {
                const active = isActive(item.path);
                
                return (
                  <Link key={item.path} href={item.path}>
                    <motion.div
                      className={`flex flex-col items-center justify-center py-2 px-2.5 rounded-full ${
                        active 
                          ? 'bg-gradient-to-b from-white/80 to-white/40 dark:from-gray-800/90 dark:to-gray-700/70 shadow-lg' 
                          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/20 dark:hover:bg-gray-700/20 transition-all'
                      } cursor-pointer`}
                      whileTap="tap"
                      variants={iconVariants}
                      custom={index * 0.15}
                      animate={active ? ["visible", "bounce"] : "visible"}
                      style={{
                        boxShadow: active ? '0 5px 15px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(255, 255, 255, 0.5), 0 1px 2px rgba(255, 255, 255, 0.2) inset' : 'none',
                        backdropFilter: active ? 'blur(10px)' : 'none',
                        WebkitBackdropFilter: active ? 'blur(10px)' : 'none'
                      }}
                      whileHover={!active ? {
                        y: -3,
                        scale: 1.05,
                        boxShadow: '0 5px 10px rgba(0, 0, 0, 0.05)',
                        transition: { duration: 0.2, type: "spring", stiffness: 300 }
                      } : {}}
                    >
                      <motion.div
                        className={`flex items-center justify-center p-2 rounded-full ${
                          active 
                            ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary dark:from-primary/30 dark:to-primary/10 shadow-sm' 
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                        style={{
                          boxShadow: active ? '0 3px 10px rgba(0, 0, 0, 0.05), 0 0 0 0.5px rgba(255, 255, 255, 0.2)' : 'none'
                        }}
                        animate={active ? {
                          scale: [1, 1.03, 1],
                          transition: { 
                            duration: 2,
                            repeat: Infinity,
                            repeatType: "reverse" 
                          }
                        } : {}}
                      >
                        <item.icon
                          className={`h-6 w-6 transition-transform ${active ? 'drop-shadow-md' : ''}`}
                        />
                      </motion.div>
                      
                      <span className={`text-xs mt-1.5 font-medium sf-pro-display tracking-tight ${
                        active ? 'text-primary-dark dark:text-primary-light' : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
              
              {/* Center Action Button with premium Apple-like design */}
              <motion.button
                className="flex items-center justify-center rounded-full shadow-xl"
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                whileTap={{ scale: 0.85 }}
                whileHover={{ 
                  scale: 1.08, 
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.25), 0 6px 10px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(255, 255, 255, 0.5), 0 1px 3px rgba(255, 255, 255, 0.15) inset', 
                  y: -3 
                }}
                variants={iconVariants}
                style={{
                  background: 'linear-gradient(145deg, #4caf50, #2e7d32)',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 0.3), 0 1px 3px rgba(255, 255, 255, 0.15) inset'
                }}
              >
                <motion.div
                  animate={{ 
                    rotate: isPanelOpen ? 45 : 0,
                    scale: isPanelOpen ? 1.1 : 1
                  }}
                  className="flex items-center justify-center p-3.5"
                  style={{ originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.3, ease: "easeInOut", type: "spring", stiffness: 500 }}
                >
                  <Plus className="h-6 w-6 text-white drop-shadow-md" />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}