import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Leaf, ImagePlus, Camera, ChevronDown } from 'lucide-react';
import { useTheme } from '@/lib/ThemeProvider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlantChatMessage } from '@/components/PlantChatMessage';
import { ChatMessage, sendMessage, startChatSession, analyzePlantPhoto } from '@/lib/gemini';
import { useDevice } from '@/hooks/use-device';

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ messages: ChatMessage[] }>({ messages: [] });
  const [isSending, setIsSending] = useState(false);
  const [isPhotoMode, setIsPhotoMode] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const { isMobile, deviceType, isMobileDevice } = useDevice();
  
  // Initialize chat when first opened
  useEffect(() => {
    if (isOpen && chatHistory.messages.length === 0) {
      initializeChat();
    }
  }, [isOpen]);
  
  // Scroll to bottom when messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory.messages]);
  
  const initializeChat = async () => {
    try {
      const initialSession = await startChatSession();
      setChatHistory(initialSession);
    } catch (error) {
      console.error("Error initializing chat:", error);
    }
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || isSending) return;
    
    const userMessage: ChatMessage = { role: 'user', content: message };
    setChatHistory(prev => ({
      messages: [...prev.messages, userMessage]
    }));
    setMessage('');
    setIsSending(true);
    
    try {
      const response = await sendMessage(chatHistory, message);
      const botMessage: ChatMessage = { role: 'model', content: response };
      setChatHistory(prev => ({
        messages: [...prev.messages, botMessage]
      }));
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handlePhotoUpload = async () => {
    if (!photoFile || isAnalyzing) return;
    
    setIsAnalyzing(true);
    const userImageMessage: ChatMessage = { 
      role: 'user', 
      content: `I'm uploading a photo of my plant for analysis.` 
    };
    
    setChatHistory(prev => ({
      messages: [...prev.messages, userImageMessage]
    }));
    
    try {
      // Upload photo and get URL (using preview for demo)
      const imageUrl = photoPreview as string;
      
      // Analyze the photo
      const analysis = await analyzePlantPhoto(imageUrl);
      
      // Format response
      const responseContent = `
**Plant Analysis Results**

**Species**: ${analysis.species}
**Common Name**: ${analysis.commonName}
**Health Assessment**: ${analysis.healthAssessment}

**Care Instructions**:
${analysis.careInstructions}

(Confidence: ${analysis.confidence})
      `;
      
      const botMessage: ChatMessage = { role: 'model', content: responseContent };
      setChatHistory(prev => ({
        messages: [...prev.messages, botMessage]
      }));
      
      // Reset photo state
      setPhotoPreview(null);
      setPhotoFile(null);
      setIsPhotoMode(false);
      
    } catch (error) {
      console.error("Error analyzing photo:", error);
      // Add error message to chat
      const errorMessage: ChatMessage = { 
        role: 'model', 
        content: "I'm sorry, there was an error analyzing your plant photo. Please try again." 
      };
      setChatHistory(prev => ({
        messages: [...prev.messages, errorMessage]
      }));
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <>
      {/* Chat Bubble Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center ${
            isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <MessageSquare className="h-6 w-6 text-white" />
          )}
        </Button>
      </motion.div>
      
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed z-40 rounded-lg shadow-xl overflow-hidden ${
              isMobileDevice 
                ? 'bottom-0 left-0 right-0 w-full max-h-[90vh]' 
                : 'bottom-24 right-6 w-[350px] max-w-[calc(100vw-2rem)]'
            }`}
            initial={isMobileDevice 
              ? { opacity: 0, y: 100 } 
              : { opacity: 0, y: 20, scale: 0.95 }
            }
            animate={isMobileDevice 
              ? { opacity: 1, y: 0 } 
              : { opacity: 1, y: 0, scale: 1 }
            }
            exit={isMobileDevice 
              ? { opacity: 0, y: 100 } 
              : { opacity: 0, y: 20, scale: 0.95 }
            }
            transition={{ duration: 0.3 }}
          >
            <div className={`flex flex-col ${
              isMobileDevice 
                ? 'h-[500px] max-h-[80vh] min-h-[300px]' 
                : 'h-[500px] max-h-[70vh]'
            } ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
              {/* Chat Header */}
              <div className="bg-green-500 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-white" />
                  <h3 className="font-medium text-white">Plant Assistant</h3>
                </div>
                <div className="flex items-center">
                  {isMobileDevice && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-white hover:bg-green-600 rounded-full mr-1"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-green-600 rounded-full"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Chat Messages */}
              {(!isMinimized || !isMobileDevice) && (
                <ScrollArea className="flex-1 p-4">
                  <div ref={chatContainerRef} className="space-y-4">
                    {chatHistory.messages.map((msg, index) => (
                      <PlantChatMessage
                        key={index}
                        message={msg}
                        isLoading={isSending && index === chatHistory.messages.length - 1 && msg.role === 'user'}
                      />
                    ))}
                    {isSending && chatHistory.messages.length > 0 && chatHistory.messages[chatHistory.messages.length - 1].role === 'user' && (
                      <PlantChatMessage
                        message={{ role: 'model', content: '' }}
                        isLoading={true}
                      />
                    )}
                  </div>
                </ScrollArea>
              )}
              
              {/* Photo Upload UI - Only show when not minimized */}
              {isPhotoMode && (!isMinimized || !isMobileDevice) && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">{isMobileDevice ? "Take Plant Photo" : "Upload Plant Photo"}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-full"
                      onClick={() => {
                        setIsPhotoMode(false);
                        setPhotoPreview(null);
                        setPhotoFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {photoPreview ? (
                    <div className="relative w-full h-32 mb-2">
                      <img
                        src={photoPreview}
                        alt="Plant preview"
                        className="w-full h-full object-cover rounded-md"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-1 right-1 bg-white dark:bg-black bg-opacity-70 dark:bg-opacity-70"
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
                    <div className="flex gap-2 mb-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <ImagePlus className="h-4 w-4 mr-2" /> Gallery
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.capture = "environment";
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        <Camera className="h-4 w-4 mr-2" /> Camera
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                    </div>
                  )}
                  
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600"
                    disabled={!photoFile || isAnalyzing}
                    onClick={handlePhotoUpload}
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Plant'}
                  </Button>
                </div>
              )}
              
              {/* Chat Input - Show even when minimized on mobile for quick access */}
              {!isPhotoMode && (
                <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={isMinimized && isMobileDevice ? "Type quick question..." : "Ask about your plant..."}
                      className="w-full"
                      disabled={isSending}
                      onFocus={() => {
                        // When focusing input on mobile, expand the chat
                        if (isMobileDevice && isMinimized) {
                          setIsMinimized(false);
                        }
                      }}
                    />
                    {(!isMinimized || !isMobileDevice) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-full"
                        onClick={() => setIsPhotoMode(true)}
                      >
                        <ImagePlus className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600"
                    size="icon"
                    disabled={!message.trim() || isSending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}