import { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Flower2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { PlantChatMessage } from '@/components/PlantChatMessage';
import { ChatMessage, sendMessage, startChatSession } from '@/lib/gemini';

export default function PlantChat() {
  const { toast } = useToast();
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "I'm ready to help with your plant care and gardening questions. What would you like to know about today?" }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
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
          description: "Couldn't connect to the plant advisor. Please try again later.",
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
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
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
  );
}