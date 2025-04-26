import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'wouter';
import { 
  Home, 
  Leaf, 
  BarChart2, 
  MessageCircle, 
  Settings,
  Camera,
  Upload
} from 'lucide-react';

export function FloatingNavigation() {
  const [location] = useLocation();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  // Define animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2
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
      scale: 0.85,
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
    hidden: { opacity: 0, height: 0, y: 10 },
    visible: {
      opacity: 1,
      height: 'auto',
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
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center pb-4 pointer-events-none"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Quick actions panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            className="mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 mx-4 pointer-events-auto"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
            }}
          >
            <div className="grid grid-cols-2 gap-4 w-full">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  className="flex flex-col items-center justify-center space-y-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => {
                    action.action();
                    setIsPanelOpen(false);
                  }}
                  whileTap={{ scale: 0.95 }}
                  variants={iconVariants}
                >
                  <action.icon className="h-6 w-6 text-primary" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
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
        className="bg-white dark:bg-gray-800 rounded-full shadow-lg mx-4 pointer-events-auto"
        style={{
          borderRadius: '28px',
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)'
        }}
      >
        <div className="flex items-center justify-around px-4 py-2">
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
                  custom={index * 0.2}
                  animate={active ? ["visible", "bounce"] : "visible"}
                >
                  <item.icon
                    className={`h-6 w-6 transition-transform ${active ? 'scale-110' : ''}`}
                  />
                  <span className="text-xs mt-1 font-medium">
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
          
          {/* Center Action Button */}
          <motion.button
            className={`flex items-center justify-center p-3 rounded-full bg-primary text-white`}
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.1 }}
            variants={iconVariants}
          >
            <motion.span
              animate={{ rotate: isPanelOpen ? 45 : 0 }}
              className="text-xl font-bold"
              style={{ originX: 0.5, originY: 0.5 }}
            >
              +
            </motion.span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}