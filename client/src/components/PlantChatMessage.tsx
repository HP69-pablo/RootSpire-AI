import { useState, useRef } from "react";
import { ChatMessage } from "@/lib/gemini";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { LucideLoader2, X, Check, Bookmark, Copy, Share2 } from "lucide-react";
import { motion } from "framer-motion";

interface ChatMessageProps {
  message: ChatMessage;
  isLoading?: boolean;
}

export function PlantChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [isSwiped, setIsSwiped] = useState(false);
  const [startX, setStartX] = useState(0);
  const messageRef = useRef<HTMLDivElement>(null);
  
  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isUser) return; // Only allow swiping AI messages
    setStartX(e.touches[0].clientX);
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isUser || !messageRef.current) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    // If swiping left
    if (diff > 30) {
      setIsSwiped(true);
    }
    // If swiping right
    else if (diff < -30) {
      setIsSwiped(false);
    }
  };
  
  // Copy message to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    // Reset swipe state
    setIsSwiped(false);
  };
  
  // Convert markdown-style content to JSX with basic formatting
  const formatContent = (content: string) => {
    // Handle bold text with **
    let formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle newlines
    formattedContent = formattedContent.replace(/\n/g, '<br />');
    
    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
  };
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-10 w-10 shrink-0">
        {isUser ? (
          <>
            <AvatarFallback>U</AvatarFallback>
            <AvatarImage src="/user-avatar.png" alt="User" />
          </>
        ) : (
          <>
            <AvatarFallback className="bg-green-600 text-white">🌱</AvatarFallback>
            <AvatarImage src="/plant-avatar.png" alt="Plant Assistant" />
          </>
        )}
      </Avatar>
      
      {/* Swipable message container for mobile */}
      <div className="relative flex-1 touch-pan-y" ref={messageRef}>
        <motion.div 
          className="relative" 
          animate={{ x: isSwiped ? '-80px' : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          <Card 
            className={`p-4 max-w-[95%] md:max-w-[80%] ${isUser ? 'bg-primary/10 dark:bg-primary/20 ml-auto' : 'bg-muted'}`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <LucideLoader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">
                {formatContent(message.content)}
              </div>
            )}
          </Card>
        </motion.div>
        
        {/* Action buttons that appear when swiped */}
        {!isUser && !isLoading && (
          <motion.div 
            className="absolute top-0 right-0 bottom-0 flex items-center gap-1 px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: isSwiped ? 1 : 0 }}
          >
            <button 
              className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center"
              onClick={copyToClipboard}
            >
              <Copy size={14} />
            </button>
            
            <button 
              className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center"
              onClick={() => setIsSwiped(false)}
            >
              <Check size={14} />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}