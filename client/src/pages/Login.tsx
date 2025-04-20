import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import { 
  signInWithGoogle, 
  loginWithEmail,
  registerWithEmail,
  resetPassword,
  updateExpertiseLevel, 
  EXPERTISE_LEVELS 
} from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  
  // Email form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
  
  // Handle email login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please enter your email and password",
        variant: "destructive"
      });
      return;
    }
    
    setSigningIn(true);
    try {
      const profile = await loginWithEmail(email, password);
      
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
          description: "Could not sign in with email/password",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error signing in with email:', error);
      toast({
        title: "Sign in failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setSigningIn(false);
    }
  };
  
  // Handle email registration
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !displayName) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }
    
    setSigningIn(true);
    try {
      const profile = await registerWithEmail(email, password, displayName);
      
      if (profile) {
        setShowExpertiseSelection(true);
      } else {
        toast({
          title: "Registration failed",
          description: "Could not create your account",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error registering with email:', error);
      toast({
        title: "Registration failed",
        description: "This email may already be registered",
        variant: "destructive"
      });
    } finally {
      setSigningIn(false);
    }
  };
  
  // State for the reset password result
  const [newPassword, setNewPassword] = useState<string | null>(null);
  
  // Handle password reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Missing email",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    
    setSigningIn(true);
    try {
      const generatedPassword = await resetPassword(email);
      setNewPassword(generatedPassword);
      toast({
        title: "Password reset successful",
        description: "Your password has been reset. Please use the new password displayed below to log in.",
        duration: 10000, // Make sure it stays visible longer
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Failed to reset password",
        description: error.message || "Please check if the email is correct",
        variant: "destructive"
      });
    } finally {
      setSigningIn(false);
    }
  };

  // If already signed in and has expertise (or came from password reset), redirect to dashboard
  if (user && !loading && (!showExpertiseSelection || newPassword)) {
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
              {showResetPassword ? (
                // Password Reset Form
                <div className="space-y-4">
                  {newPassword ? (
                    // Show the new password
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="font-medium text-green-800 dark:text-green-300 mb-2">Password Reset Successful!</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                          Your new password is:
                        </p>
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded">
                          <code className="font-mono text-base font-bold">{newPassword}</code>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={() => {
                              navigator.clipboard.writeText(newPassword);
                              toast({
                                title: "Copied to clipboard",
                                description: "Password copied to clipboard",
                              });
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                          Remember to use this password to log in. You can change it later in your profile settings.
                        </p>
                      </div>
                      <div className="text-center">
                        <Button
                          variant="default"
                          onClick={() => {
                            // Auto-fill the email and password fields
                            setPassword(newPassword || '');
                            // Go back to login screen
                            setShowResetPassword(false);
                            setShowEmailForm(true);
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                        >
                          Back to Login
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Show the reset password form
                    <form onSubmit={handlePasswordReset}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <div className="relative">
                            <FaEnvelope className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              id="reset-email"
                              type="email"
                              placeholder="your.email@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            type="submit"
                            disabled={signingIn || !email}
                            className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                          >
                            {signingIn ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {signingIn ? "Resetting Password..." : "Reset My Password"}
                          </Button>
                        </motion.div>
                        
                        <div className="text-center">
                          <Button
                            variant="link"
                            onClick={() => setShowResetPassword(false)}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          >
                            Back to Sign In
                          </Button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              ) : showEmailForm ? (
                // Email Authentication Form (Login/Register)
                <div className="space-y-4">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger 
                        value="login" 
                        onClick={() => setIsRegistering(false)}
                        className="text-sm"
                      >
                        Sign In
                      </TabsTrigger>
                      <TabsTrigger 
                        value="register" 
                        onClick={() => setIsRegistering(true)}
                        className="text-sm"
                      >
                        Register
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="login" className="space-y-4">
                      <form onSubmit={handleEmailLogin}>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                              <FaEnvelope className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="password">Password</Label>
                              <Button 
                                type="button" 
                                variant="link" 
                                onClick={() => setShowResetPassword(true)}
                                className="p-0 h-auto text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                              >
                                Forgot password?
                              </Button>
                            </div>
                            <div className="relative">
                              <FaLock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="submit"
                              disabled={signingIn}
                              className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                            >
                              {signingIn ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {signingIn ? "Signing in..." : "Sign In"}
                            </Button>
                          </motion.div>
                        </div>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="register" className="space-y-4">
                      <form onSubmit={handleEmailRegister}>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="register-name">Full Name</Label>
                            <div className="relative">
                              <FaUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="register-name"
                                type="text"
                                placeholder="Jane Doe"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="register-email">Email</Label>
                            <div className="relative">
                              <FaEnvelope className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="register-email"
                                type="email"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="register-password">Password</Label>
                            <div className="relative">
                              <FaLock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="register-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Must be at least 6 characters
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="register-confirm">Confirm Password</Label>
                            <div className="relative">
                              <FaLock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="register-confirm"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10"
                                required
                              />
                            </div>
                          </div>
                          
                          <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              type="submit"
                              disabled={signingIn}
                              className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                            >
                              {signingIn ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {signingIn ? "Creating Account..." : "Create Account"}
                            </Button>
                          </motion.div>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>

                  <div className="relative flex items-center justify-center mt-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                    </div>
                    <div className="relative bg-white dark:bg-slate-800 px-4 text-sm text-gray-500 dark:text-gray-400">
                      or
                    </div>
                  </div>
                  
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
                      <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
                      Sign in with Google
                    </Button>
                  </motion.div>
                  
                  <Button
                    variant="link"
                    onClick={() => setShowEmailForm(false)}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Back
                  </Button>
                </div>
              ) : (
                // Main Login Options
                <div className="space-y-4">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => setShowEmailForm(true)}
                      disabled={signingIn}
                      className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                    >
                      <FaEnvelope className="mr-2 h-4 w-4" />
                      Sign in with Email
                    </Button>
                  </motion.div>
                  
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
              )}
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