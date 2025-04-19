import { useTheme } from "@/lib/ThemeProvider";
import { Link, useLocation } from "wouter";
import { BarChart3, MessageSquare, Leaf, Settings as SettingsIcon, Sun, Moon, Menu } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { userSignOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { useDevice } from "@/hooks/use-device";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [location, setLocation] = useLocation();
  const { user, profile } = useAuth();
  const { isMobile, isMobileDevice } = useDevice();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleSignOut = async () => {
    await userSignOut();
    setLocation('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <motion.div
            animate={{ rotate: [0, 10, 0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Leaf className="h-6 w-6 text-green-600 dark:text-green-500" />
          </motion.div>
          <h1 className="text-xl font-semibold">Smart Plant Monitor</h1>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 md:space-x-2">
            <Link href="/">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors cursor-pointer ${location === '/' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400'}`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </motion.div>
            </Link>
            
            <Link href="/my-plants">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors cursor-pointer ${location === '/my-plants' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400'}`}
              >
                <Leaf className="h-4 w-4" />
                <span className="hidden sm:inline">My Plants</span>
              </motion.div>
            </Link>
            
            <Link href="/chat">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors cursor-pointer ${location === '/chat' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400'}`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Plant Chat</span>
              </motion.div>
            </Link>
            
            <Link href="/settings">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors cursor-pointer ${location === '/settings' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400'}`}
              >
                <SettingsIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </motion.div>
            </Link>
          </nav>
          
          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer">
                  <Avatar className="h-8 w-8 border border-gray-200 dark:border-gray-700">
                    {profile?.photoURL && <AvatarImage src={profile.photoURL} alt={profile.displayName} />}
                    <AvatarFallback className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      {profile?.displayName ? getInitials(profile.displayName) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{profile?.displayName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/my-plants">My Plants</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/chat">Plant Chat</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 dark:text-red-400">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              onClick={() => setLocation('/login')}
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
