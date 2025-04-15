import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { FaGoogle } from 'react-icons/fa';
import { 
  signInWithGoogle, 
  updateExpertiseLevel, 
  EXPERTISE_LEVELS 
} from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Leaf, Loader2 } from 'lucide-react';

export default function Login() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, loading, refreshProfile } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [selectedExpertise, setSelectedExpertise] = useState('');
  const [showExpertiseSelection, setShowExpertiseSelection] = useState(false);

  // Handle Google sign in
  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    try {
      const profile = await signInWithGoogle();
      
      if (profile) {
        // If the user is new or doesn't have an expertise level set
        if (!profile.expertiseLevel) {
          setShowExpertiseSelection(true);
        } else {
          // User already has expertise level, redirect to dashboard
          toast({
            title: "Welcome back!",
            description: "Successfully signed in",
          });
          setLocation('/');
        }
      } else {
        toast({
          title: "Sign in failed",
          description: "Could not sign in with Google",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      toast({
        title: "Sign in failed",
        description: "An error occurred during sign in",
        variant: "destructive"
      });
    } finally {
      setSigningIn(false);
    }
  };

  // Handle expertise level selection
  const handleExpertiseSubmit = async () => {
    if (!selectedExpertise || !user) return;
    
    setSigningIn(true);
    try {
      const updated = await updateExpertiseLevel(user.uid, selectedExpertise);
      
      if (updated) {
        await refreshProfile();
        toast({
          title: "Profile updated",
          description: "Your expertise level has been saved",
        });
        setLocation('/');
      } else {
        toast({
          title: "Update failed",
          description: "Could not save your expertise level",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating expertise level:', error);
      toast({
        title: "Update failed",
        description: "An error occurred while saving your expertise level",
        variant: "destructive"
      });
    } finally {
      setSigningIn(false);
    }
  };

  // If already signed in and has expertise, redirect to dashboard
  if (user && !loading && !showExpertiseSelection) {
    setLocation('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {!showExpertiseSelection ? (
          <Card className="border-0 shadow-lg overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 to-blue-100/20 dark:from-green-900/20 dark:to-blue-900/10" />
            
            <CardHeader className="relative z-10 pb-6 text-center">
              <motion.div 
                className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <CardTitle className="text-2xl font-bold">Smart Plant Monitor</CardTitle>
              <CardDescription>
                Sign in to manage your plants and access personalized care recommendations
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10 pt-2">
              <div className="space-y-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={signingIn}
                    className="w-full bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 border border-gray-300 dark:border-slate-600 h-12"
                    variant="outline"
                  >
                    {signingIn ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
                    )}
                    {signingIn ? "Signing in..." : "Sign in with Google"}
                  </Button>
                </motion.div>
                
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                  By signing in, you agree to our Terms of Service and Privacy Policy
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-lg overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 to-blue-100/20 dark:from-green-900/20 dark:to-blue-900/10" />
            
            <CardHeader className="relative z-10">
              <CardTitle>Tell us about your gardening skills</CardTitle>
              <CardDescription>
                This helps us tailor recommendations to your experience level
              </CardDescription>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-4">
              <div className="space-y-3">
                {EXPERTISE_LEVELS.map((level) => (
                  <motion.div 
                    key={level.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      onClick={() => setSelectedExpertise(level.id)}
                      className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${
                        selectedExpertise === level.id
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="font-medium">{level.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {level.description}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="pt-4">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleExpertiseSubmit}
                    disabled={!selectedExpertise || signingIn}
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                  >
                    {signingIn ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {signingIn ? "Saving..." : "Continue"}
                  </Button>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}