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
  
  // Handle scroll effect
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        // For mobile experience: hide on scroll down, show on scroll up
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          // Scrolling down & past threshold - hide navbar
          setIsVisible(false);
        } else {
          // Scrolling up or at top - show navbar
          setIsVisible(true);
        }
        
        // Update last scroll position
        setLastScrollY(window.scrollY);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', controlNavbar);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);
  
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
          {/* Quick actions panel */}
          <AnimatePresence>
            {isPanelOpen && (
              <motion.div
                className="mb-4 dark:bg-gray-800/90 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg p-5 mx-4 pointer-events-auto"
                variants={panelVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div className="grid grid-cols-2 gap-4 w-full">
                  {quickActions.map((action, index) => (
                    <motion.button
                      key={action.label}
                      className="flex flex-col items-center justify-center space-y-3 p-4 rounded-xl dark:bg-gray-700/80 bg-gray-50/80 hover:bg-gray-100 dark:hover:bg-gray-600/90 transition-colors backdrop-blur-md"
                      onClick={() => {
                        action.action();
                        setIsPanelOpen(false);
                      }}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.03 }}
                      variants={iconVariants}
                    >
                      <action.icon className="h-7 w-7 text-primary" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 sf-pro-display">
                        {action.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Main navigation bar */}
          <motion.div
            className="dark:bg-gray-800/90 bg-white/90 backdrop-blur-xl rounded-full shadow-lg mx-4 pointer-events-auto"
            style={{
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
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
                        active ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                      } cursor-pointer`}
                      whileTap="tap"
                      variants={iconVariants}
                      custom={index * 0.15}
                      animate={active ? ["visible", "bounce"] : "visible"}
                    >
                      <item.icon
                        className={`h-6 w-6 transition-transform ${active ? 'scale-110' : ''}`}
                      />
                      <span className="text-xs mt-1 font-medium sf-pro-display">
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
              
              {/* Center Action Button */}
              <motion.button
                className="flex items-center justify-center p-3.5 rounded-full bg-primary text-white shadow-md"
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.08 }}
                variants={iconVariants}
              >
                <motion.div
                  animate={{ rotate: isPanelOpen ? 45 : 0 }}
                  className="flex items-center justify-center"
                  style={{ originX: 0.5, originY: 0.5 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <Plus className="h-6 w-6" />
                </motion.div>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}