import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Flower2, Image as ImageIcon, Camera } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { PlantChatMessage } from '@/components/PlantChatMessage';
import { ChatMessage, sendMessage, startChatSession, analyzePlantPhoto } from '@/lib/gemini';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function PlantChat() {
  const { toast } = useToast();
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<{messages: ChatMessage[]} | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "I'm ready to help with your plant care and gardening questions. What would you like to know about today?" }
  ]);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize chat session
  useEffect(() => {
    async function initChat() {
      try {
        const session = await startChatSession();
        setChatSession(session);
      } catch (error) {
        console.error('Error initializing chat:', error);
        toast({
          title: "Connection Error",
          description: "Couldn't connect to the plant advisor. Please check if your Gemini API key is set correctly.",
          variant: "destructive"
        });
      }
    }
    
    initChat();
  }, [toast]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setPhotoFile(file);
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  };
  
  // Handle photo upload and analysis
  const handlePhotoAnalysis = async () => {
    if (!photoFile || !chatSession) return;
    
    setAnalyzingPhoto(true);
    setShowPhotoDialog(false);
    
    // Add a message about the image analysis
    const userImageMessage: ChatMessage = { 
      role: 'user', 
      content: 'I\'m uploading a photo of my plant for analysis. Can you tell me what type of plant this is and provide care instructions?' 
    };
    setMessages(prev => [...prev, userImageMessage]);
    
    // Show loading indicator
    setIsLoading(true);
    
    try {
      // Convert image to base64 for Gemini
      const reader = new FileReader();
      reader.readAsDataURL(photoFile);
      
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          // Analyze the photo
          const analysis = await analyzePlantPhoto(reader.result);
          
          // Create response
          const responseContent = `
Based on the photo you shared, this appears to be a **${analysis.commonName}** (${analysis.species}).

**Health Assessment**: ${analysis.healthAssessment}

**Care Instructions**:
${analysis.careInstructions}

Would you like any specific information about this plant?
          `.trim();
          
          // Add bot response
          const botMessage: ChatMessage = { role: 'model', content: responseContent };
          setMessages(prev => [...prev, botMessage]);
          
          // Clean up
          URL.revokeObjectURL(photoPreview!);
          setPhotoFile(null);
          setPhotoPreview(null);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to process your plant photo",
          variant: "destructive"
        });
        setIsLoading(false);
        setAnalyzingPhoto(false);
      };
      
    } catch (error) {
      console.error('Error analyzing plant photo:', error);
      toast({
        title: "Analysis failed",
        description: "We couldn't analyze your plant photo. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      setAnalyzingPhoto(false);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userMessage.trim() || isLoading || !chatSession) return;
    
    // Add user message to chat
    const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
    setMessages(prev => [...prev, newUserMessage]);
    
    // Clear input and focus
    setUserMessage('');
    setTimeout(() => inputRef.current?.focus(), 0);
    
    // Add loading indicator
    setIsLoading(true);
    
    try {
      // Get response from Gemini
      const response = await sendMessage(chatSession, userMessage);
      
      // Add bot response
      const botMessage: ChatMessage = { role: 'model', content: response };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to get response:', error);
      toast({
        title: "Sorry, something went wrong",
        description: "I couldn't process your request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans transition-colors duration-200 ease-in-out">
        <Header />
        
        <main className="container px-4 py-6 mx-auto">
          <Card className="mx-auto max-w-3xl border dark:border-slate-700">
            <CardHeader className="border-b dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Flower2 className="h-5 w-5 text-green-600" />
                <CardTitle>Plant Care Assistant</CardTitle>
              </div>
              <CardDescription>
                Ask questions about plant care, gardening, and agricultural tips
              </CardDescription>
            </CardHeader>
            
            <CardContent className="p-0">
              {/* Chat Messages Area */}
              <ScrollArea className="h-[450px] p-4">
                <div className="flex flex-col gap-4">
                  {messages.map((message, index) => (
                    <PlantChatMessage 
                      key={index} 
                      message={message} 
                    />
                  ))}
                  
                  {isLoading && (
                    <PlantChatMessage 
                      message={{ role: 'model', content: '' }}
                      isLoading={true}
                    />
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="border-t dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                    onClick={() => setShowPhotoDialog(true)}
                    disabled={isLoading || !chatSession}
                  >
                    <ImageIcon className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Upload</span> Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.capture = "environment";
                        fileInputRef.current.click();
                        setShowPhotoDialog(true);
                      }
                    }}
                    disabled={isLoading || !chatSession}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Take</span> Photo
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                  />
                </div>
                
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Ask about plants, gardening, or crop management..."
                    disabled={isLoading || !chatSession}
                    className="flex-1"
                    autoComplete="off"
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading || !userMessage.trim() || !chatSession}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                {!import.meta.env.VITE_GEMINI_API_KEY && (
                  <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center">
                    <div className="bg-amber-100 dark:bg-amber-900/30 rounded-md p-2 w-full text-center">
                      Please provide a Gemini API key to use the Plant Care Assistant.
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
        
        <footer className="mt-8 border-t border-gray-200 dark:border-gray-700 py-4">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Smart Plant Monitoring System © {new Date().getFullYear()}
          </div>
        </footer>
      </div>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Plant Photo</DialogTitle>
            <DialogDescription>
              Upload a photo of your plant for identification and care advice
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {photoPreview ? (
              <div className="relative w-full h-64 rounded-md overflow-hidden">
                <img 
                  src={photoPreview || ''} 
                  alt="Plant preview" 
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 bg-white dark:bg-black bg-opacity-70 dark:bg-opacity-70"
                  onClick={() => {
                    setPhotoPreview(null);
                    setPhotoFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="flex space-x-4">
                    <div className="flex flex-col items-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                        <ImageIcon className="h-8 w-8 text-green-500" />
                      </div>
                      <span className="text-sm font-medium">Gallery</span>
                    </div>
                    
                    <div className="flex flex-col items-center cursor-pointer" onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.capture = "environment";
                        fileInputRef.current.click();
                      }
                    }}>
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                        <Camera className="h-8 w-8 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">Camera</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    Upload or take a photo of your plant for AI analysis
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPhotoDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePhotoAnalysis}
                disabled={!photoFile || analyzingPhoto}
                className="bg-green-600 hover:bg-green-700 relative"
              >
                {analyzingPhoto && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {analyzingPhoto ? "Analyzing..." : "Analyze Plant"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}